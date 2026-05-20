/**
 * programmatic_seo.ts — SSS337 (20 may 2026)
 *
 * Catálogo de ciudades top + meses para programmatic SEO landings:
 *  - /vuelos-baratos-{slug-ciudad}-{mes}-{year}
 *  - /precio-vuelo-{slug-origen}-{slug-destino}
 *
 * Datos curados — no auto-generados desde DB. ~50 ciudades × 12 meses
 * = 600 landings. Cada una con copy único basado en sweetSpot mes +
 * deals reales filtrados del hunter.
 */

export interface CitySlug {
  slug: string; // url-safe
  display: string; // display name
  iata: string;
  country: string;
  region: "europa" | "asia" | "america" | "africa" | "oceania";
  /** Mes "sweet spot" precio mínimo histórico (1-12) */
  sweetSpot: number;
  /** Precio "desde" anchor para copy SEO */
  fromEur: number;
}

export const SEO_CITIES: CitySlug[] = [
  // EUROPA short-haul
  { slug: "lisboa", display: "Lisboa", iata: "LIS", country: "Portugal", region: "europa", sweetSpot: 11, fromEur: 39 },
  { slug: "porto", display: "Porto", iata: "OPO", country: "Portugal", region: "europa", sweetSpot: 11, fromEur: 35 },
  { slug: "paris", display: "París", iata: "CDG", country: "Francia", region: "europa", sweetSpot: 11, fromEur: 49 },
  { slug: "londres", display: "Londres", iata: "LHR", country: "Reino Unido", region: "europa", sweetSpot: 1, fromEur: 39 },
  { slug: "amsterdam", display: "Amsterdam", iata: "AMS", country: "Países Bajos", region: "europa", sweetSpot: 11, fromEur: 45 },
  { slug: "berlin", display: "Berlín", iata: "BER", country: "Alemania", region: "europa", sweetSpot: 11, fromEur: 49 },
  { slug: "roma", display: "Roma", iata: "FCO", country: "Italia", region: "europa", sweetSpot: 11, fromEur: 39 },
  { slug: "milan", display: "Milán", iata: "MXP", country: "Italia", region: "europa", sweetSpot: 11, fromEur: 39 },
  { slug: "munich", display: "Múnich", iata: "MUC", country: "Alemania", region: "europa", sweetSpot: 11, fromEur: 49 },
  { slug: "viena", display: "Viena", iata: "VIE", country: "Austria", region: "europa", sweetSpot: 11, fromEur: 59 },
  { slug: "praga", display: "Praga", iata: "PRG", country: "República Checa", region: "europa", sweetSpot: 11, fromEur: 39 },
  { slug: "budapest", display: "Budapest", iata: "BUD", country: "Hungría", region: "europa", sweetSpot: 11, fromEur: 35 },
  { slug: "cracovia", display: "Cracovia", iata: "KRK", country: "Polonia", region: "europa", sweetSpot: 11, fromEur: 29 },
  { slug: "varsovia", display: "Varsovia", iata: "WAW", country: "Polonia", region: "europa", sweetSpot: 11, fromEur: 39 },
  { slug: "copenhague", display: "Copenhague", iata: "CPH", country: "Dinamarca", region: "europa", sweetSpot: 2, fromEur: 59 },
  { slug: "estocolmo", display: "Estocolmo", iata: "ARN", country: "Suecia", region: "europa", sweetSpot: 2, fromEur: 59 },
  { slug: "oslo", display: "Oslo", iata: "OSL", country: "Noruega", region: "europa", sweetSpot: 2, fromEur: 79 },
  { slug: "helsinki", display: "Helsinki", iata: "HEL", country: "Finlandia", region: "europa", sweetSpot: 2, fromEur: 79 },
  { slug: "dublin", display: "Dublín", iata: "DUB", country: "Irlanda", region: "europa", sweetSpot: 1, fromEur: 39 },
  { slug: "edimburgo", display: "Edimburgo", iata: "EDI", country: "Reino Unido", region: "europa", sweetSpot: 1, fromEur: 49 },
  { slug: "estambul", display: "Estambul", iata: "IST", country: "Turquía", region: "europa", sweetSpot: 11, fromEur: 89 },
  { slug: "atenas", display: "Atenas", iata: "ATH", country: "Grecia", region: "europa", sweetSpot: 11, fromEur: 79 },
  { slug: "reikiavik", display: "Reikiavik", iata: "KEF", country: "Islandia", region: "europa", sweetSpot: 1, fromEur: 99 },
  // ASIA long-haul
  { slug: "tokio", display: "Tokio", iata: "TYO", country: "Japón", region: "asia", sweetSpot: 1, fromEur: 469 },
  { slug: "bangkok", display: "Bangkok", iata: "BKK", country: "Tailandia", region: "asia", sweetSpot: 5, fromEur: 399 },
  { slug: "bali", display: "Bali", iata: "DPS", country: "Indonesia", region: "asia", sweetSpot: 5, fromEur: 469 },
  { slug: "ho-chi-minh", display: "Ho Chi Minh", iata: "SGN", country: "Vietnam", region: "asia", sweetSpot: 5, fromEur: 449 },
  { slug: "hanoi", display: "Hanói", iata: "HAN", country: "Vietnam", region: "asia", sweetSpot: 5, fromEur: 449 },
  { slug: "singapur", display: "Singapur", iata: "SIN", country: "Singapur", region: "asia", sweetSpot: 5, fromEur: 539 },
  { slug: "kuala-lumpur", display: "Kuala Lumpur", iata: "KUL", country: "Malasia", region: "asia", sweetSpot: 5, fromEur: 469 },
  { slug: "seul", display: "Seúl", iata: "ICN", country: "Corea del Sur", region: "asia", sweetSpot: 1, fromEur: 539 },
  { slug: "delhi", display: "Delhi", iata: "DEL", country: "India", region: "asia", sweetSpot: 5, fromEur: 369 },
  { slug: "dubai", display: "Dubai", iata: "DXB", country: "Emiratos", region: "asia", sweetSpot: 5, fromEur: 249 },
  // AMÉRICA
  { slug: "nueva-york", display: "Nueva York", iata: "JFK", country: "Estados Unidos", region: "america", sweetSpot: 1, fromEur: 199 },
  { slug: "los-angeles", display: "Los Ángeles", iata: "LAX", country: "Estados Unidos", region: "america", sweetSpot: 1, fromEur: 369 },
  { slug: "miami", display: "Miami", iata: "MIA", country: "Estados Unidos", region: "america", sweetSpot: 9, fromEur: 299 },
  { slug: "cancun", display: "Cancún", iata: "CUN", country: "México", region: "america", sweetSpot: 5, fromEur: 369 },
  { slug: "ciudad-mexico", display: "Ciudad de México", iata: "MEX", country: "México", region: "america", sweetSpot: 5, fromEur: 399 },
  { slug: "buenos-aires", display: "Buenos Aires", iata: "EZE", country: "Argentina", region: "america", sweetSpot: 5, fromEur: 549 },
  { slug: "rio-janeiro", display: "Río de Janeiro", iata: "GIG", country: "Brasil", region: "america", sweetSpot: 4, fromEur: 499 },
  { slug: "santiago-chile", display: "Santiago de Chile", iata: "SCL", country: "Chile", region: "america", sweetSpot: 4, fromEur: 599 },
  { slug: "la-habana", display: "La Habana", iata: "HAV", country: "Cuba", region: "america", sweetSpot: 5, fromEur: 449 },
  { slug: "bogota", display: "Bogotá", iata: "BOG", country: "Colombia", region: "america", sweetSpot: 4, fromEur: 449 },
  { slug: "lima", display: "Lima", iata: "LIM", country: "Perú", region: "america", sweetSpot: 4, fromEur: 449 },
  // ÁFRICA
  { slug: "marrakech", display: "Marrakech", iata: "RAK", country: "Marruecos", region: "africa", sweetSpot: 2, fromEur: 79 },
  { slug: "el-cairo", display: "El Cairo", iata: "CAI", country: "Egipto", region: "africa", sweetSpot: 2, fromEur: 199 },
  { slug: "ciudad-cabo", display: "Ciudad del Cabo", iata: "CPT", country: "Sudáfrica", region: "africa", sweetSpot: 5, fromEur: 449 },
  // OCEANÍA
  { slug: "sydney", display: "Sídney", iata: "SYD", country: "Australia", region: "oceania", sweetSpot: 4, fromEur: 899 },
];

