/**
 * rate_limit.ts — SSS412 (21 may 2026)
 *
 * Helper centralizado para rate limiting en route handlers. Reemplaza
 * el pattern in-line duplicado en 12+ archivos:
 *
 *   const rateMap: Map<string, number[]> = (
 *     globalThis as unknown as { __tc_xx_rate?: Map<string, number[]> }
 *   ).__tc_xx_rate ?? new Map();
 *   ...
 *   function isRateLimited(key: string): boolean { ... }
 *
 * Mantiene la misma semántica (sliding window in-memory) pero con API
 * unificada y namespace isolation. NO migra los callers existentes —
 * solo provee la herramienta para nuevos endpoints + futura migración.
 *
 * Roadmap: cuando UPSTASH_REDIS configurado, swap a Redis ZSET-based
 * rate limiting con expiry automático (sharded across containers).
 */

interface RateBucket {
  hits: Map<string, number[]>;
}

const buckets: Map<string, RateBucket> = (
  globalThis as unknown as { __tc_rate_buckets?: Map<string, RateBucket> }
).__tc_rate_buckets ?? new Map();
(globalThis as unknown as { __tc_rate_buckets: Map<string, RateBucket> }).__tc_rate_buckets =
  buckets;

function getBucket(namespace: string): RateBucket {
  let b = buckets.get(namespace);
  if (!b) {
    b = { hits: new Map() };
    buckets.set(namespace, b);
  }
  return b;
}

export interface RateLimitOptions {
  /** Identificador único del endpoint (ej. "voice_hotline"). Aísla buckets. */
  namespace: string;
  /** Identidad del cliente (IP, email, customer_id, ref_code, …). */
  key: string;
  /** Máximo hits permitidos en la ventana. */
  max: number;
  /** Ventana en milisegundos. */
  windowMs: number;
}

export interface RateLimitResult {
  limited: boolean;
  /** Hits dentro de la ventana actual (incluyendo el actual). */
  current: number;
  /** Cuándo el siguiente hit ya cabría (ms desde epoch). */
  resetAt: number;
}

/**
 * Verifica + registra hit. Devuelve `limited: true` si excede max.
 *
 * Side effect: el hit se añade al bucket aunque devuelva limited
 * (importante para que sliding window mantenga la presión).
 */
export function checkRateLimit(opts: RateLimitOptions): RateLimitResult {
  const bucket = getBucket(opts.namespace);
  const now = Date.now();
  const stored = bucket.hits.get(opts.key) || [];
  const within = stored.filter((t) => now - t < opts.windowMs);
  within.push(now);
  bucket.hits.set(opts.key, within);

  const limited = within.length > opts.max;
  const oldest = within[0] ?? now;
  const resetAt = oldest + opts.windowMs;
  return {
    limited,
    current: within.length,
    resetAt,
  };
}

/**
 * Shortcut binary helper — más conciso para callers que solo quieren bool.
 */
export function isRateLimited(opts: RateLimitOptions): boolean {
  return checkRateLimit(opts).limited;
}

/**
 * Combina N rate-limits en un solo check. Devuelve el primer limited:true.
 * Útil cuando un endpoint tiene rate-limit per-IP + per-email.
 */
export function checkMultiRateLimit(
  configs: RateLimitOptions[],
): RateLimitResult & { tripped?: string } {
  for (const cfg of configs) {
    const r = checkRateLimit(cfg);
    if (r.limited) {
      return { ...r, tripped: cfg.namespace };
    }
  }
  // Ninguno limited — return el del primero (referencia)
  return checkRateLimit(configs[0]);
}

/** Test-only helper */
export function __resetRateLimitsForTests(): void {
  buckets.clear();
}

export const __test__ = {
  buckets,
};
