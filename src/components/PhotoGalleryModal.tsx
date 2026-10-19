import React from 'react';
import { PhotoProof } from '../types';
import { X, Calendar, MapPin, HardDrive } from 'lucide-react';

interface PhotoGalleryModalProps {
  photo: PhotoProof | null;
  habitTitle?: string;
  studentName?: string;
  onClose: () => void;
}

export const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({
  photo,
  habitTitle,
  studentName,
  onClose,
}) => {
  if (!photo) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-white">
          <div>
            <h3 className="text-sm font-bold text-white">
              {habitTitle || 'Foto Bukti Kegiatan'}
            </h3>
            {studentName && (
              <p className="text-xs text-slate-400">
                Siswa: <span className="text-slate-200 font-semibold">{studentName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Display */}
        <div className="relative bg-black flex items-center justify-center max-h-[70vh] min-h-[300px]">
          <img
            src={photo.url}
            alt={photo.fileName || 'Foto Bukti'}
            className="max-h-[70vh] w-auto max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Metadata Footer */}
        <div className="p-4 bg-slate-950 text-xs text-slate-300 space-y-2 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {new Date(photo.capturedAt).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-mono">{photo.fileSizeKb} KB</span>
            </div>
            {photo.locationNote && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{photo.locationNote}</span>
              </div>
            )}
          </div>
          {photo.caption && (
            <p className="text-slate-400 text-xs italic">
              &quot;{photo.caption}&quot;
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
