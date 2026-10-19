import React, { useState } from 'react';
import { 
  User, 
  DailyJournal, 
  PhotoProof, 
  HabitId 
} from '../types';
import { G7KAIH_HABITS } from '../data/seedData';
import { StorageService } from '../services/storage';
import { 
  Heart, 
  Stamp, 
  CheckCircle2, 
  Calendar, 
  MessageSquare, 
  Star, 
  Flame, 
  ShieldCheck, 
  Sparkles,
  Camera,
  Check,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ParentDashboardProps {
  currentUser: User;
  date: string;
  onViewPhoto: (photo: PhotoProof, habitTitle: string) => void;
  onOpenExportModal: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  currentUser,
  date,
  onViewPhoto,
  onOpenExportModal,
}) => {
  const users = StorageService.getUsers();
  // Find child linked to this parent (default to first student if not set)
  const child = users.find((u) => u.id === currentUser.childId) || users.find((u) => u.role === 'siswa') || currentUser;

  const journal = StorageService.getOrCreateJournal(child.id, date);
  const streak = StorageService.getStudentStreak(child.id);

  const [parentNotes, setParentNotes] = useState<string>(
    journal.parentEndorsement?.parentNotes || 'Alhamdulillah, anak kami telah beraktivitas dengan baik dan mandiri.'
  );
  const [hasEndorsed, setHasEndorsed] = useState<boolean>(
    journal.parentEndorsement?.endorsed || false
  );

  React.useEffect(() => {
    setParentNotes(journal.parentEndorsement?.parentNotes || 'Alhamdulillah, anak kami telah beraktivitas dengan baik dan mandiri.');
    setHasEndorsed(journal.parentEndorsement?.endorsed || false);
  }, [journal.studentId, journal.date, journal.parentEndorsement?.endorsed, journal.parentEndorsement?.parentNotes]);

  const handleEndorse = () => {
    StorageService.endorseJournalByParent(child.id, date, {
      endorsed: true,
      endorsedByParentId: currentUser.id,
      parentName: currentUser.name,
      endorsedAt: new Date().toISOString(),
      parentNotes,
      signatureStamp: `PARAF-${currentUser.name.toUpperCase().replace(/\s+/g, '_')}`,
    });

    setHasEndorsed(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const [isConfirmingCancel, setIsConfirmingCancel] = useState<boolean>(false);

  const handleCancelEndorse = () => {
    StorageService.cancelParentEndorsement(child.id, date);
    setHasEndorsed(false);
    setParentNotes('');
    setIsConfirmingCancel(false);
  };

  const completedCount = journal.completedHabitsCount;

  return (
    <div className="space-y-6">
      {/* Parent Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={child.avatar}
              alt={child.name}
              className="w-14 h-14 rounded-2xl bg-amber-50 p-1 border border-amber-200 object-cover"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  Dashboard Pendampingan Orang Tua
                </span>
                <span className="text-xs text-slate-500">
                  {child.schoolName}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Jurnal Ananda: {child.name}
              </h1>
              <p className="text-xs text-slate-500">
                Wali Kelas: Ibu Siti Rahmawati, S.Pd. · NISN: {child.nisn}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-xs text-slate-500 block">Streak Kebiasaan</span>
              <span className="text-xl font-extrabold font-mono text-rose-600 tabular-nums">
                🔥 {streak} Hari
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-xs text-slate-500 block">Capaian Hari Ini</span>
              <span className="text-xl font-extrabold font-mono text-emerald-600 tabular-nums">
                {completedCount}/7
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Paraf Section */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Paraf Digital & Dukungan Orang Tua
              </h2>
              <p className="text-xs text-slate-500">
                Berikan paraf resmi setelah memeriksa bukti kegiatan anak hari ini.
              </p>
            </div>
          </div>

          {hasEndorsed ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Sudah Diparaf oleh {currentUser.name} ✓</span>
            </div>
          ) : (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg font-semibold">
              Menunggu Paraf Anda
            </span>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Pesan Kasih Sayang & Catatan Orang Tua:
          </label>
          <textarea
            rows={2}
            value={parentNotes}
            onChange={(e) => setParentNotes(e.target.value)}
            placeholder="Tuliskan ucapan penyemangat atau catatan pendampingan untuk anak..."
            className="w-full text-xs text-slate-800 border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />

          {isConfirmingCancel ? (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-rose-950">
                  Batalkan paraf orang tua untuk ananda {child.name} pada tanggal {date}? Status pada Rekap Laporan akan otomatis disinkronkan menjadi &quot;Belum Diparaf&quot;.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-200">
                <button
                  type="button"
                  onClick={() => setIsConfirmingCancel(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                >
                  Jangan Batal
                </button>
                <button
                  type="button"
                  onClick={handleCancelEndorse}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ya, Batalkan Paraf</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-2.5">
              {hasEndorsed && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingCancel(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                  title="Batalkan status paraf orang tua untuk jurnal ini"
                >
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Batal Paraf oleh Orang Tua</span>
                </button>
              )}

              <button
                onClick={handleEndorse}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-xs transition-colors cursor-pointer"
              >
                <Stamp className="w-4 h-4" />
                <span>{hasEndorsed ? 'Perbarui Paraf & Catatan' : 'Berikan Paraf Digital Hari Ini'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Child's Habit Feed for the Day */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3">
          Rincian 7 Kebiasaan Ananda Hari Ini ({date})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {G7KAIH_HABITS.map((habit) => {
            const entry = journal.habits[habit.id];
            const isDone = entry?.completed;
            const photoCount = entry?.photos?.length || 0;

            return (
              <div
                key={habit.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDone ? 'bg-white border-slate-200' : 'bg-slate-50/60 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {habit.title}
                    </span>
                  </div>
                  {isDone ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Selesai ✓
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Belum diisi</span>
                  )}
                </div>

                {isDone ? (
                  <div className="text-xs text-slate-600 space-y-1.5">
                    {habit.id === 'bangun_pagi' && (
                      <p>Jam Bangun: <strong>{entry?.wakeTime} WIB</strong> ({entry?.wakeCondition})</p>
                    )}
                    {habit.id === 'beribadah' && (
                      <p>Ibadah: <strong>{entry?.worshipType}</strong> ({entry?.worshipTime})</p>
                    )}
                    {habit.id === 'berolahraga' && (
                      <p>Olahraga: <strong>{entry?.sportType}</strong> selama {entry?.sportDurationMinutes} menit</p>
                    )}
                    {habit.id === 'makan_sehat' && (
                      <p>Menu: <strong>{entry?.menuDescription}</strong></p>
                    )}
                    {habit.id === 'gemar_belajar' && (
                      <p>Belajar: <strong>{entry?.subjectOrBook}</strong> ({entry?.studyDurationMinutes} menit)</p>
                    )}
                    {habit.id === 'bermasyarakat' && (
                      <p>Aktivitas: <strong>{entry?.socialActivity}</strong></p>
                    )}
                    {habit.id === 'tidur_cepat' && (
                      <p>Tidur: <strong>{entry?.sleepTime} WIB</strong></p>
                    )}

                    {/* Photos */}
                    {photoCount > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] text-slate-400 block mb-1">
                          Foto Bukti ({photoCount}):
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {entry?.photos.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => onViewPhoto(p, habit.title)}
                              className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 hover:opacity-90"
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
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Ananda belum mencatat kegiatan untuk kebiasaan ini.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
