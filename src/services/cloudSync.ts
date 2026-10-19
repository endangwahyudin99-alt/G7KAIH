import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DailyJournal, User, SchoolProfile, SchoolClass } from '../types';
import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_SCHOOL_PROFILE,
  generateSeedJournals,
  isDummyStudentId,
  isDummyStudent,
} from '../data/seedData';

export type SyncStatus = 'connecting' | 'connected' | 'syncing' | 'error' | 'offline';

export interface CloudSyncState {
  status: SyncStatus;
  lastSyncTime: Date | null;
  syncedJournalsCount: number;
  syncedStudentsCount: number;
  lastUpdatedItem: string | null;
}

export function sanitizeUserForFirestore(user: User): Record<string, any> {
  const clean: Record<string, any> = {
    id: String(user.id || `user-siswa-${Date.now()}`),
    name: String(user.name || 'Siswa').trim(),
    role: user.role || 'siswa',
    avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name || 'siswa')}&backgroundColor=b6e3f4`,
    email: String(user.email || `${user.id}@sdn-gudang2.sch.id`).trim(),
    schoolName: String(user.schoolName || 'SD NEGERI GUDANG 2').trim(),
    classId: String(user.classId || 'class-1a').trim(),
    nisn: String(user.nisn || '').trim(),
    gender: (user.gender === 'P' ? 'P' : 'L') as 'L' | 'P',
    parentName: String(user.parentName || '').trim(),
    parentPhone: String(user.parentPhone || user.phone || '').trim(),
    status: (user.status === 'nonaktif' ? 'nonaktif' : 'aktif') as 'aktif' | 'nonaktif',
    parentConsentApproved: user.parentConsentApproved !== false,
  };
  if (user.phone && String(user.phone).trim()) {
    clean.phone = String(user.phone).trim();
  }
  if (user.childId && String(user.childId).trim()) {
    clean.childId = String(user.childId).trim();
  }
  return clean;
}

type SyncListener = (state: CloudSyncState) => void;

class CloudSyncManager {
  private state: CloudSyncState = {
    status: 'connecting',
    lastSyncTime: null,
    syncedJournalsCount: 0,
    syncedStudentsCount: 0,
    lastUpdatedItem: null,
  };

  private listeners: Set<SyncListener> = new Set();
  private isInitialized = false;
  private unsubscribeJournals: (() => void) | null = null;
  private unsubscribeUsers: (() => void) | null = null;
  private unsubscribeProfile: (() => void) | null = null;

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn({ ...this.state });
      } catch (e) {
        console.error('Error in sync listener', e);
      }
    });
  }

  public getState(): CloudSyncState {
    return { ...this.state };
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.state.status = 'connecting';
    this.notify();

    try {
      // 1. Check & Seed initial data if Firestore is empty
      await this.ensureInitialSeed();

      // 2. Subscribe to real-time journals
      this.subscribeToJournals();

      // 3. Subscribe to real-time users
      this.subscribeToUsers();

      // 4. Subscribe to school profile
      this.subscribeToSchoolProfile();

      this.state.status = 'connected';
      this.state.lastSyncTime = new Date();
      this.notify();
    } catch (error) {
      console.warn('Could not establish initial Firestore sync, falling back to local storage:', error);
      this.state.status = 'offline';
      this.notify();
    }
  }

  private getLocalUsers(): User[] {
    try {
      const raw = localStorage.getItem('g7kaih_users');
      return raw ? JSON.parse(raw) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  private async ensureInitialSeed(): Promise<void> {
    const usersCol = 'users';
    try {
      const snap = await getDocs(collection(db, usersCol));
      const localUsers = this.getLocalUsers();

      if (snap.empty) {
        this.state.status = 'syncing';
        this.notify();

        const batch = writeBatch(db);

        // Seed Users: take current local users (or INITIAL_USERS if completely empty)
        const usersToSeed = localUsers.length > 0 ? localUsers : INITIAL_USERS;
        usersToSeed.forEach((u) => {
          const userRef = doc(db, 'users', u.id);
          batch.set(userRef, sanitizeUserForFirestore(u));
        });

        // Seed Classes
        INITIAL_CLASSES.forEach((c) => {
          const classRef = doc(db, 'classes', c.id);
          batch.set(classRef, c);
        });

        // Seed School Profile
        let profile = INITIAL_SCHOOL_PROFILE;
        try {
          const rawProfile = localStorage.getItem('g7kaih_school_profile');
          if (rawProfile) profile = JSON.parse(rawProfile);
        } catch {
          profile = INITIAL_SCHOOL_PROFILE;
        }
        const profileRef = doc(db, 'school_profile', 'main');
        batch.set(profileRef, { ...profile, id: profile.id || 'main' });

        // Seed sample journals if any
        const seedJournals = generateSeedJournals();
        Object.entries(seedJournals).forEach(([key, journal]) => {
          const journalRef = doc(db, 'journals', key);
          batch.set(journalRef, journal);
        });

        await batch.commit();
        this.state.syncedJournalsCount = Object.keys(seedJournals).length;
        this.state.syncedStudentsCount = usersToSeed.filter((u) => u.role === 'siswa').length;

        // Also save to local storage
        localStorage.setItem('g7kaih_users', JSON.stringify(usersToSeed));
        window.dispatchEvent(
          new CustomEvent('g7kaih_cloud_users_synced', { detail: { count: usersToSeed.length } })
        );
      } else {
        // Cloud already has documents!
        // DO NOT overwrite or drop local real students. Perform an absolute union merge by ID!
        const cloudUsersMap = new Map<string, User>();
        const dummyInCloud: string[] = [];

        snap.forEach((d) => {
          const u = d.data() as User;
          if (u.role === 'siswa' && isDummyStudent(u)) {
            dummyInCloud.push(u.id);
          } else {
            cloudUsersMap.set(u.id, u);
          }
        });

        // Automatically clean dummy students from Cloud Firestore if found
        if (dummyInCloud.length > 0) {
          this.removeMultipleUsers(dummyInCloud).catch(() => {});
        }

        const mergedUsersMap = new Map<string, User>(cloudUsersMap);
        const missingInCloud: User[] = [];

        // Retain ALL real local students that might not yet be in Cloud (ignore dummy)
        localUsers.forEach((localUser) => {
          if (!isDummyStudent(localUser) && !mergedUsersMap.has(localUser.id)) {
            mergedUsersMap.set(localUser.id, localUser);
            missingInCloud.push(localUser);
          }
        });

        const mergedUsersList = Array.from(mergedUsersMap.values());

        // Update local storage with full union
        try {
          localStorage.setItem('g7kaih_users', JSON.stringify(mergedUsersList));
        } catch (e) {
          console.warn('Caching initial cloud users warning:', e);
        }

        // Upload any students that were in local but missing in Cloud Firestore!
        if (missingInCloud.length > 0) {
          try {
            await this.pushUsersBatch(missingInCloud);
          } catch (uploadErr) {
            console.warn('Syncing missing local users to cloud warning:', uploadErr);
          }
        }

        const studentCount = mergedUsersList.filter((u) => u.role === 'siswa').length;
        this.state.syncedStudentsCount = studentCount;

        window.dispatchEvent(
          new CustomEvent('g7kaih_cloud_users_synced', {
            detail: { count: mergedUsersList.length },
          })
        );

        // Pull and cache school profile from Firestore
        try {
          const profileDoc = await getDoc(doc(db, 'school_profile', 'main'));
          if (profileDoc.exists()) {
            const cloudProfile = profileDoc.data() as SchoolProfile;
            localStorage.setItem('g7kaih_school_profile', JSON.stringify(cloudProfile));
            window.dispatchEvent(
              new CustomEvent('g7kaih_cloud_profile_synced', { detail: cloudProfile })
            );
          } else {
            // Push local profile to cloud if cloud is missing it
            let localProfile = INITIAL_SCHOOL_PROFILE;
            try {
              const raw = localStorage.getItem('g7kaih_school_profile');
              if (raw) localProfile = JSON.parse(raw);
            } catch {
              localProfile = INITIAL_SCHOOL_PROFILE;
            }
            await this.pushSchoolProfile(localProfile);
          }
        } catch (profileErr) {
          console.warn('Initial profile sync warning:', profileErr);
        }

        // Pull and cache journals from Firestore
        try {
          const journalsSnap = await getDocs(collection(db, 'journals'));
          if (!journalsSnap.empty) {
            const journalsMap: Record<string, DailyJournal> = {};
            journalsSnap.forEach((d) => {
              journalsMap[d.id] = d.data() as DailyJournal;
            });
            const currentLocal = JSON.parse(localStorage.getItem('g7kaih_journals') || '{}');
            const mergedJournals = { ...currentLocal, ...journalsMap };
            localStorage.setItem('g7kaih_journals', JSON.stringify(mergedJournals));
            this.state.syncedJournalsCount = journalsSnap.size;
            window.dispatchEvent(
              new CustomEvent('g7kaih_cloud_journals_synced', {
                detail: { count: journalsSnap.size, timestamp: Date.now() },
              })
            );
          }
        } catch (journalsErr) {
          console.warn('Initial journals sync warning:', journalsErr);
        }
      }
    } catch (err) {
      console.warn('Initial seed/sync notice:', err);
    }
  }

  private subscribeToJournals(): void {
    const colPath = 'journals';
    try {
      this.unsubscribeJournals = onSnapshot(
        collection(db, colPath),
        (snapshot) => {
          let updatedCount = 0;
          const journalsMap: Record<string, DailyJournal> = {};

          snapshot.forEach((d) => {
            journalsMap[d.id] = d.data() as DailyJournal;
            updatedCount++;
          });

          if (updatedCount > 0) {
            // Merge with local storage
            try {
              const currentLocal = JSON.parse(localStorage.getItem('g7kaih_journals') || '{}');
              const merged = { ...currentLocal, ...journalsMap };
              localStorage.setItem('g7kaih_journals', JSON.stringify(merged));
            } catch (e) {
              console.warn('Failed to merge cloud journals into localStorage', e);
            }

            this.state.syncedJournalsCount = updatedCount;
            this.state.status = 'connected';
            this.state.lastSyncTime = new Date();
            this.notify();

            // Dispatch global event so active views re-render
            window.dispatchEvent(
              new CustomEvent('g7kaih_cloud_journals_synced', {
                detail: { count: updatedCount, timestamp: Date.now() },
              })
            );
          }
        },
        (error) => {
          console.warn('Firestore journals listener notice:', error);
          this.state.status = 'offline';
          this.notify();
        }
      );
    } catch (err) {
      console.warn('Could not establish journals listener:', err);
    }
  }

  private subscribeToUsers(): void {
    const colPath = 'users';
    try {
      this.unsubscribeUsers = onSnapshot(
        collection(db, colPath),
        (snapshot) => {
          const cloudUsersMap = new Map<string, User>();
          const dummyIdsToDelete: string[] = [];
          snapshot.forEach((d) => {
            const u = d.data() as User;
            if (u.role === 'siswa' && isDummyStudent(u)) {
              dummyIdsToDelete.push(u.id);
            } else {
              cloudUsersMap.set(u.id, u);
            }
          });

          if (dummyIdsToDelete.length > 0) {
            this.removeMultipleUsers(dummyIdsToDelete).catch(() => {});
          }

          if (cloudUsersMap.size > 0 || dummyIdsToDelete.length > 0) {
            // Keep real local students that haven't synced to cloud yet
            const localUsers = this.getLocalUsers();
            const mergedUsersMap = new Map<string, User>(cloudUsersMap);
            const missingInCloud: User[] = [];

            localUsers.forEach((lu) => {
              if (!isDummyStudent(lu) && !mergedUsersMap.has(lu.id)) {
                mergedUsersMap.set(lu.id, lu);
                if (lu.role === 'siswa') {
                  missingInCloud.push(lu);
                }
              }
            });

            const mergedUsersList = Array.from(mergedUsersMap.values());

            try {
              localStorage.setItem('g7kaih_users', JSON.stringify(mergedUsersList));
            } catch (e) {
              console.error('Failed to cache users in localStorage', e);
            }

            const studentCount = mergedUsersList.filter((u) => u.role === 'siswa').length;
            this.state.syncedStudentsCount = studentCount;
            this.state.status = 'connected';
            this.state.lastSyncTime = new Date();
            this.notify();

            window.dispatchEvent(
              new CustomEvent('g7kaih_cloud_users_synced', {
                detail: { count: mergedUsersList.length },
              })
            );

            if (missingInCloud.length > 0) {
              this.pushUsersBatch(missingInCloud).catch((err) => {
                console.warn('Background sync of missing local students during snapshot update notice:', err);
              });
            }
          }
        },
        (error) => {
          console.warn('Firestore users listener notice:', error);
        }
      );
    } catch (err) {
      console.warn('Could not establish users listener:', err);
    }
  }

  private subscribeToSchoolProfile(): void {
    const colPath = 'school_profile';
    try {
      this.unsubscribeProfile = onSnapshot(
        collection(db, colPath),
        (snapshot) => {
          snapshot.forEach((d) => {
            if (d.id === 'main') {
              const profile = d.data() as SchoolProfile;
              localStorage.setItem('g7kaih_school_profile', JSON.stringify(profile));
              window.dispatchEvent(
                new CustomEvent('g7kaih_cloud_profile_synced', { detail: profile })
              );
            }
          });
        },
        (error) => {
          console.warn('Firestore school profile listener notice:', error);
        }
      );
    } catch (err) {
      console.warn('Could not establish profile listener:', err);
    }
  }

  // Real-time Push methods (invoked immediately when student, parent, or teacher updates data)
  public async pushJournal(journal: DailyJournal): Promise<void> {
    this.state.status = 'syncing';
    this.state.lastUpdatedItem = `Jurnal ${journal.date}`;
    this.notify();

    try {
      const docRef = doc(db, 'journals', `${journal.studentId}_${journal.date}`);
      // Clean undefined fields completely to guarantee Firestore setDoc never throws
      const payload = JSON.parse(JSON.stringify(journal));
      await setDoc(docRef, payload, { merge: true });
      this.state.status = 'connected';
      this.state.lastSyncTime = new Date();
      this.notify();
    } catch (err) {
      console.warn('Background cloud journal push warning (saved locally):', err);
      this.state.status = 'connected';
      this.notify();
    }
  }

  public async pushUser(user: User): Promise<void> {
    this.state.status = 'syncing';
    this.notify();

    try {
      const sanitized = sanitizeUserForFirestore(user);
      const docRef = doc(db, 'users', sanitized.id);
      await setDoc(docRef, sanitized, { merge: true });
      this.state.status = 'connected';
      this.state.lastSyncTime = new Date();
      this.notify();
    } catch (err) {
      console.warn('Background cloud user push warning (saved locally):', err);
      this.state.status = 'connected';
      this.notify();
    }
  }

  public async pushUsersBatch(users: User[]): Promise<void> {
    if (!users || users.length === 0) return;
    this.state.status = 'syncing';
    this.notify();

    try {
      const CHUNK_SIZE = 400;
      for (let i = 0; i < users.length; i += CHUNK_SIZE) {
        const chunk = users.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((user) => {
          const sanitized = sanitizeUserForFirestore(user);
          const docRef = doc(db, 'users', sanitized.id);
          batch.set(docRef, sanitized, { merge: true });
        });
        await batch.commit();
      }
      this.state.status = 'connected';
      this.state.lastSyncTime = new Date();
      this.notify();
    } catch (err) {
      console.warn('Cloud users batch push notice (saved in local device):', err);
      this.state.status = 'connected';
      this.notify();
    }
  }

  public async removeUser(userId: string): Promise<void> {
    const docPath = `users/${userId}`;
    this.state.status = 'syncing';
    this.notify();

    try {
      const docRef = doc(db, 'users', userId);
      await deleteDoc(docRef);
      this.state.status = 'connected';
      this.state.lastSyncTime = new Date();
      this.notify();
    } catch (err) {
      console.warn('Notice removing user from cloud:', err);
      this.state.status = 'connected';
      this.notify();
    }
  }

  public async removeJournalsForStudents(studentIds: string[]): Promise<void> {
    if (!studentIds || studentIds.length === 0) return;
    const idSet = new Set(studentIds);
    try {
      const snap = await getDocs(collection(db, 'journals'));
      const batch = writeBatch(db);
      let count = 0;
      snap.forEach((d) => {
        const studentId = d.id.split('_')[0];
        if (idSet.has(studentId)) {
          batch.delete(doc(db, 'journals', d.id));
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    } catch (err) {
      console.warn('Notice deleting journals for students from cloud:', err);
    }
  }

  public async removeMultipleUsers(userIds: string[]): Promise<void> {
    if (!userIds || userIds.length === 0) return;
    this.state.status = 'syncing';
    this.notify();

    try {
      const CHUNK_SIZE = 450;
      for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
        const chunk = userIds.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((id) => {
          const docRef = doc(db, 'users', id);
          batch.delete(docRef);
        });
        await batch.commit();
      }

      // Also clean up any journals in Firestore belonging to these students
      await this.removeJournalsForStudents(userIds);

      this.state.status = 'connected';
      this.state.lastSyncTime = new Date();
      this.notify();
    } catch (err) {
      console.warn('Notice deleting multiple users from cloud:', err);
      this.state.status = 'connected';
      this.notify();
    }
  }

  // Force synchronizes all local students & profile to Cloud Firestore permanently
  public async forceSyncAllUsers(overrideUsers?: User[]): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      this.state.status = 'syncing';
      this.notify();

      const users = overrideUsers && overrideUsers.length > 0 ? overrideUsers : this.getLocalUsers();
      if (!users || users.length === 0) {
        return { success: true, count: 0 };
      }

      await this.pushUsersBatch(users);

      // Also ensure school profile is permanently uploaded
      try {
        const rawProfile = localStorage.getItem('g7kaih_school_profile');
        if (rawProfile) {
          const profile = JSON.parse(rawProfile);
          await this.pushSchoolProfile(profile);
        }
      } catch (e) {
        console.warn('Profile sync in forceSync notice:', e);
      }

      const studentCount = users.filter((u) => u.role === 'siswa').length;
      this.state.syncedStudentsCount = studentCount;
      this.state.status = 'connected';
      this.state.lastSyncTime = new Date();
      this.notify();

      return { success: true, count: studentCount };
    } catch (err) {
      this.state.status = 'error';
      this.notify();
      return { success: false, count: 0, error: (err as Error).message };
    }
  }

  public async pushSchoolProfile(profile: SchoolProfile): Promise<void> {
    const docPath = 'school_profile/main';
    this.state.status = 'syncing';
    this.notify();

    try {
      const docRef = doc(db, 'school_profile', 'main');
      const payload: Record<string, any> = {
        id: profile.id || 'main',
        name: profile.name || 'SD NEGERI GUDANG 2',
        npsn: profile.npsn || '20204772',
        address: profile.address || '',
        city: profile.city || '',
        province: profile.province || '',
        phone: profile.phone || '',
        email: profile.email || '',
        website: profile.website || '',
        principalName: profile.principalName || '',
        principalNip: profile.principalNip || '',
        academicYear: profile.academicYear || '2025/2026',
        semester: profile.semester || 'Ganjil',
        gradeLevel: profile.gradeLevel || 'SD',
        logoUrl: profile.logoUrl || '',
      };
      // Clean any undefined values
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
      });

      await setDoc(docRef, payload, { merge: true });
      this.state.status = 'connected';
      this.state.lastSyncTime = new Date();
      this.notify();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  }

  public async cleanCloudData(): Promise<void> {
    try {
      this.state.status = 'syncing';
      this.notify();

      // 1. Delete all journals in Firestore
      const journalsSnap = await getDocs(collection(db, 'journals'));
      if (!journalsSnap.empty) {
        const batch1 = writeBatch(db);
        journalsSnap.forEach((d) => {
          batch1.delete(d.ref);
        });
        await batch1.commit();
      }

      // 2. Safeguard real students: NEVER delete students with role 'siswa'
      const batch2 = writeBatch(db);
      INITIAL_USERS.forEach((u) => {
        batch2.set(doc(db, 'users', u.id), u, { merge: true });
      });
      await batch2.commit();

      // 3. Reset school profile & classes
      const batch3 = writeBatch(db);
      batch3.set(doc(db, 'school_profile', 'main'), INITIAL_SCHOOL_PROFILE);
      INITIAL_CLASSES.forEach((c) => {
        batch3.set(doc(db, 'classes', c.id), c);
      });
      await batch3.commit();

      this.state.syncedJournalsCount = 0;
      this.state.status = 'connected';
      this.state.lastSyncTime = new Date();
      this.notify();
    } catch (err) {
      console.warn('Could not clean Firestore remote data:', err);
    }
  }

  // Force re-fetch of all journals and students from Firestore
  public async refreshAllFromCloud(): Promise<void> {
    this.state.status = 'syncing';
    this.notify();

    try {
      // 1. Fetch users
      const usersSnap = await getDocs(collection(db, 'users'));
      if (!usersSnap.empty) {
        const cloudUsersMap = new Map<string, User>();
        usersSnap.forEach((d) => {
          const u = d.data() as User;
          cloudUsersMap.set(u.id, u);
        });
        const usersList = Array.from(cloudUsersMap.values());
        localStorage.setItem('g7kaih_users', JSON.stringify(usersList));
        this.state.syncedStudentsCount = usersList.filter((u) => u.role === 'siswa').length;
        window.dispatchEvent(
          new CustomEvent('g7kaih_cloud_users_synced', { detail: { count: usersList.length } })
        );
      }

      // 2. Fetch journals
      const journalsSnap = await getDocs(collection(db, 'journals'));
      const journalsMap: Record<string, DailyJournal> = {};
      journalsSnap.forEach((d) => {
        journalsMap[d.id] = d.data() as DailyJournal;
      });
      localStorage.setItem('g7kaih_journals', JSON.stringify(journalsMap));
      this.state.syncedJournalsCount = journalsSnap.size;
      window.dispatchEvent(
        new CustomEvent('g7kaih_cloud_journals_synced', {
          detail: { count: journalsSnap.size, timestamp: Date.now() },
        })
      );

      // 3. Fetch school profile
      const profileDoc = await getDoc(doc(db, 'school_profile', 'main'));
      if (profileDoc.exists()) {
        const cloudProfile = profileDoc.data() as SchoolProfile;
        localStorage.setItem('g7kaih_school_profile', JSON.stringify(cloudProfile));
        window.dispatchEvent(
          new CustomEvent('g7kaih_cloud_profile_synced', { detail: cloudProfile })
        );
      }

      this.state.status = 'connected';
      this.state.lastSyncTime = new Date();
      this.notify();
    } catch (err) {
      console.warn('Manual cloud refresh warning:', err);
      this.state.status = 'connected';
      this.notify();
    }
  }

  public cleanup(): void {
    if (this.unsubscribeJournals) this.unsubscribeJournals();
    if (this.unsubscribeUsers) this.unsubscribeUsers();
    if (this.unsubscribeProfile) this.unsubscribeProfile();
  }
}

export const CloudSyncService = new CloudSyncManager();
