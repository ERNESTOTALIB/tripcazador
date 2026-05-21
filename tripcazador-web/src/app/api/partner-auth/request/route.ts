/**
 * /api/partner-auth/request — SSS383 (21 may 2026)
 *
 * Magic-link login para partner dashboard. POST { ref_code, email }
 * → si email matchea contact_email del partner, envía enlace 15min
 * a tripcazador.com/api/partner-auth/verify?token=...
 *
 * Rate limit: 3 req/15min/ref_code + 5/15min/IP.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPartnerByCode } from "@/lib/agency_partner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET = process.env.PANEL_SECRET || "tc-panel-default-secret-change-in-prod";

const rateByCode: Map<string, number[]> = (
  globalThis as unknown as { __tc_pa_rate_code?: Map<string, number[]> }
).__tc_pa_rate_code ?? new Map();
(globalThis as unknown as { __tc_pa_rate_code: Map<string, number[]> }).__tc_pa_rate_code =
  rateByCode;

const rateByIp: Map<string, number[]> = (
  globalThis as unknown as { __tc_pa_rate_ip?: Map<string, number[]> }
).__tc_pa_rate_ip ?? new Map();
(globalThis as unknown as { __tc_pa_rate_ip: Map<string, number[]> }).__tc_pa_rate_ip =
  rateByIp;

function isRateLimited(bucket: Map<string, number[]>, key: string, max: number): boolean {
  const now = Date.now();
  const win = 15 * 60_000;
  const hits = (bucket.get(key) || []).filter((t) => now - t < win);
  hits.push(now);
  bucket.set(key, hits);
  return hits.length > max;
}

function signToken(refCode: string): string {
  const exp = Date.now() + 15 * 60_000;
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = `partner_auth|${refCode}|${exp}|${nonce}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

async function sendEmail(to: string, refCode: string, token: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!apiKey) {
    console.log(`[partner-auth] dormido sin RESEND_API_KEY · email=${to} ref=${refCode}`);
    return false;
  }
  const link = `https://tripcazador.com/api/partner-auth/verify?token=${encodeURIComponent(token)}`;
  const html = `<p>Pulsa para acceder al panel partner <strong>${refCode}</strong> (15 min):</p>
<p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#000;font-weight:700;text-decoration:none;border-radius:8px">Acceder al panel</a></p>
<p style="font-size:12px;color:#888">Si no fuiste tú, ignora este email.</p>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "TripCazador <login@tripcazador.com>",
        to,
        subject: `🔐 Acceso panel partner ${refCode}`,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const refCode = String(body.ref_code || "").trim().toUpperCase();
  const email = String(body.email || "").trim().toLowerCase();

  if (!refCode || !email) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }
  if (isRateLimited(rateByCode, refCode, 3)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  if (isRateLimited(rateByIp, ip, 5)) {
    return NextResponse.json({ ok: false, error: "rate_limited_ip" }, { status: 429 });
  }

  const partner = getPartnerByCode(refCode);
  // Privacy: respondemos ok:true incluso si partner no existe o email no
  // matchea — para no revelar qué ref_codes están activos vs no.
  if (!partner || partner.contact_email !== email || partner.status !== "active") {
    return NextResponse.json({ ok: true, sent: true });
  }

  const token = signToken(refCode);
  const sent = await sendEmail(email, refCode, token);
  return NextResponse.json({ ok: true, sent });
}
