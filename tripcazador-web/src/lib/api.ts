/**
 * TripCazador — API Client
 * Conecta con el FastAPI backend en /api/deals
 */

import { enhanceDealBookingUrl } from "./airline_links";
import { diversifyDeals } from "./seed_diversifier";

export interface Deal {
  id: string;
  type: "flight" | "hotel";
  headline: string;
  origin: string;
  destination: string;
  city_from: string;
  city_to: string;
  country_to: string;
  region: string;
  price_eur: number;
  savings_pct: number;
  savings_eur: number;
  nights: number;
  price_per_night?: number;
  date_out: string;
  date_ret: string;
  cabin: "economy" | "premium_economy" | "business" | "first";
  airline: string;
  airline_name: string;
  stops: number;
  duration_min: number;
  distance_category: string;
  score: number;
  classification: "CRÍTICO" | "ERROR" | "ANOMALÍA" | "OFERTA" | "NORMAL";
  tags: string[];
  image_url: string;
  booking_url: string;
  verified: boolean;
  sources: string[];
  found_at: string;
  expires_at: string;
  lat?: number;
  lon?: number;
  main_reason?: string;
}

export interface DealsResponse {
  schema_version: string;
  generated_at: string;
  total_deals: number;
  stats: {
    total: number;
    flights: number;
    hotels: number;
    by_classification: Record<string, number>;
    by_region: Record<string, number>;
    by_cabin: Record<string, number>;
    price_min: number;
    price_max: number;
    price_avg: number;
    verified_count: number;
  };
  deals: Deal[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getDeals(params?: {
  classification?: string;
  region?: string;
  cabin?: string;
  max_price?: number;
  limit?: number;
}): Promise<DealsResponse> {
  const query = new URLSearchParams();
  if (params?.classification) query.set("classification", params.classification);
  if (params?.region) query.set("region", params.region);
  if (params?.cabin) query.set("cabin", params.cabin);
  if (params?.max_price) query.set("max_price", String(params.max_price));
  if (params?.limit) query.set("limit", String(params.limit));

  const url = `${API_BASE}/api/deals${query.toString() ? "?" + query : ""}`;

  const res = await fetch(url, {
    next: { revalidate: 300 }, // Revalidar cada 5 minutos (ISR)
  });

  if (!res.ok) {
    // Fallback: intentar cargar desde deals.json estático
    return getDealsFromStatic();
  }

  const json = await res.json();

  // FastAPI puede devolver un array plano (`Deal[]`) o el envoltorio
  // `DealsResponse`. Cuando devuelve array (variante actual del backend),
  // lo envolvemos para mantener el contrato del cliente.
  // Bug fase-ee: sin este wrap, `data.stats.total` lanzaba en el server
  // component de la home → error.tsx mostraba "Algo salió mal en el radar".
  if (Array.isArray(json)) {
    // Reescribir booking_url genérico (Google Flights) → URL directa
    // de la aerolínea (Ryanair / easyJet / Wizz) o Kayak/Travelpayouts.
    // Implementado fase EE6/B1 — usuarios prefieren ir directo a la web
    // de la aerolínea, no a Google Flights.
    //
    // C1: si el seed VPS devuelve solo un mes (síntoma seed legacy),
    // diversifyDeals reemplaza por catálogo TS con Jul-2026..Jun-2027.
    // No-op transparente cuando el motor devuelve datos diversos.
    const rawDeals = json as Deal[];
    // BUG fix fase-hh: pasar params al diversifier para que filtre el catálogo
    // fallback. Sin esto /deals?classification=CRÍTICO devolvía el catálogo
    // entero ignorando el filtro del usuario.
    const diversified = diversifyDeals(rawDeals, params);
    const deals = diversified.map((d) => enhanceDealBookingUrl(d));
    const totalCount = deals.length;
    const flights = deals.filter((d) => d.type === "flight").length;
    const hotels = deals.filter((d) => d.type === "hotel").length;
    const verified = deals.filter((d) => d.verified).length;
    const prices = deals.map((d) => d.price_eur).filter((p) => p > 0);
    const priceMin = prices.length ? Math.min(...prices) : 0;
    const priceMax = prices.length ? Math.max(...prices) : 0;
    const priceAvg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const byClass: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    const byCabin: Record<string, number> = {};
    for (const d of deals) {
      byClass[d.classification] = (byClass[d.classification] || 0) + 1;
      byRegion[d.region] = (byRegion[d.region] || 0) + 1;
      byCabin[d.cabin] = (byCabin[d.cabin] || 0) + 1;
    }
    return {
      schema_version: "1",
      generated_at: new Date().toISOString(),
      total_deals: totalCount,
      stats: {
        total: totalCount,
        flights,
        hotels,
        by_classification: byClass,
        by_region: byRegion,
        by_cabin: byCabin,
        price_min: priceMin,
        price_max: priceMax,
        price_avg: priceAvg,
        verified_count: verified,
      },
      deals,
    };
  }

  // Backend devolvió forma DealsResponse: enhancear cada deal igualmente
  const wrapped = json as DealsResponse;
  if (wrapped?.deals && Array.isArray(wrapped.deals)) {
    wrapped.deals = wrapped.deals.map((d) => enhanceDealBookingUrl(d));
  }
  return wrapped;
}

// ──────────────────────────────────────────────────────────────
// Live search (llama a /api/search del FastAPI)
// ──────────────────────────────────────────────────────────────
export interface SearchParams {
  origin?: string;
  destination?: string;
  date_from?: string;
  date_to?: string;
  max_price?: number;
  cabin?: string;
  deal_type?: "flight" | "hotel";
  q?: string;
  limit?: number;
}

// ──────────────────────────────────────────────────────────────
// Airport catalog (para poblar autocompletados dinámicamente)
// ──────────────────────────────────────────────────────────────

export interface Airport {
  iata: string;
  city: string;
  country: string;
  region: string;
  lat?: number;
  lon?: number;
}

export interface AirportsResponse {
  total: number;
  airports: Airport[];
}

export async function getAirports(params?: {
  q?: string;
  region?: string;
  limit?: number;
}): Promise<Airport[]> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.region) query.set("region", params.region);
  if (params?.limit) query.set("limit", String(params.limit));

