/**
 * /api/price-alerts/match-cron-premium — SSS302 (18 may 2026)
 *
 * Cron Premium-only. Runs every 5 min (vs hourly cron gratis en
 * `match-cron`). Procesa SOLO alerts con tier="premium". Email Resend
 * con subject prefijado "[Premium]" → mejor inbox + audit trail.
 *
 * GET ?token=PRICE_ALERT_CRON_TOKEN_PREMIUM
 * → 200 { matched, sent, skipped, tier:"premium" }
 *
 * IMPORTANT: usa el MISMO RESEND_PROXY_TOKEN que el cron gratis para
 * no duplicar secret. Se diferencia con el subject + meta `tier`
 * en el payload notify para que el template pueda renderizar más
 * elegantemente al Premium ("respondemos < 24h", "tu vuelo prioritario").
 *
 * GitHub workflow drives this:
 *   schedule: '*\/5 * * * *' (cada 5 minutos)
 *   curl -sS https://tripcazador.com/api/price-alerts/match-cron-premium?token=$PRICE_ALERT_CRON_TOKEN_PREMIUM
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listActiveAlertsByTier,
  markTriggered,
  type PriceAlert,
} from "@/lib/price_alerts_store";
import { dealMatchesAlert, type DealForAlertMatch } from "@/lib/deal_alert_matcher";
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

// Local alias para retro-compat con el resto del archivo
type DealLite = DealForAlertMatch;

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

async function sendPremiumNotify(alert: PriceAlert, deal: DealLite): Promise<boolean> {
  const token = process.env.RESEND_PROXY_TOKEN || "";
  if (!token) {
    console.log(`[match-cron-premium] dormido alert=${alert.id} (RESEND_PROXY_TOKEN no set)`);
    return false;
  }
  try {
    const res = await fetch(`${SITE_URL}/api/notify-alert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Tc-Tier": "premium",
      },
      body: JSON.stringify({
        to: alert.email,
        tier: "premium",
        subject_prefix: "[Premium]",
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
    console.error("[match-cron-premium] notify-alert fail:", err);
    return false;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  // AUDIT-FULL-3: token específico CRON_TOKEN_MATCH_PREMIUM preferido,
  // fallback al PRICE_ALERT_CRON_TOKEN_PREMIUM compartido.
  if (!verifyCronToken("match-premium", token)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [deals, alerts] = await Promise.all([
    fetchDeals(),
    listActiveAlertsByTier("premium"),
  ]);

  let matched = 0;
  let sent = 0;
  let skipped = 0;

  for (const alert of alerts) {
    const candidates = deals.filter((d) => dealMatchesAlert(d, alert));
    if (!candidates.length) {
      skipped += 1;
      continue;
    }
    const best = candidates.sort((a, b) => (a.price_eur ?? 0) - (b.price_eur ?? 0))[0];
    matched += 1;
    const ok = await sendPremiumNotify(alert, best);
    if (ok) {
      await markTriggered(alert.id);
      sent += 1;
      // SSS315: registrar savings = max_price - price (cap a >=0). El user
      // se ahorró respecto a su techo declarado, que es la mejor proxy de
      // valor que tenemos sin tener su precio histórico personal.
      if (alert.customerId && best.price_eur !== undefined) {
        const savings = Math.max(0, alert.max_price - best.price_eur);
        if (savings > 0) {
          await logSavings({
            customerId: alert.customerId,
            email: alert.email,
            deal_id: best.id ?? `${best.origin}-${best.destination}`,
            origin: best.origin,
            destination: best.destination,
            savings_eur: savings,
            source: "alert",
          });
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    tier: "premium",
    deals_total: deals.length,
    alerts_active: alerts.length,
    matched,
    sent,
    skipped,
    resend_active: Boolean(process.env.RESEND_PROXY_TOKEN),
  });
}
