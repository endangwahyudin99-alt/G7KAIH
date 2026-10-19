import React, { useState, useEffect } from 'react';
import { User, SchoolProfile } from '../types';
import { StorageService } from '../services/storage';
import { CloudSyncService, CloudSyncState } from '../services/cloudSync';
import { resolveSchoolLogo } from '../data/seedData';
import { 
  Menu,
  Calendar, 
  Bell, 
  BookOpen,
  Camera,
  Trophy,
  FileSpreadsheet,
  Users,
  Cloud,
  CheckCircle2,
  ChevronRight,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onUserChange?: (user: User) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  activeTab: 'jurnal' | 'galeri' | 'prestasi' | 'rekap' | 'siswa';
  onTabChange: (tab: 'jurnal' | 'galeri' | 'prestasi' | 'rekap' | 'siswa') => void;
  onOpenSlidebar: () => void;
  onOpenCover?: () => void;
  onOpenReminderModal: () => void;
  onOpenPrivacyModal: () => void;
  onOpenSchoolAndUserModal: () => void;
  onOpenBackupRestoreModal?: () => void;
  onResetData: () => void;
  onLogoutStudent?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  selectedDate,
  onDateChange,
  activeTab,
  onTabChange,
  onOpenSlidebar,
  onOpenCover,
  onOpenReminderModal,
  onOpenPrivacyModal,
  onOpenSchoolAndUserModal,
  onOpenBackupRestoreModal,
  onLogoutStudent,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const isTeacherOrAdmin = currentUser.role === 'guru' || currentUser.role === 'admin';
  const [cloudState, setCloudState] = useState<CloudSyncState>(() => CloudSyncService.getState());
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => StorageService.getSchoolProfile());

  useEffect(() => {
    const unsub = CloudSyncService.subscribe((state: CloudSyncState) => {
      setCloudState(state);
    });

    const handleProfileUpdate = () => {
      setSchoolProfile(StorageService.getSchoolProfile());
    };

    window.addEventListener('g7kaih_school_profile_updated', handleProfileUpdate);
    window.addEventListener('g7kaih_cloud_profile_synced', handleProfileUpdate);

    return () => {
      unsub();
      window.removeEventListener('g7kaih_school_profile_updated', handleProfileUpdate);
      window.removeEventListener('g7kaih_cloud_profile_synced', handleProfileUpdate);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Baris 1 (Baris Atas): Brand Logo & Quick Utilities / Akun */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 h-14 sm:h-15">
          {/* Sisi Kiri: Tombol Slidebar & Identitas Aplikasi */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Tombol Slidebar Hamburger */}
            <button
              onClick={onOpenSlidebar}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-800 border border-slate-200/80 shadow-2xs transition-all active:scale-95 group focus:outline-hidden cursor-pointer"
              title="Buka Menu Slidebar Lengkap"
              aria-label="Buka Menu Slidebar"
            >
              <Menu className="w-4 h-4 text-rose-600 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold tracking-tight">Menu</span>
            </button>

            {/* Logo & Judul Aplikasi */}
            <button
              onClick={onOpenCover}
              title={schoolProfile.name ? `${schoolProfile.name} (Klik untuk buka Sampul Depan)` : 'Lihat Halaman Sampul Depan / Cover'}
              className="flex items-center gap-2 group text-left focus:outline-hidden cursor-pointer"
            >
              {schoolProfile.logoUrl ? (
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
                  <img
                    src={resolveSchoolLogo(schoolProfile.logoUrl)}
                    alt={schoolProfile.name || 'Logo Sekolah'}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-xs font-extrabold text-base group-hover:scale-105 transition-transform shrink-0">
                  7
                </div>
              )}
              <div className="hidden xs:block">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight group-hover:text-rose-600 transition-colors">
                  {schoolProfile.name || 'Jurnal G7KAIH'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:block leading-tight truncate max-w-44">
                  {schoolProfile.name ? 'G7KAIH · Generasi Hebat' : 'Karakter Indonesia Hebat'}
                </span>
              </div>
            </button>
          </div>

          {/* Sisi Kanan: Cloud Sync, Tanggal, Pengingat, & Identitas Sekolah */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Status Koneksi Cloud Real-Time (Rumah & Guru Terhubung) */}
            {cloudState.status === 'connected' ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold"
                title="Database Online Firebase Aktif: Laporan pengisian dari rumah langsung tersinkron ke semua guru"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">Online Terhubung</span>
              </div>
            ) : cloudState.status === 'syncing' ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-semibold"
                title="Sedang menyinkronkan data dengan Cloud Firebase..."
              >
                <Cloud className="w-3.5 h-3.5 animate-bounce" />
                <span className="hidden sm:inline">Sinkronisasi...</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium"
                title="Mode Lokal Aktif (Data otomatis tersimpan di perangkat)"
              >
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Lokal / Offline</span>
              </div>
            )}

            {/* Pemilih Tanggal */}
            <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 rounded-xl px-2.5 py-1 transition-colors">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                max={todayStr}
                aria-label="Pilih Tanggal Jurnal"
                className="bg-transparent text-xs text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-23 sm:w-auto"
              />
            </div>

            {/* Tombol Pengingat */}
            <button
              onClick={onOpenReminderModal}
              title="Pengaturan Pengingat Harian"
              className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            </button>
          </div>
        </div>

        {/* Baris 2 (Baris Bawah): Menu-Menu Navigasi Utama */}
        <div className="border-t border-slate-100 py-1.5 sm:py-2 overflow-x-auto no-scrollbar">
          <nav 
            aria-label="Navigasi Menu Utama"
            className="flex items-center gap-1.5 sm:gap-2 min-w-max"
          >
            <button
              onClick={() => onTabChange('jurnal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 active:scale-95 ${
                activeTab === 'jurnal'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Jurnal Harian</span>
            </button>

            <button
              onClick={() => onTabChange('galeri')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 active:scale-95 ${
                activeTab === 'galeri'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Galeri Foto</span>
            </button>

            <button
              onClick={() => onTabChange('prestasi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 active:scale-95 ${
                activeTab === 'prestasi'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span>Lencana Prestasi</span>
            </button>

            <button
              onClick={() => onTabChange('rekap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 active:scale-95 ${
                activeTab === 'rekap'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Rekap Laporan</span>
            </button>

            {isTeacherOrAdmin && (
              <button
                onClick={() => onTabChange('siswa')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 active:scale-95 ${
                  activeTab === 'siswa'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Data Siswa</span>
              </button>
            )}
          </nav>
        </div>
      </div>

    </header>
  );
};
