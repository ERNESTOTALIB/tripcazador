/**
 * /api/email/weekly-digest — fase qqq4
 *
 * Endpoint manual/cron-triggered que envía digest semanal a suscriptores
 * con top 10 deals de la semana via Resend.
 *
 * Uso:
 *  - cron weekly: GH Actions workflow `email-digest.yml` → POST aquí
 *  - manual: owner dispara desde /panel/share o curl con ADMIN_TOKEN
 *
 * Auth: requiere ADMIN_TOKEN en header `x-admin-token` o cookie `panel_session`.
 *
 * NOTA: NO envía si RESEND_API_KEY no está set — devuelve 503 + log.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rankByQuality } from "@/lib/hunter_quality";
import { diversifyDeals } from "@/lib/seed_diversifier";
import { listPendingDrip } from "@/lib/subscribers_store";

// Helper: get all active subscriber emails (no drip filter)
async function getActiveSubscribers(): Promise<string[]> {
  // listPendingDrip(0) returns all non-unsubscribed; filter to email[]
  try {
    const all = await listPendingDrip(Date.now() + 1000 * 365 * 24 * 3600);
    return all.filter((s) => !s.unsubscribed_at).map((s) => s.email);
  } catch {
    return [];
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export async function POST(req: NextRequest) {
  // Auth
  const ck = cookies();
  const session = ck.get("panel_session")?.value;
  const tokenHeader = req.headers.get("x-admin-token");
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
  const authorized = !!session || (ADMIN_TOKEN && tokenHeader === ADMIN_TOKEN);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured", queued: 0 },
      { status: 503 },
    );
  }

  // Get top 10 deals
  const allDeals = diversifyDeals([]);
  const ranked = rankByQuality(allDeals).slice(0, 10);

  // Get subscribers (active = non-unsubscribed)
  const subscribers = await getActiveSubscribers();

  if (subscribers.length === 0) {
    return NextResponse.json({ ok: true, queued: 0, reason: "no subscribers" });
  }

  const html = renderDigestHtml(ranked);
  const subject = `🎯 TripCazador — Top 10 chollos de la semana (${new Date().toLocaleDateString("es-ES")})`;

  // Send via Resend (batch — 100 max per call, but free tier limits)
  let sent = 0;
  let failed = 0;
  for (const email of subscribers.slice(0, 100)) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "TripCazador <newsletter@tripcazador.com>",
          to: [email],
          subject,
          html,
        }),
      });
      if (r.ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    queued: subscribers.length,
    sent,
    failed,
  });
}

function renderDigestHtml(deals: Array<any>): string {
  const items = deals
    .map((d, i) => {
      const url = `${SITE}/deals/${d.id}`;
      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #e5e5e5">
            <a href="${url}" style="color:#0a1530;text-decoration:none;font-weight:600;font-size:15px">
              ${i + 1}. ${escapeHtml(d.headline || "")}
            </a>
            <div style="margin-top:4px;color:#737373;font-size:13px">
              ${d.city_from || ""} → ${d.city_to || ""} · ${d.cabin || "economy"} · ${d.savings_pct || 0}% off
            </div>
            <div style="margin-top:8px">
              <a href="${url}" style="display:inline-block;background:#d97706;color:#fff;padding:8px 14px;border-radius:6px;font-size:13px;text-decoration:none">
                Ver oferta →
              </a>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width">
      <title>TripCazador weekly digest</title>
    </head>
    <body style="margin:0;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;background:#fafafa;color:#0a1530">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff">
        <tr><td style="padding:24px;background:#0a1530;color:#fff">
          <h1 style="margin:0;font-size:24px">🎯 TripCazador — Weekly</h1>
          <p style="margin:8px 0 0;opacity:0.85;font-size:14px">Top 10 chollos cazados esta semana</p>
        </td></tr>
        ${items}
        <tr><td style="padding:24px;background:#f5f5f5;text-align:center;font-size:12px;color:#737373">
          <p>¿No quieres recibir más? <a href="${SITE}/api/unsubscribe" style="color:#737373">Date de baja</a></p>
          <p>TripCazador · contacto@tripcazador.com · <a href="${SITE}" style="color:#737373">tripcazador.com</a></p>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
