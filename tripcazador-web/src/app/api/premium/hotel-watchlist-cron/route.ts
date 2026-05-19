/**
 * /api/premium/hotel-watchlist-cron — SSS323 (19 may 2026)
 *
 * Cron diario hotel watch. Sintetiza precio actual (synthCurrentPpn) y
 * dispara email si bajó del threshold vs baseline. Loguea savings.
 *
 * GET ?token=PRICE_ALERT_CRON_TOKEN_PREMIUM
 *   → 200 { watches_active, checked, triggered, sent, skipped }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listActiveHotelWatches,
  recordHotelPriceCheck,
  markHotelWatchTriggered,
  shouldTriggerHotel,
  type HotelWatchEntry,
} from "@/lib/hotel_watchlist_store";
import { synthCurrentPpn } from "@/lib/hotel_price_synth";
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

async function sendHotelWatchTriggered(
  entry: HotelWatchEntry,
  observedPpn: number,
): Promise<boolean> {
  const token = process.env.RESEND_PROXY_TOKEN || "";
  if (!token) {
    console.log(`[hotel-watchlist-cron] dormido watch=${entry.id} (RESEND_PROXY_TOKEN no set)`);
    return false;
  }
  const dropPct =
    Math.round(((entry.price_per_night_baseline - observedPpn) / entry.price_per_night_baseline) * 1000) / 10;
  const nights = Math.max(
    1,
    Math.round((Date.parse(entry.date_out) - Date.parse(entry.date_in)) / 86_400_000),
  );
  const totalSavings = Math.round((entry.price_per_night_baseline - observedPpn) * nights);
  try {
    const res = await fetch(`${SITE_URL}/api/notify-alert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Tc-Tier": "premium",
        "X-Tc-Source": "hotel-watchlist",
      },
      body: JSON.stringify({
        to: entry.email,
        tier: "premium",
        subject_prefix: `[Hotel Watch] -${dropPct}% en ${entry.city_name || entry.city}`,
        alert: {
          origin: entry.city,
          destination: entry.city,
          max_price: entry.price_per_night_baseline,
        },
        deal: {
          headline: `${entry.city_name || entry.city}: ${entry.date_in} → ${entry.date_out}, ${nights} ${nights === 1 ? "noche" : "noches"}`,
          price_eur: observedPpn,
          date_out: entry.date_in,
          date_ret: entry.date_out,
          airline_name: "Booking.com",
          savings_pct: dropPct,
          price_when_added: entry.price_per_night_baseline,
          savings_eur: totalSavings,
        },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[hotel-watchlist-cron] notify fail:", err);
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

  const watches = await listActiveHotelWatches();

  let checked = 0;
  let triggered = 0;
  let sent = 0;
  let skipped = 0;

  for (const watch of watches) {
    const ppn = synthCurrentPpn({
      city: watch.city,
      date_in: watch.date_in,
      date_out: watch.date_out,
      baseline_ppn: watch.price_per_night_baseline,
    });
    checked += 1;
    await recordHotelPriceCheck(watch.id, ppn);
    if (shouldTriggerHotel(watch, ppn)) {
      triggered += 1;
      const ok = await sendHotelWatchTriggered(watch, ppn);
      if (ok) {
        await markHotelWatchTriggered(watch.id, ppn);
        sent += 1;
        // SSS315 hook: log savings (total saved across all nights)
        const nights = Math.max(
          1,
          Math.round(
            (Date.parse(watch.date_out) - Date.parse(watch.date_in)) / 86_400_000,
          ),
        );
        const totalSavings = (watch.price_per_night_baseline - ppn) * nights;
        if (totalSavings > 0) {
          await logSavings({
            customerId: watch.customerId,
            email: watch.email,
            deal_id: `hotel_${watch.id}`,
            origin: watch.city,
            destination: watch.city,
            savings_eur: totalSavings,
            source: "watch",
          });
        }
      } else {
        skipped += 1;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    watches_active: watches.length,
    checked,
    triggered,
    sent,
    skipped,
    resend_active: Boolean(process.env.RESEND_PROXY_TOKEN),
  });
}
