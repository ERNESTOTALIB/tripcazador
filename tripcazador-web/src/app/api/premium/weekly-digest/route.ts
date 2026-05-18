/**
 * /api/premium/weekly-digest — SSS304 (18 may 2026)
 *
 * Premium-only personalized weekly digest: top 5 deals que matchean
 * las búsquedas guardadas del customer + sus alertas activas.
 *
 * GET ?customer_id=cus_xxx → 200 { digest_week, top_deals[], reasoning }
 *
 * Lógica:
 *  1. Lee búsquedas guardadas del customer (saved_searches_store).
 *  2. Lee alertas activas (price_alerts_store).
 *  3. Fetch /api/deals.
 *  4. Por cada deal calcula match_score:
 *     - +5 si está en max_price de alguna alerta activa
 *     - +3 si origin/destination matchea alguna saved_search
 *     - +1 si cabin coincide con alguna saved_search business/first
 *  5. Devuelve top 5 deals por score, con `why_matched` explicación.
 *
 * Esto es la "vista personalizada" de Premium: free ve los mismos deals
 * que todo el mundo, Premium ve "tus deals" basados en preferencias.
 *
 * Cache: no cache (resultado depende del store del user).
 */

import { NextRequest, NextResponse } from "next/server";
import { isValidStripeOwnerId } from "@/lib/stripe_id";
import { listAlertsByCustomer } from "@/lib/price_alerts_store";
import { listSavedSearches } from "@/lib/saved_searches_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = "https://tripcazador.com";

interface DealLite {
  id?: string;
  origin?: string;
  destination?: string;
  city_from?: string;
  city_to?: string;
  price_eur?: number;
  cabin?: string;
  airline?: string;
  date_out?: string;
  date_ret?: string;
  savings_pct?: number;
  booking_url?: string;
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

export interface PersonalizedDeal extends DealLite {
  match_score: number;
  why_matched: string[];
}

export function scoreDeal(
  deal: DealLite,
  alerts: Array<{ origin?: string; destination?: string; max_price: number; cabin?: string; origins?: string[] }>,
  searches: Array<{ origin?: string; destination?: string; airlines: string[]; cabin: string; max_price?: number }>,
): PersonalizedDeal {
  let score = 0;
  const reasons: string[] = [];

  // Alerts match: precio bajo cap + ruta
  for (const a of alerts) {
    if (deal.price_eur && deal.price_eur <= a.max_price) {
      const originsMatch =
        a.origins && a.origins.length > 0
          ? Boolean(deal.origin && a.origins.includes(deal.origin))
          : !a.origin || deal.origin === a.origin;
      const destMatch = !a.destination || deal.destination === a.destination;
      const cabinMatch = !a.cabin || deal.cabin === a.cabin;
      if (originsMatch && destMatch && cabinMatch) {
        score += 5;
        reasons.push(`matchea tu alerta ≤${a.max_price}€`);
        break; // 1 alerta basta para puntuar
      }
    }
  }

  // Saved searches match: ruta + cabin + airline
  for (const s of searches) {
    let hit = false;
    if (s.origin && deal.origin === s.origin) { score += 3; reasons.push(`origen ${s.origin}`); hit = true; }
    if (s.destination && deal.destination === s.destination) { score += 3; reasons.push(`destino ${s.destination}`); hit = true; }
    if (s.airlines.length && deal.airline && s.airlines.includes(deal.airline)) { score += 2; reasons.push(`aerolínea ${deal.airline}`); hit = true; }
    if (s.cabin !== "any" && deal.cabin === s.cabin) { score += 1; reasons.push(`clase ${s.cabin}`); hit = true; }
    if (typeof s.max_price === "number" && deal.price_eur && deal.price_eur <= s.max_price) {
      score += 2; reasons.push(`≤${s.max_price}€ guardado`); hit = true;
    }
    if (hit) break;
  }

  return {
    ...deal,
    match_score: score,
    why_matched: reasons,
  };
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

  // Si el user no tiene alertas ni searches, devuelve top 5 por savings
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
