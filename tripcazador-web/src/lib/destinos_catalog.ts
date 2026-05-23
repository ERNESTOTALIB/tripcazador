/**
 * destinos_catalog.ts — SSS418 (May 2026)
 *
 * Catálogo mínimo compartido de destinos para verticales SEO programmatic.
 * Source of truth ligero para las 3 nuevas verticales:
 *   - /seguro-viaje/[destino]  (afiliado Heymondo)
 *   - /esim/[destino]          (afiliado Holafly)
 *   - /visados/[destino]       (info-only, cross-links)
 *
 * NO sustituye a /destinos/[slug]/page.tsx (que tiene contenido editorial
 * rico). Este lib solo expone metadata estructurada para las landings
 * programáticas.
 *
 * Si añades un destino aquí también deberías considerar añadirlo a
 * /destinos/[slug] para coherencia (cross-links en footer).
 */

export type Region =
  | "europa"
  | "asia"
  | "africa"
  | "norteamerica"
  | "sudamerica"
  | "centroamerica"
  | "oceania"
  | "oriente-medio"
  | "caribe";

export interface DestinoCatalog {
  slug: string;
  name: string;
  emoji: string;
  country: string;
  region: Region;
  /**
   * visa: información para ciudadanos españoles
   * - "schengen": parte del espacio Schengen, no requiere
   * - "no-required": acuerdo bilateral, sin visado
   * - "evisa": e-visa online disponible
   * - "on-arrival": visado a la llegada
   * - "embassy": tramitación previa en embajada
   */
  visa: "schengen" | "no-required" | "evisa" | "on-arrival" | "embassy";
  visaNote?: string;
  /**
   * insuranceImportance: relevancia del seguro de viaje
   * - "critical": EE.UU., Asia remota — gasto médico potencial €30k+
   * - "high": destinos con sanidad cara o reembolso difícil
   * - "medium": destinos con convenios pero rec. seguro
   * - "low": EU con TSI/EHIC suficiente
   */
  insuranceImportance: "critical" | "high" | "medium" | "low";
  /**
   * esim: recomendación de eSIM data
   * - "essential": sin roaming gratis, ahorro garantizado
   * - "recommended": roaming caro o cobertura limitada
   * - "optional": EU con roaming gratis dentro del paquete
   */
  esim: "essential" | "recommended" | "optional";
  /** Range orientativo de precio vuelo error fare detectado desde MAD (€) */
  errorFareRange?: [number, number];
}

