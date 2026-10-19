import React, { useState } from 'react';
import { ReminderConfig } from '../types';
import { StorageService } from '../services/storage';
import { 
  requestNotificationPermission, 
  triggerReminderNotification 
} from '../utils/notification';
import { 
  Bell, 
  Clock, 
  X, 
  Check, 
  Volume2, 
  ShieldCheck,
  Send
} from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const initialConfig = StorageService.getReminderConfig();
  const [config, setConfig] = useState<ReminderConfig>(initialConfig);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setBrowserPermission('granted');
    }
  };

  const handleSave = () => {
    StorageService.saveReminderConfig(config);
    onClose();
  };

  const handleTestNotification = () => {
    triggerReminderNotification(
      '🇮🇩 Pengingat Jurnal G7KAIH',
      'Sudah pukul 20:00! Jangan lupa periksa dan lengkapi 7 kebiasaan baikmu hari ini sebelum istirahat ya.',
    );
    setTestSentMessage('Notifikasi pengingat dan nada dering berhasil dibunyikan!');
    setTimeout(() => setTestSentMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Bell className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pengingat Jurnal Harian
              </h2>
              <p className="text-xs text-slate-500">
                Alarm pengingat sebelum waktu tidur malam.
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

        {/* Form Body */}
        <div className="p-5 space-y-5">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Aktifkan Pengingat Otomatis
              </span>
              <span className="text-[11px] text-slate-500">
                Mengingatkan jika 7 kebiasaan belum terisi
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-5 h-5 rounded-md text-rose-600 accent-rose-600 cursor-pointer"
            />
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Waktu Pengingat Setiap Hari:
            </label>
            <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-2 bg-white">
              <Clock className="w-4 h-4 text-slate-400" />
              <input
                type="time"
                value={config.time}
                onChange={(e) => setConfig({ ...config, time: e.target.value })}
                className="w-full text-sm font-bold text-slate-900 focus:outline-hidden"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Disarankan pukul 20:00 WIB sebelum ananda bersiap tidur malam.
            </span>
          </div>

          {/* Browser Notification Permission */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Izin Notifikasi Web Browser:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-sm text-[11px] ${
                  browserPermission === 'granted'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {browserPermission === 'granted' ? 'Diizinkan ✓' : 'Belum Diizinkan'}
              </span>
            </div>

            {browserPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Izinkan Notifikasi di Browser
              </button>
            )}
          </div>

          {/* Test Alert Button */}
          <div>
            <button
              type="button"
              onClick={handleTestNotification}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>Kirim Pengingat & Bunyikan Lonceng (Uji Coba)</span>
            </button>
            {testSentMessage && (
              <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg mt-2 text-center font-medium">
                ✓ {testSentMessage}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};
