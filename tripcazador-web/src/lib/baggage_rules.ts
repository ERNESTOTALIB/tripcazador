/**
 * baggage_rules.ts — SSS289 (17 may 2026)
 *
 * Reglas de equipaje por aerolínea para landings SEO /equipaje/[aerolinea].
 *
 * High-intent query: "ryanair equipaje de mano dimensiones" ~50k búsquedas/mes ES.
 * Cada aerolínea tiene reglas distintas, sanciones distintas, dimensiones distintas.
 *
 * Datos verificados mayo 2026 — reglas pueden cambiar, marcar lastUpdated.
 */

export interface BaggageRule {
  /** IATA code aerolínea. */
  code: string;
  /** Nombre comercial. */
  name: string;
  /** Slug URL-safe. */
  slug: string;
  emoji: string;
  /** Última actualización (verify quarterly). */
  lastUpdated: string;

  /** Equipaje de mano básico (incluido en tarifa más baja). */
  personalItem: {
    name: string;
    dimensions: string; // "40 × 20 × 25 cm"
    weight?: string;
    free: boolean;
  };
  /** Equipaje cabina (overhead bin) — extra fee en low-cost. */
  cabin: {
    dimensions: string;
    weight: string;
    feeFromEur: number; // 0 = incluido, >0 = extra
    feeNote: string;
  };
  /** Equipaje facturado. */
  checked: {
    weight: string;
    feeFromEur: number;
    feeNote: string;
  };
  /** Sanciones por exceder dimensiones en gate. */
  gateFine: {
    amountEur: number;
    description: string;
  };
  /** Tips cazador específicos de esta aerolínea. */
  tips: string[];
  /** Comparativa breve vs competencia. */
  comparison: string;
}

