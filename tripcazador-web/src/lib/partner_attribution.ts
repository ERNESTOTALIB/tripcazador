/**
 * partner_attribution.ts — SSS377 (21 may 2026)
 *
 * Atribución partner end-to-end:
 *  1. User aterriza con ?ref=TC-AGY-XXXX → persistimos en cookie 30d
 *  2. User compra Premium/Concierge → Checkout Stripe lleva ref_code
 *     en metadata.ref_code (operador wira esto al crear session)
 *  3. Webhook checkout.session.completed → extractAttributionFromSession
 *     identifica product (premium_monthly | premium_annual | premium_gift |
 *     concierge) por amount_total + metadata.product
 *  4. recordReferralConversion incrementa stats del partner
 *
 * Cookie name: tc_ref_partner (30d). HttpOnly false porque la lee JS para
 * inyectar en checkout body. SameSite=Lax para conservar en redirects.
 */

import {
  recordReferralConversion,
  getPartnerByCode,
  type CommissionEvent,
} from "./agency_partner";

export const ATTRIBUTION_COOKIE = "tc_ref_partner";
export const ATTRIBUTION_TTL_DAYS = 30;

/**
 * Detecta el producto y monto a partir de un Stripe checkout session simulado.
 * Pure fn para test sin red.
 */
export interface StripeSessionLike {
  amount_total?: number; // céntimos
  metadata?: {
    ref_code?: string;
    product?: string; // "premium_monthly" | "premium_annual" | "premium_gift" | "concierge"
    [k: string]: string | undefined;
  };
  mode?: string; // "subscription" | "payment"
}

export interface AttributionResult {
  ok: boolean;
  ref_code?: string;
  product?: CommissionEvent["product"];
  amount_eur?: number;
  payout_eur?: number;
  reason?: string;
}

const VALID_PRODUCTS = new Set<CommissionEvent["product"]>([
  "premium_monthly",
  "premium_annual",
  "premium_gift",
  "concierge",
]);

/**
 * extractAttributionFromSession — analiza una sesión Stripe y, si hay
 * ref_code + product válido, registra la conversión.
 *
 * No falla nunca (devuelve {ok:false, reason} en errores) — el webhook
 * Stripe no debe romper por errores de atribución.
 */
export function extractAttributionFromSession(
  session: StripeSessionLike,
): AttributionResult {
  const ref = session?.metadata?.ref_code?.trim();
  if (!ref) {
    return { ok: false, reason: "no_ref_code" };
  }

  const partner = getPartnerByCode(ref);
  if (!partner) {
    return { ok: false, ref_code: ref, reason: "partner_not_found" };
  }
  if (partner.status !== "active") {
    return {
      ok: false,
      ref_code: ref,
      reason: `partner_status_${partner.status}`,
    };
  }

  const productStr = session?.metadata?.product || "";
  const product = VALID_PRODUCTS.has(productStr as CommissionEvent["product"])
    ? (productStr as CommissionEvent["product"])
    : inferProductFromAmount(session);
  if (!product) {
    return { ok: false, ref_code: ref, reason: "unknown_product" };
  }

  const cents = session.amount_total ?? 0;
  if (cents <= 0) {
    return { ok: false, ref_code: ref, reason: "no_amount" };
  }
  const amount_eur = Math.round(cents) / 100;

  const evt: CommissionEvent = { product, amount_eur };
  const r = recordReferralConversion(ref, evt);
  if (!r.ok) {
    return { ok: false, ref_code: ref, reason: r.reason };
  }
  return {
    ok: true,
    ref_code: ref,
    product,
    amount_eur,
    payout_eur: r.payout_eur,
  };
}

/**
 * Heurística para deducir producto cuando metadata.product no está presente.
 * Basado en amount + mode.
 */
function inferProductFromAmount(
  session: StripeSessionLike,
): CommissionEvent["product"] | null {
  const cents = session.amount_total ?? 0;
  const isSub = session.mode === "subscription";
  // Premium mensual €9.99 → 999, anual €99 → 9900
  if (isSub && cents === 999) return "premium_monthly";
  if (isSub && cents === 9900) return "premium_annual";
  if (!isSub && cents === 999) return "premium_gift";
  // Concierge: €19 / €49 / €99 / €299
  if (!isSub && [1900, 4900, 9900, 29900].includes(cents)) return "concierge";
  return null;
}

/**
 * Helpers cookie-based para client-side y server-side.
 */
export function parseRefCookieFromHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(new RegExp(`${ATTRIBUTION_COOKIE}=([^;]+)`));
  return m?.[1] || null;
}

/**
 * Valida un ref_code candidato (anti-injection: solo formato TC-AGY-XXXX).
 */
export function isValidRefCode(ref: string): boolean {
  return /^TC-AGY-[A-Z0-9]{4,8}$/.test(ref);
}

export function buildCookieSetHeader(ref: string): string {
  const maxAge = ATTRIBUTION_TTL_DAYS * 86400;
  return `${ATTRIBUTION_COOKIE}=${encodeURIComponent(ref)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export const __test__ = {
  inferProductFromAmount,
  VALID_PRODUCTS,
};
