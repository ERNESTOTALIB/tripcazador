/**
 * savings_log_store.ts — SSS315 (19 may 2026)
 *
 * Registra los ahorros estimados que Premium ha generado al user. Cuando
 * un cron Premium (match-cron-premium o watchlist-cron) dispara un email
 * con un deal que matcheó una alert/watch, anotamos:
 *  - customerId, email
 *  - deal_id, origin, destination
 *  - savings_eur: lo que se ha ahorrado (vs max_price del alert ó vs
 *    price_when_added del watch)
 *  - source: "alert" | "watch"
 *  - ts
 *
 * El endpoint /api/premium/roi suma por customerId y devuelve total +
 * breakdown 30d/90d/all. UI en /panel/premium muestra widget grande
 * "Has ahorrado X€ con Premium".
 *
 * Por qué importa: la conversión Premium retiene si el user PERCIBE
 * el ROI. "Llevas 437€ ahorrados gracias a Premium" >>> que "tienes
 * Premium activo" para reducir churn.
 *
 * Store in-memory con fallback remoto SAVINGS_LOG_STORE_URL.
 */

export type SavingsSource = "alert" | "watch";

export interface SavingsEntry {
  id: string;
  customerId: string;
  email: string;
  deal_id: string;
  origin?: string;
  destination?: string;
  savings_eur: number;
  source: SavingsSource;
  ts: number;
}

const memoryStore: Map<string, SavingsEntry> = new Map();
const REMOTE_URL = process.env.SAVINGS_LOG_STORE_URL || "";
const REMOTE_TOKEN = process.env.SAVINGS_LOG_STORE_TOKEN || "";

function genId(): string {
  return `sv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function remote(
  method: "POST" | "GET",
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

export interface LogSavingsInput {
  customerId: string;
  email: string;
  deal_id: string;
  origin?: string;
  destination?: string;
  savings_eur: number;
  source: SavingsSource;
  ts?: number;
}

export async function logSavings(input: LogSavingsInput): Promise<SavingsEntry | null> {
  if (!input.customerId) return null;
  if (!Number.isFinite(input.savings_eur)) return null;
  if (input.savings_eur <= 0) return null; // no logueamos no-savings ni neg.

  const entry: SavingsEntry = {
    id: genId(),
    customerId: input.customerId,
    email: input.email.trim().toLowerCase(),
    deal_id: input.deal_id,
    origin: input.origin?.toUpperCase().slice(0, 3),
    destination: input.destination?.toUpperCase().slice(0, 3),
    savings_eur: Math.round(input.savings_eur * 100) / 100,
    source: input.source,
    ts: input.ts ?? Date.now(),
  };

  const r = await remote("POST", "/savings", entry);
  if (r && r.ok) {
    return ((await r.json().catch(() => entry)) as SavingsEntry) || entry;
  }
  memoryStore.set(entry.id, entry);
  return entry;
}

/**
 * SSS326: agrega total_eur por customerId (across all entries del store).
 * Útil para calcular percentile de cualquier user vs el resto. NO expone
 * customerIds individuales — solo cantidades para ranking.
 *
 * Devuelve un array de totales ordenado ascendente (para binary search).
 */
export async function aggregateTotalsAcrossCustomers(): Promise<number[]> {
  const r = await remote("GET", "/savings/totals-aggregated");
  if (r && r.ok) {
    const data = (await r.json().catch(() => null)) as { totals?: number[] } | null;
    if (data && Array.isArray(data.totals)) return [...data.totals].sort((a, b) => a - b);
  }
  // Fallback in-memory: agregamos por customerId
  const byCustomer = new Map<string, number>();
  for (const e of Array.from(memoryStore.values())) {
    byCustomer.set(e.customerId, (byCustomer.get(e.customerId) || 0) + e.savings_eur);
  }
  return Array.from(byCustomer.values()).sort((a, b) => a - b);
}

export async function listSavingsByCustomer(customerId: string): Promise<SavingsEntry[]> {
  if (!customerId) return [];
  const r = await remote("GET", `/savings/by-customer/${encodeURIComponent(customerId)}`);
  if (r && r.ok) {
    return (await r.json().catch(() => [])) as SavingsEntry[];
  }
  return Array.from(memoryStore.values()).filter((s) => s.customerId === customerId);
}

export interface SavingsSummary {
  total_eur: number;
  count: number;
  last_30d_eur: number;
  last_30d_count: number;
  last_90d_eur: number;
  last_90d_count: number;
  by_source: { alert: number; watch: number };
  /** Ahorro mediano por trigger — para storytelling */
  avg_per_trigger_eur: number;
  /** El trigger más grande (storytelling: "tu mayor chollo") */
  biggest_savings_eur: number;
  /** Fecha del primer trigger (storytelling: "desde X meses") */
  first_trigger_at: number | null;
}

export function summarize(
  entries: SavingsEntry[],
  now: number = Date.now(),
): SavingsSummary {
  if (!entries.length) {
    return {
      total_eur: 0,
      count: 0,
      last_30d_eur: 0,
      last_30d_count: 0,
      last_90d_eur: 0,
      last_90d_count: 0,
      by_source: { alert: 0, watch: 0 },
      avg_per_trigger_eur: 0,
      biggest_savings_eur: 0,
      first_trigger_at: null,
    };
  }
  const cutoff30 = now - 30 * 86_400_000;
  const cutoff90 = now - 90 * 86_400_000;
  let total = 0;
  let last30 = 0;
  let last30Count = 0;
  let last90 = 0;
  let last90Count = 0;
  let alertSum = 0;
  let watchSum = 0;
  let biggest = 0;
  let firstTs = entries[0].ts;
  for (const e of entries) {
    total += e.savings_eur;
    if (e.savings_eur > biggest) biggest = e.savings_eur;
    if (e.ts < firstTs) firstTs = e.ts;
    if (e.ts >= cutoff30) {
      last30 += e.savings_eur;
      last30Count += 1;
    }
    if (e.ts >= cutoff90) {
      last90 += e.savings_eur;
      last90Count += 1;
    }
    if (e.source === "alert") alertSum += e.savings_eur;
    else watchSum += e.savings_eur;
  }
  return {
    total_eur: round2(total),
    count: entries.length,
    last_30d_eur: round2(last30),
    last_30d_count: last30Count,
    last_90d_eur: round2(last90),
    last_90d_count: last90Count,
    by_source: { alert: round2(alertSum), watch: round2(watchSum) },
    avg_per_trigger_eur: round2(total / entries.length),
    biggest_savings_eur: round2(biggest),
    first_trigger_at: firstTs,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function _clearStore(): void {
  memoryStore.clear();
}
