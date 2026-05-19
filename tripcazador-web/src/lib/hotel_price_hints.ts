/**
 * hotel_price_hints.ts — SSS325 (19 may 2026)
 *
 * Mid-tier €/noche por ciudad popular (extraído de HotelCrossSell.tsx
 * para que el trip planner pueda reusarlo desde server-side sin tener
 * que importar el componente client).
 *
 * Pure function `getPriceHint(city)` con normalización + fallback.
 */

/** Precio "desde" estimado por ciudad (mid-tier, single room/night). */
export const HOTEL_PRICE_HINTS: Record<string, number> = {
  // Spain
  madrid: 110, barcelona: 130, sevilla: 90, valencia: 90, malaga: 95,
  bilbao: 110, palma: 120, "las palmas": 95, tenerife: 90,
  // EU short-haul
  lisboa: 100, lisbon: 100, porto: 85, paris: 160, london: 180, londres: 180,
  amsterdam: 150, berlin: 110, roma: 130, rome: 130, milan: 140, milano: 140,
  munich: 140, vienna: 130, viena: 130, praga: 80, prague: 80,
  budapest: 75, krakow: 65, cracovia: 65, warsaw: 80, varsovia: 80,
  copenhague: 170, copenhagen: 170, estocolmo: 150, stockholm: 150,
  oslo: 170, helsinki: 130, dublin: 130, edinburgh: 140, edimburgo: 140,
  // long-haul
  bangkok: 70, tokio: 130, tokyo: 130, "nueva york": 200, "new york": 200,
  dubai: 130, dubái: 130, singapore: 140, singapur: 140,
  bali: 60, denpasar: 60, marrakech: 60, marrakesh: 60, estambul: 80,
  istanbul: 80, "rio de janeiro": 90, río: 90, "buenos aires": 70,
  "mexico city": 80, "ciudad de méxico": 80, mexico: 80,
  reikiavik: 200, reykjavik: 200, "ho chi minh": 50, hanoi: 50,
};

/** Map IATA → ciudad (subset top destinations) para enriquecer trip planner. */
export const IATA_TO_CITY: Record<string, string> = {
  MAD: "Madrid", BCN: "Barcelona", VLC: "Valencia", SVQ: "Sevilla",
  AGP: "Málaga", BIO: "Bilbao", PMI: "Palma", LIS: "Lisboa", OPO: "Porto",
  CDG: "Paris", ORY: "Paris", PAR: "Paris", LHR: "Londres", LON: "Londres",
  LGW: "Londres", AMS: "Amsterdam", TXL: "Berlin", BER: "Berlin",
  FCO: "Roma", ROM: "Roma", MXP: "Milan", LIN: "Milan", MUC: "Munich",
  VIE: "Vienna", PRG: "Praga", BUD: "Budapest", KRK: "Krakow", WAW: "Warsaw",
  CPH: "Copenhague", ARN: "Estocolmo", OSL: "Oslo", HEL: "Helsinki",
  DUB: "Dublin", EDI: "Edinburgh", BKK: "Bangkok", HND: "Tokio", NRT: "Tokio",
  TYO: "Tokio", JFK: "Nueva York", LGA: "Nueva York", EWR: "Nueva York",
  NYC: "Nueva York", DXB: "Dubai", SIN: "Singapore", DPS: "Bali",
  RAK: "Marrakech", IST: "Estambul", GIG: "Rio de Janeiro", EZE: "Buenos Aires",
  MEX: "Mexico City", KEF: "Reikiavik", SGN: "Ho Chi Minh", HAN: "Hanoi",
  TFS: "Tenerife", TFN: "Tenerife", LPA: "Las Palmas",
};

/** Default fallback per region (€/noche). */
const DEFAULT_HINT_EUR = 90;

export function getHotelPriceHint(input: string): number {
  const key = (input || "").toLowerCase().trim();
  if (!key) return DEFAULT_HINT_EUR;
  if (HOTEL_PRICE_HINTS[key] !== undefined) return HOTEL_PRICE_HINTS[key];
  // Si input es IATA, traducir y reintentar
  const upper = input.toUpperCase().trim();
  const city = IATA_TO_CITY[upper];
  if (city && HOTEL_PRICE_HINTS[city.toLowerCase()] !== undefined) {
    return HOTEL_PRICE_HINTS[city.toLowerCase()];
  }
  return DEFAULT_HINT_EUR;
}
