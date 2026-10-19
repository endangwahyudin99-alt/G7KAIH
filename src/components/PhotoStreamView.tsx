import React, { useState } from 'react';
import { User, PhotoProof, HabitId } from '../types';
import { G7KAIH_HABITS } from '../data/seedData';
import { StorageService } from '../services/storage';
import { Camera, Calendar, MapPin, HardDrive, Filter, Sparkles } from 'lucide-react';

interface PhotoStreamViewProps {
  currentUser: User;
  onViewPhoto: (photo: PhotoProof, habitTitle: string) => void;
}

export const PhotoStreamView: React.FC<PhotoStreamViewProps> = ({
  currentUser,
  onViewPhoto,
}) => {
  const [selectedHabitFilter, setSelectedHabitFilter] = useState<string>('all');
  const journals = StorageService.getJournals();

  // Collect photos belonging to current student or student's class
  const targetStudentId = currentUser.role === 'orang_tua' 
    ? currentUser.childId 
    : (currentUser.role === 'siswa' ? currentUser.id : undefined);

  interface PhotoItemWithContext {
    photo: PhotoProof;
    habitTitle: string;
    habitId: HabitId;
    date: string;
    studentName: string;
  }

  const allPhotos: PhotoItemWithContext[] = [];

  const users = StorageService.getUsers();

  Object.values(journals || {}).forEach((j) => {
    if (!j) return;
    // If student or parent, show only their photos; if teacher, show only their class photos
    if (targetStudentId && j.studentId !== targetStudentId) {
      return;
    }

    const studentUser = users.find((u) => u.id === j.studentId);
    if (currentUser.role === 'guru' && currentUser.classId && studentUser?.classId !== currentUser.classId) {
      return;
    }
    const studentName = studentUser?.name || 'Siswa';

    if (!j.habits || typeof j.habits !== 'object') {
      return;
    }

    Object.values(j.habits).forEach((h) => {
      if (!h) return;
      if (h.photos && Array.isArray(h.photos) && h.photos.length > 0) {
        const habitDef = G7KAIH_HABITS.find((hab) => hab.id === h.habitId);
        h.photos.forEach((photo) => {
          if (!photo) return;
          allPhotos.push({
            photo,
            habitTitle: habitDef?.title || 'Kebiasaan G7KAIH',
            habitId: h.habitId,
            date: j.date || '',
            studentName,
          });
        });
      }
    });
  });

  // Sort photos newest first
  allPhotos.sort((a, b) => (b.photo?.capturedAt || '').localeCompare(a.photo?.capturedAt || ''));

  const filteredPhotos = allPhotos.filter((item) => {
    if (selectedHabitFilter === 'all') return true;
    return item.habitId === selectedHabitFilter;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Galeri Bukti Foto Kegiatan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kumpulan dokumentasi foto pembiasaan harian yang telah dikompresi dan diverifikasi.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedHabitFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedHabitFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({allPhotos.length})
          </button>
          {G7KAIH_HABITS.map((h) => {
            const count = allPhotos.filter((p) => p.habitId === h.id).length;
            if (count === 0) return null;
            return (
              <button
                key={h.id}
                onClick={() => setSelectedHabitFilter(h.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedHabitFilter === h.id
                    ? `${h.badgeBg} text-white shadow-2xs`
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {h.shortTitle} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Photos */}
      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onViewPhoto(item.photo, item.habitTitle)}
              className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                <img
                  src={item.photo.url}
                  alt={item.photo.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 text-white">
                  <span className="text-xs font-bold leading-tight truncate">
                    {item.habitTitle}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-300 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>{item.date}</span>
                    <span>·</span>
                    <span className="font-mono">{item.photo.fileSizeKb} KB</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 text-xs text-slate-600 bg-slate-50 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-800 truncate">
                  {item.studentName}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  EXIF Bersih ✓
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            Belum ada foto bukti kegiatan
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Foto bukti yang kamu unggah pada jurnal harian akan otomatis terkumpul dan tersusun rapi di sini.
          </p>
        </div>
      )}
    </div>
  );
};
