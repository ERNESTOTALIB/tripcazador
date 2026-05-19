/**
 * hotel_watchlist_store.ts — SSS323 (19 may 2026)
 *
 * Vertical paralela a watchlist_store.ts pero para HOTELES.
 * Premium "Watch this hotel" guarda una combinación (city, date_in,
 * date_out, price_per_night_baseline, target_drop_pct) y un cron diario
 * checkea si el precio sintético-actual bajó del threshold → email.
 *
 * Diferencias clave vs flight watchlist:
 *  - "deal_id" no aplica (no tenemos hotel deal IDs). Identificamos por
 *    city + fechas → key compuesta.
 *  - price_per_night (no total) — alinea con cómo Booking muestra precios.
 *  - city normalizada UPPERCASE (LIS, BCN, PMI). Usamos IATA-like del
 *    hotel_seed.ts catálogo.
 *
 * Reusa REMOTE_URL pattern + quota 50/customer.
 */

export interface HotelWatchEntry {
  id: string;
  customerId: string;
  email: string;
  city: string; // IATA-like del catálogo hoteles
  date_in: string; // YYYY-MM-DD
  date_out: string; // YYYY-MM-DD
  price_per_night_baseline: number;
  target_drop_pct: number;
  city_name?: string; // ej "Lisboa" (display only)
  created_at: number;
  last_checked_at: number | null;
  last_seen_ppn: number | null;
  triggered_at: number | null;
  triggered_ppn?: number;
  active: boolean;
}

export class HotelWatchQuotaError extends Error {
  constructor(public limit: number, public currentCount: number) {
    super(`hotel_watchlist_quota_exceeded (${currentCount}/${limit})`);
    this.name = "HotelWatchQuotaError";
  }
}

export const HOTEL_WATCH_QUOTA = 50;
export const HOTEL_DEFAULT_DROP_PCT = 10;
export const HOTEL_MIN_DROP_PCT = 3;
export const HOTEL_MAX_DROP_PCT = 50;

const memoryStore: Map<string, HotelWatchEntry> = new Map();
const REMOTE_URL = process.env.HOTEL_WATCHLIST_STORE_URL || "";
const REMOTE_TOKEN = process.env.HOTEL_WATCHLIST_STORE_TOKEN || "";

function genId(): string {
  return `hw_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function remote(
  method: "POST" | "GET" | "DELETE" | "PATCH",
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

export interface CreateHotelWatchInput {
  customerId: string;
  email: string;
  city: string;
  date_in: string;
  date_out: string;
  price_per_night_baseline: number;
  target_drop_pct?: number;
  city_name?: string;
}

export function clampHotelDropPct(p: number): number {
  if (!Number.isFinite(p)) return HOTEL_DEFAULT_DROP_PCT;
  return Math.max(HOTEL_MIN_DROP_PCT, Math.min(HOTEL_MAX_DROP_PCT, Math.round(p)));
}

export async function createHotelWatch(input: CreateHotelWatchInput): Promise<HotelWatchEntry> {
  if (!input.customerId) throw new Error("customerId_required");
  if (!input.city) throw new Error("city_required");
  if (!input.date_in || !input.date_out) throw new Error("dates_required");
  if (input.date_in >= input.date_out) throw new Error("date_range_invalid");

  const existing = await listHotelWatchesByCustomer(input.customerId);
  const active = existing.filter((w) => w.active);
  if (active.length >= HOTEL_WATCH_QUOTA) {
    throw new HotelWatchQuotaError(HOTEL_WATCH_QUOTA, active.length);
  }

  // Dedupe: city + date_in + date_out activo
  const city = input.city.toUpperCase().slice(0, 4);
  const dup = active.find(
    (w) =>
      w.city === city && w.date_in === input.date_in && w.date_out === input.date_out,
  );
  if (dup) return dup;

  const target = clampHotelDropPct(input.target_drop_pct ?? HOTEL_DEFAULT_DROP_PCT);

  const entry: HotelWatchEntry = {
    id: genId(),
    customerId: input.customerId,
    email: input.email.trim().toLowerCase(),
    city,
    date_in: input.date_in,
    date_out: input.date_out,
    price_per_night_baseline: Math.round(input.price_per_night_baseline * 100) / 100,
    target_drop_pct: target,
    city_name: input.city_name?.slice(0, 60),
    created_at: Date.now(),
    last_checked_at: null,
    last_seen_ppn: null,
    triggered_at: null,
    active: true,
  };

  const r = await remote("POST", "/hotel-watchlist", entry);
  if (r && r.ok) {
    return ((await r.json().catch(() => entry)) as HotelWatchEntry) || entry;
  }
  memoryStore.set(entry.id, entry);
  return entry;
}

export async function listActiveHotelWatches(): Promise<HotelWatchEntry[]> {
  const r = await remote("GET", "/hotel-watchlist/active");
  if (r && r.ok) {
    return (await r.json().catch(() => [])) as HotelWatchEntry[];
  }
  return Array.from(memoryStore.values()).filter((w) => w.active && !w.triggered_at);
}

export async function listHotelWatchesByCustomer(customerId: string): Promise<HotelWatchEntry[]> {
  if (!customerId) return [];
  const r = await remote("GET", `/hotel-watchlist/by-customer/${encodeURIComponent(customerId)}`);
  if (r && r.ok) {
    return (await r.json().catch(() => [])) as HotelWatchEntry[];
  }
  return Array.from(memoryStore.values()).filter((w) => w.customerId === customerId);
}

export async function deleteHotelWatch(id: string, customerId: string): Promise<boolean> {
  const r = await remote("DELETE", `/hotel-watchlist/${id}`, { customerId });
  if (r && r.ok) return true;
  const w = memoryStore.get(id);
  if (!w) return false;
  if (w.customerId !== customerId) return false;
  w.active = false;
  return true;
}

export async function recordHotelPriceCheck(id: string, observedPpn: number): Promise<void> {
  const r = await remote("PATCH", `/hotel-watchlist/${id}/checked`, { observedPpn });
  if (r && r.ok) return;
  const w = memoryStore.get(id);
  if (w) {
    w.last_checked_at = Date.now();
    w.last_seen_ppn = Math.round(observedPpn * 100) / 100;
  }
}

export async function markHotelWatchTriggered(id: string, triggeredPpn: number): Promise<void> {
  const r = await remote("POST", `/hotel-watchlist/${id}/triggered`, { triggeredPpn });
  if (r && r.ok) return;
  const w = memoryStore.get(id);
  if (w) {
    w.triggered_at = Date.now();
    w.triggered_ppn = Math.round(triggeredPpn * 100) / 100;
    w.active = false;
  }
}

export function shouldTriggerHotel(entry: HotelWatchEntry, observedPpn: number): boolean {
  if (!entry.active || entry.triggered_at) return false;
  if (!Number.isFinite(observedPpn) || observedPpn <= 0) return false;
  if (entry.price_per_night_baseline <= 0) return false;
  const drop =
    ((entry.price_per_night_baseline - observedPpn) / entry.price_per_night_baseline) * 100;
  return drop >= entry.target_drop_pct;
}

export function _clearStore(): void {
  memoryStore.clear();
}
