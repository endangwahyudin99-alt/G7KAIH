/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, DailyJournal, PhotoProof } from './types';
import { StorageService } from './services/storage';
import { CloudSyncService } from './services/cloudSync';
import { Header } from './components/Header';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { PhotoStreamView } from './components/PhotoStreamView';
import { AchievementsView } from './components/AchievementsView';
import { PhotoGalleryModal } from './components/PhotoGalleryModal';
import { ExportReportModal } from './components/ExportReportModal';
import { ReminderModal } from './components/ReminderModal';
import { PrivacyNoticeModal } from './components/PrivacyNoticeModal';
import { StudentManagementView } from './components/StudentManagementView';
import { SchoolAndUserModal } from './components/SchoolAndUserModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { CoverScreen } from './components/CoverScreen';
import { Slidebar } from './components/Slidebar';
import { 
  BookOpen, 
  Camera, 
  Trophy, 
  FileSpreadsheet, 
  Bell, 
  AlertCircle,
  X,
  Users,
  Sparkles,
  Menu
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => StorageService.getActiveUser());
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<'jurnal' | 'galeri' | 'prestasi' | 'rekap' | 'siswa'>('jurnal');
  const [studentManagementClassId, setStudentManagementClassId] = useState<string | undefined>(undefined);

  const getEffectiveStudentId = (u: User) => {
    return u.role === 'orang_tua' ? (u.childId || u.id) : u.id;
  };

  // Initialize storage & cloud sync
  useEffect(() => {
    StorageService.init();
    CloudSyncService.init().catch((err) => {
      console.warn('Cloud sync initialization notice:', err);
    });

    const handleCloudJournalSync = (e?: Event) => {
      const customEvent = e as CustomEvent<{ studentId?: string; date?: string; action?: string; journal?: DailyJournal }>;
      const targetStudentId = getEffectiveStudentId(currentUser);

      // If the event provided the updated journal directly, apply it immediately
      if (customEvent?.detail?.journal && 
          customEvent.detail.journal.studentId === targetStudentId && 
          customEvent.detail.journal.date === selectedDate) {
        setCurrentJournal(customEvent.detail.journal);
        return;
      }

      if (!customEvent?.detail?.studentId || customEvent.detail.studentId === targetStudentId) {
        const j = StorageService.getOrCreateJournal(targetStudentId, selectedDate);
        setCurrentJournal(j);
      }
    };

    const handleCloudUserSync = () => {
      const allUsers = StorageService.getUsers();
      const updated = allUsers.find((u) => u.id === currentUser.id);
      if (updated) {
        setCurrentUser(updated);
      }
    };

    window.addEventListener('g7kaih_cloud_journals_synced', handleCloudJournalSync);
    window.addEventListener('g7kaih_cloud_users_synced', handleCloudUserSync);

    return () => {
      window.removeEventListener('g7kaih_cloud_journals_synced', handleCloudJournalSync);
      window.removeEventListener('g7kaih_cloud_users_synced', handleCloudUserSync);
    };
  }, [currentUser.id, currentUser.role, currentUser.childId, selectedDate]);

  // Modals state
  const [inspectedPhoto, setInspectedPhoto] = useState<{
    photo: PhotoProof;
    habitTitle: string;
  } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [isSchoolAndUserModalOpen, setIsSchoolAndUserModalOpen] = useState<boolean>(false);
  const [schoolAndUserModalTab, setSchoolAndUserModalTab] = useState<'profil' | 'sekolah' | 'semua_pengguna'>('sekolah');
  const [isBackupRestoreModalOpen, setIsBackupRestoreModalOpen] = useState<boolean>(false);
  const [showInAppReminderBanner, setShowInAppReminderBanner] = useState<boolean>(true);

  // Cover screen state: default to true so cover is the very first screen
  const [isCoverOpen, setIsCoverOpen] = useState<boolean>(true);
  const [openStudentLoginOnCover, setOpenStudentLoginOnCover] = useState<boolean>(false);

  // Slidebar (drawer navigation) state
  const [isSlidebarOpen, setIsSlidebarOpen] = useState<boolean>(false);

  // Journal state
  const [currentJournal, setCurrentJournal] = useState<DailyJournal>(() =>
    StorageService.getOrCreateJournal(getEffectiveStudentId(currentUser), selectedDate)
  );

  // Sync journal when user or date changes
  useEffect(() => {
    const targetStudentId = getEffectiveStudentId(currentUser);
    const j = StorageService.getOrCreateJournal(targetStudentId, selectedDate);
    setCurrentJournal(j);
  }, [currentUser.id, currentUser.role, currentUser.childId, selectedDate]);

  const handleUserChange = (user: User) => {
    StorageService.setActiveUserId(user.id);
    setCurrentUser(user);
    const targetStudentId = getEffectiveStudentId(user);
    const j = StorageService.getOrCreateJournal(targetStudentId, selectedDate);
    setCurrentJournal(j);
  };

  const handleLogoutStudent = () => {
    setOpenStudentLoginOnCover(false);
    setIsCoverOpen(true);
  };

  const handleUpdateJournal = (updated: DailyJournal) => {
    setCurrentJournal(updated);
  };

  const handleViewPhoto = (photo: PhotoProof, habitTitle: string) => {
    setInspectedPhoto({ photo, habitTitle });
  };

  const handleResetData = () => {
    if (
      confirm(
        'PERINGATAN: Apakah Anda yakin ingin membersihkan seluruh data siswa, data sekolah, dan riwayat jurnal dummy?\n\nTindakan ini akan mengosongkan seluruh data dan menyiapkannya untuk sekolah serta peserta didik riil.'
      )
    ) {
      StorageService.clearAllStudentAndSchoolData();
      const user = StorageService.getActiveUser();
      setCurrentUser(user);
      setCurrentJournal(StorageService.getOrCreateJournal(user.id, selectedDate));
      alert('Seluruh data siswa, dummy jurnal, dan identitas sekolah berhasil dibersihkan.');
    }
  };

  const isTeacherOrAdmin = currentUser.role === 'guru' || currentUser.role === 'admin';

  // Determine if student has incomplete habits today
  const hasIncompleteHabits = 
    currentUser.role === 'siswa' && 
    selectedDate === todayStr && 
    currentJournal.completedHabitsCount < 7;

  // If Cover Screen is active, show the attractive cover first
  if (isCoverOpen) {
    return (
      <div className="min-h-screen bg-slate-950">
        <CoverScreen
          currentUser={currentUser}
          onUserChange={handleUserChange}
          initialOpenStudentLogin={openStudentLoginOnCover}
          onEnterApp={(targetTab) => {
            if (targetTab) {
              setActiveTab(targetTab);
            }
            setOpenStudentLoginOnCover(false);
            setIsCoverOpen(false);
          }}
          onOpenSchoolAndUserModal={(tab) => {
            setSchoolAndUserModalTab(tab || 'sekolah');
            setIsSchoolAndUserModalOpen(true);
          }}
        />

        {isSchoolAndUserModalOpen && (
          <SchoolAndUserModal
            currentUser={currentUser}
            isOpen={true}
            initialTab={schoolAndUserModalTab}
            onClose={() => setIsSchoolAndUserModalOpen(false)}
            onUserUpdated={(updatedUser) => {
              if (updatedUser.id === currentUser.id) {
                setCurrentUser(updatedUser);
              }
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-20 md:pb-12">
      {/* Navigation Header */}
      <Header
        currentUser={currentUser}
        onUserChange={handleUserChange}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSlidebar={() => setIsSlidebarOpen(true)}
        onOpenCover={() => setIsCoverOpen(true)}
        onOpenReminderModal={() => setIsReminderModalOpen(true)}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        onOpenSchoolAndUserModal={() => setIsSchoolAndUserModalOpen(true)}
        onOpenBackupRestoreModal={() => setIsBackupRestoreModalOpen(true)}
        onResetData={handleResetData}
        onLogoutStudent={handleLogoutStudent}
      />

      {/* Slidebar Drawer (Slide-out Sidebar Navigation) */}
      <Slidebar
        isOpen={isSlidebarOpen}
        onClose={() => setIsSlidebarOpen(false)}
        currentUser={currentUser}
        onUserChange={handleUserChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCover={() => {
          setIsSlidebarOpen(false);
          setIsCoverOpen(true);
        }}
        onOpenReminderModal={() => {
          setIsSlidebarOpen(false);
          setIsReminderModalOpen(true);
        }}
        onOpenExportModal={() => {
          setIsSlidebarOpen(false);
          setIsExportModalOpen(true);
        }}
        onOpenPrivacyModal={() => {
          setIsSlidebarOpen(false);
          setIsPrivacyModalOpen(true);
        }}
        onOpenSchoolAndUserModal={() => {
          setIsSlidebarOpen(false);
          setIsSchoolAndUserModalOpen(true);
        }}
        onOpenBackupRestoreModal={() => {
          setIsSlidebarOpen(false);
          setIsBackupRestoreModalOpen(true);
        }}
        onResetData={handleResetData}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onLogoutStudent={handleLogoutStudent}
      />

      {/* Reminder In-App Notice if habits are incomplete */}
      {showInAppReminderBanner && hasIncompleteHabits && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 shadow-xs text-xs font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 fill-slate-950 shrink-0" />
              <span>
                <strong>Pengingat G7KAIH:</strong> Kamu telah menyelesaikan{' '}
                <strong className="underline">{currentJournal.completedHabitsCount}/7</strong> kebiasaan hari ini. Masih ada{' '}
                <strong>{7 - currentJournal.completedHabitsCount}</strong> kebiasaan yang dapat kamu isi dan lengkapi buktinya!
              </span>
            </div>
            <button
              onClick={() => setShowInAppReminderBanner(false)}
              className="p-1 hover:bg-amber-600 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'galeri' && (
          <PhotoStreamView
            currentUser={currentUser}
            onViewPhoto={handleViewPhoto}
          />
        )}

        {activeTab === 'prestasi' && (
          <AchievementsView currentUser={currentUser} />
        )}

        {activeTab === 'rekap' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Pusat Rekapitulasi & Ekspor Laporan
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Unduh data perkembangan kebiasaan siswa dalam format PDF resmi atau Microsoft Excel (.xlsx).
                </p>
              </div>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
              >
                Buka Pratinjau Cetak PDF / Excel
              </button>
            </div>
            {/* Embed teacher/admin view if teacher, parent view if parent, or student view */}
            {isTeacherOrAdmin ? (
              <TeacherDashboard
                currentUser={currentUser}
                date={selectedDate}
                onViewPhoto={handleViewPhoto}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                onNavigateToStudents={() => setActiveTab('siswa')}
                onOpenSchoolAndUserModal={() => setIsSchoolAndUserModalOpen(true)}
                onOpenBackupRestoreModal={() => setIsBackupRestoreModalOpen(true)}
              />
            ) : (
              <StudentDashboard
                currentUser={
                  currentUser.role === 'orang_tua'
                    ? StorageService.getUsers().find((u) => u.id === currentUser.childId) ||
                      StorageService.getUsers().find((u) => u.role === 'siswa') ||
                      currentUser
                    : currentUser
                }
                date={selectedDate}
                journal={currentJournal}
                onUpdateJournal={handleUpdateJournal}
                onViewPhoto={handleViewPhoto}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                onUserChange={handleUserChange}
                onLogoutStudent={handleLogoutStudent}
              />
            )}
          </div>
        )}

        {activeTab === 'siswa' && isTeacherOrAdmin && (
          <StudentManagementView
            currentUser={currentUser}
            initialClassId={studentManagementClassId}
            onRefreshData={() => {
              // Trigger reload of active user if school or data changed
              const u = StorageService.getActiveUser();
              setCurrentUser(u);
            }}
          />
        )}

        {activeTab === 'jurnal' && (
          <>
            {currentUser.role === 'siswa' && (
              <StudentDashboard
                currentUser={currentUser}
                date={selectedDate}
                journal={currentJournal}
                onUpdateJournal={handleUpdateJournal}
                onViewPhoto={handleViewPhoto}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                onUserChange={handleUserChange}
                onLogoutStudent={handleLogoutStudent}
              />
            )}

            {currentUser.role === 'guru' && (
              <TeacherDashboard
                currentUser={currentUser}
                date={selectedDate}
                onViewPhoto={handleViewPhoto}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                onNavigateToStudents={() => {
                  setStudentManagementClassId(currentUser.classId);
                  setActiveTab('siswa');
                }}
                onOpenSchoolAndUserModal={() => setIsSchoolAndUserModalOpen(true)}
                onOpenBackupRestoreModal={() => setIsBackupRestoreModalOpen(true)}
              />
            )}

            {currentUser.role === 'orang_tua' && (
              <StudentDashboard
                currentUser={
                  StorageService.getUsers().find((u) => u.id === currentUser.childId) ||
                  StorageService.getUsers().find((u) => u.role === 'siswa') ||
                  currentUser
                }
                date={selectedDate}
                journal={currentJournal}
                onUpdateJournal={handleUpdateJournal}
                onViewPhoto={handleViewPhoto}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                onUserChange={handleUserChange}
                onLogoutStudent={handleLogoutStudent}
              />
            )}

            {currentUser.role === 'admin' && (
              <AdminDashboard
                currentUser={currentUser}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                onNavigateToStudents={(classId?: string) => {
                  setStudentManagementClassId(classId);
                  setActiveTab('siswa');
                }}
                onOpenSchoolAndUserModal={() => setIsSchoolAndUserModalOpen(true)}
                onOpenBackupRestoreModal={() => setIsBackupRestoreModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Tab Bar (Clean 5-Item Responsive Mobile Navigation) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden">
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1">
          {/* Slidebar Trigger Button */}
          <button
            onClick={() => setIsSlidebarOpen(true)}
            className="flex flex-col items-center justify-center py-1 transition-colors text-slate-700 hover:text-rose-600 active:scale-95"
            title="Buka Menu Slidebar"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-0.5">
              <Menu className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold tracking-tight text-slate-800">Menu</span>
          </button>

          <button
            onClick={() => setActiveTab('jurnal')}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'jurnal' ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Jurnal</span>
          </button>

          <button
            onClick={() => setActiveTab('galeri')}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'galeri' ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Galeri</span>
          </button>

          <button
            onClick={() => setActiveTab('prestasi')}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'prestasi' ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Lencana</span>
          </button>

          <button
            onClick={() => setActiveTab('rekap')}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'rekap' ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Rekap</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {inspectedPhoto && (
        <PhotoGalleryModal
          photo={inspectedPhoto.photo}
          habitTitle={inspectedPhoto.habitTitle}
          studentName={currentUser.role === 'siswa' ? currentUser.name : undefined}
          onClose={() => setInspectedPhoto(null)}
        />
      )}

      {isExportModalOpen && (
        <ExportReportModal
          student={
            currentUser.role === 'siswa'
              ? currentUser
              : (currentUser.role === 'guru' && currentUser.classId
                  ? StorageService.getStudentsByClass(currentUser.classId)[0] || currentUser
                  : StorageService.getUsers().find((u) => u.role === 'siswa') || currentUser)
          }
          schoolClass={
            (currentUser.role === 'guru' && currentUser.classId
              ? StorageService.getClasses().find((c) => c.id === currentUser.classId)
              : undefined) || StorageService.getClasses()[0]
          }
          isOpen={true}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {isReminderModalOpen && (
        <ReminderModal
          isOpen={true}
          onClose={() => setIsReminderModalOpen(false)}
        />
      )}

      {isPrivacyModalOpen && (
        <PrivacyNoticeModal
          isOpen={true}
          onClose={() => setIsPrivacyModalOpen(false)}
        />
      )}

      {isSchoolAndUserModalOpen && (
        <SchoolAndUserModal
          currentUser={currentUser}
          isOpen={true}
          initialTab={schoolAndUserModalTab}
          onClose={() => setIsSchoolAndUserModalOpen(false)}
          onUserUpdated={(updated) => {
            setCurrentUser(updated);
          }}
        />
      )}

      {isBackupRestoreModalOpen && (
        <BackupRestoreModal
          currentUser={currentUser}
          isOpen={true}
          onClose={() => setIsBackupRestoreModalOpen(false)}
          onDataRestored={() => {
            const user = StorageService.getActiveUser();
            setCurrentUser(user);
            setCurrentJournal(StorageService.getOrCreateJournal(user.id, selectedDate));
          }}
        />
      )}
    </div>
  );
}
