import React, { useState, useEffect } from 'react';
import { User, SchoolProfile } from '../types';
import { StorageService } from '../services/storage';
import { G7KAIH_HABITS, HERO_STUDENTS_IMG, BADGE_EMBLEM_IMG, resolveSchoolLogo } from '../data/seedData';
import { 
  Sunrise, 
  HeartHandshake, 
  Activity, 
  Apple, 
  BookOpen, 
  Users, 
  Moon, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  FileSpreadsheet, 
  Calendar,
  ChevronRight,
  Flame,
  Info,
  Layers,
  Heart,
  Star,
  Home,
  GraduationCap,
  ChevronDown,
  X
} from 'lucide-react';

import { StudentLoginModal } from './StudentLoginModal';

interface CoverScreenProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onEnterApp: (targetTab?: 'jurnal' | 'galeri' | 'prestasi' | 'rekap' | 'siswa') => void;
  onOpenSchoolAndUserModal?: (tab?: 'profil' | 'sekolah' | 'semua_pengguna') => void;
  initialOpenStudentLogin?: boolean;
}

export const CoverScreen: React.FC<CoverScreenProps> = ({
  currentUser,
  onUserChange,
  onEnterApp,
  onOpenSchoolAndUserModal,
  initialOpenStudentLogin = false,
}) => {
  const [selectedHabitIndex, setSelectedHabitIndex] = useState<number>(0);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showAdminTeacherModal, setShowAdminTeacherModal] = useState<boolean>(false);
  const [showStudentLoginModal, setShowStudentLoginModal] = useState<boolean>(initialOpenStudentLogin);

  useEffect(() => {
    if (initialOpenStudentLogin) {
      setShowStudentLoginModal(true);
    }
  }, [initialOpenStudentLogin]);
  
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => StorageService.getSchoolProfile());

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

  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());

  useEffect(() => {
    const handleUsersUpdate = () => {
      setUsers(StorageService.getUsers());
    };
    window.addEventListener('g7kaih_cloud_users_synced', handleUsersUpdate);
    return () => {
      window.removeEventListener('g7kaih_cloud_users_synced', handleUsersUpdate);
    };
  }, []);

  const classes = StorageService.getClasses();
  const studentUsers = users.filter((u) => u.role === 'siswa' && !StorageService.isDummyStudent(u));
  const teacherUsers = users.filter((u) => u.role === 'guru');
  const teacherUser = teacherUsers[0] || users[0];
  const adminUser = users.find((u) => u.role === 'admin') || users[1] || users[0];

  const [showTeacherLoginModal, setShowTeacherLoginModal] = useState<boolean>(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => teacherUsers[0]?.id || 'user-guru-1a');

  // Keep selected teacher ID in sync
  useEffect(() => {
    if (teacherUsers.length > 0 && !teacherUsers.some((t) => t.id === selectedTeacherId)) {
      setSelectedTeacherId(teacherUsers[0].id);
    }
  }, [users]);

  const [showRegisterStudentModal, setShowRegisterStudentModal] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentClassId, setNewStudentClassId] = useState<string>(classes[0]?.id || 'class-1a');

  const handleEnterParent = () => {
    setShowStudentLoginModal(true);
  };

  const handleCreateAndEnterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const newStudent = StorageService.addStudent({
      name: newStudentName.trim(),
      classId: newStudentClassId,
      schoolName: schoolProfile.name,
    });
    StorageService.setActiveUserId(newStudent.id);
    onUserChange(newStudent);
    setShowRegisterStudentModal(false);
    onEnterApp('jurnal');
  };

  const handleSelectTeacherAndEnter = (teacher: User) => {
    StorageService.setActiveUserId(teacher.id);
    onUserChange(teacher);
    setShowTeacherLoginModal(false);
    setShowAdminTeacherModal(false);
    onEnterApp('jurnal');
  };

  const handleEnterAdminOrTeacher = (role: 'guru' | 'admin') => {
    if (role === 'guru') {
      setShowTeacherLoginModal(true);
      setShowAdminTeacherModal(false);
      return;
    }
    const targetUser = users.find((u) => u.role === role) || users[0];
    StorageService.setActiveUserId(targetUser.id);
    onUserChange(targetUser);
    setShowAdminTeacherModal(false);
    onEnterApp('jurnal');
  };

  const activeSelectedTeacher = teacherUsers.find((t) => t.id === selectedTeacherId) || teacherUsers[0];

  const getHabitIcon = (iconName: string, className: string = 'w-6 h-6') => {
    switch (iconName) {
      case 'Sunrise':
        return <Sunrise className={className} />;
      case 'HeartHandshake':
        return <HeartHandshake className={className} />;
      case 'Activity':
        return <Activity className={className} />;
      case 'Apple':
        return <Apple className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'Moon':
        return <Moon className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  const selectedHabit = G7KAIH_HABITS[selectedHabitIndex] || G7KAIH_HABITS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner / Kemendikbud & School Identity Bar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Left: School & Program Identity (Click logo 7 for teacher/admin access) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowTeacherLoginModal(true)}
              title="Identitas Sekolah & Akses Panel"
              className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-lg shadow-rose-900/30 font-extrabold text-xl ring-2 ring-white/20 shrink-0 hover:scale-110 active:scale-95 transition-all cursor-pointer group hover:ring-indigo-400 focus:outline-hidden relative overflow-hidden p-0.5"
            >
              {schoolProfile.logoUrl ? (
                <div className="w-full h-full rounded-lg bg-white p-0.5 flex items-center justify-center overflow-hidden">
                  <img
                    src={resolveSchoolLogo(schoolProfile.logoUrl)}
                    alt={schoolProfile.name || 'Logo Sekolah'}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-lg bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-lg">
                  <span className="group-hover:rotate-6 transition-transform">7</span>
                </div>
              )}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-slate-900 animate-pulse" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-rose-400">
                  Kemendikbudristek RI
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400 font-medium">
                  Karakter Generasi Emas
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                {schoolProfile.name ? (
                  <>
                    <span>{schoolProfile.name}</span>
                    <span className="text-[11px] font-normal text-slate-400 hidden sm:inline">
                      (NPSN: {schoolProfile.npsn || '-'})
                    </span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenSchoolAndUserModal) {
                        onOpenSchoolAndUserModal('sekolah');
                      } else {
                        setShowAdminTeacherModal(true);
                      }
                    }}
                    className="text-amber-400 hover:text-amber-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors underline underline-offset-4 cursor-pointer"
                    title="Klik untuk mengisi data sekolah"
                  >
                    <span>Identitas Sekolah Belum Diatur (Klik untuk Mengatur)</span>
                  </button>
                )}
              </h1>
            </div>
          </div>

          {/* Right: Academic Year info badge */}
          <div className="flex items-center gap-2.5 text-xs font-medium text-slate-400">
            <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
              T.A. {schoolProfile.academicYear} · Semester {schoolProfile.semester}
            </span>
          </div>
        </div>
      </header>

      {/* Hero Cover Main Section */}
      <section className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (Headline, Story & Action Entry) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            
            {/* Tagline Banner */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Jurnal Pembiasaan Karakter Positif Pelajar Indonesia</span>
            </div>

            {/* Giant Title */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
                Gerakan <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-amber-400">7 Kebiasaan</span> Anak Indonesia Hebat
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
                Buku jurnal digital untuk memantau, mendokumentasikan dengan foto otentik, memverifikasi pembiasaan disiplin, dan mencetak generasi cerdas berakhlak mulia bersama Sekolah, Guru, serta Orang Tua.
              </p>
            </div>

            {/* Core Stats / Identity Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 sm:p-4 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
              <div className="border-r border-slate-800/80 pr-2">
                <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono">
                  {studentUsers.length > 0 ? studentUsers.length : 520}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Siswa Terdaftar Cloud</div>
              </div>
              <div className="border-r border-slate-800/80 pr-2 pl-2">
                <div className="text-xl sm:text-2xl font-extrabold text-indigo-400 font-mono">12</div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Rombel (Kelas 1–6)</div>
              </div>
              <div className="border-r border-slate-800/80 pr-2 pl-2">
                <div className="text-xl sm:text-2xl font-extrabold text-rose-400 font-mono">100%</div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Foto & Paraf Ortu</div>
              </div>
              <div className="pl-2">
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">Real-Time</div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Terkirim ke Guru</div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 flex-wrap">
              <button
                type="button"
                onClick={handleEnterParent}
                className="group flex items-center justify-center gap-2.5 px-6 py-4 text-base font-bold text-white bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-xl shadow-xl shadow-rose-900/40 hover:shadow-rose-900/60 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <GraduationCap className="w-5 h-5 text-rose-200 group-hover:scale-110 transition-transform" />
                <span>Isi Jurnal Siswa & Ortu</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-4 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <Info className="w-4 h-4 text-amber-400" />
                <span>Panduan</span>
              </button>
            </div>

          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-md mx-auto">
              
              {/* Outer Glow Ring */}
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-rose-600 via-amber-500 to-indigo-600 rounded-3xl opacity-30 blur-lg" />
              
              {/* Main Card Frame */}
              <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-2xl overflow-hidden">
                
                {/* Real Hero Students Photo */}
                <div className="relative h-64 sm:h-72 w-full rounded-xl overflow-hidden bg-slate-800 group">
                  <img
                    src={HERO_STUDENTS_IMG}
                    alt="Siswa-siswi Indonesia Berprestasi G7KAIH"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {/* Floating Hebat Emblem Badge */}
                  <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-amber-500/30 flex items-center gap-2 shadow-lg">
                    <img
                      src={BADGE_EMBLEM_IMG}
                      alt="Emblem Hebat"
                      className="w-8 h-8 rounded-lg object-contain"
                    />
                    <div className="pr-1 text-left">
                      <div className="text-[10px] font-bold text-amber-400 leading-tight">G7KAIH</div>
                      <div className="text-[9px] text-slate-300">Hebat & Tangguh</div>
                    </div>
                  </div>

                  {/* Photo Title Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <div className="text-xs font-semibold text-rose-300">Tahun Ajaran {schoolProfile.academicYear}</div>
                    <div className="text-sm font-bold text-white drop-shadow-md">
                      Membina Generasi Unggul Berkarakter Pancasila
                    </div>
                  </div>
                </div>

                {/* Habit Preview Highlight Inside Frame */}
                <div className="mt-4 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-left">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      Sorotan Kebiasaan #{selectedHabit.order}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      +{selectedHabit.points} Poin Disiplin
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-300 shrink-0">
                      {getHabitIcon(selectedHabit.iconName, 'w-5 h-5')}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{selectedHabit.title}</h4>
                      <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                        {selectedHabit.slogan}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 7 Kebiasaan Interactive Strip Showcase */}
      <section className="relative z-10 bg-slate-900/90 border-t border-b border-slate-800 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-rose-400">
              Kurikulum Karakter
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Tujuh Pilar Kebiasaan Anak Indonesia Hebat
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Klik pada salah satu pilar kebiasaan untuk membaca esensi pembiasaan positif yang ditanamkan setiap hari:
            </p>
          </div>

          {/* Habit Horizontal/Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {G7KAIH_HABITS.map((habit, idx) => {
              const isSelected = idx === selectedHabitIndex;
              return (
                <div
                  key={habit.id}
                  onClick={() => setSelectedHabitIndex(idx)}
                  className={`cursor-pointer text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-b from-rose-950/40 to-slate-900 border-rose-500/80 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/50'
                      : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                      {getHabitIcon(habit.iconName, 'w-4 h-4')}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      Pilar #{habit.order}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{habit.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {habit.slogan}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <span>{habit.suggestedTime}</span>
                    <span className="text-amber-400 font-semibold">+{habit.points} Poin</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Triad Synergy Section (Siswa - Guru - Orang Tua) */}
      <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Bagi Siswa</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Membangun kemandirian, melatih kejujuran lewat foto kegiatan nyata, mengumpulkan poin harian, dan meraih lencana kebanggaan.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Bagi Guru & Sekolah</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Memantau perkembangan karakter kelas secara visual, memberikan umpan balik motivasi, mengimpor/ekspor data siswa via Excel, dan mencetak laporan resmi.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Bagi Orang Tua</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Terlibat langsung dalam pendampingan anak di rumah, memberikan paraf digital harian, dan mempererat ikatan keharmonisan keluarga.
            </p>
          </div>
        </div>
      </section>

      {/* Footer / Copyright & School Info */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            {schoolProfile.logoUrl && (
              <img
                src={resolveSchoolLogo(schoolProfile.logoUrl)}
                alt="Logo Sekolah"
                className="w-5 h-5 object-contain bg-white rounded-sm p-0.5 shrink-0"
              />
            )}
            <span className="font-semibold text-slate-400">
              {schoolProfile.name || 'Lembaga Pendidikan'}
            </span>
            {schoolProfile.principalName && (
              <>
                <span>·</span>
                <span>Kepala Sekolah: {schoolProfile.principalName}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-500 text-[11px] flex-wrap">
            <span>Tahun Ajaran {schoolProfile.academicYear} · Karakter Generasi Emas</span>
            <span className="text-slate-700">·</span>
            <button
              type="button"
              onClick={() => setShowTeacherLoginModal(true)}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Akses Guru & Admin
            </button>
          </div>
        </div>
      </footer>

      {/* Modal Panduan 7 Kebiasaan */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-2xl p-6 text-left shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-rose-400" />
                Panduan Gerakan 7 Kebiasaan
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Gerakan 7 Kebiasaan Anak Indonesia Hebat (G7KAIH) adalah inisiatif pendidikan penguatan karakter (PPK) yang menitikberatkan pada konsistensi tindakan positif sehari-hari:
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {G7KAIH_HABITS.map((h) => (
                <div key={h.id} className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-rose-400">#{h.order}</span>
                    <span>{h.title}</span>
                  </div>
                  <div className="text-slate-300 mt-0.5">{h.description}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-colors"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Login Guru Kelas (Dengan Menu Pilih Guru Kelas) */}
      {showTeacherLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 max-w-2xl w-full rounded-2xl p-5 sm:p-7 text-left shadow-2xl relative space-y-5 my-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Login Guru Kelas</span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                      G7KAIH
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pilih nama guru kelas untuk masuk dan memantau jurnal harian siswa
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTeacherLoginModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Kolom Login dengan Menu Pilih Guru Kelas Saja */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-indigo-500/40 space-y-3 shadow-inner">
              <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Pilih Guru Kelas:
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <select
                    aria-label="Pilih Guru Kelas"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full text-xs sm:text-sm font-bold py-3.5 pl-4 pr-10 rounded-xl bg-slate-800/95 border-2 border-indigo-500/60 text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-md appearance-none"
                  >
                    {teacherUsers.map((teacher, idx) => {
                      const cls = classes.find((c) => c.id === teacher.classId);
                      const classNameStr = cls?.name || `Kelas ${idx + 1}`;
                      return (
                        <option key={teacher.id} value={teacher.id} className="bg-slate-900 text-white py-2">
                          {teacher.name} - {classNameStr}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const teacher = teacherUsers.find((t) => t.id === selectedTeacherId) || teacherUsers[0];
                    if (teacher) handleSelectTeacherAndEnter(teacher);
                  }}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-xs sm:text-sm font-bold text-white shadow-md transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Footer with Admin Option */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={() => handleEnterAdminOrTeacher('admin')}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Masuk sebagai Admin Sekolah</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTeacherLoginModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Akses Admin / Opsi Guru Lainnya */}
      {showAdminTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700/80 max-w-lg w-full rounded-2xl p-6 sm:p-7 text-left shadow-2xl relative space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shrink-0">
                  7
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Akses Guru & Admin Sekolah
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Masuk untuk memantau laporan, verifikasi kegiatan, dan manajemen kelas:
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAdminTeacherModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Teacher & Admin Options */}
            <div className="space-y-3">
              
              {/* Option 1: Guru / Wali Kelas */}
              <button
                type="button"
                onClick={() => {
                  setShowAdminTeacherModal(false);
                  setShowTeacherLoginModal(true);
                }}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 hover:from-indigo-900/50 hover:to-slate-800/80 border border-indigo-500/40 hover:border-indigo-400 transition-all text-left flex items-center justify-between group cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Guru / Wali Kelas</h4>
                      <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        12 Guru Kelas
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Pilih Guru Kelas untuk memantau jurnal
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              {/* Option 2: Admin Sekolah */}
              <button
                type="button"
                onClick={() => handleEnterAdminOrTeacher('admin')}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-slate-900 hover:from-amber-900/40 hover:to-slate-800/80 border border-amber-500/40 hover:border-amber-400 transition-all text-left flex items-center justify-between group cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Admin Sekolah</h4>
                      <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Manajemen
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {adminUser?.name || 'Administrator'} · Profil sekolah & kelola data
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

            </div>

            <div className="text-center text-[11px] text-slate-500 pt-1">
              Khusus Bapak/Ibu Guru dan Tenaga Pendidik {schoolProfile.name || 'Sekolah'}
            </div>

          </div>
        </div>
      )}

      {/* Modal Pendaftaran Siswa Pertama Kali dari Rumah */}
      {showRegisterStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700/80 p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Daftarkan Nama Ananda
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mulai mengisi jurnal 7 Kebiasaan dari rumah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterStudentModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAndEnterStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Lengkap Siswa / Murid:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Farhan"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pilih Kelas:
                </label>
                <select
                  value={newStudentClassId}
                  onChange={(e) => setNewStudentClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 leading-relaxed">
                Data jurnal dan bukti foto yang diisi dari rumah akan langsung otomatis terhubung ke akun guru kelas.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterStudentModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newStudentName.trim()}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-xs font-bold text-white shadow-md disabled:opacity-50 cursor-pointer"
                >
                  Mulai Jurnal Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Login & Pilih Siswa */}
      <StudentLoginModal
        isOpen={showStudentLoginModal}
        onClose={() => setShowStudentLoginModal(false)}
        classes={classes}
        schoolProfile={schoolProfile}
        onSelectStudent={(student) => {
          onUserChange(student);
          onEnterApp('jurnal');
        }}
      />
    </div>
  );
};
