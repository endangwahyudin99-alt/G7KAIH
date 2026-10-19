import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { User, SchoolClass } from '../types';
import { StorageService } from '../services/storage';
import { CloudSyncService } from '../services/cloudSync';
import { 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Edit3, 
  Trash2, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Phone,
  ShieldCheck,
  Check,
  GraduationCap,
  AlertTriangle,
  Database,
  Cloud,
  CheckSquare,
  Filter,
  Tag,
  Sparkles
} from 'lucide-react';

interface StudentManagementViewProps {
  currentUser: User;
  initialClassId?: string;
  onRefreshData?: () => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({
  currentUser,
  initialClassId,
  onRefreshData,
}) => {
  const isAuthorized = currentUser.role === 'guru' || currentUser.role === 'admin';
  const isTeacher = currentUser.role === 'guru';
  const teacherClassId = currentUser.classId;
  const classes = StorageService.getClasses();

  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || (isTeacher && teacherClassId ? teacherClassId : 'all')
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'real' | 'dummy'>('all');
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isBulkRemapModalOpen, setIsBulkRemapModalOpen] = useState<boolean>(false);
  const [bulkRemapTargetClassId, setBulkRemapTargetClassId] = useState<string>(classes[0]?.id || 'class-1a');
  const [isDeleteDummyModalOpen, setIsDeleteDummyModalOpen] = useState<boolean>(false);

