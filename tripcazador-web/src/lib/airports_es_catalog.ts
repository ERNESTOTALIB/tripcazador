/**
 * airports_es_catalog.ts — SSS421 (23 may 2026)
 *
 * Catálogo curado de aeropuertos españoles top para vertical SEO
 * `/aeropuertos/[iata]`. Datos verificados may 2026, marcar lastVerified.
 *
 * High-intent queries: "salir desde madrid barajas", "parking ALC",
 * "que aerolineas vuelan desde valencia", "transporte aeropuerto BCN".
 *
 * Single source of truth para 15 hubs. Cada entry alimenta:
 *   - Hero (nombre, IATA, ciudad, código)
 *   - Transporte (metro/tren/bus/taxi) — info pública verificada
 *   - Aerolíneas presentes (cross-link a /aerolineas/[code])
 *   - Top destinos desde este origen
 *   - Parking Parclick afiliado
 *   - Cross-link equipaje + esim + seguro
 */

export interface AirportEsEntry {
  iata: string;
  city: string;
  /** Nombre formal aeropuerto (Madrid Barajas → "Adolfo Suárez Madrid-Barajas"). */
  formalName: string;
  /** Operador (AENA prácticamente todos en España). */
  operator: string;
  region: string;
  emoji: string;
  /** Pasajeros anuales aprox (M). 2024 data. */
  paxMillions: number;
  /** Terminales count. */
  terminals: number;
  /** Resumen 1-2 frases para hero + meta description. */
  summary: string;
  /** Transporte público al centro ciudad. */
  transport: Array<{
    mode: string; // "Metro", "Cercanías", "Bus EMT", "Taxi"
    detail: string; // "Línea 8 → Nuevos Ministerios, 30 min"
    priceEur: string; // "5€", "2-4€", "30-40€"
  }>;
  /** Aerolíneas con presencia significativa (IATA codes). */
  presentAirlines: string[];
  /** Top destinos desde este aeropuerto. */
  topDestinations: Array<{ slug: string; name: string }>;
  /** Slug a /precio-vuelo/madrid/[destino] cuando aplica. */
  precioVueloOrigin?: string; // "madrid" -> permite linkear /precio-vuelo/madrid/X
  /** Notas extra (T1/T2 diferenciación, low-cost terminal, etc.). */
  notes: string[];
  lastVerified: string; // "2026-05-23"
}