export const SEO_ORIGINS = [
  { slug: "madrid", display: "Madrid", iata: "MAD" },
  { slug: "barcelona", display: "Barcelona", iata: "BCN" },
  { slug: "valencia", display: "Valencia", iata: "VLC" },
  { slug: "sevilla", display: "Sevilla", iata: "SVQ" },
  { slug: "bilbao", display: "Bilbao", iata: "BIO" },
  { slug: "malaga", display: "Málaga", iata: "AGP" },
];

export const MONTHS_ES = [
  { num: 1, slug: "enero", display: "enero" },
  { num: 2, slug: "febrero", display: "febrero" },
  { num: 3, slug: "marzo", display: "marzo" },
  { num: 4, slug: "abril", display: "abril" },
  { num: 5, slug: "mayo", display: "mayo" },
  { num: 6, slug: "junio", display: "junio" },
  { num: 7, slug: "julio", display: "julio" },
  { num: 8, slug: "agosto", display: "agosto" },
  { num: 9, slug: "septiembre", display: "septiembre" },
  { num: 10, slug: "octubre", display: "octubre" },
  { num: 11, slug: "noviembre", display: "noviembre" },
  { num: 12, slug: "diciembre", display: "diciembre" },
];

export function findCity(slug: string): CitySlug | undefined {
  return SEO_CITIES.find((c) => c.slug === slug);
}

export function findOrigin(slug: string): { slug: string; display: string; iata: string } | undefined {
  return SEO_ORIGINS.find((o) => o.slug === slug);
}

export function findMonth(slug: string): { num: number; slug: string; display: string } | undefined {
  return MONTHS_ES.find((m) => m.slug === slug);
}

/**
 * Devuelve el copy "sweet spot" — si el mes pedido es el sweet spot de la
 * ciudad, devolvemos un texto positivo. Si no, comparamos.
 */
export function sweetSpotCopy(city: CitySlug, monthNum: number): string {
  if (monthNum === city.sweetSpot) {
    return `${MONTHS_ES[monthNum - 1].display} es el mes más barato para volar a ${city.display}. Aprovecha esta ventana.`;
  }
  const sweet = MONTHS_ES[city.sweetSpot - 1];
  return `${MONTHS_ES[monthNum - 1].display} no es el mes más barato — el sweet spot histórico es ${sweet.display}. Aun así hay deals si llegas el primero.`;
}
