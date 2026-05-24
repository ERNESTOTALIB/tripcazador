/**
 * mct_data.ts — SUPER-1D (24 may 2026)
 *
 * Minimum Connecting Time data por aeropuerto + tipo conexión.
 * Datos basados en OAG/IATA official MCT 2024-2026. Tiempo MÍNIMO
 * publicado por aerolínea — añade 30-60min de margen real recomendado.
 */

export interface MCTEntry {
  iata: string;
  city: string;
  emoji: string;
  // MCT en minutos para distintos escenarios
  domesticDomestic: number; // doméstico → doméstico
  domesticInternational: number;
  internationalInternational: number;
  internationalDomestic: number;
  notes: string;
  warningCase?: string; // cuándo el MCT es engañoso
}

export const MCT_AIRPORTS: MCTEntry[] = [
  {
    iata: "MAD",
    city: "Madrid Barajas",
    emoji: "🇪🇸",
    domesticDomestic: 45,
    domesticInternational: 60,
    internationalInternational: 60,
    internationalDomestic: 60,
    notes: "T4 (Iberia/oneworld) ↔ T4S (long-haul) bus 8min. T1/T2/T3 (otras low-cost) sin acceso airside a T4.",
    warningCase: "T1 (Ryanair) ↔ T4 = NO conexión directa. Pasas migración + reclamas equipaje + re-checkeas. Mín 3h real.",
  },
  {
    iata: "BCN",
    city: "Barcelona El Prat",
    emoji: "🇪🇸",
    domesticDomestic: 40,
    domesticInternational: 50,
    internationalInternational: 60,
    internationalDomestic: 60,
    notes: "T1 hub Vueling (terminal moderna). T2 (low-cost terceros) más limitada. Bus entre T1 y T2.",
    warningCase: "T2A/B/C son tres sub-terminals — confirma desde cuál sale antes de comprar conexión.",
  },
  {
    iata: "AMS",
    city: "Ámsterdam Schiphol",
    emoji: "🇳🇱",
    domesticDomestic: 40,
    domesticInternational: 50,
    internationalInternational: 50,
    internationalDomestic: 50,
    notes: "Schiphol = single terminal, hub KLM eficiente. MCT 50min es realista incluso con controles fronterizos.",
    warningCase: "Schengen ↔ non-Schengen requiere paso por inmigración. Añade 15min al MCT publicado.",
  },
  {
    iata: "LHR",
    city: "Londres Heathrow",
    emoji: "🇬🇧",
    domesticDomestic: 60,
    domesticInternational: 75,
    internationalInternational: 90,
    internationalDomestic: 75,
    notes: "5 terminales. T5 (BA hub), T2 (Star Alliance), T3 (other oneworld), T4 (SkyTeam). Train entre T1-3 y T5.",
    warningCase: "T5 ↔ T3 con cambio de operador = 90min mínimos real. T5 → T5 (BA solo) = 60min OK.",
  },
  {
    iata: "CDG",
    city: "París Charles de Gaulle",
    emoji: "🇫🇷",
    domesticDomestic: 60,
    domesticInternational: 75,
    internationalInternational: 75,
    internationalDomestic: 75,
    notes: "T2 hub Air France (sub-terminals A-F + 2G). Train CDGVAL entre T1/T2/T3. T1 estrella obsoleta, controles caos.",
    warningCase: "T1 ↔ T2 requiere 60+ min real. T2E ↔ T2F (AF a sí misma) puede ser 35min en práctica.",
  },
  {
    iata: "FRA",
    city: "Frankfurt am Main",
    emoji: "🇩🇪",
    domesticDomestic: 45,
    domesticInternational: 60,
    internationalInternational: 45,
    internationalDomestic: 60,
    notes: "Hub Lufthansa eficiente. T1 (LH/Star Alliance), T2 (otros). SkyLine train entre los dos terminales.",
    warningCase: "T1 a T2 con equipaje facturado intermedio = 75min para estar seguro.",
  },
  {
    iata: "JFK",
    city: "Nueva York JFK",
    emoji: "🇺🇸",
    domesticDomestic: 60,
    domesticInternational: 90,
    internationalInternational: 120,
    internationalDomestic: 120,
    notes: "8 terminales separados. AirTrain conecta todos. T4 (Delta), T8 (American), T7 (BA + others).",
    warningCase: "International → Domestic requiere recoger equipaje + customs + re-check. 2h MÍNIMOS real.",
  },
  {
    iata: "NRT",
    city: "Tokio Narita",
    emoji: "🇯🇵",
    domesticDomestic: 60,
    domesticInternational: 90,
    internationalInternational: 75,
    internationalDomestic: 90,
    notes: "3 terminales. T1 (Star + SkyTeam), T2 (oneworld), T3 (LCC). Bus shuttle entre terminales.",
    warningCase: "Inter-terminal T1 ↔ T3 con equipaje = 90min. Aeropuerto fuera de Tokio (60km, hora train).",
  },
  {
    iata: "DXB",
    city: "Dubái International",
    emoji: "🇦🇪",
    domesticDomestic: 45,
    domesticInternational: 60,
    internationalInternational: 75,
    internationalDomestic: 60,
    notes: "Hub Emirates T3 megalítico. T1/T2 más pequeños (otros). Tren entre T1 y T3.",
    warningCase: "T3 ↔ T1 = 60min mínimo. Inside T3 (todo EK) = 45min OK.",
  },
  {
    iata: "IST",
    city: "Estambul Aeropuerto",
    emoji: "🇹🇷",
    domesticDomestic: 45,
    domesticInternational: 60,
    internationalInternational: 60,
    internationalDomestic: 60,
    notes: "Single terminal masivo (nuevo desde 2019). Hub Turkish Airlines. Distancias caminadas grandes.",
    warningCase: "Inter-Schengen via IST requiere TR transit visa. Verifica antes.",
  },
  {
    iata: "SIN",
    city: "Singapur Changi",
    emoji: "🇸🇬",
    domesticDomestic: 45,
    domesticInternational: 45,
    internationalInternational: 45,
    internationalDomestic: 45,
    notes: "4 terminales conectados por SkyTrain. Aeropuerto top del mundo (rapidez + servicios). MCT real funciona.",
    warningCase: "Sin warnings — Changi rara vez decepciona.",
  },
  {
    iata: "DOH",
    city: "Doha Hamad",
    emoji: "🇶🇦",
    domesticDomestic: 50,
    domesticInternational: 60,
    internationalInternational: 60,
    internationalDomestic: 60,
    notes: "Single terminal hub Qatar Airways. Diseñado para conexiones eficientes.",
    warningCase: "Conexiones inter-cabina (premium ↔ economy) usan controles distintos — confirmar.",
  },
];

export const MCT_IATAS: string[] = MCT_AIRPORTS.map((m) => m.iata);

export function getMCT(iata: string): MCTEntry | undefined {
  return MCT_AIRPORTS.find((m) => m.iata.toUpperCase() === iata.toUpperCase());
}

/**
 * Calcula MCT recomendado por escenario, añadiendo buffer de seguridad.
 */
export function recommendedMCT(
  entry: MCTEntry,
  scenario: "dd" | "di" | "ii" | "id",
): { mct: number; recommended: number; buffer: number } {
  const mct =
    scenario === "dd" ? entry.domesticDomestic
    : scenario === "di" ? entry.domesticInternational
    : scenario === "ii" ? entry.internationalInternational
    : entry.internationalDomestic;
  // Buffer recomendado: 30min para hubs eficientes, 60min para aeropuertos complejos
  const buffer = mct >= 75 ? 60 : 30;
  return { mct, recommended: mct + buffer, buffer };
}
