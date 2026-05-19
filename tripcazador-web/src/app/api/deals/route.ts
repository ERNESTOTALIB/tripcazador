/**
 * /api/deals — SSS81 (May 2026)
 *
 * Antes este endpoint era un rewrite Vercel directo a api.tripcazador.com.
 * Problema: cuando el VPS devuelve seed deals (id="seed-…", sources=["seed"]),
 * el frontend NO podía interceptar y caer al deals-latest.json del repo
 * (1271+ deals reales del hunter), porque el rewrite era CDN-level.
 *
 * Ahora este route Next.js intercepta ANTES del rewrite (file-system priority):
 *   1) Llama al VPS api.tripcazador.com/api/deals con todos los query params
 *   2) Si los deals devueltos son seed → carga /deals-latest.json del repo
 *   3) Aplica filtros (limit, classification, region, max_price) sobre el catálogo real
 *   4) Devuelve array directo (mismo contrato que VPS) con headers cache.
 *
 * Resultado: scripts externos (IG bot), curl manual y el frontend
 * todos ven los 1271 deals reales en lugar de 3 seeds.
 */
import { NextRequest, NextResponse } from "next/server";
import { enrichDealLocations, hasSpainOrigin, hasEuOrigin } from "@/lib/iata_city";
import { applyTPMarkerServerSide } from "@/lib/airline_links";
import { filterOutSecret } from "@/lib/secret_deals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VPS_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.tripcazador.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";
const REPO_BASE = "https://raw.githubusercontent.com/ERNESTOTALIB/tripcazador/main";

interface Deal {
  id: string;
  type: string;
  city_from?: string;
  city_to?: string;
  country_to?: string;
  region?: string;
  price_eur?: number;
  price?: number; // SSS84: cuando devuelve currency != EUR
  currency?: string;
  classification?: string;
  cabin?: string;
  sources?: string[];
  tags?: string[];
  date_out?: string;
  found_at?: string;
  [key: string]: unknown;
}

// SSS84 (May 2026): tasas FX hardcoded para conversión rápida en el route.
// No queremos depender de un FX provider externo (latencia + rate limits).
// Estas tasas se actualizan manualmente cada ~3 meses, suficiente para mostrar
// precios aproximados a usuarios en otra moneda. Para el booking final el
// partner siempre cobra en la moneda original.
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

function isSeed(deals: Deal[]): boolean {
  if (!deals.length) return false;
  const sample = deals.slice(0, 5);
  return sample.every(
    (d) =>
      (typeof d.id === "string" && d.id.startsWith("seed-")) ||
      (Array.isArray(d.sources) && d.sources.includes("seed")) ||
      (Array.isArray(d.tags) && d.tags.includes("seed")),
  );
}

async function fetchVps(qs: string): Promise<Deal[] | null> {
  try {
    const r = await fetch(`${VPS_BASE}/api/deals${qs ? "?" + qs : ""}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (Array.isArray(j)) return j as Deal[];
    if (j && Array.isArray(j.deals)) return j.deals as Deal[];
    return null;
  } catch {
    return null;
  }
}

async function fetchRepoDeals(): Promise<Deal[]> {
  // Intenta primero el path canónico del worker, luego raw github como fallback
  const sources = [
    `${SITE_URL}/deals-latest.json`,
    `${REPO_BASE}/tripcazador-web/public/deals-latest.json`,
  ];
  for (const url of sources) {
    try {
      const r = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) continue;
      const j = await r.json();
      if (Array.isArray(j)) return j as Deal[];
      if (j && Array.isArray(j.deals)) return j.deals as Deal[];
    } catch {
      // continue
    }
  }
  return [];
}

function applyFilters(
  deals: Deal[],
  params: URLSearchParams,
): Deal[] {
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
    if (Number.isFinite(max)) result = result.filter((d) => (d.price_eur ?? 9e9) <= max);
  }
  if (dateFrom) result = result.filter((d) => !d.date_out || d.date_out >= dateFrom);
  if (dateTo) result = result.filter((d) => !d.date_out || d.date_out <= dateTo);
  return result;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const params = url.searchParams;
  const limit = Math.min(Math.max(parseInt(params.get("limit") || "30", 10), 1), 200);

  // 1) Intentar VPS primero (rápido si tiene datos reales)
  const qs = params.toString();
  const vpsDeals = await fetchVps(qs);

  let deals: Deal[];
  let source: string;

  if (vpsDeals && vpsDeals.length > 0 && !isSeed(vpsDeals)) {
    // VPS sirvió deals reales — usar tal cual
    deals = vpsDeals;
    source = "vps";
  } else {
    // VPS down/seed → fallback al repo
    const repoDeals = await fetchRepoDeals();
    if (repoDeals.length > 0) {
      deals = applyFilters(repoDeals, params);
      source = "repo-fallback";
    } else if (vpsDeals) {
      // Repo vacío → al menos devuelve lo que el VPS dio (aunque sean seed)
      deals = vpsDeals;
      source = "vps-seed";
    } else {
      deals = [];
      source = "empty";
    }
  }

  // EEEE03 (May 2026): enriquecer city_from/city_to/headline (IATA→nombre)
  // y ordenar España-first → EU → resto. Anomalía SSS113-post: 87% deals
  // visibles eran origen no-España (LIS/DUB/STN). Audiencia ES espera
  // ver MAD/BCN/VLC primero. Permitimos opt-out con ?strict_es=0.
  // SSS274 (17 may 2026): aplicar applyTPMarkerServerSide aquí también.
  // El endpoint /api/deals es consumido por scripts externos + algunos
  // fetch internos. Antes solo getDeals() de lib/api.ts aplicaba el rewrite.
  const enriched = deals.map((d) => {
    const enriched = enrichDealLocations(d as Parameters<typeof enrichDealLocations>[0]) as Deal;
    return applyTPMarkerServerSide(enriched as never) as Deal;
  }) as Deal[];
  const strictEs = params.get("strict_es") !== "0";
  if (strictEs) {
    enriched.sort((a, b) => {
      const esA = hasSpainOrigin({ origin: typeof a.origin === "string" ? a.origin : null }) ? 0 : 1;
      const esB = hasSpainOrigin({ origin: typeof b.origin === "string" ? b.origin : null }) ? 0 : 1;
      if (esA !== esB) return esA - esB;
      const euA = hasEuOrigin({ origin: typeof a.origin === "string" ? a.origin : null }) ? 0 : 1;
      const euB = hasEuOrigin({ origin: typeof b.origin === "string" ? b.origin : null }) ? 0 : 1;
      if (euA !== euB) return euA - euB;
      // tiebreak por price_eur ascendente (más barato primero)
      const pA = typeof a.price_eur === "number" ? a.price_eur : 9e9;
      const pB = typeof b.price_eur === "number" ? b.price_eur : 9e9;
      return pA - pB;
    });
  }

  // SSS318: filtrar "secret deals" Premium-only (classification CRÍTICO/ERROR
  // con found_at < 24h ago). El público nunca los ve aquí — Premium los lee
  // de /api/premium/secret-deals.
  const publicFiltered = filterOutSecret(enriched);

  // SSS84: aplicar conversión de moneda si ?currency=USD/GBP/...
  const currency = (params.get("currency") || params.get("c") || "EUR").toUpperCase();
  const converted = applyCurrency(publicFiltered, currency);

  // Aplicar limit final
  const limited = converted.slice(0, limit);

  return new NextResponse(JSON.stringify(limited), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      "X-Deals-Source": source,
      "X-Deals-Total": String(deals.length),
      "Access-Control-Allow-Origin": "https://tripcazador.com",
    },
  });
}
