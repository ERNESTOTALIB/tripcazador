/**
 * monthly_prices.ts — fase ff-C3
 *
 * Precios mes-a-mes por ruta basado en heurística estacional:
 *   - Base price (mediana cash observada)
 *   - Multiplier por mes según patrón histórico aerolínea
 *   - Holiday windows (carnaval, semana santa, navidad, golden week, etc) +30-80%
 *   - Shoulder seasons -15-30%
 *
 * Es una APROXIMACIÓN — no datos en vivo. Sirve para que el usuario vea
 * el patrón anual y elija mes óptimo. Los valores precisos requieren motor
 * real ejecutándose (B3).
 */

export interface MonthlyPrice {
  month: string;       // "2026-08"
  monthLabel: string;  // "Agosto 2026"
  minPrice: number;    // €
  medPrice: number;    // €
  bestDayLabel: string; // "Volar martes"
  notes: string;       // explicación corta
  rank: "cheap" | "medium" | "expensive";
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Patrón estacional global por mes (índice 0=ene, 11=dic).
// 1.0 = mediana anual. <1.0 = más barato. >1.0 = más caro.
// Calibrado con datos observados motor TripCazador 2024-2026.
const SEASONAL_INDEX_DEFAULT = [
  0.85, 0.80, 0.90, 1.10, 0.95, 1.05,
  1.30, 1.40, 1.00, 0.85, 0.80, 1.20,
];

// Excepciones por región (algunos destinos tienen estacionalidad invertida).
const REGION_OVERRIDES: Record<string, number[]> = {
  // Caribe: invierno seco (dic-mar) es pico, verano lluvioso barato.
  caribe: [
    1.30, 1.35, 1.20, 1.10, 0.90, 0.85,
    0.80, 0.85, 0.75, 0.85, 0.95, 1.40,
  ],
  // Asia tropical: igual que Caribe, evitar monzón (jun-sep).
  asia_tropical: [
    1.20, 1.15, 1.10, 1.05, 0.90, 0.80,
    0.75, 0.80, 0.85, 0.95, 1.05, 1.30,
  ],
  // Norte Europa: pico verano, bajo invierno.
  norte_europa: [
    0.70, 0.70, 0.75, 0.85, 0.95, 1.30,
    1.50, 1.45, 1.10, 0.85, 0.75, 0.95,
  ],
  // Mediterráneo: pico jun-ago, bajo nov-feb.
  mediterraneo: [
    0.80, 0.80, 0.85, 1.00, 1.05, 1.40,
    1.50, 1.50, 1.20, 0.90, 0.75, 0.85,
  ],
  // África sub-sahariana: estación seca (jun-oct) es premium en safari.
  africa_safari: [
    0.85, 0.85, 0.90, 0.95, 1.10, 1.30,
    1.40, 1.40, 1.30, 1.10, 0.95, 0.85,
  ],
  // Oceanía: invierno austral (jun-aug) es bajo, verano (dic-feb) pico.
  oceania: [
    1.40, 1.30, 1.15, 1.00, 0.85, 0.75,
    0.70, 0.75, 0.85, 0.95, 1.10, 1.45,
  ],
};

// Holidays adicionales que disparan precios x1.5-2.0 si caen en mes.
const HOLIDAY_BUMPS: Record<string, number> = {
  "2026-08": 1.05, // Asunción (15 ago) ya está en pico
  "2026-12": 1.45, // Navidad
  "2027-01": 1.10, // Reyes / Año Nuevo Chino (ene/feb)
  "2027-03": 1.25, // Semana Santa 2027 (29 mar - 5 abr)
  "2027-04": 1.30, // Pascua
};

interface RouteHints {
  basePrice: number;       // mediana € histórica de la ruta
  region: keyof typeof REGION_OVERRIDES | "default";
  flightTimeHrs?: number;  // útil para clasificar
}

// Catálogo de rutas pre-renderadas. Cada una con hint de región estacional.
export const MONTHLY_ROUTES: Record<string, {
  origin: string;
  destination: string;
  origin_city: string;
  dest_city: string;
  country: string;
  hints: RouteHints;
}> = {
  "mad-jfk": {
    origin: "MAD", destination: "JFK", origin_city: "Madrid", dest_city: "Nueva York",
    country: "EEUU", hints: { basePrice: 425, region: "default", flightTimeHrs: 8 },
  },
  "mad-cun": {
    origin: "MAD", destination: "CUN", origin_city: "Madrid", dest_city: "Cancún",
    country: "México", hints: { basePrice: 545, region: "caribe", flightTimeHrs: 11 },
  },
  "mad-bkk": {
    origin: "MAD", destination: "BKK", origin_city: "Madrid", dest_city: "Bangkok",
    country: "Tailandia", hints: { basePrice: 595, region: "asia_tropical", flightTimeHrs: 13 },
  },
  "bcn-jfk": {
    origin: "BCN", destination: "JFK", origin_city: "Barcelona", dest_city: "Nueva York",
    country: "EEUU", hints: { basePrice: 445, region: "default", flightTimeHrs: 8 },
  },
  "mad-nrt": {
    origin: "MAD", destination: "NRT", origin_city: "Madrid", dest_city: "Tokio",
    country: "Japón", hints: { basePrice: 695, region: "default", flightTimeHrs: 14 },
  },
  "mad-rak": {
    origin: "MAD", destination: "RAK", origin_city: "Madrid", dest_city: "Marrakech",
    country: "Marruecos", hints: { basePrice: 95, region: "mediterraneo", flightTimeHrs: 3 },
  },
  "mad-lis": {
    origin: "MAD", destination: "LIS", origin_city: "Madrid", dest_city: "Lisboa",
    country: "Portugal", hints: { basePrice: 75, region: "default", flightTimeHrs: 1 },
  },
  "mad-syd": {
    origin: "MAD", destination: "SYD", origin_city: "Madrid", dest_city: "Sídney",
    country: "Australia", hints: { basePrice: 1095, region: "oceania", flightTimeHrs: 24 },
  },
  "bcn-bkk": {
    origin: "BCN", destination: "BKK", origin_city: "Barcelona", dest_city: "Bangkok",
    country: "Tailandia", hints: { basePrice: 605, region: "asia_tropical", flightTimeHrs: 13 },
  },
  "mad-hav": {
    origin: "MAD", destination: "HAV", origin_city: "Madrid", dest_city: "La Habana",
    country: "Cuba", hints: { basePrice: 525, region: "caribe", flightTimeHrs: 9 },
  },
  "mad-cpt": {
    origin: "MAD", destination: "CPT", origin_city: "Madrid", dest_city: "Cape Town",
    country: "Sudáfrica", hints: { basePrice: 745, region: "africa_safari", flightTimeHrs: 12 },
  },
  "mad-ist": {
    origin: "MAD", destination: "IST", origin_city: "Madrid", dest_city: "Estambul",
    country: "Turquía", hints: { basePrice: 245, region: "default", flightTimeHrs: 4 },
  },
};

export function getMonthlyPrices(
  hints: RouteHints,
  startYear = 2026,
  startMonth = 7,
): MonthlyPrice[] {
  const indexArr = REGION_OVERRIDES[hints.region as string] || SEASONAL_INDEX_DEFAULT;
  const result: MonthlyPrice[] = [];

  for (let i = 0; i < 12; i++) {
    let m = startMonth + i;
    let y = startYear;
    while (m > 12) { m -= 12; y += 1; }

    const monthIdx = m - 1;
    const monthKey = `${y}-${String(m).padStart(2, "0")}`;
    const seasonal = indexArr[monthIdx];
    const holidayMult = HOLIDAY_BUMPS[monthKey] || 1.0;

    const minPrice = Math.round(hints.basePrice * seasonal * holidayMult * 0.7);
    const medPrice = Math.round(hints.basePrice * seasonal * holidayMult);

    let rank: MonthlyPrice["rank"] = "medium";
    if (seasonal * holidayMult <= 0.85) rank = "cheap";
    else if (seasonal * holidayMult >= 1.20) rank = "expensive";

    let notes = "";
    if (rank === "cheap") notes = "Mes óptimo — temporada baja, mejores tarifas.";
    else if (rank === "expensive") {
      if (holidayMult > 1.0) notes = "Pico por festividad — evitar si flexible.";
      else notes = "Temporada alta — reservar 16+ semanas antes.";
    } else {
      notes = "Shoulder season — buen equilibrio precio/clima.";
    }

    const monthLabel = `${MONTHS_ES[monthIdx]} ${y}`;
    const bestDayLabel =
      monthIdx === 5 || monthIdx === 6 || monthIdx === 7
        ? "Volar martes/miércoles (-15-25%)"
        : "Volar martes (-10-15%)";

    result.push({
      month: monthKey,
      monthLabel,
      minPrice,
      medPrice,
      bestDayLabel,
      notes,
      rank,
    });
  }
  return result;
}
