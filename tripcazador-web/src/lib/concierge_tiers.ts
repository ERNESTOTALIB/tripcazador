/**
 * concierge_tiers.ts — fase sss SSS10 (May 2026)
 *
 * Definición canónica de los 4 tiers del servicio Concierge tiered.
 * Compartida por:
 *   - /api/concierge/checkout (resolver tier → price ID + amount)
 *   - components/ConciergeForm (radio cards selector)
 *   - app/concierge/page (matriz de features + comparación)
 *   - /panel/concierge (mostrar tier de cada pedido)
 *   - api/admin/concierge/tickets (filtrar por tier)
 *
 * El precio en `amount_eur` debe coincidir con el `price_cents/100` del
 * producto Stripe creado por `/tmp/create_concierge_tiers.py`.
 */

export type ConciergeTier = "express" | "standard" | "premium" | "pro";

export const CONCIERGE_TIER_IDS: ConciergeTier[] = [
  "express",
  "standard",
  "premium",
  "pro",
];

export interface TierDefinition {
  id: ConciergeTier;
  name: string;
  amount_eur: number;
  delivery_label: string;
  delivery_hours: number;
  tagline: string;
  bullets: string[]; // 3-4 promesas concretas
  popular?: boolean;
  /** env var con el price_xxxxx Stripe (server-side only). */
  envVarPriceId: string;
}

export const CONCIERGE_TIERS: Record<ConciergeTier, TierDefinition> = {
  express: {
    id: "express",
    name: "Express",
    amount_eur: 9,
    delivery_hours: 24,
    delivery_label: "Entrega en 24h",
    tagline: "Búsqueda básica para quien tiene prisa",
    bullets: [
      "1 ruta (origen → destino)",
      "3 opciones más baratas",
      "Comparativa vs Skyscanner/Kayak",
      "Email con links directos a aerolínea",
    ],
    envVarPriceId: "STRIPE_PRICE_CONCIERGE_EXPRESS",
  },
  standard: {
    id: "standard",
    name: "Standard",
    amount_eur: 19,
    delivery_hours: 48,
    delivery_label: "Entrega en 48h",
    tagline: "El sweet-spot — ahorro garantizado o devolución",
    bullets: [
      "1 ruta con error fares + codeshare arbitrage",
      "5 opciones (vuelo + hotel sugerido)",
      "Tips destino (mejor zona, transporte, packing)",
      "Garantía €100+ ahorro o reembolso completo",
    ],
    popular: true,
    envVarPriceId: "STRIPE_PRICE_CONCIERGE_STANDARD",
  },
  premium: {
    id: "premium",
    name: "Premium-Concierge",
    amount_eur: 49,
    delivery_hours: 72,
    delivery_label: "Entrega en 72h",
    tagline: "Asesoría humana + multi-ruta",
    bullets: [
      "Multi-ruta (open-jaw, stopover, multi-ciudad)",
      "Hotel ya reservable con mejor precio verificado",
      "Asesoría visados + seguros + tarjetas crédito",
      "Recomendaciones cabina business si aplica",
    ],
    envVarPriceId: "STRIPE_PRICE_CONCIERGE_PREMIUM",
  },
  pro: {
    id: "pro",
    name: "Pro",
    amount_eur: 99,
    delivery_hours: 120,
    delivery_label: "Entrega en 5 días",
    tagline: "Viaje completo turn-key con soporte continuo",
    bullets: [
      "Vuelos + hoteles + actividades coordinados",
      "Itinerario día-a-día PDF",
      "Soporte WhatsApp 7 días post-entrega",
      "Cancelación / replanteo incluidos durante 7d",
    ],
    envVarPriceId: "STRIPE_PRICE_CONCIERGE_PRO",
  },
};

/** Type guard runtime para validar input externo (anti-injection). */
export function isValidTier(v: unknown): v is ConciergeTier {
  return typeof v === "string" && CONCIERGE_TIER_IDS.includes(v as ConciergeTier);
}

/** Devuelve la definición o null si el id no es válido. */
export function getTier(id: unknown): TierDefinition | null {
  if (!isValidTier(id)) return null;
  return CONCIERGE_TIERS[id];
}

/** Tier por defecto cuando el cliente no manda nada (fallback seguro). */
export const DEFAULT_TIER: ConciergeTier = "standard";

/**
 * Lee el price ID Stripe desde env. Devuelve null si no está seteado.
 * Server-side only — no exponer al cliente.
 */
export function resolvePriceIdForTier(tier: ConciergeTier): string | null {
  const def = CONCIERGE_TIERS[tier];
  const v = process.env[def.envVarPriceId];
  return v && v.startsWith("price_") ? v : null;
}
