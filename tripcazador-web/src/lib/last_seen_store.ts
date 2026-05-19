/**
 * last_seen_store.ts — SSS322 (19 may 2026)
 *
 * Track last_seen_at por customerId Premium. Se actualiza cuando el
 * user abre /panel/premium (heartbeat client-side). Lo usa el cron
 * anti-churn diario para detectar Premium con > 14d sin login y
 * enviar email winback.
 *
 * Store in-memory + fallback remoto LAST_SEEN_STORE_URL.
 *
 * Implementación: un Map customerId → ts. Reescribimos en cada
 * heartbeat (no acumulamos histórico — solo importa "cuándo fue la
 * última vez").
 */

const memoryStore: Map<string, number> = new Map();
const REMOTE_URL = process.env.LAST_SEEN_STORE_URL || "";
const REMOTE_TOKEN = process.env.LAST_SEEN_STORE_TOKEN || "";

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

export async function recordLastSeen(customerId: string, ts: number = Date.now()): Promise<void> {
  if (!customerId) return;
  const r = await remote("POST", "/last-seen", { customerId, ts });
  if (r && r.ok) return;
  memoryStore.set(customerId, ts);
}

export async function getLastSeen(customerId: string): Promise<number | null> {
  if (!customerId) return null;
  const r = await remote("GET", `/last-seen/${encodeURIComponent(customerId)}`);
  if (r && r.ok) {
    const data = (await r.json().catch(() => null)) as { ts?: number } | null;
    return data?.ts ?? null;
  }
  return memoryStore.get(customerId) ?? null;
}

/**
 * Pure function: determina si un customer califica para email winback.
 * Reglas:
 *  - Si NUNCA hicieron heartbeat (last_seen=null), usamos referenceTs como
 *    proxy de "actividad" (created_at de su primera alerta o suscripción).
 *  - Si last_seen >= cutoff (14d ago), no califica.
 *  - Si last_seen < cutoff, califica (ha pasado mucho tiempo).
 *
 * Esto es testeable sin tocar el store.
 */
export const WINBACK_CUTOFF_DAYS = 14;
export const WINBACK_CUTOFF_MS = WINBACK_CUTOFF_DAYS * 24 * 60 * 60 * 1000;

export function qualifiesForWinback(
  lastSeen: number | null,
  referenceTs: number,
  now: number = Date.now(),
): boolean {
  const effectiveLastSeen = lastSeen ?? referenceTs;
  if (!Number.isFinite(effectiveLastSeen) || effectiveLastSeen > now) return false;
  return now - effectiveLastSeen >= WINBACK_CUTOFF_MS;
}

export function _clearStore(): void {
  memoryStore.clear();
}

export function _seedForTest(customerId: string, ts: number): void {
  memoryStore.set(customerId, ts);
}
