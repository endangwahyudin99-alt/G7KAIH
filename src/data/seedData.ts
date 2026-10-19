import {
  HabitDefinition,
  HabitId,
  User,
  SchoolClass,
  DailyJournal,
  BadgeAchievement,
  SchoolProfile,
} from '../types';

import heroStudentsImg from '../assets/images/hero_g7kaih_students_1791892026065.jpg';
import badgeEmblemImg from '../assets/images/badge_hebat_emblem_1791892025605.jpg';
import sdnGudang2Logo from '../assets/images/sdn_gudang_2_logo_1792116612390.jpg';

export const HERO_STUDENTS_IMG = heroStudentsImg;
export const BADGE_EMBLEM_IMG = badgeEmblemImg;
export const OFFICIAL_SDN_GUDANG_2_LOGO = sdnGudang2Logo;

export function resolveSchoolLogo(logoUrl?: string | null): string {
  if (!logoUrl) return OFFICIAL_SDN_GUDANG_2_LOGO;
  if (
    logoUrl.includes('sdn_gudang_2_logo') ||
    logoUrl.startsWith('/src/assets/') ||
    logoUrl.startsWith('/assets/images/sdn_gudang_2_logo')
  ) {
    return OFFICIAL_SDN_GUDANG_2_LOGO;
  }
  return logoUrl;
}

export const INITIAL_SCHOOL_PROFILE: SchoolProfile = {
  id: 'main',
  name: 'SD NEGERI GUDANG 2',
  npsn: '20204772',
  address: 'Kp. Tonjong hilir Rt.03 Rw.04 Desa Gudang',
  city: 'Cianjur',
  province: 'Jawa Barat',
  phone: '0877-2141-1140',
  email: 'sdn.gudang.dua@gmail.com',
  website: '',
  principalName: 'Nelis Nursidah, S.Pd., M.M',
  principalNip: '197206112007012006',
  academicYear: '2025/2026',
  semester: 'Ganjil',
  gradeLevel: 'SD',
  logoUrl: OFFICIAL_SDN_GUDANG_2_LOGO,
};

