/**
 * /api/mobile/login/verify — SSS368 (21 may 2026)
 *
 * Verifica el magic-link token + emite sesión JWT.
 *
 * POST { token } → { ok, email, session_token, expires_at }
 *
 * El session_token la app guarda en SecureStore + lo usa como Bearer
 * para llamadas authed (/api/premium/stats, /api/premium/alerts, etc).
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET = process.env.PANEL_SECRET || "tc-panel-default-secret-change-in-prod";

// SSS383 anti-replay: persistimos nonces consumidos. El magic-link sólo debe
// canjearse 1 vez. Sin esto un atacante que observe el link (email forward,
// lock-screen preview, log scrape) puede generar múltiples sesiones 90d
// antes de que expire el link (15 min). globalThis persiste cross-request en
// container Vercel warm; cuando el container muere los nonces se pierden —
// aceptable porque expiración del link 15min los hace inválidos igualmente.
const usedNonces: Map<string, number> = (
  globalThis as unknown as { __tc_mlogin_nonces?: Map<string, number> }
).__tc_mlogin_nonces ?? new Map();
(globalThis as unknown as { __tc_mlogin_nonces: Map<string, number> }).__tc_mlogin_nonces =
  usedNonces;

function markNonceUsed(nonce: string): void {
  const now = Date.now();
  // Cleanup oportunista para no bloat memory
  if (usedNonces.size > 5000) {
    Array.from(usedNonces.entries()).forEach(([k, ts]) => {
      if (now - ts > 24 * 3600_000) usedNonces.delete(k);
    });
  }
  usedNonces.set(nonce, now);
}

function isNonceUsed(nonce: string): boolean {
  return usedNonces.has(nonce);
}

function verifyToken(token: string): { ok: boolean; email?: string; platform?: string; reason?: string } {
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return { ok: false, reason: "invalid_format" };
  }

  const parts = decoded.split(":");
  if (parts.length !== 2) return { ok: false, reason: "invalid_structure" };
  const [payload, sig] = parts;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  let eqSafe = false;
  try {
    eqSafe = crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return { ok: false, reason: "invalid_signature" };
  }
  if (!eqSafe) return { ok: false, reason: "invalid_signature" };

  // SSS368 token format: email|platform|exp|nonce (4 parts)
  const segments = payload.split("|");
  const [email, platform, expStr, nonce] = segments;
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return { ok: false, reason: "expired" };
  }
  if (!nonce) {
    // Token sin nonce — formato viejo, rechazar por seguridad
    return { ok: false, reason: "invalid_structure" };
  }
  if (isNonceUsed(nonce)) {
    return { ok: false, reason: "nonce_replay" };
  }
  markNonceUsed(nonce);
  return { ok: true, email, platform };
}

function issueSessionToken(email: string): { token: string; expiresAt: number } {
  // Sesión 90 días — suficiente para mobile, refresh-able via re-login
  const expiresAt = Date.now() + 90 * 86400_000;
  const payload = `session|${email}|${expiresAt}|${crypto.randomBytes(8).toString("hex")}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return {
    token: Buffer.from(`${payload}:${sig}`).toString("base64url"),
    expiresAt,
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const token = String(body.token || "").trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  const verification = verifyToken(token);
  if (!verification.ok || !verification.email) {
    return NextResponse.json(
      { ok: false, error: verification.reason || "invalid_token" },
      { status: 401 },
    );
  }

  const session = issueSessionToken(verification.email);

  return NextResponse.json({
    ok: true,
    email: verification.email,
    platform: verification.platform,
    session_token: session.token,
    expires_at: session.expiresAt,
  });
}
