/**
 * /api/premium/weekly-digest — SSS304 / fix SSS312 (19 may 2026)
 *
 * Premium-only personalized weekly digest: top 5 deals que matchean
 * las búsquedas guardadas del customer + sus alertas activas.
 *
 * GET ?customer_id=cus_xxx → 200 { digest_week, top_deals[], reasoning }
 *
 * SSS312 FIX: scoreDeal() movido a `lib/premium_digest_scorer.ts`
 * porque Next.js no permite exports custom desde route.ts (solo HTTP
 * methods + runtime/dynamic). Tener `export function scoreDeal` aquí
 * rompía el build de Vercel silenciosamente — workflow reportaba success
 * pero el deployment final servía el último build válido sin pages
 * SSS301-310.
 */

import { NextRequest, NextResponse } from "next/server";
import { isValidStripeOwnerId } from "@/lib/stripe_id";
import { listAlertsByCustomer } from "@/lib/price_alerts_store";
import { listSavedSearches } from "@/lib/saved_searches_store";
import { scoreDeal, type DealLite } from "@/lib/premium_digest_scorer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = "https://tripcazador.com";

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

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id") || "";
  if (!isValidStripeOwnerId(customerId)) {
    return NextResponse.json({ ok: false, error: "customer_id_invalid" }, { status: 400 });
  }

  const [alerts, searches, deals] = await Promise.all([
    listAlertsByCustomer(customerId),
    listSavedSearches(customerId),
    fetchDeals(),
  ]);

  const activeAlerts = alerts.filter((a) => a.active && !a.triggered_at);

  if (!deals.length) {
    return NextResponse.json({
      ok: true,
      digest_week: new Date().toISOString().slice(0, 10),
      top_deals: [],
      reasoning: "Sin deals disponibles en este momento",
    });
  }

  if (activeAlerts.length === 0 && searches.length === 0) {
    const top5 = deals
      .filter((d) => d.price_eur && d.price_eur > 0)
      .sort((a, b) => (b.savings_pct ?? 0) - (a.savings_pct ?? 0))
      .slice(0, 5)
      .map((d) => ({
        ...d,
        match_score: 0,
        why_matched: ["mejor descuento esta semana"],
      }));
    return NextResponse.json({
      ok: true,
      digest_week: new Date().toISOString().slice(0, 10),
      top_deals: top5,
      reasoning:
        "Aún no tienes alertas ni búsquedas guardadas — mostramos los chollos con más descuento. " +
        "Crea alertas para que esta lista se personalice automáticamente.",
    });
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

  return NextResponse.json({
    ok: true,
    digest_week: new Date().toISOString().slice(0, 10),
    top_deals: scored,
    reasoning: `Personalizado en base a ${activeAlerts.length} alertas activas + ${searches.length} búsquedas guardadas`,
  });
}
