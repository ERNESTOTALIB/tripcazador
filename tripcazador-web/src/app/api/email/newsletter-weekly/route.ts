/**
 * /api/email/newsletter-weekly — fase SSS152
 *
 * Endpoint cron-triggered (domingos 18:00 UTC via GH Actions) que envía la
 * newsletter semanal con los 5 chollos top (CRÍTICO/ERROR, España-first)
 * a todos los suscriptores activos vía Resend.
 *
 * Auth: ?token=ADMIN_TOKEN en query (compatible con curl simple).
 *
 * Rate-limit: 1 invocación cada 6h por proceso (in-memory).
 *
 * Si RESEND_API_KEY no está set, devuelve 200 con sent=0 y log "dormido"
 * para que el cron no falle mientras se configura Resend.
 *
 * GET /api/email/newsletter-weekly?token=$ADMIN_TOKEN
 * → { ok: true, sent: N, skipped: M, deals_in_email: 5 }
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { listPendingDrip } from "@/lib/subscribers_store";
import type { Deal } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";
const RATE_WINDOW_MS = 6 * 3_600_000; // 6h

// Set de IATAs españoles que se consideran "Spain-origin" (priorizados)
const ES_ORIGINS = new Set([
  "MAD", "BCN", "VLC", "AGP", "BIO", "SVQ", "ALC", "PMI",
  "TFN", "TFS", "LPA", "OVD", "SDR", "SCQ", "VGO", "LCG",
  "IBZ", "MAH", "GRX", "MJV", "REU", "ZAZ", "VLL", "EAS",
  "PNA", "FUE", "ACE", "ZAZ",
]);

interface DealsFile {
  deals: Deal[];
  generated_at?: string;
  total_deals?: number;
}

// Rate-limit in-memory (1 invocación por 6h)
const lastRunAt: { ts: number } = (
  globalThis as unknown as { __nl_weekly_last?: { ts: number } }
).__nl_weekly_last ?? { ts: 0 };
(globalThis as unknown as { __nl_weekly_last: typeof lastRunAt }).__nl_weekly_last = lastRunAt;

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let m = 0;
  for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}

function isSpanishOrigin(d: Deal): boolean {
  return ES_ORIGINS.has((d.origin || "").toUpperCase());
}

function isCriticalOrError(d: Deal): boolean {
  return d.classification === "CRÍTICO" || d.classification === "ERROR";
}

async function loadDeals(): Promise<Deal[]> {
  // Try a few likely paths because Vercel bundles `public/` separately.
  const candidates = [
    path.join(process.cwd(), "public", "deals-latest.json"),
    path.join(process.cwd(), "tripcazador-web", "public", "deals-latest.json"),
  ];
  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf-8");
      const json = JSON.parse(raw) as DealsFile;
      if (Array.isArray(json.deals)) return json.deals;
    } catch {
      /* try next */
    }
  }
  // Last resort: fetch from the deployed site
  try {
    const res = await fetch(`${SITE}/deals-latest.json`, { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as DealsFile;
      if (Array.isArray(json.deals)) return json.deals;
    }
  } catch {
    /* swallow */
  }
  return [];
}

export function pickTopFiveDeals(deals: Deal[]): Deal[] {
  // Filtra solo CRÍTICO/ERROR, ordena: Spain-first → score DESC → savings_pct DESC.
  // savings_pct DESC para que dentro de un mismo grupo aparezcan los más
  // espectaculares (no los más caros).
  const filtered = deals.filter(isCriticalOrError);
  filtered.sort((a, b) => {
    const sa = isSpanishOrigin(a) ? 1 : 0;
    const sb = isSpanishOrigin(b) ? 1 : 0;
    if (sb !== sa) return sb - sa;
    const scoreDiff = (b.score || 0) - (a.score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (b.savings_pct || 0) - (a.savings_pct || 0);
  });
  return filtered.slice(0, 5);
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((d.getTime() - Date.now()) / 86_400_000));
}

