import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { aggregate24h, getRecentEvents } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/funnel-v2 — fase SSS61 (May 2026)
 *
 * Funnel completo + comparativa vs período anterior + top deals por
 * revenue estimado (no solo clicks).
 *
 * Stages del funnel:
 *   1. landing       (landing_arrived O page_view)
 *   2. engagement    (scroll_75 + favorite_added + share_completed)
 *   3. result_view   (result_viewed — deal en viewport)
 *   4. deal_click    (click en card)
 *   5. booking_out   (booking_redirect — abre partner)
 *   6. premium_int   (premium_cta_view — interés premium detectado)
 *   7. premium_click (premium_cta_click + concierge_click_pay)
 *
 * Auth: cookie panel HMAC.
 */

const COMMISSION_RATE_BY_AIRLINE: Record<string, number> = {
  ryanair: 0.012,
  vueling: 0.015,
  iberia: 0.022,
  air_europa: 0.025,
  tap: 0.028,
  lufthansa: 0.025,
  default: 0.018,
};

interface FunnelStep {
  step: string;
  label: string;
  count: number;
  prev_count: number;
  delta_pct: number | null;
  drop_pct: number | null;
  conv_pct: number | null;
}

function buildFunnel(byType: Record<string, number>, prevByType: Record<string, number>): FunnelStep[] {
  const landing = (byType.landing_arrived ?? 0) + (byType.page_view ?? 0);
  const engagement = (byType.scroll_75 ?? 0) + (byType.favorite_added ?? 0) + (byType.share_completed ?? 0);
  const resultView = byType.result_viewed ?? 0;
  const dealClick = byType.deal_click ?? 0;
  const bookingOut = (byType.booking_redirect ?? 0) + (byType.booking_url_opened ?? 0);
  const premInt = byType.premium_cta_view ?? 0;
  const premClick = (byType.premium_cta_click ?? 0) + (byType.concierge_click_pay ?? 0);

  const prevLanding = (prevByType.landing_arrived ?? 0) + (prevByType.page_view ?? 0);
  const prevEng = (prevByType.scroll_75 ?? 0) + (prevByType.favorite_added ?? 0);
  const prevResult = prevByType.result_viewed ?? 0;
  const prevClick = prevByType.deal_click ?? 0;
  const prevBooking = (prevByType.booking_redirect ?? 0) + (prevByType.booking_url_opened ?? 0);
  const prevPremInt = prevByType.premium_cta_view ?? 0;
  const prevPremClick = (prevByType.premium_cta_click ?? 0) + (prevByType.concierge_click_pay ?? 0);

  const stages: Array<{ step: string; label: string; count: number; prev: number }> = [
    { step: "1_landing", label: "Llega a la web", count: landing, prev: prevLanding },
    { step: "2_engagement", label: "Interactúa (scroll/fav/share)", count: engagement, prev: prevEng },
    { step: "3_result_view", label: "Ve un deal", count: resultView, prev: prevResult },
    { step: "4_deal_click", label: "Click en deal", count: dealClick, prev: prevClick },
    { step: "5_booking_out", label: "Sale a partner", count: bookingOut, prev: prevBooking },
    { step: "6_premium_interest", label: "Ve banner Premium", count: premInt, prev: prevPremInt },
    { step: "7_premium_click", label: "Click CTA Premium", count: premClick, prev: prevPremClick },
  ];

  return stages.map((s, i, arr) => {
    const top = arr[0].count;
    const prev = arr[i - 1]?.count ?? top;
    const deltaPct = s.prev > 0 ? ((s.count - s.prev) / s.prev) * 100 : null;
    const dropPct = i > 0 && prev > 0 ? ((prev - s.count) / prev) * 100 : null;
    const convPct = top > 0 ? (s.count / top) * 100 : null;
    return {
      step: s.step,
      label: s.label,
      count: s.count,
      prev_count: s.prev,
      delta_pct: deltaPct === null ? null : Math.round(deltaPct * 10) / 10,
      drop_pct: dropPct === null ? null : Math.round(dropPct * 10) / 10,
      conv_pct: convPct === null ? null : Math.round(convPct * 10) / 10,
    };
  });
}

