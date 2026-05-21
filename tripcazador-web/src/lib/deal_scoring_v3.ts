/**
 * deal_scoring_v3.ts — SSS374 + SSS391 (21 may 2026)
 *
 * Wrapper sobre `deal_scoring_v2` que añade aprendizaje supervisado ligero
 * basado en feedback histórico:
 *
 *   - `recordOutcome(deal_id, outcome)` — operador o customer marca un
 *     deal como `booked`, `expired_no_takers`, `false_positive`.
 *   - `lookupRouteHistory(route_key)` — devuelve tasa de éxito histórica
 *     de la ruta + airline (booking_rate y false_positive_rate).
 *   - `scoreDealV3(deal)` — corre v2 + ajusta confidence con boost/penalty:
 *       · si la ruta tiene high_booking_rate (>40%) → +10pts boost
 *       · si la ruta tiene high_false_positive (>30%) → -15pts penalty
 *       · si poca data histórica (<3 outcomes) → sin ajuste
 *
 * Store en memoria con globalThis (persist warm container Vercel).
 * SSS391 — write-through KV: recordOutcome escribe en background a KV
 * (Upstash/Vercel KV o in-mem fallback). Reads usan in-memory (rápido).
 * Callers críticos pueden `await hydrateOutcomesFromKV()` antes de
 * lookups para asegurar consistencia cross-deploy.
 */

import { createKV } from "./kv_store";
import { scoreDealV2, type ScoringResult } from "./deal_scoring_v2";

const kv = createKV("scoring_v3");
const OUTCOMES_KV_KEY = "outcomes";

export type DealOutcome = "booked" | "expired_no_takers" | "false_positive" | "regular_sale";

interface OutcomeRecord {
  deal_id: string;
  route_key: string; // e.g. "MAD-NRT-NH" (origin-dest-airline)
  outcome: DealOutcome;
  ts: number;
}

interface FeedbackStore {
  outcomes: OutcomeRecord[];
}

const store: FeedbackStore = (
  globalThis as unknown as { __tc_scoring_feedback?: FeedbackStore }
).__tc_scoring_feedback ?? { outcomes: [] };
(globalThis as unknown as { __tc_scoring_feedback: FeedbackStore }).__tc_scoring_feedback =
  store;

export function recordOutcome(
  deal_id: string,
  route_key: string,
  outcome: DealOutcome,
): void {
  if (!deal_id || !route_key) return;
  store.outcomes.push({
    deal_id,
    route_key,
    outcome,
    ts: Date.now(),
  });
  // Trim oldest si > 5000 entries (memory cap)
  if (store.outcomes.length > 5000) {
    store.outcomes = store.outcomes.slice(-5000);
  }
  // SSS391 fire-and-forget KV write-through. No await porque la API
  // pública sigue siendo sync. Si KV falla, mantenemos la copia in-mem
  // (siguiente deploy puede perder el último batch pero no rompe nada).
  void kv.set(OUTCOMES_KV_KEY, store.outcomes).catch(() => {
    /* silenciado: in-mem es la fuente de verdad runtime */
  });
}

/**
 * SSS391 — hidrata in-mem outcomes desde KV. Idempotente.
 *
 * Callers críticos (admin scoring page, auto-feedback cron) deben await
 * esto antes de lookups para asegurar que la memoria refleja el último
 * snapshot persistido. Sin esto, un cold container empieza con outcomes
 * vacíos hasta que llegue el primer recordOutcome.
 *
 * Returns: número de outcomes cargados (0 si nada / KV vacío / error).
 */
export async function hydrateOutcomesFromKV(force = false): Promise<number> {
  if (!force && store.outcomes.length > 0) {
    // Ya hidratado en este container — skip
    return store.outcomes.length;
  }
  try {
    const remote = await kv.get<OutcomeRecord[]>(OUTCOMES_KV_KEY);
    if (Array.isArray(remote)) {
      store.outcomes = remote;
      return remote.length;
    }
  } catch {
    // ignorar
  }
  return 0;
}

export interface RouteHistoryStats {
  route_key: string;
  total_samples: number;
  booking_rate: number; // 0-1
  expired_rate: number;
  false_positive_rate: number;
  is_significant: boolean; // true if total_samples >= 3
}

export function lookupRouteHistory(route_key: string): RouteHistoryStats {
  const subset = store.outcomes.filter((o) => o.route_key === route_key);
  return aggregateStats(subset, route_key, 3); // ruta exacta: n>=3
}

function aggregateStats(
  subset: OutcomeRecord[],
  label: string,
  threshold: number,
): RouteHistoryStats {
  const total = subset.length;
  if (total === 0) {
    return {
      route_key: label,
      total_samples: 0,
      booking_rate: 0,
      expired_rate: 0,
      false_positive_rate: 0,
      is_significant: false,
    };
  }
  const booked = subset.filter((o) => o.outcome === "booked").length;
  const expired = subset.filter((o) => o.outcome === "expired_no_takers").length;
  const fp = subset.filter((o) => o.outcome === "false_positive").length;
  return {
    route_key: label,
    total_samples: total,
    booking_rate: booked / total,
    expired_rate: expired / total,
    false_positive_rate: fp / total,
    is_significant: total >= threshold,
  };
}

/**
 * SSS379 cross-route learning: agregado por aerolínea o por destino.
 * Útil cuando la ruta exacta no tiene suficientes muestras.
 */
