/**
 * /api/deals — REFACTOR (31 may 2026)
 *
 * Reemplaza el rewrite original al backend FastAPI VPS Oracle
 * (terminated 18 may 2026). Sirve directamente desde
 * `public/deals-latest.json` (refrescado por hunter cron GH Actions).
 *
 * Consumido por:
 *  - scripts externos (IG bot, curl manual)
 *  - fetch internos que prefieren la ruta HTTP en lugar de lib/api.ts
 *
 * GET /api/deals?classification=...&region=...&cabin=...&max_price=...&date_from=...&date_to=...&deal_type=...&limit=...&strict_es=0&currency=USD
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { enrichDealLocations, hasSpainOrigin, hasEuOrigin } from "@/lib/iata_city";
import { applyTPMarkerServerSide } from "@/lib/airline_links";
import { filterOutSecret } from "@/lib/secret_deals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Deal {
  id: string;
  type: string;
  city_from?: string;
  city_to?: string;
  country_to?: string;
  region?: string;
  price_eur?: number;
  price?: number;
  currency?: string;
  classification?: string;
  cabin?: string;
  sources?: string[];
  tags?: string[];
  date_out?: string;
  found_at?: string;
  origin?: string;
  destination?: string;
  [key: string]: unknown;
}

// SSS84: tasas FX hardcoded — partner siempre cobra moneda original.
const FX_FROM_EUR: Record<string, number> = {
  EUR: 1, USD: 1.08, GBP: 0.85, CHF: 0.96, CAD: 1.49, MXN: 21.5,
  ARS: 1180, CLP: 1050, COP: 4500, PEN: 4.05, BRL: 6.2,
  JPY: 168, CNY: 7.85, AUD: 1.66, NOK: 11.7, SEK: 11.3, DKK: 7.46,
  PLN: 4.32, HUF: 410, CZK: 25.2, RON: 4.97,
};

function applyCurrency(deals: Deal[], currency: string): Deal[] {
  const code = currency.toUpperCase();
  if (code === "EUR" || !FX_FROM_EUR[code]) return deals;
  const rate = FX_FROM_EUR[code];
  return deals.map((d) => {
    const eur = d.price_eur ?? 0;
    return {
      ...d,
      price: Math.round(eur * rate * 100) / 100,
      currency: code,
    };
  });
}

// Cache module-level 60s — el JSON solo cambia cuando hunter cron commitea.
let cached: { deals: Deal[]; ts: number } | null = null;
const CACHE_MS = 60_000;

async function loadStaticDeals(): Promise<Deal[]> {
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_MS) return cached.deals;
  try {
    const filepath = path.join(process.cwd(), "public", "deals-latest.json");
    const raw = await fs.readFile(filepath, "utf8");
    const json = JSON.parse(raw) as { deals?: Deal[] };
    const deals = Array.isArray(json.deals) ? json.deals : [];
    cached = { deals, ts: now };
    return deals;
  } catch {
    return cached?.deals ?? [];
  }
}

function applyFilters(deals: Deal[], params: URLSearchParams): Deal[] {
  const cls = params.get("classification");
  const region = params.get("region");
  const cabin = params.get("cabin");
  const maxPrice = params.get("max_price");
  const dateFrom = params.get("date_from");
  const dateTo = params.get("date_to");
  const dealType = params.get("deal_type") || params.get("type");

  let result = deals;
  if (cls) result = result.filter((d) => d.classification === cls);
  if (region) result = result.filter((d) => d.region === region);
  if (cabin) result = result.filter((d) => d.cabin === cabin);
  if (dealType) result = result.filter((d) => d.type === dealType);
  if (maxPrice) {
    const max = Number(maxPrice);
    if (Number.isFinite(max)) {
      result = result.filter((d) => (d.price_eur ?? 9e9) <= max);
    }
  }
  if (dateFrom) result = result.filter((d) => !d.date_out || d.date_out >= dateFrom);
  if (dateTo) result = result.filter((d) => !d.date_out || d.date_out <= dateTo);
  return result;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const params = url.searchParams;

  // Parse limit safe — Number.isFinite y bounds.
  const limitRaw = parseInt(params.get("limit") || "30", 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 200)
    : 30;

  // Source único: static JSON repo. Backend VPS eliminado (Oracle reclaim).
  const allDeals = await loadStaticDeals();
  const filtered = applyFilters(allDeals, params);
  const source = "static";

  // Enriquecer city_from/city_to/headline (IATA→nombre) + TP marker.
  const enriched = filtered.map((d) => {
    const e = enrichDealLocations(
      d as Parameters<typeof enrichDealLocations>[0],
    ) as Deal;
    return applyTPMarkerServerSide(e as never) as Deal;
  }) as Deal[];

  // EEEE03: España-first → EU → resto. Opt-out con ?strict_es=0.
  const strictEs = params.get("strict_es") !== "0";
  if (strictEs) {
    enriched.sort((a, b) => {
      const esA = hasSpainOrigin({
        origin: typeof a.origin === "string" ? a.origin : null,
      })
        ? 0
        : 1;
      const esB = hasSpainOrigin({
        origin: typeof b.origin === "string" ? b.origin : null,
      })
        ? 0
        : 1;
      if (esA !== esB) return esA - esB;
      const euA = hasEuOrigin({
        origin: typeof a.origin === "string" ? a.origin : null,
      })
        ? 0
        : 1;
      const euB = hasEuOrigin({
        origin: typeof b.origin === "string" ? b.origin : null,
      })
        ? 0
        : 1;
      if (euA !== euB) return euA - euB;
      const pA = typeof a.price_eur === "number" ? a.price_eur : 9e9;
      const pB = typeof b.price_eur === "number" ? b.price_eur : 9e9;
      return pA - pB;
    });
  }

  // SSS318: filtrar secret deals Premium-only.
  const publicFiltered = filterOutSecret(enriched);

  // Conversión moneda (?currency=USD/GBP/...).
  const currency = (
    params.get("currency") || params.get("c") || "EUR"
  ).toUpperCase();
  const converted = applyCurrency(publicFiltered, currency);

  const limited = converted.slice(0, limit);

  return new NextResponse(JSON.stringify(limited), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      "X-Deals-Source": source,
      "X-Deals-Total": String(filtered.length),
      "Access-Control-Allow-Origin": "https://tripcazador.com",
    },
  });
}
