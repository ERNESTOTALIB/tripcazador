/**
 * /api/premium/winback-cron — SSS322 (19 may 2026)
 *
 * Cron diario anti-churn: encuentra Premium con last_seen > 14d ago,
 * y les envía un email personalizado con su ROI + top 3 deals de su
 * ruta favorita.
 *
 * GET ?token=PRICE_ALERT_CRON_TOKEN_PREMIUM
 *   → 200 { users_total, eligible, sent, skipped }
 *
 * Recolección de candidatos:
 *  - Iteramos alertas Premium activas (listActiveAlertsByTier("premium"))
 *  - Dedupe por customerId
 *  - Para cada one: getLastSeen → qualifiesForWinback(lastSeen, alertCreatedAt)
 *  - Si califica → summarize savings, pick favorite route from alerts,
 *    filtrar deals matching route → send email
 */

import { NextRequest, NextResponse } from "next/server";
import { listActiveAlertsByTier, listAlertsByCustomer } from "@/lib/price_alerts_store";
import { getLastSeen, qualifiesForWinback } from "@/lib/last_seen_store";
import { listSavingsByCustomer, summarize } from "@/lib/savings_log_store";
import { buildWinbackEmailHtml, type WinbackTopDeal } from "@/lib/winback_email";
import { pickFavoriteRoute, pickTopDealsForRoute } from "@/lib/winback_helpers";
import { safeCronMarker } from "@/lib/cron_idempotency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = "https://tripcazador.com";
const RESEND_FROM =
  process.env.RESEND_FROM || "TripCazador Premium <alertas@tripcazador.com>";

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let m = 0;
  for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}

interface DealLite {
  id?: string;
  origin?: string;
  destination?: string;
  price_eur?: number;
  airline_name?: string;
  date_out?: string;
  savings_pct?: number;
}

async function fetchDeals(): Promise<DealLite[]> {
  try {
    const res = await fetch(`${SITE_URL}/api/deals?limit=200`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.deals)) return data.deals;
  } catch {
    /* no-op */
  }
  return [];
}

async function sendWinback(
  to: string,
  customerId: string,
  html: string,
  daysAway: number,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!apiKey) {
    console.log(`[winback-cron] dormido cust=${customerId} (RESEND_API_KEY no set)`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to,
        subject: `👋 Hace ${daysAway} días que no entras — tu Premium te espera`,
        html,
        tags: [
          { name: "category", value: "premium_winback" },
          { name: "customer", value: customerId.slice(0, 20) },
        ],
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[winback-cron] resend fail:", err);
    // AUDIT-FULL-2: Sentry capture (LOW OPS — solo 10 archivos capturaban antes).
    try {
      const { captureRevenueError } = await import("@/lib/sentry_helper");
      captureRevenueError(err, {
        module: "winback-cron",
        code: "resend_send_failed",
        extra: { customerId: customerId.slice(0, 20) },
        level: "warning",
      });
    } catch {
      /* sentry_helper no disponible — silencioso */
    }
    return false;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get("token") || "";
  const expected =
    process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM ||
    process.env.PRICE_ALERT_CRON_TOKEN ||
    "";
  if (!expected) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  if (!constantTimeEq(token, expected)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const premiumAlerts = await listActiveAlertsByTier("premium");
  // Map customerId → { email, oldestAlertTs }
  const customers = new Map<string, { email: string; oldestAlertTs: number }>();
  for (const a of premiumAlerts) {
    if (!a.customerId || !a.email) continue;
    const existing = customers.get(a.customerId);
    if (!existing || a.created_at < existing.oldestAlertTs) {
      customers.set(a.customerId, {
        email: a.email,
        oldestAlertTs: a.created_at,
      });
    }
  }

  const deals = await fetchDeals();

  let eligible = 0;
  let sent = 0;
  let skipped = 0;
  const now = Date.now();

  for (const [customerId, info] of Array.from(customers.entries())) {
    const lastSeen = await getLastSeen(customerId);
    if (!qualifiesForWinback(lastSeen, info.oldestAlertTs, now)) {
      skipped += 1;
      continue;
    }
    // AUDIT-FULL-2: idempotency marker — skip si ya enviado hoy a este customer
    const proceed = await safeCronMarker("winback", customerId);
    if (!proceed) {
      skipped += 1;
      continue;
    }
    eligible += 1;

    // ROI summary
    const savings = await listSavingsByCustomer(customerId);
    const summary = summarize(savings, now);

    // Favorite route from this customer's alerts
    const allAlerts = await listAlertsByCustomer(customerId);
    const favorite = pickFavoriteRoute(allAlerts);

    // Top 3 deals for favorite route (or general top by savings_pct if none)
    const topDeals: WinbackTopDeal[] = pickTopDealsForRoute(deals, favorite, 3);

    const daysAway = Math.floor((now - (lastSeen ?? info.oldestAlertTs)) / 86_400_000);
    const html = buildWinbackEmailHtml({
      daysAway,
      totalSavingsEur: summary.total_eur,
      triggersCount: summary.count,
      favoriteRoute: favorite ?? undefined,
      topDeals,
      siteUrl: SITE_URL,
    });

    const ok = await sendWinback(info.email, customerId, html, daysAway);
    if (ok) sent += 1;
    else skipped += 1;
  }

  return NextResponse.json({
    ok: true,
    users_total: customers.size,
    eligible,
    sent,
    skipped,
    resend_active: Boolean(process.env.RESEND_API_KEY),
  });
}
