/**
 * /api/mobile/login/request — SSS368 (21 may 2026)
 *
 * Solicita magic-link login para la app mobile. Reusa el mismo HMAC token
 * pattern que el portal Concierge para consistencia.
 *
 * POST { email, platform }
 *   → email con link tripcazador://login?token=xxx (universal link)
 *   → respuesta {ok:true, sent:true}
 *
 * Rate limit: 3 req/15min/email + 10 req/15min/IP (anti-abuse).
 *
 * El link expira en 15 min. Token = HMAC(email + nonce + timestamp).
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RateBucket {
  hits: Map<string, number[]>;
}

const ratePerEmail: RateBucket = (
  globalThis as unknown as { __tc_mlr_email?: RateBucket }
).__tc_mlr_email ?? { hits: new Map() };
(globalThis as unknown as { __tc_mlr_email: RateBucket }).__tc_mlr_email = ratePerEmail;

const ratePerIp: RateBucket = (
  globalThis as unknown as { __tc_mlr_ip?: RateBucket }
).__tc_mlr_ip ?? { hits: new Map() };
(globalThis as unknown as { __tc_mlr_ip: RateBucket }).__tc_mlr_ip = ratePerIp;

function isRateLimited(bucket: RateBucket, key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (bucket.hits.get(key) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  bucket.hits.set(key, hits);
  return hits.length > max;
}

function signToken(email: string, platform: string): string {
  const secret = process.env.PANEL_SECRET || "";
  if (!secret) throw new Error("panel_secret_missing");
  const exp = Date.now() + 15 * 60_000; // 15 min
  const nonce = crypto.randomBytes(6).toString("hex");
  const payload = `${email}|${platform}|${exp}|${nonce}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  // base64url(payload + ":" + sig)
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

async function sendLoginEmail(email: string, token: string, platform: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!apiKey) {
    console.log(`[mobile-login] dormido sin RESEND_API_KEY · email=${email} platform=${platform}`);
    return false;
  }

  // Universal link tripcazador.com/m/login?token=xxx → app captura via
  // Universal Links iOS + App Links Android. Fallback web si app no instalada.
  const link = `https://tripcazador.com/m/login?token=${encodeURIComponent(token)}`;

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#030712;font-family:-apple-system,sans-serif">
<table role="presentation" width="100%" style="background:#030712"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#111827;border-radius:12px;overflow:hidden">
  <tr><td style="padding:24px 28px;background:#1f2937">
    <div style="font-size:14px;color:#fbbf24;font-weight:600">TripCazador · App</div>
    <h1 style="margin:8px 0 0;font-size:22px;color:#f9fafb">Inicia sesión en la app</h1>
  </td></tr>
  <tr><td style="padding:24px 28px;color:#e5e7eb;font-size:15px;line-height:1.6">
    <p>Pulsa el botón para iniciar sesión en la app TripCazador. Este link expira en 15 minutos.</p>
    <div style="margin-top:24px;text-align:center">
      <a href="${link}" style="display:inline-block;background:#f59e0b;color:#030712;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none">
        🚀 Abrir app y entrar
      </a>
    </div>
    <p style="margin-top:24px;font-size:12px;color:#9ca3af">
      Si no fuiste tú, ignora este email. Sin el link nadie podrá acceder.
    </p>
  </td></tr>
</table></td></tr></table></body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "TripCazador <login@tripcazador.com>",
        to: email,
        subject: "🎯 Tu link mágico TripCazador",
        html,
        tags: [
          { name: "category", value: "mobile_login" },
          { name: "platform", value: platform },
        ],
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("[mobile-login] resend fail:", e);
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

  const email = String(body.email || "").trim().toLowerCase();
  const platform = String(body.platform || "unknown").slice(0, 16);

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
  }

  if (isRateLimited(ratePerEmail, email, 3, 15 * 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  if (isRateLimited(ratePerIp, ip, 10, 15 * 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited_ip" }, { status: 429 });
  }

  try {
    const token = signToken(email, platform);
    const sent = await sendLoginEmail(email, token, platform);
    // Devolvemos ok:true incluso si RESEND no está configurado — security
    // (no leak de qué emails están en sistema). El user puede ver en logs si dev.
    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    console.error("[mobile-login] sign fail:", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
