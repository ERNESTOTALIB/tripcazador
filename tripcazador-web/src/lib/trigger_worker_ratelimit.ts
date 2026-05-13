/**
 * trigger_worker_ratelimit.ts — fase SSS155 (may-2026)
 *
 * State del rate-limit del endpoint /api/admin/trigger-worker.
 *
 * Antes vivía en route.ts y exportaba _resetRateLimitForTests, pero
 * Next.js 14 NO permite exports custom desde route.ts (solo HTTP methods
 * + config como `runtime`, `dynamic`, `revalidate`). El build de
 * production fallaba con:
 *   Type error: "_resetRateLimitForTests" is not a valid Route export field.
 *
 * → todo el deploy SSS154 se quedó en build anterior. Fix: mover state a
 * un módulo independiente.
 */

export const RATELIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 min

// In-memory state. Reset al deploy. Suficiente porque solo el owner llega
// al endpoint (cookie auth panel).
const lastTriggerByUser: Map<string, number> = new Map();

export function getLastTrigger(user: string): number {
  return lastTriggerByUser.get(user) || 0;
}

export function setLastTrigger(user: string, ts: number): void {
  lastTriggerByUser.set(user, ts);
}

export function resetRateLimitForTests(): void {
  lastTriggerByUser.clear();
}
