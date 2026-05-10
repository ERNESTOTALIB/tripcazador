/**
 * TripCazador — API Client
 * Conecta con el FastAPI backend en /api/deals
 */

import { enhanceDealBookingUrl } from "./airline_links";
import { diversifyDeals } from "./seed_diversifier";
import { enrichDealLocations, hasEuOrigin, hasSpainOrigin } from "./iata_city";

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

  // SSS81 (May 2026): detectar seed VPS y caer al worker JSONL.
  // El backend FastAPI a veces devuelve seed deals (id="seed-…",
  // sources=["seed"], tags=["seed"]) cuando el upload del worker
  // no llega o el deals.json del VPS está stale. En ese caso el repo
  // tiene 1259+ deals reales en /deals-latest.json — usamos ESE.
  const arr = Array.isArray(json) ? json : (json && Array.isArray(json.deals) ? json.deals : null);
  if (arr && arr.length > 0) {
    const sample = arr.slice(0, 5);
    const allSeed = sample.every((d: Deal) =>
      (typeof d.id === "string" && d.id.startsWith("seed-")) ||
      (Array.isArray(d.sources) && d.sources.includes("seed")) ||
      (Array.isArray(d.tags) && d.tags.includes("seed"))
    );
    if (allSeed) {
      const fresh = await getDealsFromStatic();
      if (fresh.deals.length > arr.length) {
        // Re-aplica los filtros del usuario sobre el catálogo real
        const filtered = diversifyDeals(fresh.deals, params);
        return {
          ...fresh,
          deals: filtered.map((d) => enrichDealLocations(enhanceDealBookingUrl(d))),
          total_deals: filtered.length,
        };
      }
    }
  }

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
    const deals = diversified.map((d) => enrichDealLocations(enhanceDealBookingUrl(d)));
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
    wrapped.deals = wrapped.deals.map((d) => enrichDealLocations(enhanceDealBookingUrl(d)));
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
      return data.deals.slice(0, limit).map((d) => enrichDealLocations(enhanceDealBookingUrl(d)));
    }
    const arr: Deal[] = await res.json();
    // B1: reescribir google.com/travel → ryanair/easyjet/wizz/kayak directos
    // C1: diversificar si el seed devuelve un solo mes
    if (!Array.isArray(arr)) return arr;
    return diversifyDeals(arr, { limit }).map((d) => enrichDealLocations(enhanceDealBookingUrl(d)));
  } catch {
    const data = await getDealsFromStatic();
    return data.deals.slice(0, limit).map((d) => enrichDealLocations(enhanceDealBookingUrl(d)));
  }
}

/**
 * SSS: deals "atractivos" para home — vuelos económicos muy baratos que
 * generen click. Bug user 2026-05-02: "Deals destacados" mostraba business
 * class 1195-2495€ porque diversifyDeals reemplazaba el seed real (economy
 * 69-389€ del VPS) con templates business hardcoded del catálogo TS.
 *
 * Fix v2: NO llamar diversifyDeals (que mete business templates al pool).
 * Leer directo del VPS, hard-reject business/first SIEMPRE, y si pool<limit
 * usar curated hardcoded array (Marrakech/Estambul/Lisboa baratos).
 *
 * Política:
 *   1) Pool = /api/deals/top directo (sin diversifyDeals — bypass templates)
 *   2) HARD reject cabin business/first (NUNCA en featured)
 *   3) Solo economy/premium_economy ≤ MAX_ATTRACTIVE_PRICE
 *   4) Sort: savings_pct DESC, price_eur ASC, score DESC
 *   5) Diversidad por destino
 *   6) Fallback: curated FALLBACK_CHOLLOS (no business)
 */
const MAX_ATTRACTIVE_PRICE = 250; // permisivo sobre 200 antes

