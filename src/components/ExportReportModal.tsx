import React, { useRef, useState, useEffect } from 'react';
import { User, DailyJournal, SchoolClass } from '../types';
import { G7KAIH_HABITS, BADGE_EMBLEM_IMG } from '../data/seedData';
import { StorageService } from '../services/storage';
import { 
  Printer, 
  FileSpreadsheet, 
  X, 
  Download, 
  CheckCircle, 
  Calendar,
  School,
  CheckCircle2,
  Stamp,
  RotateCcw
} from 'lucide-react';

interface ExportReportModalProps {
  student: User;
  schoolClass?: SchoolClass;
  isOpen: boolean;
  onClose: () => void;
  selectedMonth?: string;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  student,
  schoolClass,
  isOpen,
  onClose,
  selectedMonth = 'Oktober 2026',
}) => {
  const [syncTick, setSyncTick] = useState<number>(0);

  useEffect(() => {
    const handleSync = () => {
      setSyncTick((t) => t + 1);
    };
    window.addEventListener('g7kaih_cloud_journals_synced', handleSync);
    return () => {
      window.removeEventListener('g7kaih_cloud_journals_synced', handleSync);
    };
  }, []);

  if (!isOpen) return null;

  const journals = StorageService.getJournals();
  // Filter student's journals
  const studentJournals = Object.values(journals || {})
    .filter((j) => j && j.studentId === student.id)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const totalRecordedDays = studentJournals.length;
  const endorsedDaysCount = studentJournals.filter((j) => j?.parentEndorsement?.endorsed).length;
  const unendorsedDaysCount = totalRecordedDays - endorsedDaysCount;
  const verifiedByTeacherDaysCount = studentJournals.filter((j) => j?.teacherVerification?.status === 'verified').length;

  // Collect photos for the PDF gallery
  const reportPhotos: { habitTitle: string; url: string; date: string }[] = [];
  studentJournals.forEach((j) => {
    if (!j || !j.habits || typeof j.habits !== 'object') return;
    Object.values(j.habits).forEach((h) => {
      if (h && h.photos && Array.isArray(h.photos) && h.photos.length > 0) {
        h.photos.forEach((p) => {
          if (!p) return;
          if (reportPhotos.length < 6) {
            reportPhotos.push({
              habitTitle: G7KAIH_HABITS.find((hab) => hab.id === h.habitId)?.shortTitle || 'Kebiasaan',
              url: p.url,
              date: j.date,
            });
          }
        });
      }
    });
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    StorageService.exportJournalToExcel(student.classId || 'class-5a', selectedMonth);
  };

  const schoolProfile = StorageService.getSchoolProfile();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Ekspor & Cetak Laporan G7KAIH
              </h2>
              <p className="text-xs text-slate-500">
                Format resmi PDF dengan bukti foto dan format spreadsheet Microsoft Excel (.xlsx).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Excel (.xlsx)</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 bg-white">
          
          {/* Formal School Letterhead (Kop Surat) */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between gap-4">
            {schoolProfile.logoUrl && (
              <div className="shrink-0 w-20 h-20 flex items-center justify-center">
                <img
                  src={schoolProfile.logoUrl}
                  alt="Logo Sekolah"
                  className="max-h-20 max-w-20 object-contain"
                />
              </div>
            )}
            <div className="flex-1 text-center space-y-1">
              <h1 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">
                Pemerintah {schoolProfile.city || 'Kabupaten/Kota'} · Dinas Pendidikan
              </h1>
              <h2 className="text-lg sm:text-xl font-extrabold uppercase text-slate-900 leading-tight">
                {schoolProfile.name || 'Nama Resmi Sekolah'}
              </h2>
              <p className="text-xs text-slate-500">
                NPSN: {schoolProfile.npsn || '-'} · {schoolProfile.address || 'Alamat Sekolah'}, {schoolProfile.city || ''} {schoolProfile.phone ? `· Telp: ${schoolProfile.phone}` : ''}
              </p>
              <p className="text-xs text-slate-700 font-bold tracking-wide pt-0.5">
                Laporan Evaluasi Gerakan 7 Kebiasaan Anak Indonesia Hebat (G7KAIH)
              </p>
            </div>
            {schoolProfile.logoUrl && (
              <div className="shrink-0 w-20 h-20 hidden sm:flex items-center justify-center" aria-hidden="true" />
            )}
          </div>

          {/* Student & Class Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Nama Siswa:</span>
              <strong className="text-slate-900 font-bold">{student.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">NISN:</span>
              <strong className="text-slate-900 font-bold">{student.nisn || '-'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Kelas / Tingkat:</span>
              <strong className="text-slate-900 font-bold">{schoolClass?.name || 'Kelas 5A'} (SD)</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Periode Bulan:</span>
              <strong className="text-slate-900 font-bold">{selectedMonth}</strong>
            </div>
          </div>

          {/* Ringkasan Statistik Rekap Paraf & Guru */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px] font-medium">Total Hari Dicatat</span>
              <strong className="text-base font-bold text-slate-900 font-mono">{totalRecordedDays} Hari</strong>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-emerald-800 block text-[11px] font-medium">Paraf Orang Tua</span>
              <div className="flex items-baseline gap-1.5">
                <strong className="text-base font-bold text-emerald-700 font-mono">{endorsedDaysCount}</strong>
                <span className="text-[11px] text-emerald-600">/ {totalRecordedDays} Hari</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-medium block">
                {totalRecordedDays ? Math.round((endorsedDaysCount / totalRecordedDays) * 100) : 0}% telah diparaf
              </span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-indigo-800 block text-[11px] font-medium">Verifikasi Guru</span>
              <div className="flex items-baseline gap-1.5">
                <strong className="text-base font-bold text-indigo-700 font-mono">{verifiedByTeacherDaysCount}</strong>
                <span className="text-[11px] text-indigo-600">/ {totalRecordedDays} Hari</span>
              </div>
              <span className="text-[10px] text-indigo-700 font-medium block">
                {totalRecordedDays ? Math.round((verifiedByTeacherDaysCount / totalRecordedDays) * 100) : 0}% diverifikasi
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px] font-medium">Status Sinkronisasi</span>
              <strong className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Real-Time Cloud</span>
              </strong>
            </div>
          </div>

          {/* 7 Habits Recap Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">
                1. Rekapitulasi Catatan Kebiasaan Harian
              </h3>
              <span className="text-[11px] text-slate-500">
                Kolom Paraf tersinkron otomatis saat diparaf atau dibatalkan
              </span>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <th className="p-2.5">Tanggal</th>
                    <th className="p-2.5">Bangun</th>
                    <th className="p-2.5">Ibadah</th>
                    <th className="p-2.5">Olahraga</th>
                    <th className="p-2.5">Makan</th>
                    <th className="p-2.5">Belajar</th>
                    <th className="p-2.5">Sosial</th>
                    <th className="p-2.5">Tidur</th>
                    <th className="p-2.5">Status Guru</th>
                    <th className="p-2.5">Paraf Ortu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentJournals.slice(0, 14).map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono font-medium">{j.date}</td>
                      <td className="p-2.5">{j.habits.bangun_pagi?.completed ? '✓' : '-'}</td>
                      <td className="p-2.5">{j.habits.beribadah?.completed ? '✓' : '-'}</td>
                      <td className="p-2.5">{j.habits.berolahraga?.completed ? '✓' : '-'}</td>
                      <td className="p-2.5">{j.habits.makan_sehat?.completed ? '✓' : '-'}</td>
                      <td className="p-2.5">{j.habits.gemar_belajar?.completed ? '✓' : '-'}</td>
                      <td className="p-2.5">{j.habits.bermasyarakat?.completed ? '✓' : '-'}</td>
                      <td className="p-2.5">{j.habits.tidur_cepat?.completed ? '✓' : '-'}</td>
                      <td className="p-2.5 font-semibold text-emerald-700">
                        {j.teacherVerification.status === 'verified' ? 'Disetujui' : 'Diproses'}
                      </td>
                      <td className="p-2.5">
                        {j.parentEndorsement?.endorsed ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px]">
                            Diparaf ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-[10px]">
                            Belum Diparaf
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Photo Proof Gallery in PDF */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              2. Lampiran Bukti Foto Kegiatan Terpilih
            </h3>
            {reportPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {reportPhotos.map((photo, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-1.5 text-center">
                    <div className="aspect-4/3 overflow-hidden rounded-lg bg-slate-200 mb-1.5">
                      <img
                        src={photo.url}
                        alt={photo.habitTitle}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 block truncate">
                      {photo.habitTitle}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {photo.date}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Belum ada foto bukti yang tersimpan.</p>
            )}
          </div>

          {/* Formal Signatures Section */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="text-slate-500 mb-12">Mengetahui,<br />Orang Tua / Wali Murid</p>
              <p className="font-bold text-slate-900 underline">
                {(() => {
                  const cleaned = (student.parentName || '').replace(/[\s\-\+\(\)\.]/g, '');
                  const isPhone = cleaned.length >= 8 && /^\d+$/.test(cleaned);
                  return (student.parentName && !isPhone) ? student.parentName : 'Orang Tua / Wali Murid';
                })()}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-12">Wali Kelas,</p>
              <p className="font-bold text-slate-900 underline">{schoolClass?.homeroomTeacherName || 'Wali Kelas'}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-12">Mengetahui,<br />Kepala Sekolah</p>
              <p className="font-bold text-slate-900 underline">{schoolProfile.principalName || 'Nelis Nursidah, S.Pd., M.M'}</p>
              {schoolProfile.principalNip && (
                <p className="text-[10px] text-slate-400">NIP. {schoolProfile.principalNip}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
