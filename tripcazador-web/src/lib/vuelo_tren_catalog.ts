/**
 * vuelo_tren_catalog.ts — SSS428 (23 may 2026)
 *
 * Comparador avión vs tren (Renfe AVE / Iryo / Ouigo) para rutas
 * domésticas ES. Datos verificados may 2026.
 *
 * High-intent queries: "ave o avion madrid barcelona", "ave vs vuelo
 * sevilla madrid", "tren o avion para valencia". Tráfico mensual
 * estimado en miles para las top rutas.
 *
 * Source of truth para /vuelos-vs-tren y /vuelos-vs-tren/[ruta].
 */

export interface VueloTrenEntry {
  slug: string; // "madrid-barcelona"
  origin: string; // "Madrid"
  destination: string; // "Barcelona"
  emoji: string;

  /** Vuelos. */
  flight: {
    durationMin: number; // duración promedio vuelo
    fromAirport: string; // "MAD"
    toAirport: string; // "BCN"
    avgPriceEur: number;
    avgPriceLowCostEur: number;
    frequenciesPerDay: number;
    airlines: string[];
  };

  /** Tren AVE / alta velocidad. */
  train: {
    durationMin: number;
    fromStation: string; // "Madrid Puerta de Atocha"
    toStation: string; // "Barcelona Sants"
    avgPriceEur: number;
    avgPriceLowCostEur: number;
    frequenciesPerDay: number;
    operators: string[]; // ["Renfe AVE", "Iryo", "Ouigo"]
  };

  /** Cuál recomendamos por defecto + por qué. */
  recommendation: {
    winner: "train" | "flight" | "tie";
    reason: string;
  };

  /** Casos donde el otro modo es mejor. */
  caveats: string[];

  /** Tips cazador para esta ruta. */
  tips: string[];
}

