/**
 * hunter_quality.ts — fase qqq4 (may-2026)
 *
 * Quality scoring heurístico para deals: filtra "chollos reales" vs precios normales
 * sin necesidad de LLM. Usa 5 señales:
 *   1. savings_pct — % descuento sobre precio histórico/típico
 *   2. price_vs_route_baseline — precio vs mediana ruta
 *   3. travel_window — días hasta salida (más cerca = más urgente)
 *   4. cabin_premium_bonus — business/first siempre tier-up
 *   5. airline_reliability — aerolíneas top tier (IB, AF, KLM, BA, LH, QR, EK) +5
 *
 * Output: 0-100 score normalizado.
 *
 * Nota: el score del seed_diversifier ya viene precomputado, esta función
 * recalcula si se quiere ranking dinámico (ej. usuario filtra por
 * "solo top tier" → solo show score >85).
 */

import type { Deal } from "./api";

const TOP_TIER_AIRLINES = new Set([
  "Iberia", "Air France", "KLM", "British Airways", "Lufthansa",
  "Qatar Airways", "Emirates", "Singapore Airlines", "Cathay Pacific",
  "ANA", "JAL", "Korean Air", "Etihad", "Turkish Airlines", "SWISS",
  "TAP", "Aer Lingus", "Iberia Express", "Vueling",
]);

const BUDGET_AIRLINES = new Set([
  "Ryanair", "easyJet", "Wizz Air", "Norwegian", "Pegasus", "Volotea",
]);

/** Calcula quality score 0-100 a partir de un Deal. */
export function calculateQualityScore(deal: Deal): number {
  let score = 0;

  // 1. Savings % (max 35 puntos): error fares >50% off = top tier
  const savings = deal.savings_pct ?? 0;
  if (savings >= 60) score += 35;
  else if (savings >= 50) score += 30;
  else if (savings >= 40) score += 22;
  else if (savings >= 30) score += 15;
  else if (savings >= 20) score += 8;

  // 2. Cabin bonus (max 20 puntos)
  if (deal.cabin === "first") score += 20;
  else if (deal.cabin === "business") score += 15;
  else if (deal.cabin === "premium_economy") score += 8;

  // 3. Travel window urgency (max 15 puntos)
  if (deal.date_out) {
    const daysOut = Math.max(0, Math.floor((new Date(deal.date_out).getTime() - Date.now()) / 86400000));
    if (daysOut >= 7 && daysOut <= 21) score += 15;       // sweet spot
    else if (daysOut >= 22 && daysOut <= 60) score += 10;
    else if (daysOut >= 61 && daysOut <= 120) score += 5;
    // <7 días o >120 = 0 (demasiado urgente o muy futuro)
  }

  // 4. Direct flight bonus (max 10 puntos)
  if ((deal.stops ?? 0) === 0) score += 10;
  else if ((deal.stops ?? 0) === 1) score += 5;

  // 5. Airline reliability (max 15 puntos)
  const airline = deal.airline_name || "";
  if (TOP_TIER_AIRLINES.has(airline)) score += 15;
  else if (BUDGET_AIRLINES.has(airline)) score += 8;
  else score += 4;

  // 6. Classification bonus (max 5 puntos)
  if (deal.classification === "CRÍTICO" || deal.classification === "ERROR") score += 5;
  else if (deal.classification === "OFERTA") score += 3;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/** Auto-categorize tags basado en deal features. */
export function autoCategorizeDeal(deal: Deal): string[] {
  const tags: string[] = [];
  const nights = deal.nights ?? 0;
  const daysOut = deal.date_out
    ? Math.floor((new Date(deal.date_out).getTime() - Date.now()) / 86400000)
    : 999;

  // Trip duration
  if (nights >= 1 && nights <= 4) tags.push("escapada-weekend");
  else if (nights >= 5 && nights <= 9) tags.push("vacacion-semana");
  else if (nights >= 10 && nights <= 14) tags.push("vacacion-larga");
  else if (nights >= 15) tags.push("viaje-largo");

  // Urgency
  if (daysOut <= 14) tags.push("ultima-hora");
  else if (daysOut >= 60 && daysOut <= 120) tags.push("planificacion-anticipada");

  // Type
  if (deal.cabin === "business" || deal.cabin === "first") tags.push("business-deal");
  if ((deal.savings_pct ?? 0) >= 50) tags.push("error-fare");
  if ((deal.stops ?? 0) === 0) tags.push("vuelo-directo");

  // Region tags
  const region = deal.region || "";
  if (region) tags.push(region.toLowerCase().replace(/\s+/g, "-").replace(/á/g, "a").replace(/é/g, "e"));

  // Origin tags
  const origin = deal.origin || "";
  if (["MAD", "BCN", "AGP", "BIO", "SVQ", "VLC", "PMI", "TFN", "ALC"].includes(origin)) {
    tags.push(`desde-${origin.toLowerCase()}`);
  }

  return tags;
}

/** Filtra deals por quality threshold. */
export function filterByQuality(deals: Deal[], minScore: number = 75): Deal[] {
  return deals.filter((d) => calculateQualityScore(d) >= minScore);
}

/** Ranking deals por quality score DESC. */
export function rankByQuality(deals: Deal[]): Deal[] {
  return [...deals].sort((a, b) => calculateQualityScore(b) - calculateQualityScore(a));
}
