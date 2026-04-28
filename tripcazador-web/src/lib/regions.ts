/**
 * regions.ts — abr-2026cc.
 *
 * Hub pages para regiones turísticas. Agrupan destinos + comparativas + blog
 * posts asociados. Para SEO long-tail "vuelos al Caribe", "vuelos al sudeste
 * asiático", etc.
 */

export interface Region {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  destSlugs: string[]; // slugs de destinos
  comparisonSlugs: string[]; // slugs de comparativas
  blogSlugs: string[]; // slugs de blog posts
  bestMonths: string[];
  flightTimeFromSpain: string;
  averageBudget: string;
  highlights: string[];
}

export const REGIONS: Region[] = [
  {
    slug: "caribe",
    name: "Caribe",
    emoji: "🏝️",
    description:
      "El Caribe combina playas top mundial, cultura latinoamericana, ron, salsa y vuelos directos desde Madrid a precios razonables. Ideal para vacaciones todo incluido o exploración cultural.",
    destSlugs: ["nueva-york", "buenos-aires"],
    comparisonSlugs: ["cancun-vs-punta-cana-caribe", "cuba-vs-republica-dominicana-caribe"],
    blogSlugs: [
      "vuelos-cuba-baratos-desde-espana-2026",
      "caribe-vuelos-baratos-2026-guia-completa",
    ],
    bestMonths: ["Enero", "Febrero", "Marzo", "Noviembre", "Diciembre"],
    flightTimeFromSpain: "9-11h directo desde Madrid",
    averageBudget: "€1500-3000 por persona, 7-10 días",
    highlights: [
      "Cuba: La Habana auténtica + Trinidad colonial",
      "Cancún: combo playa Caribe + ruinas mayas",
      "Punta Cana: capital all-inclusive del mundo",
      "Aerolíneas key: Iberia, Air Europa, Qatar via DOH",
    ],
  },
  {
    slug: "europa-este",
    name: "Europa del Este",
    emoji: "🏰",
    description:
      "Europa del Este combina arquitectura espectacular, gastronomía underrated, vida nocturna alternativa y precios significativamente más bajos que Europa Occidental. Praga, Budapest, Berlín y más.",
    destSlugs: ["praga", "berlin"],
    comparisonSlugs: [
      "praga-vs-budapest-fin-de-semana",
      "berlin-vs-praga-fin-de-semana",
      "madrid-vs-berlin-fin-de-semana",
    ],
    blogSlugs: ["aeropuertos-secundarios-europa-cuales-merecen-pena-2026"],
    bestMonths: ["Mayo", "Junio", "Septiembre", "Octubre"],
    flightTimeFromSpain: "2h 45min - 3h 30min",
    averageBudget: "€400-800 por persona, 4-7 días",
    highlights: [
      "Praga: cien torres, gótico, cerveza checa",
      "Budapest: baños termales únicos, ruin pubs",
      "Berlín: techno, Memorial, museos siglo XX",
      "Aerolíneas key: Ryanair, Wizz Air, easyJet",
    ],
  },
  {
    slug: "sudeste-asiatico",
    name: "Sudeste Asiático",
    emoji: "🛕",
    description:
      "Sudeste Asiático ofrece la mejor relación calidad-precio para viajeros largo radio: Tailandia, Vietnam, Indonesia (Bali), Camboya, Filipinas. Comida, playas, cultura y precios increíblemente bajos.",
    destSlugs: ["tailandia", "bali", "vietnam", "singapur"],
    comparisonSlugs: [
      "bangkok-vs-phuket-tailandia",
      "bali-vs-tailandia-vacaciones",
      "tailandia-vs-vietnam-sudeste-asiatico",
      "bali-vs-maldivas-luna-miel",
    ],
    blogSlugs: [
      "tailandia-monzon-cuando-ir-vuelos-baratos",
      "cuando-volar-tailandia-barato-2026",
      "bali-off-peak-cheap-flights-november-2026",
    ],
    bestMonths: ["Noviembre", "Diciembre", "Enero", "Febrero", "Marzo"],
    flightTimeFromSpain: "13-22h con escala",
    averageBudget: "€1500-3000 por persona, 14 días",
    highlights: [
      "Tailandia: combo Bangkok + islas paradisíacas",
      "Vietnam: comida calle excepcional + Halong Bay",
      "Bali: yoga, surf, templos, arrozales",
      "Aerolíneas key: Qatar Airways, Singapore Airlines, KLM",
    ],
  },
  {
    slug: "norte-africa",
    name: "Norte de África",
    emoji: "🐪",
    description:
      "Norte de África combina patrimonio histórico único (Pirámides, medinas), gastronomía mediterránea-árabe excepcional y precios accesibles. Marrakech a 3h vuelo desde Madrid es la opción más popular.",
    destSlugs: ["marrakech", "el-cairo"],
    comparisonSlugs: [
      "estambul-vs-marrakech-cultura",
      "marrakech-vs-cairo-norte-africa",
    ],
    blogSlugs: ["marrakech-cuando-ir-vuelos-baratos-2026"],
    bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    flightTimeFromSpain: "3h-4h 30min",
    averageBudget: "€600-1500 por persona, 5-7 días",
    highlights: [
      "Marrakech: zocos, Majorelle, riads tradicionales",
      "El Cairo: Pirámides, Esfinge, Museo Egipcio",
      "Estambul: cruce Europa-Asia, Hagia Sofía",
      "Aerolíneas key: Ryanair, Royal Air Maroc, EgyptAir",
    ],
  },
  {
    slug: "sudamerica",
    name: "Sudamérica",
    emoji: "🥩",
    description:
      "Sudamérica para hispanohablantes: Argentina, Chile, Perú, Colombia, México (a veces clasificado aquí). Paisajes únicos (Patagonia, Atacama, Amazonas) + cultura latinoamericana auténtica + costes razonables en destino.",
    destSlugs: ["buenos-aires"],
    comparisonSlugs: [
      "buenos-aires-vs-santiago-sudamerica",
      "mexico-vs-buenos-aires-latinoamerica",
    ],
    blogSlugs: ["vuelos-buenos-aires-baratos-desde-espana-2026"],
    bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    flightTimeFromSpain: "11-14h directo o con escala",
    averageBudget: "€1500-2500 por persona, 14 días",
    highlights: [
      "Buenos Aires: tango, asado, librerías, blue dollar",
      "Santiago: gateway Atacama + Patagonia chilena",
      "México DF: gastronomía top + ruinas mayas",
      "Aerolíneas key: Iberia, Aerolíneas Argentinas, LATAM",
    ],
  },
  {
    slug: "asia-este",
    name: "Asia Este",
    emoji: "🗼",
    description:
      "Asia Este (Japón, Corea, China, Hong Kong) combina tradición milenaria con tecnología futurista. Más caro que sudeste asiático pero experiencia única. Hubs de tránsito (Tokio, Hong Kong, Seúl) excepcionales.",
    destSlugs: ["japon", "tokio", "hong-kong", "singapur"],
    comparisonSlugs: ["tokio-vs-seul-asia"],
    blogSlugs: [
      "japon-otono-momiji-vuelos-baratos",
      "japon-sakura-2027-vuelos-baratos",
      "tokyo-business-class-error-fares-2026",
      "ana-vs-jal-business-class-2026",
    ],
    bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    flightTimeFromSpain: "11-14h con escala",
    averageBudget: "€2000-4000 por persona, 14 días",
    highlights: [
      "Tokio: tradición + neón, sushi top, trenes bala",
      "Seúl: K-pop, BBQ coreano, technology",
      "Hong Kong: skyline, dim sum, Victoria Peak",
      "Aerolíneas key: ANA, JAL, Cathay Pacific, Korean Air",
    ],
  },
];

export function getRegionBySlug(slug: string): Region | null {
  return REGIONS.find((r) => r.slug === slug) || null;
}
