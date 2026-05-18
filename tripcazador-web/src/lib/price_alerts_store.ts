/**
 * price_alerts_store.ts — SSS302 (18 may 2026)
 *
 * Persistencia in-memory para alertas de precio con tier-awareness.
 *
 * Premium delta (SSS302):
 *  - `tier`: "free" | "premium" → discrimina cuota y cadencia de match.
 *  - `customerId`: cuando tier=premium, Stripe customer cs_xxx (única forma
 *    de borrar/listar alertas Premium desde el panel sin pedir login).
 *  - `FREE_TIER_ALERT_QUOTA`: free max 3 alertas activas por email; Premium
 *    sin tope (validado en `createAlert` antes de persistir).
 *  - `listActiveAlertsByTier(tier)`: usado por el match-cron premium para
 *    filtrar solo alerts con tier="premium" (corre cada 5 min vs hora).
 *  - `listAlertsByCustomer(customerId)`: para gestión panel `/panel/premium/
 *    alertas`.
 *
 * Fallback remoto se mantiene (PRICE_ALERTS_STORE_URL) — los nuevos campos
 * son opt-in en el JSON wire format.
 */

export type AlertTier = "free" | "premium";

export interface PriceAlert {
  id: string;
  email: string;
  origin?: string;
  destination?: string;
  /**
   * SSS303 (Premium-only): permite múltiples orígenes ("BCN" OR "MAD" OR "VLC").
   * Si está definido y no vacío, `origin` se ignora en el matching.
   * Free tier no puede usarlo (validado en route).
   */
  origins?: string[];
  max_price: number;
  cabin?: "economy" | "business" | "first";
  date_min?: string; // YYYY-MM-DD
  date_max?: string;
  created_at: number;
  triggered_at: number | null;
  active: boolean;
  tier: AlertTier;
  customerId?: string;
}

export class QuotaExceededError extends Error {
  constructor(public limit: number, public currentCount: number) {
    super(`free_tier_quota_exceeded (${currentCount}/${limit})`);
    this.name = "QuotaExceededError";
  }
}

export const FREE_TIER_ALERT_QUOTA = 3;

const memoryStore: Map<string, PriceAlert> = new Map();
const REMOTE_URL = process.env.PRICE_ALERTS_STORE_URL || "";
const REMOTE_TOKEN = process.env.PRICE_ALERTS_STORE_TOKEN || "";

function genId(): string {
  return `pa_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
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

export async function createAlert(input: {
  email: string;
  origin?: string;
  destination?: string;
  origins?: string[]; // SSS303 Premium-only
  max_price: number;
  cabin?: "economy" | "business" | "first";
  date_min?: string;
  date_max?: string;
  tier?: AlertTier;
  customerId?: string;
}): Promise<PriceAlert> {
  const tier: AlertTier = input.tier === "premium" ? "premium" : "free";
  const normalizedEmail = input.email.trim().toLowerCase();

  // Quota check (free tier solo)
  if (tier === "free") {
    const existing = await countActiveByEmail(normalizedEmail);
    if (existing >= FREE_TIER_ALERT_QUOTA) {
      throw new QuotaExceededError(FREE_TIER_ALERT_QUOTA, existing);
    }
  }

  // origins (Premium-only): valida IATA + dedup + cap a 5
  const origins =
    tier === "premium" && Array.isArray(input.origins) && input.origins.length > 0
      ? Array.from(
          new Set(
            input.origins
              .map((o) => String(o).toUpperCase())
              .filter((o) => /^[A-Z]{3}$/.test(o)),
          ),
        ).slice(0, 5)
      : undefined;

  const alert: PriceAlert = {
    id: genId(),
    email: normalizedEmail,
    origin: input.origin?.toUpperCase().slice(0, 3),
    destination: input.destination?.toUpperCase().slice(0, 3),
    origins,
    max_price: input.max_price,
    cabin: input.cabin,
    date_min: input.date_min,
    date_max: input.date_max,
    created_at: Date.now(),
    triggered_at: null,
    active: true,
    tier,
    customerId: tier === "premium" ? input.customerId : undefined,
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

export async function listActiveAlertsByTier(tier: AlertTier): Promise<PriceAlert[]> {
  const r = await remote("GET", `/alerts/active?tier=${tier}`);
  if (r && r.ok) {
    return (await r.json().catch(() => [])) as PriceAlert[];
  }
  return Array.from(memoryStore.values()).filter(
    (a) => a.active && !a.triggered_at && (a.tier ?? "free") === tier,
  );
}

export async function listAlertsByCustomer(customerId: string): Promise<PriceAlert[]> {
  if (!customerId) return [];
  const r = await remote("GET", `/alerts/by-customer/${encodeURIComponent(customerId)}`);
  if (r && r.ok) {
    return (await r.json().catch(() => [])) as PriceAlert[];
  }
  return Array.from(memoryStore.values()).filter(
    (a) => a.customerId === customerId,
  );
}

export async function countActiveByEmail(email: string): Promise<number> {
  const norm = email.trim().toLowerCase();
  const r = await remote("GET", `/alerts/count-active?email=${encodeURIComponent(norm)}`);
  if (r && r.ok) {
    const data = (await r.json().catch(() => null)) as { count?: number } | null;
    if (data && typeof data.count === "number") return data.count;
  }
  return Array.from(memoryStore.values()).filter(
    (a) => a.email === norm && a.active && !a.triggered_at,
  ).length;
}

export async function deleteAlert(
  id: string,
  customerId?: string,
): Promise<boolean> {
  const r = await remote("DELETE", `/alerts/${id}`, { customerId });
  if (r && r.ok) return true;
  const a = memoryStore.get(id);
  if (!a) return false;
  // Si pasan customerId, exigir match (auth Premium).
  if (customerId && a.customerId !== customerId) return false;
  a.active = false;
  return true;
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
