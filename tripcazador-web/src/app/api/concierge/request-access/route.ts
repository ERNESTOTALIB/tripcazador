/**
 * /api/concierge/request-access — SSS328 (19 may 2026)
 *
 * Magic-link: user introduce email → si tiene pedidos Concierge,
 * enviamos un email con un link tokenizado a /concierge/mis-pedidos.
 *
 * POST { email } → 200 { ok: true, sent: boolean }
 *
 * Privacy: SIEMPRE devolvemos 200 ok (no revelamos si el email tiene
 * cuenta o no). Solo enviamos email si hay pedidos. Defensa contra
 * enumeración.
 *
 * Rate limit: cap simple a 5 req/email/hora (in-memory). Si llegamos
 * a abuso real, hardenizar con KV.
 */

import { NextRequest, NextResponse } from "next/server";
import { hasOrdersForEmail } from "@/lib/concierge_orders_fetch";
import {
  issueConciergeAccessToken,
  CONCIERGE_ACCESS_TTL_SEC,
} from "@/lib/concierge_access_token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = "https://tripcazador.com";
const RESEND_FROM =
  process.env.RESEND_FROM || "TripCazador Concierge <alertas@tripcazador.com>";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limit: 5 req por email / hora + 20 req por IP / hora (SSS332).
// El IP cap protege contra atacante que itera muchos emails distintos
// desde la misma fuente.
const rateLimitEmail: Map<string, number[]> = new Map();
const rateLimitIp: Map<string, number[]> = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_EMAIL = 5;
const RATE_LIMIT_MAX_IP = 20;

function checkAndIncrement(
  map: Map<string, number[]>,
  key: string,
  max: number,
  now: number,
): boolean {
  const hits = map.get(key) || [];
  const fresh = hits.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (fresh.length >= max) return true;
  fresh.push(now);
  map.set(key, fresh);
  return false;
}

function isRateLimited(email: string, ip: string, now: number = Date.now()): boolean {
  const emailLimited = checkAndIncrement(rateLimitEmail, email, RATE_LIMIT_MAX_EMAIL, now);
  const ipLimited = ip
    ? checkAndIncrement(rateLimitIp, ip, RATE_LIMIT_MAX_IP, now)
    : false;
  return emailLimited || ipLimited;
}

async function sendMagicLink(email: string, token: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!apiKey) {
    console.log(`[concierge/request-access] dormido email=${email} (RESEND_API_KEY no set)`);
    return false;
  }
  const link = `${SITE_URL}/concierge/mis-pedidos?token=${encodeURIComponent(token)}`;
  const ttlDays = Math.round(CONCIERGE_ACCESS_TTL_SEC / 86400);
  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Tus pedidos Concierge</title></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;">
  <table cellpadding="0" cellspacing="0" style="width:100%;padding:20px 0;"><tr><td align="center">
    <table cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;padding:24px;">
      <tr><td>
        <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#b45309;font-weight:700;">TripCazador · Concierge</div>
        <h1 style="margin:6px 0 6px 0;font-size:22px;color:#111;">🧳 Tu portal de pedidos</h1>
        <p style="font-size:14px;color:#555;margin:0 0 20px 0;">
          Hemos detectado un pedido Concierge con este email. Pulsa el botón para ver el estado actual y descargar tu plan cuando esté listo.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${link}" style="display:inline-block;background:#f59e0b;color:#000;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
            Ver mis pedidos
          </a>
        </div>
        <p style="font-size:12px;color:#888;margin:20px 0 0 0;">
          El link expira en ${ttlDays} días. Si no pediste acceso a tu portal, ignora este email — nadie podrá entrar sin tu email + el link.
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: email,
        subject: "🧳 Tu portal de pedidos Concierge — TripCazador",
        html,
        tags: [{ name: "category", value: "concierge_magic_link" }],
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[concierge/request-access] resend fail:", err);
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
  }

  // SSS329 H1: SIEMPRE devolvemos la MISMA shape para evitar email enumeration.
  // No exponemos `sent`, `rate_limited`, ni nada que revele si la cuenta existe.
  // El envío del email es fire-and-forget para que el timing tampoco varíe.
  // SSS332: rate limit dual por email + por IP. La IP viene del header
  // x-forwarded-for (Vercel) o x-real-ip (alternativo). Cap 20/IP/h.
  const fwd = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
  const ip = fwd.split(",")[0].trim();
  const limited = isRateLimited(email, ip);
  if (!limited) {
    // No esperamos al hasOrders + sendMagicLink — disparamos asíncrono
    // (sin await) para mantener timing estable.
    void (async () => {
      try {
        const hasOrders = await hasOrdersForEmail(email);
        if (hasOrders) {
          const token = issueConciergeAccessToken(email);
          await sendMagicLink(email, token);
        }
      } catch {
        /* swallow — la respuesta ya se envió */
      }
    })();
  }
  return NextResponse.json({ ok: true });
}
