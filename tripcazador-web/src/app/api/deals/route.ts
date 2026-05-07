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
  classification?: string;
  cabin?: string;
  sources?: string[];
  tags?: string[];
  date_out?: string;
  found_at?: string;
  [key: string]: unknown;
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

  // Aplicar limit final
  const limited = deals.slice(0, limit);

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
