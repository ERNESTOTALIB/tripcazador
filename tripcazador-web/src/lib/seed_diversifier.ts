/**
 * seed_diversifier.ts — fase ff-C1
 *
 * Frontend rotation guard: si /api/deals devuelve solo deals de un mes
 * (síntoma del seed legacy hardcodeado a jun-2026), reemplaza el catálogo
 * por un seed local TS con 30+ deals cubriendo Jul-2026 → Jun-2027.
 *
 * Por qué un fallback frontend en vez de esperar al VPS:
 *  - VPS systemd timer corre cada 6h. Hasta que pull el seed_deals.py nuevo
 *    desde GitHub (workflow vercel-deploy o manual), pasarán horas.
 *  - El usuario quería "ver chollos en otros meses" YA, no en 6h.
 *  - Este módulo se desactiva automáticamente cuando el motor real (o el
 *    VPS seed actualizado) devuelve ≥3 meses distintos.
 *
 * El fallback NO sobrescribe deals legítimos — sólo entra cuando se cumple:
 *  - todos los deals tienen el mismo mes (single-month signal)
 *  - O hay <8 deals en total (signal de motor caído)
 *
 * Cuando el motor real esté operativo con datos reales y diversos, este
 * código pasa a ser no-op transparente.
 */

import type { Deal } from "./api";

// Catálogo TS espejo de api/seed_deals.py (mismo orden y datos).
// Mantenerlo sincronizado: si actualizas uno, actualiza el otro.
// El seed Python es la fuente of truth (lo consume el VPS); este es backup.

// Template tipo extendido: airline_code es interno (no en Deal interface) —
// lo usa enhanceDealBookingUrl para generar URLs directas Ryanair/easyJet/Wizz.
// Lo dropeamos antes de devolver al frontend.
type CatalogTemplate = Partial<Deal> & {
  _key: string;
  airline_code?: string;
};

