"use client";
import { useEffect, useState } from "react";
import { BADGES, loadGamState, type BadgeId } from "@/lib/gamification";

export function BadgesGrid() {
  const [unlocked, setUnlocked] = useState<Set<BadgeId>>(new Set());
  const [stats, setStats] = useState<{ streak: number; visits: number; favorites: number; destinations: number } | null>(null);

  useEffect(() => {
    const s = loadGamState();
    setUnlocked(new Set(s.unlocked_badges));
    setStats({
      streak: s.streak,
      visits: s.visits,
      favorites: s.favorites,
      destinations: s.destinations_visited.length,
    });
  }, []);

  const unlockedCount = unlocked.size;
  const total = BADGES.length;

  return (
    <div>
      <div className="panel mb-6">
        <div className="flex items-baseline justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-amber-400">Tu progreso</h2>
            <p className="text-sm text-gray-300 mt-1">
              {unlockedCount} / {total} badges desbloqueados
            </p>
          </div>
          {stats && (
            <div className="flex gap-4 text-xs text-gray-300">
              <div>🔥 Racha: <strong className="text-amber-400">{stats.streak}d</strong></div>
              <div>👀 Visitas: <strong className="text-amber-400">{stats.visits}</strong></div>
              <div>❤️ Favs: <strong className="text-amber-400">{stats.favorites}</strong></div>
            </div>
          )}
        </div>
        <div className="mt-4 bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-400 to-orange-500 h-full transition-all"
            style={{ width: `${(unlockedCount / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {BADGES.map((b) => {
          const isUnlocked = unlocked.has(b.id);
          return (
            <div
              key={b.id}
              className={`panel text-center transition ${
                isUnlocked
                  ? "border-amber-400 bg-amber-400/5"
                  : "opacity-60 grayscale hover:opacity-80"
              }`}
            >
              <div className="text-4xl mb-2" aria-hidden="true">
                {isUnlocked ? b.emoji : "🔒"}
              </div>
              <div className={`font-bold ${isUnlocked ? "text-amber-400" : "text-gray-400"}`}>
                {b.name}
              </div>
              <div className="text-xs text-gray-400 mt-1">{b.description}</div>
              {!isUnlocked && (
                <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-2">
                  Meta: {b.threshold} {b.metric}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
