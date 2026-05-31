/**
 * /api/search — REFACTOR (31 may 2026)
 *
 * Reemplaza el endpoint `/api/search` del backend FastAPI Oracle VPS
 * (caído desde 18 may 2026, terminated por Oracle Always Free idle policy).
 *
 * Lee public/deals-latest.json (refrescado por hunter cron en GH Actions)
 * y filtra in-memory. Sin dependencia VPS. Latencia <50ms.
 *
 * GET /api/search?origin=MAD&destination=BCN&max_price=200&cabin=economy&q=barat&limit=20
 *
 * Filtros soportados:
 *   - origin: IATA aeropuerto origen (3 chars)
 *   - destination: IATA destino
 *   - max_price: precio máximo EUR
 *   - cabin: economy / premium_economy / business / first
 *   - deal_type: flight / hotel
 *   - q: búsqueda libre en city_from/city_to/headline
 *   - date_from, date_to: rango fechas (YYYY-MM-DD)
 *   - limit: default 50, max 200
 *
 * Cache 5 min CDN.
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const revalidate = 300;

interface Deal {
  id: string;
  type: "flight" | "hotel";
  headline: string;
  origin: string;
  destination: string;
  city_from?: string;
  city_to?: string;
  country_to?: string;
  region?: string;
  price_eur: number;
  cabin: string;
  date_out?: string;
  date_ret?: string;
  [k: string]: unknown;
}

interface DealsFile {
  deals: Deal[];
  [k: string]: unknown;
}

let cached: { deals: Deal[]; ts: number } | null = null;
const CACHE_MS = 60_000;

async function loadDeals(): Promise<Deal[]> {
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_MS) return cached.deals;

  try {
    const filepath = path.join(process.cwd(), "public", "deals-latest.json");
    const raw = await fs.readFile(filepath, "utf8");
    const json: DealsFile = JSON.parse(raw);
    const deals = Array.isArray(json.deals) ? json.deals : [];
    cached = { deals, ts: now };
    return deals;
  } catch {
    return cached?.deals ?? [];
  }
}

function matchesQuery(deal: Deal, q: string): boolean {
  const haystack = [
    deal.city_from,
    deal.city_to,
    deal.country_to,
    deal.headline,
    deal.origin,
    deal.destination,
    deal.airline_name as string | undefined,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const origin = params.get("origin")?.toUpperCase();
  const destination = params.get("destination")?.toUpperCase();
  // AUDIT-FIX (31 may 2026): NaN guard. `?max_price=abc` antes producía NaN →
  // `d.price_eur > NaN` siempre false → todos los deals pasaban el filtro.
  // Ahora NaN se ignora y el filtro no aplica (consistent con max_price ausente).
  const maxPriceRaw = params.get("max_price");
  const maxPriceNum = maxPriceRaw !== null ? Number(maxPriceRaw) : null;
  const maxPrice =
    maxPriceNum !== null && Number.isFinite(maxPriceNum) ? maxPriceNum : null;
  const cabin = params.get("cabin")?.toLowerCase();
  const dealType = params.get("deal_type") as "flight" | "hotel" | null;
  const q = params.get("q");
  const dateFrom = params.get("date_from");
  const dateTo = params.get("date_to");
  // AUDIT-FIX: NaN guard on limit (e.g. ?limit=abc → fallback 50).
  const limitNum = Number(params.get("limit"));
  const limit = Math.min(
    Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 50,
    200,
  );

  const all = await loadDeals();

  let filtered = all.filter((d) => {
    if (origin && d.origin?.toUpperCase() !== origin) return false;
    if (destination && d.destination?.toUpperCase() !== destination) return false;
    if (maxPrice !== null && d.price_eur > maxPrice) return false;
    if (cabin && d.cabin?.toLowerCase() !== cabin) return false;
    if (dealType && d.type !== dealType) return false;
    if (dateFrom && d.date_out && d.date_out < dateFrom) return false;
    if (dateTo && d.date_out && d.date_out > dateTo) return false;
    if (q && !matchesQuery(d, q)) return false;
    return true;
  });

  // Sort: cheaper first within filters
  filtered = filtered.sort((a, b) => a.price_eur - b.price_eur).slice(0, limit);

  return NextResponse.json(filtered, {
    headers: {
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
