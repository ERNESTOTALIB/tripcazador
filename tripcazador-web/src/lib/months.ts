/**
 * months.ts — abr-2026dd.
 *
 * Páginas /vuelos-baratos-[mes]: SEO seasonal con destinos top + precios típicos
 * por mes. Captura keywords "vuelos baratos enero", "viajar barato febrero".
 */

export interface MonthGuide {
  slug: string;
  monthEs: string;
  monthEn: string;
  number: number;
  emoji: string;
  description: string;
  topDestinations: Array<{ name: string; iata: string; price: number; reason: string }>;
  avoid: string[];
  tips: string[];
}

export const MONTHS: MonthGuide[] = [
  {
    slug: "enero",
    monthEs: "Enero",
    monthEn: "January",
    number: 1,
    emoji: "❄️",
    description: "Enero es el mes post-Navidad: precios bajos, demanda baja, ideal para quien tiene flexibilidad. Tier 1 para casi todos los destinos.",
    topDestinations: [
      { name: "Cuba (La Habana)", iata: "HAV", price: 380, reason: "Temporada seca + sin huracanes" },
      { name: "Tailandia (Bangkok)", iata: "BKK", price: 420, reason: "Mejor mes histórico para precios" },
      { name: "Caribe (Cancún, Punta Cana)", iata: "CUN", price: 420, reason: "Pico clima + post-Navidad bajada" },
      { name: "Buenos Aires", iata: "EZE", price: 450, reason: "Verano austral + post-fiestas" },
    ],
    avoid: ["Norte de Europa (frío extremo + poca luz)", "Auroras boreales si no soportas frío"],
    tips: [
      "Evitar primeros 7 días enero: post-Reyes, demanda media",
      "Mejor: 15-31 enero para precios mínimos",
      "Configura alertas para Caribe/Sudeste Asiático en este mes",
    ],
  },
  {
    slug: "febrero",
    monthEs: "Febrero",
    monthEn: "February",
    number: 2,
    emoji: "🌷",
    description: "Febrero es el mes más barato del año estadísticamente. Mejor relación precio/disponibilidad para 80% de destinos. Tier 1 absoluto.",
    topDestinations: [
      { name: "Tokio (sin sakura)", iata: "NRT", price: 480, reason: "Pre-sakura, precios mínimos" },
      { name: "Tailandia", iata: "BKK", price: 298, reason: "Floor histórico anual" },
      { name: "Maldivas", iata: "MLE", price: 580, reason: "Buena temporada + precios pre-Pascua" },
      { name: "Cuba", iata: "HAV", price: 280, reason: "Mes más barato MAD-HAV histórico" },
    ],
    avoid: ["Lugares con eventos masivos (San Valentín si no eres pareja)", "Estaciones esquí pico"],
    tips: [
      "Mejor mes para error fares (volumen máximo del año)",
      "Configurar alertas con 90-120 días de antelación",
      "Combinar con shoulder week pre-pico (último 7 días enero)",
    ],
  },
  {
    slug: "marzo",
    monthEs: "Marzo",
    monthEn: "March",
    number: 3,
    emoji: "🌸",
    description: "Marzo es shoulder season: clima mejorando, precios moderados, sin masas turísticas. Buen mes para Asia + Sudeste + Europa Sur.",
    topDestinations: [
      { name: "Japón (sakura)", iata: "NRT", price: 950, reason: "Cerezos en flor — temporada alta turística" },
      { name: "Marruecos", iata: "RAK", price: 145, reason: "Clima perfecto sin lluvia" },
      { name: "Estambul", iata: "IST", price: 155, reason: "Pre-temporada turística" },
      { name: "Sudáfrica", iata: "CPT", price: 465, reason: "Otoño austral, fauna activa" },
    ],
    avoid: ["Pascua si cae en marzo (precios pico)", "Norte de Europa todavía frío"],
    tips: [
      "Evitar Semana Santa (variable, marzo o abril)",
      "Sakura Japón = caro pero único; bookear 4-6 meses antes",
      "Marruecos óptimo precio + clima",
    ],
  },
  {
    slug: "abril",
    monthEs: "Abril",
    monthEn: "April",
    number: 4,
    emoji: "🌺",
    description: "Abril es transición: clima primaveral en Europa, alta demanda en Pascua. Sweet spot para Europa Sur antes del pico verano.",
    topDestinations: [
      { name: "Italia (Roma, Florencia)", iata: "FCO", price: 145, reason: "Primavera europea, antes del pico" },
      { name: "Grecia (Atenas)", iata: "ATH", price: 195, reason: "Clima ideal pre-pico turístico" },
      { name: "Marruecos", iata: "RAK", price: 195, reason: "Calor controlado, sin masas" },
      { name: "Vietnam", iata: "HAN", price: 620, reason: "Pre-monzón, clima perfecto" },
    ],
    avoid: ["Pascua semana (precios pico)", "Songkran Tailandia (11-15 abril)"],
    tips: [
      "Bookear ANTES Pascua o DESPUÉS — durante es 60-100% más caro",
      "Songkran Tailandia: festival único pero precios y multitudes pico",
      "Europa Sur en abril: óptimo precio/clima",
    ],
  },
  {
    slug: "mayo",
    monthEs: "Mayo",
    monthEn: "May",
    number: 5,
    emoji: "🌻",
    description: "Mayo es shoulder season Europa: clima excelente, precios moderados. Tier 1 para Europa centro y sur, especialmente para escapadas.",
    topDestinations: [
      { name: "París, Roma, Berlín", iata: "CDG/FCO/BER", price: 195, reason: "Primavera europea" },
      { name: "Cuba", iata: "HAV", price: 580, reason: "Pre-temporada lluvias caribe" },
      { name: "Vietnam", iata: "HAN", price: 580, reason: "Última semana antes monzón" },
      { name: "Bali (DPS)", iata: "DPS", price: 1150, reason: "Off-peak con buen clima" },
    ],
    avoid: ["Asia central tropical (pre-monzón húmedo)", "Caribe (huracanes empiezan)"],
    tips: [
      "Mayo es tier 1 para Europa: combinar varias capitales",
      "Evitar puentes: 1-2 mayo + festivos locales",
      "Bali shoulder: mejor mes precio + clima",
    ],
  },
  {
    slug: "junio",
    monthEs: "Junio",
    monthEn: "June",
    number: 6,
    emoji: "☀️",
    description: "Junio es transición a temporada alta verano. Precios suben pero antes del pico julio-agosto. Buen mes para Mediterráneo y Europa Norte.",
    topDestinations: [
      { name: "Reykjavik (auroras imposibles)", iata: "KEF", price: 320, reason: "Sol medianoche, todo abierto" },
      { name: "Croacia (Dubrovnik)", iata: "DBV", price: 295, reason: "Antes pico julio" },
      { name: "Japón (Hokkaido)", iata: "CTS", price: 950, reason: "Lavanda en flor + clima fresco" },
      { name: "Sudáfrica", iata: "CPT", price: 920, reason: "Invierno austral, ballenas" },
    ],
    avoid: ["Tailandia (monzón completo)", "Caribe (huracanes activos)"],
    tips: [
      "Junio es 'pre-pico': shoulder week 1-15 junio = 30% más barato que 16-30",
      "Festivales: evitar fechas concretas (Web Summit Lisboa, etc.)",
      "Reservar Mediterráneo 4-6 meses antes",
    ],
  },
  {
    slug: "julio",
    monthEs: "Julio",
    monthEn: "July",
    number: 7,
    emoji: "🏖️",
    description: "Julio es pico turístico mundial. Precios máximos en casi todo Europa + Caribe + Asia. Solo recomendable para destinos contra-temporada (Sudáfrica, Sudamérica).",
    topDestinations: [
      { name: "Sudáfrica", iata: "CPT", price: 1180, reason: "Invierno austral seguro, ballenas" },
      { name: "Argentina (Patagonia)", iata: "BRC", price: 1450, reason: "Esquí austral" },
      { name: "Islandia", iata: "KEF", price: 595, reason: "Sol medianoche pico" },
      { name: "Indonesia (Bali off-peak)", iata: "DPS", price: 1450, reason: "Caro pero estación seca" },
    ],
    avoid: ["Cualquier playa Mediterránea/Caribe/Sudeste Asia", "Norte de África (calor extremo)"],
    tips: [
      "EVITAR: Italia, Grecia, Croacia, Mediterráneo en general (precios x2-3)",
      "Si es necesario julio: Sudáfrica + Argentina son las opciones contra-temporada",
      "Auroras en Islandia imposibles (luz 24/7)",
    ],
  },
  {
    slug: "agosto",
    monthEs: "Agosto",
    monthEn: "August",
    number: 8,
    emoji: "🌅",
    description: "Agosto sigue siendo pico turismo. Última semana es ligeramente mejor. Costes prohibitivos casi en todo. Solo recomendable contra-temporada.",
    topDestinations: [
      { name: "Sudáfrica", iata: "CPT", price: 1100, reason: "Continúa invierno austral, fauna activa" },
      { name: "Argentina (Bariloche)", iata: "BRC", price: 1380, reason: "Pico esquí austral" },
      { name: "Tasmania (Australia)", iata: "HBA", price: 2200, reason: "Invierno austral templado" },
    ],
    avoid: ["Todo el Mediterráneo", "Asia tropical (monzón)", "Caribe (huracanes pico)"],
    tips: [
      "Última semana agosto = 25-35% más barata que primera",
      "Vuelta cole presiona precios hacia abajo finales mes",
      "Si vacaciones obligadas en agosto: contra-temporada",
    ],
  },
  {
    slug: "septiembre",
    monthEs: "Septiembre",
    monthEn: "September",
    number: 9,
    emoji: "🍇",
    description: "Septiembre es shoulder season post-pico. Precios bajan 30-40% vs agosto, clima sigue cálido. Tier 1 para Mediterráneo + Caribe.",
    topDestinations: [
      { name: "Italia (post-pico)", iata: "FCO", price: 110, reason: "Clima ideal sin masas + 35% más barato" },
      { name: "Grecia (islas)", iata: "ATH", price: 165, reason: "Mediterráneo sin saturación" },
      { name: "Caribe", iata: "CUN", price: 595, reason: "Post-huracanes (mid-late sept)" },
      { name: "Marruecos", iata: "RAK", price: 195, reason: "Post-pico turismo, clima ideal" },
    ],
    avoid: ["Pre-Web Summit Lisboa (Nov pero presión septiembre)"],
    tips: [
      "Mejor mes total para Mediterráneo (precio + clima)",
      "Caribe post-pico huracanes (16-30 septiembre)",
      "Bookear con 2-3 semanas margen, demanda baja",
    ],
  },
  {
    slug: "octubre",
    monthEs: "Octubre",
    monthEn: "October",
    number: 10,
    emoji: "🍂",
    description: "Octubre es tier 1: precios bajan, clima excelente para casi todo el mundo. Mejor mes para Asia (post-monzón), África Sur, Mediterráneo, USA.",
    topDestinations: [
      { name: "Japón (momiji)", iata: "NRT", price: 845, reason: "Cerezos otoño = sakura sin masas" },
      { name: "Tailandia", iata: "BKK", price: 510, reason: "Post-monzón, clima ideal" },
      { name: "Sudáfrica", iata: "CPT", price: 820, reason: "Spring austral, ballenas + flores" },
      { name: "Croacia (Dubrovnik)", iata: "DBV", price: 245, reason: "Clima ideal sin masas" },
    ],
    avoid: ["Norte Europa (lluvia + frío empiezan)"],
    tips: [
      "Octubre es probablemente el mejor mes del año worldwide",
      "Combinar varias regiones: Mediterráneo + Marruecos + Sudáfrica",
      "Configurar alertas con 60 días antelación",
    ],
  },
  {
    slug: "noviembre",
    monthEs: "Noviembre",
    monthEn: "November",
    number: 11,
    emoji: "🦃",
    description: "Noviembre es tier 1: precios mínimos pre-Navidad, clima estable Caribe + Asia. Excelente para escapadas de fin de semana europeas.",
    topDestinations: [
      { name: "Caribe (Cuba, Cancún)", iata: "HAV", price: 350, reason: "Post-huracanes, alta temporada empezando" },
      { name: "Tailandia", iata: "BKK", price: 520, reason: "Inicio temporada seca ideal" },
      { name: "Marruecos", iata: "RAK", price: 175, reason: "Pre-Navidad, clima perfecto" },
      { name: "Maldivas", iata: "MLE", price: 950, reason: "Estación seca empezando" },
    ],
    avoid: ["Web Summit Lisboa (variable, suele caer noviembre — saturación + precios x3)"],
    tips: [
      "Noviembre es óptimo precio + clima para Caribe",
      "Black Friday + Black Week traen ofertas especiales aerolíneas",
      "Evitar fechas exactas Web Summit + Thanksgiving USA",
    ],
  },
  {
    slug: "diciembre",
    monthEs: "Diciembre",
    monthEn: "December",
    number: 12,
    emoji: "🎄",
    description: "Diciembre es bipolar: primeras 2-3 semanas baratas, semana Navidad pico turístico. Mercados navideños son únicos pero caros. Buenas opciones con flexibilidad.",
    topDestinations: [
      { name: "Caribe (post-Navidad)", iata: "CUN", price: 425, reason: "Pre-pico Navidad para flexibles" },
      { name: "Mercados Navideños (Praga, Viena)", iata: "PRG", price: 65, reason: "Únicos pero turísticos" },
      { name: "Sudeste Asiático", iata: "BKK", price: 685, reason: "Estación seca pico" },
      { name: "Tailandia", iata: "BKK", price: 685, reason: "Floor pre-Navidad alta" },
    ],
    avoid: ["22 dic - 5 ene (pico Navidad, precios x2-3)"],
    tips: [
      "Mejor primera quincena diciembre para precios + mercados",
      "Evitar 22 dic - 5 ene a toda costa (precios pico)",
      "Reservar mercados navideños con 4-6 meses antelación",
    ],
  },
];

export function getMonthBySlug(slug: string): MonthGuide | null {
  return MONTHS.find((m) => m.slug === slug) || null;
}
