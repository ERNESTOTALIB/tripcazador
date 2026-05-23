/**
 * conferencias_catalog.ts — SSS440 (23 may 2026)
 *
 * 8 conferencias tech/business top a las que viajeros profesionales
 * españoles asisten. Datos prácticos para vuelo + hotel + agenda.
 *
 * High-intent queries: "MWC Barcelona 2026 fechas hotel", "Web Summit
 * Lisboa vuelos", "AWS reInvent las vegas alojamiento".
 */

export interface ConferenciaEntry {
  slug: string;
  name: string;
  city: string;
  iata: string;
  emoji: string;
  /** Fecha típica (puede variar). */
  dates: string;
  /** Sector (tech / business / startup / cloud). */
  sector: "tech" | "startup" | "cloud" | "business" | "developer";
  /** Resumen. */
  summary: string;
  /** Asistentes aprox. */
  attendees: number;
  /** Precio entrada estándar (€). */
  ticketPriceEur: number;
  /** Tips prácticos. */
  tips: string[];
  /** Zona donde alojarse. */
  bestArea: string;
  /** Aerolíneas con conexiones útiles desde MAD/BCN. */
  airlinesFromSpain: string[];
  /** Web oficial (sin afiliación, info-only). */
  officialUrl: string;
}

export const CONFERENCIAS_CATALOG: ConferenciaEntry[] = [
  {
    slug: "mwc-barcelona",
    name: "Mobile World Congress (MWC)",
    city: "Barcelona",
    iata: "BCN",
    emoji: "📱",
    dates: "Última semana febrero o primera marzo (4 días)",
    sector: "tech",
    summary:
      "La conferencia móvil más grande del mundo en Fira Gran Via. 100k+ asistentes, 2400+ expositores, anuncios de los mayores OEMs (Samsung, Xiaomi, Huawei, etc.).",
    attendees: 100000,
    ticketPriceEur: 950,
    tips: [
      "Reserva hotel 6+ meses antes — precios x3-4 esa semana",
      "Acreditación estándar €950, gratis para developers con app aprobada",
      "Línea L9 Sud directa Aeropuerto T1/T2 → Europa-Fira (parada Fira) en 18 min",
      "Tarjeta T-MWC ilimitado transporte público durante feria, ~€50",
    ],
    bestArea:
      "Sants/Hospitalet (cerca Fira, menos turístico) o Plaça Espanya (céntrico + 1 parada metro a Fira)",
    airlinesFromSpain: ["Vueling MAD-BCN", "Iberia", "Ryanair"],
    officialUrl: "https://www.mwcbarcelona.com",
  },
  {
    slug: "web-summit-lisboa",
    name: "Web Summit",
    city: "Lisboa",
    iata: "LIS",
    emoji: "💻",
    dates: "Noviembre (3 días, lunes a jueves)",
    sector: "startup",
    summary:
      "Mayor conferencia tech de Europa: 70k asistentes, 2500 startups, 1000+ speakers. Networking entre VCs, founders y corporates.",
    attendees: 70000,
    ticketPriceEur: 1300,
    tips: [
      "Tickets early-bird 50% off si compras 4-6 meses antes",
      "Hotel en zona Marquês de Pombal o Saldanha (10 min metro a Altice Arena)",
      "Aerobús €4 LIS → centro, Metro Vermelha 25 min hasta Altice Arena",
      "Sessions de noche en bares: 'Night Summit' (incluido en ticket) en Bairro Alto",
    ],
    bestArea: "Marquês de Pombal (metro azul directo) o Parque das Nações (junto al recinto)",
    airlinesFromSpain: ["TAP MAD-LIS / BCN-LIS", "Vueling", "Ryanair", "Iberia"],
    officialUrl: "https://websummit.com",
  },
  {
    slug: "south-summit",
    name: "South Summit",
    city: "Madrid",
    iata: "MAD",
    emoji: "🇪🇸",
    dates: "Junio (3 días)",
    sector: "startup",
    summary:
      "Mayor conferencia startup en España. La Nave (Villaverde) reúne 15k asistentes, 600 startups, 600 inversores. Más enfocada al ecosistema iberoamericano.",
    attendees: 15000,
    ticketPriceEur: 500,
    tips: [
      "Asistentes españoles: descuentos comunidad + becas para founders",
      "Aeropuerto MAD → centro Metro L8 + L1 (45 min) o Cercanías (30 min) — La Nave aparte",
      "Lanzaderas gratis desde Atocha/Sol durante feria",
      "Networking principal: noches en Distrito C de Telefónica + Madrid Innovación",
    ],
    bestArea: "Atocha (cerca Cercanías + Renfe + lanzadera) o Sol (céntrico)",
    airlinesFromSpain: ["Iberia", "Vueling", "Ryanair (todas las rutas internas)"],
    officialUrl: "https://southsummit.io",
  },
  {
    slug: "aws-reinvent",
    name: "AWS re:Invent",
    city: "Las Vegas",
    iata: "LAS",
    emoji: "☁️",
    dates: "Primera semana diciembre (5 días)",
    sector: "cloud",
    summary:
      "Mayor conferencia cloud computing del mundo. 60k asistentes en hoteles Strip (Venetian, Wynn, Mandalay). Keynotes con anuncios AWS de impacto global.",
    attendees: 60000,
    ticketPriceEur: 1900,
    tips: [
      "Reservar hotel 8+ meses antes — Venetian + Wynn (recinto principal) se llenan",
      "Aeropuerto LAS → Strip en taxi €25-30, Uber €15-20, monorraíl €5",
      "Visa ESTA online USA obligatoria (€21, 72h antes mínimo)",
      "Sesiones técnicas (Builders, Chalk Talks) son gratis si tienes la pulsera, reserva 2 meses antes",
    ],
    bestArea: "The Venetian / Palazzo (recinto principal — más caro pero ahorra 30min/día andando)",
    airlinesFromSpain: [
      "Conexión vía LHR (BA), CDG (AF) o IAD (United)",
      "Iberia Madrid → Miami → Las Vegas con OneWorld",
    ],
    officialUrl: "https://reinvent.awsevents.com",
  },
  {
    slug: "slush",
    name: "Slush",
    city: "Helsinki",
    iata: "HEL",
    emoji: "❄️",
    dates: "Noviembre (2 días)",
    sector: "startup",
    summary:
      "Conferencia startup nórdica con curated audience. 13k asistentes, 4k startups, 2k inversores. Ambiente oscuro + neón + atmósfera 'movement'.",
    attendees: 13000,
    ticketPriceEur: 1500,
    tips: [
      "Comunidad española en Slush es pequeña pero alta calidad — networking premium",
      "Helsinki en noviembre: -5°C/+5°C — ropa de invierno completa",
      "Aeropuerto HEL → centro tren Ringrata €4 en 30 min, taxi €40",
      "Llegar día antes — eventos pre-Slush en bares centro",
    ],
    bestArea: "Punavuori / Kallio (vida nocturna) o centro (más caro, andable a recinto)",
    airlinesFromSpain: [
      "Finnair MAD-HEL / BCN-HEL directo",
      "Lufthansa o KLM con escala",
    ],
    officialUrl: "https://slush.org",
  },
  {
    slug: "wwdc-san-francisco",
    name: "Apple WWDC",
    city: "San Francisco / Cupertino",
    iata: "SFO",
    emoji: "🍎",
    dates: "Junio (1 semana)",
    sector: "developer",
    summary:
      "Apple Worldwide Developers Conference. 5k asistentes presenciales (lotería), keynotes online. Mayor evento iOS/macOS developers del año.",
    attendees: 5000,
    ticketPriceEur: 1500,
    tips: [
      "Asistencia presencial = lotería de tickets — la mayoría sigue keynotes streaming",
      "Si tienes ticket: Apple Park (Cupertino) requiere coche o lanzadera oficial — no hay transporte público directo",
      "Hotel en San Francisco (Mission, SoMa) + alquiler coche — Cupertino está a 1h",
      "Visa ESTA USA + reserva con 6 meses antes — caros incluso sin presencial",
    ],
    bestArea: "San Francisco SoMa / Mission (centro tech) o Sunnyvale (más cerca Cupertino)",
    airlinesFromSpain: [
      "Iberia MAD-SFO directo (5x semana)",
      "Air Europa MAD-SFO temporada alta",
    ],
    officialUrl: "https://developer.apple.com/wwdc",
  },
  {
    slug: "google-io",
    name: "Google I/O",
    city: "Mountain View",
    iata: "SJC",
    emoji: "🔵",
    dates: "Mayo (3 días)",
    sector: "developer",
    summary:
      "Conferencia Google para developers. Shoreline Amphitheatre (Mountain View). Anuncios Android, AI, Workspace. 7k asistentes presenciales más lotería.",
    attendees: 7000,
    ticketPriceEur: 1000,
    tips: [
      "Ticket lotería — solicitud abre marzo, sorteo abril",
      "SJC más cerca Mountain View que SFO — alternativa práctica",
      "Hotel en Mountain View o Palo Alto (caro) — alquiler coche obligatorio",
      "Eventos satélite tras keynote: meet-ups Googleplex con codelabs",
    ],
    bestArea: "Mountain View, Palo Alto o Sunnyvale (cercanos al amphitheatre)",
    airlinesFromSpain: [
      "Iberia MAD-SFO + 50min coche",
      "Vía LHR (BA) o AMS (KLM)",
    ],
    officialUrl: "https://io.google",
  },
  {
    slug: "dreamforce",
    name: "Dreamforce",
    city: "San Francisco",
    iata: "SFO",
    emoji: "💼",
    dates: "Septiembre (4 días)",
    sector: "business",
    summary:
      "Conferencia Salesforce — 170k asistentes (mayor conferencia tech en US por volumen). Moscone Center + hoteles convertidos en sub-recintos.",
    attendees: 170000,
    ticketPriceEur: 1700,
    tips: [
      "El mayor evento del calendario SF — hoteles se reservan 12 meses antes a precios x4",
      "Alternativa: Airbnb en Oakland (BART 20 min al Moscone)",
      "Aeropuerto SFO → centro BART €10 en 30 min (más práctico que taxi)",
      "Music After Hours: conciertos Pearl Jam / Lenny Kravitz incluidos en ticket",
    ],
    bestArea: "SoMa (next to Moscone) o Mission (BART 5 min)",
    airlinesFromSpain: [
      "Iberia MAD-SFO directo",
      "Air Europa MAD-SFO",
      "Vía LHR (BA, Iberia codeshare)",
    ],
    officialUrl: "https://www.salesforce.com/dreamforce",
  },
];

export const CONFERENCIAS_BY_SLUG: Record<string, ConferenciaEntry> = Object.fromEntries(
  CONFERENCIAS_CATALOG.map((c) => [c.slug, c]),
);

export const CONFERENCIAS_SLUGS = CONFERENCIAS_CATALOG.map((c) => c.slug);

export function getConferencia(slug: string): ConferenciaEntry | null {
  return CONFERENCIAS_BY_SLUG[slug] ?? null;
}
