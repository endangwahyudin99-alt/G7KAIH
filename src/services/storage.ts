import * as XLSX from 'xlsx';
import {
  User,
  SchoolClass,
  DailyJournal,
  HabitId,
  HabitItemData,
  TeacherVerification,
  ParentEndorsement,
  ReminderConfig,
  BadgeAchievement,
  SchoolProfile,
  BackupPayload,
  BackupMetadata,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_BADGES,
  INITIAL_SCHOOL_PROFILE,
  generateSeedJournals,
  G7KAIH_HABITS,
  resolveSchoolLogo,
  isDummyStudentId,
  isDummyStudent,
  DUMMY_STUDENT_IDS,
} from '../data/seedData';
import { CloudSyncService } from './cloudSync';

const STORAGE_KEYS = {
  USERS: 'g7kaih_users',
  ACTIVE_USER_ID: 'g7kaih_active_user_id',
  CLASSES: 'g7kaih_classes',
  JOURNALS: 'g7kaih_journals',
  BADGES: 'g7kaih_badges',
  REMINDER_CONFIG: 'g7kaih_reminder_config',
  SCHOOL_PROFILE: 'g7kaih_school_profile',
  PRE_RESTORE_BACKUP: 'g7kaih_pre_restore_backup',
  LAST_BACKUP_TIME: 'g7kaih_last_backup_time',
};

