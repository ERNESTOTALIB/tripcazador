/**
 * /api/price-alerts/match-cron — fase ss-SS3
 *
 * Cron: lee /api/deals fresco, cruza con alerts activos, dispara
 * /api/notify-alert para cada match. Marca alert como triggered.
 *
 * GET /api/price-alerts/match-cron?token=PRICE_ALERT_CRON_TOKEN
 * → { ok: true, matched, sent, skipped }
 *
 * Estrategia: 1 deal por alert match (el mejor precio disponible).
 */

import { NextRequest, NextResponse } from "next/server";
import { listActiveAlerts, markTriggered, type PriceAlert } from "@/lib/price_alerts_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = "https://tripcazador.com";

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
  cabin?: string;
  date_out?: string;
  date_ret?: string;
  airline_name?: string;
  headline?: string;
  booking_url?: string;
  savings_pct?: number;
}

async function fetchDeals(): Promise<DealLite[]> {
  try {
    const res = await fetch(`${SITE_URL}/api/deals`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data as DealLite[];
    if (data && Array.isArray(data.deals)) return data.deals as DealLite[];
  } catch {
    /* no-op */
  }
  return [];
}

function dealMatches(deal: DealLite, alert: PriceAlert): boolean {
  if (!deal.price_eur || deal.price_eur > alert.max_price) return false;
  if (alert.origin && deal.origin !== alert.origin) return false;
  if (alert.destination && deal.destination !== alert.destination) return false;
  if (alert.cabin && deal.cabin !== alert.cabin) return false;
  if (alert.date_min && deal.date_out && deal.date_out < alert.date_min) return false;
  if (alert.date_max && deal.date_out && deal.date_out > alert.date_max) return false;
  return true;
}

async function sendNotify(alert: PriceAlert, deal: DealLite): Promise<boolean> {
  const token = process.env.RESEND_PROXY_TOKEN || "";
  if (!token) {
    console.log(`[match-cron] dormido alert=${alert.id} (RESEND_PROXY_TOKEN no set)`);
    return false;
  }
  try {
    const res = await fetch(`${SITE_URL}/api/notify-alert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: alert.email,
        alert: {
          origin: alert.origin,
          destination: alert.destination,
          max_price: alert.max_price,
          cabin: alert.cabin,
        },
        deal: {
          headline: deal.headline || `${deal.origin} → ${deal.destination}`,
          price_eur: deal.price_eur,
          date_out: deal.date_out,
          date_ret: deal.date_ret,
          airline_name: deal.airline_name,
          booking_url: deal.booking_url,
          savings_pct: deal.savings_pct,
        },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[match-cron] notify-alert fail:", err);
    return false;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const expected = process.env.PRICE_ALERT_CRON_TOKEN || "";
  if (!expected) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  if (!constantTimeEq(token, expected)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [deals, alerts] = await Promise.all([fetchDeals(), listActiveAlerts()]);
  let matched = 0;
  let sent = 0;
  let skipped = 0;

  for (const alert of alerts) {
    // Mejor deal: el de menor precio que cumple
    const candidates = deals.filter((d) => dealMatches(d, alert));
    if (!candidates.length) {
      skipped += 1;
      continue;
    }
    const best = candidates.sort((a, b) => (a.price_eur ?? 0) - (b.price_eur ?? 0))[0];
    matched += 1;
    const ok = await sendNotify(alert, best);
    if (ok) {
      await markTriggered(alert.id);
      sent += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    deals_total: deals.length,
    alerts_active: alerts.length,
    matched,
    sent,
    skipped,
    resend_active: Boolean(process.env.RESEND_PROXY_TOKEN),
  });
}
