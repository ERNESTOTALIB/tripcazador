/**
 * flag_carriers_catalog.ts — SSS449 (23 may 2026)
 *
 * Aerolíneas bandera (flag carriers) por país. Útil para viajeros
 * que quieren saber qué aerolínea histórica representa cada país.
 *
 * SEO: "aerolinea bandera francia", "compania bandera japon",
 * "iberia aerolinea bandera españa".
 *
 * 20 países top destinos viajeros ES.
 */

export interface FlagCarrierEntry {
  iso: string; // ISO 3166-1 alpha-2 lowercase
  country: string;
  emoji: string;
  /** Aerolínea principal (flag carrier histórica). */
  primary: { name: string; iata: string; hub: string };
  /** Otras importantes (legacy o de impacto). */
  secondary: Array<{ name: string; iata: string; hub: string }>;
  /** Alianza global de la primaria (oneworld / star / skyteam). */
  alliance?: "oneworld" | "star" | "skyteam" | "none";
  /** Notas relevantes. */
  notes: string;
}

export const FLAG_CARRIERS_CATALOG: FlagCarrierEntry[] = [
  {
    iso: "es",
    country: "España",
    emoji: "🇪🇸",
    primary: { name: "Iberia", iata: "IB", hub: "Madrid (MAD T4)" },
    secondary: [
      { name: "Vueling", iata: "VY", hub: "Barcelona (BCN T1)" },
      { name: "Air Europa", iata: "UX", hub: "Madrid (MAD)" },
    ],
    alliance: "oneworld",
    notes: "Iberia es el flag carrier histórico desde 1927. Vueling es subsidiaria IAG (mismo grupo). Air Europa parte de SkyTeam.",
  },
  {
    iso: "fr",
    country: "Francia",
    emoji: "🇫🇷",
    primary: { name: "Air France", iata: "AF", hub: "París CDG" },
    secondary: [
      { name: "Transavia France", iata: "TO", hub: "París ORY" },
    ],
    alliance: "skyteam",
    notes: "Air France fusionada con KLM (SkyTeam). Transavia es subsidiaria low-cost del grupo.",
  },
  {
    iso: "de",
    country: "Alemania",
    emoji: "🇩🇪",
    primary: { name: "Lufthansa", iata: "LH", hub: "Fráncfort (FRA)" },
    secondary: [
      { name: "Eurowings", iata: "EW", hub: "Düsseldorf (DUS)" },
      { name: "Condor", iata: "DE", hub: "Fráncfort (FRA)" },
    ],
    alliance: "star",
    notes: "Lufthansa funda Star Alliance. Eurowings es low-cost subsidiaria. Condor es independiente desde 2021.",
  },
  {
    iso: "gb",
    country: "Reino Unido",
    emoji: "🇬🇧",
    primary: { name: "British Airways", iata: "BA", hub: "Londres Heathrow (LHR T5)" },
    secondary: [
      { name: "Virgin Atlantic", iata: "VS", hub: "Londres Heathrow (LHR T3)" },
      { name: "easyJet", iata: "U2", hub: "Londres Luton (LTN)" },
    ],
    alliance: "oneworld",
    notes: "BA es parte de IAG (mismo grupo Iberia). Virgin Atlantic SkyTeam asociada.",
  },
  {
    iso: "it",
    country: "Italia",
    emoji: "🇮🇹",
    primary: { name: "ITA Airways", iata: "AZ", hub: "Roma FCO" },
    secondary: [
      { name: "Neos", iata: "NO", hub: "Milán Malpensa (MXP)" },
    ],
    alliance: "skyteam",
    notes: "ITA Airways reemplazó Alitalia en 2021. Lufthansa Group adquirió 41% en 2024.",
  },
  {
    iso: "nl",
    country: "Países Bajos",
    emoji: "🇳🇱",
    primary: { name: "KLM", iata: "KL", hub: "Ámsterdam Schiphol (AMS)" },
    secondary: [
      { name: "Transavia", iata: "HV", hub: "Ámsterdam (AMS)" },
    ],
    alliance: "skyteam",
    notes: "KLM = aerolínea civil más antigua del mundo (1919). Fusionada con Air France.",
  },
  {
    iso: "pt",
    country: "Portugal",
    emoji: "🇵🇹",
    primary: { name: "TAP Air Portugal", iata: "TP", hub: "Lisboa (LIS)" },
    secondary: [],
    alliance: "star",
    notes: "TAP es la opción imbatible para vuelos Europa-Sudamérica con stopover gratis en Lisboa o Oporto.",
  },
  {
    iso: "tr",
    country: "Turquía",
    emoji: "🇹🇷",
    primary: { name: "Turkish Airlines", iata: "TK", hub: "Estambul (IST)" },
    secondary: [
      { name: "Pegasus", iata: "PC", hub: "Estambul Sabiha Gökçen (SAW)" },
    ],
    alliance: "star",
    notes: "Turkish vuela a más países que cualquier otra (130+). Free stopover Istanbul disponible.",
  },
  {
    iso: "ae",
    country: "Emiratos Árabes Unidos",
    emoji: "🇦🇪",
    primary: { name: "Emirates", iata: "EK", hub: "Dubái (DXB T3)" },
    secondary: [
      { name: "Etihad", iata: "EY", hub: "Abu Dabi (AUH)" },
      { name: "FlyDubai", iata: "FZ", hub: "Dubái (DXB T2)" },
    ],
    alliance: "none",
    notes: "Emirates no está en alianza global. Etihad es bandera de Abu Dabi (separada de Dubái).",
  },
  {
    iso: "qa",
    country: "Qatar",
    emoji: "🇶🇦",
    primary: { name: "Qatar Airways", iata: "QR", hub: "Doha (DOH)" },
    secondary: [],
    alliance: "oneworld",
    notes: "Premiada repetidamente como mejor aerolínea del mundo. Programa Discover Qatar con stopover hotel gratis.",
  },
  {
    iso: "jp",
    country: "Japón",
    emoji: "🇯🇵",
    primary: { name: "Japan Airlines", iata: "JL", hub: "Tokio Haneda (HND)" },
    secondary: [
      { name: "ANA", iata: "NH", hub: "Tokio Narita (NRT)" },
    ],
    alliance: "oneworld",
    notes: "JAL es oneworld (con BA/Iberia). ANA es Star Alliance (con Lufthansa). Dos flag carriers conviven.",
  },
  {
    iso: "kr",
    country: "Corea del Sur",
    emoji: "🇰🇷",
    primary: { name: "Korean Air", iata: "KE", hub: "Seúl Incheon (ICN T2)" },
    secondary: [
      { name: "Asiana", iata: "OZ", hub: "Seúl Incheon (ICN T1)" },
    ],
    alliance: "skyteam",
    notes: "Korean Air anunció merger con Asiana en 2024. La fusión sigue en proceso regulatorio.",
  },
  {
    iso: "cn",
    country: "China",
    emoji: "🇨🇳",
    primary: { name: "Air China", iata: "CA", hub: "Pekín (PEK / PKX)" },
    secondary: [
      { name: "China Eastern", iata: "MU", hub: "Shanghái (PVG)" },
      { name: "China Southern", iata: "CZ", hub: "Cantón (CAN)" },
    ],
    alliance: "star",
    notes: "Tres flag carriers chinos por región. Air China = norte. China Eastern = este. China Southern = sur.",
  },
  {
    iso: "sg",
    country: "Singapur",
    emoji: "🇸🇬",
    primary: { name: "Singapore Airlines", iata: "SQ", hub: "Changi (SIN)" },
    secondary: [
      { name: "Scoot", iata: "TR", hub: "Changi (SIN)" },
    ],
    alliance: "star",
    notes: "Singapore Airlines = referencia mundial en servicio premium. Scoot es low-cost subsidiaria.",
  },
  {
    iso: "th",
    country: "Tailandia",
    emoji: "🇹🇭",
    primary: { name: "Thai Airways", iata: "TG", hub: "Bangkok (BKK)" },
    secondary: [
      { name: "Bangkok Airways", iata: "PG", hub: "Bangkok (BKK)" },
    ],
    alliance: "star",
    notes: "Thai Airways en reestructuración 2020-2024 tras quiebra COVID. Star Alliance asociada.",
  },
  {
    iso: "in",
    country: "India",
    emoji: "🇮🇳",
    primary: { name: "Air India", iata: "AI", hub: "Delhi (DEL)" },
    secondary: [
      { name: "IndiGo", iata: "6E", hub: "Delhi (DEL)" },
      { name: "Vistara", iata: "UK", hub: "Delhi (DEL)" },
    ],
    alliance: "star",
    notes: "Air India privatizada en 2022 (Tata Group). Fusión con Vistara (Singapore Airlines) anunciada.",
  },
  {
    iso: "us",
    country: "Estados Unidos",
    emoji: "🇺🇸",
    primary: { name: "American Airlines", iata: "AA", hub: "Dallas-Fort Worth (DFW)" },
    secondary: [
      { name: "Delta", iata: "DL", hub: "Atlanta (ATL)" },
      { name: "United", iata: "UA", hub: "Chicago O'Hare (ORD)" },
    ],
    alliance: "oneworld",
    notes: "USA no tiene flag carrier oficial — los 3 Big Three (AA/DL/UA) compiten. Cada uno lidera una alianza global distinta.",
  },
  {
    iso: "ar",
    country: "Argentina",
    emoji: "🇦🇷",
    primary: { name: "Aerolíneas Argentinas", iata: "AR", hub: "Buenos Aires Ezeiza (EZE)" },
    secondary: [
      { name: "Flybondi", iata: "FO", hub: "Buenos Aires (EZE/AEP)" },
    ],
    alliance: "skyteam",
    notes: "Aerolíneas Argentinas reestatalizada en 2021. Flybondi es low-cost emergente.",
  },
  {
    iso: "br",
    country: "Brasil",
    emoji: "🇧🇷",
    primary: { name: "LATAM Brasil", iata: "LA", hub: "São Paulo Guarulhos (GRU)" },
    secondary: [
      { name: "Gol", iata: "G3", hub: "São Paulo (GRU)" },
      { name: "Azul", iata: "AD", hub: "Campinas (VCP)" },
    ],
    alliance: "oneworld",
    notes: "LATAM (fusión LAN+TAM) es la mayor de Latam. Salida oneworld 2020, retorno 2024.",
  },
  {
    iso: "au",
    country: "Australia",
    emoji: "🇦🇺",
    primary: { name: "Qantas", iata: "QF", hub: "Sídney (SYD)" },
    secondary: [
      { name: "Jetstar", iata: "JQ", hub: "Melbourne (MEL)" },
      { name: "Virgin Australia", iata: "VA", hub: "Brisbane (BNE)" },
    ],
    alliance: "oneworld",
    notes: "Qantas es la aerolínea civil con menos accidentes fatales del mundo (1951 último).",
  },
];

export const FLAG_CARRIERS_BY_ISO: Record<string, FlagCarrierEntry> = Object.fromEntries(
  FLAG_CARRIERS_CATALOG.map((c) => [c.iso, c]),
);

export const FLAG_CARRIERS_ISOS = FLAG_CARRIERS_CATALOG.map((c) => c.iso);

export function getFlagCarriers(iso: string): FlagCarrierEntry | null {
  return FLAG_CARRIERS_BY_ISO[iso.toLowerCase()] ?? null;
}
