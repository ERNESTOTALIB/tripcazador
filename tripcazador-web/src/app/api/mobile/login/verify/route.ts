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

function verifyToken(token: string): { ok: boolean; email?: string; platform?: string; reason?: string } {
  const secret = process.env.PANEL_SECRET || "";
  if (!secret) return { ok: false, reason: "server_misconfigured" };

  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return { ok: false, reason: "invalid_format" };
  }

  const parts = decoded.split(":");
  if (parts.length !== 2) return { ok: false, reason: "invalid_structure" };
  const [payload, sig] = parts;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  let eqSafe = false;
  try {
    eqSafe = crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return { ok: false, reason: "invalid_signature" };
  }
  if (!eqSafe) return { ok: false, reason: "invalid_signature" };

  const [email, platform, expStr] = payload.split("|");
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, email, platform };
}

function issueSessionToken(email: string): { token: string; expiresAt: number } {
  const secret = process.env.PANEL_SECRET || "";
  // Sesión 90 días — suficiente para mobile, refresh-able via re-login
  const expiresAt = Date.now() + 90 * 86400_000;
  const payload = `session|${email}|${expiresAt}|${crypto.randomBytes(8).toString("hex")}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
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