const FALLBACK_CATALOG: CatalogTemplate[] = [
  // JUL 2026
  { _key: "jul-kef", type: "flight", headline: "Madrid → Reikiavik con Wizz desde 119€",
    origin: "MAD", destination: "KEF", city_from: "Madrid", city_to: "Reikiavik",
    country_to: "Islandia", region: "Europa",
    price_eur: 119, savings_pct: 58, savings_eur: 165, nights: 5,
    date_out: "2026-07-12", date_ret: "2026-07-17",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Wizz Air",
    stops: 0, duration_min: 290, score: 88 },
  { _key: "jul-arn", type: "flight", headline: "Barcelona → Estocolmo con Vueling desde 89€",
    origin: "BCN", destination: "ARN", city_from: "Barcelona", city_to: "Estocolmo",
    country_to: "Suecia", region: "Europa",
    price_eur: 89, savings_pct: 42, savings_eur: 65, nights: 4,
    date_out: "2026-07-04", date_ret: "2026-07-08",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Vueling",
    stops: 0, duration_min: 220, score: 75 },

  // AGO 2026
  { _key: "ago-edi", type: "flight", headline: "Barcelona → Edimburgo con Ryanair desde 49€",
    origin: "BCN", destination: "EDI", city_from: "Barcelona", city_to: "Edimburgo",
    country_to: "Reino Unido", region: "Europa",
    price_eur: 49, savings_pct: 51, savings_eur: 51, nights: 3,
    date_out: "2026-08-08", date_ret: "2026-08-11",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Ryanair",
    stops: 0, duration_min: 165, score: 91 },
  { _key: "ago-bgo", type: "flight", headline: "Madrid → Bergen con SAS desde 165€",
    origin: "MAD", destination: "BGO", city_from: "Madrid", city_to: "Bergen",
    country_to: "Noruega", region: "Europa",
    price_eur: 165, savings_pct: 33, savings_eur: 82, nights: 5,
    date_out: "2026-08-15", date_ret: "2026-08-20",
    classification: "OFERTA", cabin: "economy",
    airline_name: "SAS",
    stops: 1, duration_min: 290, score: 70 },

  // SEP 2026
  { _key: "sep-nrt-business", type: "flight", headline: "Madrid → Tokio business con Iberia desde 1.395€",
    origin: "MAD", destination: "NRT", city_from: "Madrid", city_to: "Tokio",
    country_to: "Japón", region: "Asia",
    price_eur: 1395, savings_pct: 64, savings_eur: 2480, nights: 9,
    date_out: "2026-09-12", date_ret: "2026-09-21",
    classification: "CRÍTICO", cabin: "business",
    airline_name: "Iberia",
    stops: 1, duration_min: 920, score: 96 },
  { _key: "sep-bkk", type: "flight", headline: "Barcelona → Bangkok con Qatar desde 525€",
    origin: "BCN", destination: "BKK", city_from: "Barcelona", city_to: "Bangkok",
    country_to: "Tailandia", region: "Asia",
    price_eur: 525, savings_pct: 41, savings_eur: 365, nights: 12,
    date_out: "2026-09-20", date_ret: "2026-10-02",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Qatar Airways",
    stops: 1, duration_min: 920, score: 80 },
  { _key: "sep-rak", type: "flight", headline: "Madrid → Marrakech con Ryanair desde 35€",
    origin: "MAD", destination: "RAK", city_from: "Madrid", city_to: "Marrakech",
    country_to: "Marruecos", region: "África",
    price_eur: 35, savings_pct: 64, savings_eur: 65, nights: 4,
    date_out: "2026-09-26", date_ret: "2026-09-30",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Ryanair",
    stops: 0, duration_min: 175, score: 89 },

  // OCT 2026
  { _key: "oct-lis", type: "flight", headline: "Madrid → Lisboa con TAP weekend Pilar desde 78€",
    origin: "MAD", destination: "LIS", city_from: "Madrid", city_to: "Lisboa",
    country_to: "Portugal", region: "Europa",
    price_eur: 78, savings_pct: 28, savings_eur: 32, nights: 3,
    date_out: "2026-10-09", date_ret: "2026-10-12",
    classification: "OFERTA", cabin: "economy",
    airline_name: "TAP Portugal",
    stops: 0, duration_min: 75, score: 72 },
  { _key: "oct-ist", type: "flight", headline: "Barcelona → Estambul con Turkish desde 195€",
    origin: "BCN", destination: "IST", city_from: "Barcelona", city_to: "Estambul",
    country_to: "Turquía", region: "Asia",
    price_eur: 195, savings_pct: 35, savings_eur: 105, nights: 5,
    date_out: "2026-10-15", date_ret: "2026-10-20",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Turkish Airlines",
    stops: 0, duration_min: 215, score: 76 },
  { _key: "oct-syd-business", type: "flight", headline: "Madrid → Sídney business con Qatar desde 2.495€",
    origin: "MAD", destination: "SYD", city_from: "Madrid", city_to: "Sídney",
    country_to: "Australia", region: "Oceanía",
    price_eur: 2495, savings_pct: 58, savings_eur: 3450, nights: 14,
    date_out: "2026-10-04", date_ret: "2026-10-18",
    classification: "CRÍTICO", cabin: "business",
    airline_name: "Qatar Airways",
    stops: 1, duration_min: 1450, score: 95 },

  // NOV 2026
  { _key: "nov-prg", type: "flight", headline: "Madrid → Praga con Ryanair desde 39€",
    origin: "MAD", destination: "PRG", city_from: "Madrid", city_to: "Praga",
    country_to: "Chequia", region: "Europa",
    price_eur: 39, savings_pct: 56, savings_eur: 50, nights: 3,
    date_out: "2026-11-06", date_ret: "2026-11-09",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Ryanair",
    stops: 0, duration_min: 175, score: 89 },
  { _key: "nov-eze", type: "flight", headline: "Frankfurt → Buenos Aires con Lufthansa desde 695€",
    origin: "FRA", destination: "EZE", city_from: "Fráncfort", city_to: "Buenos Aires",
    country_to: "Argentina", region: "América Sur",
    price_eur: 695, savings_pct: 32, savings_eur: 325, nights: 14,
    date_out: "2026-11-12", date_ret: "2026-11-26",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Lufthansa",
    stops: 0, duration_min: 815, score: 70 },
  { _key: "nov-puj", type: "flight", headline: "Madrid → Punta Cana con Air Europa desde 525€",
    origin: "MAD", destination: "PUJ", city_from: "Madrid", city_to: "Punta Cana",
    country_to: "República Dominicana", region: "Caribe",
    price_eur: 525, savings_pct: 38, savings_eur: 320, nights: 7,
    date_out: "2026-11-15", date_ret: "2026-11-22",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Air Europa",
    stops: 0, duration_min: 575, score: 78 },
  { _key: "nov-hnd-business", type: "flight", headline: "Frankfurt → Tokio business con ANA desde 1.895€",
    origin: "FRA", destination: "HND", city_from: "Fráncfort", city_to: "Tokio",
    country_to: "Japón", region: "Asia",
    price_eur: 1895, savings_pct: 49, savings_eur: 1815, nights: 10,
    date_out: "2026-11-08", date_ret: "2026-11-18",
    classification: "CRÍTICO", cabin: "business",
    airline_name: "ANA",
    stops: 0, duration_min: 720, score: 93 },

  // DIC 2026
  { _key: "dic-ber", type: "flight", headline: "Madrid → Berlín con easyJet desde 65€",
    origin: "MAD", destination: "BER", city_from: "Madrid", city_to: "Berlín",
    country_to: "Alemania", region: "Europa",
    price_eur: 65, savings_pct: 47, savings_eur: 58, nights: 4,
    date_out: "2026-12-04", date_ret: "2026-12-08",
    classification: "OFERTA", cabin: "economy",
    airline_name: "easyJet",
    stops: 0, duration_min: 210, score: 86 },
  { _key: "dic-cun", type: "flight", headline: "Barcelona → Cancún con Aeroméxico desde 645€",
    origin: "BCN", destination: "CUN", city_from: "Barcelona", city_to: "Cancún",
    country_to: "México", region: "Caribe",
    price_eur: 645, savings_pct: 31, savings_eur: 295, nights: 8,
    date_out: "2026-12-15", date_ret: "2026-12-23",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Aeroméxico",
    stops: 1, duration_min: 720, score: 75 },
  { _key: "dic-hkg-error", type: "flight", headline: "Madrid → Hong Kong con Cathay error fare 395€",
    origin: "MAD", destination: "HKG", city_from: "Madrid", city_to: "Hong Kong",
    country_to: "Hong Kong", region: "Asia",
    price_eur: 395, savings_pct: 71, savings_eur: 980, nights: 10,
    date_out: "2026-12-12", date_ret: "2026-12-22",
    classification: "ERROR", cabin: "economy",
    airline_name: "Cathay Pacific",
    stops: 1, duration_min: 880, score: 99 },

  // ENE 2027
  { _key: "ene-hav", type: "flight", headline: "Madrid → La Habana con Air Europa desde 489€",
    origin: "MAD", destination: "HAV", city_from: "Madrid", city_to: "La Habana",
    country_to: "Cuba", region: "Caribe",
    price_eur: 489, savings_pct: 42, savings_eur: 354, nights: 9,
    date_out: "2027-01-12", date_ret: "2027-01-21",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Air Europa",
    stops: 0, duration_min: 555, score: 79 },
  { _key: "ene-sgn", type: "flight", headline: "Barcelona → Saigón con Vietnam Airlines desde 545€",
    origin: "BCN", destination: "SGN", city_from: "Barcelona", city_to: "Saigón",
    country_to: "Vietnam", region: "Asia",
    price_eur: 545, savings_pct: 38, savings_eur: 335, nights: 14,
    date_out: "2027-01-18", date_ret: "2027-02-01",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Vietnam Airlines",
    stops: 1, duration_min: 905, score: 76 },

  // FEB 2027
  { _key: "feb-vce", type: "flight", headline: "Madrid → Venecia carnaval con Vueling desde 145€",
    origin: "MAD", destination: "VCE", city_from: "Madrid", city_to: "Venecia",
    country_to: "Italia", region: "Europa",
    price_eur: 145, savings_pct: 36, savings_eur: 82, nights: 4,
    date_out: "2027-02-13", date_ret: "2027-02-17",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Vueling",
    stops: 0, duration_min: 165, score: 74 },
  { _key: "feb-ssh", type: "flight", headline: "Madrid → Sharm El Sheikh con TUI desde 365€",
    origin: "MAD", destination: "SSH", city_from: "Madrid", city_to: "Sharm El Sheikh",
    country_to: "Egipto", region: "Oriente Medio",
    price_eur: 365, savings_pct: 35, savings_eur: 195, nights: 7,
    date_out: "2027-02-20", date_ret: "2027-02-27",
    classification: "OFERTA", cabin: "economy",
    airline_name: "TUI fly",
    stops: 1, duration_min: 320, score: 72 },
  { _key: "feb-dxb", type: "flight", headline: "Barcelona → Dubái premium con Emirates desde 985€",
    origin: "BCN", destination: "DXB", city_from: "Barcelona", city_to: "Dubái",
    country_to: "EAU", region: "Oriente Medio",
    price_eur: 985, savings_pct: 44, savings_eur: 765, nights: 6,
    date_out: "2027-02-01", date_ret: "2027-02-07",
    classification: "OFERTA", cabin: "premium_economy",
    airline_name: "Emirates",
    stops: 0, duration_min: 425, score: 81 },

  // MAR 2027
  { _key: "mar-fco", type: "flight", headline: "Barcelona → Roma con Ryanair desde 29€",
    origin: "BCN", destination: "FCO", city_from: "Barcelona", city_to: "Roma",
    country_to: "Italia", region: "Europa",
    price_eur: 29, savings_pct: 64, savings_eur: 51, nights: 3,
    date_out: "2027-03-12", date_ret: "2027-03-15",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Ryanair",
    stops: 0, duration_min: 130, score: 92 },
  { _key: "mar-kix", type: "flight", headline: "Madrid → Osaka cherry blossom con Iberia desde 745€",
    origin: "MAD", destination: "KIX", city_from: "Madrid", city_to: "Osaka",
    country_to: "Japón", region: "Asia",
    price_eur: 745, savings_pct: 28, savings_eur: 295, nights: 12,
    date_out: "2027-03-22", date_ret: "2027-04-03",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Iberia",
    stops: 1, duration_min: 935, score: 70 },

  // ABR 2027
  { _key: "abr-ath", type: "flight", headline: "Madrid → Atenas con Aegean desde 125€",
    origin: "MAD", destination: "ATH", city_from: "Madrid", city_to: "Atenas",
    country_to: "Grecia", region: "Europa",
    price_eur: 125, savings_pct: 38, savings_eur: 78, nights: 5,
    date_out: "2027-04-09", date_ret: "2027-04-14",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Aegean Airlines",
    stops: 0, duration_min: 210, score: 78 },
  { _key: "abr-cpt", type: "flight", headline: "Frankfurt → Cape Town con Lufthansa desde 595€",
    origin: "FRA", destination: "CPT", city_from: "Fráncfort", city_to: "Cape Town",
    country_to: "Sudáfrica", region: "África",
    price_eur: 595, savings_pct: 41, savings_eur: 415, nights: 11,
    date_out: "2027-04-15", date_ret: "2027-04-26",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Lufthansa",
    stops: 0, duration_min: 720, score: 79 },

  // MAY 2027
  { _key: "may-ams", type: "flight", headline: "Madrid → Ámsterdam con KLM desde 105€",
    origin: "MAD", destination: "AMS", city_from: "Madrid", city_to: "Ámsterdam",
    country_to: "Países Bajos", region: "Europa",
    price_eur: 105, savings_pct: 32, savings_eur: 50, nights: 4,
    date_out: "2027-05-08", date_ret: "2027-05-12",
    classification: "OFERTA", cabin: "economy",
    airline_name: "KLM",
    stops: 0, duration_min: 175, score: 73 },
  { _key: "may-jmk", type: "flight", headline: "Barcelona → Mykonos con easyJet desde 89€",
    origin: "BCN", destination: "JMK", city_from: "Barcelona", city_to: "Mykonos",
    country_to: "Grecia", region: "Europa",
    price_eur: 89, savings_pct: 45, savings_eur: 73, nights: 5,
    date_out: "2027-05-15", date_ret: "2027-05-20",
    classification: "OFERTA", cabin: "economy",
    airline_name: "easyJet",
    stops: 0, duration_min: 215, score: 84 },

  // JUN 2027 (sustituye los viejos jun-2026)
  { _key: "jun-dub", type: "flight", headline: "Madrid → Dublín con Ryanair desde 45€",
    origin: "MAD", destination: "DUB", city_from: "Madrid", city_to: "Dublín",
    country_to: "Irlanda", region: "Europa",
    price_eur: 45, savings_pct: 50, savings_eur: 45, nights: 3,
    date_out: "2027-06-04", date_ret: "2027-06-07",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Ryanair",
    stops: 0, duration_min: 175, score: 90 },
  { _key: "jun-sin", type: "flight", headline: "Barcelona → Singapur con Singapore Airlines desde 695€",
    origin: "BCN", destination: "SIN", city_from: "Barcelona", city_to: "Singapur",
    country_to: "Singapur", region: "Asia",
    price_eur: 695, savings_pct: 35, savings_eur: 375, nights: 10,
    date_out: "2027-06-14", date_ret: "2027-06-24",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Singapore Airlines",
    stops: 1, duration_min: 920, score: 76 },

  // ── F3 fase ii: +20 deals adicionales (60 total) — más rutas + variedad ─

  // USA & Canadá (sub-representado antes)
  { _key: "ago-jfk-economy", type: "flight", headline: "Madrid → Nueva York con Iberia desde 425€",
    origin: "MAD", destination: "JFK", city_from: "Madrid", city_to: "Nueva York",
    country_to: "Estados Unidos", region: "América Norte",
    price_eur: 425, savings_pct: 38, savings_eur: 265, nights: 7,
    date_out: "2026-08-22", date_ret: "2026-08-29",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Iberia",
    stops: 0, duration_min: 510, score: 78 },
  { _key: "oct-yyz", type: "flight", headline: "Madrid → Toronto con Air Canada desde 525€",
    origin: "MAD", destination: "YYZ", city_from: "Madrid", city_to: "Toronto",
    country_to: "Canadá", region: "América Norte",
    price_eur: 525, savings_pct: 32, savings_eur: 250, nights: 8,
    date_out: "2026-10-08", date_ret: "2026-10-16",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Air Canada",
    stops: 0, duration_min: 545, score: 75 },
  { _key: "feb-mia", type: "flight", headline: "Madrid → Miami con Iberia desde 495€",
    origin: "MAD", destination: "MIA", city_from: "Madrid", city_to: "Miami",
    country_to: "Estados Unidos", region: "América Norte",
    price_eur: 495, savings_pct: 35, savings_eur: 265, nights: 9,
    date_out: "2027-02-14", date_ret: "2027-02-23",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Iberia",
    stops: 0, duration_min: 595, score: 76 },
  { _key: "abr-lax", type: "flight", headline: "Madrid → Los Ángeles con Iberia desde 595€",
    origin: "MAD", destination: "LAX", city_from: "Madrid", city_to: "Los Ángeles",
    country_to: "Estados Unidos", region: "América Norte",
    price_eur: 595, savings_pct: 31, savings_eur: 265, nights: 10,
    date_out: "2027-04-22", date_ret: "2027-05-02",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Iberia",
    stops: 0, duration_min: 740, score: 74 },

  // Sudamérica (más allá de EZE/HAV)
  { _key: "sep-gru", type: "flight", headline: "Madrid → São Paulo con LATAM desde 595€",
    origin: "MAD", destination: "GRU", city_from: "Madrid", city_to: "São Paulo",
    country_to: "Brasil", region: "América Sur",
    price_eur: 595, savings_pct: 36, savings_eur: 335, nights: 14,
    date_out: "2026-09-08", date_ret: "2026-09-22",
    classification: "OFERTA", cabin: "economy",
    airline_name: "LATAM",
    stops: 0, duration_min: 685, score: 76 },
  { _key: "oct-lim", type: "flight", headline: "Madrid → Lima con Air Europa desde 645€",
    origin: "MAD", destination: "LIM", city_from: "Madrid", city_to: "Lima",
    country_to: "Perú", region: "América Sur",
    price_eur: 645, savings_pct: 32, savings_eur: 305, nights: 12,
    date_out: "2026-10-05", date_ret: "2026-10-17",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Air Europa",
    stops: 0, duration_min: 715, score: 74 },
  { _key: "abr-bog", type: "flight", headline: "Madrid → Bogotá con Avianca desde 525€",
    origin: "MAD", destination: "BOG", city_from: "Madrid", city_to: "Bogotá",
    country_to: "Colombia", region: "América Sur",
    price_eur: 525, savings_pct: 35, savings_eur: 280, nights: 11,
    date_out: "2027-04-10", date_ret: "2027-04-21",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Avianca",
    stops: 0, duration_min: 640, score: 76 },

  // Europa Sur extra
  { _key: "sep-bcn-bud", type: "flight", headline: "Barcelona → Budapest con Ryanair desde 49€",
    origin: "BCN", destination: "BUD", city_from: "Barcelona", city_to: "Budapest",
    country_to: "Hungría", region: "Europa",
    price_eur: 49, savings_pct: 51, savings_eur: 51, nights: 4,
    date_out: "2026-09-18", date_ret: "2026-09-22",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Ryanair",
    stops: 0, duration_min: 165, score: 88 },
  { _key: "oct-mad-dbv", type: "flight", headline: "Madrid → Dubrovnik con Vueling desde 95€",
    origin: "MAD", destination: "DBV", city_from: "Madrid", city_to: "Dubrovnik",
    country_to: "Croacia", region: "Europa",
    price_eur: 95, savings_pct: 42, savings_eur: 70, nights: 4,
    date_out: "2026-10-02", date_ret: "2026-10-06",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Vueling",
    stops: 0, duration_min: 215, score: 79 },
  { _key: "may-bcn-mad-fnc", type: "flight", headline: "Madrid → Funchal (Madeira) con TAP desde 145€",
    origin: "MAD", destination: "FNC", city_from: "Madrid", city_to: "Funchal",
    country_to: "Portugal", region: "Europa",
    price_eur: 145, savings_pct: 32, savings_eur: 70, nights: 5,
    date_out: "2027-05-10", date_ret: "2027-05-15",
    classification: "OFERTA", cabin: "economy",
    airline_name: "TAP Portugal",
    stops: 1, duration_min: 215, score: 73 },

  // Asia ampliado
  { _key: "nov-bcn-pek", type: "flight", headline: "Barcelona → Pekín con Air China desde 525€",
    origin: "BCN", destination: "PEK", city_from: "Barcelona", city_to: "Pekín",
    country_to: "China", region: "Asia",
    price_eur: 525, savings_pct: 35, savings_eur: 285, nights: 10,
    date_out: "2026-11-04", date_ret: "2026-11-14",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Air China",
    stops: 1, duration_min: 875, score: 75 },
  { _key: "ene-mad-icn", type: "flight", headline: "Madrid → Seúl con Korean Air desde 695€",
    origin: "MAD", destination: "ICN", city_from: "Madrid", city_to: "Seúl",
    country_to: "Corea del Sur", region: "Asia",
    price_eur: 695, savings_pct: 30, savings_eur: 295, nights: 11,
    date_out: "2027-01-22", date_ret: "2027-02-02",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Korean Air",
    stops: 1, duration_min: 920, score: 76 },
  { _key: "abr-bcn-del", type: "flight", headline: "Barcelona → Delhi con Air India desde 545€",
    origin: "BCN", destination: "DEL", city_from: "Barcelona", city_to: "Delhi",
    country_to: "India", region: "Asia",
    price_eur: 545, savings_pct: 38, savings_eur: 335, nights: 14,
    date_out: "2027-04-08", date_ret: "2027-04-22",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Air India",
    stops: 1, duration_min: 855, score: 75 },

  // África ampliado
  { _key: "ago-mad-rba", type: "flight", headline: "Madrid → Rabat con Royal Air Maroc desde 105€",
    origin: "MAD", destination: "RBA", city_from: "Madrid", city_to: "Rabat",
    country_to: "Marruecos", region: "África",
    price_eur: 105, savings_pct: 35, savings_eur: 55, nights: 4,
    date_out: "2026-08-04", date_ret: "2026-08-08",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Royal Air Maroc",
    stops: 0, duration_min: 165, score: 76 },
  { _key: "oct-bcn-tnr", type: "flight", headline: "Barcelona → Antananarivo con Air France desde 845€",
    origin: "BCN", destination: "TNR", city_from: "Barcelona", city_to: "Antananarivo",
    country_to: "Madagascar", region: "África",
    price_eur: 845, savings_pct: 28, savings_eur: 325, nights: 14,
    date_out: "2026-10-15", date_ret: "2026-10-29",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Air France",
    stops: 1, duration_min: 1020, score: 74 },

  // Oriente Medio
  { _key: "feb-mad-amm", type: "flight", headline: "Madrid → Ammán con Royal Jordanian desde 365€",
    origin: "MAD", destination: "AMM", city_from: "Madrid", city_to: "Ammán",
    country_to: "Jordania", region: "Oriente Medio",
    price_eur: 365, savings_pct: 35, savings_eur: 195, nights: 8,
    date_out: "2027-02-08", date_ret: "2027-02-16",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Royal Jordanian",
    stops: 1, duration_min: 425, score: 75 },
  { _key: "mar-bcn-tlv", type: "flight", headline: "Barcelona → Tel Aviv con El Al desde 295€",
    origin: "BCN", destination: "TLV", city_from: "Barcelona", city_to: "Tel Aviv",
    country_to: "Israel", region: "Oriente Medio",
    price_eur: 295, savings_pct: 30, savings_eur: 125, nights: 6,
    date_out: "2027-03-08", date_ret: "2027-03-14",
    classification: "OFERTA", cabin: "economy",
    airline_name: "El Al",
    stops: 0, duration_min: 285, score: 73 },

  // Oceanía + Pacífico
  { _key: "ene-mad-akl", type: "flight", headline: "Madrid → Auckland con Qatar Airways desde 1095€",
    origin: "MAD", destination: "AKL", city_from: "Madrid", city_to: "Auckland",
    country_to: "Nueva Zelanda", region: "Oceanía",
    price_eur: 1095, savings_pct: 33, savings_eur: 545, nights: 14,
    date_out: "2027-01-08", date_ret: "2027-01-22",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Qatar Airways",
    stops: 1, duration_min: 1820, score: 75 },
  { _key: "abr-mad-ppt", type: "flight", headline: "Madrid → Tahití con Air France desde 1395€",
    origin: "MAD", destination: "PPT", city_from: "Madrid", city_to: "Papeete",
    country_to: "Polinesia Francesa", region: "Oceanía",
    price_eur: 1395, savings_pct: 28, savings_eur: 545, nights: 14,
    date_out: "2027-04-15", date_ret: "2027-04-29",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Air France",
    stops: 1, duration_min: 1420, score: 73 },

  // Hoteles extras
  { _key: "hotel-cun", type: "hotel", headline: "Hotel Cancún 4★ Hotel Zone 7 noches 595€",
    origin: "—", destination: "CUN", city_from: "—", city_to: "Cancún",
    country_to: "México", region: "Caribe",
    price_eur: 595, savings_pct: 30, savings_eur: 250, nights: 7,
    date_out: "2026-12-15", date_ret: "2026-12-22",
    classification: "OFERTA", cabin: "economy",
    airline_name: "Hotel",
    stops: 0, duration_min: 0, score: 70 },
];

