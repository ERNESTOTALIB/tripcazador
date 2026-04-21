/**
 * Utilidades para normalizar ratings de hoteles procedentes de distintas fuentes.
 *
 * Bug histórico (caza abr-2026): Google Hotels devuelve ratings crudos con
 * muchos decimales (4.575, 4.421312, 4.286853...). Si pasamos eso tal cual a
 * la UI queda feo y da un aire de "dato sin procesar". Además conviene
 * acotarlo a [1, 5] para evitar outliers (ratings 0 o > 5 por bug upstream).
 *
 * Booking usa escala 0-10; Google usa 1-5. Exponemos helpers para ambos.
 */

/**
 * Redondea un rating Google Hotels (1-5) a 1 decimal.
 * - Devuelve `null` si el input no es un número finito positivo.
 * - Clampea a [1, 5] para evitar outliers.
 */
export function roundRating(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value <= 0) return null;
  const clamped = Math.min(5, Math.max(1, value));
  return Math.round(clamped * 10) / 10;
}

/** Convierte rating Google (1-5) a escala Booking-like (0-10). */
export function googleToBookingScale(value: unknown): number | null {
  const r = roundRating(value);
  if (r === null) return null;
  // 1 → 2.0, 5 → 10.0  (linear map: rating*2)
  return Math.round(r * 2 * 10) / 10;
}

/**
 * Formato legible: "4.6" o "—".
 */
export function formatRating(value: unknown): string {
  const r = roundRating(value);
  return r === null ? "—" : r.toFixed(1);
}

/**
 * Devuelve `true` si el rating cumple el umbral de "bueno" en la escala Google.
 * Usa 4.0 como corte (≈ 8.0 en escala Booking).
 */
export function isGoodRating(value: unknown, threshold = 4.0): boolean {
  const r = roundRating(value);
  return r !== null && r >= threshold;
}
