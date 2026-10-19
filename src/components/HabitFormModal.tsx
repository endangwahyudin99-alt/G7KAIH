import React, { useState, useRef } from 'react';
import { 
  HabitDefinition, 
  HabitItemData, 
  PhotoProof,
} from '../types';
import { compressAndStampImage } from '../utils/imageCompressor';
import { 
  X, 
  Camera, 
  Upload, 
  Trash2, 
  CheckCircle, 
  MapPin, 
  ShieldAlert, 
  Sparkles,
  Clock,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HabitFormModalProps {
  habit: HabitDefinition;
  initialData?: HabitItemData;
  date: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: HabitItemData) => void;
  isSeventhHabitPending?: boolean;
}

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  habit,
  initialData,
  date,
  isOpen,
  onClose,
  onSave,
  isSeventhHabitPending,
}) => {
  // Form State
  const [completed, setCompleted] = useState<boolean>(initialData?.completed ?? true);
  const [notes, setNotes] = useState<string>(initialData?.notes ?? '');
  const [photos, setPhotos] = useState<PhotoProof[]>(initialData?.photos ?? []);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressionStatus, setCompressionStatus] = useState<string | null>(null);

  // Optional Geolocation state
  const [includeLocation, setIncludeLocation] = useState<boolean>(false);
  const [currentLocationNote, setCurrentLocationNote] = useState<string>('');
  const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false);

  // Specific habit fields
  const [wakeTime, setWakeTime] = useState<string>(initialData?.wakeTime ?? '05:00');
  const [wakeCondition, setWakeCondition] = useState<string>(initialData?.wakeCondition ?? 'Segar & Semangat');
  const [morningPrayerOrRoutine, setMorningPrayerOrRoutine] = useState<string>(
    initialData?.morningPrayerOrRoutine ?? 'Membaca doa bangun tidur dan merapikan tempat tidur.'
  );

  const [worshipType, setWorshipType] = useState<string>(
    initialData?.worshipType ?? 'Sholat Subuh & Sholat Fardhu'
  );
  const [worshipTime, setWorshipTime] = useState<string>(initialData?.worshipTime ?? 'Tepat Waktu');
  const [worshipLocation, setWorshipLocation] = useState<string>(
    initialData?.worshipLocation ?? 'Masjid / Rumah'
  );

  const [sportType, setSportType] = useState<string>(initialData?.sportType ?? 'Senam Pagi & Jogging');
  const [sportDurationMinutes, setSportDurationMinutes] = useState<number>(
    initialData?.sportDurationMinutes ?? 20
  );
  const [sportLocation, setSportLocation] = useState<string>(
    initialData?.sportLocation ?? 'Halaman Rumah / Lingkungan Sekitar'
  );

  const [mealType, setMealType] = useState<string>(initialData?.mealType ?? 'Sarapan Pagi Bergizi');
  const [menuDescription, setMenuDescription] = useState<string>(
    initialData?.menuDescription ?? 'Nasi, telur dadar, tumis bayam, tempe, buah pisang, air putih.'
  );
  const [nutritionChecks, setNutritionChecks] = useState({
    karbohidrat: initialData?.nutritionChecks?.karbohidrat ?? true,
    protein: initialData?.nutritionChecks?.protein ?? true,
    sayur: initialData?.nutritionChecks?.sayur ?? true,
    buah: initialData?.nutritionChecks?.buah ?? true,
    airSusu: initialData?.nutritionChecks?.airSusu ?? true,
  });

  const [subjectOrBook, setSubjectOrBook] = useState<string>(
    initialData?.subjectOrBook ?? 'Buku Bacaan Pelajaran / Cerita Nusantara'
  );
  const [studyDurationMinutes, setStudyDurationMinutes] = useState<number>(
    initialData?.studyDurationMinutes ?? 30
  );
  const [studySummary, setStudySummary] = useState<string>(
    initialData?.studySummary ?? 'Membaca materi pelajaran dan menyelesaikan soal latihan dengan tekun.'
  );

  const [socialActivity, setSocialActivity] = useState<string>(
    initialData?.socialActivity ?? 'Membantu orang tua merapikan rumah dan bersikap santun kepada tetangga.'
  );

  const [sleepTime, setSleepTime] = useState<string>(initialData?.sleepTime ?? '21:00');
  const [screenOffBefore, setScreenOffBefore] = useState<boolean>(
    initialData?.screenOffBefore ?? true
  );
  const [nightReflection, setNightReflection] = useState<string>(
    initialData?.nightReflection ?? 'Bersyukur seluruh kegiatan hari ini berjalan lancar dan bermanfaat.'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync state when habit or initialData updates
  React.useEffect(() => {
    if (!isOpen) return;
    setCompleted(initialData?.completed ?? true);
    setNotes(initialData?.notes ?? '');
    setPhotos(initialData?.photos ?? []);
    setWakeTime(initialData?.wakeTime ?? '05:00');
    setWakeCondition(initialData?.wakeCondition ?? 'Segar & Semangat');
    setMorningPrayerOrRoutine(initialData?.morningPrayerOrRoutine ?? 'Membaca doa bangun tidur dan merapikan tempat tidur.');
    setWorshipType(initialData?.worshipType ?? 'Sholat Subuh & Sholat Fardhu');
    setWorshipTime(initialData?.worshipTime ?? 'Tepat Waktu');
    setWorshipLocation(initialData?.worshipLocation ?? 'Masjid / Rumah');
    setSportType(initialData?.sportType ?? 'Senam Pagi & Jogging');
    setSportDurationMinutes(initialData?.sportDurationMinutes ?? 20);
    setSportLocation(initialData?.sportLocation ?? 'Halaman Rumah / Lingkungan Sekitar');
    setMealType(initialData?.mealType ?? 'Sarapan Pagi Bergizi');
    setMenuDescription(initialData?.menuDescription ?? 'Nasi, telur dadar, tumis bayam, tempe, buah pisang, air putih.');
    setNutritionChecks({
      karbohidrat: initialData?.nutritionChecks?.karbohidrat ?? true,
      protein: initialData?.nutritionChecks?.protein ?? true,
      sayur: initialData?.nutritionChecks?.sayur ?? true,
      buah: initialData?.nutritionChecks?.buah ?? true,
      airSusu: initialData?.nutritionChecks?.airSusu ?? true,
    });
    setSubjectOrBook(initialData?.subjectOrBook ?? 'Buku Bacaan Pelajaran / Cerita Nusantara');
    setStudyDurationMinutes(initialData?.studyDurationMinutes ?? 30);
    setStudySummary(initialData?.studySummary ?? 'Membaca materi pelajaran dan menyelesaikan soal latihan dengan tekun.');
    setSocialActivity(initialData?.socialActivity ?? 'Membantu orang tua merapikan rumah dan bersikap santun kepada tetangga.');
    setSleepTime(initialData?.sleepTime ?? '21:00');
    setScreenOffBefore(initialData?.screenOffBefore ?? true);
    setNightReflection(initialData?.nightReflection ?? 'Bersyukur seluruh kegiatan hari ini berjalan lancar dan bermanfaat.');
    setCompressionStatus(null);
  }, [isOpen, habit?.id, initialData]);

  if (!isOpen) return null;

  // Geolocation trigger
  const handleToggleLocation = () => {
    if (!includeLocation) {
      if ('geolocation' in navigator) {
        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const locText = `Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`;
            setCurrentLocationNote(locText);
            setIncludeLocation(true);
            setIsFetchingLocation(false);
          },
          () => {
            setCurrentLocationNote('Lokasi diizinkan (Perkiraan Sekolah/Rumah)');
            setIncludeLocation(true);
            setIsFetchingLocation(false);
          },
          { timeout: 5000 }
        );
      } else {
        setIncludeLocation(false);
      }
    } else {
      setIncludeLocation(false);
      setCurrentLocationNote('');
    }
  };

  // Image upload & compression handler
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= 3) {
      alert('Maksimal 3 foto bukti per kebiasaan.');
      return;
    }

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih berkas gambar (JPG, PNG, atau WebP).');
      return;
    }

    try {
      setIsCompressing(true);
      setCompressionStatus(`Mengompresi ${file.name}...`);

      const result = await compressAndStampImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.75,
        addTimestampOverlay: true,
        locationNote: includeLocation ? currentLocationNote || 'Lokasi Terverifikasi' : undefined,
      });

      const newPhoto: PhotoProof = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        url: result.dataUrl,
        fileName: file.name,
        fileSizeKb: result.sizeKb,
        capturedAt: result.timestamp,
        locationNote: result.locationNote,
      };

      setPhotos((prev) => [...prev, newPhoto]);
      setCompressionStatus(
        `Berhasil dikompresi: ${result.originalSizeKb} KB ➔ ${result.sizeKb} KB (EXIF dibersihkan)`
      );

      // Auto check as completed when a photo is uploaded!
      setCompleted(true);
    } catch (err) {
      alert('Gagal memproses gambar: ' + (err as Error).message);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const habitData: HabitItemData = {
      habitId: habit.id,
      completed,
      notes,
      photos,
      updatedAt: new Date().toISOString(),
      // Habit specific properties
      wakeTime,
      wakeCondition,
      morningPrayerOrRoutine,
      worshipType,
      worshipTime,
      worshipLocation,
      sportType,
      sportDurationMinutes,
      sportLocation,
      mealType,
      menuDescription,
      nutritionChecks,
      subjectOrBook,
      studyDurationMinutes,
      studySummary,
      socialActivity,
      sleepTime,
      screenOffBefore,
      nightReflection,
    };

    onSave(habitData);

    // If completing the 7th habit, shoot confetti celebration!
    if (completed && isSeventhHabitPending) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${habit.badgeBg} flex items-center justify-center text-white font-bold shadow-xs`}>
              {habit.order}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {habit.title}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {habit.slogan}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Status checklist switch */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-sm font-bold text-slate-900 block">
                Status Kebiasaan
              </span>
              <span className="text-xs text-slate-500">
                {completed ? 'Sudah terlaksana hari ini' : 'Belum selesai / Lewati sementara'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCompleted(!completed)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                completed
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{completed ? 'Selesai ✓' : 'Belum Selesai'}</span>
            </button>
          </div>

          {/* Dynamic Inputs according to the habit */}
          {habit.id === 'bangun_pagi' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam Bangun Pagi
                  </label>
                  <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      className="w-full text-sm font-semibold text-slate-900 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kondisi Tubuh Saat Bangun
                  </label>
                  <select
                    value={wakeCondition}
                    onChange={(e) => setWakeCondition(e.target.value)}
                    className="w-full text-sm font-medium text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Segar & Bugar">Segar & Bugar</option>
                    <option value="Cukup Bersemangat">Cukup Bersemangat</option>
                    <option value="Sedikit Mengantuk">Sedikit Mengantuk</option>
                    <option value="Kurang Fit">Kurang Fit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Doa Bangun Tidur & Rutinitas Pagi
                </label>
                <input
                  type="text"
                  value={morningPrayerOrRoutine}
                  onChange={(e) => setMorningPrayerOrRoutine(e.target.value)}
                  placeholder="Contoh: Membaca doa, minum air putih, merapikan kasur"
                  className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {habit.id === 'beribadah' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Ibadah
                  </label>
                  <input
                    type="text"
                    value={worshipType}
                    onChange={(e) => setWorshipType(e.target.value)}
                    placeholder="Contoh: Sholat Subuh & Mengaji, Doa Pagi, Kebaktian"
                    className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Waktu / Ketepatan Ibadah
                  </label>
                  <input
                    type="text"
                    value={worshipTime}
                    onChange={(e) => setWorshipTime(e.target.value)}
                    placeholder="Contoh: Subuh pukul 05:05 Tepat Waktu"
                    className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tempat Ibadah
                </label>
                <input
                  type="text"
                  value={worshipLocation}
                  onChange={(e) => setWorshipLocation(e.target.value)}
                  placeholder="Contoh: Masjid Al-Ikhlas bersama Ayah / Ruang Doa Rumah"
                  className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {habit.id === 'berolahraga' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Olahraga
                  </label>
                  <input
                    type="text"
                    value={sportType}
                    onChange={(e) => setSportType(e.target.value)}
                    placeholder="Contoh: Senam Pagi, Lari, Bersepeda, Lompat Tali"
                    className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Durasi (Menit): <span className="text-rose-600 font-bold">{sportDurationMinutes} Menit</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="5"
                    value={sportDurationMinutes}
                    onChange={(e) => setSportDurationMinutes(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi Olahraga
                </label>
                <input
                  type="text"
                  value={sportLocation}
                  onChange={(e) => setSportLocation(e.target.value)}
                  placeholder="Contoh: Lapangan Sekolah / Halaman Rumah"
                  className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {habit.id === 'makan_sehat' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Menu Makanan yang Dikonsumsi
                </label>
                <input
                  type="text"
                  value={menuDescription}
                  onChange={(e) => setMenuDescription(e.target.value)}
                  placeholder="Contoh: Nasi, telur ceplok, tumis kangkung, tempe, jeruk manis"
                  className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Komponen Gizi Seimbang (Piring Makanku):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { key: 'karbohidrat', label: '🌾 Karbohidrat' },
                    { key: 'protein', label: '🍳 Lauk/Protein' },
                    { key: 'sayur', label: '🥦 Sayuran' },
                    { key: 'buah', label: '🍎 Buah-buahan' },
                    { key: 'airSusu', label: '🥛 Air Putih/Susu' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        nutritionChecks[item.key as keyof typeof nutritionChecks]
                          ? 'bg-teal-50 border-teal-300 text-teal-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={nutritionChecks[item.key as keyof typeof nutritionChecks]}
                        onChange={(e) =>
                          setNutritionChecks((prev) => ({
                            ...prev,
                            [item.key]: e.target.checked,
                          }))
                        }
                        className="rounded-sm text-teal-600 accent-teal-600"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {habit.id === 'gemar_belajar' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mata Pelajaran / Judul Buku
                  </label>
                  <input
                    type="text"
                    value={subjectOrBook}
                    onChange={(e) => setSubjectOrBook(e.target.value)}
                    placeholder="Contoh: Matematika Bab Pecahan / Buku Dongeng"
                    className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Durasi Belajar: <span className="text-sky-600 font-bold">{studyDurationMinutes} Menit</span>
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="15"
                    value={studyDurationMinutes}
                    onChange={(e) => setStudyDurationMinutes(Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Pelajaran Utama yang Didapat
                </label>
                <textarea
                  rows={2}
                  value={studySummary}
                  onChange={(e) => setStudySummary(e.target.value)}
                  placeholder="Ceritakan singkat apa yang kamu pelajari..."
                  className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          {habit.id === 'bermasyarakat' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aktivitas Sosial / Gotong Royong / Membantu Orang Lain
                </label>
                <textarea
                  rows={2}
                  value={socialActivity}
                  onChange={(e) => setSocialActivity(e.target.value)}
                  placeholder="Contoh: Membantu ibu membersihkan piring, menyiram tanaman pekarangan, atau membuang sampah pada tempatnya."
                  className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>
            </div>
          )}

          {habit.id === 'tidur_cepat' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target / Jam Tidur Malam
                  </label>
                  <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <input
                      type="time"
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                      className="w-full text-sm font-semibold text-slate-900 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={screenOffBefore}
                      onChange={(e) => setScreenOffBefore(e.target.checked)}
                      className="w-4 h-4 rounded-sm text-indigo-600 accent-indigo-600"
                    />
                    <span>Matikan layar HP/TV 30 menit sebelum tidur</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Refleksi Rasa Syukur Sebelum Tidur
                </label>
                <textarea
                  rows={2}
                  value={nightReflection}
                  onChange={(e) => setNightReflection(e.target.value)}
                  placeholder="Tuliskan 1 hal baik yang kamu syukuri hari ini..."
                  className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Additional Notes Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Singkat Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan singkat untuk guru atau orang tua..."
              className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Foto Bukti Section (1–3 Photos) */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Foto Bukti Kegiatan ({photos.length}/3)
                </span>
                <span className="text-xs text-slate-500">
                  Kompres otomatis &lt;500 KB · Stempel waktu otomatis
                </span>
              </div>

              {/* Optional Location Toggle */}
              <button
                type="button"
                onClick={handleToggleLocation}
                disabled={isFetchingLocation}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  includeLocation
                    ? 'bg-sky-50 border-sky-300 text-sky-700 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{includeLocation ? 'GPS Aktif' : '+ Stempel Lokasi'}</span>
              </button>
            </div>

            {/* Privacy Alert Box */}
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 mb-3">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Privasi Siswa:</strong> Foto hanya dilihat oleh siswa, guru wali kelas, dan orang tua. Jangan mengunggah foto kartu identitas, data pribadi, atau wajah orang lain tanpa izin. EXIF lokasi sensitif otomatis dibersihkan.
              </p>
            </div>

            {/* Upload Buttons */}
            {photos.length < 3 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {/* Take Photo via Camera */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isCompressing}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto Langsung</span>
                </button>

                {/* Upload from Gallery / Files */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih dari Galeri</span>
                </button>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileSelected}
                  className="hidden"
                />
              </div>
            )}

            {/* Status message */}
            {compressionStatus && (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 mb-3">
                ✓ {compressionStatus}
              </p>
            )}

            {/* Photo Preview Grid */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((p, index) => (
                  <div
                    key={p.id}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 flex flex-col"
                  >
                    <img
                      src={p.url}
                      alt={`Bukti ${habit.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 text-white">
                      <span className="text-[10px] font-mono text-slate-200 truncate">
                        {p.fileSizeKb} KB · {new Date(p.capturedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(p.id)}
                      title="Hapus foto"
                      className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                <ImageIcon className="w-8 h-8 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-600">
                  Belum ada foto bukti diunggah
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Foto memudahkan guru dan orang tua memverifikasi kebiasaanmu
                </span>
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500">
            Poin kebiasaan: <span className="font-bold text-amber-600">+{habit.points} Poin</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
            >
              Simpan Jurnal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