// Curated fallback: chollos hardcoded como último recurso (sin business).
// Si VPS y catálogo no dan economy <250€, mostramos estos para que la home
// nunca esté vacía y siempre atraiga al user con precios bajos creíbles.
const FALLBACK_CHOLLOS: Partial<Deal>[] = [
  {
    id: "fallback-mad-rak",
    type: "flight", origin: "MAD", destination: "RAK",
    city_from: "Madrid", city_to: "Marrakech", country_to: "Marruecos", region: "Norte de África",
    price_eur: 49, savings_pct: 55, savings_eur: 60,
    cabin: "economy", airline: "FR", airline_name: "Ryanair",
    headline: "Madrid → Marrakech desde 49€",
    classification: "OFERTA", score: 88, stops: 0,
    date_out: "2026-09-15", date_ret: "2026-09-19", nights: 4,
    booking_url: "https://www.ryanair.com/es/es/cheap-flights?destinationIata=RAK&originIata=MAD",
    image_url: "", verified: false, sources: ["fallback"],
    distance_category: "short", duration_min: 195,
  },
  {
    id: "fallback-bcn-cmn",
    type: "flight", origin: "BCN", destination: "CMN",
    city_from: "Barcelona", city_to: "Casablanca", country_to: "Marruecos", region: "Norte de África",
    price_eur: 59, savings_pct: 60, savings_eur: 88,
    cabin: "economy", airline: "AT", airline_name: "Royal Air Maroc",
    headline: "Barcelona → Casablanca desde 59€",
    classification: "OFERTA", score: 86, stops: 0,
    date_out: "2026-08-20", date_ret: "2026-08-25", nights: 5,
    booking_url: "https://www.royalairmaroc.com/es-es/buscar-vuelos",
    image_url: "", verified: false, sources: ["fallback"],
    distance_category: "short", duration_min: 200,
  },
  {
    id: "fallback-mad-tia",
    type: "flight", origin: "MAD", destination: "TIA",
    city_from: "Madrid", city_to: "Tirana", country_to: "Albania", region: "Balcanes",
    price_eur: 79, savings_pct: 50, savings_eur: 80,
    cabin: "economy", airline: "FR", airline_name: "Ryanair",
    headline: "Madrid → Tirana desde 79€",
    classification: "OFERTA", score: 85, stops: 0,
    date_out: "2026-10-10", date_ret: "2026-10-15", nights: 5,
    booking_url: "https://www.ryanair.com/es/es/cheap-flights?destinationIata=TIA&originIata=MAD",
    image_url: "", verified: false, sources: ["fallback"],
    distance_category: "short", duration_min: 210,
  },
  {
    id: "fallback-mad-ist",
    type: "flight", origin: "MAD", destination: "IST",
    city_from: "Madrid", city_to: "Estambul", country_to: "Turquía", region: "Oriente Medio",
    price_eur: 95, savings_pct: 52, savings_eur: 105,
    cabin: "economy", airline: "TK", airline_name: "Turkish Airlines",
    headline: "Madrid → Estambul desde 95€",
    classification: "OFERTA", score: 88, stops: 0,
    date_out: "2026-09-25", date_ret: "2026-09-30", nights: 5,
    booking_url: "https://www.turkishairlines.com/es-es/",
    image_url: "", verified: false, sources: ["fallback"],
    distance_category: "medium", duration_min: 245,
  },
  {
    id: "fallback-bcn-fnc",
    type: "flight", origin: "BCN", destination: "FNC",
    city_from: "Barcelona", city_to: "Madeira", country_to: "Portugal", region: "Europa",
    price_eur: 69, savings_pct: 58, savings_eur: 95,
    cabin: "economy", airline: "VY", airline_name: "Vueling",
    headline: "Barcelona → Madeira desde 69€",
    classification: "OFERTA", score: 86, stops: 0,
    date_out: "2026-11-05", date_ret: "2026-11-10", nights: 5,
    booking_url: "https://book2.vueling.com/availability",
    image_url: "", verified: false, sources: ["fallback"],
    distance_category: "short", duration_min: 220,
  },
];

