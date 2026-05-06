"use client";
/**
 * StreakBadge — F7 (May 2026)
 *
 * Pequeño widget en home que muestra la racha actual (días seguidos visitando)
 * y desbloquea badges. Se monta una vez en la home; ejecuta recordVisit() al
 * mount, persiste en localStorage.
 */
import { useEffect, useState } from "react";
import { recordVisit, type BadgeId, getBadge } from "@/lib/gamification";

export function StreakBadge() {
  const [streak, setStreak] = useState(0);
  const [newly, setNewly] = useState<BadgeId[]>([]);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const out = recordVisit();
    setStreak(out.state.streak);
    if (out.newly.length > 0) {
      setNewly(out.newly);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 6000);
    }
  }, []);

  if (streak < 2) return null;

  return (
    <>
      <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/40 rounded-full px-3 py-1 text-xs text-amber-300">
        <span className="text-base" aria-hidden="true">🔥</span>
        <span>
          <strong>{streak}</strong> {streak === 1 ? "día" : "días"} seguidos
        </span>
        <a href="/badges" className="opacity-70 hover:opacity-100 underline">
          ver badges
        </a>
      </div>

      {showToast && newly.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-3 z-50 max-w-sm bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 rounded-lg shadow-2xl p-4"
          style={{ animation: "bounceIn 0.5s ease-out" }}
        >
          <div className="text-xs uppercase tracking-wide font-bold opacity-80">¡Nuevo badge!</div>
          {newly.map((id) => {
            const b = getBadge(id);
            if (!b) return null;
            return (
              <div key={id} className="flex items-center gap-3 mt-1">
                <span className="text-3xl" aria-hidden="true">{b.emoji}</span>
                <div>
                  <div className="font-bold">{b.name}</div>
                  <div className="text-xs opacity-80">{b.description}</div>
                </div>
              </div>
            );
          })}
          <style jsx>{`
            @keyframes bounceIn {
              0% {
                transform: scale(0.5) translateY(-20px);
                opacity: 0;
              }
              60% {
                transform: scale(1.05);
                opacity: 1;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