export class StorageService {
  // Initialize storage if empty or clean dummy data
  static init() {
    // Ensure initial storage structures exist safely without wiping student data
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, INITIAL_USERS[0].id);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    }

    // Auto-migration to ensure 12 class teachers (Kelas 1 a - 6 b) exist
    const hasV4Teachers = localStorage.getItem('g7kaih_guru_kelas_v4');
    if (!hasV4Teachers) {
      try {
        const storedUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
        const existingUsers: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
        const studentAndParentUsers = existingUsers.filter(
          (u) => u.role === 'siswa' || u.role === 'orang_tua'
        );
        const updatedUsers: User[] = [...INITIAL_USERS, ...studentAndParentUsers];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
        localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));

        const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
        if (!updatedUsers.some((u) => u.id === activeId)) {
          localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, INITIAL_USERS[0].id);
        }
        localStorage.setItem('g7kaih_guru_kelas_v4', 'true');
      } catch (err) {
        console.warn('Migration to 12 teachers notice:', err);
      }
    }

    // Auto-purge: permanently delete all starter dummy students from local storage & trigger cloud removal
    try {
      const storedUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
      const existingUsers: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      const dummyUsers = existingUsers.filter((u) => isDummyStudent(u));
      if (dummyUsers.length > 0) {
        const dummyIds = dummyUsers.map((u) => u.id);
        const nonDummyUsers = existingUsers.filter((u) => !isDummyStudent(u));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(nonDummyUsers));
        CloudSyncService.removeMultipleUsers(dummyIds).catch(() => {});
        CloudSyncService.removeJournalsForStudents(dummyIds).catch(() => {});
      }
      localStorage.setItem('g7kaih_dummy_students_cleaned_v7', 'true');
    } catch (err) {
      console.warn('Auto dummy cleanup notice:', err);
    }

    if (!localStorage.getItem(STORAGE_KEYS.BADGES)) {
      localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(INITIAL_BADGES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SCHOOL_PROFILE)) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL_PROFILE, JSON.stringify(INITIAL_SCHOOL_PROFILE));
    }
    if (!localStorage.getItem(STORAGE_KEYS.JOURNALS)) {
      localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REMINDER_CONFIG)) {
      const defaultReminder: ReminderConfig = {
        enabled: true,
        time: '20:00',
        notifyChannels: {
          browser: true,
          inAppBanner: true,
        },
      };
      localStorage.setItem(STORAGE_KEYS.REMINDER_CONFIG, JSON.stringify(defaultReminder));
    }

    // Ensure official identity and logo of SD NEGERI GUDANG 2 exists as default if profile is empty
    const currentProfile = this.getSchoolProfile();
    const hasOfficialProfile = localStorage.getItem('g7kaih_official_sdn_gudang_2_v3');
    if (!hasOfficialProfile && (!currentProfile.name || currentProfile.name.trim() === '')) {
      this.saveSchoolProfile(INITIAL_SCHOOL_PROFILE);
      localStorage.setItem('g7kaih_official_sdn_gudang_2_v3', 'true');
    }
    localStorage.setItem('g7kaih_clean_v3', 'true');
  }

  // Clear local device data if requested by user (never wipes Cloud Firestore)
  static clearAllStudentAndSchoolData(): void {
    this.savePreRestoreSnapshot();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, INITIAL_USERS[0].id);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(INITIAL_BADGES));
    localStorage.setItem(STORAGE_KEYS.SCHOOL_PROFILE, JSON.stringify(INITIAL_SCHOOL_PROFILE));
    localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify({}));
    localStorage.setItem('g7kaih_clean_v3', 'true');

    window.dispatchEvent(new CustomEvent('g7kaih_cloud_journals_synced', { detail: { count: 0 } }));
    window.dispatchEvent(new CustomEvent('g7kaih_cloud_users_synced', { detail: { count: INITIAL_USERS.length } }));
  }

  static resetToSeed(): void {
    this.clearAllStudentAndSchoolData();
  }

  // School Profile Management
  static getSchoolProfile(): SchoolProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHOOL_PROFILE);
      const profile = data ? JSON.parse(data) : INITIAL_SCHOOL_PROFILE;
      return {
        ...profile,
        logoUrl: resolveSchoolLogo(profile.logoUrl),
      };
    } catch {
      return {
        ...INITIAL_SCHOOL_PROFILE,
        logoUrl: resolveSchoolLogo(INITIAL_SCHOOL_PROFILE.logoUrl),
      };
    }
  }

  static saveSchoolProfile(profile: SchoolProfile): void {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_PROFILE, JSON.stringify(profile));

    // Also update all users' schoolName to keep synchronized
    const users = this.getUsers();
    users.forEach((u) => {
      u.schoolName = profile.name;
    });
    this.saveUsers(users);
    CloudSyncService.pushSchoolProfile(profile).catch((err) => {
      console.warn('Background cloud profile sync error:', err);
    });

    window.dispatchEvent(
      new CustomEvent('g7kaih_school_profile_updated', { detail: profile })
    );
  }

  // User management
  static getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      const rawUsers: User[] = data ? JSON.parse(data) : INITIAL_USERS;
      return this.deduplicateUsers(rawUsers);
    } catch {
      return INITIAL_USERS;
    }
  }

  static deduplicateUsers(users: User[]): User[] {
    const userMap = new Map<string, User>();
    const nisnMap = new Map<string, string>(); // nisnKey -> userId

    const isPhone = (str?: string) => {
      if (!str) return false;
      const cleaned = str.replace(/[\s\-\+\(\)\.]/g, '');
      return cleaned.length >= 8 && /^\d+$/.test(cleaned);
    };

    users.forEach((u) => {
      if (!u || !u.id) return;
      const trimmedNisn = (u.nisn || '').trim();

      // If NISN is non-empty, check for duplicate record with same NISN in the same class
      if (u.role === 'siswa' && trimmedNisn) {
        const nisnKey = `${trimmedNisn}___${u.classId || ''}`;
        const existingId = nisnMap.get(nisnKey);
        if (existingId && userMap.has(existingId) && existingId !== u.id) {
          // Merge into existing record
          const existing = userMap.get(existingId)!;
          const merged = { ...existing };
          if (u.name && u.name.length > (merged.name || '').length) merged.name = u.name;
          if (u.parentName && (!merged.parentName || isPhone(merged.parentName))) merged.parentName = u.parentName;
          if (u.parentPhone && (!merged.parentPhone || !isPhone(merged.parentPhone))) merged.parentPhone = u.parentPhone;
          userMap.set(existingId, merged);
          return;
        } else {
          nisnMap.set(nisnKey, u.id);
        }
      }

      // Check if user with same id already in userMap
      if (userMap.has(u.id)) {
        const existing = userMap.get(u.id)!;
        userMap.set(u.id, { ...existing, ...u });
      } else {
        userMap.set(u.id, { ...u });
      }
    });

    return Array.from(userMap.values());
  }

  static getActiveUser(): User {
    const users = this.getUsers();
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
    const found = users.find((u) => u.id === activeId);
    return found || users[0] || INITIAL_USERS[0];
  }

  static setActiveUserId(userId: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, userId);
  }

  static saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static addStudent(data: Partial<User>): User {
    const users = this.getUsers();
    const newStudentId = `user-siswa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const schoolProfile = this.getSchoolProfile();
    const classes = this.getClasses();
    const newStudent: User = {
      id: newStudentId,
      name: (data.name || 'Siswa Baru').trim(),
      role: 'siswa',
      avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name || newStudentId)}&backgroundColor=b6e3f4`,
      email: (data.email || '').trim() || `${newStudentId}@sdn-gudang2.sch.id`,
      schoolName: data.schoolName || schoolProfile.name || 'SD NEGERI GUDANG 2',
      classId: data.classId || classes[0]?.id || 'class-1a',
      nisn: (data.nisn || '').trim(),
      gender: data.gender || 'L',
      parentName: (data.parentName || '').trim(),
      parentPhone: (data.parentPhone || '').trim(),
      status: data.status || 'aktif',
      parentConsentApproved: data.parentConsentApproved ?? true,
    };

    users.push(newStudent);
    this.saveUsers(users);
    CloudSyncService.pushUser(newStudent).catch((err) => {
      console.warn('Background cloud user sync error:', err);
    });
    window.dispatchEvent(
      new CustomEvent('g7kaih_cloud_users_synced', { detail: { count: users.length } })
    );
    return newStudent;
  }

  static updateStudent(updated: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === updated.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updated };
      this.saveUsers(users);
      CloudSyncService.pushUser(users[index]).catch((err) => {
        console.warn('Background cloud user sync error:', err);
      });
      window.dispatchEvent(
        new CustomEvent('g7kaih_cloud_users_synced', { detail: { count: users.length } })
      );
    }
  }

  static updateUser(updated: User): void {
    this.updateStudent(updated);
  }

  static getActiveUserId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID) || '';
  }

  static deleteStudent(studentId: string): void {
    const users = this.getUsers().filter((u) => u.id !== studentId);
    this.saveUsers(users);
    CloudSyncService.removeUser(studentId).catch((err) => {
      console.warn('Background cloud user remove error:', err);
    });

    // If active user is the deleted student, fallback to first user
    const activeId = this.getActiveUserId();
    if (activeId === studentId && users.length > 0) {
      this.setActiveUserId(users[0].id);
    }

    // Also remove student's journals if any
    const journals = this.getJournals();
    const updatedJournals: Record<string, DailyJournal> = {};
    Object.keys(journals).forEach((key) => {
      if (!key.startsWith(`${studentId}_`)) {
        updatedJournals[key] = journals[key];
      }
    });
    this.saveJournals(updatedJournals);
  }

  static deleteMultipleStudents(studentIds: string[]): void {
    const idSet = new Set(studentIds);
    const users = this.getUsers().filter((u) => !idSet.has(u.id));
    this.saveUsers(users);

    CloudSyncService.removeMultipleUsers(studentIds).catch((err) => {
      console.warn('Background cloud users remove error:', err);
    });

    const activeId = this.getActiveUserId();
    if (idSet.has(activeId) && users.length > 0) {
      this.setActiveUserId(users[0].id);
    }

    const journals = this.getJournals();
    const updatedJournals: Record<string, DailyJournal> = {};
    Object.keys(journals).forEach((key) => {
      const studentId = key.split('_')[0];
      if (!idSet.has(studentId)) {
        updatedJournals[key] = journals[key];
      }
    });
    this.saveJournals(updatedJournals);
  }

  static isDummyStudent(user: User): boolean {
    return isDummyStudent(user);
  }

  static getDummyStudents(): User[] {
    return this.getUsers().filter((u) => this.isDummyStudent(u));
  }

  static deleteDummyStudents(): { count: number; deletedIds: string[]; deletedNames: string[] } {
    const users = this.getUsers();
    const dummyUsers = users.filter((u) => this.isDummyStudent(u));
    const dummyIds = dummyUsers.map((u) => u.id);
    const dummyNames = dummyUsers.map((u) => u.name);
    if (dummyIds.length > 0) {
      this.deleteMultipleStudents(dummyIds);
    }
    return { count: dummyIds.length, deletedIds: dummyIds, deletedNames: dummyNames };
  }

  static normalizeClassId(
    input: string | undefined | null,
    classes: SchoolClass[],
    defaultClassId: string = 'class-1a'
  ): string {
    if (!input) return defaultClassId;
    const raw = String(input).trim();
    if (!raw) return defaultClassId;

    // 1. Direct match by class id (case-insensitive)
    const byId = classes.find((c) => c.id.toLowerCase() === raw.toLowerCase());
    if (byId) return byId.id;

    // 2. Direct match by class name (e.g. 'Kelas 1 a', 'Kelas 1a')
    const cleanRaw = raw.toLowerCase().replace(/\s+/g, '');
    const byName = classes.find(
      (c) => c.name.toLowerCase().replace(/\s+/g, '') === cleanRaw
    );
    if (byName) return byName.id;

    // 3. Extract alphanumeric code (e.g. '1a', '1b', '2a' ... '6b')
    const cleanAlpha = raw
      .toLowerCase()
      .replace(/kelas|rombel|sd|smp|sma/g, '')
      .replace(/[^0-9a-z]/g, '');

    if (cleanAlpha) {
      const byCode = classes.find((c) => {
        const code = c.id.replace('class-', '');
        return code === cleanAlpha;
      });
      if (byCode) return byCode.id;

      for (const c of classes) {
        const code = c.id.replace('class-', '');
        if (cleanAlpha.includes(code)) return c.id;
      }
    }

    return defaultClassId;
  }

  static downloadStudentTemplateExcel(): void {
    const classes = this.getClasses();

    // Sheet 1: Template Siswa
    const headers = [
      'NISN',
      'Nama_Lengkap',
      'Jenis_Kelamin(L/P)',
      'Kelas(1a/1b/2a/2b/3a/3b/4a/4b/5a/5b/6a/6b)',
      'Nama_Orang_Tua',
      'No_HP_Orang_Tua',
      'Email_Siswa',
      'Status(aktif/nonaktif)',
    ];

    const sampleRows = [
      [
        '0129482701',
        'Ahmad Fauzi Pratama',
        'L',
        '1a',
        'Bapak Hasan Fauzi',
        '081234567891',
        'ahmad.fauzi@sdn-gudang2.sch.id',
        'aktif',
      ],
      [
        '0129482702',
        'Aisyah Azzahra Putri',
        'P',
        '1a',
        'Ibu Siti Fatimah',
        '081234567892',
        'aisyah.z@sdn-gudang2.sch.id',
        'aktif',
      ],
      [
        '0129482703',
        'Budi Santoso Nugraha',
        'L',
        '1b',
        'Bapak Agus Santoso',
        '081234567893',
        'budi.s@sdn-gudang2.sch.id',
        'aktif',
      ],
      [
        '0129482704',
        'Citra Kirana Dewi',
        'P',
        '2a',
        'Ibu Rina Marlina',
        '081234567894',
        'citra.k@sdn-gudang2.sch.id',
        'aktif',
      ],
      [
        '0129482705',
        'Daffa Rizky Maulana',
        'L',
        '6b',
        'Bapak Bambang Pratama',
        '081234567895',
        'daffa.r@sdn-gudang2.sch.id',
        'aktif',
      ],
    ];

    const wsStudents = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    wsStudents['!cols'] = [
      { wch: 16 }, // NISN
      { wch: 28 }, // Nama
      { wch: 18 }, // Gender
      { wch: 38 }, // Kelas
      { wch: 25 }, // Ortu
      { wch: 18 }, // HP
      { wch: 32 }, // Email
      { wch: 15 }, // Status
    ];

    // Sheet 2: Panduan Rombel & Guru Kelas Penanggung Jawab
    const guideHeaders = [
      'No',
      'Nama Rombongan Belajar',
      'Kode Penulisan Kelas',
      'Nama Guru / Wali Kelas',
    ];
    const guideRows = classes.map((c, idx) => [
      idx + 1,
      c.name,
      c.id.replace('class-', ''),
      c.homeroomTeacherName,
    ]);

    const wsGuide = XLSX.utils.aoa_to_sheet([guideHeaders, ...guideRows]);
    wsGuide['!cols'] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 22 },
      { wch: 35 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, wsStudents, 'Template Siswa');
    XLSX.utils.book_append_sheet(workbook, wsGuide, 'Panduan Guru Kelas');
    XLSX.writeFile(workbook, 'Template_Impor_Siswa_G7KAIH_SDN_GUDANG_2.xlsx');
  }

  static downloadStudentTemplateCSV(): void {
    this.downloadStudentTemplateExcel();
  }

  static exportStudentsRosterExcel(classId?: string): void {
    const allUsers = this.getUsers().filter((u) => u.role === 'siswa');
    const students = classId && classId !== 'all' ? allUsers.filter((u) => u.classId === classId) : allUsers;
    const classes = this.getClasses();

    const headers = [
      'No',
      'NISN',
      'Nama Lengkap',
      'Jenis Kelamin',
      'Kelas',
      'Guru / Wali Kelas',
      'Email Siswa',
      'Nama Orang Tua',
      'No HP Orang Tua',
      'Status',
      'Persetujuan Ortu',
    ];

    const rows: (string | number)[][] = [headers];
    students.forEach((s, idx) => {
      const cls = classes.find((c) => c.id === s.classId);
      rows.push([
        idx + 1,
        s.nisn || '-',
        s.name,
        s.gender === 'P' ? 'Perempuan' : 'Laki-laki',
        cls?.name || s.classId || '-',
        cls?.homeroomTeacherName || '-',
        s.email,
        s.parentName || '-',
        s.parentPhone || '-',
        s.status || 'aktif',
        s.parentConsentApproved ? 'Disetujui' : 'Belum',
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 6 },  // No
      { wch: 16 }, // NISN
      { wch: 28 }, // Nama
      { wch: 15 }, // Gender
      { wch: 14 }, // Kelas
      { wch: 30 }, // Guru
      { wch: 30 }, // Email
      { wch: 25 }, // Ortu
      { wch: 18 }, // No HP
      { wch: 12 }, // Status
      { wch: 16 }, // Izin
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
    XLSX.writeFile(workbook, `Data_Siswa_G7KAIH_${classId || 'Semua_Kelas'}.xlsx`);
  }

  static exportStudentsRosterCSV(classId?: string): void {
    this.exportStudentsRosterExcel(classId);
  }

  static importStudentsFromRows(
    rows: any[][],
    defaultClassId: string = 'class-1a'
  ): { successCount: number; errors: string[]; classBreakdown: Record<string, number> } {
    const errors: string[] = [];
    const classBreakdown: Record<string, number> = {};

    if (!rows || rows.length <= 1) {
      return { successCount: 0, errors: ['Berkas Excel kosong atau hanya berisi baris judul.'], classBreakdown };
    }

    const classes = this.getClasses();
    const currentUsers = this.getUsers();
    let successCount = 0;
    const syncedUsers: User[] = [];

    // Detect column header mappings dynamically
    let colIdx = {
      nisn: -1,
      name: -1,
      gender: -1,
      classId: -1,
      email: -1,
      parentName: -1,
      parentPhone: -1,
      status: -1,
    };

    const headerRow = (rows[0] || []).map((h) => String(h || '').toLowerCase().trim());
    headerRow.forEach((h, idx) => {
      if (h.includes('nisn') || h.includes('induk')) colIdx.nisn = idx;
      // Phone number MUST be checked before parent/ortu, because "No. HP Orang Tua" contains "orang tua"!
      else if (h.includes('hp') || h.includes('telp') || h.includes('wa') || h.includes('kontak') || h.includes('telepon') || h.includes('ponsel')) colIdx.parentPhone = idx;
      else if (h.includes('nama') && !h.includes('ortu') && !h.includes('orang') && !h.includes('wali')) colIdx.name = idx;
      else if (h.includes('kelamin') || h.includes('gender') || h === 'jk') colIdx.gender = idx;
      else if (h.includes('kelas') || h.includes('rombel') || h.includes('class')) colIdx.classId = idx;
      else if (h.includes('email') || h.includes('surel')) colIdx.email = idx;
      else if (h.includes('ortu') || h.includes('orang') || h.includes('wali') || h.includes('ayah') || h.includes('ibu')) colIdx.parentName = idx;
      else if (h.includes('status')) colIdx.status = idx;
    });

    // Fallback if headers were not labeled standardly
    if (colIdx.name === -1) {
      colIdx = {
        nisn: 0,
        name: 1,
        gender: 2,
        classId: 3,
        email: 4,
        parentName: 5,
        parentPhone: 6,
        status: 7,
      };
    }

    const schoolProfile = this.getSchoolProfile();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const getVal = (idx: number) =>
        idx !== -1 && row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : '';

      const nisn = getVal(colIdx.nisn);
      const name = getVal(colIdx.name);
      const genderRaw = getVal(colIdx.gender);
      const rawClass = getVal(colIdx.classId);
      const email = getVal(colIdx.email);
      let parentName = getVal(colIdx.parentName);
      let parentPhone = getVal(colIdx.parentPhone);
      const statusRaw = getVal(colIdx.status);

      const isPhoneLike = (str: string) => {
        if (!str) return false;
        const cleaned = str.replace(/[\s\-\+\(\)\.]/g, '');
        return cleaned.length >= 8 && /^\d+$/.test(cleaned);
      };

      // Auto-correct if a phone number was accidentally captured in parentName
      if (isPhoneLike(parentName) && !parentPhone) {
        parentPhone = parentName;
        parentName = '';
      } else if (isPhoneLike(parentName) && !isPhoneLike(parentPhone) && parentPhone) {
        const tmp = parentName;
        parentName = parentPhone;
        parentPhone = tmp;
      }

      if (!name || name.length < 2) {
        // Skip empty rows silently or add error only if row has partial content
        if (nisn || rawClass || parentName || parentPhone) {
          errors.push(`Baris ${i + 1}: Nama siswa tidak boleh kosong.`);
        }
        continue;
      }

      // Normalized target class ID (e.g. 'class-1a')
      const classId = this.normalizeClassId(rawClass, classes, defaultClassId);
      const gender = genderRaw.toUpperCase() === 'P' || genderRaw.toLowerCase().includes('perempuan') ? 'P' : 'L';
      const status = statusRaw.toLowerCase() === 'nonaktif' ? 'nonaktif' : 'aktif';

      // Check if NISN or (name + classId) already exists to prevent duplicate students
      const existing = currentUsers.find(
        (u) =>
          u.role === 'siswa' &&
          ((nisn && u.nisn && u.nisn === nisn) ||
           (!nisn && !u.nisn && u.name.toLowerCase().trim() === name.toLowerCase().trim() && u.classId === classId))
      );

      if (existing) {
        existing.name = name;
        existing.gender = gender;
        existing.classId = classId;
        if (email) existing.email = email;
        if (parentName) existing.parentName = parentName;
        if (parentPhone) existing.parentPhone = parentPhone;
        existing.status = status;
        syncedUsers.push(existing);
        successCount++;
        classBreakdown[classId] = (classBreakdown[classId] || 0) + 1;
      } else {
        const newId = `user-siswa-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
        const newStudent: User = {
          id: newId,
          name,
          role: 'siswa',
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`,
          email: email || `${newId}@sdn-gudang2.sch.id`,
          schoolName: schoolProfile.name || '',
          classId,
          nisn,
          gender,
          parentName,
          parentPhone,
          status,
          parentConsentApproved: true,
        };
        currentUsers.push(newStudent);
        syncedUsers.push(newStudent);
        successCount++;
        classBreakdown[classId] = (classBreakdown[classId] || 0) + 1;
      }
    }

    if (successCount > 0) {
      this.saveUsers(currentUsers);
      CloudSyncService.pushUsersBatch(syncedUsers).catch((err) => {
        console.warn('Background sync error importing students:', err);
      });
      window.dispatchEvent(
        new CustomEvent('g7kaih_cloud_users_synced', { detail: { count: currentUsers.length } })
      );
    }

    return { successCount, errors, classBreakdown };
  }

  static importStudentsFromCSV(
    csvText: string,
    defaultClassId: string = 'class-1a'
  ): { successCount: number; errors: string[]; classBreakdown: Record<string, number> } {
    const lines = csvText
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const rows: string[][] = lines.map((line) => {
      const separator = line.includes(';') ? ';' : ',';
      return line.split(separator).map((item) => item.replace(/^["']|["']$/g, '').trim());
    });

    return this.importStudentsFromRows(rows, defaultClassId);
  }

  static bulkUpdateStudentClass(studentIds: string[], targetClassId: string): void {
    const idSet = new Set(studentIds);
    const users = this.getUsers();
    const updatedStudents: User[] = [];

    users.forEach((u) => {
      if (idSet.has(u.id) && u.role === 'siswa') {
        u.classId = targetClassId;
        updatedStudents.push(u);
      }
    });

    this.saveUsers(users);

    if (updatedStudents.length > 0) {
      CloudSyncService.pushUsersBatch(updatedStudents).catch((err) => {
        console.warn('Background sync error bulk remap:', err);
      });
      window.dispatchEvent(
        new CustomEvent('g7kaih_cloud_users_synced', { detail: { count: users.length } })
      );
    }
  }

  static getStudentsByClass(classId: string): User[] {
    return this.getUsers().filter((u) => u.role === 'siswa' && u.classId === classId);
  }

  static getClasses(): SchoolClass[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      const classes: SchoolClass[] = data ? JSON.parse(data) : INITIAL_CLASSES;
      const users = this.getUsers();
      // Dynamically calculate totalStudents for each class to guarantee it's always accurate
      return classes.map((cls) => {
        const studentCount = users.filter((u) => u.role === 'siswa' && u.classId === cls.id).length;
        return {
          ...cls,
          totalStudents: studentCount,
        };
      });
    } catch {
      return INITIAL_CLASSES;
    }
  }

  // Journal management
  static getJournals(): Record<string, DailyJournal> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOURNALS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  static saveJournals(journals: Record<string, DailyJournal>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(journals));
    } catch (e) {
      console.warn('LocalStorage quota reached when saving journals, pruning older cache:', e);
      try {
        const keys = Object.keys(journals);
        if (keys.length > 30) {
          const sortedKeys = keys.sort();
          const keepKeys = sortedKeys.slice(keys.length - 25);
          const trimmed: Record<string, DailyJournal> = {};
          keepKeys.forEach((k) => {
            trimmed[k] = journals[k];
          });
          localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(trimmed));
        }
      } catch (err2) {
        console.warn('Fallback save failed:', err2);
      }
    }
  }

  static getJournalKey(studentId: string, date: string): string {
    return `${studentId}_${date}`;
  }

  static getOrCreateJournal(studentId: string, date: string): DailyJournal {
    const journals = this.getJournals();
    const key = this.getJournalKey(studentId, date);

    if (journals[key]) {
      return journals[key];
    }

    // Create empty default journal
    const emptyHabits = {} as Record<HabitId, HabitItemData>;
    G7KAIH_HABITS.forEach((h) => {
      emptyHabits[h.id] = {
        habitId: h.id,
        completed: false,
        photos: [],
      };
    });

    const newJournal: DailyJournal = {
      id: `journal-${studentId}-${date}`,
      studentId,
      date,
      habits: emptyHabits,
      teacherVerification: {
        status: 'pending',
      },
      parentEndorsement: {
        endorsed: false,
      },
      totalPoints: 0,
      completedHabitsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    journals[key] = newJournal;
    this.saveJournals(journals);
    return newJournal;
  }

  static saveHabitEntry(
    studentId: string,
    date: string,
    habitId: HabitId,
    habitData: HabitItemData
  ): DailyJournal {
    const journal = this.getOrCreateJournal(studentId, date);
    journal.habits[habitId] = habitData;
    journal.updatedAt = new Date().toISOString();

    // Recalculate stats
    let completedCount = 0;
    let points = 0;

    G7KAIH_HABITS.forEach((h) => {
      const entry = journal.habits[h.id];
      if (entry && entry.completed) {
        completedCount++;
        points += h.points;
      }
    });

    // Bonus 20 points if all 7 habits are completed!
    if (completedCount === 7) {
      points += 20;
    }

    journal.completedHabitsCount = completedCount;
    journal.totalPoints = points;

    const journals = this.getJournals();
    journals[this.getJournalKey(studentId, date)] = journal;
    this.saveJournals(journals);
    CloudSyncService.pushJournal(journal).catch((err) => {
      console.warn('Background cloud journal sync error:', err);
    });

    return journal;
  }

  static verifyJournalByTeacher(
    studentId: string,
    date: string,
    verification: TeacherVerification
  ): DailyJournal {
    const journal = this.getOrCreateJournal(studentId, date);
    journal.teacherVerification = {
      ...journal.teacherVerification,
      ...verification,
    };
    journal.updatedAt = new Date().toISOString();

    const journals = this.getJournals();
    journals[this.getJournalKey(studentId, date)] = journal;
    this.saveJournals(journals);
    CloudSyncService.pushJournal(journal).catch((err) => {
      console.warn('Background cloud verification sync error:', err);
    });

    return journal;
  }

  static endorseJournalByParent(
    studentId: string,
    date: string,
    endorsement: ParentEndorsement
  ): DailyJournal {
    const journal = this.getOrCreateJournal(studentId, date);
    journal.parentEndorsement = {
      ...journal.parentEndorsement,
      ...endorsement,
    };
    journal.updatedAt = new Date().toISOString();

    const journals = this.getJournals();
    journals[this.getJournalKey(studentId, date)] = journal;
    this.saveJournals(journals);
    CloudSyncService.pushJournal(journal).catch((err) => {
      console.warn('Background cloud endorsement sync error:', err);
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('g7kaih_cloud_journals_synced', {
          detail: { studentId, date, action: 'endorse' },
        })
      );
    }

    return journal;
  }

  static cancelParentEndorsement(studentId: string, date: string): DailyJournal {
    const journalKey = this.getJournalKey(studentId, date);
    const journals = this.getJournals();
    
    // Retrieve journal or initialize if needed
    const journal = journals[journalKey] || this.getOrCreateJournal(studentId, date);
    
    journal.parentEndorsement = {
      endorsed: false,
      endorsedByParentId: '',
      parentName: '',
      endorsedAt: '',
      parentNotes: '',
      signatureStamp: '',
    };
    journal.updatedAt = new Date().toISOString();

    journals[journalKey] = journal;
    const altKey = `journal-${studentId}-${date}`;
    journals[altKey] = journal;

    // Ensure any variant keys for this student and date are also updated
    Object.keys(journals).forEach((k) => {
      const item = journals[k];
      if (item && item.studentId === studentId && item.date === date) {
        journals[k] = journal;
      }
    });

    this.saveJournals(journals);

    CloudSyncService.pushJournal(journal).catch((err) => {
      console.warn('Background cloud cancel endorsement sync error:', err);
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('g7kaih_cloud_journals_synced', {
          detail: { studentId, date, action: 'cancel_endorsement', journal },
        })
      );
    }

    return journal;
  }

  // Calculate Student Streak
  static getStudentStreak(studentId: string): number {
    const journals = this.getJournals();
    let streak = 0;
    const now = new Date();

    // Check consecutive days backward from today
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const journal = journals[this.getJournalKey(studentId, dateStr)];

      if (journal && journal.completedHabitsCount >= 5) {
        streak++;
      } else if (i === 0) {
        // Today might still be in progress, check yesterday
        continue;
      } else {
        break;
      }
    }
    return Math.max(streak, 1);
  }

  // Reminder Config
  static getReminderConfig(): ReminderConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REMINDER_CONFIG);
      return data
        ? JSON.parse(data)
        : {
            enabled: true,
            time: '20:00',
            notifyChannels: { browser: true, inAppBanner: true },
          };
    } catch {
      return {
        enabled: true,
        time: '20:00',
        notifyChannels: { browser: true, inAppBanner: true },
      };
    }
  }

  static saveReminderConfig(config: ReminderConfig): void {
    localStorage.setItem(STORAGE_KEYS.REMINDER_CONFIG, JSON.stringify(config));
  }

  // Badges
  static getBadges(): BadgeAchievement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BADGES);
      return data ? JSON.parse(data) : INITIAL_BADGES;
    } catch {
      return INITIAL_BADGES;
    }
  }

  // Export to Excel (.xlsx)
  static exportJournalToExcel(classId: string, monthName: string = 'Oktober 2026'): void {
    const students = this.getStudentsByClass(classId);
    const journals = this.getJournals();
    
    const headers = [
      'No',
      'NISN',
      'Nama Siswa',
      'Tanggal',
      'Bangun Pagi',
      'Beribadah',
      'Berolahraga',
      'Makan Sehat',
      'Gemar Belajar',
      'Bermasyarakat',
      'Tidur Cepat',
      'Total Selesai',
      'Poin',
      'Status Verifikasi Guru',
      'Catatan Guru',
      'Paraf Orang Tua',
    ];

    const rows: (string | number)[][] = [headers];
    let counter = 1;

    students.forEach((student) => {
      Object.values(journals || {})
        .filter((j) => j && j.studentId === student.id)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .forEach((j) => {
          if (!j || !j.habits) return;
          rows.push([
            counter++,
            student.nisn || '-',
            student.name,
            j.date,
            j.habits.bangun_pagi?.completed ? 'Ya' : 'Tidak',
            j.habits.beribadah?.completed ? 'Ya' : 'Tidak',
            j.habits.berolahraga?.completed ? 'Ya' : 'Tidak',
            j.habits.makan_sehat?.completed ? 'Ya' : 'Tidak',
            j.habits.gemar_belajar?.completed ? 'Ya' : 'Tidak',
            j.habits.bermasyarakat?.completed ? 'Ya' : 'Tidak',
            j.habits.tidur_cepat?.completed ? 'Ya' : 'Tidak',
            `${j.completedHabitsCount}/7`,
            j.totalPoints,
            j.teacherVerification.status === 'verified'
              ? 'Terverifikasi'
              : j.teacherVerification.status === 'needs_revision'
              ? 'Perlu Revisi'
              : 'Menunggu',
            j.teacherVerification.teacherComment || '-',
            j.parentEndorsement?.endorsed ? 'Sudah Diparaf' : 'Belum Diparaf',
          ]);
        });
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 6 },  // No
      { wch: 15 }, // NISN
      { wch: 25 }, // Nama
      { wch: 14 }, // Tanggal
      { wch: 14 }, // Bangun
      { wch: 14 }, // Ibadah
      { wch: 14 }, // Olahraga
      { wch: 14 }, // Makan
      { wch: 14 }, // Belajar
      { wch: 14 }, // Sosial
      { wch: 14 }, // Tidur
      { wch: 14 }, // Total Selesai
      { wch: 10 }, // Poin
      { wch: 18 }, // Status Guru
      { wch: 30 }, // Catatan Guru
      { wch: 16 }, // Paraf Ortu
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Jurnal G7KAIH');
    XLSX.writeFile(workbook, `Rekap_Jurnal_G7KAIH_${classId}_${monthName.replace(/\s+/g, '_')}.xlsx`);
  }

  static exportToCSV(classId: string, monthName: string = 'Oktober 2026'): void {
    this.exportJournalToExcel(classId, monthName);
  }

  // ==========================================
  // PENCADANGAN & PEMULIHAN DATA (BACKUP & RESTORE)
  // ==========================================

  static getLastBackupTime(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_TIME);
  }

  static getStorageStatistics(): {
    totalKb: number;
    userCount: number;
    studentCount: number;
    teacherCount: number;
    classCount: number;
    journalCount: number;
    photoCount: number;
    lastBackupTime: string | null;
  } {
    const users = this.getUsers();
    const classes = this.getClasses();
    const journals = this.getJournals();
    const studentCount = users.filter((u) => u.role === 'siswa').length;
    const teacherCount = users.filter((u) => u.role === 'guru').length;
    const journalCount = Object.keys(journals).length;

    let photoCount = 0;
    Object.values(journals || {}).forEach((j) => {
      if (j && j.habits && typeof j.habits === 'object') {
        Object.values(j.habits).forEach((h) => {
          if (h && h.photos && Array.isArray(h.photos)) {
            photoCount += h.photos.length;
          }
        });
      }
    });

    // Calculate approximate local storage footprint
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('g7kaih_')) {
        const value = localStorage.getItem(key);
        if (value) {
          totalBytes += (key.length + value.length) * 2; // UTF-16
        }
      }
    }
    const totalKb = Math.round((totalBytes / 1024) * 10) / 10;

    return {
      totalKb,
      userCount: users.length,
      studentCount,
      teacherCount,
      classCount: classes.length,
      journalCount,
      photoCount,
      lastBackupTime: this.getLastBackupTime(),
    };
  }

  static createBackupPayload(exportedBy?: User): BackupPayload {
    const activeUser = exportedBy || this.getActiveUser();
    const users = this.getUsers();
    const classes = this.getClasses();
    const journals = this.getJournals();
    const badges = this.getBadges();
    const schoolProfile = this.getSchoolProfile();
    const reminderConfig = this.getReminderConfig();

    let totalPhotos = 0;
    Object.values(journals || {}).forEach((j) => {
      if (j && j.habits && typeof j.habits === 'object') {
        Object.values(j.habits).forEach((h) => {
          if (h && h.photos && Array.isArray(h.photos)) {
            totalPhotos += h.photos.length;
          }
        });
      }
    });

    const metadata: BackupMetadata = {
      appName: 'Jurnal G7KAIH - 7 Kebiasaan Anak Indonesia Hebat',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: activeUser.id,
        name: activeUser.name,
        role: activeUser.role,
      },
      schoolProfile,
      stats: {
        totalUsers: users.length,
        totalStudents: users.filter((u) => u.role === 'siswa').length,
        totalTeachers: users.filter((u) => u.role === 'guru').length,
        totalClasses: classes.length,
        totalJournals: Object.keys(journals).length,
        totalPhotos,
      },
    };

    return {
      metadata,
      users,
      classes,
      journals,
      badges,
      schoolProfile,
      reminderConfig,
    };
  }

  static downloadBackupFile(exportedBy?: User): string {
    const payload = this.createBackupPayload(exportedBy);
    const schoolNameSlug = (payload.schoolProfile.name || 'G7KAIH')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `Backup_G7KAIH_${schoolNameSlug}_${dateStr}.json`;

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Save timestamp of this backup
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_TIME, new Date().toISOString());

    return fileName;
  }

  static validateBackupJson(jsonString: string): {
    valid: boolean;
    error?: string;
    data?: BackupPayload;
  } {
    try {
      if (!jsonString || typeof jsonString !== 'string' || !jsonString.trim()) {
        return { valid: false, error: 'Berkas JSON kosong atau tidak dapat dibaca.' };
      }

      const parsed = JSON.parse(jsonString);

      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'Format berkas tidak valid (bukan objek JSON).' };
      }

      // Check whether it is a valid G7KAIH backup
      if (!parsed.users || !Array.isArray(parsed.users)) {
        return { valid: false, error: 'Berkas cadangan tidak memiliki daftar pengguna (users).' };
      }

      if (!parsed.journals || typeof parsed.journals !== 'object') {
        return { valid: false, error: 'Berkas cadangan tidak memiliki data jurnal harian (journals).' };
      }

      // Ensure minimal structure
      const classes = Array.isArray(parsed.classes) ? parsed.classes : INITIAL_CLASSES;
      const schoolProfile = parsed.schoolProfile || parsed.metadata?.schoolProfile || INITIAL_SCHOOL_PROFILE;

      const validPayload: BackupPayload = {
        metadata: parsed.metadata || {
          appName: 'Jurnal G7KAIH',
          version: '1.0',
          exportedAt: new Date().toISOString(),
          exportedBy: { id: 'unknown', name: 'Cadangan Eksternal', role: 'admin' },
          schoolProfile,
          stats: {
            totalUsers: parsed.users.length,
            totalStudents: parsed.users.filter((u: any) => u.role === 'siswa').length,
            totalTeachers: parsed.users.filter((u: any) => u.role === 'guru').length,
            totalClasses: classes.length,
            totalJournals: Object.keys(parsed.journals).length,
            totalPhotos: 0,
          },
        },
        users: parsed.users,
        classes,
        journals: parsed.journals,
        badges: Array.isArray(parsed.badges) ? parsed.badges : undefined,
        schoolProfile,
        reminderConfig: parsed.reminderConfig,
      };

      return { valid: true, data: validPayload };
    } catch (err: any) {
      return {
        valid: false,
        error: `Gagal membaca format JSON: ${err?.message || 'Sintaks tidak valid.'}`,
      };
    }
  }

  static savePreRestoreSnapshot(): void {
    const currentPayload = this.createBackupPayload();
    localStorage.setItem(STORAGE_KEYS.PRE_RESTORE_BACKUP, JSON.stringify(currentPayload));
  }

  static getPreRestoreSnapshot(): BackupPayload | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRE_RESTORE_BACKUP);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static clearPreRestoreSnapshot(): void {
    localStorage.removeItem(STORAGE_KEYS.PRE_RESTORE_BACKUP);
  }

  static restorePreRestoreSnapshot(): boolean {
    const snapshot = this.getPreRestoreSnapshot();
    if (!snapshot) return false;

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(snapshot.users));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(snapshot.classes));
    localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(snapshot.journals));
    if (snapshot.badges) {
      localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(snapshot.badges));
    }
    if (snapshot.schoolProfile) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL_PROFILE, JSON.stringify(snapshot.schoolProfile));
    }
    if (snapshot.reminderConfig) {
      localStorage.setItem(STORAGE_KEYS.REMINDER_CONFIG, JSON.stringify(snapshot.reminderConfig));
    }

    // Ensure active user exists
    const users = snapshot.users;
    const currentActiveId = this.getActiveUserId();
    if (!users.some((u) => u.id === currentActiveId) && users.length > 0) {
      this.setActiveUserId(users[0].id);
    }

    this.clearPreRestoreSnapshot();
    return true;
  }

  static restoreFromBackup(
    payload: BackupPayload,
    mode: 'overwrite' | 'merge' = 'overwrite'
  ): {
    success: boolean;
    message: string;
    summary: { users: number; journals: number; classes: number };
  } {
    try {
      // 1. Take safety snapshot first so user can undo if desired
      this.savePreRestoreSnapshot();

      if (mode === 'overwrite') {
        // Full clean overwrite
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(payload.users));
        localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(payload.classes));
        localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(payload.journals));
        if (payload.badges) {
          localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(payload.badges));
        }
        if (payload.schoolProfile) {
          localStorage.setItem(STORAGE_KEYS.SCHOOL_PROFILE, JSON.stringify(payload.schoolProfile));
        }
        if (payload.reminderConfig) {
          localStorage.setItem(STORAGE_KEYS.REMINDER_CONFIG, JSON.stringify(payload.reminderConfig));
        }

        // Verify active user
        const activeId = this.getActiveUserId();
        if (!payload.users.some((u) => u.id === activeId) && payload.users.length > 0) {
          this.setActiveUserId(payload.users[0].id);
        }

        return {
          success: true,
          message: 'Seluruh data berhasil dipulihkan dengan aman (mode Ganti Total).',
          summary: {
            users: payload.users.length,
            journals: Object.keys(payload.journals).length,
            classes: payload.classes.length,
          },
        };
      } else {
        // Merge mode
        const existingUsers = this.getUsers();
        const userMap = new Map<string, User>();
        existingUsers.forEach((u) => userMap.set(u.id, u));
        payload.users.forEach((u) => userMap.set(u.id, u));
        const mergedUsers = Array.from(userMap.values());
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mergedUsers));

        const existingClasses = this.getClasses();
        const classMap = new Map<string, SchoolClass>();
        existingClasses.forEach((c) => classMap.set(c.id, c));
        payload.classes.forEach((c) => classMap.set(c.id, c));
        const mergedClasses = Array.from(classMap.values());
        localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(mergedClasses));

        const existingJournals = this.getJournals();
        const mergedJournals = { ...existingJournals, ...payload.journals };
        localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(mergedJournals));

        if (payload.schoolProfile) {
          localStorage.setItem(STORAGE_KEYS.SCHOOL_PROFILE, JSON.stringify(payload.schoolProfile));
        }

        return {
          success: true,
          message: 'Data berhasil digabungkan dan diperbarui (mode Sinkronisasi/Merge).',
          summary: {
            users: mergedUsers.length,
            journals: Object.keys(mergedJournals).length,
            classes: mergedClasses.length,
          },
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Terjadi kesalahan saat memulihkan data: ${err?.message || 'Gagal menyimpan ke penyimpanan lokal.'}`,
        summary: { users: 0, journals: 0, classes: 0 },
      };
    }
  }
}