export async function getAttractiveDeals(limit = 3): Promise<Deal[]> {
  // 1. Pool: PRIORIZA worker deals-latest.json (cron 6h con deals frescos —
  // 478+ deals reales de Wizz/Ryanair/Volare). Si vacío, fallback a VPS.
  //
  // SSS8 bug history:
  //   - antes solo VPS → 5 deals seed estancados (Iberia/Condor 69-109€)
  //   - pasó a leer worker output: Wizz Podgorica 25€, Wizz Ereván 59€ etc
  let pool: Deal[] = [];
  try {
    const fresh = await getDealsFromStatic();
    pool = Array.isArray(fresh?.deals) ? fresh.deals : [];
  } catch {
    pool = [];
  }

  // Si worker output vacío (raro, solo si todavía no hay primer commit),
  // fallback a VPS endpoint
  if (pool.length === 0) {
    try {
      const res = await fetch(`${API_BASE}/api/deals/top?limit=50`, {
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const arr = await res.json();
        pool = Array.isArray(arr) ? arr : [];
      }
    } catch {
      pool = [];
    }
  }

  // AAAA01: enriquecer city_from/city_to si vienen como código IATA o vacío
  // (rutas LATAM internas que no estaban en el catálogo principal).
  pool = pool.map((d) => enrichDealLocations(d));

  // 2. HARD reject business/first SIEMPRE (nunca en featured)
  // 3. Solo economy/premium_economy ≤ MAX_ATTRACTIVE_PRICE
  // AAAA01: además filtramos por origen EU. La web es ES y los usuarios
  // esperan ver rutas desde Europa, no LATAM-LATAM internas. Si el pool
  // queda vacío tras el filtro, hacemos relax (mejor mostrar algo que nada).
  const cheapEconomy = pool.filter(
    (d) =>
      (d.cabin === "economy" || d.cabin === "premium_economy") &&
      d.price_eur > 0 &&
      d.price_eur <= MAX_ATTRACTIVE_PRICE
  );
  const euOnly = cheapEconomy.filter(hasEuOrigin);
  // AAAA01b: si euOnly tiene contenido, lo usamos puro (sin contaminar con
  // LATAM-internos). Si está vacío, dejamos finalPool vacío para que caiga
  // al FALLBACK_CHOLLOS hardcoded (rutas desde España reales) en lugar
  // de mostrar GRU-POA o BSB-SAO en home de web ES.
  const finalPool = euOnly;

  // 4. Sort SSS92: priorizar CRÍTICO/ERROR (wow reales <€50) ANTES de
  // savings/price/score. Antes home mostraba ANOMALÍA/OFERTA genéricos a
  // ~€100 promedio con los 189 deals CRÍTICO+ERROR ocultos en /deals.
  // Para el aterrizaje queremos pegar el headline más impactante.
  const TIER: Record<string, number> = {
    "CRÍTICO": 0,    // <€50 = top urgencia
    "CRITICO": 0,    // sin acento por si el clasificador varía
    "ERROR": 1,      // error fares confirmados
    "ANOMALÍA": 2,
    "ANOMALIA": 2,
    "OFERTA": 3,
  };
  // EEEE02 (May 2026): primary sort key = origen España.
  // Anomalía SSS113-post: 87% deals tenían origen NO-España (LIS/DUB/STN/WAW)
  // tras filtro EU broad. Audiencia ES espera ver Madrid/Barcelona FIRST.
  finalPool.sort((a, b) => {
    const esA = hasSpainOrigin(a) ? 0 : 1;
    const esB = hasSpainOrigin(b) ? 0 : 1;
    if (esA !== esB) return esA - esB;
    const tierA = TIER[a.classification || "OFERTA"] ?? 4;
    const tierB = TIER[b.classification || "OFERTA"] ?? 4;
    if (tierA !== tierB) return tierA - tierB;
    const savingsDiff = (b.savings_pct || 0) - (a.savings_pct || 0);
    if (Math.abs(savingsDiff) > 5) return savingsDiff;
    const priceDiff = (a.price_eur || 999) - (b.price_eur || 999);
    if (Math.abs(priceDiff) > 10) return priceDiff;
    return (b.score || 0) - (a.score || 0);
  });

  // 5. Diversidad: max 1 por destino
  const seenDest = new Set<string>();
  const diverse: Deal[] = [];
  for (const d of finalPool) {
    if (seenDest.has(d.destination)) continue;
    seenDest.add(d.destination);
    diverse.push(d);
    if (diverse.length >= limit) break;
  }

  // 6. Fallback: rellenar con FALLBACK_CHOLLOS hardcoded (sin business)
  if (diverse.length < limit) {
    for (const fb of FALLBACK_CHOLLOS) {
      if (diverse.length >= limit) break;
      if (seenDest.has(fb.destination!)) continue;
      seenDest.add(fb.destination!);
      diverse.push({
        ...fb,
        // Defaults para campos del schema Deal no cubiertos
        type: "flight",
        found_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        lat: 0, lon: 0,
      } as Deal);
    }
  }

  // 7. Último fallback: si TODO ha fallado (raro), devolver vacío
  if (diverse.length === 0) {
    return [];
  }

  return diverse.map((d) => enrichDealLocations(enhanceDealBookingUrl(d)));
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
        const deals = (json as Deal[]).map((d) => enrichDealLocations(enhanceDealBookingUrl(d)));
        return {
          schema_version: "4.1",
          generated_at: new Date().toISOString(),
          total_deals: deals.length,
          stats: emptyResponse.stats,
          deals,
        };
      }

      // Si es objeto con .deals: usar tal cual + enhance + enrich location names
      if (json && typeof json === "object" && Array.isArray(json.deals)) {
        json.deals = json.deals.map((d: Deal) => enrichDealLocations(enhanceDealBookingUrl(d)));
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