  const url = `${API_BASE}/api/airports${query.toString() ? "?" + query : ""}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 }, // catálogo cambia raramente; cache 24 h
    });
    if (!res.ok) return [];
    const data: AirportsResponse = await res.json();
    return data.airports || [];
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────
// Histórico de precios (sparkline)
// ──────────────────────────────────────────────
export interface PricePoint {
  ts: string; // fecha ISO corta (YYYY-MM-DD)
  price: number; // mínimo del día
  avg: number;
  samples: number;
}

export interface PriceHistoryStats {
  min: number;
  max: number;
  avg: number;
  current: number;
  change_pct: number;
  trend: "down" | "up" | "flat";
  days_covered: number;
}

export interface PriceHistory {
  origin: string;
  destination: string;
  cabin: string;
  currency: string;
  points: PricePoint[];
  stats: PriceHistoryStats | Record<string, never>;
}

export async function getPriceHistory(params: {
  origin: string;
  destination: string;
  cabin?: string;
  days?: number;
}): Promise<PriceHistory | null> {
  const q = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    cabin: params.cabin ?? "economy",
    days: String(params.days ?? 90),
  });
  const url = `${API_BASE}/api/price_history?${q}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1 h
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function searchDeals(params: SearchParams): Promise<Deal[]> {
  const query = new URLSearchParams();
  if (params.origin) query.set("origin", params.origin);
  if (params.destination) query.set("destination", params.destination);
  if (params.date_from) query.set("date_from", params.date_from);
  if (params.date_to) query.set("date_to", params.date_to);
  if (params.max_price !== undefined) query.set("max_price", String(params.max_price));
  if (params.cabin) query.set("cabin", params.cabin);
  if (params.deal_type) query.set("deal_type", params.deal_type);
  if (params.q) query.set("q", params.q);
  if (params.limit) query.set("limit", String(params.limit));

  const url = `${API_BASE}/api/search?${query.toString()}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getDeal(id: string): Promise<Deal | null> {
  try {
    const res = await fetch(`${API_BASE}/api/deals/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      // Fallback: busca en el JSON estático
      const data = await getDealsFromStatic();
      return data.deals.find((d) => d.id === id) || null;
    }
    return res.json();
  } catch {
    const data = await getDealsFromStatic();
    return data.deals.find((d) => d.id === id) || null;
  }
}