export const G7KAIH_HABITS: HabitDefinition[] = [
  {
    id: 'bangun_pagi',
    order: 1,
    title: '1. Bangun Pagi',
    shortTitle: 'Bangun Pagi',
    slogan: 'Membuka hari dengan semangat, syukur, dan disiplin waktu.',
    description: 'Bangun sebelum subuh/pagi hari, bersyukur, dan merapikan tempat tidur sendiri.',
    iconName: 'Sunrise',
    accentColor: 'amber',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-500',
    suggestedTime: '04:30 - 05:30 WIB',
    points: 15,
  },
  {
    id: 'beribadah',
    order: 2,
    title: '2. Beribadah',
    shortTitle: 'Beribadah',
    slogan: 'Meningkatkan keimanan, ketaqwaan, dan akhlak mulia.',
    description: 'Menunaikan ibadah sesuai agama & keyakinan masing-masing (sholat, doa, puja bakti, kebaktian).',
    iconName: 'HeartHandshake',
    accentColor: 'emerald',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    textColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-500',
    suggestedTime: 'Pagi / Setiap Waktu',
    points: 20,
  },
  {
    id: 'berolahraga',
    order: 3,
    title: '3. Berolahraga',
    shortTitle: 'Berolahraga',
    slogan: 'Tubuh bugar, pikiran segar, daya tahan prima.',
    description: 'Aktivitas fisik teratur minimal 15–30 menit (senam pagi, lari, bersepeda, skipping, atau peregangan).',
    iconName: 'Activity',
    accentColor: 'rose',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    textColor: 'text-rose-700',
    badgeBg: 'bg-rose-500',
    suggestedTime: '06:00 - 07:00 / Sore Hari',
    points: 15,
  },
  {
    id: 'makan_sehat',
    order: 4,
    title: '4. Makan Sehat & Bergizi',
    shortTitle: 'Makan Sehat',
    slogan: 'Asupan gizi seimbang untuk pertumbuhan dan kecerdasan.',
    description: 'Makan tepat waktu dengan menu gizi seimbang (karbohidrat, protein, sayuran, buah, dan air putih/susu).',
    iconName: 'Utensils',
    accentColor: 'teal',
    bgLight: 'bg-teal-50',
    borderLight: 'border-teal-200',
    textColor: 'text-teal-700',
    badgeBg: 'bg-teal-500',
    suggestedTime: 'Sarapan / Siang / Malam',
    points: 15,
  },
  {
    id: 'gemar_belajar',
    order: 5,
    title: '5. Gemar Belajar',
    shortTitle: 'Gemar Belajar',
    slogan: 'Membaca buku dan menambah ilmu pengetahuan setiap hari.',
    description: 'Membaca buku pelajaran atau cerita, mengulang materi, dan mengerjakan tugas dengan tekun.',
    iconName: 'BookOpen',
    accentColor: 'sky',
    bgLight: 'bg-sky-50',
    borderLight: 'border-sky-200',
    textColor: 'text-sky-700',
    badgeBg: 'bg-sky-500',
    suggestedTime: 'Sore / Malam Hari',
    points: 20,
  },
  {
    id: 'bermasyarakat',
    order: 6,
    title: '6. Bermasyarakat',
    shortTitle: 'Bermasyarakat',
    slogan: 'Peduli sesama, gotong royong, dan berbakti pada orang tua.',
    description: 'Membantu orang tua di rumah, gotong royong lingkungan, atau bersikap santun kepada teman & tetangga.',
    iconName: 'Users',
    accentColor: 'violet',
    bgLight: 'bg-violet-50',
    borderLight: 'border-violet-200',
    textColor: 'text-violet-700',
    badgeBg: 'bg-violet-500',
    suggestedTime: 'Sepanjang Hari',
    points: 15,
  },
  {
    id: 'tidur_cepat',
    order: 7,
    title: '7. Tidur Cepat',
    shortTitle: 'Tidur Cepat',
    slogan: 'Istirahat cukup tepat waktu untuk memulihkan energi.',
    description: 'Tidur sebelum larut malam (maksimal pukul 21.00–21.30), kurangi layar gawai, dan berdoa sebelum tidur.',
    iconName: 'Moon',
    accentColor: 'indigo',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    textColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-500',
    suggestedTime: '20:30 - 21:30 WIB',
    points: 15,
  },
];

