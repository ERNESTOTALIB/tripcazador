/**
 * referral — fase ww WW6
 *
 * Genera código único de referido por device. Tracking client-only por ahora
 * (usando localStorage). Cuando haya cuentas server-side se reemplaza por
 * userId hash.
 *
 * Flow:
 *   1. Usuario A visita /refer → se le asigna referral_code TC-XXXX (hash de timestamp+random)
 *   2. Usuario A comparte link tripcazador.com/?ref=TC-XXXX
 *   3. Usuario B llega con ?ref=TC-XXXX → se guarda el código en su localStorage
 *   4. Cuando B activa premium → ambos ganan 1 mes premium gratis (referral bonus)
 */

const KEY_OWN = "tc_referral_code_v1";
const KEY_INCOMING = "tc_referral_incoming_v1";

function randomCode(): string {
  // 4-char alphanumeric uppercase
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos
  let s = "";
  for (let i = 0; i < 4; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

export function getOrCreateReferralCode(): string {
  if (typeof window === "undefined") return "";
  try {
    let code = localStorage.getItem(KEY_OWN);
    if (!code) {
      code = "TC-" + randomCode();
      localStorage.setItem(KEY_OWN, code);
    }
    return code;
  } catch {
    return "";
  }
}

export function captureIncomingReferral(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && /^TC-[A-Z0-9]{4}$/.test(ref)) {
      // Solo guardar si no hay incoming previo (first-touch attribution)
      if (!localStorage.getItem(KEY_INCOMING)) {
        localStorage.setItem(KEY_INCOMING, ref);
      }
      return ref;
    }
  } catch {}
  return null;
}

export function getIncomingReferral(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY_INCOMING);
  } catch {
    return null;
  }
}

export function getReferralLink(): string {
  const code = getOrCreateReferralCode();
  if (!code) return "https://tripcazador.com/";
  return `https://tripcazador.com/?ref=${code}`;
}
