import React, { useState, useEffect } from 'react';
import { User, SchoolClass, SchoolProfile } from '../types';
import { StorageService } from '../services/storage';
import { 
  X, 
  ArrowRight, 
  GraduationCap
} from 'lucide-react';

interface StudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent: (student: User) => void;
  classes: SchoolClass[];
  schoolProfile: SchoolProfile;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
  classes,
  schoolProfile,
}) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => StorageService.getUsers());
  const [studentName, setStudentName] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'class-1a');

  // Sync users list with Cloud Firestore and local storage
  useEffect(() => {
    const handleSync = () => {
      setAllUsers(StorageService.getUsers());
    };
    window.addEventListener('g7kaih_cloud_users_synced', handleSync);
    return () => {
      window.removeEventListener('g7kaih_cloud_users_synced', handleSync);
    };
  }, []);

  // Reset form inputs when modal is opened
  useEffect(() => {
    if (isOpen) {
      setStudentName('');
      if (classes.length > 0 && !classes.some((c) => c.id === selectedClassId)) {
        setSelectedClassId(classes[0].id);
      }
    }
  }, [isOpen]);

  // Hook rules guarantee: return null AFTER all hooks
  if (!isOpen) return null;

  const studentUsers = allUsers.filter(
    (u) => u.role === 'siswa' && !StorageService.isDummyStudent(u)
  );
  const existingStudentsInClass = studentUsers.filter((s) => s.classId === selectedClassId);

  const sortedStudents = [...existingStudentsInClass].sort((a, b) => a.name.localeCompare(b.name, 'id'));

  const handleSelectFromList = (studentId: string) => {
    const student = existingStudentsInClass.find((s) => s.id === studentId);
    if (student) {
      setStudentName(student.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = studentName.trim();
    if (!trimmedName) return;

    // Check if a student with this name already exists in this class (case-insensitive)
    const existing = studentUsers.find(
      (s) =>
        s.classId === selectedClassId &&
        s.name.toLowerCase() === trimmedName.toLowerCase()
    );

    let targetStudent: User;

    if (existing) {
      targetStudent = existing;
    } else {
      // Create new student record automatically and sync to Cloud
      targetStudent = StorageService.addStudent({
        name: trimmedName,
        classId: selectedClassId,
        schoolName: schoolProfile.name,
      });
    }

    StorageService.setActiveUserId(targetStudent.id);
    onSelectStudent(targetStudent);
    onClose();
  };

  // Find currently matched student
  const selectedStudentObj = existingStudentsInClass.find(
    (s) => s.name.toLowerCase() === studentName.trim().toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 max-w-lg w-full rounded-3xl p-6 sm:p-7 text-left shadow-2xl relative space-y-5 my-auto animate-in zoom-in-95 duration-200 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-900/40 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Masuk Jurnal Siswa</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Online Cloud
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {schoolProfile.name || 'Gerakan 7 Kebiasaan Anak Indonesia Hebat'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form: Pilih Kelas Dulu -> Pilih Nama Siswa */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pilihan Kelas */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>1. Pilihan Kelas / Rombel: *</span>
              <span className="text-[11px] font-normal text-rose-400">
                {existingStudentsInClass.length} Siswa Terdaftar
              </span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setStudentName('');
              }}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-inner"
            >
              {classes.map((c) => {
                const count = studentUsers.filter((s) => s.classId === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} {count > 0 ? `(${count} siswa)` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Pilih dari Daftar Siswa Terdaftar */}
          {sortedStudents.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                2. Pilih Nama Siswa dari Daftar Kelas:
              </label>
              <select
                value={selectedStudentObj?.id || ''}
                onChange={(e) => handleSelectFromList(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-inner"
              >
                <option value="">-- Pilih Nama Siswa ({sortedStudents.length} siswa) --</option>
                {sortedStudents.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    {idx + 1}. {s.name} {s.nisn ? `· NISN: ${s.nisn}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Atau Ketik / Cari Nama Siswa */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>{sortedStudents.length > 0 ? 'Atau Ketik / Cari Nama Siswa:' : '2. Nama Lengkap Siswa:'} *</span>
              {selectedStudentObj && (
                <span className="text-[11px] text-emerald-400 font-semibold">
                  ✓ Terdaftar (NISN: {selectedStudentObj.nisn || '-'})
                </span>
              )}
            </label>
            <input
              type="text"
              required
              list="student-names-datalist"
              placeholder="Ketik atau cari nama ananda..."
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500 shadow-inner"
            />
            {/* Datalist rekomendasi nama siswa */}
            <datalist id="student-names-datalist">
              {sortedStudents.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>

          {/* Kartu Konfirmasi Siswa Terpilih */}
          {studentName.trim() && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-600/30 text-xs text-emerald-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block text-sm">
                  {studentName}
                </span>
                <span className="text-[11px] text-emerald-300/80">
                  {classes.find((c) => c.id === selectedClassId)?.name || 'Kelas Terpilih'}
                  {selectedStudentObj?.nisn ? ` · NISN: ${selectedStudentObj.nisn}` : ''}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/40">
                Siap Isi Jurnal
              </span>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-200 leading-relaxed">
            Jawaban jurnal yang diisi ananda dan diparaf orang tua akan langsung tersimpan di Cloud dan terkirim otomatis ke menu laporan guru kelas.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!studentName.trim()}
              className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-900/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Masuk & Isi Jurnal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
