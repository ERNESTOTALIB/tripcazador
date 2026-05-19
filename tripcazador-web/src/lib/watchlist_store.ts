/**
 * watchlist_store.ts — SSS314 (19 may 2026)
 *
 * Premium "Watch this deal" — el user guarda un deal específico desde
 * `/deals/[id]` y un cron diario checkea el precio actual. Si baja
 * un threshold (default 10%) se dispara email + se marca triggered.
 *
 * Diferencia clave vs price_alerts_store:
 *  - Alertas son patrones (origin+destination+max_price) — matchean
 *    cualquier deal que entre.
 *  - Watchlist es DEAL-SPECIFIC. Una entry sigue UN deal_id concreto
 *    y le hace tracking del precio en el tiempo.
 *
 * In-memory store con fallback remoto (WATCHLIST_STORE_URL).
 * Quota: 50 watches activos por customerId (defense memoria).
 */

export interface WatchlistEntry {
  id: string;
  customerId: string; // Stripe cus_xxx
  email: string; // a quién avisar
  deal_id: string;
  origin: string;
  destination: string;
  /** Precio cuando el user añadió el watch */
  price_when_added: number;
  /** % de bajada que dispara la alerta (5 = 5%) */
  target_drop_pct: number;
  /** Headline para el email — snapshot al añadir */
  headline?: string;
  /** Datos extra para enriquecer el email cuando dispare */
  airline_name?: string;
  date_out?: string;
  date_ret?: string;
  created_at: number;
  last_checked_at: number | null;
  last_seen_price: number | null;
  triggered_at: number | null;
  /** Precio al que disparó (para mostrar "bajó de X→Y") */
  triggered_price?: number;
  active: boolean;
}

export class WatchlistQuotaError extends Error {
  constructor(
    public limit: number,
    public currentCount: number,
  ) {
    super(`watchlist_quota_exceeded (${currentCount}/${limit})`);
    this.name = "WatchlistQuotaError";
  }
}

export const WATCHLIST_QUOTA = 50;
export const DEFAULT_DROP_PCT = 10;
export const MIN_DROP_PCT = 3;
export const MAX_DROP_PCT = 50;

const memoryStore: Map<string, WatchlistEntry> = new Map();
const REMOTE_URL = process.env.WATCHLIST_STORE_URL || "";
const REMOTE_TOKEN = process.env.WATCHLIST_STORE_TOKEN || "";

function genId(): string {
  return `wl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
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

export interface CreateWatchlistInput {
  customerId: string;
  email: string;
  deal_id: string;
  origin: string;
  destination: string;
  price_when_added: number;
  target_drop_pct?: number;
  headline?: string;
  airline_name?: string;
  date_out?: string;
  date_ret?: string;
}

export async function createWatch(input: CreateWatchlistInput): Promise<WatchlistEntry> {
  if (!input.customerId) throw new Error("customerId_required");
  if (!input.deal_id) throw new Error("deal_id_required");

  const existing = await listWatchesByCustomer(input.customerId);
  const active = existing.filter((w) => w.active);
  if (active.length >= WATCHLIST_QUOTA) {
    throw new WatchlistQuotaError(WATCHLIST_QUOTA, active.length);
  }

  // Dedupe: si ya tiene un watch activo para el mismo deal_id, devolverlo
  const dup = active.find((w) => w.deal_id === input.deal_id);
  if (dup) return dup;

  const targetDrop = clampDropPct(input.target_drop_pct ?? DEFAULT_DROP_PCT);

  const entry: WatchlistEntry = {
    id: genId(),
    customerId: input.customerId,
    email: input.email.trim().toLowerCase(),
    deal_id: input.deal_id,
    origin: input.origin.toUpperCase().slice(0, 3),
    destination: input.destination.toUpperCase().slice(0, 3),
    price_when_added: Math.round(input.price_when_added * 100) / 100,
    target_drop_pct: targetDrop,
    headline: input.headline?.slice(0, 200),
    airline_name: input.airline_name?.slice(0, 60),
    date_out: input.date_out,
    date_ret: input.date_ret,
    created_at: Date.now(),
    last_checked_at: null,
    last_seen_price: null,
    triggered_at: null,
    active: true,
  };

  const r = await remote("POST", "/watchlist", entry);
  if (r && r.ok) {
    return ((await r.json().catch(() => entry)) as WatchlistEntry) || entry;
  }
  memoryStore.set(entry.id, entry);
  return entry;
}

export function clampDropPct(p: number): number {
  if (!Number.isFinite(p)) return DEFAULT_DROP_PCT;
  return Math.max(MIN_DROP_PCT, Math.min(MAX_DROP_PCT, Math.round(p)));
}

export async function listActiveWatches(): Promise<WatchlistEntry[]> {
  const r = await remote("GET", "/watchlist/active");
  if (r && r.ok) {
    return (await r.json().catch(() => [])) as WatchlistEntry[];
  }
  return Array.from(memoryStore.values()).filter((w) => w.active && !w.triggered_at);
}

export async function listWatchesByCustomer(customerId: string): Promise<WatchlistEntry[]> {
  if (!customerId) return [];
  const r = await remote("GET", `/watchlist/by-customer/${encodeURIComponent(customerId)}`);
  if (r && r.ok) {
    return (await r.json().catch(() => [])) as WatchlistEntry[];
  }
  return Array.from(memoryStore.values()).filter((w) => w.customerId === customerId);
}

export async function deleteWatch(id: string, customerId: string): Promise<boolean> {
  const r = await remote("DELETE", `/watchlist/${id}`, { customerId });
  if (r && r.ok) return true;
  const w = memoryStore.get(id);
  if (!w) return false;
  if (w.customerId !== customerId) return false; // auth check
  w.active = false;
  return true;
}

export async function recordPriceCheck(
  id: string,
  observedPrice: number,
): Promise<void> {
  const r = await remote("PATCH", `/watchlist/${id}/checked`, { observedPrice });
  if (r && r.ok) return;
  const w = memoryStore.get(id);
  if (w) {
    w.last_checked_at = Date.now();
    w.last_seen_price = Math.round(observedPrice * 100) / 100;
  }
}

export async function markWatchTriggered(
  id: string,
  triggeredPrice: number,
): Promise<void> {
  const r = await remote("POST", `/watchlist/${id}/triggered`, { triggeredPrice });
  if (r && r.ok) return;
  const w = memoryStore.get(id);
  if (w) {
    w.triggered_at = Date.now();
    w.triggered_price = Math.round(triggeredPrice * 100) / 100;
    w.active = false;
  }
}

/**
 * Calcula si una observación de precio dispara el watch.
 * Pure function — fácil de testear y reutilizable en el cron.
 */
export function shouldTrigger(entry: WatchlistEntry, observedPrice: number): boolean {
  if (!entry.active || entry.triggered_at) return false;
  if (!Number.isFinite(observedPrice) || observedPrice <= 0) return false;
  if (entry.price_when_added <= 0) return false;
  const dropPct = ((entry.price_when_added - observedPrice) / entry.price_when_added) * 100;
  return dropPct >= entry.target_drop_pct;
}

export function _clearStore(): void {
  memoryStore.clear();
}
