/**
 * wrapped.ts — A2 (May 2026)
 *
 * "TripCazador Wrapped" — Spotify-style yearly recap. Lee localStorage
 * (favorites, gamification, search history) + opcionalmente mete datos del
 * usuario logueado si los hay. 100% client-side, privacy-first.
 */

export type WrappedStats = {
  year: number;
  total_searches: number;
  unique_destinations: number;
  top_destinations: string[];
  total_favorites: number;
  estimated_savings_eur: number;
  streak_max: number;
  badges_unlocked: number;
  first_visit_at?: string;
  last_visit_at?: string;
  vibe: string; // "El cazador maratoniano", "El nómada digital", etc.
};

export function computeWrapped(year: number = new Date().getFullYear()): WrappedStats | null {
  if (typeof localStorage === "undefined") return null;

  let favorites: { destination?: string; price?: number; addedAt?: string }[] = [];
  try {
    const raw = localStorage.getItem("tc_favorites_v1");
    if (raw) favorites = JSON.parse(raw);
  } catch {
    // ignore
  }

  let history: { query?: string; ts?: string }[] = [];
  try {
    const raw = localStorage.getItem("tc_search_history_v1");
    if (raw) history = JSON.parse(raw);
  } catch {
    // ignore
  }

  let gam: { streak?: number; visits?: number; favorites?: number; destinations_visited?: string[]; unlocked_badges?: string[]; last_visit?: string } = {};
  try {
    const raw = localStorage.getItem("tc_gam_v1");
    if (raw) gam = JSON.parse(raw);
  } catch {
    // ignore
  }

  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime();

  const favsThisYear = favorites.filter((f) => {
    const ts = f.addedAt ? new Date(f.addedAt).getTime() : 0;
    return ts >= yearStart && ts <= yearEnd;
  });
  const histThisYear = history.filter((h) => {
    const ts = h.ts ? new Date(h.ts).getTime() : 0;
    return ts >= yearStart && ts <= yearEnd;
  });

  const destCounts = new Map<string, number>();
  for (const f of favsThisYear) {
    if (f.destination) destCounts.set(f.destination, (destCounts.get(f.destination) || 0) + 1);
  }
  const topDestinations = Array.from(destCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([d]) => d);

  // Estimate savings: avg 80€ savings per favorite click + 3€ per search
  const estimatedSavings = favsThisYear.length * 80 + histThisYear.length * 3;

  // Pick a vibe based on patterns
  let vibe = "El curioso";
  if ((gam.streak || 0) >= 30) vibe = "El cazador maratoniano";
  else if (favsThisYear.length >= 20) vibe = "El coleccionista de chollos";
  else if (topDestinations.length >= 5) vibe = "El nómada digital";
  else if (histThisYear.length >= 50) vibe = "El buscador insaciable";
  else if (favsThisYear.length >= 5) vibe = "El planificador";

  return {
    year,
    total_searches: histThisYear.length,
    unique_destinations: destCounts.size,
    top_destinations: topDestinations,
    total_favorites: favsThisYear.length,
    estimated_savings_eur: estimatedSavings,
    streak_max: gam.streak || 0,
    badges_unlocked: (gam.unlocked_badges || []).length,
    last_visit_at: gam.last_visit,
    vibe,
  };
}
