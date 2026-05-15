import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { aggregate24h } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RemoteAggregate {
  totals?: Record<string, number>;
  unique_visitors?: number;
  top_routes?: Array<{ route: string; count: number }>;
  top_airlines?: Array<{ airline: string; count: number }>;
  top_paths?: Array<{ path: string; count: number }>;
  top_calcs?: Array<{ calc: string; count: number }>;
  recent?: Array<{ ts: number; type: string; visitor_id: string; meta: Record<string, unknown> }>;
}

interface AnalyticsResponse {
  totals: {
    page_views_24h: number;
    deal_clicks_24h: number;
    searches_24h: number;
    booking_redirects_24h: number;
    unique_visitors_24h: number;
  };
  conversion: {
    click_through_rate: number;
    booking_rate: number;
    estimated_commission_eur: number;
  };
  top_routes: Array<{ route: string; clicks: number }>;
  top_airlines: Array<{ airline: string; clicks: number }>;
  top_paths: Array<{ path: string; views: number }>;
  top_calcs: Array<{ calc: string; uses: number }>;
  recent_events: Array<{ ts: string; type: string; meta: string }>;
  hunter: {
    last_run_at: string | null;
    last_run_status: string;
    deals_total: number;
    age_minutes: number;
  };
  source: "memory" | "remote" | "merged";
}

async function fetchRemote(): Promise<RemoteAggregate | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const adminToken = process.env.ADMIN_TOKEN || "";
  if (!baseUrl || !adminToken) return null;
  try {
    const res = await fetch(
      `${baseUrl}/api/admin/events/aggregate?token=${encodeURIComponent(adminToken)}&hours=24`,
      { cache: "no-store", signal: AbortSignal.timeout(3000) },
    );
    if (!res.ok) {
      // SSS206 (15 may 2026): antes silent — VPS down/auth desde SSS80
      // pero panel mostraba "memory" source sin diagnóstico. Log status
      // para detectar 5xx (VPS down) vs 401 (token wrong).
      console.error(`[admin/analytics] fetchRemote HTTP ${res.status}`);
      return null;
    }
    // SSS206: wrap json() en try/catch — si VPS devuelve HTML error page
    // crasheamos con SyntaxError opaco. Mejor return null + log.
    try {
      return (await res.json()) as RemoteAggregate;
    } catch (parseErr) {
      console.error(
        `[admin/analytics] fetchRemote JSON parse failed: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      );
      return null;
    }
  } catch (err) {
    // SSS206: distinguir timeout vs network vs aborted — útil para
    // detectar si VPS está down sistemáticamente vs latency spike.
    console.error(
      `[admin/analytics] fetchRemote error: ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}

async function fetchHealth() {
  let hunter = {
    last_run_at: null as string | null,
    last_run_status: "unknown",
    deals_total: 0,
    age_minutes: 0,
  };
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${baseUrl}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const h = await res.json();
      hunter = {
        last_run_at: h.timestamp || null,
        last_run_status: h.status || "unknown",
        deals_total: h.deals_total || 0,
        age_minutes: h.last_hunt_minutes_ago || 0,
      };
    }
  } catch {
    /* best effort */
  }
  return hunter;
}

export async function GET(_req: NextRequest): Promise<NextResponse<AnalyticsResponse | { error: string }>> {
  const session = verifyToken(cookies().get(COOKIE_KEY)?.value);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [memData, remote, hunter] = await Promise.all([
    Promise.resolve(aggregate24h()),
    fetchRemote(),
    fetchHealth(),
  ]);

  // Merge: priorizar remote (persistente) sobre memory (volátil cold-start).
  let source: AnalyticsResponse["source"] = "memory";
  let totals = {
    page_views_24h: memData.totals.page_views_24h,
    deal_clicks_24h: memData.totals.deal_clicks_24h,
    searches_24h: memData.totals.searches_24h,
    booking_redirects_24h: memData.totals.booking_redirects_24h,
    unique_visitors_24h: memData.totals.unique_visitors_24h,
  };
  let topRoutes = memData.top_routes;
  let topAirlines = memData.top_airlines;
  let topPaths: Array<{ path: string; views: number }> = [];
  let topCalcs: Array<{ calc: string; uses: number }> = [];
  let recentEvents: Array<{ ts: string; type: string; meta: string }> = memData.recent_events.map(
    (e) => ({ ts: e.ts, type: e.type as string, meta: e.meta }),
  );

  if (remote && remote.totals) {
    source = "remote";
    totals = {
      page_views_24h: remote.totals.page_views ?? totals.page_views_24h,
      deal_clicks_24h: remote.totals.deal_clicks ?? totals.deal_clicks_24h,
      searches_24h: remote.totals.searches ?? totals.searches_24h,
      booking_redirects_24h: remote.totals.booking_redirects ?? totals.booking_redirects_24h,
      unique_visitors_24h: remote.unique_visitors ?? totals.unique_visitors_24h,
    };
    if (remote.top_routes && remote.top_routes.length) {
      topRoutes = remote.top_routes.map((r) => ({ route: r.route, clicks: r.count }));
    }
    if (remote.top_airlines && remote.top_airlines.length) {
      topAirlines = remote.top_airlines.map((a) => ({ airline: a.airline, clicks: a.count }));
    }
    if (remote.top_paths) {
      topPaths = remote.top_paths.map((p) => ({ path: p.path, views: p.count }));
    }
    if (remote.top_calcs) {
      topCalcs = remote.top_calcs.map((c) => ({ calc: c.calc, uses: c.count }));
    }
    if (remote.recent && remote.recent.length) {
      recentEvents = remote.recent.slice(0, 50).map((e) => ({
        ts: new Date(e.ts).toISOString(),
        type: e.type,
        meta: JSON.stringify(e.meta || {}),
      }));
    }
    if (memData.totals.page_views_24h > 0 || memData.totals.deal_clicks_24h > 0) {
      source = "merged";
    }
  }

  // Conversion metrics
  const ctr =
    totals.page_views_24h > 0 ? totals.deal_clicks_24h / totals.page_views_24h : 0;
  const bookingRate =
    totals.deal_clicks_24h > 0
      ? totals.booking_redirects_24h / totals.deal_clicks_24h
      : 0;
  // Comisión estimada Travelpayouts: ~2% AOV €120 = €2.40 por booking_redirect
  const estimatedCommissionEur = totals.booking_redirects_24h * 2.4;

  return NextResponse.json({
    totals,
    conversion: {
      click_through_rate: Math.round(ctr * 10000) / 10000,
      booking_rate: Math.round(bookingRate * 10000) / 10000,
      estimated_commission_eur: Math.round(estimatedCommissionEur * 100) / 100,
    },
    top_routes: topRoutes,
    top_airlines: topAirlines,
    top_paths: topPaths,
    top_calcs: topCalcs,
    recent_events: recentEvents,
    hunter,
    source,
  });
}
