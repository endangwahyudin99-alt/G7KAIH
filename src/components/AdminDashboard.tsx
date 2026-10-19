import React from 'react';
import { User, SchoolClass } from '../types';
import { StorageService } from '../services/storage';

interface AdminDashboardProps {
  currentUser: User;
  onOpenExportModal: () => void;
  onNavigateToStudents?: (classId?: string) => void;
  onOpenSchoolAndUserModal?: () => void;
  onOpenBackupRestoreModal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onOpenExportModal,
  onNavigateToStudents,
  onOpenSchoolAndUserModal,
  onOpenBackupRestoreModal,
}) => {
  const classes = StorageService.getClasses();
  const users = StorageService.getUsers();
  const students = users.filter((u) => u.role === 'siswa');
  const teachers = users.filter((u) => u.role === 'guru');
  const journals = StorageService.getJournals();

  const totalJournalsRecorded = Object.keys(journals).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
              Administrator Sekolah
            </span>
            <span className="text-xs text-slate-500">
              {currentUser.schoolName}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Pusat Pengelolaan G7KAIH Sekolah
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manajemen rombongan belajar, rekapitulasi data kepatuhan, dan kepatuhan privasi peserta didik.
          </p>
        </div>
      </div>

      {/* Overview Metric KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Rombel Kelas</span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
            {classes.length} Rombongan Belajar
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Kelas 1a - 6b</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Siswa Terdaftar</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-indigo-600 tabular-nums">
              {students.filter((s) => !StorageService.isDummyStudent(s)).length} Siswa
            </span>
            {students.some((s) => StorageService.isDummyStudent(s)) && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-xs">
                +{students.filter((s) => StorageService.isDummyStudent(s)).length} Dummy
              </span>
            )}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Siswa Riil Terdaftar</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Guru / Wali Kelas</span>
          <span className="text-2xl font-extrabold font-mono text-amber-600 tabular-nums">
            {teachers.length} Guru
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Terdaftar sebagai Verifikator</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Entri Jurnal</span>
          <span className="text-2xl font-extrabold font-mono text-emerald-600 tabular-nums">
            {totalJournalsRecorded} Catatan
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Termasuk lampiran foto terkompresi</span>
        </div>
      </div>

      {/* Class List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            Daftar Kelas & Wali Kelas Penanggung Jawab
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                <th className="p-3.5">Nama Rombel</th>
                <th className="p-3.5">Jenjang</th>
                <th className="p-3.5">Tahun Ajaran</th>
                <th className="p-3.5">Wali Kelas</th>
                <th className="p-3.5">Total Siswa</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50/60">
                  <td className="p-3.5 font-bold text-slate-900">{cls.name}</td>
                  <td className="p-3.5">{cls.gradeLevel}</td>
                  <td className="p-3.5 font-mono">{cls.academicYear}</td>
                  <td className="p-3.5 font-medium text-indigo-700">{cls.homeroomTeacherName}</td>
                  <td className="p-3.5 font-mono tabular-nums">{cls.totalStudents} Siswa</td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onNavigateToStudents && onNavigateToStudents(cls.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                        title={`Kelola dan petakan siswa untuk ${cls.name}`}
                      >
                        Kelola / Input Siswa
                      </button>
                      <button
                        onClick={() => StorageService.exportJournalToExcel(cls.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                      >
                        Unduh Excel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

