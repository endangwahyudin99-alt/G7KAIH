import React, { useState } from 'react';
import { User, DailyJournal } from '../types';
import { G7KAIH_HABITS } from '../data/seedData';
import { StorageService } from '../services/storage';
import { 
  Stamp, 
  X, 
  Heart, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  MessageSquare,
  Clock,
  UserCheck,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ParentEndorsementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  date: string;
  journal: DailyJournal;
  onSaveEndorsement: (parentName: string, parentNotes: string, shouldLogout?: boolean) => void;
  onCancelEndorsement?: (updatedJournal?: DailyJournal) => void;
}

const QUICK_NOTES_PRESETS = [
  'Alhamdulillah, ananda telah beraktivitas dengan baik dan mandiri.',
  'Bunda & Ayah sangat bangga dengan kedisiplinan dan usahamu hari ini, nak!',
  'Terus pertahankan semangat ibadah, belajar, dan hidup sehatmu ya sayang.',
  'Hebat! Ananda menyelesaikan kebiasaan baik dengan penuh tanggung jawab.',
  'Teruslah berakhlak mulia, rendah hati, dan berbakti kepada orang tua.',
];

export const ParentEndorsementModal: React.FC<ParentEndorsementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  date,
  journal,
  onSaveEndorsement,
  onCancelEndorsement,
}) => {
  const isPhone = (str?: string) => {
    if (!str) return false;
    const cleaned = str.replace(/[\s\-\+\(\)\.]/g, '');
    return cleaned.length >= 8 && /^\d+$/.test(cleaned);
  };

  const rawName = journal.parentEndorsement?.parentName || currentUser.parentName;
  const existingName = (rawName && !isPhone(rawName)) ? rawName : 'Orang Tua / Wali';
  const existingNotes = journal.parentEndorsement?.parentNotes || QUICK_NOTES_PRESETS[0];

  const [parentName, setParentName] = useState<string>(existingName);
  const [parentNotes, setParentNotes] = useState<string>(existingNotes);
  const [hasEndorsed, setHasEndorsed] = useState<boolean>(() => !!journal.parentEndorsement?.endorsed);
  const [activeMenuTab, setActiveMenuTab] = useState<'form' | 'batal'>('form');
  const [isConfirmingCancel, setIsConfirmingCancel] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const rName = journal.parentEndorsement?.parentName || currentUser.parentName;
    const eName = (rName && !isPhone(rName)) ? rName : 'Orang Tua / Wali';
    setParentName(eName);
    setParentNotes(journal.parentEndorsement?.parentNotes || QUICK_NOTES_PRESETS[0]);
    setHasEndorsed(!!journal.parentEndorsement?.endorsed);
    setIsConfirmingCancel(false);
    setActiveMenuTab('form');
    setFeedbackNotice(null);
  }, [isOpen, journal.date, journal.studentId, journal.parentEndorsement?.endorsed, journal.parentEndorsement?.parentName, journal.parentEndorsement?.parentNotes, currentUser.parentName]);

  if (!isOpen) return null;

  const schoolClasses = StorageService.getClasses();
  const studentClassName = schoolClasses.find((c) => c.id === currentUser.classId)?.name || 'Kelas 5A';
  const completedCount = journal.completedHabitsCount;

  const handleSave = (shouldLogout: boolean = false) => {
    const finalName = parentName.trim() || 'Orang Tua / Wali';
    const finalNotes = parentNotes.trim() || QUICK_NOTES_PRESETS[0];
    onSaveEndorsement(finalName, finalNotes, shouldLogout);
    
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Fallback
    }
    onClose();
  };

  const handleExecuteCancel = () => {
    try {
      // 1. Cancel in StorageService using accurate student ID
      const targetStudentId = journal.studentId || (currentUser.role === 'orang_tua' ? (currentUser.childId || currentUser.id) : currentUser.id);
      const updatedJournal = StorageService.cancelParentEndorsement(targetStudentId, date);

      setHasEndorsed(false);
      setParentNotes('');
      setFeedbackNotice('Paraf orang tua berhasil dibatalkan dan disinkronkan ke Rekap Laporan.');
      setIsConfirmingCancel(false);

      // 2. Execute parent callback if provided
      if (onCancelEndorsement) {
        onCancelEndorsement(updatedJournal);
      }

      // Close modal after brief feedback
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error during parent endorsement cancellation:', err);
      if (onCancelEndorsement) {
        onCancelEndorsement();
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-xs">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Paraf & Catatan Orang Tua
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Pengesahan pendampingan harian ananda di rumah · Tanggal: {date}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigasi Sub-Tab: Form Paraf vs Menu Batal Paraf */}
        {hasEndorsed && (
          <div className="bg-slate-100/90 px-6 pt-3 pb-2 border-b border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveMenuTab('form');
                  setIsConfirmingCancel(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMenuTab === 'form'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stamp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Formulir & Catatan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMenuTab('batal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMenuTab === 'batal'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Menu Batal Paraf</span>
              </button>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Sudah Diparaf ✓
            </span>
          </div>
        )}

        {/* Feedback Alert if cancellation just occurred */}
        {feedbackNotice && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs">
          
          {/* TAMPILAN JIKA MEMILIH MENU BATAL PARAF */}
          {activeMenuTab === 'batal' ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4.5 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <RotateCcw className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-rose-950 text-sm">
                      Menu Pembatalan Paraf Orang Tua
                    </h3>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      Gunakan menu ini jika Bapak/Ibu ingin membatalkan pengesahan paraf yang telah diberikan untuk jurnal tanggal <strong>{date}</strong>.
                    </p>
                  </div>
                </div>

                {/* Info Paraf yang Akan Dibatalkan */}
                <div className="bg-white/90 rounded-xl p-3 border border-rose-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 font-medium">Siswa:</span>
                    <strong className="text-slate-900">{currentUser.name} ({studentClassName})</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 font-medium">Diparaf Oleh:</span>
                    <strong className="text-slate-900">{journal.parentEndorsement?.parentName || parentName}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 font-medium">Stempel Digital:</span>
                    <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                      {journal.parentEndorsement?.signatureStamp || 'SAH G7KAIH'}
                    </span>
                  </div>
                  {journal.parentEndorsement?.parentNotes && (
                    <div className="pt-1 border-t border-slate-100 text-slate-600 italic">
                      &quot;{journal.parentEndorsement.parentNotes}&quot;
                    </div>
                  )}
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Sinkronisasi Otomatis:</strong> Setelah dibatalkan, status jurnal ananda pada <strong>Rekap Laporan</strong>, <strong>Tinjauan Guru</strong>, dan <strong>Ekspor Excel/PDF</strong> akan langsung berubah menjadi <strong>&quot;Belum Diparaf&quot;</strong>.
                  </span>
                </div>
              </div>

              {/* Tombol Eksekusi Batal Paraf */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveMenuTab('form')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Kembali ke Formulir
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCancel}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ya, Batalkan Paraf Sekarang</span>
                </button>
              </div>
            </div>
          ) : (
            /* TAMPILAN FORMULIR PARAF & CATATAN */
            <>
              {/* Status Paraf Banner jika Sudah Diparaf */}
              {hasEndorsed && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-950 block">
                          Jurnal Sudah Diparaf Resmi oleh {journal.parentEndorsement?.parentName || parentName}
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          Stempel: {journal.parentEndorsement?.signatureStamp || 'SAH G7KAIH'} · Tersinkron otomatis ke Rekap Laporan
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingCancel(true)}
                      className="self-start sm:self-auto text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Batal Paraf</span>
                    </button>
                  </div>

                  {isConfirmingCancel && (
                    <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3 animate-in fade-in">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                          <RotateCcw className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-rose-950 text-xs">
                            Konfirmasi Pembatalan Paraf Orang Tua
                          </h4>
                          <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                            Apakah Bapak/Ibu yakin ingin membatalkan paraf untuk tanggal <strong>{date}</strong>? Status pada Rekap Laporan akan langsung disinkronkan kembali menjadi <strong>&quot;Belum Diparaf&quot;</strong>.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-200">
                        <button
                          type="button"
                          onClick={() => setIsConfirmingCancel(false)}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleExecuteCancel}
                          className="px-4 py-1.5 rounded-xl text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Ya, Batalkan Paraf</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ringkasan Capaian Siswa Hari Ini */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-9 h-9 rounded-full bg-slate-200 object-cover border border-slate-300"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs leading-tight">
                        {currentUser.name}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        {studentClassName} · NISN: {currentUser.nisn || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block">
                      {completedCount}/7 Selesai
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Tanggal: {date}
                    </span>
                  </div>
                </div>

                {/* Checklist 7 Kebiasaan */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 border-t border-slate-200/80">
                  {G7KAIH_HABITS.map((h) => {
                    const isDone = journal.habits[h.id]?.completed;
                    return (
                      <div
                        key={h.id}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium border ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        <span className="shrink-0">{isDone ? '✓' : '○'}</span>
                        <span className="truncate">{h.shortTitle}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Input Nama Orang Tua / Wali */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Nama Orang Tua / Wali yang Memberikan Paraf:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Contoh: Ayah Budi / Bunda Siti"
                    className="w-full text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Pilihan Cepat Catatan Kasih Sayang */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Pilihan Cepat Catatan Kasih Sayang:
                  </label>
                  <span className="text-[10px] text-slate-400">Klik untuk memilih</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_NOTES_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setParentNotes(preset)}
                      className={`text-[11px] text-left px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        parentNotes === preset
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      &quot;{preset}&quot;
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea Catatan & Pesan Kasih Sayang */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Tulis Catatan / Doa untuk Ananda:
                </label>
                <textarea
                  rows={3}
                  value={parentNotes}
                  onChange={(e) => setParentNotes(e.target.value)}
                  placeholder="Tuliskan ucapan penyemangat, nasihat, atau apresiasi untuk ananda..."
                  className="w-full text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all shadow-2xs resize-none"
                />
              </div>

              {/* Pratinjau Stempel Digital Paraf */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 space-y-1.5">
                <div className="flex items-center justify-between text-emerald-900 font-bold text-xs">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Pratinjau Stempel Paraf Digital Resmi</span>
                  </span>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-mono font-bold">
                    SAH G7KAIH
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Diparaf oleh <strong>{parentName || 'Orang Tua / Wali'}</strong> untuk ananda <strong>{currentUser.name}</strong> pada tanggal <strong>{date}</strong>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        {activeMenuTab === 'form' && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            {hasEndorsed ? (
              <button
                type="button"
                onClick={() => setIsConfirmingCancel(true)}
                className="px-3.5 py-2.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Buka konfirmasi batal paraf orang tua"
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Batal Paraf Ortu</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {hasEndorsed ? 'Tutup' : 'Batal'}
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Stamp className="w-4 h-4 text-emerald-100" />
                <span>{hasEndorsed ? 'Simpan Perubahan Paraf ✓' : 'Beri Paraf Orang Tua ✓'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