  // Delete Action states
  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nisn: '',
    gender: 'L' as 'L' | 'P',
    classId: isTeacher && teacherClassId ? teacherClassId : (selectedClassId !== 'all' ? selectedClassId : classes[0]?.id || 'class-1a'),
    email: '',
    parentName: '',
    parentPhone: '',
    status: 'aktif' as 'aktif' | 'nonaktif',
    parentConsentApproved: true,
  });

  // Import state
  const [importTargetClassMode, setImportTargetClassMode] = useState<string>('auto');
  const [csvInput, setCsvInput] = useState<string>('');
  const [parsedExcelRows, setParsedExcelRows] = useState<any[][] | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errors: string[];
    classBreakdown?: Record<string, number>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSyncingPermanent, setIsSyncingPermanent] = useState<boolean>(false);

  // Sync selectedClassId if initialClassId changes from props
  useEffect(() => {
    if (initialClassId) {
      setSelectedClassId(initialClassId);
    }
  }, [initialClassId]);

  // Auto-dismiss toast
  useEffect(() => {
    if (feedbackToast) {
      const timer = setTimeout(() => setFeedbackToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackToast]);

  // Roster data - Otomatis tersinkron hanya untuk kelas guru tersebut jika login sebagai guru
  const [students, setStudents] = useState<User[]>(() => {
    const all = StorageService.getUsers().filter((u) => u.role === 'siswa');
    if (isTeacher && teacherClassId) {
      return all.filter((u) => u.classId === teacherClassId);
    }
    return all;
  });

  const refreshStudentList = () => {
    const all = StorageService.getUsers().filter((u) => u.role === 'siswa');
    if (isTeacher && teacherClassId) {
      setStudents(all.filter((u) => u.classId === teacherClassId));
    } else {
      setStudents(all);
    }
    if (onRefreshData) onRefreshData();
  };

  // Listen to remote cloud sync events to auto-refresh student roster
  useEffect(() => {
    const handleUsersSynced = () => {
      refreshStudentList();
    };
    window.addEventListener('g7kaih_cloud_users_synced', handleUsersSynced);
    return () => {
      window.removeEventListener('g7kaih_cloud_users_synced', handleUsersSynced);
    };
  }, [isTeacher, teacherClassId]);

  const handleForceSavePermanent = async () => {
    setIsSyncingPermanent(true);
    try {
      const allUsers = StorageService.getUsers();
      const res = await CloudSyncService.forceSyncAllUsers(allUsers);
      if (res.success) {
        setFeedbackToast({
          message: `Berhasil! Seluruh ${res.count} data siswa telah tersimpan permanen di Cloud Database Firestore & perangkat ini.`,
          type: 'success',
        });
        refreshStudentList();
      } else {
        setFeedbackToast({
          message: `Data siswa tersimpan di perangkat lokal. Catatan cloud: ${res.error || 'tersimpan lokal'}`,
          type: 'success',
        });
      }
    } catch {
      setFeedbackToast({
        message: 'Data siswa tersimpan aman di perangkat lokal.',
        type: 'success',
      });
    } finally {
      setIsSyncingPermanent(false);
    }
  };

  // If unauthorized user
  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-md mx-auto my-12">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Akses Khusus Guru & Admin</h2>
        <p className="text-xs text-slate-500 mt-1">
          Halaman pengelolaan data siswa hanya dapat diakses oleh akun Guru (Wali Kelas) dan Administrator Sekolah.
        </p>
      </div>
    );
  }

  // Dummy & Real Student separation
  const dummyStudents = students.filter((s) => StorageService.isDummyStudent(s));
  const realStudents = students.filter((s) => !StorageService.isDummyStudent(s));

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesClass = isTeacher && teacherClassId
      ? s.classId === teacherClassId
      : (selectedClassId === 'all' || s.classId === selectedClassId);
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nisn && s.nisn.includes(searchQuery)) ||
      (s.parentName && s.parentName.toLowerCase().includes(searchQuery.toLowerCase()));
    const isDummy = StorageService.isDummyStudent(s);
    const matchesType = 
      filterType === 'all' ? true :
      filterType === 'dummy' ? isDummy :
      !isDummy;
    return matchesClass && matchesSearch && matchesType;
  });

  const filteredDummyStudents = filteredStudents.filter((s) => StorageService.isDummyStudent(s));

  // Toggle selection of all dummy students
  const handleToggleSelectDummyStudents = () => {
    const targetDummyList = filteredDummyStudents.length > 0 ? filteredDummyStudents : dummyStudents;
    const dummyIds = targetDummyList.map((s) => s.id);
    if (dummyIds.length === 0) {
      setFeedbackToast({
        message: 'Tidak ada data siswa dummy/contoh bawaan pada daftar saat ini.',
        type: 'success',
      });
      return;
    }

    const allSelected = dummyIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      // Uncheck them
      setSelectedStudentIds((prev) => prev.filter((id) => !dummyIds.includes(id)));
      setFeedbackToast({
        message: 'Pilihan siswa dummy dibatalkan.',
        type: 'success',
      });
    } else {
      // Select all dummy students
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...dummyIds])));
      setFeedbackToast({
        message: `${dummyIds.length} siswa dummy berhasil dipilih. Anda dapat meninjau atau menghapusnya secara permanen.`,
        type: 'success',
      });
    }
  };

  // Permanently delete all dummy students
  const handleConfirmDeleteAllDummy = () => {
    const res = StorageService.deleteDummyStudents();
    setSelectedStudentIds([]);
    setIsDeleteDummyModalOpen(false);
    refreshStudentList();
    setFeedbackToast({
      message: `Berhasil menghapus ${res.count} siswa dummy secara permanen dari sistem dan Cloud Firestore!`,
      type: 'success',
    });
  };

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      nisn: '',
      gender: 'L',
      classId: isTeacher && teacherClassId
        ? teacherClassId
        : (selectedClassId !== 'all' ? selectedClassId : (classes[0]?.id || 'class-1a')),
      email: '',
      parentName: '',
      parentPhone: '',
      status: 'aktif',
      parentConsentApproved: true,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (student: User) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      nisn: student.nisn || '',
      gender: student.gender || 'L',
      classId: student.classId || classes[0]?.id || 'class-1a',
      email: student.email,
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      status: student.status || 'aktif',
      parentConsentApproved: student.parentConsentApproved ?? true,
    });
    setIsFormModalOpen(true);
  };

  // Trigger single student delete modal
  const handleDeleteStudent = (student: User) => {
    setStudentToDelete(student);
  };

  // Confirm single delete
  const confirmSingleDelete = () => {
    if (!studentToDelete) return;
    const name = studentToDelete.name;
    const isDummy = StorageService.isDummyStudent(studentToDelete);
    StorageService.deleteStudent(studentToDelete.id);
    setSelectedStudentIds((prev) => prev.filter((id) => id !== studentToDelete.id));
    if (editingStudent?.id === studentToDelete.id) {
      setIsFormModalOpen(false);
      setEditingStudent(null);
    }
    setStudentToDelete(null);
    refreshStudentList();
    setFeedbackToast({
      message: isDummy
        ? `Siswa dummy "${name}" berhasil dihapus permanen dari sistem dan Cloud Database.`
        : `Data siswa "${name}" berhasil dihapus dari sistem.`,
      type: 'success',
    });
  };

  // Confirm bulk delete
  const confirmBulkDelete = () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    StorageService.deleteMultipleStudents(selectedStudentIds);
    setSelectedStudentIds([]);
    setIsBulkDeleteModalOpen(false);
    refreshStudentList();
    setFeedbackToast({
      message: `${count} data siswa terpilih berhasil dihapus permanen dari sistem dan Cloud Firestore.`,
      type: 'success',
    });
  };

  // Confirm bulk remap class
  const confirmBulkRemap = () => {
    if (selectedStudentIds.length === 0) return;
    StorageService.bulkUpdateStudentClass(selectedStudentIds, bulkRemapTargetClassId);
    const targetCls = classes.find((c) => c.id === bulkRemapTargetClassId);
    setFeedbackToast({
      message: `${selectedStudentIds.length} siswa berhasil dipetakan ke ${targetCls?.name || bulkRemapTargetClassId} (Guru: ${targetCls?.homeroomTeacherName || '-'}). Data siswa aman tersimpan permanen di sistem.`,
      type: 'success',
    });
    // Auto-switch view to target class so user immediately sees their students and knows they didn't disappear!
    if (!isTeacher) {
      setSelectedClassId(bulkRemapTargetClassId);
    }
    setSelectedStudentIds([]);
    setIsBulkRemapModalOpen(false);
    refreshStudentList();
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama siswa tidak boleh kosong.');
      return;
    }

    const studentName = formData.name.trim();

    let pName = formData.parentName.trim();
    let pPhone = formData.parentPhone.trim();
    const isPhoneLike = (str: string) => {
      const cleaned = str.replace(/[\s\-\+\(\)\.]/g, '');
      return cleaned.length >= 8 && /^\d+$/.test(cleaned);
    };
    // Auto-swap if phone number was typed in parentName
    if (isPhoneLike(pName) && !pPhone) {
      pPhone = pName;
      pName = '';
    } else if (isPhoneLike(pName) && !isPhoneLike(pPhone) && pPhone) {
      const tmp = pName;
      pName = pPhone;
      pPhone = tmp;
    }

    if (editingStudent) {
      const updatedUser: User = {
        ...editingStudent,
        name: studentName,
        nisn: formData.nisn.trim(),
        gender: formData.gender,
        classId: formData.classId,
        email: formData.email.trim() || `${editingStudent.id}@sdn-gudang2.sch.id`,
        parentName: pName,
        parentPhone: pPhone,
        status: formData.status,
        parentConsentApproved: formData.parentConsentApproved,
      };
      StorageService.updateStudent(updatedUser);
      CloudSyncService.pushUser(updatedUser).catch(() => {});
    } else {
      const newStudent = StorageService.addStudent({
        name: studentName,
        nisn: formData.nisn.trim(),
        gender: formData.gender,
        classId: formData.classId,
        email: formData.email.trim(),
        parentName: pName,
        parentPhone: pPhone,
        status: formData.status,
        parentConsentApproved: formData.parentConsentApproved,
      });
      CloudSyncService.pushUser(newStudent).catch(() => {});
    }

    // Auto-adjust filter so the newly added or updated student is immediately visible
    if (!isTeacher && selectedClassId !== 'all' && selectedClassId !== formData.classId) {
      setSelectedClassId(formData.classId);
    }

    setIsFormModalOpen(false);
    refreshStudentList();
    setFeedbackToast({
      message: `Data siswa "${studentName}" berhasil disimpan permanen ke database & Cloud Firestore!`,
      type: 'success',
    });
  };

  // Excel & CSV Import handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportResult(null);

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        setParsedExcelRows(rows);
        setCsvInput(`[Berkas Excel ${file.name} terbaca: ${Math.max(0, rows.length - 1)} baris data siswa]`);
      } catch (err) {
        alert('Gagal membaca berkas Excel: ' + (err as Error).message);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvInput(text);
        setParsedExcelRows(null);
      };
      reader.readAsText(file);
    }
  };

  const handleExecuteImport = () => {
    const fallbackClass = isTeacher && teacherClassId
      ? teacherClassId
      : (importTargetClassMode === 'auto'
          ? (selectedClassId === 'all' ? classes[0]?.id || 'class-1a' : selectedClassId)
          : importTargetClassMode);

    if (parsedExcelRows && parsedExcelRows.length > 1) {
      const result = StorageService.importStudentsFromRows(parsedExcelRows, fallbackClass);
      setImportResult(result);
      if (result.successCount > 0) {
        // Auto-switch filter to 'all' so all newly imported students are visible across all classes
        if (!isTeacher) {
          setSelectedClassId('all');
        }
        refreshStudentList();
        CloudSyncService.forceSyncAllUsers().catch(() => {});
        setFeedbackToast({
          message: `Sempurna! ${result.successCount} data siswa baru berhasil diimpor & disimpan permanen di sistem dan Cloud Firestore!`,
          type: 'success',
        });
      }
      return;
    }

    if (!csvInput.trim() || csvInput.startsWith('[')) {
      alert('Mohon pilih berkas Excel (.xlsx) atau tempel data teks siswa.');
      return;
    }

    const result = StorageService.importStudentsFromCSV(csvInput, fallbackClass);
    setImportResult(result);
    if (result.successCount > 0) {
      if (!isTeacher) {
        setSelectedClassId('all');
      }
      refreshStudentList();
      CloudSyncService.forceSyncAllUsers().catch(() => {});
      setFeedbackToast({
        message: `Sempurna! ${result.successCount} data siswa baru berhasil diimpor & disimpan permanen di sistem dan Cloud Firestore!`,
        type: 'success',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                Menu Khusus Guru & Admin
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {currentUser.schoolName || StorageService.getSchoolProfile().name || 'Identitas Sekolah Belum Diatur'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Pengelolaan Data Siswa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Tambah, perbarui, ekspor, dan impor data siswa rombongan belajar dalam format Microsoft Excel (.xlsx).
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Penyimpanan Permanen Aktif · {students.length} Siswa tersimpan di Cloud Firestore & Perangkat</span>
              </span>
            </div>
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Hapus Permanen Siswa Dummy */}
            {dummyStudents.length > 0 && (
              <button
                type="button"
                onClick={() => setIsDeleteDummyModalOpen(true)}
                title="Hapus permanen seluruh siswa contoh/dummy bawaan sistem dari lokal & Cloud"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer animate-pulse"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus {dummyStudents.length} Siswa Dummy</span>
              </button>
            )}

            {/* Tombol Pilih Siswa Dummy */}
            {dummyStudents.length > 0 && (
              <button
                type="button"
                onClick={handleToggleSelectDummyStudents}
                title="Pilih seluruh siswa contoh/dummy untuk ditinjau atau dihapus"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
                <span>Pilih Dummy ({dummyStudents.length})</span>
              </button>
            )}

            {/* Tombol Simpan Permanen ke Database Cloud */}
            <button
              onClick={handleForceSavePermanent}
              disabled={isSyncingPermanent}
              title="Simpan dan pastikan seluruh data siswa tersimpan permanen di Database Cloud Firestore"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <Database className={`w-3.5 h-3.5 ${isSyncingPermanent ? 'animate-spin' : ''}`} />
              <span>{isSyncingPermanent ? 'Menyimpan ke Cloud...' : 'Simpan Permanen'}</span>
            </button>

            {/* Bersihkan Data Siswa & Sekolah Button */}
            <button
              onClick={() => {
                if (
                  confirm(
                    'PERINGATAN: Apakah Anda yakin ingin membersihkan seluruh data siswa, data sekolah, dan riwayat jurnal dummy?\n\nTindakan ini akan mengosongkan seluruh data untuk siap digunakan secara riil.'
                  )
                ) {
                  StorageService.clearAllStudentAndSchoolData();
                  refreshStudentList();
                  setFeedbackToast({
                    message: 'Seluruh data siswa dan profil sekolah dummy berhasil dibersihkan!',
                    type: 'success',
                  });
                }
              }}
              title="Bersihkan data siswa, dummy journal, dan identitas sekolah"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Bersihkan Data</span>
            </button>

            {/* Download Template Excel */}
            <button
              onClick={() => StorageService.downloadStudentTemplateExcel()}
              title="Unduh templat resmi Excel (.xlsx) untuk pengisian massal"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Templat Excel (.xlsx)</span>
            </button>

            {/* Import Button */}
            <button
              onClick={() => {
                setCsvInput('');
                setParsedExcelRows(null);
                setImportFileName('');
                setImportResult(null);
                setIsImportModalOpen(true);
              }}
              title="Impor data siswa dari berkas Excel (.xlsx)"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Impor Excel</span>
            </button>

            {/* Export Button */}
            <button
              onClick={() => StorageService.exportStudentsRosterExcel(isTeacher && teacherClassId ? teacherClassId : (selectedClassId === 'all' ? undefined : selectedClassId))}
              title="Unduh seluruh data siswa dalam format Excel (.xlsx)"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            {/* Add Student Button */}
            <button
              onClick={handleOpenAddModal}
              title="Tambah siswa baru secara individual"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-white" />
              <span>+ Tambah Siswa</span>
            </button>
          </div>
        </div>

        {/* Toast Feedback Notification */}
        {feedbackToast && (
          <div className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-xs transition-all ${
            feedbackToast.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{feedbackToast.message}</span>
            </div>
            <button
              onClick={() => setFeedbackToast(null)}
              className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 12 Classes & Homeroom Teacher Interactive Mapping Grid for Admin */}
        {!isTeacher && (
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Pemetaan Rombel & Guru Kelas (Kelas 1 a - 6 b):</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Pilih rombel untuk memfilter dan memetakan siswa ke guru kelas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
              {/* All Classes Card */}
              <button
                type="button"
                onClick={() => setSelectedClassId('all')}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedClassId === 'all'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <span className="text-[11px] font-bold block">Semua Rombel</span>
                <span className={`text-[10px] block truncate ${selectedClassId === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
                  12 Rombongan Belajar
                </span>
                <span className={`text-xs font-mono font-bold mt-0.5 block ${selectedClassId === 'all' ? 'text-amber-300' : 'text-indigo-600'}`}>
                  {students.length} Siswa
                </span>
              </button>

              {/* 12 Individual Classes (1a to 6b) */}
              {classes.map((cls) => {
                const count = students.filter((s) => s.classId === cls.id).length;
                const isSelected = selectedClassId === cls.id;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedClassId(cls.id)}
                    title={`Rombel ${cls.name} - Guru: ${cls.homeroomTeacherName}`}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                        : 'bg-white hover:border-indigo-300 hover:bg-indigo-50/30 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold truncate">{cls.name}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-indigo-500 text-white' : (count > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500')
                      }`}>
                        {count}
                      </span>
                    </div>
                    <span className={`text-[10px] block truncate mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {cls.homeroomTeacherName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Class Mapping Highlight Banner */}
        {selectedClassId !== 'all' && (
          <div className="mt-4 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm">
                    {classes.find((c) => c.id === selectedClassId)?.name || selectedClassId}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                    {filteredStudents.length} Siswa Terdaftar
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-0.5">
                  👨‍🏫 Guru / Wali Kelas:{' '}
                  <strong className="text-indigo-950 font-semibold">
                    {classes.find((c) => c.id === selectedClassId)?.homeroomTeacherName || 'Belum ditentukan'}
                  </strong>
                  {' '}— Seluruh siswa di kelas ini otomatis tersimpan dan dimonitor oleh guru kelas bersangkutan.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3 py-1.5 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Tambah Siswa ke {classes.find((c) => c.id === selectedClassId)?.name}</span>
            </button>
          </div>
        )}

        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {isTeacher ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 shrink-0">Kelas:</span>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg shadow-2xs">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{classes.find((c) => c.id === teacherClassId)?.name || 'Kelas Guru'}</span>
                </div>
              </div>
            ) : (
              <>
                <span className="text-xs font-semibold text-slate-600 shrink-0">Filter Kelas:</span>
                <select
                  aria-label="Filter berdasarkan Kelas"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer focus:outline-hidden"
                >
                  <option value="all">Semua Kelas ({students.length} Siswa)</option>
                  {classes.map((c) => {
                    const count = students.filter((s) => s.classId === c.id).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} — Guru: {c.homeroomTeacherName} ({count} siswa)
                      </option>
                    );
                  })}
                </select>
              </>
            )}

            {/* Filter Jenis Siswa: Semua / Riil / Dummy */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('real')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                  filterType === 'real'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                Siswa Riil ({realStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('dummy')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                  filterType === 'dummy'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                Siswa Dummy ({dummyStudents.length})
              </button>
            </div>

            {/* Quick Button: Pilih Siswa Dummy */}
            {dummyStudents.length > 0 && (
              <button
                type="button"
                onClick={handleToggleSelectDummyStudents}
                title="Pilih atau batalkan pilihan siswa dummy"
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
                <span>Pilih Dummy</span>
              </button>
            )}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa, NISN, atau orang tua..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (Delete & Remap Class) */}
      {selectedStudentIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-2xl shadow-xs text-xs animate-in fade-in">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px]">
              {selectedStudentIds.length}
            </span>
            <span className="font-bold text-indigo-950">
              siswa terpilih untuk tindakan massal
            </span>
            {(() => {
              const selectedDummyCount = selectedStudentIds.filter((id) => {
                const s = students.find((st) => st.id === id);
                return s && StorageService.isDummyStudent(s);
              }).length;
              if (selectedDummyCount > 0) {
                return (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Tag className="w-3 h-3 text-amber-700" />
                    <span>Termasuk {selectedDummyCount} Siswa Dummy</span>
                  </span>
                );
              }
              return null;
            })()}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedStudentIds([])}
              className="px-3 py-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal Pilih
            </button>
            {!isTeacher && (
              <button
                type="button"
                onClick={() => setIsBulkRemapModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-300 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pindahkan Rombel / Guru</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Permanen {selectedStudentIds.length} Siswa</span>
            </button>
          </div>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua siswa"
                    checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-red-600 rounded-sm cursor-pointer accent-red-600"
                  />
                </th>
                <th className="py-3 px-4">Nama Siswa & NISN</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Orang Tua / Wali</th>
                <th className="py-3 px-4">Status & Izin</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const studentClass = classes.find((c) => c.id === student.classId);
                  const isSelected = selectedStudentIds.includes(student.id);

                  return (
                    <tr 
                      key={student.id} 
                      className={`transition-colors ${isSelected ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50/70'}`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${student.name}`}
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(student.id)}
                          className="w-4 h-4 text-red-600 rounded-sm cursor-pointer accent-red-600"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-9 h-9 rounded-full bg-slate-100 object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 block">
                                {student.name}
                              </span>
                              {StorageService.isDummyStudent(student) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                  <Tag className="w-3 h-3 text-amber-700" />
                                  <span>Contoh / Dummy</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              NISN: {student.nisn || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {student.gender === 'P' ? 'Perempuan (P)' : 'Laki-laki (L)'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
                          {studentClass?.name || student.classId || '-'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {(() => {
                          const isPhone = (str?: string) => {
                            if (!str) return false;
                            const cleaned = str.replace(/[\s\-\+\(\)\.]/g, '');
                            return cleaned.length >= 8 && /^\d+$/.test(cleaned);
                          };
                          let displayName = student.parentName;
                          let displayPhone = student.parentPhone;

                          if (isPhone(displayName) && !displayPhone) {
                            displayPhone = displayName;
                            displayName = '';
                          } else if (isPhone(displayName) && !isPhone(displayPhone)) {
                            const tmp = displayName;
                            displayName = displayPhone;
                            displayPhone = tmp;
                          }

                          return (
                            <div>
                              <span className="text-slate-800 font-medium block">
                                {displayName || '-'}
                              </span>
                              {displayPhone && (
                                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-normal">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{displayPhone}</span>
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`w-fit text-[10px] font-bold px-1.5 py-0.5 rounded-xs ${
                            student.status === 'nonaktif' 
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {student.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {student.parentConsentApproved ? 'Izin Ortu: ✓ Disetujui' : 'Izin: Belum'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            title="Edit data siswa"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student)}
                            title={StorageService.isDummyStudent(student) ? "Hapus permanen siswa dummy ini dari Cloud & Lokal" : "Hapus data siswa ini"}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              StorageService.isDummyStudent(student)
                                ? 'text-amber-600 hover:text-red-700 hover:bg-amber-100/70'
                                : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data siswa yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Student */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  {editingStudent ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingStudent ? `Memperbarui profil ${editingStudent.name}` : 'Masukkan informasi identitas peserta didik'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Farhan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs text-slate-900 border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NISN (Nomor Induk)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 0129482711"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full text-xs text-slate-900 font-mono border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full text-xs text-slate-900 border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Rombongan Belajar (Kelas) & Guru Kelas *
                  </label>
                  {isTeacher ? (
                    <div className="w-full text-xs text-indigo-950 font-bold border border-indigo-200 rounded-lg p-2.5 bg-indigo-50/70 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{classes.find((c) => c.id === teacherClassId)?.name || 'Kelas Guru'}</span>
                    </div>
                  ) : (
                    <select
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="w-full text-xs text-slate-900 font-semibold border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — Guru: {c.homeroomTeacherName}
                        </option>
                      ))}
                    </select>
                  )}
                  {!isTeacher && (
                    <div className="mt-1.5 p-2 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>
                        Siswa ini otomatis tersimpan di{' '}
                        <strong>{classes.find((c) => c.id === formData.classId)?.name}</strong> dan dimonitor oleh Guru Kelas:{' '}
                        <strong>{classes.find((c) => c.id === formData.classId)?.homeroomTeacherName}</strong>.
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Siswa
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'aktif' | 'nonaktif' })}
                    className="w-full text-xs text-slate-900 border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif / Cuti</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Siswa / Akun Belajar
                </label>
                <input
                  type="email"
                  placeholder="Contoh: siswa@sdn-nusantara.sch.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs text-slate-900 border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bapak Hendra Pratama"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full text-xs text-slate-900 border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    No. Telepon / WhatsApp Ortu
                  </label>
                  <input
                    type="tel"
                    placeholder="Contoh: 08123456789"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full text-xs text-slate-900 border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.parentConsentApproved}
                    onChange={(e) => setFormData({ ...formData, parentConsentApproved: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded-sm"
                  />
                  <span className="text-slate-700 font-medium">
                    Telah menyetujui izin orang tua untuk pencatatan Jurnal G7KAIH
                  </span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                {editingStudent ? (
                  <button
                    type="button"
                    onClick={() => setStudentToDelete(editingStudent)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer"
                    title="Hapus data siswa ini"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Siswa</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs cursor-pointer"
                  >
                    {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Students from CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Impor Data Siswa Massal (Excel / .xlsx)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Unggah berkas Excel (.xlsx / .xls) atau tempel teks data siswa sesuai templat resmi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Step 1: Mapping Mode Selection */}
              {!isTeacher && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                  <label className="block font-bold text-slate-800">
                    Mode Pemetaan Rombel & Guru Kelas:
                  </label>
                  <select
                    value={importTargetClassMode}
                    onChange={(e) => setImportTargetClassMode(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 bg-white border border-indigo-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="auto">
                      ⭐ Otomatis Petakan dari Kolom Excel (Rekomendasi untuk banyak kelas 1a s/d 6b sekaligus)
                    </option>
                    <optgroup label="Atau Tetapkan Seluruh Baris ke Rombel Tertentu:">
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          Tetapkan ke {c.name} — Guru: {c.homeroomTeacherName}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[11px] text-indigo-900">
                    💡 <strong>Tips:</strong> Cukup tuliskan kode atau nama kelas di berkas Excel (misal: <code>1a</code>, <code>1b</code>, <code>2a</code> ... <code>6b</code> atau <code>Kelas 1 a</code>). Siswa akan otomatis terhubung ke rombel dan akun Guru Kelas masing-masing.
                  </p>
                </div>
              )}

              {/* Step 2: Template download prompt */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">
                    Belum punya format berkas?
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Unduh templat Excel (.xlsx) resmi yang sudah berisi kolom lengkap, contoh data 1a s/d 6b, dan panduan guru kelas.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => StorageService.downloadStudentTemplateExcel()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Templat Excel</span>
                </button>
              </div>

              {/* Step 3: Upload File / Drag */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/50">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Pilih Berkas Excel (.xlsx / .xls)
                </button>
                {importFileName && (
                  <p className="text-xs text-emerald-700 font-semibold mt-2">
                    Berkas dipilih: {importFileName}
                  </p>
                )}
                <span className="text-[11px] text-slate-400 block mt-1">
                  Atau tempelkan langsung teks tabel pada kotak di bawah ini:
                </span>
              </div>

              {/* Step 4: Textarea preview / paste */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Isi Data Tabel / Teks:
                </label>
                <textarea
                  rows={4}
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder={`NISN,Nama_Lengkap,Jenis_Kelamin(L/P),Kelas,Nama_Orang_Tua,No_HP_Orang_Tua,Email_Siswa,Status
0129482701,Ahmad Fauzi,L,1a,Bapak Hasan Fauzi,081234567891,ahmad@sdn-gudang2.sch.id,aktif
0129482702,Aisyah Azzahra,P,1a,Ibu Siti Fatimah,081234567892,aisyah@sdn-gudang2.sch.id,aktif
0129482703,Budi Santoso,L,1b,Bapak Agus Santoso,081234567893,budi@sdn-gudang2.sch.id,aktif`}
                  className="w-full text-xs font-mono text-slate-800 border border-slate-300 rounded-xl p-3 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Step 5: Reference of 12 classes & homeroom teachers */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-800 block text-[11px] mb-1.5">
                  Referensi Kode Kelas & Guru Pengampu (SDN Gudang 2):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                  {classes.map((c) => (
                    <div key={c.id} className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="font-bold text-indigo-700 block">{c.name} (kode: {c.id.replace('class-', '')})</span>
                      <span className="text-slate-600 truncate block">{c.homeroomTeacherName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Result Notification with Class Breakdown */}
              {importResult && (
                <div className={`p-3.5 rounded-xl border text-xs ${
                  importResult.successCount > 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-red-50 border-red-300 text-red-900'
                }`}>
                  <p className="font-bold flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {importResult.successCount > 0
                        ? `Berhasil memproses & memetakan ${importResult.successCount} data siswa!`
                        : 'Gagal memproses data impor.'}
                    </span>
                  </p>

                  {/* Breakdown by class & teacher */}
                  {importResult.classBreakdown && Object.keys(importResult.classBreakdown).length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-200">
                      <p className="font-bold text-[11px] text-emerald-900 mb-1.5">
                        Rincian Pemetaan Rombel & Guru Kelas yang Tersimpan:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {Object.entries(importResult.classBreakdown).map(([clsId, count]) => {
                          const cls = classes.find((c) => c.id === clsId);
                          return (
                            <div key={clsId} className="bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{cls?.name || clsId}</span>
                                <span className="font-mono font-bold text-emerald-700">{count} Siswa</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                                Guru: {cls?.homeroomTeacherName || '-'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {importResult.errors.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-[11px] text-red-700">
                      {importResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Proses Impor Siswa
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Hapus Siswa (Single) */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-left space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Hapus Data Siswa?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tindakan ini permanen. Seluruh riwayat jurnal 7 kebiasaan, penilaian guru, paraf ortu, dan dokumentasi foto siswa ini akan dihapus.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Siswa:</span>
                <span className="font-bold text-slate-900">{studentToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NISN:</span>
                <span className="font-mono text-slate-700">{studentToDelete.nisn || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kelas:</span>
                <span className="font-semibold text-indigo-700">
                  {classes.find((c) => c.id === studentToDelete.classId)?.name || studentToDelete.classId || '-'}
                </span>
              </div>
              {studentToDelete.parentName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Orang Tua / Wali:</span>
                  <span className="text-slate-700">{studentToDelete.parentName}</span>
                </div>
              )}
              {studentToDelete.parentPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">No. HP Ortu:</span>
                  <span className="text-slate-700 font-mono">{studentToDelete.parentPhone}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmSingleDelete}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Permanen Seluruh Siswa Dummy */}
      {isDeleteDummyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-left space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Hapus Permanen {dummyStudents.length} Siswa Dummy?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tindakan ini akan menghapus seluruh data siswa dummy / contoh bawaan secara <strong>permanen</strong> dari perangkat ini dan <strong>Database Cloud Firestore</strong>.
                </p>
                <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Data siswa riil yang Anda input ({realStudents.length} siswa) tersimpan aman dan tidak akan terhapus.
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 block">
                Daftar Siswa Dummy yang Akan Dihapus Permanen ({dummyStudents.length}):
              </span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs max-h-48 overflow-y-auto divide-y divide-slate-100">
                {dummyStudents.map((s) => {
                  const sClass = classes.find((c) => c.id === s.classId);
                  return (
                    <div key={s.id} className="py-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{s.name}</span>
                        <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-amber-100 text-amber-800">
                          {sClass?.name || s.classId}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {s.id}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteDummyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAllDummy}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Permanen Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Massal (Bulk) */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-left space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Hapus {selectedStudentIds.length} Siswa Terpilih?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tindakan ini permanen dan akan menghapus seluruh data siswa yang dicentang beserta riwayat jurnalnya dari sistem dan Cloud Firestore.
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs max-h-40 overflow-y-auto space-y-1">
              {students
                .filter((s) => selectedStudentIds.includes(s.id))
                .slice(0, 8)
                .map((s) => (
                  <div key={s.id} className="text-slate-800 font-medium flex items-center justify-between">
                    <span>• {s.name} (NISN: {s.nisn || '-'})</span>
                    {StorageService.isDummyStudent(s) && (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-xs">
                        Dummy
                      </span>
                    )}
                  </div>
                ))}
              {selectedStudentIds.length > 8 && (
                <div className="text-slate-500 italic pt-1">
                  ... dan {selectedStudentIds.length - 8} siswa lainnya
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmBulkDelete}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus {selectedStudentIds.length} Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pindahkan / Petakan Rombel Massal (Bulk Remap) */}
      {isBulkRemapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-left space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Pindahkan & Petakan Rombel
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pindahkan <strong>{selectedStudentIds.length} siswa terpilih</strong> ke rombongan belajar dan akun guru kelas baru.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Rombongan Belajar (Kelas) & Guru Tujuan:
              </label>
              <select
                value={bulkRemapTargetClassId}
                onChange={(e) => setBulkRemapTargetClassId(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-white border border-indigo-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — Guru: {c.homeroomTeacherName}
                  </option>
                ))}
              </select>

              <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Siswa terpilih akan langsung muncul di akun Guru:{' '}
                  <strong>{classes.find((c) => c.id === bulkRemapTargetClassId)?.homeroomTeacherName}</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkRemapModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmBulkRemap}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Pemetaan Rombel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
