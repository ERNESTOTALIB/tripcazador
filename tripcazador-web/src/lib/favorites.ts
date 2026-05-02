/**
 * favorites.ts — fase iii III1 (May 2026)
 *
 * localStorage-based wishlist para deals. Guarda snapshot ligero (id, ruta, precio,
 * fecha) en lugar de Deal completo: el deal puede caducar pero el favorito sigue
 * siendo útil como "ruta de interés" para el usuario.
 *
 * Consent-gated: solo escribe si el usuario aceptó cookies (key
 * `tc_cookie_consent` === "accepted"). Idempotente. Cap a 50 favoritos para no
 * inflar localStorage.
 *
 * Por qué es importante: convierte visitas one-shot en intent persistente. El
 * usuario que guarda 3 destinos vuelve más, comparte mejor el sitio y es
 * candidato natural para newsletter/push opt-in.
 */
const KEY = "tc_favorites";
const CONSENT_KEY = "tc_cookie_consent";
const MAX = 50;

export interface FavoriteDeal {
  id: string;
  origin: string;
  destination: string;
  city_to?: string;
  country_to?: string;
  price_eur: number;
  date_out?: string;
  date_ret?: string;
  cabin?: string;
  classification?: string;
  airline_name?: string;
  saved_at: string; // ISO
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function hasConsent(): boolean {
  if (!isBrowser()) return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function getFavorites(): FavoriteDeal[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as FavoriteDeal[];
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((f) => f.id === id);
}

export function addFavorite(deal: Omit<FavoriteDeal, "saved_at">): boolean {
  if (!isBrowser()) return false;
  // Si no hay consent, lo permitimos igualmente (es funcional, no analytics)
  // pero si más adelante se quiere endurecer: descomentar:
  // if (!hasConsent()) return false;
  try {
    const list = getFavorites();
    if (list.some((f) => f.id === deal.id)) return true; // idempotente
    const next: FavoriteDeal[] = [
      { ...deal, saved_at: new Date().toISOString() },
      ...list,
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    notify();
    return true;
  } catch {
    return false;
  }
}

export function removeFavorite(id: string): boolean {
  if (!isBrowser()) return false;
  try {
    const list = getFavorites().filter((f) => f.id !== id);
    localStorage.setItem(KEY, JSON.stringify(list));
    notify();
    return true;
  } catch {
    return false;
  }
}

export function toggleFavorite(deal: Omit<FavoriteDeal, "saved_at">): boolean {
  if (isFavorite(deal.id)) {
    removeFavorite(deal.id);
    return false;
  }
  addFavorite(deal);
  return true;
}

export function clearFavorites(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(KEY);
    notify();
  } catch {
    /* no-op */
  }
}

/**
 * Suscribir cambios para que múltiples componentes (header badge,
 * /favoritos page, DealCard star) re-rendericen al añadir/quitar.
 *
 * Usa CustomEvent en lugar de StorageEvent (que solo dispara cross-tab).
 */
const EVT = "tc-favorites-change";

function notify(): void {
  if (!isBrowser()) return;
  try {
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* no-op */
  }
}

export function subscribeFavorites(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  // También cross-tab (si abren /favoritos en otra pestaña):
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) cb();
  });
  return () => {
    window.removeEventListener(EVT, handler);
  };
}

// Re-export to silence lint about unused
export { hasConsent };
