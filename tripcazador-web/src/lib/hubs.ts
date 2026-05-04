/**
 * hubs.ts — abr-2026y.
 *
 * Hubs aeropuerto españoles para landing pages /vuelos-desde/[hub].
 * Cada hub tiene metadata structured: nombre, IATA, ciudad, top destinos
 * por categoría y aerolíneas operativas relevantes.
 *
 * Por qué SEO: cada hub es una keyword "vuelos desde Madrid", "vuelos
 * baratos desde Barcelona" con volumen mensual considerable. Una landing
 * dedicada con datos del motor + listado de aerolíneas + top destinos
 * captura long-tail que no captura el genérico /destinos.
 */

export interface HubAirport {
  /** IATA. Identifier estable. */
  code: string;
  /** Nombre del aeropuerto. */
  name: string;
  /** Ciudad. */
  city: string;
  /** Región/CCAA. */
  region: string;
  /** Distancia al centro ciudad. */
  distanceKm: number;
  /** Tipo de transporte público al centro y tiempo estimado. */
  cityAccess: string;
  /** Aerolíneas con base/operación principal aquí. */
  primaryAirlines: string[]; // IATA codes
  /** Categoría operativa: hub principal | secundario | regional. */
  category: "hub-principal" | "hub-secundario" | "regional";
  /** Top destinos europeos por frecuencia desde este hub. */
  topEuropeDestinations: Array<{
    iata: string;
    city: string;
    typicalPriceEur: number;
    minObservedEur: number;
  }>;
  /** Top destinos long-haul. */
  topLongHaulDestinations: Array<{
    iata: string;
    city: string;
    typicalPriceEur: number;
    minObservedEur: number;
  }>;
  /** Descripción long-form. */
  description: string;
  /** Tips locales (3-6). */
  tips: string[];
}

