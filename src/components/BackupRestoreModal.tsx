import React, { useState, useRef, useEffect } from 'react';
import { User, BackupPayload } from '../types';
import { StorageService } from '../services/storage';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Copy,
  Check,
  X,
  FileUp,
  RefreshCw,
  Info,
  Calendar,
  Building2,
  Users,
  HardDrive,
  FileCheck
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onDataRestored?: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onDataRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'reset'>('backup');
  const [stats, setStats] = useState(() => StorageService.getStorageStatistics());
  const [schoolProfile, setSchoolProfile] = useState(() => StorageService.getSchoolProfile());
  
  // Backup state
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Restore state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<BackupPayload | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{
    success: boolean;
    message: string;
    summary?: { users: number; journals: number; classes: number };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Undo safety snapshot state
  const [hasSnapshot, setHasSnapshot] = useState<boolean>(() => !!StorageService.getPreRestoreSnapshot());

  // Reset confirmation state
  const [confirmResetText, setConfirmResetText] = useState<string>('');

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // refresh stats
      setStats(StorageService.getStorageStatistics());
      setSchoolProfile(StorageService.getSchoolProfile());
      setHasSnapshot(!!StorageService.getPreRestoreSnapshot());
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Download Backup
  const handleDownloadBackup = () => {
    try {
      const fileName = StorageService.downloadBackupFile(currentUser);
      setStats(StorageService.getStorageStatistics());
      setDownloadSuccessMessage(`Berkas cadangan berhasil diunduh: ${fileName}`);
      setTimeout(() => setDownloadSuccessMessage(null), 6000);
    } catch (err: any) {
      alert(`Gagal mengunduh cadangan data: ${err?.message || 'Kesalahan browser'}`);
    }
  };

  // Handle Copy JSON
  const handleCopyJson = () => {
    try {
      const payload = StorageService.createBackupPayload(currentUser);
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      alert('Gagal menyalin data ke papan klip.');
    }
  };

  // Handle File Upload for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setValidationError(null);
    setRestoreFeedback(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = StorageService.validateBackupJson(text);
      if (result.valid && result.data) {
        setParsedBackup(result.data);
        setValidationError(null);
      } else {
        setParsedBackup(null);
        setValidationError(result.error || 'Format berkas cadangan tidak valid.');
      }
    };
    reader.onerror = () => {
      setValidationError('Gagal membaca berkas dari perangkat Anda.');
      setParsedBackup(null);
    };
    reader.readAsText(file);
  };

  // Execute Restore
  const handleExecuteRestore = () => {
    if (!parsedBackup) return;

    setIsRestoring(true);
    setTimeout(() => {
      const res = StorageService.restoreFromBackup(parsedBackup, restoreMode);
      setIsRestoring(false);
      setRestoreFeedback(res);
      setHasSnapshot(true);
      setStats(StorageService.getStorageStatistics());
      setSchoolProfile(StorageService.getSchoolProfile());

      if (res.success && onDataRestored) {
        onDataRestored();
      }
    }, 400);
  };

  // Execute Undo Restore
  const handleUndoRestore = () => {
    if (confirm('Kembalikan kondisi data sebelum pemulihan terakhir dilakukan?')) {
      const ok = StorageService.restorePreRestoreSnapshot();
      if (ok) {
        setHasSnapshot(false);
        setStats(StorageService.getStorageStatistics());
        setSchoolProfile(StorageService.getSchoolProfile());
        setRestoreFeedback({
          success: true,
          message: 'Data berhasil dikembalikan ke kondisi sebelum pemulihan (Undo).',
        });
        if (onDataRestored) onDataRestored();
      } else {
        alert('Titik pemulihan tidak ditemukan.');
      }
    }
  };

  // Execute Reset to Demo Seed
  const handleResetToSeed = () => {
    if (confirmResetText !== 'RESET') {
      alert('Ketik kata "RESET" untuk mengonfirmasi pengaturan ulang.');
      return;
    }
    StorageService.clearAllStudentAndSchoolData();
    setConfirmResetText('');
    setStats(StorageService.getStorageStatistics());
    setSchoolProfile(StorageService.getSchoolProfile());
    setRestoreFeedback({
      success: true,
      message: 'Seluruh data siswa, dummy jurnal, dan profil sekolah berhasil dibersihkan!',
    });
    if (onDataRestored) onDataRestored();
  };

  const formatDateDisplay = (isoStr?: string | null) => {
    if (!isoStr) return 'Belum pernah dicadangkan';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Database className="w-5 h-5 text-rose-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    Backup & Pemulihan Data G7KAIH
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/30">
                    Khusus Guru & Admin
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Amankan seluruh data jurnal, siswa, dan foto pembiasaan ke berkas cadangan offline (.json)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1.5 mt-4 pt-2 border-t border-slate-700/60">
            <button
              onClick={() => {
                setActiveTab('backup');
                setRestoreFeedback(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'backup'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cadangkan Data (Backup)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('restore');
                setRestoreFeedback(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'restore'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Pemulihan Data (Restore)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('reset');
                setRestoreFeedback(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'reset'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Atur Ulang (Reset)</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          
          {/* Quick Stats Overview Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {schoolProfile.logoUrl ? (
                  <img
                    src={schoolProfile.logoUrl}
                    alt="Logo Sekolah"
                    className="w-5 h-5 object-contain bg-white border border-slate-200 rounded-xs p-0.5 shrink-0"
                  />
                ) : (
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                )}
                <span className="text-xs font-bold text-slate-800">
                  {schoolProfile.name || 'Identitas Sekolah'}
                </span>
                <span className="text-[10px] text-slate-500">
                  (NPSN: {schoolProfile.npsn || '-'} · TP {schoolProfile.academicYear || '2025/2026'})
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                <span>Penyimpanan Lokal: <strong className="text-slate-800 font-mono">{stats.totalKb} KB</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Siswa Terdaftar</span>
                <span className="text-lg font-extrabold text-slate-900 font-mono">{stats.studentCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Guru & Admin</span>
                <span className="text-lg font-extrabold text-indigo-600 font-mono">{stats.teacherCount + (stats.userCount - stats.studentCount - stats.teacherCount)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Jurnal Harian</span>
                <span className="text-lg font-extrabold text-emerald-600 font-mono">{stats.journalCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Bukti Foto</span>
                <span className="text-lg font-extrabold text-amber-600 font-mono">{stats.photoCount}</span>
              </div>
            </div>
          </div>

          {/* TAB 1: BACKUP / CADANGKAN DATA */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Cadangkan Seluruh Data Sekolah & Jurnal Siswa
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Sistem akan mengemas seluruh data profil sekolah, rombel kelas, akun siswa, seluruh riwayat 7 kebiasaan harian, bukti foto kegiatan terkompresi, paraf orang tua, serta penilaian guru ke dalam satu berkas format JSON yang aman.
                    </p>
                  </div>
                </div>

                {downloadSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{downloadSuccessMessage}</span>
                  </div>
                )}

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Pencadangan Terakhir:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {formatDateDisplay(stats.lastBackupTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Pengguna Pencadang:</span>
                    <span className="font-semibold text-slate-800">
                      {currentUser.name} ({currentUser.role === 'admin' ? 'Administrator' : 'Wali Kelas'})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Format Berkas:</span>
                    <span className="font-mono text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-sm">
                      .JSON (Standar G7KAIH v1.0)
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Berkas Cadangan (.json)</span>
                  </button>

                  <button
                    onClick={handleCopyJson}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-500" />
                        <span>Salin Teks JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Informational Guidance */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Kapan sebaiknya melakukan pencadangan (backup)?</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-amber-800">
                  <li>Sebelum pergantian semester atau tahun pelajaran baru.</li>
                  <li>Sebelum menghapus riwayat atau mengimpor siswa dalam jumlah banyak.</li>
                  <li>Saat ingin memindahkan data aplikasi ke perangkat komputer/laptop guru lain.</li>
                  <li>Sebagai arsip bukti kepatuhan Gerakan 7 Kebiasaan Anak Indonesia Hebat.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: RESTORE / PEMULIHAN DATA */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Pulihkan Data dari Berkas Cadangan (.json)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Unggah berkas cadangan JSON yang sebelumnya pernah diunduh dari aplikasi Jurnal G7KAIH untuk mengembalikan seluruh atau sebagian catatan jurnal dan data siswa.
                    </p>
                  </div>
                </div>

                {/* File Dropzone / Picker */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-xl p-6 text-center cursor-pointer transition-colors group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center mx-auto mb-2 transition-colors">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {uploadedFile ? uploadedFile.name : 'Pilih atau Tarik Berkas Cadangan (.json)'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {uploadedFile
                      ? `Ukuran berkas: ${(uploadedFile.size / 1024).toFixed(1)} KB`
                      : 'Hanya berkas berekstensi .json resmi aplikasi G7KAIH'}
                  </p>
                </div>

                {/* Validation Error Banner */}
                {validationError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block">Berkas Tidak Sesuai:</strong>
                      <span>{validationError}</span>
                    </div>
                  </div>
                )}

                {/* Validated Backup File Preview */}
                {parsedBackup && (
                  <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-indigo-200/80">
                      <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span>Berkas Cadangan Terverifikasi Valid</span>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-sm">
                        v{parsedBackup.metadata?.version || '1.0'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Sekolah Sumber:</span>
                        <span className="font-bold text-slate-900 truncate block">
                          {parsedBackup.metadata?.schoolProfile?.name || parsedBackup.schoolProfile?.name || 'Sekolah'}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Waktu Pembuatan:</span>
                        <span className="font-semibold text-slate-800 font-mono block">
                          {formatDateDisplay(parsedBackup.metadata?.exportedAt)}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Oleh Pengguna:</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {parsedBackup.metadata?.exportedBy?.name || 'Admin'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 bg-white rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block">Siswa di Berkas</span>
                        <span className="font-extrabold text-indigo-700 font-mono text-sm">
                          {parsedBackup.users?.filter((u) => u.role === 'siswa').length || 0}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block">Rombel Kelas</span>
                        <span className="font-extrabold text-indigo-700 font-mono text-sm">
                          {parsedBackup.classes?.length || 0}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block">Entri Jurnal</span>
                        <span className="font-extrabold text-emerald-700 font-mono text-sm">
                          {Object.keys(parsedBackup.journals || {}).length}
                        </span>
                      </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="pt-2 border-t border-indigo-200/80">
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Pilih Metode Pemulihan:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label
                          className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                            restoreMode === 'overwrite'
                              ? 'bg-white border-indigo-600 shadow-2xs'
                              : 'bg-white/60 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="restoreMode"
                            checked={restoreMode === 'overwrite'}
                            onChange={() => setRestoreMode('overwrite')}
                            className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              Ganti Total (Clean Overwrite)
                            </span>
                            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                              Menggantikan seluruh data sekarang agar persis sama dengan berkas cadangan (Disarankan).
                            </span>
                          </div>
                        </label>

                        <label
                          className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                            restoreMode === 'merge'
                              ? 'bg-white border-indigo-600 shadow-2xs'
                              : 'bg-white/60 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="restoreMode"
                            checked={restoreMode === 'merge'}
                            onChange={() => setRestoreMode('merge')}
                            className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              Gabungkan (Smart Merge)
                            </span>
                            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                              Menyatukan siswa & jurnal baru tanpa menghapus data yang sudah ada di perangkat ini.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Confirm Restore Button */}
                    <div className="pt-2">
                      <button
                        onClick={handleExecuteRestore}
                        disabled={isRestoring}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
                      >
                        {isRestoring ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sedang Memulihkan Data...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mulai Pulihkan Data Sekarang</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Restore Feedback Notification */}
                {restoreFeedback && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs font-medium animate-fade-in ${
                      restoreFeedback.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {restoreFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <strong className="block">
                        {restoreFeedback.success ? 'Pemulihan Berhasil!' : 'Pemulihan Gagal'}
                      </strong>
                      <span>{restoreFeedback.message}</span>
                      {restoreFeedback.summary && (
                        <p className="text-[11px] text-emerald-700 mt-1 font-mono">
                          Tercatat: {restoreFeedback.summary.users} Pengguna · {restoreFeedback.summary.journals} Jurnal · {restoreFeedback.summary.classes} Rombel
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Undo / Rollback Option */}
                {hasSnapshot && (
                  <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-slate-600 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold text-slate-800 block">Titik Pemulihan Tersedia</span>
                        <span className="text-[11px] text-slate-500">
                          Sistem menyimpan kondisi data sebelum restore terakhir dilakukan.
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleUndoRestore}
                      className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors shrink-0"
                    >
                      Batalkan Pemulihan Terakhir (Undo)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RESET KE DATA BAWAAN */}
          {activeTab === 'reset' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Bersihkan Seluruh Data Siswa & Sekolah
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Fitur ini akan membersihkan seluruh data siswa dummy, riwayat jurnal, serta identitas sekolah agar kembali bersih dan siap digunakan untuk data riil sekolah Anda.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-950">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Peringatan Keamanan Data:</span>
                  </div>
                  <p className="text-rose-800 leading-relaxed">
                    Tindakan ini akan mengosongkan seluruh entri jurnal dan daftar siswa. Sangat disarankan untuk mengunduh cadangan (.json) di tab <strong>Cadangkan Data</strong> terlebih dahulu jika Anda memiliki data yang perlu disimpan.
                  </p>

                  <div className="pt-2 border-t border-rose-200/80">
                    <label className="block text-[11px] font-bold text-rose-950 mb-1">
                      Ketik kata <span className="font-mono bg-white px-1.5 py-0.5 rounded text-rose-700 border border-rose-300">RESET</span> untuk mengonfirmasi:
                    </label>
                    <input
                      type="text"
                      placeholder="Ketik RESET di sini..."
                      value={confirmResetText}
                      onChange={(e) => setConfirmResetText(e.target.value.toUpperCase())}
                      className="w-full sm:w-64 px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-mono font-bold uppercase text-rose-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleResetToSeed}
                    disabled={confirmResetText !== 'RESET'}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Konfirmasi Bersihkan Seluruh Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Penyimpanan Aman Terenkripsi di Browser Perangkat Anda</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