export const INITIAL_CLASSES: SchoolClass[] = [
  {
    id: 'class-1a',
    name: 'Kelas 1 a',
    gradeLevel: 'SD',
    academicYear: '2025/2026',
    homeroomTeacherId: 'user-guru-1a',
    homeroomTeacherName: 'Neng Nani Inayatilah, S.Pd.',
    totalStudents: 0,
  },
  {
    id: 'class-1b',
    name: 'Kelas 1 b',
    gradeLevel: 'SD',
    academicYear: '2025/2026',
    homeroomTeacherId: 'user-guru-1b',
    homeroomTeacherName: 'Dika Meidinda, S.E',
    totalStudents: 0,
  },
  {
    id: 'class-2a',
    name: 'Kelas 2 a',
    gradeLevel: 'SD',
    academicYear: '2025/2026',
    homeroomTeacherId: 'user-guru-2a',
    homeroomTeacherName: 'Hasanah Nurhayati, S.Pd.I',
    totalStudents: 0,
  },
  {
    id: 'class-2b',
    name: 'Kelas 2 b',
    gradeLevel: 'SD',
    academicYear: '2025/2026',
    homeroomTeacherId: 'user-guru-2b',
    homeroomTeacherName: 'Eneng Siti Inne Nuraeni, S.Pd.I',
    totalStudents: 0,
  },
  {
    id: 'class-3a',
    name: 'Kelas 3 a',
    gradeLevel: 'SD',
    academicYear: '2025/2026',
    homeroomTeacherId: 'user-guru-3a',
    homeroomTeacherName: 'Iin Yuningsih, S.Pd.I',
    totalStudents: 0,
  },
  {
    id: 'class-3b',
    name: 'Kelas 3 b',
    gradeLevel: 'SD',
    academicYear: '2025/2026',
    homeroomTeacherId: 'user-guru-3b',
    homeroomTeacherName: 'Endang Wahyudin',
    totalStudents: 0,
  },
  {
    id: 'class-4a',
    name: 'Kelas 4 a',
    gradeLevel: 'SD',
    academicYear: '2025/2026',
    homeroomTeacherId: 'user-guru-4a',
    homeroomTeacherName: 'Eka Parlian Siska, S.Pd.',
    totalStudents: 0,
  },
  {
    id: 'class-4b',
    name: 'Kelas 4 b',
    gradeLevel: 'SD',
    academicYear: '2025/2026',
    homeroomTeacherId: 'user-guru-4b',
    homeroomTeacherName: 'Muhammad Angga Wirawan, S.S',
    totalStudents: 0,
  },
  {
    id: 'class-5a',
    name: 'Kelas 5 a',
    gradeLevel: 'SD',
    academicYear: '2025/2026',
    homeroomTeacherId: 'user-guru-5a',
    homeroomTeacherName: 'Reni Samsiah, S.Pd.',
    totalStudents: 0,
  },
  {
    id: 'class-5b',
    name: 'Kelas 5 b',
    gradeLevel: 'SD',
    academicYear: '2025/2026',
    homeroomTeacherId: 'user-guru-5b',
    homeroomTeacherName: 'Vita Apriani, S.Pd.',
    totalStudents: 0,
  },
  {
    id: 'class-6a',
    name: 'Kelas 6 a',
    gradeLevel: 'SD',
    academicYear: '2025/2026',
    homeroomTeacherId: 'user-guru-6a',
    homeroomTeacherName: 'Dewi Puspitasari, S.Pd.',
    totalStudents: 0,
  },
  {
    id: 'class-6b',
    name: 'Kelas 6 b',
    gradeLevel: 'SD',
    academicYear: '2025/2026',
    homeroomTeacherId: 'user-guru-6b',
    homeroomTeacherName: 'Edi Supriadi, S.Pd.',
    totalStudents: 0,
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-guru-1a',
    name: 'Neng Nani Inayatilah, S.Pd.',
    role: 'guru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NengNaniInayatilah',
    email: 'nengnani@sekolah.sch.id',
    schoolName: '',
    classId: 'class-1a',
  },
  {
    id: 'user-guru-1b',
    name: 'Dika Meidinda, S.E',
    role: 'guru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DikaMeidinda',
    email: 'dikameidinda@sekolah.sch.id',
    schoolName: '',
    classId: 'class-1b',
  },
  {
    id: 'user-guru-2a',
    name: 'Hasanah Nurhayati, S.Pd.I',
    role: 'guru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HasanahNurhayati',
    email: 'hasanah@sekolah.sch.id',
    schoolName: '',
    classId: 'class-2a',
  },
  {
    id: 'user-guru-2b',
    name: 'Eneng Siti Inne Nuraeni, S.Pd.I',
    role: 'guru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EnengSitiInne',
    email: 'enengsiti@sekolah.sch.id',
    schoolName: '',
    classId: 'class-2b',
  },
  {
    id: 'user-guru-3a',
    name: 'Iin Yuningsih, S.Pd.I',
    role: 'guru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=IinYuningsih',
    email: 'iinyuningsih@sekolah.sch.id',
    schoolName: '',
    classId: 'class-3a',
  },
  {
    id: 'user-guru-3b',
    name: 'Endang Wahyudin',
    role: 'guru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EndangWahyudin',
    email: 'endangwahyudin@sekolah.sch.id',
    schoolName: '',
    classId: 'class-3b',
  },
  {
    id: 'user-guru-4a',
    name: 'Eka Parlian Siska, S.Pd.',
    role: 'guru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EkaParlianSiska',
    email: 'ekaparlian@sekolah.sch.id',
    schoolName: '',
    classId: 'class-4a',
  },
  {
    id: 'user-guru-4b',
    name: 'Muhammad Angga Wirawan, S.S',
    role: 'guru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MuhammadAnggaWirawan',
    email: 'muhammadangga@sekolah.sch.id',
    schoolName: '',
    classId: 'class-4b',
  },
  {
    id: 'user-guru-5a',
    name: 'Reni Samsiah, S.Pd.',
    role: 'guru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ReniSamsiah',
    email: 'renisamsiah@sekolah.sch.id',
    schoolName: '',
    classId: 'class-5a',
  },
  {
    id: 'user-guru-5b',
    name: 'Vita Apriani, S.Pd.',
    role: 'guru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VitaApriani',
    email: 'vitaapriani@sekolah.sch.id',
    schoolName: '',
    classId: 'class-5b',
  },
  {
    id: 'user-guru-6a',
    name: 'Dewi Puspitasari, S.Pd.',
    role: 'guru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DewiPuspitasari',
    email: 'dewipuspitasari@sekolah.sch.id',
    schoolName: '',
    classId: 'class-6a',
  },
  {
    id: 'user-guru-6b',
    name: 'Edi Supriadi, S.Pd.',
    role: 'guru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EdiSupriadi',
    email: 'edisupriadi@sekolah.sch.id',
    schoolName: '',
    classId: 'class-6b',
  },
  {
    id: 'user-admin-1',
    name: 'Administrator Sekolah',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminSekolah',
    email: 'admin@sekolah.sch.id',
    schoolName: '',
  },
];

