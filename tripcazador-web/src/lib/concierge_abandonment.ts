/**
 * concierge_abandonment.ts — SSS423 (23 may 2026)
 *
 * Cart abandonment lite para Concierge: marca cuando un usuario abre
 * /concierge o /concierge/[tier] pero no completa la compra (no llega
 * a /concierge/success en 24h).
 *
 * Pura lib browser-side (cookie + utilidades). Componente client
 * `<ConciergeAbandonmentBanner />` consume estas funciones para
 * mostrar un banner de recuperación con coupon TC10.
 *
 * No requiere backend ni KV: el coupon TC10 ya está creado en Stripe
 * (-10%) y se valida ahí. La cookie es solo signal UX local.
 */

const COOKIE_NAME = "tc_concierge_abandon";
const COOKIE_MAX_AGE_S = 24 * 3600; // 24h
/** Tras MIN_RECOVERY_DELAY_S de abrir concierge, podemos mostrar el banner. */
const MIN_RECOVERY_DELAY_S = 5 * 60; // 5 min

export interface AbandonmentState {
  /** ms epoch cuando user abrió primero /concierge. */
  openedAt: number;
  /** tier observado (express/standard/premium/pro) — opcional para deeplink. */
  tier?: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function markConciergeOpened(tier?: string): void {
  if (!isBrowser()) return;
  // Si ya hay cookie reciente, no la sobrescribimos — preservamos openedAt.
  const existing = readAbandonmentRaw();
  if (existing && Date.now() - existing.openedAt < COOKIE_MAX_AGE_S * 1000) {
    // Actualizar tier si llegó nuevo dato
    if (tier && existing.tier !== tier) {
      writeCookie({ ...existing, tier });
    }
    return;
  }
  const state: AbandonmentState = { openedAt: Date.now(), tier };
  writeCookie(state);
}

export function clearConciergeAbandonment(): void {
  if (!isBrowser()) return;
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

/**
 * Devuelve estado si el usuario abrió concierge entre [5min, 24h] atrás.
 * Si <5min: aún está en su sesión (no spamear); >24h: cookie expirada.
 */
export function getRecoverableAbandonment(): AbandonmentState | null {
  if (!isBrowser()) return null;
  const state = readAbandonmentRaw();
  if (!state) return null;
  const ageS = (Date.now() - state.openedAt) / 1000;
  if (ageS < MIN_RECOVERY_DELAY_S) return null; // demasiado pronto
  if (ageS > COOKIE_MAX_AGE_S) return null; // expirado
  return state;
}

function readAbandonmentRaw(): AbandonmentState | null {
  if (!isBrowser()) return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
  if (!m) return null;
  try {
    const decoded = decodeURIComponent(m[1]);
    const parsed = JSON.parse(decoded) as AbandonmentState;
    if (typeof parsed.openedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCookie(state: AbandonmentState): void {
  if (!isBrowser()) return;
  const value = encodeURIComponent(JSON.stringify(state));
  document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${COOKIE_MAX_AGE_S}; Path=/; SameSite=Lax`;
}

/** Coupon Stripe pre-creado con -10% para recovery. */
export const RECOVERY_COUPON_CODE = "TC10";

/** Permite construir la URL deep-link al tier abandonado. */
export function buildRecoveryUrl(state: AbandonmentState): string {
  if (state.tier) {
    return `/concierge/${state.tier}?from=abandonment&coupon=${RECOVERY_COUPON_CODE}`;
  }
  return `/concierge?from=abandonment&coupon=${RECOVERY_COUPON_CODE}`;
}
