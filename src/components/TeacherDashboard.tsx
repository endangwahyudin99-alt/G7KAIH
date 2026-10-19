import React, { useState, useEffect } from 'react';
import { 
  User, 
  DailyJournal, 
  PhotoProof, 
  SchoolClass,
  HabitId
} from '../types';
import { G7KAIH_HABITS } from '../data/seedData';
import { StorageService } from '../services/storage';
import { CloudSyncService } from '../services/cloudSync';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Star, 
  Calendar, 
  CheckSquare, 
  Search, 
  GraduationCap, 
  X,
  RefreshCw,
  Stamp,
  Check,
  RotateCcw,
  HeartHandshake
} from 'lucide-react';

interface TeacherDashboardProps {
  currentUser: User;
  date: string;
  onViewPhoto: (photo: PhotoProof, habitTitle: string) => void;
  onOpenExportModal: () => void;
  onNavigateToStudents?: () => void;
  onOpenSchoolAndUserModal?: () => void;
  onOpenBackupRestoreModal?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  date,
  onViewPhoto,
  onOpenExportModal,
  onNavigateToStudents,
  onOpenSchoolAndUserModal,
  onOpenBackupRestoreModal,
}) => {
  const classes = StorageService.getClasses();
  const allUsers = StorageService.getUsers();
  const [selectedClassId, setSelectedClassId] = useState<string>(() => currentUser.classId || classes[0].id);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser.classId) {
      setSelectedClassId(currentUser.classId);
    }
  }, [currentUser.classId]);

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'partial' | 'empty' | 'endorsed' | 'unendorsed'>('all');

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await CloudSyncService.refreshAllFromCloud();
    } finally {
      setIsRefreshing(false);
    }
  };
  
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

  // Student inspection modal
  const [inspectedStudent, setInspectedStudent] = useState<User | null>(null);
  const [teacherComment, setTeacherComment] = useState<string>('');
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [isConfirmingCancelParent, setIsConfirmingCancelParent] = useState<boolean>(false);

  const students = StorageService.getStudentsByClass(selectedClassId);
  const journals = StorageService.getJournals();

  // Statistics calculation
  const totalStudents = students.length;
  let filledTodayCount = 0;
  let complete7Count = 0;
  let pendingVerifyCount = 0;
  let parentEndorsedCount = 0;

  students.forEach((s) => {
    const j = journals[StorageService.getJournalKey(s.id, date)];
    if (j && j.completedHabitsCount > 0) {
      filledTodayCount++;
      if (j.completedHabitsCount === 7) complete7Count++;
      if (j.teacherVerification.status === 'pending') pendingVerifyCount++;
    }
    if (j && j.parentEndorsement?.endorsed) {
      parentEndorsedCount++;
    }
  });

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nisn && s.nisn.includes(searchQuery));

    const j = journals[StorageService.getJournalKey(s.id, date)];
    const completed = j ? j.completedHabitsCount : 0;
    const parentEndorsed = !!j?.parentEndorsement?.endorsed;

    let matchesStatus = true;
    if (statusFilter === 'complete') matchesStatus = completed === 7;
    else if (statusFilter === 'partial') matchesStatus = completed > 0 && completed < 7;
    else if (statusFilter === 'empty') matchesStatus = completed === 0;
    else if (statusFilter === 'endorsed') matchesStatus = parentEndorsed;
    else if (statusFilter === 'unendorsed') matchesStatus = !parentEndorsed;

    return matchesSearch && matchesStatus;
  });

  const handleOpenInspect = (student: User) => {
    setInspectedStudent(student);
    setIsConfirmingCancelParent(false);
    const j = journals[StorageService.getJournalKey(student.id, date)];
    if (j?.teacherVerification?.teacherComment) {
      setTeacherComment(j.teacherVerification.teacherComment);
    } else {
      setTeacherComment('Bagus sekali! Seluruh kebiasaan sudah dilakukan dengan baik.');
    }
    setRatingStars(j?.teacherVerification?.ratingStars || 5);
  };

  const handleVerifyJournal = (status: 'verified' | 'needs_revision') => {
    if (!inspectedStudent) return;
    StorageService.verifyJournalByTeacher(inspectedStudent.id, date, {
      status,
      verifiedByTeacherId: currentUser.id,
      teacherName: currentUser.name,
      verifiedAt: new Date().toISOString(),
      teacherComment,
      ratingStars: status === 'verified' ? ratingStars : undefined,
    });
    setInspectedStudent(null);
  };

  const inspectedJournal = inspectedStudent
    ? StorageService.getOrCreateJournal(inspectedStudent.id, date)
    : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                Guru Kelas
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Terhubung Cloud Real-Time
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                {StorageService.getSchoolProfile().logoUrl && (
                  <img
                    src={StorageService.getSchoolProfile().logoUrl}
                    alt="Logo Sekolah"
                    className="w-3.5 h-3.5 object-contain"
                  />
                )}
                <span>{StorageService.getSchoolProfile().name || currentUser.schoolName || 'Lembaga Pendidikan'}</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Pemantauan Jurnal · {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Validasi pembiasaan harian siswa, periksa bukti foto, dan beri apresiasi bimbingan.
            </p>
          </div>

          {/* Class Switcher & Cloud Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Pilihan Rombel / Kelas */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Rombel:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {classes.map((c) => {
                  const studentCount = allUsers.filter((u) => u.role === 'siswa' && u.classId === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({studentCount} siswa)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Tombol Segarkan Cloud */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              title="Segarkan data terbaru dari Cloud Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Menyinkronkan...' : 'Segarkan Cloud'}</span>
            </button>
          </div>
        </div>

        {/* 5 Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Total Siswa Kelas</span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
              {totalStudents}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Siswa terdaftar</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Mengisi Hari Ini</span>
            <span className="text-2xl font-extrabold font-mono text-indigo-600 tabular-nums">
              {filledTodayCount} <span className="text-xs text-slate-400">/ {totalStudents}</span>
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {totalStudents ? Math.round((filledTodayCount / totalStudents) * 100) : 0}% partisipasi
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Lengkap 7 Kebiasaan</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-600 tabular-nums">
              {complete7Count}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">Target sempurna</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-xs text-emerald-800 font-medium block">Paraf Orang Tua</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-700 tabular-nums">
              {parentEndorsedCount} <span className="text-xs text-emerald-600/70">/ {totalStudents}</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              {totalStudents ? Math.round((parentEndorsedCount / totalStudents) * 100) : 0}% telah diparaf
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-500 font-medium block">Menunggu Verifikasi</span>
            <span className="text-2xl font-extrabold font-mono text-amber-600 tabular-nums">
              {pendingVerifyCount}
            </span>
            <span className="text-[10px] text-amber-600 font-medium block mt-0.5">Perlu ditinjau guru</span>
          </div>
        </div>
      </div>

      {/* Filter and Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa atau NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Interactive filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({totalStudents})
            </button>
            <button
              onClick={() => setStatusFilter('complete')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'complete'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lengkap 7/7
            </button>
            <button
              onClick={() => setStatusFilter('endorsed')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'endorsed'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diparaf Ortu ({parentEndorsedCount})
            </button>
            <button
              onClick={() => setStatusFilter('unendorsed')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'unendorsed'
                  ? 'bg-white text-rose-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Belum Diparaf ({totalStudents - parentEndorsedCount})
            </button>
            <button
              onClick={() => setStatusFilter('partial')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'partial'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sebagian
            </button>
            <button
              onClick={() => setStatusFilter('empty')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'empty'
                  ? 'bg-white text-red-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Belum Isi
            </button>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Nama Siswa & NISN</th>
                <th className="py-3 px-4">Progres 7 Kebiasaan</th>
                <th className="py-3 px-4">Poin & Streak</th>
                <th className="py-3 px-4">Paraf Ortu</th>
                <th className="py-3 px-4">Status Guru</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const j = journals[StorageService.getJournalKey(student.id, date)];
                const completed = j ? j.completedHabitsCount : 0;
                const points = j ? j.totalPoints : 0;
                const streak = StorageService.getStudentStreak(student.id);
                const verificationStatus = j?.teacherVerification?.status || 'pending';
                const parentEndorsed = j?.parentEndorsement?.endorsed;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-9 h-9 rounded-full bg-slate-200 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {student.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            NISN: {student.nisn || '-'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 tabular-nums">
                          {completed}/7
                        </span>
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              completed === 7
                                ? 'bg-emerald-500'
                                : completed >= 4
                                ? 'bg-amber-500'
                                : 'bg-red-400'
                            }`}
                            style={{ width: `${(completed / 7) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 font-bold font-mono tabular-nums">
                          ⭐ {points}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-rose-600 font-medium font-mono tabular-nums">
                          🔥 {streak}h
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {parentEndorsed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full">
                          Sudah Diparaf ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          Belum Diparaf
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {verificationStatus === 'verified' ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-sm">
                          Disetujui
                        </span>
                      ) : verificationStatus === 'needs_revision' ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-sm">
                          Revisi
                        </span>
                      ) : completed > 0 ? (
                        <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-sm">
                          Perlu Ditinjau
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenInspect(student)}
                        className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        Periksa Jurnal
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-12 px-4 text-center">
                  <div className="max-w-sm mx-auto space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">
                      Belum Ada Siswa di Kelas Ini
                    </h4>
                    <p className="text-xs text-slate-400">
                      Data siswa dan jurnal telah dibersihkan. Anda dapat menambahkan siswa baru atau mengimpor data rombel melalui menu Kelola Siswa.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Student Inspection Modal */}
      {inspectedStudent && inspectedJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <img
                  src={inspectedStudent.avatar}
                  alt={inspectedStudent.name}
                  className="w-10 h-10 rounded-full bg-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    Jurnal: {inspectedStudent.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    NISN: {inspectedStudent.nisn} · Tanggal: {date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Journal inspection */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {G7KAIH_HABITS.map((habit) => {
                  const entry = inspectedJournal.habits[habit.id];
                  const isDone = entry?.completed;
                  const photoCount = entry?.photos?.length || 0;

                  return (
                    <div
                      key={habit.id}
                      className={`p-3.5 rounded-xl border text-xs ${
                        isDone ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-800">
                          {habit.title}
                        </span>
                        {isDone ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                            Selesai ✓
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Belum</span>
                        )}
                      </div>

                      {isDone ? (
                        <div className="space-y-1 text-slate-600">
                          {habit.id === 'bangun_pagi' && (
                            <p>Bangun pukul {entry?.wakeTime} ({entry?.wakeCondition})</p>
                          )}
                          {habit.id === 'beribadah' && (
                            <p>{entry?.worshipType} ({entry?.worshipTime})</p>
                          )}
                          {habit.id === 'berolahraga' && (
                            <p>{entry?.sportType} ({entry?.sportDurationMinutes} mnt)</p>
                          )}
                          {habit.id === 'makan_sehat' && (
                            <p>{entry?.menuDescription}</p>
                          )}
                          {habit.id === 'gemar_belajar' && (
                            <p>{entry?.subjectOrBook} ({entry?.studyDurationMinutes} mnt)</p>
                          )}
                          {habit.id === 'bermasyarakat' && (
                            <p>{entry?.socialActivity}</p>
                          )}
                          {habit.id === 'tidur_cepat' && (
                            <p>Tidur pukul {entry?.sleepTime}</p>
                          )}

                          {/* Photos */}
                          {photoCount > 0 && (
                            <div className="pt-2 flex items-center gap-2">
                              {entry?.photos.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => onViewPhoto(p, habit.title)}
                                  className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 hover:opacity-80"
                                >
                                  <img
                                    src={p.url}
                                    alt={p.fileName}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">Belum ada catatan.</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Parent Endorsement Status Card */}
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                inspectedJournal.parentEndorsement?.endorsed
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stamp className={`w-4 h-4 ${inspectedJournal.parentEndorsement?.endorsed ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span className="font-bold text-slate-800">
                      Paraf & Catatan Orang Tua
                    </span>
                  </div>
                  {inspectedJournal.parentEndorsement?.endorsed ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                      Sudah Diparaf ✓
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      Belum Diparaf
                    </span>
                  )}
                </div>

                {inspectedJournal.parentEndorsement?.endorsed ? (
                  <div className="space-y-1.5 pt-1 border-t border-emerald-200/80 text-emerald-950">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Diparaf oleh: <strong>{inspectedJournal.parentEndorsement.parentName || 'Orang Tua / Wali'}</strong></span>
                      <span className="font-mono text-[9px] bg-emerald-200/80 px-1.5 py-0.5 rounded font-bold">
                        {inspectedJournal.parentEndorsement.signatureStamp || 'SAH'}
                      </span>
                    </div>
                    {inspectedJournal.parentEndorsement.parentNotes && (
                      <p className="text-[11px] text-slate-700 italic bg-white/80 p-2 rounded-lg border border-emerald-100">
                        &quot;{inspectedJournal.parentEndorsement.parentNotes}&quot;
                      </p>
                    )}
                    {isConfirmingCancelParent ? (
                      <div className="mt-2 p-3 bg-rose-50 border border-rose-300 rounded-xl space-y-2 animate-in fade-in">
                        <div className="flex items-start gap-2">
                          <RotateCcw className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] font-bold text-rose-950 leading-snug">
                            Batalkan paraf orang tua untuk siswa <strong>{inspectedStudent.name}</strong> pada tanggal <strong>{date}</strong>? Status di Rekap Laporan akan otomatis kembali menjadi &quot;Belum Diparaf&quot;.
                          </p>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-200">
                          <button
                            type="button"
                            onClick={() => setIsConfirmingCancelParent(false)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              StorageService.cancelParentEndorsement(inspectedStudent.id, date);
                              setIsConfirmingCancelParent(false);
                            }}
                            className="px-3 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Ya, Batalkan Paraf</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsConfirmingCancelParent(true)}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Batalkan status paraf orang tua jika salah paraf"
                        >
                          <RotateCcw className="w-3 h-3 text-rose-600" />
                          <span>Batal Paraf Orang Tua</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px] italic">
                    Belum ada paraf atau catatan pendampingan dari orang tua siswa untuk tanggal ini.
                  </p>
                )}
              </div>

              {/* Teacher Feedback Action Area */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 block">
                    Penilaian & Catatan Wali Kelas:
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingStars(star)}
                        className="text-amber-400 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= ratingStars ? 'fill-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
                  placeholder="Tuliskan apresiasi, catatan motivasi, atau perbaikan untuk siswa..."
                  className="w-full text-xs text-slate-800 bg-white border border-indigo-200 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleVerifyJournal('needs_revision')}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                  >
                    Minta Revisi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyJournal('verified')}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                  >
                    Setujui & Verifikasi Jurnal ✓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
