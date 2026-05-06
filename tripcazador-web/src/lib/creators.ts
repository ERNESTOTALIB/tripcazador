/**
 * creators.ts — F5 (May 2026)
 *
 * Sistema de affiliate para influencers / creators. Cada creator obtiene un
 * código único y puede ver sus métricas en /creators/dashboard.
 *
 * Persistencia: por ahora in-memory + JSONL via /api/track. En futuro KV.
 */

import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.CREATORS_SECRET || "tripcazador-creators-may-2026";

export type CreatorStats = {
  code: string;
  clicks: number;
  bookings: number; // bookings tracked via stripe webhook giving credit
  revenue_pending: number; // EUR pending payout
  revenue_paid: number; // EUR already paid out
  last_payout_at?: string;
  joined_at: string;
};

/** Genera token firmado para auth simple por código. */
export function signCreatorToken(code: string): string {
  const sig = createHmac("sha256", SECRET).update(code).digest("hex").slice(0, 16);
  return `${code}.${sig}`;
}

export function verifyCreatorToken(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const code = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", SECRET).update(code).digest("hex").slice(0, 16);
  try {
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return code;
  } catch {
    return null;
  }
}

export function buildCreatorLink(code: string, target: string = "https://tripcazador.com"): string {
  const u = new URL(target);
  u.searchParams.set("ref", code);
  u.searchParams.set("utm_source", "creator");
  u.searchParams.set("utm_medium", "referral");
  u.searchParams.set("utm_campaign", code);
  return u.toString();
}

/** Stub: in-memory store. En prod usar KV. */
const STORE: Map<string, CreatorStats> = new Map();

export function getCreatorStats(code: string): CreatorStats {
  const cur = STORE.get(code);
  if (cur) return cur;
  const fresh: CreatorStats = {
    code,
    clicks: 0,
    bookings: 0,
    revenue_pending: 0,
    revenue_paid: 0,
    joined_at: new Date().toISOString(),
  };
  STORE.set(code, fresh);
  return fresh;
}

export function recordClick(code: string): void {
  const s = getCreatorStats(code);
  s.clicks += 1;
  STORE.set(code, s);
}

export function recordBooking(code: string, commissionEur: number): void {
  const s = getCreatorStats(code);
  s.bookings += 1;
  s.revenue_pending += commissionEur;
  STORE.set(code, s);
}

export function isValidCreatorCode(code: string): boolean {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(code);
}
