import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';
import { resolveSchoolLogo } from '../data/seedData';
import {
  Menu,
  X,
  FileSpreadsheet,
  Users,
  Sparkles,
  Building2,
  Bell,
  ShieldCheck,
  RotateCcw,
  Calendar,
  ChevronRight,
  School,
  GraduationCap,
  HeartHandshake,
  UserCheck,
  Database,
  LogOut
} from 'lucide-react';

interface SlidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserChange: (user: User) => void;
  activeTab: 'jurnal' | 'galeri' | 'prestasi' | 'rekap' | 'siswa';
  onTabChange: (tab: 'jurnal' | 'galeri' | 'prestasi' | 'rekap' | 'siswa') => void;
  onOpenCover: () => void;
  onOpenReminderModal: () => void;
  onOpenExportModal: () => void;
  onOpenPrivacyModal: () => void;
  onOpenSchoolAndUserModal: (tab?: 'profil' | 'sekolah' | 'semua_pengguna') => void;
  onOpenBackupRestoreModal?: () => void;
  onResetData: () => void;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  onLogoutStudent?: () => void;
}

export const Slidebar: React.FC<SlidebarProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  activeTab,
  onTabChange,
  onOpenCover,
  onOpenReminderModal,
  onOpenExportModal,
  onOpenPrivacyModal,
  onOpenSchoolAndUserModal,
  onOpenBackupRestoreModal,
  onResetData,
  selectedDate,
  onDateChange,
  onLogoutStudent,
}) => {
  const [schoolProfile, setSchoolProfile] = useState(() => StorageService.getSchoolProfile());

  useEffect(() => {
    const handleProfileUpdate = () => {
      setSchoolProfile(StorageService.getSchoolProfile());
    };
    window.addEventListener('g7kaih_school_profile_updated', handleProfileUpdate);
    window.addEventListener('g7kaih_cloud_profile_synced', handleProfileUpdate);
    return () => {
      window.removeEventListener('g7kaih_school_profile_updated', handleProfileUpdate);
      window.removeEventListener('g7kaih_cloud_profile_synced', handleProfileUpdate);
    };
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when slidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'siswa':
        return 'Siswa';
      case 'guru':
        return 'Guru / Wali Kelas';
      case 'orang_tua':
        return 'Orang Tua / Wali';
      case 'admin':
        return 'Admin Sekolah';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'siswa':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'guru':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'orang_tua':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const handleNavClick = (tab: 'jurnal' | 'galeri' | 'prestasi' | 'rekap' | 'siswa') => {
    onTabChange(tab);
    onClose();
  };

  const isTeacherOrAdmin = currentUser.role === 'guru' || currentUser.role === 'admin';
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slidebar drawer container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[85vw] max-w-84 sm:w-84 bg-white text-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Slidebar Navigasi Utama"
      >
        {/* Slidebar Header with School & Branding */}
        <div className="p-4 bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 text-white relative shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {schoolProfile.logoUrl ? (
                <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-md border border-white/40 shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={resolveSchoolLogo(schoolProfile.logoUrl)}
                    alt={schoolProfile.name || 'Logo Sekolah'}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white shadow-inner border border-white/30 text-lg shrink-0">
                  7
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-bold text-base tracking-tight leading-tight truncate">
                  {schoolProfile.name || 'Jurnal G7KAIH'}
                </h2>
                <p className="text-[11px] text-rose-100 leading-tight line-clamp-1 mt-0.5 font-medium">
                  {schoolProfile.name ? 'Gerakan 7 Kebiasaan Anak Indonesia Hebat' : 'Identitas Sekolah (Belum Diatur)'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-sm font-semibold tracking-wide">
                    NPSN {schoolProfile.npsn || '-'}
                  </span>
                  <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-sm font-bold">
                    TP {schoolProfile.academicYear || '2025/2026'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors focus:outline-hidden"
              title="Tutup Menu Slidebar"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Card & Quick Role Switcher */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Pengguna Aktif
            </span>
            {isTeacherOrAdmin && (
              <button
                onClick={() => {
                  onOpenSchoolAndUserModal('profil');
                  onClose();
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                title="Edit Profil Pengguna"
              >
                <Building2 className="w-3 h-3" />
                <span>Edit Profil</span>
              </button>
            )}
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-900 truncate">
                  {currentUser.name}
                </span>
              </div>
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${getRoleBadgeColor(currentUser.role)}`}>
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
          </div>

        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Data Siswa (Khusus Guru & Admin) */}
          {isTeacherOrAdmin && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Manajemen Kelas
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => handleNavClick('siswa')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors group ${
                    activeTab === 'siswa'
                      ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      activeTab === 'siswa'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                    }`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="block text-indigo-900 font-bold">Kelola Data Siswa</span>
                        <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded-sm">
                          Guru
                        </span>
                      </div>
                      <span className="block text-[10px] text-slate-500 font-normal">Manajemen Kelas & Siswa</span>
                    </div>
                  </div>
                  {activeTab === 'siswa' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </button>
              </nav>
            </div>
          )}

          {/* Quick Date Selector in Slidebar */}
          {selectedDate && onDateChange && (
            <div className="pt-2 border-t border-slate-200">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center justify-between">
                <span>Pilih Tanggal Jurnal</span>
                {selectedDate === todayStr && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-sm font-semibold">
                    Hari Ini
                  </span>
                )}
              </div>
              <div className="px-2">
                <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 p-2 rounded-xl border border-slate-200 transition-colors">
                  <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    max={todayStr}
                    className="w-full bg-transparent text-xs text-slate-800 font-bold focus:outline-hidden cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pengaturan & Aksi Cepat */}
          <div className="pt-2 border-t border-slate-200">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              Alat & Pengaturan
            </div>
            <div className="space-y-1">
              {isTeacherOrAdmin && (
                <>
                  <button
                    onClick={() => {
                      onOpenSchoolAndUserModal('sekolah');
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-medium">Identitas Sekolah & Profil</span>
                  </button>

                  {onOpenBackupRestoreModal && (
                    <button
                      onClick={() => {
                        onOpenBackupRestoreModal();
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-slate-800 hover:bg-rose-50 hover:text-rose-700 transition-colors group"
                    >
                      <Database className="w-4 h-4 text-rose-600 shrink-0 group-hover:scale-105 transition-transform" />
                      <div className="flex items-center justify-between flex-1">
                        <span className="font-semibold">Backup & Pemulihan Data</span>
                        <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded-sm font-bold">
                          JSON
                        </span>
                      </div>
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => {
                  onOpenExportModal();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span className="font-medium">Cetak Laporan Excel & PDF</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-sm font-bold">
                    Excel
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenReminderModal();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-medium">Pengingat Harian Otomatis</span>
              </button>

              <button
                onClick={() => {
                  onOpenPrivacyModal();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">Privasi & Izin Kamera</span>
              </button>

              <button
                onClick={() => {
                  onResetData();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                title="Hapus seluruh data siswa, data sekolah dan riwayat jurnal dummy"
              >
                <RotateCcw className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-semibold">Bersihkan Data Siswa & Sekolah</span>
              </button>
            </div>
          </div>
        </div>

        {/* Slidebar Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-center shrink-0">
          <p className="text-[11px] text-slate-600 font-semibold">
            Gerakan 7 Kebiasaan Anak Indonesia Hebat
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Membangun Karakter Unggul & Berakhlak Mulia
          </p>
        </div>
      </aside>
    </>
  );
};
