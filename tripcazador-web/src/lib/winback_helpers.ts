/**
 * winback_helpers.ts — SSS322 (19 may 2026)
 *
 * Pure helpers para el cron anti-churn. Fuera de route.ts por SSS312.
 *  - pickFavoriteRoute: agrupa las alertas del user y devuelve la ruta
 *    más frecuente (count desc → tiebreak por más antigua).
 *  - pickTopDealsForRoute: devuelve los N mejores deals filtrando por
 *    ruta favorita si la hay (con fallback al top global por savings_pct).
 */

import type { PriceAlert } from "./price_alerts_store";
import type { WinbackTopDeal } from "./winback_email";

interface RouteCount {
  origin: string;
  destination: string;
  count: number;
  oldestTs: number;
}

export function pickFavoriteRoute(
  alerts: PriceAlert[],
): { origin: string; destination: string } | null {
  const map = new Map<string, RouteCount>();
  for (const a of alerts) {
    if (!a.origin || !a.destination) continue;
    const key = `${a.origin}-${a.destination}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      if (a.created_at < existing.oldestTs) existing.oldestTs = a.created_at;
    } else {
      map.set(key, {
        origin: a.origin,
        destination: a.destination,
        count: 1,
        oldestTs: a.created_at,
      });
    }
  }
  if (map.size === 0) return null;
  const arr = Array.from(map.values());
  arr.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.oldestTs - b.oldestTs;
  });
  return { origin: arr[0].origin, destination: arr[0].destination };
}

export function pickTopDealsForRoute(
  deals: WinbackTopDeal[],
  route: { origin: string; destination: string } | null,
  limit: number,
): WinbackTopDeal[] {
  // 1. Si hay ruta favorita, intentamos filtrar primero
  if (route) {
    const onRoute = deals.filter(
      (d) => d.origin === route.origin && d.destination === route.destination,
    );
    if (onRoute.length > 0) {
      onRoute.sort((a, b) => (b.savings_pct ?? 0) - (a.savings_pct ?? 0));
      return onRoute.slice(0, limit);
    }
  }
  // 2. Fallback: top por savings_pct global
  const sorted = [...deals]
    .filter((d) => d.price_eur && d.price_eur > 0)
    .sort((a, b) => (b.savings_pct ?? 0) - (a.savings_pct ?? 0));
  return sorted.slice(0, limit);
}