export const DUMMY_STUDENT_IDS = [
  'user-siswa-1a-1', 'user-siswa-1a-2',
  'user-siswa-1b-1', 'user-siswa-1b-2',
  'user-siswa-2a-1', 'user-siswa-2a-2',
  'user-siswa-2b-1', 'user-siswa-2b-2',
  'user-siswa-3a-1', 'user-siswa-3a-2',
  'user-siswa-3b-1', 'user-siswa-3b-2',
  'user-siswa-4a-1', 'user-siswa-4a-2',
  'user-siswa-4b-1', 'user-siswa-4b-2',
  'user-siswa-5a-1', 'user-siswa-5a-2',
  'user-siswa-5b-1', 'user-siswa-5b-2',
  'user-siswa-6a-1', 'user-siswa-6a-2',
  'user-siswa-6b-1', 'user-siswa-6b-2',
];

export const DUMMY_STUDENT_NAMES: string[] = [
  'Ahmad Fauzi', 'Siti Aisyah',
  'Budi Santoso', 'Dewi Lestari',
  'Muhammad Rizky', 'Rizky Pratama', 'Nabila Putri',
  'Dimas Pratama', 'Dimas Setiawan', 'Annisa Rahma',
  'Fajar Nugraha', 'Fajar Hidayat', 'Zahra Amelia',
  'Reza Ramadhan', 'Syifa Nuraini', 'Syifa Fauziah',
  'Bayu Wicaksono', 'Bayu Saputra', 'Salma Khairunnisa', 'Salma Putri',
  'Aditia Pratama', 'Aditya Nugraha', 'Tiara Andini', 'Tiara Lestari',
  'Rifky Alamsyah', 'Rifki Hidayat', 'Citra Kirana',
  'Gilang Ramadhan', 'Gilang Pratama', 'Putri Maharani', 'Putri Anggraini',
  'Kevin Sanjaya', 'Kevin Pratama', 'Amanda Manopo', 'Amanda Zahra',
  'Rizki Febian', 'Rizki Maulana', 'Maudy Ayunda',
];

export function isDummyStudentId(id?: string): boolean {
  if (!id) return false;
  if (DUMMY_STUDENT_IDS.includes(id)) return true;
  if (/^user-siswa-[1-6][ab]-[0-9]+$/i.test(id)) return true;
  const lower = id.toLowerCase();
  if (lower.includes('dummy') || lower.includes('contoh') || lower.includes('sample')) return true;
  return false;
}

