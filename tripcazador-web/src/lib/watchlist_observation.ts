/**
 * watchlist_observation.ts — SSS314 (19 may 2026)
 *
 * Helper para el cron de watchlist Premium. Pure function — vive fuera
 * de route.ts porque Next.js no permite exports custom desde routes
 * (ver SSS312). Mantenerlo aquí también permite testarlo aislado.
 */

import type { WatchlistEntry } from "./watchlist_store";

export interface DealLite {
  id?: string;
  origin?: string;
  destination?: string;
  price_eur?: number;
  airline_name?: string;
  booking_url?: string;
  headline?: string;
  date_out?: string;
  date_ret?: string;
  savings_pct?: number;
}

export interface PriceObservation {
  price: number;
  deal: DealLite;
}

/**
 * Para una entry de watchlist, devuelve el precio observado actual
 * priorizando match exacto por deal_id, luego el deal más barato de
 * la misma ruta (origin+destination). Si no encuentra deal devuelve
 * null para que el cron lo marque como skipped.
 */
export function pickCurrentPrice(
  entry: WatchlistEntry,
  deals: DealLite[],
): PriceObservation | null {
  const exact = deals.find((d) => d.id === entry.deal_id);
  if (exact && typeof exact.price_eur === "number" && exact.price_eur > 0) {
    return { price: exact.price_eur, deal: exact };
  }
  const sameRoute = deals.filter(
    (d) =>
      d.origin === entry.origin &&
      d.destination === entry.destination &&
      typeof d.price_eur === "number" &&
      (d.price_eur ?? 0) > 0,
  );
  if (!sameRoute.length) return null;
  sameRoute.sort((a, b) => (a.price_eur ?? 0) - (b.price_eur ?? 0));
  const cheapest = sameRoute[0];
  return { price: cheapest.price_eur as number, deal: cheapest };
}
