/**
 * airports_world_catalog.ts — SSS445 (23 may 2026)
 *
 * Lookup compacto de top 20 aeropuertos internacionales. Complementa
 * /aeropuertos (15 hubs ES) con datos para destinos populares.
 *
 * Cada entry es más ligero que airports_es_catalog (no transporte
 * detallado por bus/metro — solo IATA, ciudad, país, terminales,
 * paxMillions, tip de tránsito).
 *
 * SEO: "aeropuerto charles de gaulle paris", "JFK terminales",
 * "tokyo narita vs haneda", "frankfurt aeropuerto IATA".
 */

export interface AirportWorldEntry {
  iata: string;
  city: string;
  country: string;
  countryIso: string;
  emoji: string;
  formalName: string;
  paxMillions: number;
  terminals: number;
  /** Tip de tránsito (1-2 frases). */
  transitTip: string;
  /** Aerolínea hub principal. */
  hubAirline?: string;
  /** Conexión recomendada España. */
  spanishConnection: string;
}

export const AIRPORTS_WORLD: AirportWorldEntry[] = [
  // Europa
  {
    iata: "CDG",
    city: "París",
    country: "Francia",
    countryIso: "fr",
    emoji: "🇫🇷",
    formalName: "Paris Charles de Gaulle",
    paxMillions: 67.4,
    terminals: 3,
    transitTip:
      "T1 anticuado, T2 moderno (mayoría vuelos), T3 low-cost. Cambios de terminal lentos (15-30 min). Calcula 1h+ entre vuelos.",
    hubAirline: "Air France",
    spanishConnection: "Air France MAD-CDG / BCN-CDG cada hora; Iberia codeshare",
  },
  {
    iata: "LHR",
    city: "Londres",
    country: "Reino Unido",
    countryIso: "gb",
    emoji: "🇬🇧",
    formalName: "Heathrow",
    paxMillions: 79.2,
    terminals: 4,
    transitTip:
      "T2/T3/T4/T5 (T1 cerrada). T5 = British Airways. Heathrow Express conecta T5 ↔ T2/T3 en 5 min. T4 está lejos — alóca 30 min mínimo.",
    hubAirline: "British Airways",
    spanishConnection: "BA / Iberia MAD-LHR + BCN-LHR varias frecuencias diarias",
  },
  {
    iata: "FRA",
    city: "Fráncfort",
    country: "Alemania",
    countryIso: "de",
    emoji: "🇩🇪",
    formalName: "Frankfurt Main",
    paxMillions: 59.4,
    terminals: 2,
    transitTip:
      "T1 (Lufthansa + Star Alliance) y T2 (otras). SkyLine train conecta los dos en 4 min. Hub más grande de Lufthansa.",
    hubAirline: "Lufthansa",
    spanishConnection: "Lufthansa MAD-FRA + BCN-FRA con conexiones a Asia/USA",
  },
  {
    iata: "AMS",
    city: "Ámsterdam",
    country: "Países Bajos",
    countryIso: "nl",
    emoji: "🇳🇱",
    formalName: "Schiphol",
    paxMillions: 67.0,
    terminals: 1,
    transitTip:
      "Terminal único — el más eficiente Europa para tránsito. Caminata máxima 15 min entre puertas. Schengen y no-Schengen bien separados.",
    hubAirline: "KLM",
    spanishConnection: "KLM MAD-AMS + BCN-AMS, mejor opción tránsito vuelos Asia",
  },
  {
    iata: "FCO",
    city: "Roma",
    country: "Italia",
    countryIso: "it",
    emoji: "🇮🇹",
    formalName: "Roma Fiumicino",
    paxMillions: 49.2,
    terminals: 3,
    transitTip:
      "T1 (low-cost), T3 (legacy + intercontinental). T2 cerrada actualmente. Leonardo Express al centro Roma en 32 min.",
    hubAirline: "ITA Airways",
    spanishConnection: "Iberia / Vueling / Ryanair MAD-FCO frecuente",
  },
  {
    iata: "MUC",
    city: "Múnich",
    country: "Alemania",
    countryIso: "de",
    emoji: "🇩🇪",
    formalName: "Múnich Franz Josef Strauss",
    paxMillions: 41.7,
    terminals: 2,
    transitTip:
      "T2 (Lufthansa + Star Alliance) es premiada como uno de los mejores de Europa. T1 para otras aerolíneas.",
    hubAirline: "Lufthansa",
    spanishConnection: "Lufthansa MAD-MUC + BCN-MUC",
  },
  {
    iata: "ZRH",
    city: "Zúrich",
    country: "Suiza",
    countryIso: "ch",
    emoji: "🇨🇭",
    formalName: "Zúrich",
    paxMillions: 30.0,
    terminals: 1,
    transitTip:
      "Terminal único compacto. Sky Metro conecta gates A/E con dock B. Schengen y no-Schengen en niveles distintos.",
    hubAirline: "Swiss",
    spanishConnection: "Swiss MAD-ZRH + BCN-ZRH",
  },
  // Asia
  {
    iata: "NRT",
    city: "Tokio Narita",
    country: "Japón",
    countryIso: "jp",
    emoji: "🇯🇵",
    formalName: "Narita International",
    paxMillions: 32.4,
    terminals: 3,
    transitTip:
      "T1 (Star Alliance), T2 (oneworld), T3 (low-cost). 60-90 km del centro Tokio (1h+ tren Narita Express, 3000¥).",
    hubAirline: "JAL / ANA",
    spanishConnection: "Iberia MAD-NRT directo + KLM/Air France via AMS/CDG",
  },
  {
    iata: "HND",
    city: "Tokio Haneda",
    country: "Japón",
    countryIso: "jp",
    emoji: "🇯🇵",
    formalName: "Tokio Haneda",
    paxMillions: 87.0,
    terminals: 3,
    transitTip:
      "Más cerca de Tokio (20 min monorraíl). Si destino final Tokio, prefiere HND a NRT. Vuelos internacionales en T3.",
    hubAirline: "JAL / ANA",
    spanishConnection: "ANA / JAL MAD-HND con conexión LHR o vía CDG/FRA",
  },
  {
    iata: "ICN",
    city: "Seúl",
    country: "Corea del Sur",
    countryIso: "kr",
    emoji: "🇰🇷",
    formalName: "Incheon International",
    paxMillions: 70.0,
    terminals: 2,
    transitTip:
      "Premiada como mejor aeropuerto mundo varias veces. Spa + cultural exhibitions + saunas. T2 abrió 2018 para vuelos KE/Skyteam.",
    hubAirline: "Korean Air / Asiana",
    spanishConnection: "Korean Air MAD-ICN directo (4x/semana)",
  },
  {
    iata: "SIN",
    city: "Singapur",
    country: "Singapur",
    countryIso: "sg",
    emoji: "🇸🇬",
    formalName: "Changi",
    paxMillions: 65.6,
    terminals: 4,
    transitTip:
      "El mejor aeropuerto del mundo según Skytrax. T1-T4 con Jewel (mariposario + cascada interior). Conexiones <60min sin problema.",
    hubAirline: "Singapore Airlines",
    spanishConnection: "Singapore MAD-SIN directo (5x/semana)",
  },
  {
    iata: "HKG",
    city: "Hong Kong",
    country: "Hong Kong",
    countryIso: "hk",
    emoji: "🇭🇰",
    formalName: "Hong Kong International",
    paxMillions: 28.0,
    terminals: 1,
    transitTip:
      "Terminal único con Airport Express al centro en 24 min (105 HK$). T1 Concourse Norte + Sur conectados por tren automatizado.",
    hubAirline: "Cathay Pacific",
    spanishConnection: "Cathay Pacific MAD-HKG / BCN-HKG via Hong Kong",
  },
  {
    iata: "DXB",
    city: "Dubái",
    country: "EAU",
    countryIso: "ae",
    emoji: "🇦🇪",
    formalName: "Dubai International",
    paxMillions: 86.9,
    terminals: 3,
    transitTip:
      "T3 exclusivo Emirates (mayor terminal del mundo). T2 low-cost (FlyDubai). Hub principal A380. Tránsito <2h muy difícil entre terminales.",
    hubAirline: "Emirates",
    spanishConnection: "Emirates MAD-DXB + BCN-DXB diario A380",
  },
  {
    iata: "DOH",
    city: "Doha",
    country: "Qatar",
    countryIso: "qa",
    emoji: "🇶🇦",
    formalName: "Hamad International",
    paxMillions: 45.9,
    terminals: 1,
    transitTip:
      "Terminal único moderno. Lounge Privilege Qatar es de los mejores del mundo. Programa stopover gratis Doha si layover >5h.",
    hubAirline: "Qatar Airways",
    spanishConnection: "Qatar MAD-DOH + BCN-DOH diario",
  },
  // Norteamérica
  {
    iata: "JFK",
    city: "Nueva York",
    country: "EE.UU.",
    countryIso: "us",
    emoji: "🇺🇸",
    formalName: "John F. Kennedy",
    paxMillions: 62.5,
    terminals: 6,
    transitTip:
      "T1, T2, T4, T5, T7, T8 (T3/T6 demolidos). AirTrain JFK conecta todos los terminales. T4 es Delta + SkyTeam. T8 es AA/oneworld.",
    hubAirline: "JetBlue / American",
    spanishConnection: "Iberia MAD-JFK directo diario + Delta",
  },
  {
    iata: "LAX",
    city: "Los Ángeles",
    country: "EE.UU.",
    countryIso: "us",
    emoji: "🇺🇸",
    formalName: "Los Angeles International",
    paxMillions: 87.5,
    terminals: 9,
    transitTip:
      "9 terminales en estrella (T1-T8 + TBIT). LAX People Mover (tren) en construcción 2026. Cambios entre T pueden requerir bus aeropuerto.",
    hubAirline: "American / Delta / United / Alaska",
    spanishConnection: "Iberia MAD-LAX directo + Iberia/Delta via JFK",
  },
  {
    iata: "ORD",
    city: "Chicago",
    country: "EE.UU.",
    countryIso: "us",
    emoji: "🇺🇸",
    formalName: "O'Hare International",
    paxMillions: 73.9,
    terminals: 4,
    transitTip:
      "T1/T2/T3 (domesticos) + T5 (internacional). United (T1) + American (T3) dominan. Lluvia/nieve = retrasos habituales invierno.",
    hubAirline: "United / American",
    spanishConnection: "Iberia MAD-ORD via OneWorld + United via FRA",
  },
  {
    iata: "MIA",
    city: "Miami",
    country: "EE.UU.",
    countryIso: "us",
    emoji: "🇺🇸",
    formalName: "Miami International",
    paxMillions: 50.7,
    terminals: 3,
    transitTip:
      "Norte (D - American), Centro (E - American/internacional), Sur (J/H - Avianca, Iberia, etc.). Hub principal LATAM-USA.",
    hubAirline: "American Airlines",
    spanishConnection: "Iberia / Air Europa MAD-MIA + BCN-MIA diario",
  },
  // Sudamérica
  {
    iata: "GRU",
    city: "São Paulo",
    country: "Brasil",
    countryIso: "br",
    emoji: "🇧🇷",
    formalName: "Guarulhos International",
    paxMillions: 43.0,
    terminals: 3,
    transitTip:
      "T2 (LATAM + Star Alliance), T3 (oneworld + internacional largo). Hub principal Brasil. 30km del centro SP (45 min taxi).",
    hubAirline: "LATAM",
    spanishConnection: "Iberia / Air Europa MAD-GRU diario directo",
  },
  {
    iata: "EZE",
    city: "Buenos Aires",
    country: "Argentina",
    countryIso: "ar",
    emoji: "🇦🇷",
    formalName: "Ministro Pistarini (Ezeiza)",
    paxMillions: 11.8,
    terminals: 1,
    transitTip:
      "Terminal único A. 35km del centro Buenos Aires (45-60 min bus Tienda León 2000 ARS).",
    hubAirline: "Aerolíneas Argentinas",
    spanishConnection: "Iberia / Air Europa MAD-EZE diario directo",
  },
  // SSS445-EXT: añadidos para cubrir IATAs referenciadas por conferencias_catalog
  {
    iata: "LIS",
    city: "Lisboa",
    country: "Portugal",
    countryIso: "pt",
    emoji: "🇵🇹",
    formalName: "Humberto Delgado",
    paxMillions: 33.6,
    terminals: 2,
    transitTip:
      "T1 (vuelos no-Schengen + intercontinentales), T2 (low-cost). Aerobús €4 al centro 25 min, Metro Vermelha hasta São Sebastião 25 min.",
    hubAirline: "TAP Air Portugal",
    spanishConnection: "TAP MAD-LIS / BCN-LIS varias frecuencias diarias",
  },
  {
    iata: "LAS",
    city: "Las Vegas",
    country: "EE.UU.",
    countryIso: "us",
    emoji: "🇺🇸",
    formalName: "Harry Reid International",
    paxMillions: 57.6,
    terminals: 2,
    transitTip:
      "T1 (D/E gates — domésticos) y T3 (internacional + algunas domésticas). Conectados por shuttle gratuito. Centrico al Strip — 5 min taxi.",
    hubAirline: "Southwest",
    spanishConnection: "Conexión vía MIA, JFK (Iberia/AA) o LHR (BA)",
  },
  {
    iata: "HEL",
    city: "Helsinki",
    country: "Finlandia",
    countryIso: "fi",
    emoji: "🇫🇮",
    formalName: "Helsinki-Vantaa",
    paxMillions: 19.5,
    terminals: 1,
    transitTip:
      "Terminal único moderno con sauna gratis. Tren Ringrata €4,40 al centro en 30 min, cada 10 min.",
    hubAirline: "Finnair",
    spanishConnection: "Finnair MAD-HEL + BCN-HEL directo todo el año",
  },
  {
    iata: "SFO",
    city: "San Francisco",
    country: "EE.UU.",
    countryIso: "us",
    emoji: "🇺🇸",
    formalName: "San Francisco International",
    paxMillions: 50.4,
    terminals: 4,
    transitTip:
      "T1 (Southwest/Alaska), T2 (American/Delta), T3 (United), International Terminal. AirTrain conecta todos. BART al centro 30 min $10.",
    hubAirline: "United / Alaska",
    spanishConnection: "Iberia MAD-SFO directo (5x/semana) + Air Europa MAD-SFO temporada",
  },
  {
    iata: "SJC",
    city: "San José (Silicon Valley)",
    country: "EE.UU.",
    countryIso: "us",
    emoji: "🇺🇸",
    formalName: "Norman Y. Mineta San José International",
    paxMillions: 12.9,
    terminals: 2,
    transitTip:
      "Más cerca Mountain View / Palo Alto que SFO (15-30 min vs 1h). Útil para Google I/O y eventos Silicon Valley. VTA bus al centro.",
    hubAirline: "Alaska / Southwest",
    spanishConnection: "Conexión vía LAX (Iberia) o SFO + transfer corto",
  },
];

export const AIRPORTS_WORLD_BY_IATA: Record<string, AirportWorldEntry> = Object.fromEntries(
  AIRPORTS_WORLD.map((a) => [a.iata, a]),
);

export const AIRPORTS_WORLD_IATAS = AIRPORTS_WORLD.map((a) => a.iata);

export function getAirportWorld(iata: string): AirportWorldEntry | null {
  return AIRPORTS_WORLD_BY_IATA[iata.toUpperCase()] ?? null;
}