export const HUBS: HubAirport[] = [
  {
    code: "MAD",
    name: "Adolfo Suárez Madrid-Barajas",
    city: "Madrid",
    region: "Comunidad de Madrid",
    distanceKm: 12,
    cityAccess: "Metro línea 8 (40min, 5€) o Cercanías C1 (25min, 2.60€)",
    primaryAirlines: ["IB", "FR", "VY", "U2", "AY", "LH", "AF", "BA"],
    category: "hub-principal",
    topEuropeDestinations: [
      { iata: "LIS", city: "Lisboa", typicalPriceEur: 78, minObservedEur: 9 },
      { iata: "FCO", city: "Roma", typicalPriceEur: 95, minObservedEur: 22 },
      { iata: "CDG", city: "París", typicalPriceEur: 145, minObservedEur: 45 },
      { iata: "AMS", city: "Ámsterdam", typicalPriceEur: 165, minObservedEur: 38 },
      { iata: "LHR", city: "Londres", typicalPriceEur: 195, minObservedEur: 65 },
      { iata: "FRA", city: "Frankfurt", typicalPriceEur: 195, minObservedEur: 58 },
    ],
    topLongHaulDestinations: [
      { iata: "EZE", city: "Buenos Aires", typicalPriceEur: 750, minObservedEur: 380 },
      { iata: "JFK", city: "Nueva York", typicalPriceEur: 580, minObservedEur: 290 },
      { iata: "MEX", city: "Ciudad de México", typicalPriceEur: 720, minObservedEur: 410 },
      { iata: "NRT", city: "Tokio", typicalPriceEur: 980, minObservedEur: 480 },
      { iata: "BKK", city: "Bangkok", typicalPriceEur: 475, minObservedEur: 298 },
    ],
    description:
      "Madrid Barajas es el hub principal de España y la puerta de entrada europea hacia Latinoamérica. Iberia tiene base operativa exclusiva aquí, con la red largo-radio más densa de cualquier hub español. Para el viajero hispanohablante hacia Argentina, México, Cuba, Chile o Perú, MAD es el punto de salida natural — frecuencias diarias, precio competitivo y producto cabina de gama alta. Para escapadas europeas, MAD compite con BCN: similar variedad, precios ligeramente más altos en short-haul pero red más completa.",
    tips: [
      "Terminal T4 (Iberia + oneworld) bien conectada, Terminales T1/T2/T3 más antiguas y caóticas en horas punta",
      "Mejor checkin online + bag-drop para evitar colas mañanas (8-10am suele ser pico)",
      "Cercanías C1 desde Atocha es la opción más barata si no llevas mucho equipaje",
      "Lounge VIP Sala Cibeles (Pay Per Use) si tu cabina no incluye lounge — 35€/3h",
      "El hotel del aeropuerto NH Eurobuilding tiene tarifas decentes para conexiones nocturnas",
    ],
  },
  {
    code: "BCN",
    name: "Josep Tarradellas Barcelona-El Prat",
    city: "Barcelona",
    region: "Cataluña",
    distanceKm: 15,
    cityAccess: "Metro L9 (35min, 5.50€) o Aerobús (35min, 7.25€)",
    primaryAirlines: ["VY", "FR", "U2", "IB", "LH", "EI"],
    category: "hub-principal",
    topEuropeDestinations: [
      { iata: "CDG", city: "París", typicalPriceEur: 95, minObservedEur: 28 },
      { iata: "LIS", city: "Lisboa", typicalPriceEur: 78, minObservedEur: 22 },
      { iata: "FCO", city: "Roma", typicalPriceEur: 65, minObservedEur: 12 },
      { iata: "AMS", city: "Ámsterdam", typicalPriceEur: 105, minObservedEur: 38 },
      { iata: "LGW", city: "Londres", typicalPriceEur: 95, minObservedEur: 28 },
      { iata: "MUC", city: "Múnich", typicalPriceEur: 165, minObservedEur: 55 },
    ],
    topLongHaulDestinations: [
      { iata: "JFK", city: "Nueva York", typicalPriceEur: 510, minObservedEur: 280 },
      { iata: "DOH", city: "Doha", typicalPriceEur: 475, minObservedEur: 295 },
      { iata: "DXB", city: "Dubái", typicalPriceEur: 550, minObservedEur: 340 },
      { iata: "BKK", city: "Bangkok", typicalPriceEur: 510, minObservedEur: 310 },
    ],
    description:
      "Barcelona El Prat es el segundo hub español por tráfico y el hub principal de Vueling, que opera 60+ destinos europeos directos desde aquí. Para escapadas dentro de Europa desde Cataluña, BCN es prácticamente la primera opción — frecuencia y distribución horaria superan a MAD en short-haul europeo. En long-haul, BCN está creciendo (vuelos directos a Asia y América via DOH, JFK, DXB), pero sigue siendo secundario respecto a MAD. La calidad operativa de Vueling post-IAG (2018+) es notable: cancelaciones bajas, asignación predecible.",
    tips: [
      "Terminal T1 más moderna (Vueling + Iberia + intercontinental); T2 es low-cost (Ryanair)",
      "Aerobús desde Plaça Catalunya es la opción más rápida fuera de horario metro",
      "Lounge Sala Pau Casals (Vueling + Star Alliance) es decente para pay-per-use",
      "Conexiones cortas dentro de T1 son fáciles; T1↔T2 requiere bus shuttle (15min)",
      "Para vuelos muy temprano, taxi nocturno desde centro a aeropuerto = ~30€",
    ],
  },
  {
    code: "AGP",
    name: "Málaga-Costa del Sol",
    city: "Málaga",
    region: "Andalucía",
    distanceKm: 8,
    cityAccess: "Tren cercanías C1 (12min, 2€) — el mejor acceso de cualquier aeropuerto ES",
    primaryAirlines: ["FR", "U2", "VY", "BA", "LH"],
    category: "hub-secundario",
    topEuropeDestinations: [
      { iata: "LGW", city: "Londres", typicalPriceEur: 88, minObservedEur: 22 },
      { iata: "STN", city: "Londres Stansted", typicalPriceEur: 75, minObservedEur: 18 },
      { iata: "MAN", city: "Manchester", typicalPriceEur: 95, minObservedEur: 28 },
      { iata: "DUB", city: "Dublín", typicalPriceEur: 110, minObservedEur: 32 },
      { iata: "AMS", city: "Ámsterdam", typicalPriceEur: 125, minObservedEur: 45 },
    ],
    topLongHaulDestinations: [
      { iata: "JFK", city: "Nueva York", typicalPriceEur: 620, minObservedEur: 380 },
      { iata: "DXB", city: "Dubái", typicalPriceEur: 595, minObservedEur: 350 },
    ],
    description:
      "Málaga es el aeropuerto más turístico de España fuera de Madrid/Barcelona. Tráfico estacional alto (mayo-octubre) con red europea densa hacia UK, Países Bajos, Alemania y Escandinavia. Para residentes en Costa del Sol, AGP es la primera opción — y no requiere conexión vía MAD/BCN para la mayoría de destinos europeos. El acceso al centro es el mejor de cualquier aeropuerto español: 12 minutos en cercanías por 2€.",
    tips: [
      "El cercanías C1 es comprable directamente en máquinas (no requiere reserva)",
      "Pico de tráfico Junio-Agosto: llegar 2h antes del vuelo internacional",
      "Lounge VIP Sala Pablo Ruiz Picasso (pay-per-use) decente",
      "Hoteles de aeropuerto NH y Holiday Inn están a 5min andando",
      "Estacionamiento más barato fuera del aeropuerto (Pinos del Limonar, ~10€/día)",
    ],
  },
  {
    code: "VLC",
    name: "Valencia",
    city: "Valencia",
    region: "Comunidad Valenciana",
    distanceKm: 9,
    cityAccess: "Metro líneas 3 y 5 (25min, 3.90€) o Bus EMT 150 (35min, 1.45€)",
    primaryAirlines: ["FR", "U2", "VY", "TP"],
    category: "hub-secundario",
    topEuropeDestinations: [
      { iata: "FCO", city: "Roma", typicalPriceEur: 95, minObservedEur: 28 },
      { iata: "CRL", city: "París Beauvais", typicalPriceEur: 72, minObservedEur: 18 },
      { iata: "LGW", city: "Londres", typicalPriceEur: 105, minObservedEur: 32 },
      { iata: "LIS", city: "Lisboa", typicalPriceEur: 65, minObservedEur: 22 },
      { iata: "AMS", city: "Ámsterdam", typicalPriceEur: 145, minObservedEur: 55 },
    ],
    topLongHaulDestinations: [
      { iata: "JFK", city: "Nueva York", typicalPriceEur: 720, minObservedEur: 420 },
    ],
    description:
      "Valencia es un hub secundario en crecimiento. Ryanair y Vueling operan rutas europeas competitivas, pero la red long-haul es limitada — generalmente requiere conexión vía MAD/BCN. Para residentes en Comunidad Valenciana, las escapadas europeas son perfectamente atendidas; para destinos transatlánticos, suele compensar coger el AVE a MAD (1h45min) y volar long-haul desde Barajas.",
    tips: [
      "El metro al aeropuerto es 24h en horario reducido — útil para vuelos muy temprano",
      "Ryanair sale desde T1 (terminal antigua), Vueling y mainline desde T2",
      "Para US/Asia, AVE Valencia-Madrid (1h45m, ~25€) + vuelo MAD suele salir más barato",
      "Aerocity bus directo cada 30min al centro por 1.45€",
    ],
  },
  {
    code: "SVQ",
    name: "Sevilla",
    city: "Sevilla",
    region: "Andalucía",
    distanceKm: 10,
    cityAccess: "Bus EA (35min, 4€) — directo al centro Plaza de Armas",
    primaryAirlines: ["FR", "VY", "TP", "U2"],
    category: "regional",
    topEuropeDestinations: [
      { iata: "LIS", city: "Lisboa", typicalPriceEur: 85, minObservedEur: 28 },
      { iata: "CDG", city: "París", typicalPriceEur: 125, minObservedEur: 45 },
      { iata: "FCO", city: "Roma", typicalPriceEur: 110, minObservedEur: 38 },
      { iata: "AMS", city: "Ámsterdam", typicalPriceEur: 165, minObservedEur: 65 },
    ],
    topLongHaulDestinations: [],
    description:
      "Sevilla es un hub regional con red europea decente pero sin conexiones long-haul directas. Ryanair y Vueling cubren escapadas europeas; cualquier destino fuera de Europa requiere conexión vía MAD/BCN/CDG/LIS. Para residentes en Andalucía Occidental es el aeropuerto natural; para tráfico turístico, AGP suele tener más opciones.",
    tips: [
      "El Bus EA es la opción más práctica: directo al centro, 4€",
      "Ryanair y Vueling concentran la mayor parte del tráfico",
      "Para conexiones long-haul, considerar volar a LIS y desde allí continuar (TAP)",
      "Aeropuerto compacto con un único terminal — conexiones rápidas",
    ],
  },
  {
    code: "BIO",
    name: "Bilbao",
    city: "Bilbao",
    region: "País Vasco",
    distanceKm: 9,
    cityAccess: "Bus Bizkaibus A3247 (20min, 3€) hasta Termibus en centro",
    primaryAirlines: ["IB", "VY", "FR", "AF"],
    category: "regional",
    topEuropeDestinations: [
      { iata: "LIS", city: "Lisboa", typicalPriceEur: 110, minObservedEur: 35 },
      { iata: "CDG", city: "París", typicalPriceEur: 125, minObservedEur: 48 },
      { iata: "FRA", city: "Frankfurt", typicalPriceEur: 165, minObservedEur: 65 },
      { iata: "FCO", city: "Roma", typicalPriceEur: 155, minObservedEur: 58 },
    ],
    topLongHaulDestinations: [],
    description:
      "Bilbao es un hub regional del norte de España con red europea limitada pero útil para residentes en País Vasco, Cantabria y Navarra. Ryanair y Vueling cubren los destinos turísticos principales; long-haul requiere conexión casi siempre. Para Asia/América desde el norte, MAD vía AVE (4h40m) sigue siendo la mejor opción.",
    tips: [
      "Aeropuerto pequeño, conexiones rápidas, single terminal",
      "Para vuelos transatlánticos, comparar combo BIO-MAD + MAD-X vs MAD directo",
      "El Bizkaibus A3247 es 24h en horario reducido",
      "Considerar Pamplona PNA o San Sebastián EAS como alternativas regionales",
    ],
  },
  {
    code: "PMI",
    name: "Palma de Mallorca",
    city: "Palma",
    region: "Islas Baleares",
    distanceKm: 8,
    cityAccess: "Bus EMT 1 (15min, 5€) hasta Plaça d'Espanya",
    primaryAirlines: ["FR", "VY", "U2", "TUI", "LH"],
    category: "hub-secundario",
    topEuropeDestinations: [
      { iata: "LGW", city: "Londres", typicalPriceEur: 88, minObservedEur: 22 },
      { iata: "MAN", city: "Manchester", typicalPriceEur: 95, minObservedEur: 28 },
      { iata: "FRA", city: "Frankfurt", typicalPriceEur: 145, minObservedEur: 48 },
      { iata: "AMS", city: "Ámsterdam", typicalPriceEur: 155, minObservedEur: 55 },
      { iata: "DUB", city: "Dublín", typicalPriceEur: 110, minObservedEur: 32 },
    ],
    topLongHaulDestinations: [],
    description:
      "Palma de Mallorca es un hub estacional masivo (Mayo-Octubre) con red europea muy densa hacia UK, Alemania, Escandinavia y Países Bajos. En verano, decenas de cargas chárter diarias. Fuera de temporada, la oferta se reduce drásticamente y muchas rutas desaparecen. Para residentes en Baleares, PMI es el único aeropuerto con tráfico internacional relevante.",
    tips: [
      "Pico tráfico Junio-Septiembre: llegar 2.5h antes vuelo internacional",
      "Aeropuerto enorme, terminals A/B/C/D — verificar terminal antes de llegar",
      "Bus EMT 1 funciona 24h cada 15-30min",
      "Fuera temporada, considerar combo PMI-BCN + BCN-X para mejor red",
      "Vuelos chárter mayoritariamente en T2 (low-cost europeas)",
    ],
  },
  // ── SSS55 (May 2026): +3 hubs nuevos (10 total) — Costa Blanca + Canarias ──
  {
    code: "ALC",
    name: "Alicante-Elche",
    city: "Alicante",
    region: "Comunidad Valenciana",
    distanceKm: 10,
    cityAccess: "Bus C-6 ALSA al centro (25min, 4€) o taxi (15min, 25€)",
    primaryAirlines: ["FR", "U2", "VY", "W6", "DY"],
    category: "hub-secundario",
    topEuropeDestinations: [
      { iata: "LGW", city: "Londres Gatwick", typicalPriceEur: 78, minObservedEur: 14 },
      { iata: "STN", city: "Londres Stansted", typicalPriceEur: 72, minObservedEur: 12 },
      { iata: "MAN", city: "Manchester", typicalPriceEur: 85, minObservedEur: 19 },
      { iata: "DUS", city: "Düsseldorf", typicalPriceEur: 95, minObservedEur: 28 },
      { iata: "AMS", city: "Ámsterdam", typicalPriceEur: 105, minObservedEur: 32 },
      { iata: "DUB", city: "Dublín", typicalPriceEur: 88, minObservedEur: 24 },
      { iata: "OSL", city: "Oslo", typicalPriceEur: 115, minObservedEur: 38 },
    ],
    topLongHaulDestinations: [],
    description:
      "Alicante-Elche es el aeropuerto que mejor refleja el turismo británico de Costa Blanca: 60% del tráfico anual viene de UK e Irlanda. Ryanair y easyJet operan 80+ rutas semanales en pico. Para residentes/expatriados británicos en Alicante o vacacionistas hacia Benidorm, Torrevieja, Calpe, Jávea, ALC es la opción default. La conexión con Madrid es escasa (2-3 vuelos/día) ya que el AVE Madrid-Alicante (2h 25min) compite directamente. Para vuelos largo radio: cero — toda larga distancia requiere conexión MAD/BCN.",
    tips: [
      "Llegar 2h antes en verano (Jun-Sep) por colas de seguridad masivas",
      "Pista única — retrasos en cadena si hay viento o lluvia, dejar margen para conexiones",
      "Tren AVE Alicante-Madrid puede ser MEJOR opción que volar (2h 25min, €40-90 anticipado)",
      "Lounge único Sala VIP Levante — 30€ acceso 3h, mediocre pero sirve",
      "Parking long-stay € 14-18/día, hay deals semana ≈ €60-80",
    ],
  },
  {
    code: "TFS",
    name: "Tenerife Sur Reina Sofía",
    city: "Tenerife (sur)",
    region: "Canarias",
    distanceKm: 60,
    cityAccess: "Bus TITSA 111 a Santa Cruz (75min, 9.40€) o coche alquiler (1h)",
    primaryAirlines: ["FR", "VY", "U2", "BA", "DY", "BT"],
    category: "hub-secundario",
    topEuropeDestinations: [
      { iata: "MAD", city: "Madrid", typicalPriceEur: 95, minObservedEur: 32 },
      { iata: "BCN", city: "Barcelona", typicalPriceEur: 105, minObservedEur: 28 },
      { iata: "STN", city: "Londres Stansted", typicalPriceEur: 110, minObservedEur: 34 },
      { iata: "AMS", city: "Ámsterdam", typicalPriceEur: 165, minObservedEur: 58 },
      { iata: "OSL", city: "Oslo", typicalPriceEur: 195, minObservedEur: 78 },
      { iata: "DUB", city: "Dublín", typicalPriceEur: 145, minObservedEur: 49 },
      { iata: "ARN", city: "Estocolmo", typicalPriceEur: 220, minObservedEur: 95 },
    ],
    topLongHaulDestinations: [],
    description:
      "Tenerife Sur (TFS) es el motor turístico de la isla — 90% del tráfico hacia/desde norte de Europa. Costa Adeje, Los Cristianos, Las Américas concentran el público británico, alemán, escandinavo. Es el hub canario con MEJOR conectividad invernal (oct-mar) cuando el resto de Europa busca calor. La diferencia clave vs Tenerife Norte (TFN): TFS opera vuelos internacionales chárter masivos; TFN es para inter-islas y vuelos a península (Madrid, Barcelona). Para vuelos largo radio: solo desde Madrid o Barcelona conexión, no hay direct intercontinental.",
    tips: [
      "TFS muy saturado en pico Diciembre-Marzo y Julio-Agosto — llegar 2.5h antes",
      "Coche alquiler imprescindible si vas a explorar isla (público insuficiente)",
      "TFS y TFN están a 80km — verifica MUY bien tu billete antes (error común)",
      "Mejor combo: vuelo TFS para llegar + alquiler en aeropuerto recogida directa",
      "Salir TFS hacia España península €30-90 según mes (más barato Mar/Oct)",
    ],
  },
  {
    code: "LPA",
    name: "Gran Canaria",
    city: "Las Palmas de Gran Canaria",
    region: "Canarias",
    distanceKm: 18,
    cityAccess: "Bus Global 60 a Las Palmas centro (35min, 2.95€)",
    primaryAirlines: ["FR", "VY", "U2", "IB", "BT", "DY"],
    category: "hub-secundario",
    topEuropeDestinations: [
      { iata: "MAD", city: "Madrid", typicalPriceEur: 92, minObservedEur: 29 },
      { iata: "BCN", city: "Barcelona", typicalPriceEur: 100, minObservedEur: 32 },
      { iata: "STN", city: "Londres Stansted", typicalPriceEur: 108, minObservedEur: 34 },
      { iata: "AMS", city: "Ámsterdam", typicalPriceEur: 158, minObservedEur: 55 },
      { iata: "DUS", city: "Düsseldorf", typicalPriceEur: 175, minObservedEur: 65 },
      { iata: "ARN", city: "Estocolmo", typicalPriceEur: 215, minObservedEur: 92 },
      { iata: "WAW", city: "Varsovia", typicalPriceEur: 178, minObservedEur: 68 },
    ],
    topLongHaulDestinations: [],
    description:
      "Gran Canaria (LPA) compite directamente con TFS por el turista norte-europeo, pero tiene perfil ligeramente distinto: más tráfico desde Polonia y Europa del Este vía Wizz Air, mejor conectividad con Madrid (más vuelos día), y un público local canario (Las Palmas es la capital de provincia más poblada del archipiélago). Maspalomas, Playa del Inglés y Puerto Rico concentran turismo familiar y senior. El aeropuerto está modernizado tras renovación 2022 — funcional, sin grandes colapsos en pico vs TFS. Para vuelos largo radio: conexión vía Madrid o Barcelona obligatoria.",
    tips: [
      "Aeropuerto LPA mejor distribuido que TFS — colas más manejables incluso en pico",
      "Para Maspalomas/Playa del Inglés mejor coche alquiler que bus",
      "LPA tiene base Wizz Air → ofertas frecuentes hacia Polonia/Hungría/Rumanía",
      "Lounge VIP Sala Coral — €30, decente para conexiones 2h+",
      "Inter-islas LPA-TFN frecuente y barato (€20-40), útil si quieres ambas islas",
    ],
  },
];

export function getHubByCode(code: string): HubAirport | null {
  const u = code.toUpperCase();
  return HUBS.find((h) => h.code === u) || null;
}
