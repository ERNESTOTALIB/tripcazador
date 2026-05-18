/**
 * /api/premium/stats — SSS303 (18 may 2026)
 *
 * Stats agregadas para mostrar el ROI del Premium al suscriptor:
 *  - Cuántas alertas activas + total creadas
 *  - Cuántas se dispararon (matched + sent)
 *  - Savings estimadas (suma de max_price - price_eur de las matched)
 *  - Búsquedas guardadas count
 *  - "Concierge promo" — 1 consulta gratis/mes (true si no usada este mes)
 *
 * GET ?customer_id=cs_xxx → 200 con stats
 *
 * El cálculo es approximation porque no persistimos los deals reales
 * matched (solo marcamos `triggered_at`). Para savings reales habría
 * que cross-reference event_store + deals snapshot — TODO futuro.
 */

import { NextRequest, NextResponse } from "next/server";
import { listAlertsByCustomer } from "@/lib/price_alerts_store";
import { listSavedSearches } from "@/lib/saved_searches_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUSTOMER_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{8,}$/;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id") || "";
  if (!CUSTOMER_ID_RE.test(customerId)) {
    return NextResponse.json({ ok: false, error: "customer_id_invalid" }, { status: 400 });
  }

  const [alerts, searches] = await Promise.all([
    listAlertsByCustomer(customerId),
    listSavedSearches(customerId),
  ]);

  const alertsActive = alerts.filter((a) => a.active && !a.triggered_at).length;
  const alertsTriggered = alerts.filter((a) => a.triggered_at).length;
  const alertsTotal = alerts.length;

  // Savings approx: solo tenemos max_price en la alert + triggered_at.
  // Heurística: si triggered, estimamos savings = max_price * 15% (asumimos
  // que el deal matched estaba ~15% bajo el cap). Mejorable cuando
  // persistamos el deal real.
  const estimatedSavingsEur = alerts
    .filter((a) => a.triggered_at)
    .reduce((sum, a) => sum + Math.round(a.max_price * 0.15), 0);

  // Concierge promo: 1 consulta gratis/mes para Premium. TODO real:
  // cruzar con concierge_store por customerId del mes actual. Mock por
  // ahora: siempre disponible (futuro: persistir uso).
  const conciergePromoMonth = new Date().toISOString().slice(0, 7);

  return NextResponse.json({
    ok: true,
    customer_id: customerId,
    alerts: {
      active: alertsActive,
      triggered: alertsTriggered,
      total: alertsTotal,
    },
    saved_searches: {
      count: searches.length,
    },
    savings: {
      estimated_eur: estimatedSavingsEur,
      method: "approx_15pct_of_max_price",
    },
    concierge_promo: {
      available: true,
      month: conciergePromoMonth,
      description: "1 consulta concierge gratis cada mes",
    },
  });
}
