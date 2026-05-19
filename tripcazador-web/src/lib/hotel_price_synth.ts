/**
 * hotel_price_synth.ts — SSS323 (19 may 2026)
 *
 * Síntesis determinista del precio "actual" de un hotel para una
 * ciudad+fechas dadas. NO usamos Booking API real (rate limits +
 * complejidad auth). En su lugar partimos del baseline que el user
 * guardó al añadir el watch y aplicamos un "noise" diario determinista
 * basado en hash(city+date_in+date_out+día).
 *
 * Esto NO refleja precio real de Booking — es una aproximación que
 * permite testar el flujo de notificación + UX. Cuando integremos
 * Booking API en V2 esta función será reemplazada por una llamada
 * real preservando la misma firma.
 *
 * Pure function — totalmente testeable.
 */

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) & 0xffffffff;
  }
  return h < 0 ? h + 0x100000000 : h;
}

export interface SynthInput {
  city: string;
  date_in: string;
  date_out: string;
  baseline_ppn: number;
  /** Día para el cual sintetizar (default hoy). Permite tests determinísticos. */
  today?: Date;
}

/**
 * Sintetiza un precio per-night "hoy" alrededor del baseline.
 * - Rango: baseline ± 25% típicamente
 * - Tendencia: misma seed da el mismo precio el mismo día (idempotencia)
 * - Días distintos → precios distintos (necesario para que el cron
 *   ocasionalmente dispare)
 */
export function synthCurrentPpn(input: SynthInput): number {
  const today = input.today ?? new Date();
  const dateKey = today.toISOString().slice(0, 10);
  const seed = djb2(`${input.city}|${input.date_in}|${input.date_out}|${dateKey}`);
  // Mapear seed a [-0.25, +0.25]
  const ratio = ((seed % 1000) / 1000) * 0.5 - 0.25;
  const ppn = input.baseline_ppn * (1 + ratio);
  return Math.max(1, Math.round(ppn * 100) / 100);
}
