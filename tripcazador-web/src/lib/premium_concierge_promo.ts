/**
 * premium_concierge_promo.ts — SSS303 (18 may 2026)
 *
 * "1 consulta concierge gratis al mes" para suscriptores Premium.
 *
 * Tracking simple in-memory: Map<customerId, Set<YYYY-MM>> = meses en que
 * el customer YA usó su promo. El endpoint /api/concierge consume esto:
 *  - si el body trae { premium_promo: true, customer_id: cs_xxx }
 *    y el customer no ha usado el promo este mes → marca usado + crea
 *    el ticket con tier="express" gratis (sin Stripe Checkout).
 *  - si ya lo usó este mes → 402 quota_exceeded + sugerencia upgrade.
 *
 * Como todo en este código, el store es in-memory + fallback remoto.
 * En PROD se reemplazará por Cloudflare D1 cuando exista.
 */

const memoryStore: Map<string, Set<string>> = new Map();
const REMOTE_URL = process.env.PREMIUM_PROMO_STORE_URL || "";
const REMOTE_TOKEN = process.env.PREMIUM_PROMO_STORE_TOKEN || "";

function currentMonthISO(): string {
  return new Date().toISOString().slice(0, 7);
}

async function remote(method: "GET" | "POST", path: string, body?: unknown): Promise<Response | null> {
  if (!REMOTE_URL || !REMOTE_TOKEN) return null;
  try {
    return await fetch(`${REMOTE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${REMOTE_TOKEN}` },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

export async function hasUsedPromoThisMonth(customerId: string): Promise<boolean> {
  if (!customerId) return true; // sin customer no se otorga
  const month = currentMonthISO();
  const r = await remote("GET", `/promo/${encodeURIComponent(customerId)}/${month}`);
  if (r && r.ok) {
    const data = (await r.json().catch(() => null)) as { used?: boolean } | null;
    if (data) return Boolean(data.used);
  }
  return memoryStore.get(customerId)?.has(month) ?? false;
}

export async function markPromoUsed(customerId: string): Promise<void> {
  if (!customerId) return;
  const month = currentMonthISO();
  const r = await remote("POST", `/promo/${encodeURIComponent(customerId)}/${month}`, { used: true });
  if (r && r.ok) return;
  const set = memoryStore.get(customerId) ?? new Set();
  set.add(month);
  memoryStore.set(customerId, set);
}

export function _clearPromoStore(): void {
  memoryStore.clear();
}
