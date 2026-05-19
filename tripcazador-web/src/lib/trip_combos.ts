/**
 * trip_combos.ts — SSS325 (19 may 2026)
 *
 * Pure function que combina deals de vuelos + síntesis hotel para
 * proponer top-N combos (vuelo + hotel) a un destino+mes Premium.
 *
 * NOTA: existe un `trip_planner.ts` previo (F1) con propósito distinto
 * (genera itinerarios con Claude API). Este módulo es de combinación
 * coste vuelo+hotel — nombres separados para evitar confusión.
 *
 * Output: array ordenado asc por coste total (vuelo + nights × ppn).
 */

import { getHotelPriceHint } from "./hotel_price_hints";
import { synthCurrentPpn } from "./hotel_price_synth";

export interface PlannerFlightDeal {
  id?: string;
  origin?: string;
  destination?: string;
  city_to?: string;
  price_eur?: number;
  date_out?: string;
  date_ret?: string;
  airline_name?: string;
  airline?: string;
  savings_pct?: number;
  booking_url?: string;
}

export interface TripCombo {
  flight: PlannerFlightDeal;
  hotel: {
    city: string;
    ppn: number;
    nights: number;
    total_eur: number;
  };
  total_eur: number; // flight + hotel total
}

export interface PlannerInput {
  destinationIata: string;
  monthYYYYMM: string;
  nights: number;
  deals: PlannerFlightDeal[];
  /** Día actual — para hotel synth determinista. Default new Date(). */
  today?: Date;
  /** Cuántos combos devolver. Default 3. */
  limit?: number;
}

export function planTripCombos(input: PlannerInput): TripCombo[] {
  const today = input.today ?? new Date();
  const limit = input.limit ?? 3;
  const nights = Math.max(1, Math.min(60, input.nights));
  if (!/^[A-Z]{3}$/.test(input.destinationIata)) return [];
  if (!/^\d{4}-\d{2}$/.test(input.monthYYYYMM)) return [];

  const filtered = input.deals.filter(
    (d) =>
      d.destination === input.destinationIata &&
      typeof d.price_eur === "number" &&
      (d.price_eur ?? 0) > 0 &&
      typeof d.date_out === "string" &&
      d.date_out.startsWith(`${input.monthYYYYMM}-`),
  );
  if (filtered.length === 0) return [];

  // Dedupe por origin (más barato por ciudad de salida)
  const byOrigin = new Map<string, PlannerFlightDeal>();
  for (const d of filtered) {
    const k = d.origin || "??";
    const prev = byOrigin.get(k);
    if (!prev || (prev.price_eur ?? 0) > (d.price_eur ?? 0)) {
      byOrigin.set(k, d);
    }
  }
  const candidates = Array.from(byOrigin.values()).sort(
    (a, b) => (a.price_eur ?? 0) - (b.price_eur ?? 0),
  );

  const baselinePpn = getHotelPriceHint(input.destinationIata);

  const combos: TripCombo[] = candidates.slice(0, limit * 3).map((flight) => {
    const fDateIn = flight.date_out || `${input.monthYYYYMM}-15`;
    const fDateOut = addDays(fDateIn, nights);
    const ppn = synthCurrentPpn({
      city: input.destinationIata,
      date_in: fDateIn,
      date_out: fDateOut,
      baseline_ppn: baselinePpn,
      today,
    });
    const hotelTotal = Math.round(ppn * nights * 100) / 100;
    const flightPrice = flight.price_eur ?? 0;
    return {
      flight,
      hotel: {
        city: input.destinationIata,
        ppn,
        nights,
        total_eur: hotelTotal,
      },
      total_eur: Math.round((flightPrice + hotelTotal) * 100) / 100,
    };
  });

  combos.sort((a, b) => a.total_eur - b.total_eur);
  return combos.slice(0, limit);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
