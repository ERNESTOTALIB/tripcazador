/**
 * premium_deal_classifier.ts — SSS305 (18 may 2026)
 *
 * Decide si un deal debería ser PREMIUM-ONLY (visible solo a suscriptores).
 *
 * Reglas (cualquiera basta → premium_only=true):
 *  1. savings_pct > 70%  (chollos extremos)
 *  2. tag "error-fare"   (caducan rápido, scarcity real)
 *  3. engagement_24h > 50 (alto interés ya capturado)
 *  4. flag manual vip_pick=true (Ernesto cura a mano)
 *
 * Idea: 10-20% del catálogo. Free user ve la card BLURRED con teaser,
 * Premium ve todo. Driver de upgrade conversion vía scarcity legítima.
 *
 * Anti-abuse: NO ocultamos > 25% del catálogo (umbral PREMIUM_QUOTA_PCT)
 * para no destruir la experiencia gratis. Si supera el cap, solo se
 * marcan los top-N por scarcity_score.
 */

export interface DealForClassification {
  id?: string;
  savings_pct?: number;
  tags?: string[];
  engagement_24h?: number;
  vip_pick?: boolean;
  price_eur?: number;
}

export const SAVINGS_THRESHOLD = 70;
export const ENGAGEMENT_THRESHOLD = 50;
export const ERROR_FARE_TAG = "error-fare";
export const PREMIUM_QUOTA_PCT = 0.25; // máx 25% del catálogo

export function shouldBePremiumOnly(deal: DealForClassification): boolean {
  if (deal.vip_pick === true) return true;
  if ((deal.savings_pct ?? 0) > SAVINGS_THRESHOLD) return true;
  if (Array.isArray(deal.tags) && deal.tags.includes(ERROR_FARE_TAG)) return true;
  if ((deal.engagement_24h ?? 0) > ENGAGEMENT_THRESHOLD) return true;
  return false;
}

/**
 * Score para ranking cuando hay demasiados premium-only y necesitamos
 * decidir cuáles bajar a free. Más alto = más justificado mantener
 * en premium-only.
 */
export function scarcityScore(deal: DealForClassification): number {
  let s = 0;
  if (deal.vip_pick) s += 10000; // VIP picks SIEMPRE top de la lista (gana cualquier combo)
  if (Array.isArray(deal.tags) && deal.tags.includes(ERROR_FARE_TAG)) s += 500;
  s += (deal.savings_pct ?? 0) * 5;
  s += (deal.engagement_24h ?? 0);
  return s;
}

/**
 * Aplica el quota cap al catálogo completo:
 *  - calcula candidatos premium-only por shouldBePremiumOnly
 *  - si superan el PREMIUM_QUOTA_PCT del total, queda con top-N por scarcityScore
 *  - devuelve array de booleans alineado con el input
 */
export function applyPremiumQuota<T extends DealForClassification>(
  deals: T[],
): boolean[] {
  if (deals.length === 0) return [];
  const candidatesIdx = deals
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => shouldBePremiumOnly(d));
  const maxPremium = Math.max(1, Math.floor(deals.length * PREMIUM_QUOTA_PCT));
  if (candidatesIdx.length <= maxPremium) {
    return deals.map((d) => shouldBePremiumOnly(d));
  }
  // sort desc por scarcityScore, mantener top N
  const top = candidatesIdx
    .sort((a, b) => scarcityScore(b.d) - scarcityScore(a.d))
    .slice(0, maxPremium)
    .map((x) => x.i);
  const topSet = new Set(top);
  return deals.map((_, i) => topSet.has(i));
}
