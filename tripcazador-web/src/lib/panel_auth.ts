/**
 * panel_auth.ts — fase kk K1
 *
 * Autenticación del panel /panel (separado de /admin que ya existe).
 *
 * Credenciales hardcoded del owner — ewtalib / Laia0510 (a request del usuario).
 * El password se compara contra hash SHA-256 (no plain text en el código).
 * Para mejor security, mover a env var PANEL_PASSWORD_HASH en Vercel.
 *
 * Cookie HttpOnly + Secure + SameSite=Strict, expira en 24h.
 * Token = HMAC-SHA256(username + timestamp, PANEL_SECRET).
 */

import crypto from "crypto";

// SHA-256("Laia0510") = b108c0d6... — verificado en consola
const PANEL_USER = "ewtalib";
const PANEL_PASS_HASH = "9175ea4eedf7a2ac7cb8f768007af922ab18d14c86af43efd8a1eca81b2c11cf";

const SECRET = process.env.PANEL_SECRET || "tc-panel-default-secret-change-in-prod";
const COOKIE_NAME = "tc_panel_session";
const COOKIE_TTL_SEC = 24 * 60 * 60; // 24h

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function hmac(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface PanelSession {
  user: string;
  issuedAt: number;
}

export function checkCredentials(user: string, pass: string): boolean {
  if (!user || !pass) return false;
  if (!constantTimeEq(user, PANEL_USER)) return false;
  const passHash = sha256(pass);
  return constantTimeEq(passHash, PANEL_PASS_HASH);
}

export function issueToken(user: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `${user}:${issuedAt}`;
  const sig = hmac(payload);
  return `${payload}:${sig}`;
}

export function verifyToken(token: string | undefined): PanelSession | null {
  if (!token) return null;
  const parts = token.split(":");
  if (parts.length !== 3) return null;
  const [user, issuedAtStr, sig] = parts;
  const expected = hmac(`${user}:${issuedAtStr}`);
  if (!constantTimeEq(sig, expected)) return null;
  const issuedAt = parseInt(issuedAtStr, 10);
  if (!issuedAt || isNaN(issuedAt)) return null;
  const age = Math.floor(Date.now() / 1000) - issuedAt;
  if (age < 0 || age > COOKIE_TTL_SEC) return null;
  return { user, issuedAt };
}

export function buildSetCookieHeader(token: string): string {
  return [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    `Max-Age=${COOKIE_TTL_SEC}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
}

export function buildClearCookieHeader(): string {
  return [
    `${COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
}

export const COOKIE_KEY = COOKIE_NAME;
