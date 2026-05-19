/**
 * concierge_access_token.ts — SSS328 (19 may 2026)
 *
 * Tokens HMAC para magic-link login del cliente Concierge.
 *
 * Flujo:
 *  1. User entra a /concierge/mis-pedidos → form pidiendo email.
 *  2. POST /api/concierge/request-access { email } → si tiene pedidos,
 *     genera token = email:ts:hmac(email:ts) + lo envía por email.
 *  3. User abre email → click link /concierge/mis-pedidos?token=xxx.
 *  4. Server-side verifyToken → si OK, fetcha sus pedidos y renderiza.
 *
 * El secret reusa PANEL_SECRET (ya está configurado en Vercel). En el
 * futuro podemos separar a CONCIERGE_ACCESS_SECRET si queremos rotar
 * el del panel admin sin invalidar las sesiones cliente.
 *
 * Expiración: 7 días (más cómodo que el panel admin 24h porque el
 * cliente no entra todos los días — solo a checkear estado del pedido).
 */

import crypto from "crypto";

const SECRET = process.env.PANEL_SECRET || "tc-panel-default-secret-change-in-prod";
// SSS329 M3: reducido de 7d → 3d para limitar la ventana de exposición
// si el token-en-URL leak via referer / browser history / shared screen.
const TOKEN_TTL_SEC = 3 * 24 * 60 * 60;

function hmac(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface ConciergeAccessClaims {
  email: string;
  issuedAt: number;
}

/**
 * Issue un token para el email dado.
 * Format: <emailEncoded>:<issuedAt>:<hmac>
 * emailEncoded usa encodeURIComponent para escapar ":".
 */
export function issueConciergeAccessToken(email: string): string {
  const norm = email.trim().toLowerCase();
  const issuedAt = Math.floor(Date.now() / 1000);
  const encEmail = encodeURIComponent(norm);
  const payload = `${encEmail}:${issuedAt}`;
  const sig = hmac(payload);
  return `${payload}:${sig}`;
}

export function verifyConciergeAccessToken(
  token: string | undefined,
  now: number = Date.now(),
): ConciergeAccessClaims | null {
  if (!token) return null;
  const parts = token.split(":");
  if (parts.length !== 3) return null;
  const [encEmail, issuedAtStr, sig] = parts;
  const expected = hmac(`${encEmail}:${issuedAtStr}`);
  if (!constantTimeEq(sig, expected)) return null;
  const issuedAt = parseInt(issuedAtStr, 10);
  if (!Number.isFinite(issuedAt)) return null;
  const ageSec = Math.floor(now / 1000) - issuedAt;
  if (ageSec < 0 || ageSec > TOKEN_TTL_SEC) return null;
  let email: string;
  try {
    email = decodeURIComponent(encEmail);
  } catch {
    return null;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { email: email.toLowerCase(), issuedAt };
}

export const CONCIERGE_ACCESS_TTL_SEC = TOKEN_TTL_SEC;
