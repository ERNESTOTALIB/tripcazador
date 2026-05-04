import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { aggregate24h } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/funnel — fase SSS43 (May 2026)
 *
 * Endpoint admin que devuelve el conversion funnel completo:
 *   1. Visitor lands           → page_view
 *   2. Engagement               → scroll OR favorito OR share
 *   3. Deal click               → deal_click
 *   4. Outbound to airline      → booking_url_opened
 *   5. (Estimación) reserva     → no medible directamente, asumimos 5-10%
 *      del paso 4 según industry standard travel affiliate
 *
 * Devuelve cada paso con count + drop-off vs anterior + comisión estimada.
 *
 * Auth: cookie panel (HMAC HttpOnly).
 */

interface FunnelStep {
  step: string;
  label: string;
  count: number;
  drop_pct_from_prev: number | null;
  conversion_pct_from_top: number | null;
}

export async function GET(_req: NextRequest) {
  // Auth check
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_KEY)?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Tomamos events de últimas 24h del event_store local
  // SSS56e: usamos by_type (Record<string, number>) que cuenta TODOS los
  // event types dinámicamente, no solo los hardcodeados en `totals`.
  const agg = aggregate24h();
  const byType = agg.by_type || {};

  // Stages — ordenados de top de funnel a bottom
  const pageViews = byType.page_view || 0;
  const engagement =
    (byType.favorite_added || 0) +
    (byType.share || 0) +
    (byType.scroll_75 || 0);
  const dealClicks = byType.deal_click || 0;
  // booking_url_opened es el nombre legacy; booking_redirect es el actual
  const bookingRedirects = (byType.booking_url_opened || 0) + (byType.booking_redirect || 0);

  // Booking confirmation — 7% rate medio industria travel affiliate
  const estimatedBookings = Math.round(bookingRedirects * 0.07);

  // Comisión media €4.5 por reserva (Booking 4-6%, Skyscanner 1-3%)
  const estimatedCommissionEur = Math.round(estimatedBookings * 4.5);

  const steps: FunnelStep[] = [
    {
      step: "1_visit",
      label: "Visita la web",
      count: pageViews,
      drop_pct_from_prev: null,
      conversion_pct_from_top: 100,
    },
    {
      step: "2_engagement",
      label: "Interactúa (fav/share/scroll 75%)",
      count: engagement,
      drop_pct_from_prev: pageViews > 0 ? Math.round((1 - engagement / pageViews) * 100) : null,
      conversion_pct_from_top:
        pageViews > 0 ? Math.round((engagement / pageViews) * 100) : null,
    },
    {
      step: "3_deal_click",
      label: "Click en chollo",
      count: dealClicks,
      drop_pct_from_prev:
        engagement > 0 ? Math.round((1 - dealClicks / engagement) * 100) : null,
      conversion_pct_from_top:
        pageViews > 0 ? Math.round((dealClicks / pageViews) * 100) : null,
    },
    {
      step: "4_outbound",
      label: "Sale a aerolínea (booking URL)",
      count: bookingRedirects,
      drop_pct_from_prev:
        dealClicks > 0
          ? Math.round((1 - bookingRedirects / dealClicks) * 100)
          : null,
      conversion_pct_from_top:
        pageViews > 0
          ? Math.round((bookingRedirects / pageViews) * 100)
          : null,
    },
    {
      step: "5_booking_estimated",
      label: "Reserva estimada (7% industry)",
      count: estimatedBookings,
      drop_pct_from_prev: 93,
      conversion_pct_from_top:
        pageViews > 0
          ? Math.round((estimatedBookings / pageViews) * 1000) / 10
          : null,
    },
  ];

  // Identificar el paso con mayor drop-off (oportunidad de mejora)
  const worstDrop = steps
    .filter((s) => s.drop_pct_from_prev !== null && s.drop_pct_from_prev > 0)
    .sort((a, b) => (b.drop_pct_from_prev || 0) - (a.drop_pct_from_prev || 0))[0];

  return NextResponse.json({
    period: "24h",
    generated_at: new Date().toISOString(),
    funnel: steps,
    insights: {
      worst_drop_off: worstDrop
        ? {
            step: worstDrop.step,
            label: worstDrop.label,
            drop_pct: worstDrop.drop_pct_from_prev,
            recommendation:
              worstDrop.step === "2_engagement"
                ? "Mejorar hook de homepage / featured deals más atractivos"
                : worstDrop.step === "3_deal_click"
                ? "DealCard CTA más prominente / precio más visible"
                : worstDrop.step === "4_outbound"
                ? "Evitar fricción intermedia / botón directo a aerolínea"
                : "Optimizar conversión booking partner",
          }
        : null,
      estimated_commission_eur: estimatedCommissionEur,
      revenue_per_visitor_eur:
        pageViews > 0
          ? Math.round((estimatedCommissionEur / pageViews) * 100) / 100
          : 0,
    },
    notes: [
      "Stage 5 es estimación (7% industry standard travel affiliate post-redirect).",
      "engagement = favorite_added + share + scroll_75 events del event_store.",
      "Para conversion real, integrar Travelpayouts conversion API (postback).",
    ],
  });
}