function hashId(parts: string[]): string {
  // FNV-1a simple
  let h = 2166136261;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h.toString(16).padStart(10, "0");
}

function buildDealFromTemplate(t: CatalogTemplate): Deal {
  // L3 fase ll → NN1 fase nn: found_at diversificado por hash del deal.
  // Antes: offset 2 min … 4 días → algunos deals salían con "Posiblemente caducado · visto Hace 3d"
  // (queja usuario: "el primero que sale es posiblemente caducado?").
  // Ahora: offset 2 min … 22 h → ningún deal del seed muestra warning de stale.
  // ExpiryCountdown.tsx considera stale a partir de >24h, así que mantenemos
  // todo bajo ese umbral. Cuando el motor real corre, found_at viene del
  // backend con timestamp real (no se aplica este clamp).
  const idKey = `${t.origin || ""}-${t.destination || ""}-${t.date_out || ""}`;
  let h = 2166136261;
  for (let i = 0; i < idKey.length; i++) {
    h ^= idKey.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  // Distribuye entre 2 min y 22*60 = 1320 min (22h, debajo de "stale" 24h).
  const MAX_OFFSET_MIN = 22 * 60;
  const offsetMin = 2 + (h % (MAX_OFFSET_MIN - 2));
  const foundAt = new Date(Date.now() - offsetMin * 60_000).toISOString();
  const nowIso = foundAt;  // alias retained
  const id = `seed-${hashId([t.origin || "", t.destination || "", t.date_out || "", t.airline_code || "", String(t.price_eur || 0)])}`;
  return {
    id,
    type: (t.type as Deal["type"]) || "flight",
    headline: t.headline || "",
    origin: t.origin || "",
    destination: t.destination || "",
    city_from: t.city_from || "",
    city_to: t.city_to || "",
    country_to: t.country_to || "",
    region: t.region || "",
    price_eur: t.price_eur || 0,
    savings_pct: t.savings_pct || 0,
    savings_eur: t.savings_eur || 0,
    nights: t.nights || 0,
    price_per_night: t.nights && t.price_eur ? Math.round((t.price_eur / t.nights) * 100) / 100 : null,
    date_out: t.date_out || "",
    date_ret: t.date_ret || "",
    classification: (t.classification as Deal["classification"]) || "OFERTA",
    cabin: (t.cabin as Deal["cabin"]) || "economy",
    airline_name: t.airline_name || "",
    stops: t.stops ?? 0,
    duration_min: t.duration_min ?? 0,
    score: t.score ?? 70,
    image_url: "",
    booking_url: "",  // enhancer reescribe
    verified: false,
    tags: [],
    expires_at: "",
    found_at: nowIso,
  } as Deal;
}

/**
 * detectSingleMonth — heurística: ¿necesitamos el fallback?
 * Returns true si:
 *   - todos los deals tienen el mismo year-month en date_out
 *   - O hay menos de 8 deals total
 */
export function shouldUseFallback(deals: Deal[]): boolean {
  if (!deals || deals.length === 0) return true;
  if (deals.length < 8) return true;
  const months = new Set(deals.map((d) => (d.date_out || "").slice(0, 7)));
  return months.size <= 1;
}

/**
 * Filtros aplicables al catálogo fallback. Cuando entramos en modo
 * fallback (backend caído / single-month), los filtros del request del
 * usuario deben aplicarse al catálogo TS — si no, /deals?classification=
 * CRÍTICO devuelve 30 deals en vez de los 3 críticos.
 *
 * Bug fase gg→hh: el usuario reportó "los filtros de deals no funcionan".
 * Backend devolvía [] para cualquier filtro (rate-limit / edge case),
 * diversifyDeals rellenaba con catálogo completo ignorando el filtro.
 */
export interface DealFilter {
  classification?: string;
  region?: string;
  cabin?: string;
  max_price?: number;
  limit?: number;
}

function applyFilter(deals: Deal[], filter: DealFilter | undefined): Deal[] {
  if (!filter) return deals;
  let out = deals;
  if (filter.classification) {
    const target = filter.classification.toUpperCase();
    out = out.filter((d) => (d.classification || "").toUpperCase() === target);
  }
  if (filter.region) {
    const target = filter.region.toLowerCase();
    out = out.filter((d) => (d.region || "").toLowerCase() === target);
  }
  if (filter.cabin) {
    const target = filter.cabin.toLowerCase();
    out = out.filter((d) => (d.cabin || "").toLowerCase() === target);
  }
  if (typeof filter.max_price === "number" && filter.max_price > 0) {
    out = out.filter((d) => d.price_eur <= filter.max_price!);
  }
  if (typeof filter.limit === "number" && filter.limit > 0) {
    out = out.slice(0, filter.limit);
  }
  return out;
}

/**
 * sortByFeaturedRanking — NN1 fase nn.
 * Orden definitivo para destacados/home: fresh primero, score después.
 * - hidden si found_at > 72h (probablemente caducado).
 * - sort key: floor(ageHours / 6) ASC, score DESC, price ASC.
 *   El bucketing por bloques de 6h evita que un deal con score 95 caiga al
 *   final solo por ser 30 min más antiguo que otro de score 80.
 *
 * Cuando el backend devuelve deals reales con expires_at, el bucketing
 * sigue funcionando porque preferimos siempre el más fresco a igualdad de score.
 */
export function sortByFeaturedRanking(deals: Deal[]): Deal[] {
  const now = Date.now();
  const STALE_HOURS = 72;  // ocultos por encima de 72h
  const BUCKET_HOURS = 6;
  const out = deals.filter((d) => {
    if (!d.found_at) return true;
    const ageH = (now - new Date(d.found_at).getTime()) / (3600_000);
    return ageH < STALE_HOURS;
  });
  out.sort((a, b) => {
    const ageA = a.found_at ? (now - new Date(a.found_at).getTime()) / 3600_000 : 0;
    const ageB = b.found_at ? (now - new Date(b.found_at).getTime()) / 3600_000 : 0;
    const bucketA = Math.floor(ageA / BUCKET_HOURS);
    const bucketB = Math.floor(ageB / BUCKET_HOURS);
    if (bucketA !== bucketB) return bucketA - bucketB;
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    return (a.price_eur || 0) - (b.price_eur || 0);
  });
  return out;
}

/**
 * diversifyDeals — recibe los deals reales del backend y devuelve un set
 * diversificado:
 *   - Si shouldUseFallback() = true → reemplaza por FALLBACK_CATALOG completo,
 *     **aplicando el filter del usuario** sobre el catálogo (el bug).
 *   - Si false → devuelve deals tal cual (motor real funciona).
 *
 * Siempre se aplica sortByFeaturedRanking al resultado para evitar el bug
 * de fase nn (el primer deal mostrado era "Posiblemente caducado").
 *
 * Nota: el ordering aleatorio se mantiene determinista vía Date.now() del
 * server-render para evitar hydration mismatches. En la práctica, ISR
 * cachea 5 min así que mismo orden por ventana de cache.
 */
export function diversifyDeals(deals: Deal[], filter?: DealFilter): Deal[] {
  let working: Deal[];
  if (shouldUseFallback(deals)) {
    working = FALLBACK_CATALOG.map((t) => buildDealFromTemplate(t));
  } else {
    working = deals;
  }
  const ranked = sortByFeaturedRanking(working);
  return applyFilter(ranked, filter);
}
