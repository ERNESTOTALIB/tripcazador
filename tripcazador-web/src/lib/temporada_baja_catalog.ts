/**
 * temporada_baja_catalog.ts — SSS463 (24 may 2026)
 *
 * Cuándo viajar más barato a cada destino top: mes valle + razón
 * estacional + savings estimado vs pico.
 *
 * SEO: "cuando viajar barato a tokio", "mes mas barato roma",
 * "temporada baja tailandia". Complementa /cuando-viajar (que tiene
 * 12 entradas por mes) con landing single por destino.
 */

export interface TemporadaBajaEntry {
  slug: string;
  destino: string;
  emoji: string;
  /** Mejor mes valle (cheapest). */
  cheapestMonth: string;
  /** Por qué baja en ese mes. */
  reason: string;
  /** Savings % vs pico anual. */
  savingsVsPeakPct: number;
  /** Mes pico que evitar. */
  peakMonth: string;
  /** Tips específicos para viajar en valle. */
  tips: string[];
  /** Caveats (clima, eventos cerrados, etc.). */
  caveats: string[];
}

export const TEMPORADA_BAJA_CATALOG: TemporadaBajaEntry[] = [
  {
    slug: "japon",
    destino: "Japón",
    emoji: "🇯🇵",
    cheapestMonth: "Febrero (sin Año Nuevo chino)",
    reason: "Post-Año Nuevo japonés (1-3 ene), antes de hanami (cerezos). Locales no viajan, hoteles vacíos.",
    savingsVsPeakPct: 45,
    peakMonth: "Abril (Sakura) y agosto (Obon)",
    tips: [
      "Ski en Hokkaido — mejor nieve del mundo, 50% menos que Europa",
      "Onsen tradicionales con descuento mid-week",
      "Vuelo MAD-NRT 350-450€ vs 600-900€ pico",
    ],
    caveats: [
      "Frío real Hokkaido/Tohoku (-5 a 5°C)",
      "Día solar corto (16:30 atardecer)",
    ],
  },
  {
    slug: "tailandia",
    destino: "Tailandia",
    emoji: "🇹🇭",
    cheapestMonth: "Mayo o septiembre",
    reason: "Hombros de monzón. No es la peor lluvia (es agosto-octubre) pero ya bajan los precios.",
    savingsVsPeakPct: 35,
    peakMonth: "Diciembre-enero",
    tips: [
      "Bangkok lluvia muy puntual (1h tarde), resto soleado",
      "Islas (Phuket, Koh Samui) gran calidad/precio mayo",
      "Vuelo MAD-BKK desde 380€",
    ],
    caveats: [
      "Algunas islas tienen ferries reducidos por mar revuelto",
      "Submarinismo limitado en algunas zonas",
    ],
  },
  {
    slug: "tokio",
    destino: "Tokio",
    emoji: "🗼",
    cheapestMonth: "Enero (post Año Nuevo)",
    reason: "Tras feriado nacional 1-3 ene, locales vuelven a trabajar. Turismo internacional vuelve febrero. Ventana 10-25 enero.",
    savingsVsPeakPct: 40,
    peakMonth: "Marzo-abril (cerezos)",
    tips: [
      "Aprovecha Tokyo enero para 'ramen by night' y onsen interior Hakone",
      "Karaoke, izakayas y comida 30% más baratos vs marzo",
    ],
    caveats: [
      "Frío (1-10°C) — ropa de invierno completa",
      "Día corto (anochece 17:00)",
    ],
  },
  {
    slug: "bali",
    destino: "Bali",
    emoji: "🌴",
    cheapestMonth: "Marzo o noviembre",
    reason: "Hombros entre estación seca (mayo-sep) y húmeda (nov-feb). Menos turistas + precios bajan.",
    savingsVsPeakPct: 40,
    peakMonth: "Julio-agosto",
    tips: [
      "Ubud y Canggu cuesta 60% menos que Seminyak en pico",
      "Surf reduce intensidad — mejor para iniciados",
      "Vuelo MAD-DPS desde 550€ vs 900€ pico",
    ],
    caveats: [
      "Lluvia esporádica nov-mar",
      "Algunos beach clubs cierran temporalmente",
    ],
  },
  {
    slug: "nueva-york",
    destino: "Nueva York",
    emoji: "🗽",
    cheapestMonth: "Enero-febrero",
    reason: "Frío extremo, post-fiestas. Hoteles, shows Broadway y musicales bajan 40-50%.",
    savingsVsPeakPct: 50,
    peakMonth: "Diciembre (fiestas) y junio (verano)",
    tips: [
      "Broadway tickets 50% off con TKTS booth Times Square",
      "Hotel Manhattan céntrico desde $150/noche vs $300+ pico",
      "Vuelo MAD-JFK desde 280€ (error fares frecuentes)",
    ],
    caveats: [
      "Frío -5 a -10°C con viento",
      "Nieve ocasional cierra atracciones outdoor",
    ],
  },
  {
    slug: "lisboa",
    destino: "Lisboa",
    emoji: "🇵🇹",
    cheapestMonth: "Noviembre o febrero",
    reason: "Lluvia esporádica pero 18-22°C. Sin cruceros, sin Festival Sardinha (junio).",
    savingsVsPeakPct: 35,
    peakMonth: "Junio-septiembre",
    tips: [
      "Vuelos MAD-LIS desde 25€ ida y vuelta",
      "Pasteles de Belén sin colas",
      "Sintra día completo sin multitudes",
    ],
    caveats: [
      "Lluvia 4-6 días/mes",
      "Mar frío para playa",
    ],
  },
  {
    slug: "marrakech",
    destino: "Marrakech",
    emoji: "🐪",
    cheapestMonth: "Junio o septiembre",
    reason: "Post-Ramadán + antes/después del calor pico julio-agosto (45°C). Riads vacíos.",
    savingsVsPeakPct: 35,
    peakMonth: "Octubre-noviembre",
    tips: [
      "Riads boutique con piscina <50€/noche",
      "Excursiones Atlas con guía 30% más baratas",
      "Vuelo MAD-RAK desde 60€",
    ],
    caveats: [
      "Calor 32-40°C — buscar riads con A/C",
      "Algunos comerciantes cerrados Ramadán",
    ],
  },
  {
    slug: "estambul",
    destino: "Estambul",
    emoji: "🕌",
    cheapestMonth: "Noviembre o febrero",
    reason: "Frío moderado (5-12°C), sin masas turistas, lluvia ocasional. Hoteles 4* desde €60.",
    savingsVsPeakPct: 40,
    peakMonth: "Mayo-septiembre",
    tips: [
      "Hammams (50€) más relajantes sin colas",
      "Crucero Bósforo desierto",
      "Vuelo MAD-IST desde 80€",
    ],
    caveats: [
      "Llovizna intermitente",
      "Algunas mezquitas cerradas por reformas invierno",
    ],
  },
  {
    slug: "buenos-aires",
    destino: "Buenos Aires",
    emoji: "🥩",
    cheapestMonth: "Mayo-junio (otoño austral)",
    reason: "Hoja amarilla, clima templado (10-18°C). Locales en final temporada. Mejor cambio peso blue.",
    savingsVsPeakPct: 35,
    peakMonth: "Enero-febrero (verano)",
    tips: [
      "Tango en milongas locales (no turistas) mayo",
      "Carne argentina en parrillas barrio Palermo 40% menos vs pico",
      "Vuelo MAD-EZE desde 550€",
    ],
    caveats: [
      "Inflación alta — llevar USD efectivo",
      "Lluvia ocasional",
    ],
  },
  {
    slug: "roma",
    destino: "Roma",
    emoji: "🏛️",
    cheapestMonth: "Noviembre o febrero",
    reason: "Post-vendimia + pre-Semana Santa. Hoteles 4* desde €80. Vaticano, Coliseo sin colas.",
    savingsVsPeakPct: 40,
    peakMonth: "Abril y julio-agosto",
    tips: [
      "Restaurantes Trastevere 30% más baratos",
      "Museos accesibles sin tour fast-track caro",
      "Vuelo MAD-FCO desde 35€",
    ],
    caveats: [
      "Llovizna esporádica nov",
      "Días cortos (anochece 17:00)",
    ],
  },
  {
    slug: "praga",
    destino: "Praga",
    emoji: "🏰",
    cheapestMonth: "Enero (post-Navidad)",
    reason: "Frío real (-5 a 5°C) pero precios mínimos. Ya no hay mercados de Navidad. Hoteles 4* desde €50.",
    savingsVsPeakPct: 45,
    peakMonth: "Diciembre (mercados navideños)",
    tips: [
      "Goulash + cerveza por €10 menú completo",
      "Castillo de Praga sin colas, sin nieve",
      "Vuelo MAD-PRG desde 50€",
    ],
    caveats: [
      "Frío seco -5°C de media",
      "Algunos jardines/atracciones outdoor cerrados",
    ],
  },
  {
    slug: "amsterdam",
    destino: "Ámsterdam",
    emoji: "🚲",
    cheapestMonth: "Enero (post-Navidad)",
    reason: "Frío y lluvia ocasional. Locales tras vacaciones. Hoteles boutique desde €100.",
    savingsVsPeakPct: 40,
    peakMonth: "Abril-agosto (tulipanes + verano)",
    tips: [
      "Anne Frank House con reserva 4 semanas (vs 3 meses pico)",
      "Rijksmuseum + Van Gogh sin esperas",
      "Vuelo MAD-AMS desde 55€",
    ],
    caveats: [
      "Frío 2-8°C, ventoso",
      "Lluvia 12-15 días/mes",
    ],
  },
];

export const TEMPORADA_BAJA_BY_SLUG: Record<string, TemporadaBajaEntry> = Object.fromEntries(
  TEMPORADA_BAJA_CATALOG.map((t) => [t.slug, t]),
);

export const TEMPORADA_BAJA_SLUGS = TEMPORADA_BAJA_CATALOG.map((t) => t.slug);

export function getTemporadaBaja(slug: string): TemporadaBajaEntry | null {
  return TEMPORADA_BAJA_BY_SLUG[slug] ?? null;
}
