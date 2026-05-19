/**
 * referral_client.ts — SSS321 (19 may 2026)
 *
 * Helpers cliente para el flujo de referral. El reto: cuando el user
 * llega vía `?ref=CODE&r=cus_xxx` y se va a Stripe Checkout, perdemos
 * los params. Necesitamos persistirlos en localStorage y reusarlos
 * cuando vuelve activado para llamar /api/premium/referral/redeem.
 *
 * Pure functions — testeable sin DOM via parámetros explícitos.
 */

export interface PendingReferral {
  code: string;
  referrer_customer_id: string;
  captured_at: number;
}

const STORAGE_KEY = "tc_pending_referral";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const CODE_RE = /^TC-[0-9A-Z]{8}$/;
const CUSTOMER_RE = /^(cus|cs_test|cs_live)_[A-Za-z0-9]{8,}$/;

/**
 * Extrae ref + r de una URL string. Pure function — no toca DOM.
 * Devuelve null si no hay params válidos.
 */
export function extractReferralFromUrl(urlString: string): PendingReferral | null {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return null;
  }
  const code = url.searchParams.get("ref") || "";
  const referrer = url.searchParams.get("r") || "";
  if (!CODE_RE.test(code)) return null;
  if (!CUSTOMER_RE.test(referrer)) return null;
  return {
    code,
    referrer_customer_id: referrer,
    captured_at: Date.now(),
  };
}

/**
 * Capture-from-window: si la URL tiene ref+r válidos, persiste a
 * localStorage. Llamar al mount de /premium o cualquier landing.
 */
export function capturePendingReferralFromUrl(): PendingReferral | null {
  if (typeof window === "undefined") return null;
  const pending = extractReferralFromUrl(window.location.href);
  if (!pending) return null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    /* localStorage off */
  }
  return pending;
}

/**
 * Lee el pending referral de localStorage. Si está caducado (>30d) lo
 * limpia y devuelve null.
 */
export function getPendingReferral(now: number = Date.now()): PendingReferral | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingReferral;
    if (
      !parsed.code ||
      !CODE_RE.test(parsed.code) ||
      !parsed.referrer_customer_id ||
      !CUSTOMER_RE.test(parsed.referrer_customer_id) ||
      typeof parsed.captured_at !== "number"
    ) {
      clearPendingReferral();
      return null;
    }
    if (now - parsed.captured_at > MAX_AGE_MS) {
      clearPendingReferral();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingReferral(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* off */
  }
}

/**
 * Llama POST /api/premium/referral/redeem si hay pending y el current
 * customer no es el referrer (defensa self-redeem). Limpia el pending
 * sea cual sea el resultado para evitar reintentos infinitos.
 *
 * Devuelve true si se hizo la llamada (independiente del resultado HTTP).
 */
export async function tryRedeemPendingReferral(
  currentCustomerId: string,
): Promise<{ attempted: boolean; ok: boolean; error?: string }> {
  const pending = getPendingReferral();
  if (!pending) return { attempted: false, ok: false };
  if (pending.referrer_customer_id === currentCustomerId) {
    clearPendingReferral();
    return { attempted: false, ok: false, error: "self_referral_skipped" };
  }
  try {
    const res = await fetch("/api/premium/referral/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer_customer_id: pending.referrer_customer_id,
        referred_customer_id: currentCustomerId,
        code: pending.code,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };
    // Limpiar siempre — si dio 409 (ya usado) tampoco queremos reintentar
    clearPendingReferral();
    return { attempted: true, ok: res.ok && !!data.ok, error: data.error };
  } catch {
    // Network error: no limpiamos para permitir reintento en próxima carga
    return { attempted: true, ok: false, error: "network_error" };
  }
}
