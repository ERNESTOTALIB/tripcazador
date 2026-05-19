/**
 * /api/premium/weekly-digest-cron — SSS316 (19 may 2026)
 *
 * Cron domingos 9:00 Madrid: para cada user Premium con al menos una
 * alerta activa o búsqueda guardada, calcula su digest semanal
 * (mismo flujo que /api/premium/weekly-digest) y envía email.
 *
 * GET ?token=PRICE_ALERT_CRON_TOKEN_PREMIUM
 * → 200 { users_eligible, sent, skipped }
 *
 * Cómo deduplicamos users:
 *  - Sacamos alertas tier="premium" + sus customerId+email
 *  - Sacamos saved_searches (cada una tiene customerId)
 *  - Map<customerId,email> con el email de la alerta cuando exista
 *  - Una saved_search sin alerta no podrá generar email (no tenemos
 *    email asociado). En ese caso skip y avisamos en logs.
 *
 * Por qué no listamos todos los customers en Stripe: complejidad +
 * coste API. Quien tiene alertas o saved searches activas es quien
 * VA A USAR el digest. El resto lo lee desde /panel/premium/digest.
 */

import { NextRequest, NextResponse } from "next/server";
import { listActiveAlertsByTier, listAlertsByCustomer } from "@/lib/price_alerts_store";
import { listSavedSearches } from "@/lib/saved_searches_store";
import { scoreDeal, type DealLite } from "@/lib/premium_digest_scorer";
import { buildDigestEmailHtml } from "@/lib/digest_email";

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

async function sendDigestEmail(
  to: string,
  customerId: string,
  topDeals: ReturnType<typeof scoreDeal>[],
  reasoning: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!apiKey) {
    console.log(`[weekly-digest-cron] dormido cust=${customerId} (RESEND_API_KEY no set)`);
    return false;
  }
  const html = buildDigestEmailHtml({
    topDeals,
    reasoning,
    digestWeek: new Date().toISOString().slice(0, 10),
    siteUrl: SITE_URL,
  });
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
        subject: `Tu digest Premium · top ${topDeals.length} deals esta semana`,
        html,
        tags: [
          { name: "category", value: "premium_digest" },
          { name: "customer", value: customerId.slice(0, 20) },
        ],
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[weekly-digest-cron] resend fail:", err);
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

  // 1. Recolectar Premium customers únicos via alertas Premium activas
  const premiumAlerts = await listActiveAlertsByTier("premium");
  const eligible = new Map<string, string>(); // customerId → email
  for (const a of premiumAlerts) {
    if (a.customerId && a.email && !eligible.has(a.customerId)) {
      eligible.set(a.customerId, a.email);
    }
  }

  const deals = await fetchDeals();

  let sent = 0;
  let skipped = 0;
  const usersEligible = eligible.size;

  for (const [customerId, email] of Array.from(eligible.entries())) {
    const [alerts, searches] = await Promise.all([
      listAlertsByCustomer(customerId),
      listSavedSearches(customerId),
    ]);
    const activeAlerts = alerts.filter((a) => a.active && !a.triggered_at);

    if (activeAlerts.length === 0 && searches.length === 0) {
      skipped += 1;
      continue;
    }

    const scored = deals
      .map((d) =>
        scoreDeal(
          d,
          activeAlerts.map((a) => ({
            origin: a.origin,
            destination: a.destination,
            max_price: a.max_price,
            cabin: a.cabin,
            origins: a.origins,
          })),
          searches,
        ),
      )
      .filter((d) => d.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5);

    if (scored.length === 0) {
      skipped += 1;
      continue;
    }

    const reasoning = `Personalizado en base a ${activeAlerts.length} alertas + ${searches.length} búsquedas guardadas`;
    const ok = await sendDigestEmail(email, customerId, scored, reasoning);
    if (ok) sent += 1;
    else skipped += 1;
  }

  return NextResponse.json({
    ok: true,
    users_eligible: usersEligible,
    deals_total: deals.length,
    sent,
    skipped,
    resend_active: Boolean(process.env.RESEND_API_KEY),
  });
}
