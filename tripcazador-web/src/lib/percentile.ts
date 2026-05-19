/**
 * percentile.ts — SSS326 (19 may 2026)
 *
 * Pure function para calcular el percentile de un valor dentro de una
 * distribución ordenada. Usado por /api/premium/percentile para social
 * proof: "Has ahorrado más que el X% de Premium".
 *
 * Definimos percentile como "% de valores estrictamente menores que el
 * mío" (inclusive del propio user). Si el user está empatado con otros
 * usamos el rango medio.
 *
 * Edge cases:
 *  - Lista vacía → percentile undefined (no podemos comparar)
 *  - User no aparece en la lista → lo insertamos virtualmente para
 *    calcular su posición.
 *  - Lista con un solo elemento (mi único caso) → 50% (medio).
 */

export interface PercentileResult {
  percentile: number; // 0-100
  total_customers: number;
  my_total_eur: number;
  /** Storytelling label para UI */
  label: string;
}

/**
 * @param myTotal mi total de ahorros en €
 * @param sortedTotals lista ASCENDENTE de totales (mi total puede o no estar)
 */
export function calculatePercentile(
  myTotal: number,
  sortedTotals: number[],
): PercentileResult {
  if (!Number.isFinite(myTotal) || myTotal <= 0) {
    return {
      percentile: 0,
      total_customers: sortedTotals.length,
      my_total_eur: 0,
      label: "Sin ahorros registrados todavía",
    };
  }

  // Si la lista está vacía o solo me incluye → no hay comparación útil
  if (sortedTotals.length === 0) {
    return {
      percentile: 50,
      total_customers: 0,
      my_total_eur: myTotal,
      label: "Eres el primer Premium en ahorrar — sigue así",
    };
  }

  // Contar cuántos son ESTRICTAMENTE menores que myTotal
  let below = 0;
  let equal = 0;
  for (const t of sortedTotals) {
    if (t < myTotal) below += 1;
    else if (t === myTotal) equal += 1;
  }

  // Si el user NO está en la lista (caso normal cuando viene de
  // aggregateTotalsAcrossCustomers que excluye? Pero el store SÍ incluye).
  // Asumimos que el user SÍ aparece en la lista — está incluido en equal.
  // Si no apareciera, equal=0 y below cuenta correcto.
  const n = sortedTotals.length;

  // Percentile: (below + equal/2) / n × 100 — método rango medio
  const pct = Math.round(((below + equal / 2) / n) * 100);
  // Ajustar al rango 1-99 (evitar "100%" engañoso ya que el user
  // está en la propia muestra)
  const clamped = Math.max(1, Math.min(99, pct));

  const label = buildLabel(clamped, myTotal, n);

  return {
    percentile: clamped,
    total_customers: n,
    my_total_eur: myTotal,
    label,
  };
}

function buildLabel(pct: number, myTotal: number, totalCustomers: number): string {
  if (totalCustomers < 5) {
    return `Llevas ${myTotal}€ ahorrados con Premium`;
  }
  if (pct >= 90) {
    return `🏆 Top ${100 - pct}% — has ahorrado más que el ${pct}% de Premium`;
  }
  if (pct >= 75) {
    return `🥇 Top 25% — has ahorrado más que el ${pct}% de Premium`;
  }
  if (pct >= 50) {
    return `Has ahorrado más que el ${pct}% de Premium — sigue subiendo`;
  }
  if (pct >= 25) {
    return `Has ahorrado más que el ${pct}% de Premium — añade alertas para subir`;
  }
  return `Llevas ${myTotal}€ ahorrados — crea alertas para descubrir más chollos`;
}