export function lookupAirlineHistory(airline_code: string): RouteHistoryStats {
  const code = airline_code.toUpperCase();
  const subset = store.outcomes.filter((o) => o.route_key.endsWith(`-${code}`));
  return aggregateStats(subset, `*-*-${code}`, 5); // agregado broad: n>=5
}

export function lookupDestinationHistory(destination: string): RouteHistoryStats {
  const dst = destination.toUpperCase();
  // route_key format: ORIGIN-DEST-AIRLINE
  const subset = store.outcomes.filter((o) => {
    const parts = o.route_key.split("-");
    return parts.length === 3 && parts[1] === dst;
  });
  return aggregateStats(subset, `*-${dst}-*`, 5);
}

export interface ScoringResultV3 extends ScoringResult {
  v3_adjustment: number; // points added/subtracted vs v2
  v3_reason: string[];
  route_stats?: RouteHistoryStats;
}

export interface DealInputV3 {
  origin?: string;
  destination?: string;
  airline_code?: string;
  price_eur: number;
  savings_pct?: number;
  historical_avg_eur?: number;
  cabin?: string;
  hot_until?: string;
  date_out?: string;
  date_ret?: string;
  region?: string;
  nights?: number;
}

export function buildRouteKey(d: DealInputV3): string {
  const o = (d.origin || "XXX").toUpperCase();
  const dst = (d.destination || "XXX").toUpperCase();
  const a = (d.airline_code || "XX").toUpperCase();
  return `${o}-${dst}-${a}`;
}

export function scoreDealV3(deal: DealInputV3): ScoringResultV3 {
  const v2 = scoreDealV2({
    price_eur: deal.price_eur,
    savings_pct: deal.savings_pct,
    historical_avg_eur: deal.historical_avg_eur,
    airline_code: deal.airline_code,
    cabin: deal.cabin,
    hot_until: deal.hot_until,
    date_out: deal.date_out,
    date_ret: deal.date_ret,
    region: deal.region,
    nights: deal.nights,
  });

  const routeKey = buildRouteKey(deal);
  const stats = lookupRouteHistory(routeKey);

  let adjustment = 0;
  const v3Reason: string[] = [];

  // route_key requiere >=3 samples; aquí redefinimos un is_significant
  // específico para esa granularidad fina.
  const routeSignif = stats.total_samples >= 3;
  if (routeSignif) {
    if (stats.booking_rate > 0.4) {
      adjustment += 10;
      v3Reason.push(
        `Histórico positivo: ${Math.round(stats.booking_rate * 100)}% de bookings (n=${stats.total_samples})`,
      );
    }
    if (stats.false_positive_rate > 0.3) {
      adjustment -= 15;
      v3Reason.push(
        `Histórico falsos positivos: ${Math.round(stats.false_positive_rate * 100)}% (n=${stats.total_samples})`,
      );
    }
    if (stats.expired_rate > 0.7) {
      adjustment -= 5;
      v3Reason.push(
        `Ruta histórica: ${Math.round(stats.expired_rate * 100)}% expiran sin reserva`,
      );
    }
  } else {
    // SSS379 fallback: si ruta exacta sin suficientes muestras, usar
    // agregados por aerolínea + destino con peso menor (boost ±5).
    if (stats.total_samples > 0) {
      v3Reason.push(
        `Data exacta insuficiente (${stats.total_samples}) — buscando agregados`,
      );
    }
    if (deal.airline_code) {
      const airlineStats = lookupAirlineHistory(deal.airline_code);
      if (airlineStats.is_significant) {
        if (airlineStats.booking_rate > 0.4) {
          adjustment += 5;
          v3Reason.push(
            `Aerolínea ${deal.airline_code} histórica: ${Math.round(airlineStats.booking_rate * 100)}% booking (n=${airlineStats.total_samples})`,
          );
        } else if (airlineStats.false_positive_rate > 0.4) {
          adjustment -= 8;
          v3Reason.push(
            `Aerolínea ${deal.airline_code} histórica: ${Math.round(airlineStats.false_positive_rate * 100)}% FP (n=${airlineStats.total_samples})`,
          );
        }
      }
    }
    if (deal.destination) {
      const destStats = lookupDestinationHistory(deal.destination);
      if (destStats.is_significant) {
        if (destStats.booking_rate > 0.4) {
          adjustment += 3;
          v3Reason.push(
            `Destino ${deal.destination} histórico: ${Math.round(destStats.booking_rate * 100)}% booking (n=${destStats.total_samples})`,
          );
        }
      }
    }
  }

  const adjusted = Math.max(0, Math.min(100, v2.confidence_score + adjustment));

  // Recalcular label si cruza umbral con ajuste
  let label = v2.label;
  if (adjustment !== 0) {
    if (adjusted >= 85) label = "verified_error_fare";
    else if (adjusted >= 65) label = "likely_error";
    else if (adjusted >= 35) label = "regular_sale";
    else label = "uncertain";
  }

  return {
    ...v2,
    confidence_score: adjusted,
    label,
    v3_adjustment: adjustment,
    v3_reason: v3Reason,
    route_stats: stats.total_samples > 0 ? stats : undefined,
  };
}

/** Test-only helper para limpiar store + KV in-mem. */
export function __resetForTests(): void {
  store.outcomes = [];
  void kv.del(OUTCOMES_KV_KEY).catch(() => {});
}

export const __test__ = {
  store,
};
