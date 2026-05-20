/**
 * deal_scoring_v2.ts — SSS366 (21 may 2026)
 *
 * Mejora del scorer heurístico (v1 = pure savings_pct + freshness).
 * v2 añade signals adicionales para detectar "verified error fare" vs
 * "regular sale":
 *
 *   - savings_pct (45% peso) — más descuento = más probable error
 *   - price_anomaly (25% peso) — precio vs histórico mes mismo año
 *   - airline_reliability (10% peso) — algunas aerolíneas (Cathay,
 *     Korean) son notorias por error fares
 *   - cabin_tier_anomaly (10% peso) — Business < €500 = casi siempre error
 *   - freshness (5% peso) — hace cuánto se cazó
 *   - data_completeness (5% peso) — penaliza deals con menos info
 *
 * Output: { confidence_score: 0-100, label: "verified_error_fare" |
 *   "likely_error" | "regular_sale" | "uncertain", reasoning: string[] }
 *
 * Sin ML real todavía — heurístico determinista pero más sofisticado.
 * Cuando tengamos histórico suficiente de "deals reservados vs
 * expirados", entrenar modelo real con esto como baseline.
 */

interface DealInput {
  price_eur: number;
  savings_pct?: number;
  /** Precio histórico mes mismo año (si disponible) */
  historical_avg_eur?: number;
  airline_code?: string;
  cabin?: string;
  hot_until?: string;
  date_out?: string;
  date_ret?: string;
  region?: string;
  nights?: number;
}

/** Aerolíneas con historia de error fares (data interna 2024-2025) */
const ERROR_FARE_AIRLINES = new Set([
  "KE", "CX", "QR", "EY", "NH", "JL", "TG", "SQ", "LH", "OS", "TP",
  "AF", "KL", "BA", "AZ", "AY", "FI", "EK",
]);

/** Aerolíneas low-cost (descuentos suelen ser reales, no errores) */
const LOWCOST_AIRLINES = new Set([
  "FR", "U2", "VY", "W6", "DY", "BT", "PC", "F8", "EW", "X3",
]);

export interface ScoringResult {
  confidence_score: number; // 0-100
  label: "verified_error_fare" | "likely_error" | "regular_sale" | "uncertain";
  reasoning: string[];
  components: {
    savings_score: number;
    anomaly_score: number;
    airline_score: number;
    cabin_score: number;
    freshness_score: number;
    data_score: number;
  };
}

export function scoreDealV2(deal: DealInput): ScoringResult {
  const reasoning: string[] = [];

  // 1. Savings score (0-100, weight 45%)
  const savingsPct = deal.savings_pct ?? 0;
  let savingsScore = 0;
  if (savingsPct >= 60) {
    savingsScore = 95;
    reasoning.push(`Descuento extremo ${savingsPct}% (>60%) — muy probable error fare`);
  } else if (savingsPct >= 45) {
    savingsScore = 75;
    reasoning.push(`Descuento alto ${savingsPct}%`);
  } else if (savingsPct >= 30) {
    savingsScore = 55;
    reasoning.push(`Descuento moderado ${savingsPct}%`);
  } else if (savingsPct >= 15) {
    savingsScore = 30;
    reasoning.push(`Descuento bajo ${savingsPct}%`);
  } else {
    savingsScore = 10;
  }

  // 2. Price anomaly score (0-100, weight 25%)
  let anomalyScore = 50; // neutral si no hay histórico
  if (deal.historical_avg_eur && deal.historical_avg_eur > 0) {
    const ratio = deal.price_eur / deal.historical_avg_eur;
    if (ratio <= 0.35) {
      anomalyScore = 95;
      reasoning.push(`Precio ${Math.round(ratio * 100)}% del histórico — anomalía clara`);
    } else if (ratio <= 0.55) {
      anomalyScore = 75;
      reasoning.push(`Precio ${Math.round(ratio * 100)}% del histórico — sospechoso`);
    } else if (ratio <= 0.75) {
      anomalyScore = 55;
    } else {
      anomalyScore = 30;
    }
  } else {
    reasoning.push("Sin histórico para comparar (sesgo neutro)");
  }

  // 3. Airline reliability (0-100, weight 10%)
  let airlineScore = 50;
  if (deal.airline_code) {
    const code = deal.airline_code.toUpperCase();
    if (ERROR_FARE_AIRLINES.has(code)) {
      airlineScore = 85;
      reasoning.push(`${code} aerolínea histórica de error fares`);
    } else if (LOWCOST_AIRLINES.has(code)) {
      airlineScore = 35;
      reasoning.push(`${code} low-cost (descuentos típicamente intencionales)`);
    }
  }

  // 4. Cabin tier anomaly (0-100, weight 10%)
  let cabinScore = 50;
  const cabin = (deal.cabin || "").toLowerCase();
  if (cabin.includes("business")) {
    if (deal.price_eur < 700) {
      cabinScore = 95;
      reasoning.push(`Business < €700 — casi siempre error fare`);
    } else if (deal.price_eur < 1200) {
      cabinScore = 75;
      reasoning.push(`Business < €1200 — muy bajo histórico`);
    } else {
      cabinScore = 55;
    }
  } else if (cabin.includes("first")) {
    if (deal.price_eur < 1500) {
      cabinScore = 95;
      reasoning.push(`First Class < €1500 — extremadamente raro`);
    } else {
      cabinScore = 75;
    }
  } else if (cabin.includes("premium")) {
    cabinScore = 60;
  }

  // 5. Freshness (0-100, weight 5%)
  let freshnessScore = 50;
  if (deal.hot_until) {
    const hotUntilMs = new Date(deal.hot_until).getTime();
    const hoursLeft = (hotUntilMs - Date.now()) / 3600_000;
    if (hoursLeft > 24) freshnessScore = 90;
    else if (hoursLeft > 6) freshnessScore = 70;
    else if (hoursLeft > 1) freshnessScore = 50;
    else if (hoursLeft > 0) freshnessScore = 30;
    else freshnessScore = 10; // already expired
  }

  // 6. Data completeness (0-100, weight 5%)
  let dataScore = 0;
  const fields = [deal.airline_code, deal.cabin, deal.date_out, deal.date_ret, deal.nights, deal.region];
  const present = fields.filter((f) => f !== undefined && f !== null).length;
  dataScore = (present / fields.length) * 100;

  // Weighted aggregate
  const confidence = Math.round(
    savingsScore * 0.45 +
      anomalyScore * 0.25 +
      airlineScore * 0.1 +
      cabinScore * 0.1 +
      freshnessScore * 0.05 +
      dataScore * 0.05,
  );

  // Label
  let label: ScoringResult["label"];
  if (confidence >= 80) label = "verified_error_fare";
  else if (confidence >= 60) label = "likely_error";
  else if (confidence >= 40) label = "uncertain";
  else label = "regular_sale";

  return {
    confidence_score: confidence,
    label,
    reasoning,
    components: {
      savings_score: savingsScore,
      anomaly_score: anomalyScore,
      airline_score: airlineScore,
      cabin_score: cabinScore,
      freshness_score: freshnessScore,
      data_score: dataScore,
    },
  };
}
