/**
 * route_groups.ts — fase qqq5 (may-2026)
 *
 * Agrupa templates de seed_diversifier en "feeds curados" por intent:
 *   - weekend-escape: 1-4 nights, EU short-haul, low-cost preferred
 *   - long-haul-leisure: 8-14 nights, intercontinental, beach/cultura
 *   - business-class-deals: cabin business + savings >50%
 *   - error-fares-only: classification = ERROR/CRÍTICO + savings >55%
 *   - asia-explorer: region Asia
 *   - latam-deals: region Sudamérica/Centroamérica
 *   - africa-safari: region África + nights >=10
 *
 * Usado por:
 *   - /api/feed/[group] endpoint (próximo)
 *   - Home chips "Mi feed" personalizado
 *   - Email digest segmentado
 */

import type { Deal } from "./api";

export type RouteGroup =
  | "weekend-escape"
  | "long-haul-leisure"
  | "business-class-deals"
  | "error-fares-only"
  | "asia-explorer"
  | "latam-deals"
  | "africa-safari"
  | "europa-norte"
  | "caribe-playa"
  | "premium-leisure";

export interface GroupMeta {
  id: RouteGroup;
  label: string;
  emoji: string;
  description: string;
  filter: (d: Deal) => boolean;
}

export const ROUTE_GROUPS: GroupMeta[] = [
  {
    id: "weekend-escape",
    label: "Escapadas weekend",
    emoji: "🎒",
    description: "1-4 noches, Europa short-haul, salir viernes/sábado",
    filter: (d) =>
      (d.nights ?? 0) >= 1 &&
      (d.nights ?? 0) <= 4 &&
      (d.region === "Europa" || d.region === "África") &&
      (d.duration_min ?? 0) <= 360,
  },
  {
    id: "long-haul-leisure",
    label: "Vacaciones largas",
    emoji: "🏝️",
    description: "8-14 noches a Asia, América, Oceanía",
    filter: (d) =>
      (d.nights ?? 0) >= 8 &&
      (d.nights ?? 0) <= 14 &&
      ["Asia", "Norteamérica", "Sudamérica", "Oceanía", "Caribe"].includes(d.region || ""),
  },
  {
    id: "business-class-deals",
    label: "Business class deals",
    emoji: "💼",
    description: "Vuelos business con >50% descuento",
    filter: (d) =>
      (d.cabin === "business" || d.cabin === "first") && (d.savings_pct ?? 0) >= 45,
  },
  {
    id: "error-fares-only",
    label: "Error fares",
    emoji: "🚨",
    description: "Glitches >55% off, urgentes",
    filter: (d) =>
      (d.classification === "ERROR" || d.classification === "CRÍTICO") &&
      (d.savings_pct ?? 0) >= 50,
  },
  {
    id: "asia-explorer",
    label: "Asia profunda",
    emoji: "🏯",
    description: "Tailandia, Japón, Vietnam, India, Bhután...",
    filter: (d) => d.region === "Asia",
  },
  {
    id: "latam-deals",
    label: "Latinoamérica",
    emoji: "🌎",
    description: "México, Argentina, Colombia, Perú, Chile...",
    filter: (d) => d.region === "Sudamérica" || d.region === "Centroamérica",
  },
  {
    id: "africa-safari",
    label: "Safari África",
    emoji: "🦁",
    description: "Kenia, Tanzania, Sudáfrica, +10 noches",
    filter: (d) => d.region === "África" && (d.nights ?? 0) >= 8,
  },
  {
    id: "europa-norte",
    label: "Europa norte",
    emoji: "❄️",
    description: "Escandinavia, Báltico, Islandia",
    filter: (d) => {
      const c = d.country_to || "";
      return ["Suecia", "Noruega", "Dinamarca", "Finlandia", "Islandia", "Estonia", "Letonia", "Lituania"].includes(c);
    },
  },
  {
    id: "caribe-playa",
    label: "Caribe playa",
    emoji: "🌴",
    description: "Cuba, RD, Jamaica, Bahamas, Aruba...",
    filter: (d) => d.region === "Caribe",
  },
  {
    id: "premium-leisure",
    label: "Premium leisure",
    emoji: "✨",
    description: "Maldivas, Seychelles, Bali, Tahití",
    filter: (d) => {
      const c = d.country_to || "";
      return ["Maldivas", "Seychelles", "Mauricio", "Polinesia Francesa", "Indonesia", "Fiji", "Vanuatu", "Samoa"].includes(c);
    },
  },
];

export function getGroupBySlug(slug: string): GroupMeta | null {
  return ROUTE_GROUPS.find((g) => g.id === slug) || null;
}

export function filterByGroup(deals: Deal[], groupId: RouteGroup): Deal[] {
  const meta = getGroupBySlug(groupId);
  if (!meta) return [];
  return deals.filter(meta.filter);
}

/** Para cada group, devuelve count + 3 sample deals. */
export function summarizeGroups(deals: Deal[]): Array<{ meta: GroupMeta; count: number; samples: Deal[] }> {
  return ROUTE_GROUPS.map((meta) => {
    const matched = deals.filter(meta.filter);
    return {
      meta,
      count: matched.length,
      samples: matched.slice(0, 3),
    };
  });
}
