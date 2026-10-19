import React, { useState } from 'react';
import { User, SchoolProfile, UserRole } from '../types';
import { StorageService } from '../services/storage';
import { 
  Building2, 
  UserCheck, 
  School, 
  X, 
  Check, 
  Edit3, 
  UserPlus, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Tag
} from 'lucide-react';
import { compressSchoolLogo, SCHOOL_LOGO_PRESETS } from '../utils/imageCompressor';
import { isDummyStudent } from '../data/seedData';

interface SchoolAndUserModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
  initialTab?: 'profil' | 'sekolah' | 'semua_pengguna';
}

export const SchoolAndUserModal: React.FC<SchoolAndUserModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUserUpdated,
  initialTab = 'profil',
}) => {
  const [activeTab, setActiveTab] = useState<'profil' | 'sekolah' | 'semua_pengguna'>(initialTab);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Profile Form state
  const [profileName, setProfileName] = useState<string>(currentUser.name);
  const [profileEmail, setProfileEmail] = useState<string>(currentUser.email);
  const [profilePhone, setProfilePhone] = useState<string>(currentUser.phone || currentUser.parentPhone || '');
  const [profileAvatar, setProfileAvatar] = useState<string>(currentUser.avatar);

  // School Profile state
  const initialSchool = StorageService.getSchoolProfile();
  const [schoolData, setSchoolData] = useState<SchoolProfile>(initialSchool);

  // All Users state
  const [allUsers, setAllUsers] = useState<User[]>(() => StorageService.getUsers());
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingOtherUser, setEditingOtherUser] = useState<User | null>(null);

  // School Logo upload & permanence handlers
  const logoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState<boolean>(false);

  // Sync state when opened
  React.useEffect(() => {
    if (!isOpen) return;
    setProfileName(currentUser.name);
    setProfileEmail(currentUser.email);
    setProfilePhone(currentUser.phone || currentUser.parentPhone || '');
    setProfileAvatar(currentUser.avatar);
    setSchoolData(StorageService.getSchoolProfile());
    setAllUsers(StorageService.getUsers());
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const isTeacherOrAdmin = currentUser.role === 'guru' || currentUser.role === 'admin';
  const isAdmin = currentUser.role === 'admin';

  // Handle User Avatar Randomize
  const handleRandomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const style = currentUser.role === 'siswa' ? 'bottts' : 'avataaars';
    const bg = currentUser.role === 'siswa' ? 'b6e3f4' : 'ffd5dc';
    const newAvatar = `https://api.dicebear.com/7.x/${style}/svg?seed=${randomSeed}&backgroundColor=${bg}`;
    setProfileAvatar(newAvatar);
  };

  // Save current user profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...currentUser,
      name: profileName.trim(),
      email: profileEmail.trim(),
      phone: profilePhone.trim(),
      avatar: profileAvatar,
    };

    StorageService.updateUser(updated);
    onUserUpdated(updated);
    setSuccessMessage('Profil pengguna berhasil diperbarui!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Save school profile
  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSchoolProfile(schoolData);
    
    // Also update current user's schoolName
    const updatedUser = { ...currentUser, schoolName: schoolData.name };
    onUserUpdated(updatedUser);

    setSuccessMessage('Identitas sekolah berhasil diperbarui dan disinkronkan ke seluruh sistem!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleLogoProcess = async (file: File) => {
    setLogoError(null);
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.svg')) {
      setLogoError('Format berkas harus berupa gambar (PNG, JPG, SVG, atau WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Ukuran berkas terlalu besar (maksimal 5 MB).');
      return;
    }

    try {
      setIsUploadingLogo(true);
      const res = await compressSchoolLogo(file);
      const updatedSchool: SchoolProfile = {
        ...schoolData,
        logoUrl: res.dataUrl,
      };
      setSchoolData(updatedSchool);
      // Auto-save permanently so logo is immediately secured in storage & cloud
      StorageService.saveSchoolProfile(updatedSchool);
      setSuccessMessage('Logo sekolah berhasil diunggah dan terpasang permanen!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setLogoError(err?.message || 'Gagal memproses gambar logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoProcess(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleSelectPresetLogo = (presetSvg: string, title: string) => {
    const updatedSchool: SchoolProfile = {
      ...schoolData,
      logoUrl: presetSvg,
    };
    setSchoolData(updatedSchool);
    StorageService.saveSchoolProfile(updatedSchool);
    setSuccessMessage(`Lambang "${title}" berhasil diterapkan dan terpasang permanen!`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleRemoveLogo = () => {
    const updatedSchool: SchoolProfile = {
      ...schoolData,
      logoUrl: '',
    };
    setSchoolData(updatedSchool);
    StorageService.saveSchoolProfile(updatedSchool);
    setSuccessMessage('Logo sekolah berhasil dilepas.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Save edited other user
  const handleSaveOtherUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOtherUser) return;
    StorageService.updateUser(editingOtherUser);
    setAllUsers(StorageService.getUsers());
    if (editingOtherUser.id === currentUser.id) {
      onUserUpdated(editingOtherUser);
    }
    setEditingOtherUser(null);
    setSuccessMessage(`Data pengguna "${editingOtherUser.name}" berhasil diperbarui!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const filteredUsers = allUsers.filter((u) => {
    if (roleFilter === 'all') return true;
    return u.role === roleFilter;
  });

  const dummyStudentsCount = allUsers.filter((u) => isDummyStudent(u)).length;

  const handlePurgeDummyStudents = () => {
    if (
      confirm(
        `PERINGATAN: Apakah Anda yakin ingin menghapus permanen seluruh data siswa dummy/contoh (${dummyStudentsCount} siswa) dari sistem dan Cloud Firestore?\n\nData siswa riil sekolah Anda tidak akan terpengaruh.`
      )
    ) {
      const res = StorageService.deleteDummyStudents();
      setAllUsers(StorageService.getUsers());
      setSuccessMessage(`${res.count} siswa dummy berhasil dihapus secara permanen dari sistem & Cloud.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pengaturan Identitas & Profil
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Kelola profil akun pengguna dan identitas resmi sekolah.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('profil')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'profil'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Profil Saya ({currentUser.name})
          </button>

          <button
            onClick={() => setActiveTab('sekolah')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'sekolah'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Identitas Sekolah
          </button>

          {isTeacherOrAdmin && (
            <button
              onClick={() => setActiveTab('semua_pengguna')}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'semua_pengguna'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Kelola Semua Akun ({allUsers.length})
            </button>
          )}
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Profil Pengguna Aktif */}
        {activeTab === 'profil' && (
          <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Avatar Row */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="relative">
                <img
                  src={profileAvatar}
                  alt={profileName}
                  className="w-16 h-16 rounded-2xl bg-white border border-slate-300 object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-800 block text-sm">
                  Foto / Avatar Profil
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Pilih avatar kartun ramah anak atau masukkan tautan gambar.
                </span>
                <button
                  type="button"
                  onClick={handleRandomizeAvatar}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Acak Avatar Baru</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Peran Akun
                </label>
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 uppercase tracking-wide">
                  {currentUser.role}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Akun *
                </label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="08123456789"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* School Association Display */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-600 block">
                Asal Sekolah Terdaftar:
              </span>
              <strong className="text-slate-900 font-bold block text-sm">
                {currentUser.schoolName}
              </strong>
              {currentUser.nisn && (
                <span className="text-slate-500 font-mono text-[11px] block">
                  NISN: {currentUser.nisn}
                </span>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
              >
                Simpan Profil Saya
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Identitas Sekolah */}
        {activeTab === 'sekolah' && (
          <form onSubmit={handleSaveSchool} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900">
              <p className="font-bold text-xs mb-0.5">
                Kop Surat & Data Lembaga Pendidikan
              </p>
              <p className="text-[11px]">
                Informasi sekolah ini otomatis tersinkronkan ke Kop Surat Laporan Cetak PDF, rekap bulanan, dan ekspor data siswa.
              </p>
            </div>

            {/* Menu Upload Logo Sekolah (Terpasang Permanen) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border border-indigo-100/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                      <span>Logo Resmi Lembaga Sekolah</span>
                      {schoolData.logoUrl ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Terpasang Permanen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          Belum Ada Logo
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tampil permanen pada Kop Surat PDF resmi, Header aplikasi, Menu drawer, dan Sampul Depan.
                    </p>
                  </div>
                </div>

                {schoolData.logoUrl && isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                    title="Hapus logo yang saat ini terpasang"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Logo</span>
                  </button>
                )}
              </div>

              {/* Logo Preview & Upload Box */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                {/* Visual Preview Box */}
                <div className="sm:col-span-4 flex flex-col items-center justify-center p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-2 group shadow-inner">
                    {schoolData.logoUrl ? (
                      <img
                        src={schoolData.logoUrl}
                        alt="Logo Resmi Sekolah"
                        className="w-full h-full object-contain filter drop-shadow-xs transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40 text-slate-400" />
                        <span className="text-[10px] font-medium block leading-tight">Belum Diunggah</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-1.5 text-center">
                    {schoolData.logoUrl ? 'Pratinjau Logo Sekolah' : 'Format: PNG / JPG / SVG / WebP'}
                  </span>
                </div>

                {/* Upload Action / Drop Zone */}
                <div className="sm:col-span-8 space-y-2.5">
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />

                  {isTeacherOrAdmin ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(true);
                      }}
                      onDragLeave={() => setIsDraggingLogo(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleLogoProcess(file);
                      }}
                      onClick={() => logoInputRef.current?.click()}
                      className={`p-4 border-2 border-dashed rounded-xl transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none ${
                        isDraggingLogo
                          ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01]'
                          : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 bg-white'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-800">
                          {isUploadingLogo ? 'Sedang Memproses & Mengompresi...' : 'Klik untuk Unggah Berkas Logo Sekolah'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          atau seret & letakkan berkas gambar ke area ini (Maks. 5 MB)
                        </p>
                      </div>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        Otomatis tersimpan permanen di perangkat & Cloud
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-600 text-xs">
                      Hanya akun Guru atau Administrator yang dapat mengunggah logo resmi sekolah.
                    </div>
                  )}

                  {logoError && (
                    <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{logoError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Preset Lambang Resmi Pendidikan */}
              {isTeacherOrAdmin && (
                <div className="pt-2.5 border-t border-indigo-100/80">
                  <span className="text-[11px] font-bold text-slate-700 block mb-2">
                    Atau pilih lambang resmi pendidikan nasional siap pakai:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SCHOOL_LOGO_PRESETS.map((preset) => {
                      const isSelected = schoolData.logoUrl === preset.svgDataUrl;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPresetLogo(preset.svgDataUrl, preset.title)}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 shadow-xs ring-1 ring-indigo-400'
                              : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={preset.svgDataUrl}
                            alt={preset.title}
                            className="w-8 h-8 object-contain shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-[11px] text-slate-900 truncate leading-tight flex items-center gap-1">
                              <span>{preset.title}</span>
                              {isSelected && <Check className="w-3 h-3 text-indigo-600 inline shrink-0" />}
                            </p>
                            <p className="text-[9px] text-slate-500 truncate leading-tight mt-0.5">
                              {preset.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Resmi Sekolah *
                </label>
                <input
                  type="text"
                  required
                  value={schoolData.name}
                  onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
                  disabled={!isTeacherOrAdmin}
                  placeholder="Contoh: SDN 1 Merdeka"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NPSN (Nomor Pokok Sekolah Nasional) *
                </label>
                <input
                  type="text"
                  required
                  value={schoolData.npsn}
                  onChange={(e) => setSchoolData({ ...schoolData, npsn: e.target.value })}
                  disabled={!isTeacherOrAdmin}
                  placeholder="Contoh: 20108392"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jenjang Pendidikan
                </label>
                <select
                  value={schoolData.gradeLevel}
                  onChange={(e) => setSchoolData({ ...schoolData, gradeLevel: e.target.value as 'SD' | 'SMP' | 'SMA' })}
                  disabled={!isTeacherOrAdmin}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 disabled:bg-slate-100"
                >
                  <option value="SD">Sekolah Dasar (SD)</option>
                  <option value="SMP">Sekolah Menengah Pertama (SMP)</option>
                  <option value="SMA">Sekolah Menengah Atas (SMA)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tahun Ajaran Aktif
                </label>
                <input
                  type="text"
                  value={schoolData.academicYear}
                  onChange={(e) => setSchoolData({ ...schoolData, academicYear: e.target.value })}
                  disabled={!isTeacherOrAdmin}
                  placeholder="2025/2026"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Semester
                </label>
                <select
                  value={schoolData.semester}
                  onChange={(e) => setSchoolData({ ...schoolData, semester: e.target.value as 'Ganjil' | 'Genap' })}
                  disabled={!isTeacherOrAdmin}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 disabled:bg-slate-100"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Alamat Lengkap Sekolah
              </label>
              <input
                type="text"
                value={schoolData.address}
                onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                disabled={!isTeacherOrAdmin}
                placeholder="Contoh: Jl. Merdeka No. 45, Gambir"
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 disabled:bg-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kabupaten / Kota
                </label>
                <input
                  type="text"
                  value={schoolData.city}
                  onChange={(e) => setSchoolData({ ...schoolData, city: e.target.value })}
                  disabled={!isTeacherOrAdmin}
                  placeholder="Kota Jakarta Pusat"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={schoolData.province}
                  onChange={(e) => setSchoolData({ ...schoolData, province: e.target.value })}
                  disabled={!isTeacherOrAdmin}
                  placeholder="DKI Jakarta"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Kepala Sekolah *
                </label>
                <input
                  type="text"
                  required
                  value={schoolData.principalName}
                  onChange={(e) => setSchoolData({ ...schoolData, principalName: e.target.value })}
                  disabled={!isTeacherOrAdmin}
                  placeholder="Contoh: Drs. H. Mulyadi, M.Pd."
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={schoolData.principalNip || ''}
                  onChange={(e) => setSchoolData({ ...schoolData, principalNip: e.target.value })}
                  disabled={!isTeacherOrAdmin}
                  placeholder="Contoh: 19680512 199303 1 005"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-mono text-slate-900 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Resmi Sekolah
                </label>
                <input
                  type="email"
                  value={schoolData.email}
                  onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                  disabled={!isTeacherOrAdmin}
                  placeholder="info@sekolah.sch.id"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Telepon Kantor
                </label>
                <input
                  type="text"
                  value={schoolData.phone}
                  onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                  disabled={!isTeacherOrAdmin}
                  placeholder="021-3456789"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 disabled:bg-slate-100"
                />
              </div>
            </div>

            {isTeacherOrAdmin && (
              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  Simpan Identitas Sekolah
                </button>
              </div>
            )}
          </form>
        )}

        {/* Tab 3: Kelola Semua Pengguna (Admin & Guru) */}
        {activeTab === 'semua_pengguna' && isTeacherOrAdmin && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Banner Hapus Siswa Dummy */}
            {dummyStudentsCount > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-950 block">
                      Terdapat {dummyStudentsCount} Akun Siswa Dummy / Bawaan
                    </span>
                    <span className="text-[11px] text-amber-800 block">
                      Hapus permanen agar daftar siswa bersih dan hanya berisi siswa riil sekolah Anda.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePurgeDummyStudents}
                  className="px-3.5 py-1.5 font-bold text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  Hapus Permanen Dummy ({dummyStudentsCount})
                </button>
              </div>
            )}

            {/* Filter role */}
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-slate-800">
                Daftar Akun Pengguna Terdaftar ({filteredUsers.length})
              </span>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {['all', 'siswa', 'guru', 'orang_tua', 'admin'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      roleFilter === role
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {role === 'all' ? 'Semua' : role}
                  </button>
                ))}
              </div>
            </div>

            {/* User List Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                    <th className="p-2.5">Pengguna</th>
                    <th className="p-2.5">Peran</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-7 h-7 rounded-full bg-slate-100 object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 block">
                                {u.name}
                              </span>
                              {isDummyStudent(u) && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Tag className="w-2.5 h-2.5 text-amber-700" />
                                  <span>Dummy</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              ID: {u.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'guru'
                            ? 'bg-indigo-100 text-indigo-800'
                            : u.role === 'orang_tua'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                        {u.email}
                      </td>

                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingOtherUser(u)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Edit Other User Mini Form */}
            {editingOtherUser && (
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900">
                    Edit Akun: {editingOtherUser.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingOtherUser(null)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={editingOtherUser.name}
                      onChange={(e) => setEditingOtherUser({ ...editingOtherUser, name: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingOtherUser.email}
                      onChange={(e) => setEditingOtherUser({ ...editingOtherUser, email: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOtherUser(null)}
                    className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOtherUser}
                    className="px-4 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
