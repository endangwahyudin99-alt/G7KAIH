import React, { useState } from 'react';
import { ShieldCheck, Lock, EyeOff, FileText, CheckCircle2, X } from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [parentAgreed, setParentAgreed] = useState<boolean>(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Keamanan, Privasi & Izin Orang Tua
              </h2>
              <p className="text-xs text-slate-500">
                Perlindungan Data Pribadi Siswa G7KAIH
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-600">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <p className="font-bold text-xs mb-1">
              Prinsip Perlindungan Anak & Privasi Digital:
            </p>
            <p>
              Aplikasi Jurnal G7KAIH dirancang secara ketat untuk melindungi privasi siswa SD, SMP, dan SMA sesuai peraturan perlindungan data anak.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">1. Hak Akses Terbatas (Role-Based Access)</strong>
                <span>Foto bukti kegiatan siswa HANYA dapat diakses oleh siswa yang bersangkutan, guru wali kelas terdaftar, dan orang tua/wali murid terkait. Tidak ada akses publik.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <EyeOff className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">2. Penghapusan Metadata Sensitif (EXIF Stripping)</strong>
                <span>Setiap foto yang diunggah diproses ulang melalui kanvas di peramban (client-side) sehingga informasi lokasi GPS tersembunyi, nomor seri kamera, dan riwayat perangkat dihapus secara permanen sebelum disimpan.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">3. Pedoman Unggah Bukti Kegiatan</strong>
                <span>Siswa dilarang mengunggah berkas yang memuat dokumen kependudukan (KTP/KK), dokumen rahasia, atau wajah orang lain tanpa persetujuan langsung.</span>
              </div>
            </div>
          </div>

          {/* Parental Consent Checkbox */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 mt-4">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={parentAgreed}
                onChange={(e) => setParentAgreed(e.target.checked)}
                className="w-4 h-4 rounded-sm text-emerald-600 accent-emerald-600 mt-0.5"
              />
              <span className="text-[11px] text-slate-700 leading-snug">
                <strong>Persetujuan Orang Tua / Wali:</strong> Selaku orang tua/wali murid, saya menyetujui keikutsertaan ananda dalam pembiasaan harian G7KAIH dan memahami kebijakan perlindungan data ini.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3.5 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
