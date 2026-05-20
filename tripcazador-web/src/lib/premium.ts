/**
 * premium — fase ww WW8
 *
 * Estado de suscripción premium del usuario, persistido en localStorage.
 * Cuando se conecte Stripe webhook esto se reemplazará por una cookie
 * httpOnly firmada por el backend. De momento el flow es client-side
 * para validar conversión sin gastar en Stripe API.
 */

const KEY = "tc_premium_v1";

export interface PremiumStatus {
  active: boolean;
  tier: "free" | "premium" | "pro";
  expiresAt?: string; // ISO date
  source: "stripe" | "referral" | "manual";
  customerId?: string;
}

// SSS300 (18 may 2026): catálogo Premium hardened a 4 features SOLO suscriptores.
// Eliminados exportCsv + apiAccess (no priorizados, generaban expectativa
// no entregada). Premium €2.99/mes ahora promete exactamente lo siguiente
// y todo gating activo en `isPremium()` server+client side.
export const PREMIUM_FEATURES = {
  instantAlerts: "Alertas instantáneas (push + email <60s vs 24h)",
  proFilters: "Filtros pro (+ aerolínea + clase + escalas exactas)",
  noDisclaimer: 'Sin disclaimer "precio aproximado"',
  prioritySupport: "Soporte prioritario por email <24h",
} as const;

/**
 * SSS300: gating helper centralizado. Usar SIEMPRE este check para
 * acceso Premium-only — nunca `getPremiumStatus().active` directo en UI
 * porque queremos auditoría única punto de control.
 */
export function isPremium(): boolean {
  return getPremiumStatus().active;
}

export const PREMIUM_PRICE_EUR = 9.99;
// SSS335: nuevo tier anual €99/año = ahorro €20 vs 12×9.99
export const PREMIUM_ANNUAL_PRICE_EUR = 99;
export const PREMIUM_ANNUAL_SAVINGS_EUR = Math.round((12 * 9.99 - 99) * 100) / 100;
export const PREMIUM_TRIAL_DAYS = 14;
// SSS335: Gift one-off — pago único €9.99, regalo de 1 mes Premium
export const PREMIUM_GIFT_PRICE_EUR = 9.99;

export function getPremiumStatus(): PremiumStatus {
  if (typeof window === "undefined") {
    return { active: false, tier: "free", source: "manual" };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { active: false, tier: "free", source: "manual" };
    const data = JSON.parse(raw) as PremiumStatus;
    if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
      return { active: false, tier: "free", source: "manual" };
    }
    return data;
  } catch {
    return { active: false, tier: "free", source: "manual" };
  }
}

export function setPremiumStatus(s: PremiumStatus) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    // SSS305: sync con cookie "tc_premium" para que SSR sepa que el visitor
    // es Premium y pueda mostrar premium_only deals sin hidratación.
    // Cookie no-httpOnly intencional — solo para gating UI, no auth.
    // Lleva el customerId si existe, sino "1" como flag.
    const cookieVal = s.active ? (s.customerId || "1") : "";
    const maxAge = s.active ? 30 * 86400 : 0; // 30 días
    document.cookie = `tc_premium=${encodeURIComponent(cookieVal)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("tc:premium-changed", { detail: s }));
  } catch {
    /* quota exceeded */
  }
}

export function activateTrial(): PremiumStatus {
  const expiresAt = new Date(
    Date.now() + PREMIUM_TRIAL_DAYS * 86400_000,
  ).toISOString();
  const s: PremiumStatus = {
    active: true,
    tier: "premium",
    expiresAt,
    source: "manual",
  };
  setPremiumStatus(s);
  return s;
}

export function activateReferralBonus(): PremiumStatus {
  const expiresAt = new Date(Date.now() + 30 * 86400_000).toISOString();
  const s: PremiumStatus = {
    active: true,
    tier: "premium",
    expiresAt,
    source: "referral",
  };
  setPremiumStatus(s);
  return s;
}

export function cancelPremium() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  // SSS305: limpiar también la cookie tc_premium para que SSR vuelva a free
  document.cookie = "tc_premium=; path=/; max-age=0; SameSite=Lax";
  window.dispatchEvent(
    new CustomEvent("tc:premium-changed", {
      detail: { active: false, tier: "free", source: "manual" },
    }),
  );
}
