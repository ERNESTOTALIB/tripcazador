/**
 * recently_viewed.ts — SSS473 (24 may 2026)
 *
 * Tracker pure-fn de últimos N deals vistos por el usuario. Persiste
 * en localStorage. UI lo consume vía hook useRecentlyViewed.
 *
 * Diseño:
 * - Ring buffer size = 6 (los 6 últimos vistos, sin duplicados)
 * - LRU: si user re-visita un deal, mueve a top
 * - No expira por tiempo (gestionado por localStorage del browser)
 */

const STORAGE_KEY = "tc_recently_viewed_v1";
const MAX_ITEMS = 6;

export interface RecentlyViewedItem {
  id: string;
  origin: string;
  destination: string;
  cityTo: string;
  priceEur: number;
  airline?: string;
  dateOut?: string;
  viewedAt: number; // ms epoch
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentlyViewedItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function trackDealView(item: Omit<RecentlyViewedItem, "viewedAt">): void {
  if (!isBrowser()) return;
  try {
    const existing = getRecentlyViewed();
    // Remove if already present (we'll re-insert at front)
    const filtered = existing.filter((x) => x.id !== item.id);
    const next: RecentlyViewedItem[] = [
      { ...item, viewedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // silent
  }
}

export function clearRecentlyViewed(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}
