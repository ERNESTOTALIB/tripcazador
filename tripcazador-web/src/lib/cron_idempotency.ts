/**
 * cron_idempotency.ts — AUDIT-FULL-2 (24 may 2026)
 *
 * Idempotency markers para crons que envían emails / aplican efectos
 * cross-customer. Sin esto, el mismo cron disparado dos veces (network
 * blip + retry, manual workflow_dispatch, race con scheduled) duplica
 * el efecto.
 *
 * Backend: KV abstraction (Upstash si configurado, in-memory fallback).
 * TTL: 25h por defecto — cubre el ciclo diario sin acumulación.
 *
 * Uso:
 *   const lock = await acquireCronMarker("winback", customerId);
 *   if (!lock) return; // ya enviado hoy
 *   await sendEmail(...);
 */
import { createKV } from "@/lib/kv_store";

const IDEMP_STORE = createKV("cron_idemp");
const DEFAULT_TTL_SECONDS = 25 * 3600; // 25h cubre diario + retry window

/**
 * Marca este customer como ya procesado hoy para el cron `kind`.
 * Devuelve true si NO había marker previo (procede). false si ya existe.
 *
 * Use YYYY-MM-DD (UTC) como segment para que la key resetee cada día.
 */
export async function acquireCronMarker(
  kind: string,
  customerId: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  const key = `${kind}:${customerId}:${today}`;
  const existing = await IDEMP_STORE.get<number>(key);
  if (existing) return false;
  await IDEMP_STORE.set(key, Date.now(), ttlSeconds);
  return true;
}

/**
 * Versión simplificada que devuelve solo si era seguro proceder (true) o
 * skip (false). En caso de error de KV, fail-open (devuelve true) para no
 * bloquear emails — duplicar es preferible a no enviar.
 */
export async function safeCronMarker(kind: string, customerId: string): Promise<boolean> {
  try {
    return await acquireCronMarker(kind, customerId);
  } catch {
    return true; // fail-open
  }
}