export const DESTINOS_CATALOG: DestinoCatalog[] = [
  // Asia
  { slug: "japon", name: "Japón", emoji: "🗼", country: "Japón", region: "asia", visa: "no-required", visaNote: "Hasta 90 días turismo sin visado.", insuranceImportance: "critical", esim: "essential", errorFareRange: [350, 600] },
  { slug: "tokio", name: "Tokio", emoji: "🗼", country: "Japón", region: "asia", visa: "no-required", visaNote: "Hasta 90 días turismo sin visado.", insuranceImportance: "critical", esim: "essential", errorFareRange: [350, 600] },
  { slug: "tailandia", name: "Tailandia", emoji: "🛕", country: "Tailandia", region: "asia", visa: "no-required", visaNote: "Hasta 30 días turismo sin visado.", insuranceImportance: "high", esim: "essential", errorFareRange: [350, 550] },
  { slug: "vietnam", name: "Vietnam", emoji: "🍜", country: "Vietnam", region: "asia", visa: "no-required", visaNote: "Hasta 45 días sin visado desde Agosto 2023.", insuranceImportance: "high", esim: "essential", errorFareRange: [400, 700] },
  { slug: "bali", name: "Bali", emoji: "🌴", country: "Indonesia", region: "asia", visa: "on-arrival", visaNote: "Visa on arrival 30 días, ~35 USD.", insuranceImportance: "high", esim: "essential", errorFareRange: [450, 750] },
  { slug: "singapur", name: "Singapur", emoji: "🌆", country: "Singapur", region: "asia", visa: "no-required", visaNote: "Hasta 90 días sin visado.", insuranceImportance: "critical", esim: "essential", errorFareRange: [400, 700] },
  { slug: "hong-kong", name: "Hong Kong", emoji: "🌃", country: "Hong Kong", region: "asia", visa: "no-required", visaNote: "Hasta 90 días sin visado.", insuranceImportance: "critical", esim: "essential", errorFareRange: [400, 700] },
  { slug: "maldivas", name: "Maldivas", emoji: "🏝️", country: "Maldivas", region: "asia", visa: "on-arrival", visaNote: "Visa gratuita on arrival, 30 días.", insuranceImportance: "high", esim: "essential", errorFareRange: [500, 900] },

  // Europa Schengen / EU (roaming gratis, TSI/EHIC)
  { slug: "lisboa", name: "Lisboa", emoji: "🚋", country: "Portugal", region: "europa", visa: "schengen", insuranceImportance: "low", esim: "optional", errorFareRange: [15, 60] },
  { slug: "paris", name: "París", emoji: "🗼", country: "Francia", region: "europa", visa: "schengen", insuranceImportance: "low", esim: "optional", errorFareRange: [30, 90] },
  { slug: "roma", name: "Roma", emoji: "🏛️", country: "Italia", region: "europa", visa: "schengen", insuranceImportance: "low", esim: "optional", errorFareRange: [30, 90] },
  { slug: "milan", name: "Milán", emoji: "🏙️", country: "Italia", region: "europa", visa: "schengen", insuranceImportance: "low", esim: "optional", errorFareRange: [30, 80] },
  { slug: "amsterdam", name: "Ámsterdam", emoji: "🚲", country: "Países Bajos", region: "europa", visa: "schengen", insuranceImportance: "low", esim: "optional", errorFareRange: [40, 100] },
  { slug: "berlin", name: "Berlín", emoji: "🍻", country: "Alemania", region: "europa", visa: "schengen", insuranceImportance: "low", esim: "optional", errorFareRange: [40, 110] },
  { slug: "viena", name: "Viena", emoji: "🎻", country: "Austria", region: "europa", visa: "schengen", insuranceImportance: "low", esim: "optional", errorFareRange: [50, 120] },
  { slug: "praga", name: "Praga", emoji: "🏰", country: "República Checa", region: "europa", visa: "schengen", insuranceImportance: "low", esim: "optional", errorFareRange: [40, 100] },
  { slug: "atenas", name: "Atenas", emoji: "🏺", country: "Grecia", region: "europa", visa: "schengen", insuranceImportance: "low", esim: "optional", errorFareRange: [50, 120] },
  { slug: "estambul", name: "Estambul", emoji: "🕌", country: "Turquía", region: "europa", visa: "no-required", visaNote: "Hasta 90 días en período de 180.", insuranceImportance: "medium", esim: "recommended", errorFareRange: [40, 120] },
  { slug: "londres", name: "Londres", emoji: "🎡", country: "Reino Unido", region: "europa", visa: "no-required", visaNote: "Hasta 6 meses turismo sin visado.", insuranceImportance: "high", esim: "recommended", errorFareRange: [30, 100] },
  { slug: "reykjavik", name: "Reikiavik", emoji: "🌋", country: "Islandia", region: "europa", visa: "schengen", insuranceImportance: "medium", esim: "recommended", errorFareRange: [80, 200] },
  { slug: "islandia", name: "Islandia", emoji: "🌋", country: "Islandia", region: "europa", visa: "schengen", insuranceImportance: "medium", esim: "recommended", errorFareRange: [80, 200] },

  // África
  { slug: "marruecos", name: "Marruecos", emoji: "🐪", country: "Marruecos", region: "africa", visa: "no-required", visaNote: "Hasta 90 días sin visado.", insuranceImportance: "high", esim: "recommended", errorFareRange: [20, 80] },
  { slug: "marrakech", name: "Marrakech", emoji: "🐪", country: "Marruecos", region: "africa", visa: "no-required", visaNote: "Hasta 90 días sin visado.", insuranceImportance: "high", esim: "recommended", errorFareRange: [20, 80] },
  { slug: "el-cairo", name: "El Cairo", emoji: "🐫", country: "Egipto", region: "africa", visa: "on-arrival", visaNote: "Visa on arrival 30 días, 25 USD.", insuranceImportance: "high", esim: "essential", errorFareRange: [200, 450] },
  { slug: "tanzania", name: "Tanzania", emoji: "🦁", country: "Tanzania", region: "africa", visa: "evisa", visaNote: "e-visa online ~50 USD. Fiebre amarilla recomendada.", insuranceImportance: "critical", esim: "essential", errorFareRange: [550, 850] },
  { slug: "sudafrica", name: "Sudáfrica", emoji: "🦓", country: "Sudáfrica", region: "africa", visa: "no-required", visaNote: "Hasta 90 días turismo sin visado.", insuranceImportance: "high", esim: "essential", errorFareRange: [500, 900] },

  // Oriente Medio
  { slug: "dubai", name: "Dubái", emoji: "🏗️", country: "EAU", region: "oriente-medio", visa: "no-required", visaNote: "Hasta 90 días turismo sin visado.", insuranceImportance: "high", esim: "essential", errorFareRange: [200, 450] },

  // Americas
  { slug: "nueva-york", name: "Nueva York", emoji: "🗽", country: "EE.UU.", region: "norteamerica", visa: "evisa", visaNote: "ESTA online (~21 USD), válido 2 años. Sanidad cara — seguro CRÍTICO.", insuranceImportance: "critical", esim: "essential", errorFareRange: [200, 500] },
  { slug: "buenos-aires", name: "Buenos Aires", emoji: "🥩", country: "Argentina", region: "sudamerica", visa: "no-required", visaNote: "Hasta 90 días sin visado.", insuranceImportance: "high", esim: "essential", errorFareRange: [500, 900] },
  { slug: "costa-rica", name: "Costa Rica", emoji: "🦥", country: "Costa Rica", region: "centroamerica", visa: "no-required", visaNote: "Hasta 90 días sin visado.", insuranceImportance: "high", esim: "essential", errorFareRange: [450, 800] },

  // Oceanía
  { slug: "sydney", name: "Sídney", emoji: "🏖️", country: "Australia", region: "oceania", visa: "evisa", visaNote: "eVisitor 651 online (gratis), 3 meses por entrada.", insuranceImportance: "critical", esim: "essential", errorFareRange: [700, 1300] },
];

export const DESTINOS_BY_SLUG: Record<string, DestinoCatalog> = Object.fromEntries(
  DESTINOS_CATALOG.map((d) => [d.slug, d]),
);

export function getDestino(slug: string): DestinoCatalog | undefined {
  return DESTINOS_BY_SLUG[slug.toLowerCase()];
}

export const DESTINO_SLUGS: string[] = DESTINOS_CATALOG.map((d) => d.slug);
