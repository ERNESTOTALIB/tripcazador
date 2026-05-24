/**
 * /api/premium/watchlist-cron — SSS314 (19 may 2026)
 *
 * Cron diario que recorre las entries activas de la watchlist Premium,
 * consulta el precio actual para cada (origin,destination) en
 * /api/deals, y dispara email + marca triggered si el precio bajó
 * >= target_drop_pct vs price_when_added.
 *
 * GET ?token=PRICE_ALERT_CRON_TOKEN_PREMIUM (reusamos token de Premium
 * cron — mismo trust boundary).
 * → 200 { checked, triggered, sent, skipped }
 *
 * GitHub workflow drives this:
 *   schedule: '15 8 * * *' (diario 8:15 UTC = 10:15 Madrid)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listActiveWatches,
  recordPriceCheck,
  markWatchTriggered,
  shouldTrigger,
  type WatchlistEntry,
} from "@/lib/watchlist_store";
import { pickCurrentPrice, type DealLite } from "@/lib/watchlist_observation";
import { verifyCronToken } from "@/lib/cron_auth";
import { logSavings } from "@/lib/savings_log_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = "https://tripcazador.com";

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let m = 0;
  for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}

async function fetchAllDeals(): Promise<DealLite[]> {
  try {
    const res = await fetch(`${SITE_URL}/api/deals?limit=500`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.deals)) return data.deals;
  } catch {
    /* no-op */
  }
  return [];
}

async function sendWatchTriggered(
  entry: WatchlistEntry,
  observedPrice: number,
  deal: DealLite,
): Promise<boolean> {
  const token = process.env.RESEND_PROXY_TOKEN || "";
  if (!token) {
    console.log(`[watchlist-cron] dormido watch=${entry.id} (RESEND_PROXY_TOKEN no set)`);
    return false;
  }
  const dropPct =
    Math.round(
      ((entry.price_when_added - observedPrice) / entry.price_when_added) * 1000,
    ) / 10;
  const savingsEur = Math.round(entry.price_when_added - observedPrice);
  try {
    const res = await fetch(`${SITE_URL}/api/notify-alert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Tc-Tier": "premium",
        "X-Tc-Source": "watchlist",
      },
      body: JSON.stringify({
        to: entry.email,
        tier: "premium",
        subject_prefix: `[Watch] -${dropPct}% en tu vuelo`,
        alert: {
          origin: entry.origin,
          destination: entry.destination,
          max_price: entry.price_when_added,
        },
        deal: {
          headline:
            entry.headline ||
            deal.headline ||
            `${entry.origin} → ${entry.destination}`,
          price_eur: observedPrice,
          date_out: entry.date_out || deal.date_out,
          date_ret: entry.date_ret || deal.date_ret,
          airline_name: entry.airline_name || deal.airline_name,
          booking_url: deal.booking_url,
          savings_pct: dropPct,
          // Datos extra Watch
          price_when_added: entry.price_when_added,
          savings_eur: savingsEur,
        },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[watchlist-cron] notify fail:", err);
    return false;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get("token") || "";
  // AUDIT-FULL-3: token específico CRON_TOKEN_WATCHLIST preferido
  if (!verifyCronToken("watchlist", token)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [watches, deals] = await Promise.all([listActiveWatches(), fetchAllDeals()]);

  let checked = 0;
  let triggered = 0;
  let sent = 0;
  let skipped = 0;

  for (const watch of watches) {
    const observation = pickCurrentPrice(watch, deals);
    if (!observation) {
      skipped += 1;
      continue;
    }
    checked += 1;
    await recordPriceCheck(watch.id, observation.price);
    if (shouldTrigger(watch, observation.price)) {
      triggered += 1;
      const ok = await sendWatchTriggered(watch, observation.price, observation.deal);
      if (ok) {
        await markWatchTriggered(watch.id, observation.price);
        sent += 1;
        // SSS315: savings = price_when_added - observed (siempre > 0
        // porque shouldTrigger ya verificó drop >= threshold)
        const savings = watch.price_when_added - observation.price;
        if (savings > 0) {
          await logSavings({
            customerId: watch.customerId,
            email: watch.email,
            deal_id: watch.deal_id,
            origin: watch.origin,
            destination: watch.destination,
            savings_eur: savings,
            source: "watch",
          });
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    watches_active: watches.length,
    deals_total: deals.length,
    checked,
    triggered,
    sent,
    skipped,
    resend_active: Boolean(process.env.RESEND_PROXY_TOKEN),
  });
}
