import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  User, 
  DailyJournal, 
  HabitDefinition, 
  HabitItemData, 
  PhotoProof,
  BadgeAchievement 
} from '../types';
import { G7KAIH_HABITS, HERO_STUDENTS_IMG, BADGE_EMBLEM_IMG } from '../data/seedData';
import { StorageService } from '../services/storage';
import { HabitFormModal } from './HabitFormModal';
import { ParentEndorsementModal } from './ParentEndorsementModal';
import { 
  Sunrise, 
  HeartHandshake, 
  Activity, 
  Utensils, 
  BookOpen, 
  Users, 
  Moon, 
  CheckCircle2, 
  Clock, 
  Camera, 
  Flame, 
  Star, 
  MessageSquare, 
  Stamp, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  AlertCircle,
  UserCheck,
  Check,
  LogOut,
  X,
  RotateCcw
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
  date: string;
  journal: DailyJournal;
  onUpdateJournal: (journal: DailyJournal) => void;
  onViewPhoto: (photo: PhotoProof, habitTitle: string) => void;
  onOpenExportModal: () => void;
  onUserChange?: (user: User) => void;
  onLogoutStudent?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  date,
  journal,
  onUpdateJournal,
  onViewPhoto,
  onOpenExportModal,
  onUserChange,
  onLogoutStudent,
}) => {
  const [selectedHabitForEdit, setSelectedHabitForEdit] = useState<HabitDefinition | null>(null);
  const [isParentModalOpen, setIsParentModalOpen] = useState<boolean>(false);
  const [isConfirmingCancelOnCard, setIsConfirmingCancelOnCard] = useState<boolean>(false);
  const [lastSavedNotice, setLastSavedNotice] = useState<string | null>(null);

  // Real-time cloud sync listener
  const [, setSyncTick] = useState<number>(0);
  useEffect(() => {
    const handleSync = () => {
      setSyncTick((t) => t + 1);
    };
    window.addEventListener('g7kaih_cloud_journals_synced', handleSync);
    window.addEventListener('g7kaih_cloud_users_synced', handleSync);
    return () => {
      window.removeEventListener('g7kaih_cloud_journals_synced', handleSync);
      window.removeEventListener('g7kaih_cloud_users_synced', handleSync);
    };
  }, []);

  const allUsers = StorageService.getUsers();
  const studentUsers = allUsers.filter((u) => u.role === 'siswa');

  // State untuk Paraf dan Catatan Pendampingan Orang Tua (tergabung dengan akun siswa)
  const [parentNotes, setParentNotes] = useState<string>(
    journal.parentEndorsement?.parentNotes || ''
  );
  const isPhone = (str?: string) => {
    if (!str) return false;
    const cleaned = str.replace(/[\s\-\+\(\)\.]/g, '');
    return cleaned.length >= 8 && /^\d+$/.test(cleaned);
  };

  const getCleanParentName = (endorsedName?: string, currentParentName?: string) => {
    if (endorsedName && !isPhone(endorsedName)) return endorsedName;
    if (currentParentName && !isPhone(currentParentName)) return currentParentName;
    return '';
  };

  const [parentName, setParentName] = useState<string>(() =>
    getCleanParentName(journal.parentEndorsement?.parentName, currentUser.parentName)
  );
  const [hasEndorsed, setHasEndorsed] = useState<boolean>(
    journal.parentEndorsement?.endorsed || false
  );

  useEffect(() => {
    setParentNotes(journal.parentEndorsement?.parentNotes || '');
    setParentName(getCleanParentName(journal.parentEndorsement?.parentName, currentUser.parentName));
    setHasEndorsed(journal.parentEndorsement?.endorsed || false);
    setIsConfirmingCancelOnCard(false);
  }, [journal.studentId, journal.date, journal.parentEndorsement?.endorsed, journal.parentEndorsement?.parentNotes, journal.parentEndorsement?.parentName, currentUser.parentName]);

  const handleParentEndorse = () => {
    const targetStudentId = journal.studentId || currentUser.id;
    const finalParentName = parentName.trim() || 'Orang Tua / Wali';
    const finalNotes = parentNotes.trim() || 'Alhamdulillah, ananda telah menyelesaikan pembiasaan hari ini dengan baik.';
    const updatedJournal = StorageService.endorseJournalByParent(targetStudentId, date, {
      endorsed: true,
      endorsedByParentId: currentUser.id,
      parentName: finalParentName,
      endorsedAt: new Date().toISOString(),
      parentNotes: finalNotes,
      signatureStamp: `PARAF-${finalParentName.toUpperCase().replace(/\s+/g, '_')}-${new Date().toLocaleDateString('id-ID')}`,
    });

    setHasEndorsed(true);
    onUpdateJournal(updatedJournal);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Fallback
    }
  };

  const handleCancelParentEndorsement = () => {
    const targetStudentId = journal.studentId || currentUser.id;
    const updatedJournal = StorageService.cancelParentEndorsement(targetStudentId, date);
    setHasEndorsed(false);
    setParentNotes('');
    setParentName(currentUser.parentName || '');
    onUpdateJournal(updatedJournal);
    setLastSavedNotice(`Paraf orang tua untuk tanggal ${date} berhasil dibatalkan dan disinkronkan ke Rekap Laporan.`);
    setTimeout(() => {
      setLastSavedNotice(null);
    }, 4000);
  };

  const streak = StorageService.getStudentStreak(currentUser.id);
  const badges = StorageService.getBadges();
  const completedCount = journal.completedHabitsCount;
  const progressPercent = Math.round((completedCount / 7) * 100);

  // Icon mapping
  const renderHabitIcon = (iconName: string, className: string = 'w-6 h-6') => {
    switch (iconName) {
      case 'Sunrise':
        return <Sunrise className={className} />;
      case 'HeartHandshake':
        return <HeartHandshake className={className} />;
      case 'Activity':
        return <Activity className={className} />;
      case 'Utensils':
        return <Utensils className={className} />;
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

  const handleSaveHabit = (habitData: HabitItemData) => {
    if (!selectedHabitForEdit) return;
    const updatedJournal = StorageService.saveHabitEntry(
      currentUser.id,
      date,
      selectedHabitForEdit.id,
      habitData
    );
    onUpdateJournal(updatedJournal);
    setSelectedHabitForEdit(null);
    setLastSavedNotice('✓ Jawaban kebiasaan berhasil disimpan di Cloud & langsung terkirim ke laporan guru!');
    setTimeout(() => {
      setLastSavedNotice(null);
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifikasi Tersimpan di Cloud */}
      {lastSavedNotice && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-900/20 border border-emerald-500 flex items-center justify-between text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>{lastSavedNotice}</span>
          </div>
          <button
            onClick={() => setLastSavedNotice(null)}
            className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Banner & Motivational Intro */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-xl">
        <div className="absolute inset-0 opacity-15 mix-blend-overlay">
          <img
            src={HERO_STUDENTS_IMG}
            alt="Anak Indonesia Hebat"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
              {StorageService.getSchoolProfile().logoUrl ? (
                <img
                  src={StorageService.getSchoolProfile().logoUrl}
                  alt="Logo Sekolah"
                  className="w-4 h-4 object-contain rounded-xs bg-white/90 p-0.5 shrink-0"
                />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shrink-0" />
              )}
              <span className="truncate max-w-xs sm:max-w-md">
                {StorageService.getSchoolProfile().name ? `${StorageService.getSchoolProfile().name} · G7KAIH` : 'Gerakan 7 Kebiasaan Anak Indonesia Hebat'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Halo, {currentUser.name}!
            </h1>
            <p className="text-sm sm:text-base text-rose-100 font-medium">
              Ayo isi jurnal kebiasaan baikmu hari ini, unggah foto bukti kegiatan, dan jadilah generasi emas Indonesia yang berkarakter kuat!
            </p>
          </div>

          {/* Quick Stat Pill Cards */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 text-center min-w-[100px]">
              <div className="flex items-center justify-center gap-1 text-amber-300 font-bold text-xs mb-1">
                <Flame className="w-4 h-4 fill-amber-300" />
                <span>Streak</span>
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums">
                {streak}
              </span>
              <span className="text-[10px] text-white/80 block mt-0.5">Hari Berturut</span>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 text-center min-w-[100px]">
              <div className="flex items-center justify-center gap-1 text-yellow-300 font-bold text-xs mb-1">
                <Star className="w-4 h-4 fill-yellow-300" />
                <span>Poin</span>
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums">
                {journal.totalPoints}
              </span>
              <span className="text-[10px] text-white/80 block mt-0.5">Poin Hari Ini</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Progress Tracker Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Progres 7 Kebiasaan Hari Ini
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {completedCount}/7 Selesai
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Terhubung ke Guru
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {completedCount === 7
                ? 'Luar biasa! Seluruh 7 kebiasaan telah kamu selesaikan hari ini.'
                : `Masih ada ${7 - completedCount} kebiasaan yang bisa kamu selesaikan sebelum tidur.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Guru Validation Card */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">
                Verifikasi Guru: {journal.teacherVerification.status === 'verified' ? (
                  <span className="text-emerald-600 font-bold">Disetujui ✓</span>
                ) : journal.teacherVerification.status === 'needs_revision' ? (
                  <span className="text-amber-600 font-bold">Perlu Perbaikan</span>
                ) : (
                  <span className="text-slate-500">Menunggu Peninjauan</span>
                )}
              </span>
              {journal.teacherVerification.teacherComment ? (
                <p className="text-slate-600 mt-1 italic">
                  &quot;{journal.teacherVerification.teacherComment}&quot;
                </p>
              ) : (
                <p className="text-slate-400 mt-0.5">Guru wali kelas akan memvalidasi bukti jurnal harianmu.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 7 Habit Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-full">
            <h2 className="text-lg font-bold text-slate-900">
              Daftar 7 Kebiasaan Harian
            </h2>
            <p className="text-xs text-slate-500">
              Ketuk tombol pada setiap kebiasaan untuk mengisi data dan mengunggah foto bukti.
            </p>

            {/* Menu Pilih Siswa Pindah di Bawah Ketuk Tombol pada Setiap Kebiasaan - Khusus Data Murid Saja */}
            {onUserChange && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-rose-50/80 via-white to-amber-50/60 p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-rose-100 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                      Pilih Murid / Siswa:
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Ganti siswa untuk melihat dan mengisi jurnal pembiasaan hari ini
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    aria-label="Pilih Siswa"
                    value={currentUser.id}
                    onChange={(e) => {
                      const selected = studentUsers.find((u) => u.id === e.target.value);
                      if (selected && onUserChange) {
                        StorageService.setActiveUserId(selected.id);
                        onUserChange(selected);
                      }
                    }}
                    className="w-full sm:w-auto pl-3 pr-8 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 hover:border-rose-400 rounded-xl cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-rose-500 shadow-2xs transition-all"
                  >
                    {studentUsers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.nisn ? `· NISN: ${s.nisn}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {G7KAIH_HABITS.map((habit) => {
            const entry = journal.habits[habit.id];
            const isDone = entry?.completed;
            const photoCount = entry?.photos?.length || 0;

            return (
              <div
                key={habit.id}
                className={`flex flex-col justify-between rounded-2xl p-5 border transition-all h-full ${
                  isDone
                    ? 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-500/10'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex-1 flex flex-col">
                  {/* Card Top: Order Badge, Title, Status */}
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${habit.bgLight} ${habit.textColor} flex items-center justify-center shrink-0`}>
                        {renderHabitIcon(habit.iconName, 'w-5 h-5')}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 leading-snug truncate">
                          {habit.title}
                        </h3>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{habit.suggestedTime}</span>
                        </span>
                      </div>
                    </div>

                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selesai</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        Belum
                      </span>
                    )}
                  </div>

                  {/* Slogan */}
                  <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] mb-3">
                    {habit.slogan}
                  </p>

                  {/* Content Area: Summary of Filled Data OR Placeholder */}
                  {isDone ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 mb-3 space-y-1 min-h-[58px] flex flex-col justify-center">
                      {habit.id === 'bangun_pagi' && (
                        <p className="truncate"><strong>Jam Bangun:</strong> {entry?.wakeTime || '05:00'} ({entry?.wakeCondition || 'Segar'})</p>
                      )}
                      {habit.id === 'beribadah' && (
                        <p className="truncate"><strong>Ibadah:</strong> {entry?.worshipType || 'Sholat / Doa'}</p>
                      )}
                      {habit.id === 'berolahraga' && (
                        <p className="truncate"><strong>Olahraga:</strong> {entry?.sportType || 'Senam'} ({entry?.sportDurationMinutes || 20} mnt)</p>
                      )}
                      {habit.id === 'makan_sehat' && (
                        <p className="truncate"><strong>Menu:</strong> {entry?.menuDescription || '4 Sehat 5 Sempurna'}</p>
                      )}
                      {habit.id === 'gemar_belajar' && (
                        <p className="truncate"><strong>Belajar:</strong> {entry?.subjectOrBook || 'Buku Pelajaran'} ({entry?.studyDurationMinutes || 30} mnt)</p>
                      )}
                      {habit.id === 'bermasyarakat' && (
                        <p className="truncate"><strong>Aksi:</strong> {entry?.socialActivity || 'Gotong royong'}</p>
                      )}
                      {habit.id === 'tidur_cepat' && (
                        <p className="truncate"><strong>Jam Tidur:</strong> {entry?.sleepTime || '21:00'} WIB</p>
                      )}
                      {entry?.notes && (
                        <p className="text-slate-500 text-[11px] truncate">Catatan: {entry.notes}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50/70 border border-dashed border-slate-200 text-xs text-slate-400 mb-3 flex items-center gap-2 min-h-[58px]">
                      <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span className="text-[11px] leading-tight text-slate-500">Belum diisi. Ketuk tombol untuk mengisi bukti.</span>
                    </div>
                  )}

                  {/* Photo Thumbnail Strip if photos exist */}
                  {photoCount > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
                        <span>Bukti Foto ({photoCount})</span>
                        <span className="text-emerald-600">Terverifikasi EXIF ✓</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {entry?.photos.map((photo) => (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => onViewPhoto(photo, habit.title)}
                            className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0 group hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            <img
                              src={photo.url}
                              alt={photo.fileName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Big Action Button Pinned to Bottom */}
                <button
                  type="button"
                  onClick={() => setSelectedHabitForEdit(habit)}
                  className={`w-full mt-auto py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isDone
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : `${habit.badgeBg} hover:opacity-95 text-white shadow-xs`
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>{isDone ? 'Perbarui Bukti / Ubah' : `Isi Bukti ${habit.shortTitle}`}</span>
                </button>
              </div>
            );
          })}

          {/* Card 8: Paraf & Catatan Orang Tua (Disimpan di sebelah menu Tidur Cepat) */}
          <div
            id="paraf-catatan-orang-tua"
            className={`flex flex-col justify-between rounded-2xl p-5 border transition-all h-full ${
              hasEndorsed
                ? 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-500/10'
                : completedCount > 0
                ? 'bg-gradient-to-br from-white via-white to-emerald-50/50 border-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex-1 flex flex-col">
              {/* Card Top: Order Badge, Title, Status */}
              <div className="flex items-start justify-between gap-2.5 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Stamp className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug truncate">
                      Paraf & Catatan Orang Tua
                    </h3>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <HeartHandshake className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">Pendampingan di Rumah</span>
                    </span>
                  </div>
                </div>

                {hasEndorsed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sudah Diparaf</span>
                  </span>
                ) : completedCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                    <span>Siap Diparaf</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                    Belum
                  </span>
                )}
              </div>

              {/* Slogan */}
              <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] mb-3">
                Apresiasi, doa, dan paraf pengesahan dari orang tua setelah ananda mengisi jurnal harian.
              </p>

              {/* Summary / Content Box */}
              {hasEndorsed ? (
                <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-slate-700 mb-3 space-y-1 min-h-[58px] flex flex-col justify-center">
                  <div className="flex items-center justify-between text-emerald-900 font-bold text-[11px]">
                    <span className="flex items-center gap-1 truncate">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{journal.parentEndorsement?.parentName || parentName}</span>
                    </span>
                    <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                      TERVERIFIKASI ✓
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] italic line-clamp-1">
                    &quot;{journal.parentEndorsement?.parentNotes || parentNotes}&quot;
                  </p>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50/70 border border-dashed border-slate-200 text-xs text-slate-500 mb-3 space-y-0.5 min-h-[58px] flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px]">
                    <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{completedCount > 0 ? `Siap Diparaf (${completedCount}/7 Selesai)` : 'Menunggu Jurnal Diisi'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 leading-tight">
                    {completedCount > 0 ? 'Beri apresiasi & tanda tangan digital orang tua.' : 'Orang tua memaraf setelah kebiasaan 1–7 diisi.'}
                  </p>
                </div>
              )}
            </div>

            {/* Tombol Beri Paraf & Batal Paraf Pinned to Bottom */}
            {hasEndorsed ? (
              isConfirmingCancelOnCard ? (
                <div className="mt-auto p-3 rounded-xl bg-rose-50 border border-rose-300 space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <RotateCcw className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-rose-950 leading-snug">
                      Yakin batalkan paraf orang tua tanggal {date}?
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingCancelOnCard(false)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCancelParentEndorsement();
                        setIsConfirmingCancelOnCard(false);
                      }}
                      className="px-3 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Ya, Batalkan</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsParentModalOpen(true)}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 border border-emerald-200"
                  >
                    <Stamp className="w-3.5 h-3.5" />
                    <span className="truncate">Ubah Catatan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingCancelOnCard(true)}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 shadow-2xs"
                    title="Batalkan status paraf orang tua"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span className="truncate">Batal Paraf</span>
                  </button>
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={() => setIsParentModalOpen(true)}
                className="w-full mt-auto py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs"
              >
                <Stamp className="w-4 h-4" />
                <span>Beri Paraf Orang Tua ✓</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Achievement & Badges Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Star className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Lencana Prestasi Kebiasaan
              </h2>
              <p className="text-xs text-slate-500">
                Raih lencana penghargaan atas konsistensimu menjalankan Gerakan 7 Kebiasaan!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`flex flex-col items-center text-center p-3.5 rounded-xl border transition-all ${
                badge.unlocked
                  ? 'bg-amber-50/60 border-amber-200 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 opacity-50 grayscale'
              }`}
            >
              <div className="text-3xl mb-1.5">{badge.icon}</div>
              <span className="text-xs font-bold text-slate-800 block leading-tight">
                {badge.name}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                {badge.description}
              </span>
              {badge.unlocked && (
                <span className="mt-2 text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-sm">
                  Diraih ✓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Habit Modal */}
      {selectedHabitForEdit && (
        <HabitFormModal
          habit={selectedHabitForEdit}
          initialData={journal.habits[selectedHabitForEdit.id]}
          date={date}
          isOpen={true}
          onClose={() => setSelectedHabitForEdit(null)}
          onSave={handleSaveHabit}
          isSeventhHabitPending={completedCount === 6 && !journal.habits[selectedHabitForEdit.id]?.completed}
        />
      )}

      {/* Parent Endorsement Modal */}
      {isParentModalOpen && (
        <ParentEndorsementModal
          isOpen={true}
          onClose={() => setIsParentModalOpen(false)}
          currentUser={currentUser}
          date={date}
          journal={journal}
          onSaveEndorsement={(savedParentName, savedParentNotes, shouldLogout) => {
            setParentName(savedParentName);
            setParentNotes(savedParentNotes);
            const targetStudentId = journal.studentId || currentUser.id;
            const updatedJournal = StorageService.endorseJournalByParent(targetStudentId, date, {
              endorsed: true,
              endorsedByParentId: currentUser.id,
              parentName: savedParentName,
              endorsedAt: new Date().toISOString(),
              parentNotes: savedParentNotes,
              signatureStamp: `PARAF-${savedParentName.toUpperCase().replace(/\s+/g, '_')}-${new Date().toLocaleDateString('id-ID')}`,
            });
            setHasEndorsed(true);
            onUpdateJournal(updatedJournal);
            if (shouldLogout && onLogoutStudent) {
              onLogoutStudent();
            }
          }}
          onCancelEndorsement={(updated) => {
            const targetStudentId = journal.studentId || currentUser.id;
            const updatedJ = updated || StorageService.cancelParentEndorsement(targetStudentId, date);
            setHasEndorsed(false);
            setParentNotes('');
            setParentName(currentUser.parentName || '');
            onUpdateJournal(updatedJ);
            setLastSavedNotice(`Paraf orang tua untuk tanggal ${date} berhasil dibatalkan dan disinkronkan ke Rekap Laporan.`);
            setTimeout(() => {
              setLastSavedNotice(null);
            }, 4000);
            setIsParentModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
