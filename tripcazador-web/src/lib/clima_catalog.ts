/**
 * clima_catalog.ts — AUDIT-FULL-2 (24 may 2026)
 *
 * Catálogo seed para /clima/[destino]. 12 destinos top con clima mensual:
 * temperatura media, precipitación mm, días sol, mejor mes para visitar.
 *
 * Pure data — fuente: World Meteorological Organization + AEMET + JMA averages
 * 1991-2020 normalizado. NO live API — el dato es estacional estable.
 */

export interface ClimateMonth {
  month: number; // 1-12
  monthName: string;
  tempMinC: number;
  tempMaxC: number;
  precipMm: number;
  sunDays: number;
  recommended: boolean; // sweet spot del año
  note?: string; // "monsón", "tifón season", etc.
}

export interface ClimaEntry {
  slug: string;
  destinoSlug?: string; // si mapea a DESTINOS_CATALOG
  name: string;
  country: string;
  emoji: string;
  climate: "tropical" | "mediterraneo" | "continental" | "desierto" | "templado" | "subtropical";
  oneLiner: string;
  bestMonths: number[]; // 1-12
  worstMonths: number[];
  months: ClimateMonth[];
  packingTips: string[];
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function mkMonths(data: Array<[number, number, number, number, boolean, string?]>): ClimateMonth[] {
  return data.map(([tn, tx, p, s, rec, note], i) => ({
    month: i + 1,
    monthName: MESES[i],
    tempMinC: tn,
    tempMaxC: tx,
    precipMm: p,
    sunDays: s,
    recommended: rec,
    note,
  }));
}

export const CLIMA_CATALOG: ClimaEntry[] = [
  {
    slug: "japon",
    destinoSlug: "japon",
    name: "Japón (Tokio)",
    country: "Japón",
    emoji: "🗼",
    climate: "templado",
    oneLiner: "4 estaciones marcadas. Cerezos en marzo-abril, momiji rojo en octubre-noviembre.",
    bestMonths: [3, 4, 10, 11],
    worstMonths: [6, 7, 8],
    months: mkMonths([
      [2, 10, 52, 19, false],
      [2, 11, 56, 18, false],
      [5, 14, 117, 17, true, "Sakura últimas 2 semanas"],
      [10, 19, 124, 18, true, "Cerezos en flor pico"],
      [15, 23, 138, 17, false],
      [19, 26, 168, 13, false, "Inicio tsuyu (lluvias)"],
      [23, 30, 154, 13, false, "Tsuyu activo, humedad alta"],
      [24, 31, 168, 13, false, "Bochorno extremo + tifones"],
      [21, 27, 210, 13, false, "Pico tifones"],
      [16, 22, 198, 13, true, "Inicio momiji"],
      [10, 17, 93, 16, true, "Momiji pico"],
      [5, 12, 51, 18, false],
    ]),
    packingTips: [
      "Marzo-abril: capas ligeras + chaqueta (10-20°C variable)",
      "Verano: ligero técnico + paraguas (lluvia + calor)",
      "Otoño: capas medias + chaqueta cortavientos",
    ],
  },
  {
    slug: "tailandia",
    destinoSlug: "tailandia",
    name: "Tailandia (Bangkok)",
    country: "Tailandia",
    emoji: "🛕",
    climate: "tropical",
    oneLiner: "Tropical. Temporada seca noviembre-febrero. Monzón mayo-octubre.",
    bestMonths: [11, 12, 1, 2],
    worstMonths: [5, 6, 9, 10],
    months: mkMonths([
      [21, 32, 9, 27, true, "Temporada seca, frescor relativo"],
      [23, 33, 30, 24, true],
      [25, 34, 30, 23, true, "Aún seco pero ya calor"],
      [27, 36, 80, 18, false, "Songkran (13-15) calor pico"],
      [26, 35, 207, 15, false, "Inicio monzón"],
      [26, 33, 184, 13, false],
      [25, 33, 180, 14, false],
      [25, 33, 215, 13, false],
      [24, 32, 311, 9, false, "Pico monzón"],
      [24, 32, 287, 13, false, "Aún muy lluvioso"],
      [22, 31, 53, 21, true, "Inicio temporada seca"],
      [20, 31, 8, 28, true, "Ideal — fresco + sin lluvias"],
    ]),
    packingTips: [
      "Ropa ligera transpirable + manga larga noches",
      "Impermeable de bolsillo en monzón",
      "Pantalón cubre rodilla para templos (Wat Pho, Gran Palacio)",
    ],
  },
  {
    slug: "islandia",
    destinoSlug: "islandia",
    name: "Islandia (Reikiavik)",
    country: "Islandia",
    emoji: "🌋",
    climate: "continental",
    oneLiner: "Subártico húmedo. Auroras boreales sep-mar. Sol medianoche jun-jul.",
    bestMonths: [6, 7, 8],
    worstMonths: [11, 12, 1, 2],
    months: mkMonths([
      [-2, 3, 76, 4, false, "Auroras boreales pico"],
      [-2, 3, 72, 5, false],
      [-1, 4, 82, 7, false],
      [1, 6, 58, 10, false, "Aurora aún visible"],
      [4, 10, 44, 14, true, "Inicio temporada"],
      [7, 12, 50, 17, true, "Sol medianoche"],
      [9, 13, 52, 15, true, "Mejor mes — caluroso y largo"],
      [9, 13, 62, 14, true],
      [6, 11, 74, 11, false, "Inicio auroras"],
      [3, 7, 82, 6, false, "Auroras + nieve"],
      [0, 4, 78, 4, false],
      [-1, 3, 79, 3, false, "Auroras boreales"],
    ]),
    packingTips: [
      "Capas técnicas + cortavientos impermeable obligatorio",
      "Verano: gorro y guantes ligeros (a 8°C aún)",
      "Invierno: térmica + plumas + crampones",
    ],
  },
  {
    slug: "marruecos",
    destinoSlug: "marruecos",
    name: "Marruecos (Marrakech)",
    country: "Marruecos",
    emoji: "🐪",
    climate: "desierto",
    oneLiner: "Continental seco. Primavera y otoño ideales. Verano calor extremo.",
    bestMonths: [3, 4, 10, 11],
    worstMonths: [7, 8],
    months: mkMonths([
      [6, 18, 30, 18, false],
      [8, 20, 34, 18, false],
      [10, 23, 36, 21, true, "Templado y seco"],
      [12, 25, 36, 21, true, "Ideal"],
      [15, 29, 19, 26, false, "Caluroso de día"],
      [19, 34, 7, 28, false],
      [22, 38, 1, 29, false, "Calor extremo"],
      [22, 38, 3, 28, false, "Pico calor"],
      [20, 33, 11, 24, false],
      [16, 28, 23, 23, true, "Templado, días largos"],
      [11, 23, 32, 21, true],
      [7, 19, 32, 18, false],
    ]),
    packingTips: [
      "Verano: cubre nuca + agua siempre",
      "Primavera/otoño: capas — desierto frío de noche (5-10°C)",
      "Modesto en medina (cubre hombros y rodillas)",
    ],
  },
  {
    slug: "estambul",
    destinoSlug: "estambul",
    name: "Estambul",
    country: "Turquía",
    emoji: "🕌",
    climate: "mediterraneo",
    oneLiner: "Mediterráneo con toque continental. Mejor primavera y otoño.",
    bestMonths: [4, 5, 9, 10],
    worstMonths: [1, 7, 8],
    months: mkMonths([
      [3, 9, 90, 8, false, "Lluvioso y frío"],
      [3, 10, 76, 9, false],
      [5, 12, 71, 12, false],
      [8, 17, 47, 15, true, "Tulipanes en flor"],
      [13, 22, 36, 19, true, "Cálido sin masificación"],
      [17, 27, 31, 22, false],
      [20, 29, 35, 25, false, "Calor + humedad"],
      [20, 30, 39, 24, false],
      [17, 26, 53, 19, true, "Sweet spot"],
      [13, 21, 76, 14, true, "Otoñal cálido"],
      [9, 16, 102, 9, false, "Vuelve la lluvia"],
      [5, 11, 113, 7, false],
    ]),
    packingTips: [
      "Capas — entre mañana y tarde 10°C de diferencia",
      "Pañuelo cabeza para mujeres en mezquitas (Sultan Ahmed, Süleymaniye)",
      "Calzado cómodo para empedrado de Sultanahmet",
    ],
  },
  {
    slug: "buenos-aires",
    destinoSlug: "buenos-aires",
    name: "Buenos Aires",
    country: "Argentina",
    emoji: "🥩",
    climate: "subtropical",
    oneLiner: "Hemisferio sur invertido. Verano caluroso (dic-feb), otoño ideal (abr-may).",
    bestMonths: [4, 5, 10, 11],
    worstMonths: [1, 2],
    months: mkMonths([
      [20, 30, 121, 14, false, "Verano caliente"],
      [19, 28, 122, 13, false, "Bochorno"],
      [17, 26, 134, 15, true, "Caliente y agradable"],
      [13, 22, 91, 17, true, "Otoño dorado, ideal"],
      [10, 18, 73, 16, true, "Otoñal pleno"],
      [7, 14, 60, 13, false, "Invierno comienza"],
      [7, 14, 60, 14, false],
      [8, 16, 70, 14, false],
      [10, 18, 80, 14, true, "Inicio primavera"],
      [13, 22, 110, 16, true, "Jacarandás en flor"],
      [16, 25, 110, 15, true],
      [19, 28, 116, 14, false],
    ]),
    packingTips: [
      "Capas — Buenos Aires cambia 8-10°C en pocas horas",
      "Verano: ligero + chubasquero (tormentas eléctricas frecuentes)",
      "Invierno: chaqueta gruesa (no llega a nevar pero humedad penetra)",
    ],
  },
  {
    slug: "nueva-york",
    destinoSlug: "nueva-york",
    name: "Nueva York",
    country: "EE.UU.",
    emoji: "🗽",
    climate: "continental",
    oneLiner: "4 estaciones marcadas. Mejor primavera y otoño. Invierno -10°C posible.",
    bestMonths: [4, 5, 9, 10],
    worstMonths: [1, 2, 7, 8],
    months: mkMonths([
      [-3, 4, 85, 12, false, "Frío + posible nieve"],
      [-2, 5, 76, 11, false],
      [2, 9, 105, 13, false],
      [7, 16, 102, 15, true, "Primavera con flores"],
      [13, 22, 99, 17, true, "Ideal"],
      [18, 27, 93, 19, false, "Calor + humedad"],
      [21, 30, 116, 20, false, "Calor extremo + tormentas"],
      [21, 29, 102, 19, false],
      [17, 25, 102, 16, true, "Sweet spot otoño"],
      [10, 18, 88, 16, true, "Foliage otoño pico"],
      [5, 12, 92, 12, false],
      [-1, 7, 102, 11, false, "Frío + nieve"],
    ]),
    packingTips: [
      "Verano: técnico + paraguas (humedad sofocante)",
      "Otoño: capas + chaqueta + zapato impermeable (lluvia frecuente)",
      "Invierno: térmica + plumas + gorro + guantes",
    ],
  },
  {
    slug: "dubai",
    destinoSlug: "dubai",
    name: "Dubái",
    country: "EAU",
    emoji: "🏗️",
    climate: "desierto",
    oneLiner: "Desierto extremo. Solo viable noviembre-marzo. Verano +45°C es infierno.",
    bestMonths: [11, 12, 1, 2, 3],
    worstMonths: [6, 7, 8, 9],
    months: mkMonths([
      [15, 24, 18, 26, true, "Temporada alta, ideal"],
      [16, 25, 25, 24, true],
      [18, 28, 22, 26, true],
      [21, 33, 7, 28, false, "Empieza calor"],
      [25, 38, 0, 30, false],
      [28, 39, 0, 30, false, "Calor extremo"],
      [30, 41, 1, 30, false, "Pico calor — evitar"],
      [31, 41, 4, 30, false, "Igual al pico"],
      [28, 39, 0, 29, false],
      [24, 35, 1, 30, false, "Aún muy caluroso"],
      [20, 30, 3, 28, true, "Empieza temporada"],
      [17, 26, 14, 25, true, "Ideal — fresco"],
    ]),
    packingTips: [
      "Ropa cubre hombros y rodillas para malls/zoco (cultura)",
      "Verano (si vas): ropa muy ligera + tienda dentro de mall todo el día",
      "Invierno: chaqueta ligera para mañanas/noches (15°C)",
    ],
  },
  {
    slug: "bali",
    destinoSlug: "bali",
    name: "Bali",
    country: "Indonesia",
    emoji: "🌴",
    climate: "tropical",
    oneLiner: "Tropical tibio. Seca abril-octubre, lluviosa nov-marzo (pero no monzón puro).",
    bestMonths: [5, 6, 7, 8, 9],
    worstMonths: [1, 2, 12],
    months: mkMonths([
      [23, 31, 345, 5, false, "Lluvioso pesado"],
      [23, 31, 274, 8, false],
      [23, 32, 254, 10, false, "Inicio transición"],
      [23, 32, 109, 17, true, "Pasa a seca"],
      [22, 31, 73, 21, true, "Ideal"],
      [22, 31, 53, 21, true, "Mejor mes — seco + fresco"],
      [21, 30, 51, 23, true, "Pico turístico"],
      [21, 30, 30, 24, true],
      [22, 31, 60, 22, true],
      [23, 32, 100, 19, true, "Aún seca"],
      [23, 32, 158, 13, false, "Inicia lluvia"],
      [23, 32, 305, 7, false, "Lluvioso pesado"],
    ]),
    packingTips: [
      "Ropa ligera + sarong (templos, oferendas requieren cubre piernas)",
      "Impermeable de bolsillo todo el año",
      "Crema solar SPF50 + repelente mosquitos (dengue endémico)",
    ],
  },
  {
    slug: "lisboa",
    destinoSlug: "lisboa",
    name: "Lisboa",
    country: "Portugal",
    emoji: "🚋",
    climate: "mediterraneo",
    oneLiner: "Mediterráneo ideal. 290+ días sol/año. Mejor abril-junio y septiembre-octubre.",
    bestMonths: [4, 5, 6, 9, 10],
    worstMonths: [12, 1],
    months: mkMonths([
      [8, 15, 110, 17, false],
      [9, 17, 76, 19, false],
      [11, 19, 109, 21, false],
      [12, 21, 54, 23, true, "Primavera"],
      [14, 23, 44, 26, true, "Ideal"],
      [17, 27, 16, 28, true, "Sol + sin masificación"],
      [19, 29, 4, 30, false, "Verano caliente"],
      [20, 30, 7, 30, false, "Pico turistas"],
      [18, 28, 33, 26, true, "Sweet spot"],
      [15, 23, 96, 23, true, "Otoño dorado"],
      [11, 19, 145, 17, false, "Aguaceros frecuentes"],
      [9, 16, 109, 16, false],
    ]),
    packingTips: [
      "Capas ligeras (Lisboa siempre 10°C entre mañana y tarde)",
      "Calzado cómodo para las cuestas y empedrado",
      "Chubasquero ligero — lluvia repentina común",
    ],
  },
  {
    slug: "reykjavik",
    destinoSlug: "reykjavik",
    name: "Reikiavik",
    country: "Islandia",
    emoji: "🌋",
    climate: "continental",
    oneLiner: "Subártico. Solo jun-aug con día completo. Auroras sep-mar.",
    bestMonths: [6, 7, 8],
    worstMonths: [12, 1, 2],
    months: mkMonths([
      [-3, 2, 76, 4, false, "Auroras pico, solo 5h luz"],
      [-3, 3, 72, 6, false],
      [-2, 4, 82, 10, false],
      [1, 7, 58, 13, false, "Auroras aún"],
      [4, 11, 44, 17, true, "Inicio temporada"],
      [8, 13, 50, 19, true, "Sol medianoche"],
      [10, 14, 52, 18, true, "Mejor mes"],
      [10, 13, 62, 16, true],
      [7, 11, 74, 13, false, "Inicio auroras"],
      [3, 7, 82, 7, false, "Auroras + lluvia"],
      [0, 4, 78, 4, false],
      [-2, 3, 79, 3, false, "Aurora pico"],
    ]),
    packingTips: [
      "Mismas reglas que Islandia general: técnico + cortavientos",
      "Bañador para piscinas geotermales (Blue Lagoon, Sky Lagoon)",
      "Crema solar pese al frío (verano sol 22h)",
    ],
  },
  {
    slug: "praga",
    destinoSlug: "praga",
    name: "Praga",
    country: "República Checa",
    emoji: "🏰",
    climate: "continental",
    oneLiner: "Continental. Mejor mayo-septiembre. Diciembre mágico (mercados navideños).",
    bestMonths: [5, 6, 9],
    worstMonths: [1, 2],
    months: mkMonths([
      [-5, 0, 23, 6, false, "Frío extremo, posible nieve"],
      [-4, 2, 22, 8, false],
      [-1, 7, 28, 12, false],
      [3, 13, 38, 15, true, "Primavera tardía"],
      [8, 19, 77, 19, true, "Cálido y verde"],
      [11, 22, 73, 21, true, "Sweet spot"],
      [13, 24, 66, 21, true, "Pico calor (manejable)"],
      [12, 24, 70, 20, true],
      [9, 19, 40, 19, true, "Otoño suave"],
      [5, 13, 31, 16, false, "Frío vuelve"],
      [1, 6, 32, 9, false],
      [-3, 2, 25, 6, false, "Mercados navideños"],
    ]),
    packingTips: [
      "Verano: capas + chaqueta ligera (tardes frescas)",
      "Invierno: térmica + plumas + gorro y guantes",
      "Calzado para empedrado (Karlův most cuesta)",
    ],
  },
];

export const CLIMA_SLUGS: string[] = CLIMA_CATALOG.map((c) => c.slug);

export function getClima(slug: string): ClimaEntry | undefined {
  return CLIMA_CATALOG.find((c) => c.slug === slug.toLowerCase());
}