// ──────────────────────────────────────────────
// Hoteles — top deals por precio/noche
// ──────────────────────────────────────────────
export async function getTopHotels(params?: {
  limit?: number;
  minStars?: number;
  maxPricePerNight?: number;
}): Promise<Deal[]> {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.minStars) q.set("min_stars", String(params.minStars));
  if (params?.maxPricePerNight)
    q.set("max_price_per_night", String(params.maxPricePerNight));
  const url = `${API_BASE}/api/hotels/top${q.toString() ? "?" + q : ""}`;
  try {
    const res = await fetch(url, { next: { revalidate: 900 } }); // 15 min
    if (!res.ok) {
      // ww WW1: backend devuelve error → seed fallback (30 hoteles reales con marker Booking)
      const { getHotelSeedFallback } = await import("@/lib/hotel_seed");
      return getHotelSeedFallback(params);
    }
    const arr = await res.json();
    if (Array.isArray(arr) && arr.length === 0) {
      // backend OK pero array vacío (hotel_hunter sin datos) → seed fallback
      const { getHotelSeedFallback } = await import("@/lib/hotel_seed");
      return getHotelSeedFallback(params);
    }
    return arr;
  } catch {
    const { getHotelSeedFallback } = await import("@/lib/hotel_seed");
    return getHotelSeedFallback(params);
  }
}

