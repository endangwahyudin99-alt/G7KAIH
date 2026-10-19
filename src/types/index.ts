export type UserRole = 'siswa' | 'guru' | 'orang_tua' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
  schoolName: string;
  // Role specific references
  classId?: string; // For siswa & guru
  nisn?: string; // For siswa
  gender?: 'L' | 'P';
  parentName?: string;
  parentPhone?: string;
  phone?: string;
  status?: 'aktif' | 'nonaktif';
  childId?: string; // For orang_tua (points to siswa user id)
  parentConsentApproved?: boolean;
}

export interface SchoolProfile {
  id?: string;
  name: string;
  npsn: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  website?: string;
  principalName: string;
  principalNip?: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  gradeLevel: 'SD' | 'SMP' | 'SMA';
  logoUrl?: string;
}

export type HabitId = 
  | 'bangun_pagi'
  | 'beribadah'
  | 'berolahraga'
  | 'makan_sehat'
  | 'gemar_belajar'
  | 'bermasyarakat'
  | 'tidur_cepat';

export interface HabitDefinition {
  id: HabitId;
  order: number;
  title: string;
  shortTitle: string;
  slogan: string;
  description: string;
  iconName: string;
  accentColor: string; // Tailwind color name like 'amber', 'emerald', 'sky', etc.
  bgLight: string;
  borderLight: string;
  textColor: string;
  badgeBg: string;
  suggestedTime?: string;
  points: number;
}

export interface PhotoProof {
  id: string;
  url: string; // Base64 or object URL
  fileName: string;
  fileSizeKb: number;
  capturedAt: string; // ISO string
  locationNote?: string;
  caption?: string;
}

export interface HabitItemData {
  habitId: HabitId;
  completed: boolean;
  notes?: string;
  photos: PhotoProof[];
  updatedAt?: string;
  // Specific habit fields
  // 1. Bangun Pagi
  wakeTime?: string;
  wakeCondition?: string;
  morningPrayerOrRoutine?: string;
  // 2. Beribadah
  worshipType?: string;
  worshipTime?: string;
  worshipLocation?: string;
  // 3. Berolahraga
  sportType?: string;
  sportDurationMinutes?: number;
  sportLocation?: string;
  // 4. Makan Sehat
  mealType?: string;
  menuDescription?: string;
  nutritionChecks?: {
    karbohidrat: boolean;
    protein: boolean;
    sayur: boolean;
    buah: boolean;
    airSusu: boolean;
  };
  // 5. Gemar Belajar
  subjectOrBook?: string;
  studyDurationMinutes?: number;
  studySummary?: string;
  // 6. Bermasyarakat
  socialActivity?: string;
  socialRoleOrHelp?: string;
  // 7. Tidur Cepat
  sleepTime?: string;
  screenOffBefore?: boolean;
  nightReflection?: string;
}

export interface TeacherVerification {
  status: 'pending' | 'verified' | 'needs_revision';
  verifiedByTeacherId?: string;
  teacherName?: string;
  verifiedAt?: string;
  teacherComment?: string;
  ratingStars?: number; // 1-5
}

export interface ParentEndorsement {
  endorsed: boolean;
  endorsedByParentId?: string;
  parentName?: string;
  endorsedAt?: string;
  parentNotes?: string;
  signatureStamp?: string; // Digital sign stamp
}

export interface DailyJournal {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  habits: Record<HabitId, HabitItemData>;
  teacherVerification: TeacherVerification;
  parentEndorsement: ParentEndorsement;
  totalPoints: number;
  completedHabitsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g., "Kelas 5A"
  gradeLevel: 'SD' | 'SMP' | 'SMA';
  academicYear: string;
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  totalStudents: number;
}

export interface BadgeAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredStreakOrCount: number;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'streak' | 'perfection' | 'habit_specific';
}

export interface ReminderConfig {
  enabled: boolean;
  time: string; // "20:00"
  notifyChannels: {
    browser: boolean;
    inAppBanner: boolean;
  };
  lastNotifiedDate?: string;
}

export interface BackupMetadata {
  appName: string;
  version: string;
  exportedAt: string;
  exportedBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  schoolProfile: SchoolProfile;
  stats: {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalJournals: number;
    totalPhotos: number;
  };
}

export interface BackupPayload {
  metadata: BackupMetadata;
  users: User[];
  classes: SchoolClass[];
  journals: Record<string, DailyJournal>;
  badges?: BadgeAchievement[];
  schoolProfile: SchoolProfile;
  reminderConfig?: ReminderConfig;
}

