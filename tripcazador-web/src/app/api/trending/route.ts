/**
 * /api/trending — fase fff F3 (Apr 2026)
 *
 * Endpoint público que expone TOP rutas/destinos por número de clicks en las
 * últimas 24h. Datos agregados sin PII (solo ruta y conteo).
 *
 * Diferente de /api/admin/analytics:
 *  - Público (sin token)
 *  - Solo TOP 5 rutas + TOP 5 destinos
 *  - Sin métricas internas (visitors, conversion, hunter, recent_events)
 *  - Cache 5 min (s-maxage=300) para descongestionar el backend
 *
 * Uso: <TrendingNowWidget /> en home + posibles widgets en dashboard.
 */
import { NextResponse } from "next/server";
import { aggregate24h } from "@/lib/event_store";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RemoteAggregate {
  top_routes?: Array<{ route: string; count: number }>;
  top_paths?: Array<{ path: string; count: number }>;
}

interface TrendingResponse {
  top_routes: Array<{ route: string; clicks: number }>;
  top_destinations: Array<{ destination: string; clicks: number }>;
  generated_at: string;
  source: "memory" | "remote" | "fallback";
}

const FALLBACK_ROUTES = [
  { route: "MAD-BKK", clicks: 24 },
  { route: "BCN-NRT", clicks: 19 },
  { route: "MAD-NYC", clicks: 17 },
  { route: "BCN-DPS", clicks: 14 },
  { route: "MAD-MIA", clicks: 12 },
];
const FALLBACK_DESTINATIONS = [
  { destination: "BKK", clicks: 28 },
  { destination: "NRT", clicks: 21 },
  { destination: "JFK", clicks: 19 },
  { destination: "DPS", clicks: 16 },
  { destination: "MIA", clicks: 14 },
];

async function fetchRemote(): Promise<RemoteAggregate | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const adminToken = process.env.ADMIN_TOKEN || "";
  if (!baseUrl || !adminToken) return null;
  try {
    const res = await fetch(
      `${baseUrl}/api/admin/events/aggregate?token=${encodeURIComponent(adminToken)}&hours=24`,
      { cache: "no-store", signal: AbortSignal.timeout(2500) },
    );
    if (!res.ok) return null;
    return (await res.json()) as RemoteAggregate;
  } catch {
    return null;
  }
}

export async function GET() {
  const remote = await fetchRemote();

  let topRoutes: Array<{ route: string; clicks: number }> = [];
  let topDestinations: Array<{ destination: string; clicks: number }> = [];
  let source: TrendingResponse["source"] = "fallback";

  if (remote && remote.top_routes && remote.top_routes.length > 0) {
    topRoutes = remote.top_routes
      .slice(0, 5)
      .map((r) => ({ route: r.route, clicks: r.count }));
    // Derivar destinos únicos del top routes (segunda mitad de cada ruta)
    const destMap = new Map<string, number>();
    for (const r of remote.top_routes) {
      const parts = r.route.split("-");
      if (parts.length === 2) {
        const dest = parts[1];
        destMap.set(dest, (destMap.get(dest) || 0) + r.count);
      }
    }
    topDestinations = Array.from(destMap.entries())
      .map(([destination, clicks]) => ({ destination, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);
    source = "remote";
  } else {
    // Memory fallback: usar agregado in-memory del propio runtime
    try {
      const memAgg = aggregate24h();
      // event_store devuelve {route, clicks}; remoto devuelve {route, count}.
      // Aquí (memoria) la prop es `clicks` directamente.
      const memRoutes = (memAgg.top_routes || []).slice(0, 5);
      if (memRoutes.length > 0) {
        topRoutes = memRoutes.map((r) => ({ route: r.route, clicks: r.clicks }));
        source = "memory";
      }
    } catch {
      /* event_store no disponible */
    }
  }

  // SSS21: si no hay datos de clicks, derivar trending de deals reales
  // (en vez de fallback estático que siempre mostraba MAD/BCN). Lee el
  // deals-latest.json del worker y muestra las 5 rutas con mayor score.
  if (topRoutes.length < 3) {
    try {
      const dealsPath = path.join(process.cwd(), "public", "deals-latest.json");
      const raw = await fs.readFile(dealsPath, "utf-8");
      const data = JSON.parse(raw);
      const deals: Array<{ origin?: string; destination?: string; score?: number }> =
        Array.isArray(data) ? data : data.deals || [];
      // Score-weighted route ranking — para que veamos diversidad de orígenes
      const routeMap = new Map<string, number>();
      for (const d of deals) {
        if (!d.origin || !d.destination) continue;
        const route = `${d.origin}-${d.destination}`;
        routeMap.set(route, Math.max(routeMap.get(route) || 0, d.score || 50));
      }
      const sortedRoutes = Array.from(routeMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      if (sortedRoutes.length >= 3) {
        topRoutes = sortedRoutes.map(([route, score]) => ({
          route,
          clicks: Math.round(score * 0.6), // proxy "interest" basado en score
        }));
        const destMap = new Map<string, number>();
        for (const [route, score] of sortedRoutes) {
          const dest = route.split("-")[1];
          if (dest) destMap.set(dest, Math.max(destMap.get(dest) || 0, score));
        }
        topDestinations = Array.from(destMap.entries())
          .map(([destination, score]) => ({ destination, clicks: Math.round(score * 0.6) }))
          .slice(0, 5);
        source = "fallback"; // marca que viene de deals, no de clicks reales
      }
    } catch {
      // Si ni deals.json existe, último recurso: fallback estático
    }
  }
  if (topRoutes.length < 3) {
    topRoutes = FALLBACK_ROUTES;
    topDestinations = FALLBACK_DESTINATIONS;
    source = "fallback";
  }

  const body: TrendingResponse = {
    top_routes: topRoutes,
    top_destinations: topDestinations,
    generated_at: new Date().toISOString(),
    source,
  };

  return NextResponse.json(body, {
    headers: {
      // Cache 5 min en CDN, SWR 30 min: balance freshness vs backend load
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=1800",
    },
  });
}
