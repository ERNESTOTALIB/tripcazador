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

export const PREMIUM_FEATURES = {
  instantAlerts: "Alertas instantáneas (push + email <60s vs 24h)",
  proFilters: "Filtros pro (+ aerolínea + clase + escalas exactas)",
  noDisclaimer: 'Sin disclaimer "precio aproximado"',
  prioritySupport: "Soporte prioritario por email",
  exportCsv: "Exportar deals a CSV",
  apiAccess: "API access para integrar en tu app/bot",
} as const;

export const PREMIUM_PRICE_EUR = 2.99;
export const PREMIUM_TRIAL_DAYS = 7;

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
  window.dispatchEvent(
    new CustomEvent("tc:premium-changed", {
      detail: { active: false, tier: "free", source: "manual" },
    }),
  );
}