export const VUELO_TREN_CATALOG: VueloTrenEntry[] = [
  {
    slug: "madrid-barcelona",
    origin: "Madrid",
    destination: "Barcelona",
    emoji: "🚆",
    flight: {
      durationMin: 75,
      fromAirport: "MAD",
      toAirport: "BCN",
      avgPriceEur: 70,
      avgPriceLowCostEur: 30,
      frequenciesPerDay: 25,
      airlines: ["Iberia", "Vueling", "Ryanair", "Air Europa"],
    },
    train: {
      durationMin: 150,
      fromStation: "Madrid Puerta de Atocha",
      toStation: "Barcelona Sants",
      avgPriceEur: 65,
      avgPriceLowCostEur: 35,
      frequenciesPerDay: 38,
      operators: ["Renfe AVE", "Iryo", "Ouigo"],
    },
    recommendation: {
      winner: "train",
      reason:
        "El AVE es centro-a-centro (Atocha → Sants, ambos plenamente integrados con metro), 2h30 vs vuelo 1h15 + ~2h aeropuerto. Suma final: tren 2h30, vuelo 4-5h door-to-door. Además: sin equipaje facturado, sin colas seguridad, asiento mesa y enchufe.",
    },
    caveats: [
      "Si llegas/sales en aeropuerto MAD/BCN con maleta facturada para conexión internacional, el vuelo combina mejor.",
      "Vuelo nocturno (red-eye) puede ser más barato si reservas con mucha antelación.",
    ],
    tips: [
      "Ouigo low-cost desde €9 — comprar 60+ días antes para mejores precios.",
      "AVE Renfe Avlo es la marca low-cost de Renfe — más barata, mismas vías.",
      "Reserva asientos 'cabina' (filas 1-2 de cada coche) si quieres trabajar tranquilo.",
    ],
  },
  {
    slug: "madrid-sevilla",
    origin: "Madrid",
    destination: "Sevilla",
    emoji: "🚆",
    flight: {
      durationMin: 75,
      fromAirport: "MAD",
      toAirport: "SVQ",
      avgPriceEur: 85,
      avgPriceLowCostEur: 40,
      frequenciesPerDay: 10,
      airlines: ["Iberia", "Vueling", "Ryanair"],
    },
    train: {
      durationMin: 155,
      fromStation: "Madrid Puerta de Atocha",
      toStation: "Sevilla Santa Justa",
      avgPriceEur: 70,
      avgPriceLowCostEur: 35,
      frequenciesPerDay: 22,
      operators: ["Renfe AVE", "Iryo", "Ouigo"],
    },
    recommendation: {
      winner: "train",
      reason:
        "Misma lógica que MAD-BCN: AVE 2h35 centro a centro vs vuelo door-to-door 4-5h. SVQ aeropuerto está a 35 min en bus del centro Sevilla — añade tiempo y coste. AVE imbatible.",
    },
    caveats: [
      "Pico Semana Santa / Feria abril: AVE se agota — comprar 3 meses antes.",
    ],
    tips: [
      "Iryo y Ouigo bajan precios AVE en últimos años — chequear los tres operadores.",
      "Atocha → Santa Justa es estación más bonita España (paseo gratis).",
    ],
  },
  {
    slug: "madrid-valencia",
    origin: "Madrid",
    destination: "Valencia",
    emoji: "🚆",
    flight: {
      durationMin: 60,
      fromAirport: "MAD",
      toAirport: "VLC",
      avgPriceEur: 75,
      avgPriceLowCostEur: 35,
      frequenciesPerDay: 6,
      airlines: ["Iberia", "Air Nostrum"],
    },
    train: {
      durationMin: 100,
      fromStation: "Madrid Puerta de Atocha",
      toStation: "Valencia Joaquín Sorolla",
      avgPriceEur: 50,
      avgPriceLowCostEur: 20,
      frequenciesPerDay: 17,
      operators: ["Renfe AVE", "Iryo", "Ouigo"],
    },
    recommendation: {
      winner: "train",
      reason:
        "AVE 1h40 centro a centro — el vuelo no compensa nada. Pocas frecuencias aéreas, AVE cada 30-40 min.",
    },
    caveats: [
      "Fallas (marzo) — AVE peta, reservar 4+ semanas antes.",
    ],
    tips: [
      "Ouigo Madrid-Valencia desde €9 con antelación.",
      "Iryo Comfort = misma calidad AVE Turista Plus a precio AVE Turista.",
    ],
  },
  {
    slug: "madrid-malaga",
    origin: "Madrid",
    destination: "Málaga",
    emoji: "🚆",
    flight: {
      durationMin: 75,
      fromAirport: "MAD",
      toAirport: "AGP",
      avgPriceEur: 85,
      avgPriceLowCostEur: 40,
      frequenciesPerDay: 8,
      airlines: ["Iberia", "Vueling", "Ryanair"],
    },
    train: {
      durationMin: 165,
      fromStation: "Madrid Puerta de Atocha",
      toStation: "Málaga María Zambrano",
      avgPriceEur: 80,
      avgPriceLowCostEur: 40,
      frequenciesPerDay: 14,
      operators: ["Renfe AVE", "Iryo"],
    },
    recommendation: {
      winner: "train",
      reason:
        "AVE 2h45 centro a centro vs avión door-to-door 4-5h. Si destino final es Costa del Sol (Marbella, Estepona), AVE+coche aún mejor.",
    },
    caveats: [
      "Vuelos pico verano (julio-agosto) competitivos con AVE en precio.",
    ],
    tips: [
      "AVE María Zambrano → Cercanías al aeropuerto (12 min) si conexión internacional desde AGP.",
      "Coche alquilado en estación María Zambrano = más barato que en aeropuerto AGP.",
    ],
  },
  {
    slug: "madrid-zaragoza",
    origin: "Madrid",
    destination: "Zaragoza",
    emoji: "🚆",
    flight: {
      durationMin: 55,
      fromAirport: "MAD",
      toAirport: "ZAZ",
      avgPriceEur: 90,
      avgPriceLowCostEur: 60,
      frequenciesPerDay: 2,
      airlines: ["Iberia", "Air Nostrum"],
    },
    train: {
      durationMin: 80,
      fromStation: "Madrid Puerta de Atocha",
      toStation: "Zaragoza Delicias",
      avgPriceEur: 40,
      avgPriceLowCostEur: 18,
      frequenciesPerDay: 20,
      operators: ["Renfe AVE", "Iryo", "Ouigo"],
    },
    recommendation: {
      winner: "train",
      reason:
        "AVE 1h20 a precio €18-40, vuelo muy infrecuente y caro. La ruta es 100% tren.",
    },
    caveats: [
      "Casi nadie vuela esta ruta — AVE imbatible.",
    ],
    tips: [
      "Avlo (low-cost AVE) Madrid-Zaragoza desde €9.",
      "Combina con AVE Zaragoza-Pamplona / Barcelona para multidestino tren.",
    ],
  },
  {
    slug: "madrid-alicante",
    origin: "Madrid",
    destination: "Alicante",
    emoji: "🚆",
    flight: {
      durationMin: 65,
      fromAirport: "MAD",
      toAirport: "ALC",
      avgPriceEur: 80,
      avgPriceLowCostEur: 30,
      frequenciesPerDay: 5,
      airlines: ["Iberia", "Vueling", "Ryanair"],
    },
    train: {
      durationMin: 130,
      fromStation: "Madrid Puerta de Atocha",
      toStation: "Alicante Terminal",
      avgPriceEur: 60,
      avgPriceLowCostEur: 25,
      frequenciesPerDay: 9,
      operators: ["Renfe AVE", "Iryo"],
    },
    recommendation: {
      winner: "train",
      reason:
        "AVE 2h10 centro a centro vs vuelo door-to-door 4h. Ganador claro tren.",
    },
    caveats: [
      "Pico verano vuelos low-cost a veces 25€ vs tren 40€ — comparar.",
    ],
    tips: [
      "Alicante Terminal está a 5 min andando del centro y a 10 min de la playa Postiguet.",
    ],
  },
  {
    slug: "barcelona-valencia",
    origin: "Barcelona",
    destination: "Valencia",
    emoji: "🚆",
    flight: {
      durationMin: 50,
      fromAirport: "BCN",
      toAirport: "VLC",
      avgPriceEur: 80,
      avgPriceLowCostEur: 30,
      frequenciesPerDay: 3,
      airlines: ["Vueling", "Iberia"],
    },
    train: {
      durationMin: 195,
      fromStation: "Barcelona Sants",
      toStation: "Valencia Joaquín Sorolla",
      avgPriceEur: 45,
      avgPriceLowCostEur: 20,
      frequenciesPerDay: 14,
      operators: ["Renfe Euromed/AVE"],
    },
    recommendation: {
      winner: "train",
      reason:
        "Euromed 3h15 centro a centro vs vuelo door-to-door 3h30-4h. Tren más cómodo y a veces más barato.",
    },
    caveats: [
      "Si llevas equipaje grande, el vuelo Vueling con maleta facturada puede igualar tiempo.",
    ],
    tips: [
      "Renfe Euromed es la marca Renfe para ruta mediterránea — comparar con bus ALSA si presupuesto extremo.",
    ],
  },
  {
    slug: "barcelona-sevilla",
    origin: "Barcelona",
    destination: "Sevilla",
    emoji: "✈️",
    flight: {
      durationMin: 105,
      fromAirport: "BCN",
      toAirport: "SVQ",
      avgPriceEur: 80,
      avgPriceLowCostEur: 35,
      frequenciesPerDay: 6,
      airlines: ["Vueling", "Iberia", "Ryanair"],
    },
    train: {
      durationMin: 330,
      fromStation: "Barcelona Sants",
      toStation: "Sevilla Santa Justa",
      avgPriceEur: 90,
      avgPriceLowCostEur: 45,
      frequenciesPerDay: 4,
      operators: ["Renfe AVE"],
    },
    recommendation: {
      winner: "flight",
      reason:
        "BCN-SVQ por tren es 5h30 con cambio típico en Madrid o Antequera. Vuelo door-to-door 3h30 con tarifa low-cost. El tren solo gana en confort si tienes tiempo.",
    },
    caveats: [
      "Renfe AVE directo BCN-SVQ (sin cambio) sólo 2 frecuencias/día — comprobar antes.",
    ],
    tips: [
      "Ryanair / Vueling tienen tarifas low-cost — más barato que tren incluido equipaje.",
      "Si quieres tren, mirar Iryo BCN-Madrid + Iryo Madrid-Sevilla por separado — combinación más barata a veces.",
    ],
  },
];

export const VUELO_TREN_BY_SLUG: Record<string, VueloTrenEntry> = Object.fromEntries(
  VUELO_TREN_CATALOG.map((e) => [e.slug, e]),
);

export const VUELO_TREN_SLUGS = VUELO_TREN_CATALOG.map((e) => e.slug);

export function getVueloTren(slug: string): VueloTrenEntry | null {
  return VUELO_TREN_BY_SLUG[slug] ?? null;
}

/** Helper: formatea duración en hh mm. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, "0")}min`;
}
