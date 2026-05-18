/**
 * saved_searches_store.ts — SSS303 (18 may 2026)
 *
 * Búsquedas guardadas Premium-only. Cada user (identificado por
 * customerId Stripe) puede guardar combinaciones nombradas de filtros
 * pro (airlines/cabin_exact/stops_exact/time + price_max + origin/dest).
 *
 * Posteriormente desde /panel/premium/busquedas el user las reabre con
 * 1 click → /deals?airlines=...&cabin_exact=...&saved=<id>.
 *
 * In-memory store con fallback remoto (SAVED_SEARCHES_STORE_URL).
 * Quota: máx 25 búsquedas guardadas por customerId (defense para que
 * no explote memoria si alguien hace fuzz).
 */

export interface SavedSearch {
  id: string;
  customerId: string;
  name: string;
  airlines: string[];
  cabin: "any" | "economy" | "premium_economy" | "business" | "first";
  stops: "any" | "0" | "1" | "2plus";
  timeBand: "any" | "early" | "morning" | "afternoon" | "evening";
  origin?: string;
  destination?: string;
  max_price?: number;
  created_at: number;
}

export class SavedSearchQuotaError extends Error {
  constructor(public limit: number, public currentCount: number) {
    super(`saved_search_quota_exceeded (${currentCount}/${limit})`);
    this.name = "SavedSearchQuotaError";
  }
}

export const SAVED_SEARCH_QUOTA = 25;
export const SAVED_SEARCH_NAME_MAX = 60;

const memoryStore: Map<string, SavedSearch> = new Map();
const REMOTE_URL = process.env.SAVED_SEARCHES_STORE_URL || "";
const REMOTE_TOKEN = process.env.SAVED_SEARCHES_STORE_TOKEN || "";

function genId(): string {
  return `ss_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function remote(
  method: "POST" | "GET" | "DELETE",
  path: string,
  body?: unknown,
): Promise<Response | null> {
  if (!REMOTE_URL || !REMOTE_TOKEN) return null;
  try {
    return await fetch(`${REMOTE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${REMOTE_TOKEN}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

export interface SavedSearchInput {
  customerId: string;
  name: string;
  airlines?: string[];
  cabin?: SavedSearch["cabin"];
  stops?: SavedSearch["stops"];
  timeBand?: SavedSearch["timeBand"];
  origin?: string;
  destination?: string;
  max_price?: number;
}

export async function createSavedSearch(input: SavedSearchInput): Promise<SavedSearch> {
  if (!input.customerId) throw new Error("customerId_required");
  const existing = await listSavedSearches(input.customerId);
  if (existing.length >= SAVED_SEARCH_QUOTA) {
    throw new SavedSearchQuotaError(SAVED_SEARCH_QUOTA, existing.length);
  }

  const name = input.name.trim().slice(0, SAVED_SEARCH_NAME_MAX);
  if (!name) throw new Error("name_required");

  const search: SavedSearch = {
    id: genId(),
    customerId: input.customerId,
    name,
    airlines: Array.isArray(input.airlines)
      ? input.airlines.slice(0, 20).filter((a) => /^[A-Z0-9]{2,3}$/.test(a))
      : [],
    cabin: input.cabin ?? "any",
    stops: input.stops ?? "any",
    timeBand: input.timeBand ?? "any",
    origin: input.origin?.toUpperCase().slice(0, 3),
    destination: input.destination?.toUpperCase().slice(0, 3),
    max_price: typeof input.max_price === "number" ? input.max_price : undefined,
    created_at: Date.now(),
  };

  const r = await remote("POST", "/searches", search);
  if (r && r.ok) {
    return ((await r.json().catch(() => search)) as SavedSearch) || search;
  }
  memoryStore.set(search.id, search);
  return search;
}

export async function listSavedSearches(customerId: string): Promise<SavedSearch[]> {
  if (!customerId) return [];
  const r = await remote("GET", `/searches/by-customer/${encodeURIComponent(customerId)}`);
  if (r && r.ok) {
    return ((await r.json().catch(() => [])) as SavedSearch[]) || [];
  }
  return Array.from(memoryStore.values())
    .filter((s) => s.customerId === customerId)
    .sort((a, b) => b.created_at - a.created_at);
}

export async function deleteSavedSearch(
  id: string,
  customerId: string,
): Promise<boolean> {
  if (!id || !customerId) return false;
  const r = await remote("DELETE", `/searches/${id}`, { customerId });
  if (r && r.ok) return true;
  const s = memoryStore.get(id);
  if (!s || s.customerId !== customerId) return false;
  memoryStore.delete(id);
  return true;
}

export function buildSearchUrl(s: SavedSearch): string {
  const params = new URLSearchParams();
  if (s.airlines.length) params.set("airlines", s.airlines.join(","));
  if (s.cabin !== "any") params.set("cabin_exact", s.cabin);
  if (s.stops !== "any") params.set("stops_exact", s.stops);
  if (s.timeBand !== "any") params.set("time", s.timeBand);
  if (s.origin) params.set("origin", s.origin);
  if (s.destination) params.set("destination", s.destination);
  if (typeof s.max_price === "number") params.set("price_max", String(s.max_price));
  params.set("saved", s.id);
  return `/deals?${params.toString()}`;
}

export function _clearStore(): void {
  memoryStore.clear();
}