export function isDummyStudent(user: User): boolean {
  if (!user || user.role !== 'siswa') return false;
  if (isDummyStudentId(user.id)) return true;
  const nameLower = (user.name || '').trim().toLowerCase();
  if (
    nameLower.includes('dummy') ||
    nameLower.includes('contoh') ||
    nameLower.includes('tester') ||
    nameLower.startsWith('sample') ||
    nameLower.startsWith('siswa contoh')
  ) {
    return true;
  }
  if (user.email && (user.email.toLowerCase().includes('dummy') || user.email.toLowerCase().includes('contoh'))) {
    return true;
  }
  if (user.nisn && (user.nisn.toLowerCase().includes('dummy') || user.nisn === '0000000000')) {
    return true;
  }
  if (DUMMY_STUDENT_NAMES.some((dn) => dn.toLowerCase() === nameLower) && user.id.startsWith('user-siswa-')) {
    return true;
  }
  return false;
}

export const INITIAL_BADGES: BadgeAchievement[] = [
  {
    id: 'badge-1',
    name: 'Disiplin Fajar',
    description: 'Berhasil bangun pagi sebelum pukul 05:00 selama 3 hari berturut-turut.',
    icon: '🌅',
    requiredStreakOrCount: 3,
    unlocked: false,
    category: 'habit_specific',
  },
  {
    id: 'badge-2',
    name: 'Bintang Sehat',
    description: 'Rutin berolahraga dan mengonsumsi makanan bergizi lengkap selama 5 hari.',
    icon: '🥗',
    requiredStreakOrCount: 5,
    unlocked: false,
    category: 'habit_specific',
  },
  {
    id: 'badge-3',
    name: 'Pejuang 7 Kebiasaan',
    description: 'Menyelesaikan seluruh 7 kebiasaan lengkap dengan bukti foto hari ini.',
    icon: '⭐',
    requiredStreakOrCount: 1,
    unlocked: false,
    category: 'perfection',
  },
  {
    id: 'badge-4',
    name: 'Streak Hebat 7 Hari',
    description: 'Mengisi jurnal 7 hari berturut-turut tanpa jeda.',
    icon: '🔥',
    requiredStreakOrCount: 7,
    unlocked: false,
    category: 'streak',
  },
  {
    id: 'badge-5',
    name: 'Kutu Buku Pintar',
    description: 'Mencatat kegiatan membaca buku lebih dari 30 menit selama 5 hari.',
    icon: '📚',
    requiredStreakOrCount: 5,
    unlocked: false,
    category: 'habit_specific',
  },
  {
    id: 'badge-6',
    name: 'Anak Berbakti & Santun',
    description: 'Membantu orang tua dan lingkungan sosial selama 7 hari.',
    icon: '🤝',
    requiredStreakOrCount: 7,
    unlocked: false,
    category: 'habit_specific',
  },
];

// Helper to generate sample image data uri placeholder (svg with friendly design)
export function createMockSamplePhoto(habitName: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <rect width="600" height="450" fill="#0f172a"/>
    <rect x="20" y="20" width="560" height="410" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <circle cx="300" cy="180" r="64" fill="#38bdf8" opacity="0.2"/>
    <text x="300" y="190" font-family="sans-serif" font-size="44" font-weight="bold" fill="#38bdf8" text-anchor="middle">📷</text>
    <text x="300" y="270" font-family="sans-serif" font-size="20" font-weight="bold" fill="#f8fafc" text-anchor="middle">Bukti Kegiatan: ${habitName}</text>
    <text x="300" y="300" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">${label}</text>
    <rect x="50" y="380" width="500" height="32" rx="8" fill="#090d16" opacity="0.8"/>
    <text x="70" y="401" font-family="sans-serif" font-size="12" fill="#38bdf8" font-weight="600">G7KAIH Verified · Foto Asli Siswa</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Generate realistic mock daily journals for the last 3 days (kosong untuk data bersih)
export function generateSeedJournals(): Record<string, DailyJournal> {
  return {};
}