function eventsByTypeWindow(windowMs: number, offsetMs: number = 0): Record<string, number> {
  const now = Date.now();
  const start = now - windowMs - offsetMs;
  const end = now - offsetMs;
  const events = getRecentEvents().filter((e) => e.ts >= start && e.ts <= end);
  const byType: Record<string, number> = {};
  for (const e of events) byType[e.type] = (byType[e.type] || 0) + 1;
  return byType;
}

interface DealRevenueRow {
  route: string;
  airline: string;
  clicks: number;
  estimated_redirects: number;
  estimated_revenue_eur: number;
}

function topDealsByRevenue(): DealRevenueRow[] {
  const events = getRecentEvents();
  const byKey = new Map<
    string,
    { route: string; airline: string; clicks: number; redirects: number }
  >();
  for (const e of events) {
    // booking_url_opened es legacy pre-rename; cast string para evitar enum strict
    if (e.type !== "deal_click" && e.type !== "booking_redirect" && (e.type as string) !== "booking_url_opened") {
      continue;
    }
    const route = `${e.meta.origin || "?"}→${e.meta.destination || "?"}`;
    const airline = String(e.meta.airline_name || e.meta.airline || "?").toLowerCase().replace(/\s+/g, "_");
    const key = `${route}|${airline}`;
    const cur = byKey.get(key) ?? { route, airline, clicks: 0, redirects: 0 };
    if (e.type === "deal_click") cur.clicks++;
    else cur.redirects++;
    byKey.set(key, cur);
  }
  return Array.from(byKey.values())
    .map((r) => {
      const rate = COMMISSION_RATE_BY_AIRLINE[r.airline] ?? COMMISSION_RATE_BY_AIRLINE.default;
      // 5% redirects → booking real, AOV 120€
      const estRevenue = r.redirects * 0.05 * 120 * rate;
      return {
        route: r.route,
        airline: r.airline,
        clicks: r.clicks,
        estimated_redirects: r.redirects,
        estimated_revenue_eur: Math.round(estRevenue * 100) / 100,
      };
    })
    .sort((a, b) => b.estimated_revenue_eur - a.estimated_revenue_eur)
    .slice(0, 15);
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_KEY)?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const window = sp.get("window") || "24h";
  const windowMs =
    window === "7d" ? 7 * 24 * 3600 * 1000 :
    window === "30d" ? 30 * 24 * 3600 * 1000 :
    24 * 3600 * 1000;

  const cur = eventsByTypeWindow(windowMs, 0);
  const prev = eventsByTypeWindow(windowMs, windowMs);
  const funnel = buildFunnel(cur, prev);
  const topDeals = topDealsByRevenue();

  // Estimación revenue total ventana
  const totalEstRevenue = topDeals.reduce((acc, d) => acc + d.estimated_revenue_eur, 0);

  // KPIs comparativos (cur vs prev)
  const agg = aggregate24h();
  const kpiCompare = {
    visitors: { cur: agg.totals.unique_visitors_24h, prev_window: window },
    page_views: {
      cur: cur.page_view ?? 0,
      prev: prev.page_view ?? 0,
      delta_pct: prev.page_view ? Math.round(((cur.page_view ?? 0) - prev.page_view) / prev.page_view * 1000) / 10 : null,
    },
    deal_clicks: {
      cur: cur.deal_click ?? 0,
      prev: prev.deal_click ?? 0,
      delta_pct: prev.deal_click ? Math.round(((cur.deal_click ?? 0) - prev.deal_click) / prev.deal_click * 1000) / 10 : null,
    },
    bookings_out: {
      cur: (cur.booking_redirect ?? 0) + (cur.booking_url_opened ?? 0),
      prev: (prev.booking_redirect ?? 0) + (prev.booking_url_opened ?? 0),
    },
  };

  return NextResponse.json({
    window,
    funnel,
    top_deals_by_revenue: topDeals,
    estimated_revenue_window_eur: Math.round(totalEstRevenue * 100) / 100,
    kpis_vs_prev: kpiCompare,
    by_type_current: cur,
    by_type_prev_window: prev,
    generated_at: new Date().toISOString(),
  });
}
