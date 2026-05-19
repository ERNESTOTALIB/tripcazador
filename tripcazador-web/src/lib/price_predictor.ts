/**
 * price_predictor.ts — SSS313 (19 may 2026)
 *
 * Predictor "compra ahora vs espera 7 días" para Premium en /deals/[id].
 *
 * Heurística determinista basada en:
 *  1. Tiempo hasta el vuelo (dayes_to_flight)
 *     - <7 días: precio sube casi siempre → compra YA
 *     - 7-21 días: sweet spot, suele bajar → puede esperar
 *     - 21-60 días: ventana volátil → moderado
 *     - >60 días: precios estables → puedes esperar
 *  2. Posición del precio actual vs histórico (current vs avg)
 *     - precio < avg*0.85: bottom, compra YA
 *     - precio > avg*1.15: top, espera
 *  3. Día de la semana del vuelo
 *     - viernes/domingo más caro
 *     - martes/miércoles más barato
 *
 * No usa ML — pure function deterministic. Premium percibe valor:
 * "Me dijeron que esperase 5 días, ahorré 87€".
 */

export type PriceVerdict = "compra_ya" | "espera" | "neutro";
export type ConfidenceLevel = "alta" | "media" | "baja";

export interface PricePrediction {
  verdict: PriceVerdict;
  confidence: ConfidenceLevel;
  /** Cambio % esperado en 7 días (puede ser negativo) */
  expected_change_pct: number;
  /** Razones legibles para el verdict */
  reasons: string[];
  /** Días hasta el vuelo (input) */
  days_to_flight: number;
}

export interface PredictorInput {
  current_price: number;
  avg_price: number;
  min_price?: number;
  max_price?: number;
  /** Fecha del vuelo en ISO YYYY-MM-DD o Date. Hoy si no se pasa. */
  date_out?: string | Date;
  /** Referencia hoy (para tests determinísticos) */
  today?: Date;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

function dayOfWeek(d: Date): number {
  return d.getDay(); // 0=Dom, 6=Sáb
}

export function predictPrice(input: PredictorInput): PricePrediction {
  const today = input.today ?? new Date();
  const dateOut = input.date_out
    ? input.date_out instanceof Date
      ? input.date_out
      : new Date(input.date_out)
    : today;
  const daysToFlight = Math.max(0, daysBetween(today, dateOut));
  const reasons: string[] = [];

  // Score: positivo = "espera puede ahorrar", negativo = "compra ya"
  let score = 0;

  // 1. Days to flight bucket
  if (daysToFlight < 7) {
    score -= 30;
    reasons.push(`Vuelo en ${daysToFlight}d: precios suelen subir última semana`);
  } else if (daysToFlight < 21) {
    score += 10;
    reasons.push(`Ventana ${daysToFlight}d antes: sweet spot para ofertas`);
  } else if (daysToFlight < 60) {
    score += 5;
  } else {
    score += 0; // muy a futuro, sin signal
    reasons.push(`Más de 2 meses por delante: precios estables, sin urgencia`);
  }

  // 2. Posición actual vs histórico
  if (input.avg_price > 0) {
    const ratio = input.current_price / input.avg_price;
    if (ratio <= 0.85) {
      score -= 25;
      reasons.push(`Precio actual ${Math.round((1 - ratio) * 100)}% bajo media histórica — buen momento`);
    } else if (ratio <= 0.95) {
      score -= 10;
      reasons.push(`Precio ${Math.round((1 - ratio) * 100)}% por debajo media`);
    } else if (ratio >= 1.15) {
      score += 25;
      reasons.push(`Precio ${Math.round((ratio - 1) * 100)}% por encima media — espera mejor oferta`);
    } else if (ratio >= 1.05) {
      score += 8;
      reasons.push(`Precio ${Math.round((ratio - 1) * 100)}% por encima media`);
    }
  }

  // 3. Día de la semana
  const dow = dayOfWeek(dateOut);
  if (dow === 0 || dow === 5) {
    // Domingo o Viernes - tarifa premium
    score -= 5;
    reasons.push(`Vuelo en ${dow === 0 ? "domingo" : "viernes"}: día caro, ofertas más raras`);
  } else if (dow === 2 || dow === 3) {
    // Martes/Miércoles - más barato
    score += 5;
  }

  // 4. Compute final verdict + confidence
  let verdict: PriceVerdict;
  if (score <= -20) verdict = "compra_ya";
  else if (score >= 20) verdict = "espera";
  else verdict = "neutro";

  let confidence: ConfidenceLevel;
  const absScore = Math.abs(score);
  if (absScore >= 35) confidence = "alta";
  else if (absScore >= 15) confidence = "media";
  else confidence = "baja";

  // Expected change %: aproximación lineal del score (cap ±30%)
  const expectedChangePct = Math.max(-30, Math.min(30, -score / 2));

  return {
    verdict,
    confidence,
    expected_change_pct: Math.round(expectedChangePct * 10) / 10,
    reasons,
    days_to_flight: daysToFlight,
  };
}

export function verdictLabel(v: PriceVerdict): string {
  if (v === "compra_ya") return "🔥 Compra YA";
  if (v === "espera") return "⏳ Espera (puede bajar)";
  return "≈ Precio normal";
}

export function verdictColor(v: PriceVerdict): string {
  if (v === "compra_ya") return "text-rose-400";
  if (v === "espera") return "text-emerald-400";
  return "text-amber-400";
}
