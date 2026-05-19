/**
 * secret_deals.ts — SSS318 (19 may 2026)
 *
 * Sistema de "secret deals Premium" — error fares y deals CRÍTICOS
 * recién encontrados (<24h) que SOLO Premium puede ver. Tras la
 * ventana de 24h el deal pasa a ser público en /deals normal.
 *
 * Por qué importa: diferencia el valor Premium vs free de forma
 * muy tangible — "literalmente los ves antes que nadie". Refuerza
 * la conversión: el user que se entera de un chollo error fare 24h
 * tarde vs un Premium que lo cazó al instante → upgrade obvio.
 *
 * Decisión de diseño:
 *  - Filtrado server-side en /api/deals (los deals secret NUNCA salen
 *    al endpoint público — no podemos confiar en el cliente).
 *  - Premium accede vía /api/premium/secret-deals con auth customer_id.
 *  - "Secret" =  classification ∈ {CRÍTICO, ERROR} AND found_at < 24h ago.
 *  - Si found_at falta o es inválida → tratamos como NO secret (defensa
 *    safety: ante duda no escondemos el deal).
 */

export interface DealWithFoundAt {
  classification?: string;
  found_at?: string;
  [key: string]: unknown;
}

export const SECRET_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const SECRET_CLASSIFICATIONS = new Set(["CRÍTICO", "ERROR"]);

/**
 * Returns true si el deal está dentro de la ventana secret (Premium-only).
 * Pure function — fácil de testear y reusar.
 */
export function isSecretDeal(deal: DealWithFoundAt, now: number = Date.now()): boolean {
  if (!deal.classification || !SECRET_CLASSIFICATIONS.has(deal.classification)) {
    return false;
  }
  if (!deal.found_at || typeof deal.found_at !== "string") return false;
  const foundMs = Date.parse(deal.found_at);
  if (!Number.isFinite(foundMs)) return false;
  return now - foundMs < SECRET_WINDOW_MS && foundMs <= now;
}

/**
 * Devuelve solo los deals NO secret (los que pueden mostrarse al
 * público). Inverso de filterSecretDeals.
 */
export function filterOutSecret<T extends DealWithFoundAt>(
  deals: T[],
  now: number = Date.now(),
): T[] {
  return deals.filter((d) => !isSecretDeal(d, now));
}

/**
 * Devuelve SOLO los deals secret (para el endpoint Premium).
 */
export function pickSecretDeals<T extends DealWithFoundAt>(
  deals: T[],
  now: number = Date.now(),
): T[] {
  return deals.filter((d) => isSecretDeal(d, now));
}

/**
 * Devuelve el TTL restante en ms (cuánto le queda al deal antes de
 * salir a público). Útil para UI countdown. Si ya no es secret
 * devuelve 0.
 */
export function secretTtlMs(deal: DealWithFoundAt, now: number = Date.now()): number {
  if (!isSecretDeal(deal, now)) return 0;
  const foundMs = Date.parse(deal.found_at as string);
  return Math.max(0, SECRET_WINDOW_MS - (now - foundMs));
}