export async function getTopDeals(limit = 10): Promise<Deal[]> {
  try {
    const res = await fetch(`${API_BASE}/api/deals/top?limit=${limit}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      const data = await getDealsFromStatic();
      return data.deals.slice(0, limit).map((d) => enhanceDealBookingUrl(d));
    }
    const arr: Deal[] = await res.json();
    // B1: reescribir google.com/travel → ryanair/easyjet/wizz/kayak directos
    // C1: diversificar si el seed devuelve un solo mes
    if (!Array.isArray(arr)) return arr;
    return diversifyDeals(arr, { limit }).map((d) => enhanceDealBookingUrl(d));
  } catch {
    const data = await getDealsFromStatic();
    return data.deals.slice(0, limit).map((d) => enhanceDealBookingUrl(d));
  }
}

// Fallback: carga deals-latest.json (worker commit) o deals.json (legacy) desde /public.
// El worker GH Actions cron 6h committea deals reales (470 deals/run desde Travelpayouts)
// a tripcazador-web/public/deals-latest.json. Cuando VPS está stale o caído, este path
// sirve los deals reales. Estructura: { total_deals, deals: [...], stats: {...} } ó array.
async function getDealsFromStatic(): Promise<DealsResponse> {
  const emptyResponse: DealsResponse = {
    schema_version: "4.1",
    generated_at: new Date().toISOString(),
    total_deals: 0,
    stats: {
      total: 0, flights: 0, hotels: 0,
      by_classification: {}, by_region: {}, by_cabin: {},
      price_min: 0, price_max: 0, price_avg: 0, verified_count: 0,
    },
    deals: [],
  };

  // En SSR (server), construir URL absoluta — fetch relativo no funciona server-side.
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";
  // Intenta primero deals-latest.json (path canónico del worker), luego deals.json (legacy).
  for (const path of ["/deals-latest.json", "/deals.json"]) {
    try {
      const url = typeof window === "undefined" ? `${SITE_URL}${path}` : path;
      const res = await fetch(url, { cache: "no-store", next: { revalidate: 300 } });
      if (!res.ok) continue;
      const json = await res.json();

      // Si es array plano (formato hunter): wrap a DealsResponse + diversificar
      if (Array.isArray(json)) {
        const deals = (json as Deal[]).map((d) => enhanceDealBookingUrl(d));
        return {
          schema_version: "4.1",
          generated_at: new Date().toISOString(),
          total_deals: deals.length,
          stats: emptyResponse.stats,
          deals,
        };
      }

      // Si es objeto con .deals: usar tal cual + enhance
      if (json && typeof json === "object" && Array.isArray(json.deals)) {
        json.deals = json.deals.map((d: Deal) => enhanceDealBookingUrl(d));
        json.total_deals = json.total_deals || json.deals.length;
        return json as DealsResponse;
      }
    } catch {
      // continuar al siguiente path
    }
  }
  return emptyResponse;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-");
    const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return `${d} ${months[parseInt(m) - 1]} ${y}`;
  } catch {
    return dateStr;
  }
}

export function formatDuration(minutes: number): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ""}`;
}

export function getCabinLabel(cabin: string): string {
  const labels: Record<string, string> = {
    economy: "Economy",
    premium_economy: "Premium Eco",
    business: "Business",
    first: "First",
  };
  return labels[cabin] || cabin;
}

export function getClassificationColor(cls: string): string {
  const colors: Record<string, string> = {
    "CRÍTICO": "text-red-400 bg-red-400/10",
    "ERROR": "text-orange-400 bg-orange-400/10",
    "ANOMALÍA": "text-yellow-400 bg-yellow-400/10",
    "OFERTA": "text-amber-400 bg-amber-400/10",
    "NORMAL": "text-gray-400 bg-gray-400/10",
  };
  return colors[cls] || "text-gray-400 bg-gray-400/10";
}

// ──────────────────────────────────────────────
// Sanitización de URLs externas (defensa en profundidad).
// Bloquea esquemas peligrosos (`javascript:`, `data:`, `vbscript:`, `file:`)
// en `booking_url` y otras URLs que vengan del backend y terminen en <a href>.
// Si el esquema no es http/https ni relativo, se devuelve "#".
// ──────────────────────────────────────────────
export function safeExternalUrl(url: string | undefined | null): string {
  if (!url) return "#";
  const trimmed = String(url).trim();
  if (!trimmed) return "#";
  // Relative URL → safe
  if (trimmed.startsWith("/") || trimmed.startsWith("#") || trimmed.startsWith("?")) {
    return trimmed;
  }
  // Strip leading whitespace/control chars that some browsers ignore
  const normalized = trimmed.replace(/[\u0000-\u001f\u007f\s]/g, "").toLowerCase();
  if (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("file:")
  ) {
    return "#";
  }
  // Only http/https allowed for external
  if (!/^https?:\/\//i.test(trimmed)) return "#";
  return trimmed;
}

/**
 * Sanitiza URLs de imagen provenientes del backend antes de pintar en <img src>.
 *
 * Por qué: aunque `javascript:` en src de img es ignorado por navegadores modernos,
 * `data:image/svg+xml,...<script>` puede ejecutar JS en algunos contextos. Y si
 * el backend se compromete y emite una URL con esquemas raros, preferimos NO
 * intentar cargar el recurso.
 *
 * Política:
 *   - http(s) permitido
 *   - data:image/(png|jpeg|jpg|webp|gif) permitido (raster, no SVG)
 *   - Relativos (inicia con `/`) permitidos (Next.js Image loader)
 *   - cualquier otro esquema → cadena vacía (browsers no intentarán cargarla)
 */
export function safeImageUrl(url: string | undefined | null): string {
  if (!url) return "";
  const trimmed = String(url).trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) return trimmed;
  const normalized = trimmed.replace(/[\u0000-\u001f\u007f\s]/g, "").toLowerCase();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^data:image\/(png|jpeg|jpg|webp|gif)[;,]/i.test(normalized)) return trimmed;
  return "";
}
