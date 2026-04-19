/**
 * TripCazador — API Client
 * Conecta con el FastAPI backend en /api/deals
 */

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

  const dealsUrl = `${API_BASE}/api/deals${query.toString() ? "?" + query : ""}`;
  const statsUrl = `${API_BASE}/api/stats`;

  // El backend FastAPI separa /api/deals (array) y /api/stats (object). Los
  // componemos aquí en la forma DealsResponse que espera la web.
  // Si cualquiera falla → fallback a deals.json estático para que la build no
  // se rompa (p. ej. cuando la API responde lista vacía en cold-start).
  try {
    const [dealsRes, statsRes] = await Promise.all([
      fetch(dealsUrl, { next: { revalidate: 300 } }),
      fetch(statsUrl, { next: { revalidate: 300 } }),
    ]);

    if (!dealsRes.ok || !statsRes.ok) {
      return getDealsFromStatic();
    }

    const dealsBody: unknown = await dealsRes.json();
    const stats = await statsRes.json();

    const deals: Deal[] = Array.isArray(dealsBody)
      ? (dealsBody as Deal[])
      : ((dealsBody as { deals?: Deal[] })?.deals ?? []);

    return {
      schema_version: "v4.1",
      generated_at: stats?.generated_at ?? new Date().toISOString(),
      total_deals: stats?.total ?? deals.length,
      stats: {
        total: stats?.total ?? 0,
        flights: stats?.flights ?? 0,
        hotels: stats?.hotels ?? 0,
        by_classification: stats?.by_classification ?? {},
        by_region: stats?.by_region ?? {},
        by_cabin: stats?.by_cabin ?? {},
        price_min: stats?.price_min ?? 0,
        price_max: stats?.price_max ?? 0,
        price_avg: stats?.price_avg ?? 0,
        verified_count: stats?.verified_count ?? 0,
      },
      deals,
    };
  } catch {
    return getDealsFromStatic();
  }
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

// ──────────────────────────────────────────────
// Live search — llama a RapidAPI + Ryanair en caliente vía FastAPI
// ──────────────────────────────────────────────
export interface LiveSearchParams {
  origin: string;        // IATA (MAD, JFK…)
  destination: string;   // IATA
  date_out: string;      // YYYY-MM-DD
  cabin?: "economy" | "premium_economy" | "business" | "first";
  limit?: number;
}

/**
 * Llama a /api/search/live del FastAPI. El backend orquesta RapidAPI Sky
 * Scrapper + Ryanair en paralelo, cachea 15 min y devuelve top-N por precio.
 * Timeout de cliente: 25s (el server corta a 18s, dejamos margen para red).
 */
export async function searchDealsLive(params: LiveSearchParams): Promise<Deal[]> {
  const query = new URLSearchParams({
    origin: params.origin.toUpperCase(),
    destination: params.destination.toUpperCase(),
    date_out: params.date_out,
    cabin: params.cabin ?? "economy",
    limit: String(params.limit ?? 20),
  });

  const url = `${API_BASE}/api/search/live?${query.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
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
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getTopDeals(limit = 10): Promise<Deal[]> {
  try {
    const res = await fetch(`${API_BASE}/api/deals/top?limit=${limit}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      const data = await getDealsFromStatic();
      return data.deals.slice(0, limit);
    }
    return res.json();
  } catch {
    const data = await getDealsFromStatic();
    return data.deals.slice(0, limit);
  }
}

// Fallback: carga el deals.json estático en /public
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

  try {
    const res = await fetch("/deals.json", { cache: "no-store" });
    if (!res.ok) return emptyResponse;
    return res.json();
  } catch {
    return emptyResponse;
  }
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
