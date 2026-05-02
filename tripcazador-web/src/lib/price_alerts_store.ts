/**
 * price_alerts_store.ts — fase ss-SS3 (closes #165)
 *
 * Persistencia in-memory para alertas de precio. Igual que subscribers_store,
 * con fallback a backend remoto si PRICE_ALERTS_STORE_URL está set.
 */

export interface PriceAlert {
  id: string;
  email: string;
  origin?: string;
  destination?: string;
  max_price: number;
  cabin?: "economy" | "business" | "first";
  date_min?: string; // YYYY-MM-DD
  date_max?: string;
  created_at: number;
  triggered_at: number | null;
  active: boolean;
}

const memoryStore: Map<string, PriceAlert> = new Map();
const REMOTE_URL = process.env.PRICE_ALERTS_STORE_URL || "";
const REMOTE_TOKEN = process.env.PRICE_ALERTS_STORE_TOKEN || "";

function genId(): string {
  return `pa_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function remote(method: "POST" | "GET", path: string, body?: unknown): Promise<Response | null> {
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

export async function createAlert(input: {
  email: string;
  origin?: string;
  destination?: string;
  max_price: number;
  cabin?: "economy" | "business" | "first";
  date_min?: string;
  date_max?: string;
}): Promise<PriceAlert> {
  const alert: PriceAlert = {
    id: genId(),
    email: input.email.trim().toLowerCase(),
    origin: input.origin?.toUpperCase().slice(0, 3),
    destination: input.destination?.toUpperCase().slice(0, 3),
    max_price: input.max_price,
    cabin: input.cabin,
    date_min: input.date_min,
    date_max: input.date_max,
    created_at: Date.now(),
    triggered_at: null,
    active: true,
  };

  const r = await remote("POST", "/alerts", alert);
  if (r && r.ok) {
    return ((await r.json().catch(() => alert)) as PriceAlert) || alert;
  }
  memoryStore.set(alert.id, alert);
  return alert;
}

export async function listActiveAlerts(): Promise<PriceAlert[]> {
  const r = await remote("GET", "/alerts/active");
  if (r && r.ok) {
    return (await r.json().catch(() => [])) as PriceAlert[];
  }
  return Array.from(memoryStore.values()).filter((a) => a.active && !a.triggered_at);
}

export async function markTriggered(id: string): Promise<void> {
  const r = await remote("POST", `/alerts/${id}/triggered`, {});
  if (r && r.ok) return;
  const a = memoryStore.get(id);
  if (a) {
    a.triggered_at = Date.now();
    a.active = false;
  }
}

export async function deactivateByEmail(email: string): Promise<void> {
  const norm = email.trim().toLowerCase();
  const r = await remote("POST", "/alerts/deactivate-email", { email: norm });
  if (r && r.ok) return;
  Array.from(memoryStore.values()).forEach((a) => {
    if (a.email === norm) a.active = false;
  });
}

export function _clearStore(): void {
  memoryStore.clear();
}