export const AIRPORTS_ES: AirportEsEntry[] = [
  {
    iata: "MAD",
    city: "Madrid",
    formalName: "Adolfo Suárez Madrid-Barajas",
    operator: "AENA",
    region: "Comunidad de Madrid",
    emoji: "🇪🇸",
    paxMillions: 60.2,
    terminals: 4,
    summary:
      "El hub principal de España y uno de los 10 mayores de Europa. T4 es el hub de Iberia y oneworld; T1/T2/T3 reciben aerolíneas low-cost y resto de alianzas.",
    transport: [
      { mode: "Metro", detail: "Línea 8 (rosa) → Nuevos Ministerios en 30 min", priceEur: "5€ (suplemento aeropuerto)" },
      { mode: "Cercanías C-1", detail: "T4 → Chamartín en 15 min, Atocha 25 min", priceEur: "2,60€" },
      { mode: "Bus Express (EMT 203)", detail: "24h, Atocha-Cibeles-O'Donnell", priceEur: "5€" },
      { mode: "Taxi", detail: "Tarifa fija 30€ dentro M-30, 35€ fuera", priceEur: "30-35€" },
    ],
    presentAirlines: ["IB", "FR", "VY", "U2", "AF", "KL", "LH", "TK", "BA", "QR", "EK", "TP", "AZ", "LX", "SK"],
    topDestinations: [
      { slug: "lisboa", name: "Lisboa" },
      { slug: "paris", name: "París" },
      { slug: "londres", name: "Londres" },
      { slug: "nueva-york", name: "Nueva York" },
      { slug: "tokio", name: "Tokio" },
      { slug: "buenos-aires", name: "Buenos Aires" },
    ],
    precioVueloOrigin: "madrid",
    notes: [
      "T4S satélite conectado por tren automático (gratis), 4 min trayecto.",
      "Ryanair, easyJet, Vueling y otras low-cost operan principalmente en T1.",
      "Lounges Iberia Velázquez+Dalí en T4 (los mejores de la red AENA).",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "BCN",
    city: "Barcelona",
    formalName: "Josep Tarradellas Barcelona-El Prat",
    operator: "AENA",
    region: "Cataluña",
    emoji: "🇪🇸",
    paxMillions: 55.0,
    terminals: 2,
    summary:
      "Segundo hub de España, principal puerta del Mediterráneo. T1 es la terminal moderna (todas las aerolíneas large), T2 absorbe Ryanair y otras low-cost.",
    transport: [
      { mode: "Metro L9 Sud", detail: "T1/T2 → Zona Universitària, 32 min", priceEur: "5,50€" },
      { mode: "Cercanías R2 Nord", detail: "Solo T2 → Sants en 17 min", priceEur: "2,40€" },
      { mode: "Aerobús A1/A2", detail: "T1/T2 → Plaça Catalunya en 35 min", priceEur: "7,25€" },
      { mode: "Taxi", detail: "Centro ~25-35€, suplementos posibles", priceEur: "25-35€" },
    ],
    presentAirlines: ["VY", "FR", "U2", "IB", "LH", "AF", "KL", "BA", "TK", "EK", "QR", "EY", "W6", "AZ"],
    topDestinations: [
      { slug: "roma", name: "Roma" },
      { slug: "amsterdam", name: "Ámsterdam" },
      { slug: "lisboa", name: "Lisboa" },
      { slug: "estambul", name: "Estambul" },
      { slug: "dubai", name: "Dubái" },
      { slug: "miami", name: "Miami" },
    ],
    precioVueloOrigin: "barcelona",
    notes: [
      "Tiempo a pie T1→T2 ~25 min — usa el bus shuttle gratuito (10 min).",
      "Hub principal de Vueling (concentra ~50% de su operación).",
      "L9 Sud no acepta tarjetas T-Casual estándar — paga con T-Aeroport (5,50€) o contactless.",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "AGP",
    city: "Málaga",
    formalName: "Málaga-Costa del Sol",
    operator: "AENA",
    region: "Andalucía",
    emoji: "🇪🇸",
    paxMillions: 24.3,
    terminals: 3,
    summary:
      "Aeropuerto turístico clave de la Costa del Sol. Pico fuerte verano (jul-ago). Tercer hub español por pasajeros internacionales.",
    transport: [
      { mode: "Cercanías C-1", detail: "Aeropuerto → María Zambrano en 12 min", priceEur: "1,80€" },
      { mode: "Bus EMT A", detail: "Aeropuerto → centro en 25 min", priceEur: "3€" },
      { mode: "Taxi", detail: "Centro Málaga 20-25€, Marbella 60-70€", priceEur: "20-70€" },
    ],
    presentAirlines: ["FR", "VY", "U2", "DY", "W6", "LH", "BA", "TK", "TP"],
    topDestinations: [
      { slug: "londres", name: "Londres" },
      { slug: "amsterdam", name: "Ámsterdam" },
      { slug: "berlin", name: "Berlín" },
      { slug: "dublin", name: "Dublín" },
      { slug: "paris", name: "París" },
    ],
    notes: [
      "T3 es la terminal grande moderna (95% del tráfico). T2 cerrada.",
      "Ryanair, easyJet y Norwegian son los principales operadores low-cost.",
      "Cercanías C-1 cada 20 min — la opción más barata y rápida al centro.",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "PMI",
    city: "Palma de Mallorca",
    formalName: "Palma de Mallorca",
    operator: "AENA",
    region: "Islas Baleares",
    emoji: "🇪🇸",
    paxMillions: 33.3,
    terminals: 1,
    summary:
      "Mayor hub balear. Tráfico extremadamente estacional — duplica volumen en verano. Hub principal de Air Europa y Ryanair en islas.",
    transport: [
      { mode: "Bus EMT A1", detail: "Aeropuerto → Plaça Espanya en 30 min", priceEur: "5€" },
      { mode: "Bus EMT A2", detail: "Aeropuerto → Playa de Palma / Arenal", priceEur: "5€" },
      { mode: "Taxi", detail: "Centro Palma ~25€, Magaluf ~35€, Cala Millor ~85€", priceEur: "25-85€" },
    ],
    presentAirlines: ["UX", "FR", "VY", "U2", "DY", "EW", "LH", "W6"],
    topDestinations: [
      { slug: "barcelona", name: "Barcelona" },
      { slug: "berlin", name: "Berlín" },
      { slug: "amsterdam", name: "Ámsterdam" },
      { slug: "londres", name: "Londres" },
    ],
    notes: [
      "Aeropuerto único módulo. Salidas/llegadas en mismo edificio.",
      "Pico verano: colas inmigración no-Schengen hasta 1h — llegar 3h antes vuelos UK.",
      "Sin tren — bus o taxi son únicas opciones al centro.",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "ALC",
    city: "Alicante-Elche",
    formalName: "Alicante-Elche Miguel Hernández",
    operator: "AENA",
    region: "Comunidad Valenciana",
    emoji: "🇪🇸",
    paxMillions: 18.4,
    terminals: 1,
    summary:
      "Hub Costa Blanca, fuerte tráfico UK y Norte de Europa. Estacionalidad alta. Quinto aeropuerto español por pasajeros.",
    transport: [
      { mode: "Bus C-6 (TAM)", detail: "Aeropuerto → Alicante centro en 25 min", priceEur: "3,85€" },
      { mode: "Bus a Benidorm", detail: "Aeropuerto → Benidorm directo", priceEur: "10€" },
      { mode: "Taxi", detail: "Centro Alicante ~25€, Benidorm ~65€", priceEur: "25-65€" },
    ],
    presentAirlines: ["FR", "VY", "U2", "DY", "TUI", "W6", "BA"],
    topDestinations: [
      { slug: "londres", name: "Londres" },
      { slug: "manchester", name: "Manchester" },
      { slug: "amsterdam", name: "Ámsterdam" },
      { slug: "dublin", name: "Dublín" },
    ],
    notes: [
      "Aeropuerto un único terminal compacto.",
      "Ryanair y Jet2 dominan rutas UK.",
      "Sin tren — todas las opciones son bus o taxi.",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "VLC",
    city: "Valencia",
    formalName: "Valencia-Manises",
    operator: "AENA",
    region: "Comunidad Valenciana",
    emoji: "🇪🇸",
    paxMillions: 11.6,
    terminals: 1,
    summary:
      "Hub regional Levante. Crecimiento sostenido 10% YoY post-pandemia. Bien conectado con metro al centro.",
    transport: [
      { mode: "Metro L3/L5", detail: "Aeropuerto → Xàtiva (Estación Norte) en 25 min", priceEur: "4,90€ (ZAB)" },
      { mode: "Bus EMT 150", detail: "Aeropuerto → Plaza Reina en 35 min", priceEur: "1,50€" },
      { mode: "Taxi", detail: "Centro Valencia ~20-25€", priceEur: "20-25€" },
    ],
    presentAirlines: ["FR", "VY", "U2", "IB", "AF", "KL", "LH", "BA"],
    topDestinations: [
      { slug: "paris", name: "París" },
      { slug: "amsterdam", name: "Ámsterdam" },
      { slug: "londres", name: "Londres" },
      { slug: "roma", name: "Roma" },
    ],
    precioVueloOrigin: "valencia",
    notes: [
      "Metro L3 o L5 al centro — más rápido y barato que bus o taxi.",
      "Ryanair es el principal operador (~30% de movimientos).",
      "Hub secundario de Air Nostrum (regional Iberia).",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "SVQ",
    city: "Sevilla",
    formalName: "Sevilla-San Pablo",
    operator: "AENA",
    region: "Andalucía",
    emoji: "🇪🇸",
    paxMillions: 8.0,
    terminals: 1,
    summary:
      "Hub principal Andalucía interior. Aeropuerto compacto, conexión bus al centro funcional pero sin metro.",
    transport: [
      { mode: "Bus EA (TUSSAM)", detail: "Aeropuerto → Plaza de Armas en 35 min", priceEur: "4€" },
      { mode: "Taxi", detail: "Centro Sevilla ~25€ día / ~28€ noche", priceEur: "25-28€" },
    ],
    presentAirlines: ["FR", "VY", "U2", "IB", "AF", "KL", "LH", "TP", "BA"],
    topDestinations: [
      { slug: "barcelona", name: "Barcelona" },
      { slug: "paris", name: "París" },
      { slug: "amsterdam", name: "Ámsterdam" },
      { slug: "londres", name: "Londres" },
    ],
    notes: [
      "Sin metro ni tren al aeropuerto — bus EA es la opción pública.",
      "Pico semana santa y feria abril — booking anticipado clave.",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "BIO",
    city: "Bilbao",
    formalName: "Bilbao",
    operator: "AENA",
    region: "País Vasco",
    emoji: "🇪🇸",
    paxMillions: 6.3,
    terminals: 1,
    summary:
      "Hub Norte España, terminal Calatrava icónica. Conexión bus directa Bilbao centro y San Sebastián.",
    transport: [
      { mode: "Bizkaibus A3247", detail: "Aeropuerto → Termibús (Bilbao) en 25 min", priceEur: "3€" },
      { mode: "Bizkaibus A3247 (continuación)", detail: "A San Sebastián en 1h 15min", priceEur: "17€" },
      { mode: "Taxi", detail: "Centro Bilbao ~25€", priceEur: "25€" },
    ],
    presentAirlines: ["FR", "VY", "U2", "IB", "AF", "KL", "LH"],
    topDestinations: [
      { slug: "barcelona", name: "Barcelona" },
      { slug: "paris", name: "París" },
      { slug: "amsterdam", name: "Ámsterdam" },
      { slug: "londres", name: "Londres" },
    ],
    notes: [
      "Terminal diseñada por Santiago Calatrava (\"La Paloma\").",
      "Hub regional Iberia / Air Nostrum + Vueling.",
      "Sin tren al aeropuerto — bus A3247 cada 20 min.",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "LPA",
    city: "Las Palmas de Gran Canaria",
    formalName: "Gran Canaria",
    operator: "AENA",
    region: "Canarias",
    emoji: "🇪🇸",
    paxMillions: 14.3,
    terminals: 1,
    summary:
      "Hub principal de Canarias y puerta de entrada a Gran Canaria. Tráfico fuerte todo el año, picos invierno (turismo Norte EU).",
    transport: [
      { mode: "Bus Global 60", detail: "Aeropuerto → Las Palmas en 30 min", priceEur: "2,95€" },
      { mode: "Bus Global 66", detail: "Aeropuerto → Maspalomas en 40 min", priceEur: "5,15€" },
      { mode: "Taxi", detail: "Las Palmas ~30€, Maspalomas ~45€", priceEur: "30-45€" },
    ],
    presentAirlines: ["UX", "FR", "VY", "IB", "DY", "BA", "LH", "TP"],
    topDestinations: [
      { slug: "madrid", name: "Madrid" },
      { slug: "barcelona", name: "Barcelona" },
      { slug: "londres", name: "Londres" },
      { slug: "amsterdam", name: "Ámsterdam" },
    ],
    notes: [
      "Hub principal de Binter Canarias (vuelos interislas).",
      "Sin metro ni tren — todas las opciones son bus o taxi.",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "TFS",
    city: "Tenerife Sur",
    formalName: "Tenerife Sur Reina Sofía",
    operator: "AENA",
    region: "Canarias",
    emoji: "🇪🇸",
    paxMillions: 12.7,
    terminals: 1,
    summary:
      "Aeropuerto turístico Tenerife (zona sur, playas). 95% vuelos internacionales. Pico invierno (turismo UK/DE).",
    transport: [
      { mode: "Bus TITSA 343", detail: "TFS → Costa Adeje en 30 min", priceEur: "3,75€" },
      { mode: "Bus TITSA 111", detail: "TFS → Santa Cruz en 50 min", priceEur: "9,80€" },
      { mode: "Taxi", detail: "Costa Adeje ~30€, Santa Cruz ~70€", priceEur: "30-70€" },
    ],
    presentAirlines: ["FR", "VY", "DY", "LH", "BA", "EW", "UX"],
    topDestinations: [
      { slug: "madrid", name: "Madrid" },
      { slug: "barcelona", name: "Barcelona" },
      { slug: "londres", name: "Londres" },
      { slug: "berlin", name: "Berlín" },
    ],
    notes: [
      "Vuelo a Tenerife Norte (TFN) recomendado solo si destino es zona norte de la isla.",
      "Pico noviembre-abril — turistas Norte EU buscando sol.",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "IBZ",
    city: "Ibiza",
    formalName: "Ibiza",
    operator: "AENA",
    region: "Islas Baleares",
    emoji: "🇪🇸",
    paxMillions: 8.7,
    terminals: 1,
    summary:
      "Aeropuerto extremadamente estacional: pico mayo-octubre, casi cerrado invierno. Tráfico VIP elevado en verano (jets privados).",
    transport: [
      { mode: "Bus 10", detail: "Aeropuerto → Ibiza ciudad en 20 min", priceEur: "3,50€" },
      { mode: "Bus 9", detail: "Aeropuerto → Sant Antoni en 30 min", priceEur: "4€" },
      { mode: "Taxi", detail: "Ibiza ~20€, Sant Antoni ~35€", priceEur: "20-35€" },
    ],
    presentAirlines: ["UX", "FR", "VY", "U2", "DY", "EW", "LH"],
    topDestinations: [
      { slug: "barcelona", name: "Barcelona" },
      { slug: "madrid", name: "Madrid" },
      { slug: "amsterdam", name: "Ámsterdam" },
      { slug: "londres", name: "Londres" },
    ],
    notes: [
      "Pico mayo-octubre extremo. Reservar 3+ meses para fines de semana julio/agosto.",
      "Invierno: ruta única operada (Madrid+Barcelona).",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "GRO",
    city: "Gerona-Costa Brava",
    formalName: "Girona-Costa Brava",
    operator: "AENA",
    region: "Cataluña",
    emoji: "🇪🇸",
    paxMillions: 2.0,
    terminals: 1,
    summary:
      "Aeropuerto Ryanair-céntrico (80%+ de movimientos). Servicio bus directo a Barcelona, alternativa low-cost a BCN.",
    transport: [
      { mode: "Bus Sagalés", detail: "GRO → Estació del Nord (Barcelona) en 1h 10min", priceEur: "16€" },
      { mode: "Bus Sagalés", detail: "GRO → Girona centro en 30 min", priceEur: "3€" },
      { mode: "Taxi", detail: "Centro Girona ~25€, Barcelona ~150€", priceEur: "25-150€" },
    ],
    presentAirlines: ["FR", "VY", "U2"],
    topDestinations: [
      { slug: "londres", name: "Londres" },
      { slug: "dublin", name: "Dublín" },
      { slug: "manchester", name: "Manchester" },
      { slug: "milan", name: "Milán" },
    ],
    notes: [
      "Aeropuerto secundario Ryanair — base operativa.",
      "Bus a Barcelona coordinado con horarios Ryanair (no perderás conexión).",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "REU",
    city: "Reus-Tarragona",
    formalName: "Reus",
    operator: "AENA",
    region: "Cataluña",
    emoji: "🇪🇸",
    paxMillions: 1.0,
    terminals: 1,
    summary:
      "Aeropuerto Costa Daurada / Salou. Estacional (verano). Alternativa low-cost a BCN para destino sur de Cataluña.",
    transport: [
      { mode: "Bus Plana", detail: "REU → Salou/Vila-seca en 15 min, Reus 10 min", priceEur: "2,90€" },
      { mode: "Bus Plana directo", detail: "REU → Barcelona Sants en 1h 30min", priceEur: "18,50€" },
      { mode: "Taxi", detail: "Salou ~25€, Reus ~15€, PortAventura ~25€", priceEur: "15-25€" },
    ],
    presentAirlines: ["FR", "TUI"],
    topDestinations: [
      { slug: "londres", name: "Londres" },
      { slug: "dublin", name: "Dublín" },
    ],
    notes: [
      "Casi cerrado en invierno (octubre-abril).",
      "Principal mercado: Reino Unido + Irlanda hacia PortAventura/Salou.",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "SCQ",
    city: "Santiago de Compostela",
    formalName: "Santiago-Rosalía de Castro",
    operator: "AENA",
    region: "Galicia",
    emoji: "🇪🇸",
    paxMillions: 3.1,
    terminals: 1,
    summary:
      "Hub Galicia y aeropuerto natural para Camino de Santiago. Crecimiento sostenido peregrinos internacionales.",
    transport: [
      { mode: "Bus Empresa Freire", detail: "SCQ → Plaza Galicia (centro) en 35 min", priceEur: "3€" },
      { mode: "Taxi", detail: "Centro Santiago ~22€", priceEur: "22€" },
    ],
    presentAirlines: ["FR", "VY", "U2", "IB", "LH"],
    topDestinations: [
      { slug: "madrid", name: "Madrid" },
      { slug: "barcelona", name: "Barcelona" },
      { slug: "londres", name: "Londres" },
      { slug: "paris", name: "París" },
    ],
    notes: [
      "Tráfico peregrinos pico mayo-septiembre.",
      "Sin tren al aeropuerto — bus o taxi son únicas opciones.",
    ],
    lastVerified: "2026-05-23",
  },
  {
    iata: "GRX",
    city: "Granada-Jaén",
    formalName: "Federico García Lorca Granada-Jaén",
    operator: "AENA",
    region: "Andalucía",
    emoji: "🇪🇸",
    paxMillions: 1.1,
    terminals: 1,
    summary:
      "Aeropuerto regional Andalucía oriental. Alternativa a Málaga para destino Granada. Conectividad limitada a hubs.",
    transport: [
      { mode: "Bus Autocares José González", detail: "GRX → centro Granada en 45 min", priceEur: "3€" },
      { mode: "Taxi", detail: "Centro Granada ~30€", priceEur: "30€" },
    ],
    presentAirlines: ["VY", "IB", "FR"],
    topDestinations: [
      { slug: "madrid", name: "Madrid" },
      { slug: "barcelona", name: "Barcelona" },
    ],
    notes: [
      "Frecuencias limitadas — Madrid y Barcelona son rutas principales.",
      "Alternativa pequeña a Málaga (AGP) para visitar Alhambra.",
    ],
    lastVerified: "2026-05-23",
  },
];

export const AIRPORTS_ES_BY_IATA: Record<string, AirportEsEntry> = Object.fromEntries(
  AIRPORTS_ES.map((a) => [a.iata, a]),
);

export const AIRPORTS_ES_IATAS = AIRPORTS_ES.map((a) => a.iata);

export function getAirportEs(iata: string): AirportEsEntry | null {
  return AIRPORTS_ES_BY_IATA[iata.toUpperCase()] ?? null;
}
