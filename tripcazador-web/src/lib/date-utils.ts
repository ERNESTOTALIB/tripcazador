/**
 * TripCazador — date-utils
 *
 * Helpers de fecha compartidos entre componentes (PriceCalendar,
 * FlexDatesStrip…). Todos son puros y trabajan con cadenas ISO locales
 * "YYYY-MM-DD" para evitar el clásico bug de mezclar `new Date(iso)`
 * (UTC) con `getDate()`/`toISOString()` (local vs UTC).
 *
 * El backend emite `date_out` como string "YYYY-MM-DD" sin timezone, y
 * el usuario lo interpreta como "día local", así que todo el código UI
 * debe tratarlo igual.
 */

/**
 * Formatea un Date como YYYY-MM-DD usando **hora local**.
 *
 * NO usar `d.toISOString().slice(0, 10)` para este propósito: convierte
 * a UTC y en UTC+ (ej. España en verano) serializa la fecha local
 * "2026-04-20 01:00" como "2026-04-19".
 */
export function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parsea "YYYY-MM-DD" como medianoche LOCAL.
 * Devuelve `null` si el formato no es válido.
 */
export function parseLocalISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Desplaza una cadena ISO local "YYYY-MM-DD" un nº de días.
 * Si el input es inválido devuelve el mismo string.
 */
export function shiftLocalISO(iso: string, days: number): string {
  const d = parseLocalISO(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + days);
  return toLocalISO(d);
}

/**
 * Percentil con interpolación lineal sobre un array YA ordenado
 * ascendente. Tolera array vacío (devuelve 0) y de un solo elemento
 * (devuelve ese elemento).
 *
 * El caller es responsable de pasar el array ordenado — lo hacemos así
 * para poder calcular p33 y p66 sobre el mismo sort sin re-ordenar.
 */
export function percentileSorted(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const frac = idx - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}
