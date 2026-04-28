/**
 * searchHistory — abr-2026r/s.
 *
 * Almacena las últimas N búsquedas en localStorage para que SearchBar pueda
 * sugerirlas cuando el usuario foca el input vacío. Privacy-aware: requiere
 * `cv_consent_v1.functional === true` (consent banner). Si no, devuelve [].
 *
 * Schema:
 *   localStorage["tc_search_history_v1"] = JSON.stringify(SearchEntry[])
 *
 * SearchEntry { origin: string; destination: string; date?: string; ts: number }
 *
 * Política:
 *  - Máximo 5 entradas, FIFO (la más vieja sale).
 *  - Dedup por origin+destination (re-buscar Madrid→Roma actualiza ts pero no añade).
 *  - Auto-purge entries con ts > 30 días.
 *  - No guarda búsquedas con flag `noTrack: true` (modo incógnito user-side).
 */

const STORAGE_KEY = "tc_search_history_v1";
const CONSENT_KEY = "cv_consent_v1";
const MAX_ENTRIES = 5;
const TTL_DAYS = 30;

export interface SearchEntry {
  origin: string;
  destination: string;
  date?: string;
  ts: number;
}

interface ConsentObject {
  analytics?: boolean;
  functional?: boolean;
  marketing?: boolean;
  timestamp?: string;
}

function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const consent = JSON.parse(raw) as ConsentObject;
    // functional cookies cubren personalización de UX como search history
    return consent.functional === true;
  } catch {
    return false;
  }
}

function safeRead(): SearchEntry[] {
  if (!hasConsent()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const ttlMs = TTL_DAYS * 24 * 60 * 60 * 1000;
    return parsed
      .filter((e): e is SearchEntry => {
        if (typeof e !== "object" || e === null) return false;
        const obj = e as Record<string, unknown>;
        return (
          typeof obj.origin === "string" &&
          typeof obj.destination === "string" &&
          typeof obj.ts === "number"
        );
      })
      .filter((e) => now - e.ts < ttlMs)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function safeWrite(entries: SearchEntry[]): void {
  if (!hasConsent()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota exceeded — silencio */
  }
}

/** Lista las búsquedas guardadas (más recientes primero). */
export function getRecentSearches(): SearchEntry[] {
  const list = safeRead();
  return [...list].sort((a, b) => b.ts - a.ts);
}

/** Añade una búsqueda al historial (dedup + cap a 5). */
export function pushSearch(
  origin: string,
  destination: string,
  date?: string,
): void {
  if (typeof window === "undefined") return;
  if (!hasConsent()) return;
  const o = origin.trim().toUpperCase();
  const d = destination.trim().toUpperCase();
  if (!o || !d) return;

  const list = safeRead();
  const now = Date.now();
  // Dedup por origin+destination (date no participa en clave)
  const filtered = list.filter(
    (e) => !(e.origin === o && e.destination === d),
  );
  filtered.unshift({ origin: o, destination: d, date, ts: now });
  safeWrite(filtered.slice(0, MAX_ENTRIES));
}

/** Limpia todo el historial. Para "Modo incógnito" toggle. */
export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* silencio */
  }
}

/**
 * Remueve UNA entrada del historial — fase-w. Útil para que el usuario pueda
 * borrar una búsqueda individual desde el dropdown del SearchBar (botón "×")
 * sin tener que vaciar todo. Match por origin+destination (case-insensitive).
 */
export function removeSearch(origin: string, destination: string): void {
  if (typeof window === "undefined") return;
  if (!hasConsent()) return;
  const o = origin.trim().toUpperCase();
  const d = destination.trim().toUpperCase();
  const list = safeRead();
  const filtered = list.filter(
    (e) => !(e.origin === o && e.destination === d),
  );
  if (filtered.length === list.length) return; // nada que cambiar
  safeWrite(filtered);
}
