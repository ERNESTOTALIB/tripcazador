/**
 * cron_auth.ts — AUDIT-FULL-2 (24 may 2026)
 *
 * Helper de autenticación para crons. Resuelve el HIGH OPS finding del
 * audit: `PRICE_ALERT_CRON_TOKEN_PREMIUM` está compartido entre 7 crons
 * distintos → leak de uno expone todos (winback, lifecycle, weekly-digest,
 * watchlist, hotel-watchlist, scoring-feedback, match-cron-premium).
 *
 * Estrategia:
 *  1. Soporta token específico por cron (ej. CRON_TOKEN_WINBACK).
 *  2. Fallback al PRICE_ALERT_CRON_TOKEN_PREMIUM compartido si no hay
 *     token específico — backward-compat para no romper workflows.
 *  3. Migración gradual: cuando user añade env per-cron en Vercel, el
 *     cron usa el específico. Sin tocar workflows.
 *
 * Constant-time compare (timingSafeEqual) consistente con auditoría.
 */
import { timingSafeEqual } from "node:crypto";

/**
 * Verifica que el token recibido coincide con el token configurado para
 * `cronName` (env CRON_TOKEN_${UPPER}) o, si no existe, con el token
 * compartido legacy.
 */
export function verifyCronToken(cronName: string, provided: string): boolean {
  if (!provided) return false;
  const specific = process.env[`CRON_TOKEN_${cronName.toUpperCase().replace(/-/g, "_")}`] || "";
  const shared = process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM || "";
  const expected = specific || shared;
  if (!expected) return false;
  return constantTimeEq(provided, expected);
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Devuelve qué token está activo para `cronName` — útil para logging
 * sin filtrar el valor real. "specific" = token granular, "shared" =
 * fallback legacy, "missing" = ninguno set.
 */
export function cronTokenSource(cronName: string): "specific" | "shared" | "missing" {
  const specific = process.env[`CRON_TOKEN_${cronName.toUpperCase().replace(/-/g, "_")}`] || "";
  if (specific) return "specific";
  const shared = process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM || "";
  if (shared) return "shared";
  return "missing";
}
