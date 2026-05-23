/**
 * baggage_dimensions.ts — SSS450 (23 may 2026)
 *
 * Parser pure-fn de strings de dimensiones "55 × 40 × 20 cm" → tupla
 * de números. Y comparación bag vs límite por aerolínea (personalItem
 * + cabin con o sin fee).
 *
 * Usado por /equipaje-medidor (client tool) y testeable aisladamente.
 */
import { BAGGAGE_RULES, type BaggageRule } from "./baggage_rules";

export interface BagSize {
  /** L × A × H en cm. */
  length: number;
  width: number;
  height: number;
  /** Peso en kg. */
  weightKg: number;
}

export interface FitResult {
  airline: BaggageRule;
  /** Encaja como personal item gratis (bolso pequeño 1 bulto). */
  personalItem: { fits: boolean; reason: string };
  /** Encaja como cabin (trolley). Paga fee si feeFromEur > 0. */
  cabinPaid: { fits: boolean; reason: string; feeFromEur: number };
}

/** Parses "55 × 40 × 20 cm" or "55x40x20cm" into [L, W, H] in cm.
 *  SSS456: accepts decimals (`.` or `,`) — e.g. "55.5 × 40 × 20.3 cm". */
export function parseDimensions(input: string): [number, number, number] | null {
  // Reemplaza × y ✕ por x
  const normalized = input.replace(/[×✕]/g, "x");
  const match = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)/i,
  );
  if (!match) return null;
  return [
    parseFloat(match[1].replace(",", ".")),
    parseFloat(match[2].replace(",", ".")),
    parseFloat(match[3].replace(",", ".")),
  ];
}

/** Parses "10 kg" or "10kg" into kg number. */
export function parseWeight(input: string): number | null {
  const match = input.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
  if (!match) return null;
  return parseFloat(match[1].replace(",", "."));
}

/**
 * Verifica si bag entra en limit dado dimensiones declaradas + peso.
 *
 * Filosofía: comparar cada dimensión bag con cada dimensión limit en
 * cualquier orientación (longitud puede ser cualquier eje). Devolvemos
 * true si todas las dimensiones cumplen tras sort desc.
 */
export function bagFitsDimensions(bag: BagSize, limitStr: string): boolean {
  const limit = parseDimensions(limitStr);
  if (!limit) return false;
  const bagSorted = [bag.length, bag.width, bag.height].sort((a, b) => b - a);
  const limitSorted = [...limit].sort((a, b) => b - a);
  return bagSorted.every((d, i) => d <= limitSorted[i]);
}

export function bagFitsWeight(bag: BagSize, weightLimitStr: string | undefined): boolean {
  if (!weightLimitStr) return true; // sin límite peso (personal item suele ser sin)
  const limit = parseWeight(weightLimitStr);
  if (limit === null) return true; // unparseable → permisivo
  return bag.weightKg <= limit;
}

/** Verifica bag contra una BaggageRule. Devuelve fit por categoría. */
export function checkAirlineFit(bag: BagSize, rule: BaggageRule): FitResult {
  // Personal item — solo dimensiones, sin peso
  const personalDimsOk = bagFitsDimensions(bag, rule.personalItem.dimensions);
  const personalWeightOk = bagFitsWeight(bag, rule.personalItem.weight);
  const personalFits = personalDimsOk && personalWeightOk;

  // Cabin — dimensiones + peso
  const cabinDimsOk = bagFitsDimensions(bag, rule.cabin.dimensions);
  const cabinWeightOk = bagFitsWeight(bag, rule.cabin.weight);
  const cabinFits = cabinDimsOk && cabinWeightOk;

  const personalReason = personalFits
    ? `Encaja como personal item (${rule.personalItem.dimensions}, sin peso límite habitualmente)`
    : !personalDimsOk
      ? `Dimensiones exceden ${rule.personalItem.dimensions}`
      : `Peso excede ${rule.personalItem.weight}`;

  // CabinPaid = entra en cabin trolley (paga fee si la aerolínea cobra)
  const cabinPaid = {
    fits: cabinFits,
    reason: cabinFits
      ? `Encaja como cabin (${rule.cabin.dimensions}, ${rule.cabin.weight}). Fee desde €${rule.cabin.feeFromEur}.`
      : !cabinDimsOk
        ? `Dimensiones exceden ${rule.cabin.dimensions}`
        : `Peso excede ${rule.cabin.weight}`,
    feeFromEur: rule.cabin.feeFromEur,
  };

  return {
    airline: rule,
    personalItem: { fits: personalFits, reason: personalReason },
    cabinPaid,
  };
}

/** Devuelve array con verificación contra todas las aerolíneas catálogo. */
export function checkAllAirlines(bag: BagSize): FitResult[] {
  return BAGGAGE_RULES.map((r) => checkAirlineFit(bag, r));
}
