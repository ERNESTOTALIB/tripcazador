/**
 * gamification.ts — F7 (May 2026)
 *
 * Streak counter + badges. localStorage-only (privacy-first, sin backend).
 *
 * BADGES:
 *   - novato: primera visita
 *   - curioso: 3 días streak
 *   - cazador: 7 días streak
 *   - pro: 30 días streak
 *   - leyenda: 100 días streak
 *   - viajero: añadiste 5 favoritos
 *   - explorador: visitaste 10 destinos diferentes
 *   - foodie: completaste planificador estilo foodie
 *   - millero: usaste calculadora millas 5+ veces
 *   - early-bird: alerta de precio creada
 *   - compartidor: usaste share button 3+ veces
 *   - referidor: invitaste 1+ amigo con código ref
 */

export type BadgeId =
  | "novato"
  | "curioso"
  | "cazador"
  | "pro"
  | "leyenda"
  | "viajero"
  | "explorador"
  | "foodie"
  | "millero"
  | "early-bird"
  | "compartidor"
  | "referidor";

export type Badge = {
  id: BadgeId;
  name: string;
  description: string;
  emoji: string;
  threshold: number;
  metric: string;
};

export const BADGES: Badge[] = [
  { id: "novato", name: "Cazador novato", description: "Bienvenido a TripCazador", emoji: "🥚", threshold: 1, metric: "visits" },
  { id: "curioso", name: "Curioso", description: "3 días seguidos", emoji: "🐣", threshold: 3, metric: "streak" },
  { id: "cazador", name: "Cazador", description: "1 semana seguida cazando chollos", emoji: "🏹", threshold: 7, metric: "streak" },
  { id: "pro", name: "Cazador Pro", description: "30 días seguidos", emoji: "🎯", threshold: 30, metric: "streak" },
  { id: "leyenda", name: "Leyenda", description: "100 días seguidos. Eres uno de los nuestros.", emoji: "👑", threshold: 100, metric: "streak" },
  { id: "viajero", name: "Viajero", description: "5 favoritos guardados", emoji: "❤️", threshold: 5, metric: "favorites" },
  { id: "explorador", name: "Explorador", description: "10 destinos visitados", emoji: "🗺️", threshold: 10, metric: "destinations_visited" },
  { id: "foodie", name: "Foodie", description: "Planificaste un viaje estilo foodie", emoji: "🍜", threshold: 1, metric: "planner_foodie" },
  { id: "millero", name: "Millero", description: "Calculadora millas 5+ veces", emoji: "✈️", threshold: 5, metric: "miles_calc" },
  { id: "early-bird", name: "Madrugador", description: "Alerta de precio creada", emoji: "🐦", threshold: 1, metric: "alerts_created" },
  { id: "compartidor", name: "Compartidor", description: "3+ chollos compartidos", emoji: "📣", threshold: 3, metric: "shares" },
  { id: "referidor", name: "Referidor", description: "1+ amigo invitado", emoji: "🎁", threshold: 1, metric: "referrals" },
];

const STORAGE_KEY = "tc_gam_v1";

type GamState = {
  streak: number;
  last_visit: string; // YYYY-MM-DD
  visits: number;
  favorites: number;
  destinations_visited: string[]; // slugs
  planner_foodie: number;
  miles_calc: number;
  alerts_created: number;
  shares: number;
  referrals: number;
  unlocked_badges: BadgeId[];
};

const FRESH: GamState = {
  streak: 0,
  last_visit: "",
  visits: 0,
  favorites: 0,
  destinations_visited: [],
  planner_foodie: 0,
  miles_calc: 0,
  alerts_created: 0,
  shares: 0,
  referrals: 0,
  unlocked_badges: [],
};

export function loadGamState(): GamState {
  if (typeof localStorage === "undefined") return { ...FRESH };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...FRESH };
    return { ...FRESH, ...JSON.parse(raw) };
  } catch {
    return { ...FRESH };
  }
}

export function saveGamState(s: GamState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

/** Devuelve los badges que se acaban de desbloquear en esta call. */
function recomputeUnlocks(s: GamState): { state: GamState; newly: BadgeId[] } {
  const newly: BadgeId[] = [];
  const newSet = new Set(s.unlocked_badges);
  for (const b of BADGES) {
    if (newSet.has(b.id)) continue;
    let value: number = 0;
    if (b.metric === "streak") value = s.streak;
    else if (b.metric === "visits") value = s.visits;
    else if (b.metric === "favorites") value = s.favorites;
    else if (b.metric === "destinations_visited") value = s.destinations_visited.length;
    else if (b.metric === "planner_foodie") value = s.planner_foodie;
    else if (b.metric === "miles_calc") value = s.miles_calc;
    else if (b.metric === "alerts_created") value = s.alerts_created;
    else if (b.metric === "shares") value = s.shares;
    else if (b.metric === "referrals") value = s.referrals;
    if (value >= b.threshold) {
      newSet.add(b.id);
      newly.push(b.id);
    }
  }
  return { state: { ...s, unlocked_badges: Array.from(newSet) }, newly };
}

/** Llamar al cargar la home / cualquier página main. Devuelve newly-unlocked badges. */
export function recordVisit(): { state: GamState; newly: BadgeId[] } {
  const today = new Date().toISOString().slice(0, 10);
  const s = loadGamState();
  if (s.last_visit === today) {
    // already counted today — just return state
    const out = recomputeUnlocks(s);
    saveGamState(out.state);
    return out;
  }
  // streak: yesterday → +1, gap → reset to 1
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const newStreak = s.last_visit === yesterday ? s.streak + 1 : 1;
  const next: GamState = {
    ...s,
    streak: newStreak,
    last_visit: today,
    visits: s.visits + 1,
  };
  const out = recomputeUnlocks(next);
  saveGamState(out.state);
  return out;
}

export function bumpMetric(
  metric: "favorites" | "planner_foodie" | "miles_calc" | "alerts_created" | "shares" | "referrals",
  delta = 1,
): { state: GamState; newly: BadgeId[] } {
  const s = loadGamState();
  const next = { ...s, [metric]: (s[metric] as number) + delta } as GamState;
  const out = recomputeUnlocks(next);
  saveGamState(out.state);
  return out;
}

export function recordDestinationVisit(slug: string): { state: GamState; newly: BadgeId[] } {
  const s = loadGamState();
  if (s.destinations_visited.includes(slug)) {
    const out = recomputeUnlocks(s);
    saveGamState(out.state);
    return out;
  }
  const next = { ...s, destinations_visited: [...s.destinations_visited, slug] };
  const out = recomputeUnlocks(next);
  saveGamState(out.state);
  return out;
}

export function getBadge(id: BadgeId): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}