export function renderNewsletterHtml(deals: Deal[], unsubUrl: string): string {
  const cards = deals
    .map((d) => {
      const url = `${SITE}/deals/${d.id}?utm_source=newsletter&utm_medium=email&utm_campaign=weekly`;
      const days = daysUntil(d.date_out);
      const daysCopy = days !== null ? `${days} días` : "fecha flexible";
      const route = `${escapeHtml(d.city_from || d.origin)} → ${escapeHtml(d.city_to || d.destination)}`;
      const airline = escapeHtml(d.airline_name || d.airline || "Varias aerolíneas");
      return `
        <tr><td style="padding:0 0 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e5e5e5;border-radius:10px;">
            <tr><td style="padding:18px 20px;">
              <div style="font-size:12px;color:#d97706;font-weight:700;letter-spacing:.4px;text-transform:uppercase;">${escapeHtml(d.classification)}</div>
              <div style="margin-top:6px;font-size:18px;font-weight:700;color:#0f172a;line-height:1.3;">
                ${route}
              </div>
              <div style="margin-top:4px;font-size:13px;color:#64748b;">
                ${airline} · ${daysCopy} · ${escapeHtml(d.cabin || "economy")}
              </div>
              <div style="margin-top:10px;font-size:24px;font-weight:800;color:#0f172a;">
                €${Math.round(d.price_eur || 0)}
                <span style="font-size:12px;font-weight:600;color:#16a34a;margin-left:6px;">-${Math.round(d.savings_pct || 0)}%</span>
              </div>
              <div style="margin-top:12px;">
                <a href="${url}" style="display:inline-block;background:#f59e0b;color:#0f172a;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;">
                  Ver chollo →
                </a>
              </div>
            </td></tr>
          </table>
        </td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>📬 Tu radar semanal — TripCazador</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;background:#f1f5f9;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
    <tr><td align="center" style="padding:24px 12px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#0f172a;color:#ffffff;padding:28px 24px;border-radius:12px 12px 0 0;">
          <div style="font-size:14px;color:#f59e0b;font-weight:700;letter-spacing:.5px;text-transform:uppercase;">📬 Tu radar semanal</div>
          <div style="margin-top:6px;font-size:24px;font-weight:800;">TripCazador</div>
          <div style="margin-top:8px;font-size:13px;color:#cbd5e1;">Los 5 chollos más afilados de los últimos 7 días</div>
        </td></tr>
        <tr><td style="padding:20px 12px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${cards}
          </table>
        </td></tr>
        <tr><td style="padding:8px 12px 24px;text-align:center;">
          <a href="${SITE}/deals?utm_source=newsletter&utm_medium=email&utm_campaign=weekly" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;">
            Ver todos los chollos →
          </a>
        </td></tr>
        <tr><td style="padding:16px 24px 24px;text-align:center;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;background:#ffffff;border-radius:0 0 12px 12px;">
          <p style="margin:0 0 6px;">TripCazador · contacto@tripcazador.com</p>
          <p style="margin:0;">
            ¿No quieres más? <a href="${unsubUrl}" style="color:#64748b;">Date de baja</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function unsubscribeUrl(email: string): string {
  const token = Buffer.from(`${email}:${Date.now()}`).toString("base64url");
  return `${SITE}/api/unsubscribe?t=${token}`;
}

async function sendOne(
  resendKey: string,
  from: string,
  email: string,
  subject: string,
  html: string,
  unsub: string,
): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject,
        html,
        headers: {
          "List-Unsubscribe": `<${unsub}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const expected = process.env.ADMIN_TOKEN || "";
  if (!expected) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  if (!constantTimeEq(token, expected)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Rate-limit
  const now = Date.now();
  if (now - lastRunAt.ts < RATE_WINDOW_MS) {
    const wait = Math.ceil((RATE_WINDOW_MS - (now - lastRunAt.ts)) / 60_000);
    return NextResponse.json(
      { ok: false, error: "rate_limited", retry_in_minutes: wait },
      { status: 429 },
    );
  }
  lastRunAt.ts = now;

  const deals = await loadDeals();
  const top5 = pickTopFiveDeals(deals);

  if (top5.length === 0) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      skipped: 0,
      deals_in_email: 0,
      reason: "no_deals",
    });
  }

  // Subscribers: usar listPendingDrip con horizonte futuro = todos los activos
  let subs: string[] = [];
  try {
    const all = await listPendingDrip(Date.now() + 1000 * 365 * 24 * 3600);
    subs = all.filter((s) => !s.unsubscribed_at).map((s) => s.email);
  } catch {
    subs = [];
  }

  if (subs.length === 0) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      skipped: 0,
      deals_in_email: top5.length,
      reason: "no_subscribers",
    });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
  const RESEND_FROM = process.env.RESEND_FROM || "TripCazador <newsletter@tripcazador.com>";

  if (!RESEND_API_KEY) {
    console.log(
      `[newsletter-weekly] dormido — RESEND_API_KEY no set. ${subs.length} subs estaban listos.`,
    );
    return NextResponse.json({
      ok: true,
      sent: 0,
      skipped: subs.length,
      deals_in_email: top5.length,
      reason: "resend_not_configured",
    });
  }

  const subject = `📬 Tu radar semanal · ${top5.length} chollos top (${new Date().toLocaleDateString("es-ES")})`;
  let sent = 0;
  let skipped = 0;
  for (const email of subs) {
    const unsub = unsubscribeUrl(email);
    const html = renderNewsletterHtml(top5, unsub);
    const ok = await sendOne(RESEND_API_KEY, RESEND_FROM, email, subject, html, unsub);
    if (ok) sent += 1;
    else skipped += 1;
  }

  return NextResponse.json({
    ok: true,
    sent,
    skipped,
    deals_in_email: top5.length,
  });
}

// Test-only export para poder forzar reset del rate-limit en vitest.
export function _resetRateLimitForTest(): void {
  lastRunAt.ts = 0;
}
