/**
 * Deal type — debe estar en sync con `tripcazador-web/src/lib/api.ts` (Deal).
 *
 * Para evitar duplicación a futuro: idealmente extraer a `packages/types`
 * monorepo, pero por ahora copiamos los campos canónicos.
 */

export type DealType = 'flight' | 'hotel' | 'package';

export interface Deal {
  id: string;
  type: DealType;
  headline: string;
  origin: string; // IATA del origen
  destination: string; // IATA del destino
  city_from?: string;
  city_to: string;
  country_to: string;
  region?: string;
  price_eur: number;
  savings_pct?: number;
  savings_eur?: number;
  cabin?: string;
  airline?: string;
  airline_name?: string;
  nights?: number;
  date_out?: string; // ISO date
  date_ret?: string;
  booking_url: string;
  hot_until?: string; // ISO datetime
  is_secret?: boolean; // SSS318 Premium-only deals
  /** Score interno 0-100 — combinación de savings_pct + freshness */
  score?: number;
}

export interface DealsResponse {
  deals: Deal[];
  total?: number;
  updated_at?: string;
}
