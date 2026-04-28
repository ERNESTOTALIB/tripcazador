/**
 * /api/notify-alert — Edge function que envía emails de alerta de precio.
 *
 * Llamada desde el backend cron (/api/price-alerts/match-cron) o desde
 * GitHub Actions. Token compartido con HMAC para evitar spam.
 *
 * Uso:
 *   POST /api/notify-alert
 *   Headers:
 *     Authorization: Bearer <RESEND_PROXY_TOKEN>
 *     Content-Type: application/json
 *   Body:
 *     {
 *       "to": "user@example.com",
 *       "alert": { "origin": "MAD", "destination": "JFK", "max_price": 300 },
 *       "deal": {
 *         "headline": "Madrid → Nueva York desde 289€",
 *         "price_eur": 289,
 *         "date_out": "2026-08-15",
 *         "airline_name": "Iberia",
 *         "booking_url": "https://www.kayak.es/flights/MAD-JFK/2026-08-15"
 *       }
 *     }
 *
 * Env vars requeridas:
 *   - RESEND_API_KEY         — re_xxx desde resend.com
 *   - RESEND_PROXY_TOKEN     — secret compartido con backend (constant-time)
 *   - RESEND_FROM (opcional) — "alertas@tripcazador.com" por defecto
 *
 * Si RESEND_API_KEY no está, devuelve 503 (no se queda en silencio).
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const RESEND_FROM =
  process.env.RESEND_FROM || "TripCazador Alertas <alertas@tripcazador.com>";

interface AlertPayload {
  to: string;
  alert: {
    origin?: string;
    destination?: string;
    max_price?: number;
    cabin?: string;
  };
  deal: {
    headline: string;
    price_eur: number;
    date_out?: string;
    date_ret?: string;
    airline_name?: string;
    booking_url?: string;
    savings_pct?: number;
  };
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 254;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml(p: AlertPayload): string {
  const esc = escapeHtml;
  const price = `${p.deal.price_eur.toFixed(0)}€`;
  const route =
    p.alert.origin && p.alert.destination
      ? `${esc(p.alert.origin)} → ${esc(p.alert.destination)}`
      : esc(p.deal.headline);
  const dates = [p.deal.date_out, p.deal.date_ret].filter(Boolean).map(esc).join(" → ");
  const airline = p.deal.airline_name ? `con ${esc(p.deal.airline_name)}` : "";
  const savings = p.deal.savings_pct ? `(-${p.deal.savings_pct.toFixed(0)}%)` : "";
  const cta = p.deal.booking_url
    ? `<a href="${esc(p.deal.booking_url)}" style="display:inline-block;background:#f59e0b;color:#000;padding:14px 28px;border-radius:8px;font-weight:600;text-decoration:none">Reservar ahora →</a>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#030712;color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" style="background:#030712"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#111827;border-radius:12px;overflow:hidden">
<tr><td style="padding:24px 28px 8px"><span style="color:#fbbf24;font-weight:700;font-size:20px">✈ TripCazador</span></td></tr>
<tr><td style="padding:0 28px 8px"><h1 style="margin:0;font-size:22px;color:#fff">Tu alerta saltó: ${esc(route)}</h1></td></tr>
<tr><td style="padding:8px 28px 16px">
  <p style="margin:0;font-size:42px;color:#fbbf24;font-weight:700">${price} ${esc(savings)}</p>
  <p style="margin:6px 0 0;color:#9ca3af;font-size:14px">${dates ? esc(dates) + " " : ""}${airline}</p>
</td></tr>
<tr><td style="padding:0 28px 24px">${cta}</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #1f2937">
  <p style="margin:0;color:#6b7280;font-size:12px">
    Buscaste ${p.alert.origin ? esc(p.alert.origin) : "—"} → ${p.alert.destination ? esc(p.alert.destination) : "—"}
    bajo ${p.alert.max_price ? esc(String(p.alert.max_price)) + "€" : "tu límite"}.
  </p>
  <p style="margin:8px 0 0;color:#6b7280;font-size:12px">
    <a href="https://tripcazador.com/alertas" style="color:#9ca3af">Gestionar alertas</a> ·
    <a href="https://tripcazador.com" style="color:#9ca3af">tripcazador.com</a>
  </p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Auth
  const expected = process.env.RESEND_PROXY_TOKEN || "";
  if (!expected) {
    return NextResponse.json(
      { error: "service unavailable (RESEND_PROXY_TOKEN missing)" },
      { status: 503 }
    );
  }
  const auth = req.headers.get("authorization") || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!constantTimeEq(provided, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate
  let payload: AlertPayload;
  try {
    payload = (await req.json()) as AlertPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!payload.to || !isValidEmail(payload.to)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }
  if (!payload.deal || typeof payload.deal.price_eur !== "number") {
    return NextResponse.json({ error: "invalid deal" }, { status: 400 });
  }

  // 3. Send via Resend
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 503 }
    );
  }

  const html = buildEmailHtml(payload);
  const subject = `${payload.deal.price_eur.toFixed(0)}€: ${payload.deal.headline}`.slice(
    0,
    98
  );

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [payload.to],
      subject,
      html,
      tags: [{ name: "type", value: "price-alert" }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json(
      { error: "resend failed", detail: errText.slice(0, 200), status: res.status },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json({ ok: true, id: data?.id || null });
}

export async function GET() {
  return NextResponse.json(
    {
      service: "notify-alert",
      ready:
        Boolean(process.env.RESEND_API_KEY) &&
        Boolean(process.env.RESEND_PROXY_TOKEN),
    },
    { status: 200 }
  );
}
