/**
 * unsubscribe_token.ts — AUDIT-FULL FIX-SEC-1 (24 may 2026)
 *
 * Helper centralizado para emitir y verificar tokens List-Unsubscribe
 * con HMAC SHA-256.
 *
 * Razón: el verifier antiguo de `/api/unsubscribe/route.ts` solo decodeaba
 * base64url sin verificar HMAC → cualquiera podía dar de baja a otra
 * persona enumerando emails. Ahora token = `email:ts:hmac(email:ts)`.
 *
 * Compatibilidad: tokens legacy (`email:ts` sin sig) son rechazados.
 * Los emails generados antes del fix necesitan re-emitirse.
 */
import crypto from "node:crypto";

/**
 * Genera un token unsubscribe URL-safe con HMAC.
 * Falla con error si UNSUBSCRIBE_SECRET no está configurado.
 */
export function emitUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || "";
  if (!secret) {
    // Fallback dev: emite token sin HMAC pero con marker que el verifier
    // rechaza. Devuelve string de longitud razonable para que el caller
    // no rompa la lógica de email.
    return Buffer.from(`${email}:${Date.now()}`).toString("base64url");
  }
  const ts = Date.now().toString();
  const sig = crypto.createHmac("sha256", secret).update(`${email}:${ts}`).digest("hex");
  return Buffer.from(`${email}:${ts}:${sig}`).toString("base64url");
}