export const BAGGAGE_RULES: BaggageRule[] = [
  {
    code: "FR",
    name: "Ryanair",
    slug: "ryanair",
    emoji: "🟦",
    lastUpdated: "2026-05",
    personalItem: {
      name: "Bolso pequeño (1 bulto)",
      dimensions: "40 × 20 × 25 cm",
      free: true,
    },
    cabin: {
      dimensions: "55 × 40 × 20 cm",
      weight: "10 kg",
      feeFromEur: 8,
      feeNote: "€8-30 si añades Priority Boarding (incluye 2 bultos). Sin Priority, no puedes subir el trolley a cabina.",
    },
    checked: {
      weight: "20 kg",
      feeFromEur: 25,
      feeNote: "€25-60 según ruta y antelación. Maletas 10kg/20kg/26kg disponibles.",
    },
    gateFine: {
      amountEur: 75,
      description: "Si tu bolso supera 40×20×25 en el gate, Ryanair te lo factura por €75 obligatorio. Las medidas se verifican estrictamente, no por confianza.",
    },
    tips: [
      "El measure-bag del gate es 40×20×25 exacto — si tu bolso no entra apretándolo, paga gate fee €75",
      "Priority Boarding €8-12 vale la pena si llevas 2 bultos o trolley con cosas frágiles",
      "Lleva la documentación importante en bolsillo, no en el bolso (por si te lo facturan en gate)",
      "Carros 'expandibles' suelen NO entrar en el measure-bag — comprueba el bolso lleno antes de salir",
      "Mochila de senderismo 40L típica entra justo — verificar dimensiones EXACTAS antes",
    ],
    comparison:
      "Ryanair es la aerolínea más estricta de Europa en cumplimiento de equipaje. Su bolso pequeño es el más restrictivo (40×20×25). Vueling, easyJet y Wizz permiten 40×30×20 o similar (más generoso ancho).",
  },
  {
    code: "VY",
    name: "Vueling",
    slug: "vueling",
    emoji: "🟡",
    lastUpdated: "2026-05",
    personalItem: {
      name: "Bolso pequeño + complemento",
      dimensions: "40 × 20 × 30 cm",
      free: true,
    },
    cabin: {
      dimensions: "55 × 40 × 20 cm",
      weight: "10 kg",
      feeFromEur: 10,
      feeNote: "Incluido en tarifa Optima y Family. €10-25 en Basic.",
    },
    checked: {
      weight: "23 kg",
      feeFromEur: 20,
      feeNote: "€20-45 según ruta/antelación. Incluido en tarifas Family y TimeFlex.",
    },
    gateFine: {
      amountEur: 50,
      description: "€50 si tu bolso excede 40×20×30 al embarque. Menos punitivo que Ryanair, pero igualmente caro.",
    },
    tips: [
      "Bolso pequeño Vueling permite 30cm de profundidad (vs 25cm Ryanair) — caben mochilas tipo daypack",
      "Tarifa Optima incluye trolley + asiento elegido — €15-25 extra sobre Basic, suele compensar",
      "Iberia Plus acumula Avios en Vueling — útil para frequent flyers",
      "Bolsa portátil para portátiles (laptop bag) cuenta como complemento (sumar al bolso pequeño)",
    ],
    comparison:
      "Vueling es más permisiva que Ryanair en equipaje (bolso pequeño 30cm profundidad vs 25cm). Iberia tarifa básica incluye cabina, Vueling Basic no.",
  },
  {
    code: "U2",
    name: "easyJet",
    slug: "easyjet",
    emoji: "🟧",
    lastUpdated: "2026-05",
    personalItem: {
      name: "Bolso pequeño bajo el asiento",
      dimensions: "45 × 36 × 20 cm",
      weight: "15 kg",
      free: true,
    },
    cabin: {
      dimensions: "56 × 45 × 25 cm",
      weight: "15 kg",
      feeFromEur: 8,
      feeNote: "Incluido en Up Front + Extra Legroom seats. €8-12 con seat upfront. Hands Free service €4 (te lo guardan en bodega gratis si solo llevas bolso pequeño).",
    },
    checked: {
      weight: "23 kg",
      feeFromEur: 22,
      feeNote: "€22-50 según ruta. Maletas 15kg, 23kg, 32kg disponibles.",
    },
    gateFine: {
      amountEur: 48,
      description: "£48/€48 si exceden dimensiones. Menos estricto que Ryanair en verificación, pero el measure-bag existe.",
    },
    tips: [
      "easyJet permite bolso pequeño 45×36×20 (más generoso que Ryanair y Vueling)",
      "Hands Free service €4 = facturan tu trolley gratis al check-in si solo llevas bolso pequeño",
      "Up Front seats (filas 1-3) incluyen trolley + boarding prioritario por €15-20",
      "Easyjet plus card €244/año incluye trolley + speedy boarding en todos los vuelos",
    ],
    comparison:
      "easyJet es la más generosa en bolso pequeño (45×36×20) vs Ryanair (40×20×25) y Vueling (40×20×30). Su Hands Free service es único: te facturan trolley gratis si llevas solo bolso pequeño.",
  },
  {
    code: "IB",
    name: "Iberia",
    slug: "iberia",
    emoji: "🟥",
    lastUpdated: "2026-05",
    personalItem: {
      name: "Bolso pequeño",
      dimensions: "40 × 30 × 15 cm",
      free: true,
    },
    cabin: {
      dimensions: "56 × 40 × 25 cm",
      weight: "10 kg",
      feeFromEur: 0,
      feeNote: "Incluido en TODAS las tarifas (incluso Basic). Iberia mantiene el equipaje cabina gratis en europea y largo radio.",
    },
    checked: {
      weight: "23 kg",
      feeFromEur: 0,
      feeNote: "Incluido en tarifas Plus, Comfort, Flex. €25-40 en tarifa Basic europea.",
    },
    gateFine: {
      amountEur: 0,
      description: "Iberia no aplica gate fines típicamente — son flexibles con dimensiones ligeramente excedidas. Política mucho menos punitiva que low-cost.",
    },
    tips: [
      "Iberia Basic incluye trolley cabina — no necesitas pagar extra como en Ryanair",
      "Programa Iberia Plus acumula Avios — vale la pena registrarse antes del vuelo",
      "Para conexiones largo radio, equipaje facturado se traslada automáticamente",
      "Iberia Express (subsidiaria) tiene reglas idénticas para vuelos europeos",
    ],
    comparison:
      "Iberia es la full-service más generosa con equipaje cabina (incluido siempre). En largo radio Plus tarifa incluye 2 maletas 23kg facturadas (Vueling te cobra cada una).",
  },
  {
    code: "W6",
    name: "Wizz Air",
    slug: "wizz",
    emoji: "🟣",
    lastUpdated: "2026-05",
    personalItem: {
      name: "Bolso pequeño",
      dimensions: "40 × 30 × 20 cm",
      free: true,
    },
    cabin: {
      dimensions: "55 × 40 × 23 cm",
      weight: "10 kg",
      feeFromEur: 10,
      feeNote: "Wizz Priority €10-20 incluye trolley cabina + 2 bultos.",
    },
    checked: {
      weight: "32 kg",
      feeFromEur: 22,
      feeNote: "Maletas 10/20/26/32 kg disponibles. €22-50 según ruta y antelación.",
    },
    gateFine: {
      amountEur: 80,
      description: "€80 si excedes dimensiones bolso pequeño en gate. Política tan estricta como Ryanair.",
    },
    tips: [
      "Wizz Priority €10-20 vale la pena si llevas trolley — sin él te lo facturarán en gate por €80",
      "Wizz permite maletas hasta 32kg (más que Ryanair 20kg y easyJet 23kg) — útil para mudanzas",
      "El measure-bag de Wizz es estricto, igual que Ryanair: 40×30×20 exacto",
      "Vuelos desde España hacia Polonia/Hungría suelen estar saturados — early boarding ayuda",
    ],
    comparison:
      "Wizz Air es similar a Ryanair en estrictez de equipaje pero permite bolsos pequeños un poco más altos (20cm profundidad vs 25cm — espera ya 30cm Wizz Air vs Ryanair 25cm bag deeper).",
  },
  {
    code: "LH",
    name: "Lufthansa",
    slug: "lufthansa",
    emoji: "🟦",
    lastUpdated: "2026-05",
    personalItem: {
      name: "Bolso pequeño",
      dimensions: "40 × 30 × 10 cm",
      free: true,
    },
    cabin: {
      dimensions: "55 × 40 × 23 cm",
      weight: "8 kg",
      feeFromEur: 0,
      feeNote: "Incluido en TODAS las tarifas Economy Light, Classic, Flex y Business. Lufthansa no cobra extra por trolley cabina.",
    },
    checked: {
      weight: "23 kg",
      feeFromEur: 0,
      feeNote: "Incluido en Economy Classic, Flex y Business. €25-50 en Economy Light.",
    },
    gateFine: {
      amountEur: 0,
      description: "Lufthansa raramente aplica gate fees, política más flexible que low-cost.",
    },
    tips: [
      "Bolso cabina Lufthansa permite solo 8kg (low-cost permite 10kg) — peso es la limitación, no dimensiones",
      "Miles & More acumula puntos en Lufthansa, SWISS, Austrian, Eurowings",
      "Para vuelos largo radio (Asia/USA), equipaje 2× 23kg incluido en Business",
      "Conexiones intra-Europa: equipaje se traslada automáticamente, no recogerlo",
    ],
    comparison:
      "Lufthansa Economy Light es similar a low-cost en pricing pero más flexible en equipaje (trolley incluido). Comparable a Iberia en flexibilidad.",
  },
  {
    code: "AF",
    name: "Air France",
    slug: "air-france",
    emoji: "🟦",
    lastUpdated: "2026-05",
    personalItem: {
      name: "Accesorio personal",
      dimensions: "40 × 30 × 15 cm",
      free: true,
    },
    cabin: {
      dimensions: "55 × 35 × 25 cm",
      weight: "12 kg",
      feeFromEur: 0,
      feeNote: "Incluido en todas las tarifas Light, Classic, Flex y Business.",
    },
    checked: {
      weight: "23 kg",
      feeFromEur: 0,
      feeNote: "Incluido en Classic y Flex. €25-50 extra en Light tarifa.",
    },
    gateFine: {
      amountEur: 0,
      description: "Air France raramente aplica gate fees por exceder dimensiones.",
    },
    tips: [
      "Bolso cabina Air France permite 12kg (más que Lufthansa 8kg) — equipaje pesado bienvenido",
      "Flying Blue programa acumula puntos en Air France, KLM, Delta, Virgin Atlantic, Aeromexico, Garuda, ITA",
      "Para Tahití (vía CDG), Air France es el único operador directo desde Europa",
      "Codeshare con KLM extiende red — useful para destinos europeos secundarios",
    ],
    comparison:
      "Air France es generoso en peso bolso cabina (12kg vs Lufthansa 8kg). Para frequent flyer, Flying Blue tiene más opciones de redención.",
  },
  {
    code: "KL",
    name: "KLM",
    slug: "klm",
    emoji: "🟦",
    lastUpdated: "2026-05",
    personalItem: {
      name: "Accesorio personal",
      dimensions: "40 × 30 × 15 cm",
      free: true,
    },
    cabin: {
      dimensions: "55 × 35 × 25 cm",
      weight: "12 kg",
      feeFromEur: 0,
      feeNote: "Incluido en todas las tarifas, igual que Air France (mismo grupo).",
    },
    checked: {
      weight: "23 kg",
      feeFromEur: 0,
      feeNote: "Idéntico Air France — Classic y Flex incluyen, Light tarifa cobra €25-50.",
    },
    gateFine: {
      amountEur: 0,
      description: "Política idéntica Air France: flexible con dimensiones excedidas ligeramente.",
    },
    tips: [
      "KLM y Air France son el mismo grupo — programa Flying Blue, reglas idénticas",
      "Hub Ámsterdam Schiphol es eficiente para conexiones intra-Europa y largo radio",
      "Flying Blue tiene partner directo con Vueling para acumulación de millas",
      "Codeshare con Delta extiende red USA — útil para combinaciones EU-USA",
    ],
    comparison:
      "KLM idéntico Air France en equipaje. Hub AMS más céntrico geográficamente que CDG para conexiones nórdicas y UK.",
  },
  {
    code: "DY",
    name: "Norwegian",
    slug: "norwegian",
    emoji: "🟥",
    lastUpdated: "2026-05",
    personalItem: {
      name: "Bolso pequeño",
      dimensions: "30 × 20 × 38 cm",
      free: true,
    },
    cabin: {
      dimensions: "55 × 40 × 23 cm",
      weight: "10 kg",
      feeFromEur: 10,
      feeNote: "Incluido en LowFare+ y Flex. €10-25 extra en LowFare básica.",
    },
    checked: {
      weight: "20 kg",
      feeFromEur: 20,
      feeNote: "€20-40 según ruta. Maletas 20/25/32 kg disponibles.",
    },
    gateFine: {
      amountEur: 60,
      description: "€60 si excedes dimensiones en gate. Menos punitivo que Ryanair pero estricto.",
    },
    tips: [
      "Norwegian es bastante low-cost en Escandinavia — equivalente a Ryanair pero con experiencia más cómoda",
      "Tarifa LowFare+ €15-25 extra sobre LowFare incluye trolley + asiento — compensa",
      "Para destinos como Tromsø, Reikiavik, Oslo — Norwegian suele ser la opción más barata",
      "Servicio a bordo más generoso que Ryanair: snack + drink básico incluido en Economy",
    ],
    comparison:
      "Norwegian es low-cost pero más cómodo que Ryanair. Para vuelos escandinavos, suele ser mejor opción precio/calidad que SAS o Lufthansa.",
  },
  {
    code: "QR",
    name: "Qatar Airways",
    slug: "qatar-airways",
    emoji: "🟫",
    lastUpdated: "2026-05",
    personalItem: {
      name: "Accesorio personal",
      dimensions: "40 × 30 × 20 cm",
      free: true,
    },
    cabin: {
      dimensions: "50 × 37 × 25 cm",
      weight: "7 kg",
      feeFromEur: 0,
      feeNote: "Incluido en TODAS las tarifas Economy, Business y First.",
    },
    checked: {
      weight: "30 kg",
      feeFromEur: 0,
      feeNote: "Economy: 30kg incluidos (¡el más generoso del sector!). Business: 40kg. First: 50kg.",
    },
    gateFine: {
      amountEur: 0,
      description: "Qatar nunca aplica gate fees — política luxury totalmente flexible.",
    },
    tips: [
      "Qatar permite 30kg facturados en Economy — el más generoso de cualquier aerolínea premium",
      "Servicio a bordo top-tier: comida real, kit aseo, mantas y almohadas en cualquier ruta >3h",
      "Q-Suite Business class (votada mejor del mundo Skytrax 7 años) merece pena si encuentras mistake fares",
      "Hub Doha conecta Europa-Asia/Oceanía/África con escala única — uno de los mejores aeropuertos del mundo",
    ],
    comparison:
      "Qatar es la aerolínea más generosa en equipaje facturado (30kg Economy). Compara con Emirates (25kg) y Etihad (23kg).",
  },
];

export const BAGGAGE_BY_SLUG: Record<string, BaggageRule> = Object.fromEntries(
  BAGGAGE_RULES.map((r) => [r.slug, r]),
);

export function getBaggageBySlug(slug: string): BaggageRule | null {
  return BAGGAGE_BY_SLUG[slug] || null;
}
