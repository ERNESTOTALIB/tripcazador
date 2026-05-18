/**
 * premium_server.ts — SSS305 (18 may 2026)
 *
 * Detección server-side de Premium para filtrar deals en SSR.
 *
 * El estado Premium "real" vive en localStorage (cliente). Para SSR
 * usamos una COOKIE httpOnly opcional `tc_premium` que el cliente
 * setea junto a localStorage cuando se activa Premium. La cookie no
 * lleva data sensible — solo un boolean "premium=1".
 *
 * Crucial: NO usar la cookie como prueba de auth — solo para gate
 * UI/SSR. La auth real para endpoints sensibles (alerts, stats, etc.)
 * usa el customerId Stripe (cus_xxx) o session_id (cs_xxx).
 *
 * Si la cookie no está set, el render SSR asume free; el cliente
 * tras hidratación re-renderiza desde localStorage si necesario.
 */
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";

export const PREMIUM_COOKIE = "tc_premium";

/**
 * SSR: lee cookies() de next/headers. Si tc_premium="1" → true.
 * Si la cookie tiene un customerId válido (cus_xxx | cs_xxx) → true.
 *
 * Llamar SOLO desde Server Components / route handlers (next/headers).
 */
export function isPremiumFromCookies(c?: ReadonlyRequestCookies): boolean {
  const cookieStore = c ?? cookies();
  const cookie = cookieStore.get(PREMIUM_COOKIE);
  if (!cookie) return false;
  const v = cookie.value;
  if (v === "1" || v === "true") return true;
  // Permitir customerId crudo: cus_xxx o cs_test_xxx o cs_live_xxx
  if (/^(cus|cs_test|cs_live)_[A-Za-z0-9]{8,}$/.test(v)) return true;
  return false;
}
