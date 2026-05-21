/**
 * /api/partner-auth/verify — SSS383 (21 may 2026)
 *
 * GET ?token=xxx → si HMAC válido + no expirado + nonce no usado,
 * set cookie tc_partner_auth_{ref_code} = HMAC(ref_code|secret) y
 * redirect a /panel/partner/{ref_code}.
 *
 * Nonce usado se persiste en globalThis para impedir replay.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET = process.env.PANEL_SECRET || "tc-panel-default-secret-change-in-prod";

const usedNonces: Map<string, number> = (
  globalThis as unknown as { __tc_pa_nonces?: Map<string, number> }
).__tc_pa_nonces ?? new Map();
(globalThis as unknown as { __tc_pa_nonces: Map<string, number> }).__tc_pa_nonces = usedNonces;

function markNonceUsed(nonce: string): void {
  // TTL cleanup oportunista
  const now = Date.now();
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

interface VerifyResult {
  ok: boolean;
  ref_code?: string;
  reason?: string;
}

function verifyToken(token: string): VerifyResult {
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
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
      return { ok: false, reason: "invalid_signature" };
    }
  } catch {
    return { ok: false, reason: "invalid_signature" };
  }
  const [kind, ref_code, expStr, nonce] = payload.split("|");
  if (kind !== "partner_auth") return { ok: false, reason: "wrong_kind" };
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return { ok: false, reason: "expired" };
  }
  if (isNonceUsed(nonce)) return { ok: false, reason: "nonce_replay" };
  markNonceUsed(nonce);
  return { ok: true, ref_code };
}

function buildAuthCookieName(ref: string): string {
  return `tc_partner_auth_${ref}`;
}

function expectedAuthValue(ref: string): string {
  return crypto.createHmac("sha256", SECRET).update(`partner|${ref}`).digest("hex");
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = new URL(req.url).searchParams.get("token") || "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }
  const v = verifyToken(token);
  if (!v.ok || !v.ref_code) {
    return NextResponse.json(
      { ok: false, error: v.reason || "invalid" },
      { status: 401 },
    );
  }
  const cookieName = buildAuthCookieName(v.ref_code);
  const cookieValue = expectedAuthValue(v.ref_code);
  // 30 días cookie httpOnly partner-auth
  const maxAge = 30 * 86400;
  const cookie = `${cookieName}=${cookieValue}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

  const resp = NextResponse.redirect(
    `https://tripcazador.com/panel/partner/${v.ref_code}?logged=1`,
    302,
  );
  resp.headers.set("Set-Cookie", cookie);
  return resp;
}
