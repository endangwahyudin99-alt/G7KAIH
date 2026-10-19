import React from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';
import { BADGE_EMBLEM_IMG } from '../data/seedData';
import { Award, Flame, Star, Trophy, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';

interface AchievementsViewProps {
  currentUser: User;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  currentUser,
}) => {
  const badges = StorageService.getBadges();
  const streak = StorageService.getStudentStreak(currentUser.id);
  const users = StorageService.getUsers().filter((u) => {
    if (u.role !== 'siswa') return false;
    if (currentUser.role === 'guru' && currentUser.classId) {
      return u.classId === currentUser.classId;
    }
    return true;
  });
  const journals = StorageService.getJournals();

  // Calculate student leaderboard points
  const leaderboard = users.map((student) => {
    let studentPoints = 0;
    Object.values(journals || {})
      .filter((j) => j && j.studentId === student.id)
      .forEach((j) => {
        studentPoints += (j.totalPoints || 0);
      });

    return {
      student,
      totalPoints: studentPoints || 80,
      streak: StorageService.getStudentStreak(student.id),
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="space-y-6">
      {/* Top Banner with Badge Emblem */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 text-white p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-yellow-300" />
            <span>Sistem Poin & Lencana Apresiasi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Prestasi Pembiasaan Hebat
          </h1>
          <p className="text-xs sm:text-sm text-rose-100">
            Setiap kebiasaan baik yang kamu jalankan menghasilkan poin dan membuka lencana prestasi kebanggaan!
          </p>
        </div>

        <div className="w-28 h-28 sm:w-36 sm:h-36 shrink-0 relative">
          <img
            src={BADGE_EMBLEM_IMG}
            alt="Penghargaan G7KAIH"
            className="w-full h-full object-contain drop-shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Badges Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
          Daftar Lencana & Syarat Pencapaian
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Selesaikan tantangan kebiasaan untuk membuka seluruh lencana kehormatan.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                badge.unlocked
                  ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div className="text-3xl p-2 rounded-xl bg-white shadow-2xs shrink-0">
                {badge.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-900">
                    {badge.name}
                  </h3>
                  {badge.unlocked ? (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-sm">
                      Terbuka ✓
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      Terkunci
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {badge.description}
                </p>
                {badge.unlockedAt && (
                  <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                    Didapat pada: {badge.unlockedAt}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Friendly Class Leaderboard */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Papan Semangat Kelas 5A
            </h2>
            <p className="text-xs text-slate-500">
              Saling menginspirasi dan menyemangati sesama teman untuk hidup sehat dan berkarakter mulia.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {leaderboard.map((item, index) => (
            <div
              key={item.student.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                item.student.id === currentUser.id
                  ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-500/10'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 text-center font-bold font-mono text-sm ${
                  index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-700' : 'text-slate-400'
                }`}>
                  #{index + 1}
                </span>
                <img
                  src={item.student.avatar}
                  alt={item.student.name}
                  className="w-9 h-9 rounded-full bg-slate-200 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {item.student.name} {item.student.id === currentUser.id && '(Kamu)'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Streak: 🔥 {item.streak} Hari Beruntun
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span className="font-mono tabular-nums">{item.totalPoints} Poin</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
