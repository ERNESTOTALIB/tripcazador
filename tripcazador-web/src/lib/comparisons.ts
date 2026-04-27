/**
 * comparisons.ts — abr-2026y.
 *
 * Páginas comparativas head-to-head entre 2 destinos. Captura keywords
 * "destino A vs destino B", "X o Y para fin de semana", etc. Cada
 * comparación incluye ratings por criterio y recomendación final.
 *
 * Por qué SEO: las queries comparativas tienen alto intent y conversion.
 * El usuario que busca "Madrid o Lisboa fin de semana" está a 2-3 clicks
 * de comprar. La landing comparativa cierra esa decisión.
 */

export interface DestinationComparison {
  /** Slug kebab. */
  slug: string;
  /** Title for SEO. */
  title: string;
  /** Description for SEO. */
  description: string;
  /** Destino A. */
  a: ComparisonSide;
  /** Destino B. */
  b: ComparisonSide;
  /** Ratings 1-10 por criterio. */
  criteria: Array<{
    label: string;
    aScore: number;
    bScore: number;
    winner: "a" | "b" | "tie";
    note: string;
  }>;
  /** Recomendación final long-form. */
  verdict: string;
  /** Bullet points de cuándo elegir A o B. */
  pickA: string[];
  pickB: string[];
}

export interface ComparisonSide {
  name: string;
  iata: string;
  country: string;
  emoji: string;
  /** Tagline corta. */
  tagline: string;
  /** Precio mediano observado MAD→destino para escapada short-haul. */
  typicalPriceFromMad: number;
  /** Mínimo error fare observado. */
  minObserved: number;
  /** Tiempo total de vuelo desde MAD/España. */
  flightTime: string;
  /** Mejores meses para visitar. */
  bestMonths: string[];
}

export const COMPARISONS: DestinationComparison[] = [
  {
    slug: "madrid-vs-lisboa-fin-de-semana",
    title: "Madrid vs Lisboa para un fin de semana en 2026: cuál elegir",
    description:
      "Comparativa real Madrid vs Lisboa para escapada de fin de semana: precios, cultura, gastronomía, clima, vida nocturna y veredicto final con datos del motor.",
    a: {
      name: "Madrid",
      iata: "MAD",
      country: "España",
      emoji: "🐻",
      tagline: "Capital cultural, museos top, tapas y vida nocturna brutal",
      typicalPriceFromMad: 0, // origen
      minObserved: 0,
      flightTime: "—",
      bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    },
    b: {
      name: "Lisboa",
      iata: "LIS",
      country: "Portugal",
      emoji: "🚋",
      tagline: "Tranvía 28, fado, pasteis y mejor relación calidad-precio",
      typicalPriceFromMad: 78,
      minObserved: 9,
      flightTime: "1h 15min",
      bestMonths: ["Febrero", "Marzo", "Octubre", "Noviembre"],
    },
    criteria: [
      {
        label: "Precio total fin de semana",
        aScore: 6,
        bScore: 9,
        winner: "b",
        note: "Lisboa es 30-40% más barata que Madrid en hotel y comida (€90 vs €130/día).",
      },
      {
        label: "Variedad gastronómica",
        aScore: 9,
        bScore: 8,
        winner: "a",
        note: "Madrid tiene más restaurantes Michelin y variedad internacional. Lisboa gana en frescura de pescado.",
      },
      {
        label: "Cultura y museos",
        aScore: 10,
        bScore: 7,
        winner: "a",
        note: "Madrid tiene Prado, Reina Sofía, Thyssen — top mundial. Lisboa tiene cultura pero a menor escala.",
      },
      {
        label: "Vida nocturna",
        aScore: 9,
        bScore: 9,
        winner: "tie",
        note: "Empate técnico. Madrid: bar-hopping en Malasaña/Lavapiés. Lisboa: Bairro Alto.",
      },
      {
        label: "Walkability",
        aScore: 7,
        bScore: 9,
        winner: "b",
        note: "Lisboa cabe en 3 días andando + tranvía. Madrid requiere metro/taxis para distancias largas.",
      },
      {
        label: "Clima en escapada otoño-invierno",
        aScore: 6,
        bScore: 9,
        winner: "b",
        note: "Lisboa invierno suave (10-15°C). Madrid frío seco (4-12°C, viento).",
      },
      {
        label: "Volumen turístico (menos = mejor)",
        aScore: 7,
        bScore: 5,
        winner: "a",
        note: "Lisboa muy turística en zonas centrales (Bairro Alto, Belém). Madrid se diluye más por su tamaño.",
      },
    ],
    verdict:
      "Si nunca has estado en ninguno, Madrid primero. Si ya conoces Madrid, Lisboa siempre. Si vives en Madrid y buscas escapada de bajo coste con cambio de aire real, Lisboa por €200-300 todo incluido es prácticamente imbatible. Si vives en Lisboa, Madrid es la opción opuesta — más caro pero con un volumen cultural difícil de igualar en Europa.",
    pickA: [
      "Es tu primer viaje a la Península Ibérica",
      "Te encanta la pintura clásica (Prado, Reina Sofía)",
      "Buscas variedad gastronómica internacional",
      "Quieres vida nocturna distribuida en muchos barrios",
    ],
    pickB: [
      "Buscas la mejor relación precio/experiencia",
      "Quieres caminar la ciudad andando",
      "Te gusta el pescado fresco y vinos verdes",
      "Vas en otoño-invierno y prefieres clima suave",
      "Es tu primera vez en Portugal",
    ],
  },
  {
    slug: "barcelona-vs-roma-fin-de-semana",
    title: "Barcelona vs Roma para un fin de semana en 2026: comparativa real",
    description:
      "BCN vs FCO en datos reales: precios, arquitectura, gastronomía, vida nocturna, clima. Veredicto del motor TripCazador para tu próxima escapada europea.",
    a: {
      name: "Barcelona",
      iata: "BCN",
      country: "España",
      emoji: "🏛️",
      tagline: "Gaudí, playa urbana, vermut y arquitectura modernista",
      typicalPriceFromMad: 0,
      minObserved: 0,
      flightTime: "—",
      bestMonths: ["Mayo", "Junio", "Septiembre", "Octubre"],
    },
    b: {
      name: "Roma",
      iata: "FCO",
      country: "Italia",
      emoji: "🍕",
      tagline: "Coliseo, Vaticano, pasta artesanal y aperitivos",
      typicalPriceFromMad: 65,
      minObserved: 12,
      flightTime: "2h 30min",
      bestMonths: ["Marzo", "Abril", "Mayo", "Octubre"],
    },
    criteria: [
      {
        label: "Vuelo desde España (precio + tiempo)",
        aScore: 10,
        bScore: 7,
        winner: "a",
        note: "BCN es interno: €40-80 + 1h. Roma RT desde €65, vuelo 2h30m.",
      },
      {
        label: "Patrimonio histórico",
        aScore: 7,
        bScore: 10,
        winner: "b",
        note: "Roma es la ciudad museo: Coliseo, Foro, Vaticano. BCN tiene Gaudí (modernismo, no antigüedad).",
      },
      {
        label: "Gastronomía",
        aScore: 9,
        bScore: 10,
        winner: "b",
        note: "Empate cualitativo. Roma gana en pasta y pizza auténtica. BCN gana en variedad mediterránea + tapas.",
      },
      {
        label: "Walkability",
        aScore: 9,
        bScore: 8,
        winner: "a",
        note: "BCN cabe en 3 días andando + metro corto. Roma requiere bus/taxi para Vaticano y Coliseo.",
      },
      {
        label: "Playa accesible",
        aScore: 10,
        bScore: 4,
        winner: "a",
        note: "BCN tiene Barceloneta a 15min metro. Roma a 30min en tren (Ostia, peor calidad).",
      },
      {
        label: "Hospedaje precio/calidad",
        aScore: 7,
        bScore: 8,
        winner: "b",
        note: "Roma centro 4* desde €120/noche. BCN equivalente €150-180.",
      },
      {
        label: "Trampas turísticas (menos = mejor)",
        aScore: 6,
        bScore: 4,
        winner: "a",
        note: "Roma centro saturado de timos. BCN también pero menos agresivos.",
      },
    ],
    verdict:
      "Si nunca has estado en ninguno y eres español, ve primero a Roma — tiene más patrimonio único y vuelo barato. Si ya conoces Roma, BCN es escapada-fin-semana imbatible para residentes en España (Vueling 4-6 frecuencias diarias). Para combo de mar + cultura, BCN gana. Para inmersión histórica, Roma sin discusión.",
    pickA: [
      "Buscas combo ciudad + playa",
      "Vives en España y quieres escapada interna barata",
      "Te gusta el modernismo (Gaudí, Domènech)",
      "Vas con niños (más walkability + playa)",
    ],
    pickB: [
      "Es tu primera vez en Italia",
      "Te apasiona la historia romana",
      "Buscas la mejor pizza/pasta de tu vida",
      "Quieres ver el Vaticano",
      "Tienes 4-5 días (3 son justos para Roma)",
    ],
  },
  {
    slug: "madrid-vs-nueva-york-vacaciones",
    title: "Madrid vs Nueva York para vacaciones largas: cuál merece más la pena",
    description:
      "Comparativa Madrid vs NYC para vacaciones de 7-10 días: precio, cultura, comida, vida cotidiana. Análisis para hispanohablante que duda entre quedarse en Europa o cruzar el Atlántico.",
    a: {
      name: "Madrid",
      iata: "MAD",
      country: "España",
      emoji: "🥘",
      tagline: "Capital cultural, vida en la calle, tapas a cualquier hora",
      typicalPriceFromMad: 0,
      minObserved: 0,
      flightTime: "—",
      bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    },
    b: {
      name: "Nueva York",
      iata: "JFK",
      country: "EEUU",
      emoji: "🗽",
      tagline: "La ciudad que nunca duerme, museos top, Broadway, food scene",
      typicalPriceFromMad: 580,
      minObserved: 290,
      flightTime: "8h directo desde MAD",
      bestMonths: ["Mayo", "Junio", "Septiembre", "Octubre"],
    },
    criteria: [
      {
        label: "Precio total 7 días",
        aScore: 9,
        bScore: 4,
        winner: "a",
        note: "Madrid €700-1000/persona (vuelo no incluido si vives ahí). NYC €2200-3500/persona inclu vuelo.",
      },
      {
        label: "Idioma",
        aScore: 10,
        bScore: 6,
        winner: "a",
        note: "Madrid es nativo para hispanohablantes. NYC tiene barrios hispanos pero el día a día es en inglés.",
      },
      {
        label: "Volumen cultural",
        aScore: 9,
        bScore: 10,
        winner: "b",
        note: "NYC tiene MET, MoMA, Guggenheim, Whitney + 30+ teatros Broadway. Madrid tiene 3 museos top + buen teatro.",
      },
      {
        label: "Variedad gastronómica",
        aScore: 8,
        bScore: 10,
        winner: "b",
        note: "NYC es la capital gastronómica del mundo: 80+ cocinas. Madrid es excelente pero más española-centrada.",
      },
      {
        label: "Walkability + transporte",
        aScore: 9,
        bScore: 8,
        winner: "a",
        note: "Madrid centro andable + metro impecable. NYC subway funciona pero con interrupciones; Manhattan andable.",
      },
      {
        label: "Vida nocturna",
        aScore: 9,
        bScore: 9,
        winner: "tie",
        note: "Empate. Madrid: bares hasta 4am, vida en calle. NYC: bares cierran 4am, más estructurada en venues.",
      },
      {
        label: "Experiencia única",
        aScore: 7,
        bScore: 10,
        winner: "b",
        note: "NYC es 'la única'. Madrid es excepcional pero replicable en otras capitales europeas.",
      },
    ],
    verdict:
      "Si vives en España y nunca has ido a NYC, ve a NYC — la experiencia es única e irrepetible en Europa. Si ya has estado y buscas vacaciones relajadas con buena comida y bajo coste, Madrid (o cualquier ciudad española grande) es la elección obvia. Para family travel con niños pequeños, Madrid gana en accesibilidad de idioma y precio. Para experiencia 'check-bucket-list', NYC sin duda.",
    pickA: [
      "Vives en España y buscas vacaciones de bajo presupuesto",
      "Llevas niños pequeños o adultos mayores",
      "Quieres máxima inmersión en cultura hispana",
      "Tu presupuesto total es <€1500/persona",
    ],
    pickB: [
      "Nunca has estado en NYC y es bucket-list",
      "Tu presupuesto es €2000+/persona",
      "Buscas variedad gastronómica máxima",
      "Quieres ver Broadway en su escenario natural",
      "Tienes 8-10 días (4-5 días saben a poco en NYC)",
    ],
  },
];

// abr-2026z: 5 comparativas adicionales para expandir cluster de "vs" SEO.
COMPARISONS.push(
  {
    slug: "lisboa-vs-oporto-fin-de-semana",
    title: "Lisboa vs Oporto para un fin de semana en 2026",
    description:
      "¿Qué ciudad portuguesa es mejor para una escapada de fin de semana? Comparativa real Lisboa vs Oporto: precios, gastronomía, ambiente, vida nocturna.",
    a: {
      name: "Lisboa",
      iata: "LIS",
      country: "Portugal",
      emoji: "🚋",
      tagline: "Capital, tranvía 28, fado y pasteis de Belém",
      typicalPriceFromMad: 78,
      minObserved: 9,
      flightTime: "1h 15min",
      bestMonths: ["Febrero", "Marzo", "Octubre", "Noviembre"],
    },
    b: {
      name: "Oporto",
      iata: "OPO",
      country: "Portugal",
      emoji: "🍷",
      tagline: "Río Duero, vinos de Oporto y arquitectura azulejo",
      typicalPriceFromMad: 95,
      minObserved: 28,
      flightTime: "1h 30min",
      bestMonths: ["Mayo", "Junio", "Septiembre", "Octubre"],
    },
    criteria: [
      { label: "Precio escapada total", aScore: 8, bScore: 9, winner: "b", note: "Oporto 10-15% más barato en hotel y comida que Lisboa." },
      { label: "Gastronomía", aScore: 9, bScore: 9, winner: "tie", note: "Empate. Lisboa: bacalhau y pasteis. Oporto: francesinha y tripas." },
      { label: "Vinos", aScore: 7, bScore: 10, winner: "b", note: "Oporto es la cuna del vino fortificado. Tour bodegas Vila Nova de Gaia es único." },
      { label: "Vida nocturna", aScore: 9, bScore: 8, winner: "a", note: "Bairro Alto Lisboa más diverso. Ribera Oporto es bonita pero más limitada." },
      { label: "Walkability", aScore: 9, bScore: 9, winner: "tie", note: "Empate. Ambas compactas, Oporto más empinada." },
      { label: "Vuelos desde España", aScore: 9, bScore: 7, winner: "a", note: "Lisboa tiene más frecuencia y precio mínimo más bajo." },
      { label: "Volumen turístico (menos = mejor)", aScore: 5, bScore: 7, winner: "b", note: "Lisboa muy turística. Oporto creciendo pero todavía menos saturada." },
    ],
    verdict:
      "Si nunca has estado en Portugal, Lisboa primero (es la capital, tiene más volumen cultural). Si ya conoces Lisboa o buscas escapada más auténtica y menos turística, Oporto. La combinación ideal: 4 días para repartir 2 en cada ciudad — el AVE LIS-OPO es 2h45min, perfectamente factible.",
    pickA: ["Es tu primera vez en Portugal", "Buscas más vida nocturna y diversidad", "Vuelo desde España con presupuesto mínimo", "Quieres experiencia capital europea clásica"],
    pickB: ["Ya conoces Lisboa", "Te apasionan los vinos", "Buscas ciudad más auténtica y menos saturada", "Vas a tener una escapada relajada en pareja"],
  },
  {
    slug: "roma-vs-florencia-fin-de-semana",
    title: "Roma vs Florencia para un fin de semana cultural en 2026",
    description:
      "Comparativa real Roma vs Florencia para escapada de fin de semana: patrimonio, gastronomía, walkability, precios. Cuál encaja mejor con tu tipo de viajero.",
    a: {
      name: "Roma",
      iata: "FCO",
      country: "Italia",
      emoji: "🏛️",
      tagline: "Coliseo, Vaticano, pasta artesanal y aperitivos",
      typicalPriceFromMad: 95,
      minObserved: 22,
      flightTime: "2h 30min",
      bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    },
    b: {
      name: "Florencia",
      iata: "FLR",
      country: "Italia",
      emoji: "🎨",
      tagline: "Renacimiento, Uffizi, Duomo y Toscana al lado",
      typicalPriceFromMad: 145,
      minObserved: 55,
      flightTime: "2h 30min",
      bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"],
    },
    criteria: [
      { label: "Patrimonio histórico", aScore: 10, bScore: 9, winner: "a", note: "Roma 2500 años de historia continua. Florencia es un Renacimiento espectacular pero acotado." },
      { label: "Vuelo desde España", aScore: 9, bScore: 6, winner: "a", note: "Roma desde €22 ida. Florencia mediana €145, mucho menos competencia low-cost." },
      { label: "Walkability", aScore: 7, bScore: 10, winner: "b", note: "Florencia se hace andando en 1 día. Roma requiere bus/metro para Vaticano." },
      { label: "Volumen cultural en 2-3 días", aScore: 8, bScore: 10, winner: "b", note: "Florencia: Uffizi+Accademia+Duomo en 2 días = inmersión completa. Roma necesita 4-5 días para no quedarse corto." },
      { label: "Gastronomía", aScore: 9, bScore: 9, winner: "tie", note: "Empate técnico. Roma cacio e pepe legendario. Florencia bistecca alla fiorentina." },
      { label: "Saturación turística", aScore: 5, bScore: 4, winner: "a", note: "Florencia centro saturadísimo. Roma se diluye más por tamaño." },
      { label: "Acceso a campo italiano", aScore: 5, bScore: 10, winner: "b", note: "Florencia → Toscana en 30min. Roma requiere coche y horas." },
    ],
    verdict:
      "Si es tu primera vez en Italia y solo tienes 3 días, Florencia: experiencia más concentrada y completa. Si ya estuviste en Florencia o tienes 4-5 días, Roma sin duda. Ideal: combinar — vuela a Roma (es más barato), tren a Florencia (1h30min). Italia bien hecha en 5-7 días.",
    pickA: ["Es tu primera vez en Italia y tienes 4-5 días", "Buscas vuelo barato desde España", "Te apasiona la historia romana clásica", "Tu presupuesto es ajustado"],
    pickB: ["Tienes solo 3 días", "Te apasiona el Renacimiento", "Quieres acceso fácil a Toscana", "Es tu segundo viaje a Italia y quieres profundidad"],
  },
  {
    slug: "bangkok-vs-phuket-tailandia",
    title: "Bangkok vs Phuket: cuál elegir para tu primer viaje a Tailandia",
    description:
      "Comparativa real Bangkok vs Phuket: precio vuelo desde España, ambiente, gastronomía, beach scene. Decisión clave si solo tienes 7-10 días en Tailandia.",
    a: {
      name: "Bangkok",
      iata: "BKK",
      country: "Tailandia",
      emoji: "🛕",
      tagline: "Templos, gastronomía callejera, mercados nocturnos y vida 24/7",
      typicalPriceFromMad: 475,
      minObserved: 298,
      flightTime: "13-14h con escala",
      bestMonths: ["Noviembre", "Diciembre", "Enero", "Febrero"],
    },
    b: {
      name: "Phuket",
      iata: "HKT",
      country: "Tailandia",
      emoji: "🏝️",
      tagline: "Playas, islas vecinas, snorkel y atardeceres en barco",
      typicalPriceFromMad: 620,
      minObserved: 410,
      flightTime: "16-18h con 2 escalas (mejor: BKK + interno)",
      bestMonths: ["Diciembre", "Enero", "Febrero", "Marzo"],
    },
    criteria: [
      { label: "Vuelo desde España", aScore: 9, bScore: 6, winner: "a", note: "BKK directo más barato. HKT requiere conexión BKK + interno." },
      { label: "Cultura tailandesa", aScore: 10, bScore: 5, winner: "a", note: "Bangkok es la inmersión real: templos, mercados, vida local. Phuket es resort-isla turística." },
      { label: "Playa", aScore: 2, bScore: 10, winner: "b", note: "Bangkok no tiene playa. Phuket tiene 30+ playas accesibles." },
      { label: "Gastronomía callejera", aScore: 10, bScore: 7, winner: "a", note: "Bangkok = capital street-food mundial. Phuket tiene comida buena pero más turística." },
      { label: "Alojamiento precio/calidad", aScore: 8, bScore: 7, winner: "a", note: "Hotel 4* Bangkok €60-90. Phuket equivalente €100-150 (zonas turísticas)." },
      { label: "Acceso a islas", aScore: 5, bScore: 10, winner: "b", note: "Phuket es base perfecta para Phi Phi, Krabi, James Bond. Bangkok requiere vuelo." },
      { label: "Días recomendados", aScore: 9, bScore: 8, winner: "a", note: "Bangkok satura en 3-4 días. Phuket aguanta 5-7 días sin aburrir si te gusta playa." },
    ],
    verdict:
      "Si es tu primer viaje a Tailandia, plan ideal es 3-4 días Bangkok + 4-5 días Phuket o Krabi. Volar directo a uno y entrar al otro. Si solo eliges uno: Bangkok para inmersión cultural, Phuket para vacaciones playa puras. NO elijas Phuket si te aburres en playa — la cultura tailandesa real está en BKK.",
    pickA: ["Es tu primer viaje a Tailandia y quieres cultura", "Buscas gastronomía callejera de élite", "Tu presupuesto es ajustado", "Solo tienes 4-5 días"],
    pickB: ["Has estado en Bangkok antes", "Vas a relax-playa con familia/pareja", "Quieres acceso fácil a Phi Phi/Krabi", "Tienes 7+ días"],
  },
  {
    slug: "buenos-aires-vs-santiago-sudamerica",
    title: "Buenos Aires vs Santiago de Chile: cuál visitar primero desde España",
    description:
      "Comparativa real BUE vs SCL para hispanohablantes desde España: vuelos, gastronomía, vida nocturna, naturaleza, precios. Decisión clave para tu primera Sudamérica.",
    a: {
      name: "Buenos Aires",
      iata: "EZE",
      country: "Argentina",
      emoji: "🥩",
      tagline: "Tango, asado, San Telmo y europea-latinoamericana",
      typicalPriceFromMad: 750,
      minObserved: 380,
      flightTime: "13h directo MAD-EZE",
      bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    },
    b: {
      name: "Santiago",
      iata: "SCL",
      country: "Chile",
      emoji: "🍷",
      tagline: "Cordillera, vinos chilenos, Valparaíso y modernidad latinoamericana",
      typicalPriceFromMad: 720,
      minObserved: 410,
      flightTime: "14h con 1 escala",
      bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    },
    criteria: [
      { label: "Vuelo desde España", aScore: 9, bScore: 7, winner: "a", note: "EZE directo Iberia 13h. SCL requiere escala (LIM o GRU)." },
      { label: "Vida cultural urbana", aScore: 10, bScore: 8, winner: "a", note: "Buenos Aires: tango, librerías, teatros, gastronomía. Santiago más eficiente pero menos romántico." },
      { label: "Naturaleza accesible", aScore: 5, bScore: 10, winner: "b", note: "Santiago: Cordillera 1h, Valparaíso 1h30, viñedos. BUE requiere vuelos internos para llegar a Patagonia." },
      { label: "Coste vida en destino", aScore: 7, bScore: 6, winner: "a", note: "BUE es más barato en comida y entretenimiento. Chile es más caro." },
      { label: "Gastronomía", aScore: 10, bScore: 8, winner: "a", note: "Asado argentino + pasta + dulce de leche difíciles de superar. Chile bueno pero menos único." },
      { label: "Vinos", aScore: 8, bScore: 10, winner: "b", note: "Mendoza es accesible desde BUE (vuelo interno). Casablanca/Maipo desde SCL es más fácil." },
      { label: "Combinable con destinos cercanos", aScore: 8, bScore: 9, winner: "b", note: "SCL → Atacama, Patagonia chilena, Isla de Pascua. BUE → Iguazú, El Calafate (vuelos largos)." },
    ],
    verdict:
      "Si es tu primer viaje a Sudamérica, Buenos Aires: vuelo directo, gastronomía top, sensación europea-latinoamericana, ciudad para perderse. Si ya conoces BA o eres muy outdoor, Santiago: acceso a Cordillera, Atacama, Patagonia chilena. Ideal combinado: vuela a BUE, conoces Argentina (Iguazú + BA + Mendoza) y vuelves desde SCL conociendo Chile.",
    pickA: ["Es tu primer viaje Sudamérica", "Te apasiona la gastronomía y vida urbana", "Quieres vuelo directo desde España", "Vas con tu pareja o solo"],
    pickB: ["Eres outdoor / hiker / esquiador", "Ya estuviste en BA", "Quieres combinar con Atacama o Patagonia", "Tu presupuesto es flexible"],
  },
  {
    slug: "bali-vs-tailandia-vacaciones",
    title: "Bali vs Tailandia: comparativa para vacaciones largas en 2026",
    description:
      "Bali (Indonesia) vs Tailandia para 10-14 días de vacaciones desde España: precios, ambiente, playas, cultura, dificultad logística. Análisis honesto del cazador.",
    a: {
      name: "Bali",
      iata: "DPS",
      country: "Indonesia",
      emoji: "🌴",
      tagline: "Templos, arrozales, surf, espiritualidad y wellness retreats",
      typicalPriceFromMad: 720,
      minObserved: 480,
      flightTime: "18-22h con 1-2 escalas",
      bestMonths: ["Mayo", "Junio", "Septiembre", "Octubre"],
    },
    b: {
      name: "Tailandia",
      iata: "BKK",
      country: "Tailandia",
      emoji: "🛕",
      tagline: "Bangkok urbano + islas paradisíacas (Phi Phi, Koh Samui)",
      typicalPriceFromMad: 475,
      minObserved: 298,
      flightTime: "13-14h con 1 escala",
      bestMonths: ["Noviembre", "Diciembre", "Enero", "Febrero"],
    },
    criteria: [
      { label: "Vuelo desde España", aScore: 5, bScore: 9, winner: "b", note: "Tailandia es 3-5h más cerca y €200-300 más barato que Bali." },
      { label: "Playas", aScore: 8, bScore: 10, winner: "b", note: "Tailandia tiene más variedad (Phi Phi, Krabi, Koh Samui, Koh Lanta). Bali tiene playas decentes pero no top mundial." },
      { label: "Volumen cultural", aScore: 9, bScore: 10, winner: "b", note: "Bangkok es capital cultural enorme. Bali es cultura concentrada (Ubud, templos)." },
      { label: "Coste vida en destino", aScore: 9, bScore: 8, winner: "a", note: "Bali ligeramente más barato en comida y alojamiento que Tailandia turística." },
      { label: "Wellness / yoga / spa", aScore: 10, bScore: 7, winner: "a", note: "Bali es la capital mundial del yoga retreat. Tailandia tiene wellness pero menos concentrado." },
      { label: "Diversidad de experiencias", aScore: 7, bScore: 10, winner: "b", note: "Tailandia: norte (Chiang Mai), centro (Bangkok), islas. Bali es 1 isla con micro-variedad." },
      { label: "Logística para 10-14 días", aScore: 7, bScore: 9, winner: "b", note: "Tailandia: vuelos internos baratos, transporte simple. Bali: scooter o coche con conductor, más limitada." },
    ],
    verdict:
      "Si es tu primer viaje al sudeste asiático, Tailandia: más completa, mejor combinación cultura+playa+naturaleza, vuelo más barato. Bali es genial para vacaciones especializadas (yoga, surf, wellness) pero limitada como destino único en 14 días. Ideal: combinar Tailandia 10 días + Bali 5 días en mismo viaje, conexión BKK-DPS.",
    pickA: ["Buscas yoga retreat / wellness", "Quieres surf de calidad consistente", "Has estado en Tailandia antes", "Buscas espiritualidad/meditación"],
    pickB: ["Es tu primer viaje al sudeste asiático", "Quieres combinar ciudad + islas + naturaleza", "Tu presupuesto es ajustado", "Vas con familia o niños"],
  },
);

// abr-2026aa: 7 comparativas adicionales (target 15 total).
COMPARISONS.push(
  {
    slug: "praga-vs-budapest-fin-de-semana",
    title: "Praga vs Budapest: cuál elegir para tu escapada de Europa Central",
    description:
      "Comparativa real Praga vs Budapest: vuelos desde España, gastronomía, vida nocturna, baños termales, walkability. Decisión clave para tu primera Europa Central.",
    a: { name: "Praga", iata: "PRG", country: "Rep. Checa", emoji: "🏰", tagline: "Cien torres, cerveza checa, casco gótico", typicalPriceFromMad: 95, minObserved: 28, flightTime: "2h 45min", bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"] },
    b: { name: "Budapest", iata: "BUD", country: "Hungría", emoji: "♨️", tagline: "Baños termales, ribera Danubio, ruina pubs", typicalPriceFromMad: 78, minObserved: 19, flightTime: "3h", bestMonths: ["Mayo", "Junio", "Septiembre", "Octubre"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 8, bScore: 9, winner: "b", note: "Wizz Air Budapest desde €19. Praga ligeramente más cara." },
      { label: "Casco histórico", aScore: 10, bScore: 8, winner: "a", note: "Praga centro mejor conservado. Budapest impresionante pero más extendido." },
      { label: "Vida nocturna y precios", aScore: 8, bScore: 10, winner: "b", note: "Budapest ruin pubs únicos en el mundo. Praga buena pero más turística." },
      { label: "Gastronomía", aScore: 7, bScore: 9, winner: "b", note: "Budapest goulash, lángos, pálinka. Praca buena cerveza pero comida menos memorable." },
      { label: "Walkability", aScore: 9, bScore: 8, winner: "a", note: "Praga compacta, todo andando. Budapest requiere metro para Buda↔Pest." },
      { label: "Wellness/baños", aScore: 5, bScore: 10, winner: "b", note: "Budapest tiene baños Széchenyi (los mejores del mundo). Praga no destaca aquí." },
      { label: "Saturación turística", aScore: 4, bScore: 7, winner: "b", note: "Praga centro saturadísimo. Budapest se diluye más por tamaño." },
    ],
    verdict: "Si nunca has estado en Europa Central, Budapest gana ligeramente: vuelo más barato, gastronomía mejor, baños termales únicos, menos turismo. Si te apasiona la arquitectura gótica clásica, Praga. Combo ideal: vuela a uno, autobús (8h) o tren (8h) al otro, vuelve por el otro hub. La distancia Praga-Budapest se cubre fácil en bus FlixBus por €25-40.",
    pickA: ["Te apasiona la arquitectura gótica", "Buscas casco compacto y andable", "Bebes cerveza checa de calidad", "Es escape solo o pareja"],
    pickB: ["Quieres precio mínimo absoluto", "Te interesan baños termales", "Buscas vida nocturna alternativa", "Es tu primera vez Europa Central"],
  },
  {
    slug: "estambul-vs-marrakech-cultura",
    title: "Estambul vs Marrakech: cuál es la mejor escapada cultural",
    description:
      "Comparativa Estambul vs Marrakech para escapada cultural intensa: vuelos directos, gastronomía, zocos, arquitectura, walkability, seguridad. Para hispanohablantes 2026.",
    a: { name: "Estambul", iata: "IST", country: "Turquía", emoji: "🕌", tagline: "Hagia Sofía, Bósforo, hub Europa-Asia", typicalPriceFromMad: 295, minObserved: 85, flightTime: "4h", bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"] },
    b: { name: "Marrakech", iata: "RAK", country: "Marruecos", emoji: "🐪", tagline: "Zocos, Majorelle, riads tradicionales", typicalPriceFromMad: 125, minObserved: 18, flightTime: "3h", bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 7, bScore: 10, winner: "b", note: "Marrakech directo desde €18 con Ryanair. Estambul desde €85, mucho más caro." },
      { label: "Volumen patrimonio", aScore: 10, bScore: 8, winner: "a", note: "Estambul: Hagia Sofía + Topkapi + Cisterna + Mezquita Azul. Marrakech: Bahia + Majorelle + Madrasa." },
      { label: "Gastronomía", aScore: 10, bScore: 8, winner: "a", note: "Estambul es capital mundial de gastronomía. Marrakech buena pero menos variada." },
      { label: "Zocos y compras", aScore: 9, bScore: 10, winner: "b", note: "Marrakech zocos auténticos, regateo intenso. Estambul Gran Bazar fantástico pero más turístico." },
      { label: "Acceso aeropuerto-centro", aScore: 7, bScore: 9, winner: "b", note: "Marrakech aeropuerto a 5km centro. Estambul IST a 35km, taxi €40." },
      { label: "Cultura/idiomas", aScore: 8, bScore: 9, winner: "b", note: "Marrakech: francés y español funcional. Estambul: turco + inglés básico." },
      { label: "Sensación de exotismo", aScore: 9, bScore: 10, winner: "b", note: "Marrakech transporta más a 'otro mundo'. Estambul más cosmopolita europea-asiática." },
    ],
    verdict: "Para escapada de 3 días, Marrakech: vuelo barato, hotel económico, sensación inmersiva. Para 5+ días, Estambul: más patrimonio, más gastronomía, hub para combinar Capadocia o Egeo. Si nunca has estado en ninguno, Marrakech primero (más fácil, más barato). Si ya conoces Marrakech, Estambul es nivel siguiente de exploración cultural.",
    pickA: ["Tienes 5+ días", "Te apasiona historia bizantina/otomana", "Buscas mejor gastronomía mediterránea", "Quieres hub para más viajes"],
    pickB: ["Tienes 3-4 días", "Buscas presupuesto ajustado", "Es tu primera escapada África", "Te gusta regatear en zocos auténticos"],
  },
  {
    slug: "nyc-vs-los-angeles-vacaciones",
    title: "Nueva York vs Los Ángeles: cuál visitar primero desde España",
    description:
      "Comparativa real NYC vs LA para vacaciones largas desde España: precios vuelo, vida cultural, gastronomía, clima, walkability. Decisión clásica para tu primera USA.",
    a: { name: "Nueva York", iata: "JFK", country: "EEUU", emoji: "🗽", tagline: "Manhattan, Broadway, museos top, food scene", typicalPriceFromMad: 580, minObserved: 290, flightTime: "8h directo", bestMonths: ["Mayo", "Junio", "Septiembre", "Octubre"] },
    b: { name: "Los Ángeles", iata: "LAX", country: "EEUU", emoji: "🌴", tagline: "Hollywood, playas, californianidad, comida fusión", typicalPriceFromMad: 720, minObserved: 410, flightTime: "12h con escala", bestMonths: ["Marzo", "Abril", "Septiembre", "Octubre"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 9, bScore: 6, winner: "a", note: "NYC vuelo directo 8h. LAX requiere escala (FRA/LHR/JFK), 12h+." },
      { label: "Volumen cultural", aScore: 10, bScore: 7, winner: "a", note: "NYC museos top mundial, Broadway, gastronomía. LA tiene Getty + LACMA + Universal." },
      { label: "Walkability", aScore: 9, bScore: 3, winner: "a", note: "Manhattan andable. LA exige coche, distancias enormes." },
      { label: "Clima", aScore: 6, bScore: 10, winner: "b", note: "LA clima perfecto todo el año. NYC inviernos duros y veranos calurosos." },
      { label: "Playas accesibles", aScore: 4, bScore: 10, winner: "b", note: "LA: Santa Monica + Venice + Malibú. NYC: Coney Island lejos y mediocre." },
      { label: "Coste vida", aScore: 5, bScore: 5, winner: "tie", note: "Ambas son caras. NYC más concentrada en hoteles. LA distribuida con Airbnb." },
      { label: "Vida nocturna", aScore: 10, bScore: 7, winner: "a", note: "NYC nunca duerme. LA cierra a 2am, escena más fragmentada por barrios." },
    ],
    verdict: "Si es tu primera USA, NYC: vuelo más barato, walkable, máxima inmersión cultural en 5-7 días. LA es para road trip California (LA + Big Sur + SF + Yosemite, 14+ días con coche). Si solo tienes 1 semana, NYC sin discusión. Para 2+ semanas con coche y libertad, considerar LA como base.",
    pickA: ["Es tu primera USA", "Tienes solo 5-7 días", "Buscas máxima cultura urbana", "Vas en otoño-primavera"],
    pickB: ["Tienes 14+ días con coche", "Te apasionan playas y outdoor", "Buscas clima cálido año-round", "Quieres combinar con SF/Yosemite"],
  },
  {
    slug: "lisboa-vs-sevilla-fin-de-semana",
    title: "Lisboa vs Sevilla: cuál escapada de fin de semana en 2026",
    description:
      "Comparativa Lisboa (Portugal) vs Sevilla (Andalucía) para fin de semana: precio, gastronomía, walkability, vida nocturna. Para residentes Madrid/Barcelona.",
    a: { name: "Lisboa", iata: "LIS", country: "Portugal", emoji: "🚋", tagline: "Tranvía 28, fado, pasteis", typicalPriceFromMad: 78, minObserved: 9, flightTime: "1h 15min", bestMonths: ["Febrero", "Marzo", "Octubre", "Noviembre"] },
    b: { name: "Sevilla", iata: "SVQ", country: "España", emoji: "💃", tagline: "Catedral, flamenco, tapas, Real Alcázar", typicalPriceFromMad: 0, minObserved: 0, flightTime: "AVE 2h30min", bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"] },
    criteria: [
      { label: "Coste transporte desde Madrid", aScore: 9, bScore: 8, winner: "a", note: "Lisboa vuelo desde €9 ida. AVE Madrid-Sevilla €40-80 ida." },
      { label: "Walkability", aScore: 9, bScore: 9, winner: "tie", note: "Empate. Ambas compactas y andables." },
      { label: "Cultura única", aScore: 9, bScore: 10, winner: "b", note: "Sevilla tiene flamenco y Semana Santa, experiencias auténticas únicas." },
      { label: "Idioma extranjero", aScore: 8, bScore: 5, winner: "a", note: "Lisboa: cambio de idioma, sensación de viaje real. Sevilla: español, igual que casa." },
      { label: "Gastronomía precio/calidad", aScore: 9, bScore: 10, winner: "b", note: "Sevilla tapas brutales por €2-4. Lisboa más cara en restaurantes turísticos." },
      { label: "Clima fin de semana corto", aScore: 8, bScore: 9, winner: "b", note: "Sevilla cálida y soleada casi siempre. Lisboa similar pero más viento atlántico." },
      { label: "Saturación turística", aScore: 5, bScore: 7, winner: "b", note: "Lisboa centro muy saturado. Sevilla saturada en Semana Santa, menos resto del año." },
    ],
    verdict: "Si vives en España y nunca has ido a ninguna, Lisboa primero (cambio de idioma + país + más barato). Sevilla mejor para residentes en Madrid/BCN que ya conocen Andalucía. Para escapada de pareja con tapas + flamenco + sin esfuerzo, Sevilla. Para sensación de 'estoy en otro país' con presupuesto mínimo, Lisboa.",
    pickA: ["Buscas presupuesto mínimo absoluto", "Quieres sensación de viaje al extranjero", "No has estado en Portugal", "Te encanta caminar por colinas"],
    pickB: ["Quieres flamenco auténtico + tapas", "Vas con familia o adultos mayores", "Tienes presupuesto medio", "Es tu primera vez en Andalucía"],
  },
  {
    slug: "tokio-vs-seul-asia",
    title: "Tokio vs Seúl: cuál elegir para tu primer Asia oriental",
    description:
      "Tokio (Japón) vs Seúl (Corea del Sur) para 7-10 días desde España: vuelos, gastronomía, cultura, technology, vida nocturna. Análisis honesto del cazador.",
    a: { name: "Tokio", iata: "NRT", country: "Japón", emoji: "🗼", tagline: "Tradición + neón, sushi top, Shibuya", typicalPriceFromMad: 980, minObserved: 480, flightTime: "11-14h con escala", bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"] },
    b: { name: "Seúl", iata: "ICN", country: "Corea del Sur", emoji: "🥢", tagline: "K-pop, BBQ coreano, Gangnam, technology", typicalPriceFromMad: 850, minObserved: 420, flightTime: "13h con escala", bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 8, bScore: 9, winner: "b", note: "Seúl Korean Air €420 visto. Tokio mediana mayor pero error fares más profundos." },
      { label: "Volumen cultural", aScore: 10, bScore: 8, winner: "a", note: "Tokio: templos, mercados, distritos únicos, gastronomía 3 estrellas. Seúl excelente pero menos profundo." },
      { label: "Gastronomía", aScore: 10, bScore: 9, winner: "a", note: "Tokio capital mundial sushi/ramen. Seúl Korean BBQ + comida calle excelentes pero menos variedad." },
      { label: "Inglés en destino", aScore: 5, bScore: 7, winner: "b", note: "Seúl mejor inglés que Tokio (especialmente en Gangnam). Tokio funcional pero limitado." },
      { label: "Coste vida", aScore: 6, bScore: 8, winner: "b", note: "Seúl 25-35% más barato que Tokio en hotel y comida." },
      { label: "Vida nocturna", aScore: 8, bScore: 10, winner: "b", note: "Seúl bares 24h, K-pop scene, Hongdae. Tokio increíble pero más estructurada por distritos." },
      { label: "Singularidad cultural", aScore: 10, bScore: 9, winner: "a", note: "Tokio único globalmente. Seúl impresionante pero algunos elementos sienten más 'asia genérica'." },
    ],
    verdict: "Si es tu primer Asia oriental y tienes 10+ días, Tokio sin duda: más profundo culturalmente, gastronomía referencial. Si tienes 5-7 días o presupuesto ajustado, Seúl: vuelo más barato, costes destino menores, comida y vida nocturna excelentes. Combo ideal 14 días: Tokio (10) + Seúl (4), conexión vuelo barato NRT-ICN €120.",
    pickA: ["Es tu primer viaje a Asia oriental", "Tienes 10+ días", "Te apasiona gastronomía premium", "Te interesa la tradición japonesa"],
    pickB: ["Tienes 5-7 días", "Tu presupuesto es ajustado", "Te interesa K-pop / cultura coreana", "Quieres mejor inglés en destino"],
  },
  {
    slug: "reykjavik-vs-helsinki-aurora",
    title: "Reykjavik vs Helsinki: dónde ver auroras boreales 2026",
    description:
      "Comparativa Reykjavik vs Helsinki para auroras boreales desde España: vuelos, accesibilidad, qué ver, costes. Cuál merece más la pena.",
    a: { name: "Reykjavik", iata: "KEF", country: "Islandia", emoji: "🌋", tagline: "Auroras, glaciares, cascadas, naturaleza salvaje", typicalPriceFromMad: 280, minObserved: 120, flightTime: "4h directo", bestMonths: ["Septiembre", "Octubre", "Febrero", "Marzo"] },
    b: { name: "Helsinki", iata: "HEL", country: "Finlandia", emoji: "🦌", tagline: "Diseño, sauna, archipiélago, Laponia (Rovaniemi)", typicalPriceFromMad: 195, minObserved: 65, flightTime: "4h 30min", bestMonths: ["Septiembre", "Octubre", "Marzo"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 8, bScore: 9, winner: "b", note: "Helsinki más barato vía Finnair. Reykjavik directo Iceland Air desde MAD/BCN." },
      { label: "Probabilidad ver auroras (sept-mar)", aScore: 9, bScore: 7, winner: "a", note: "Islandia más al norte, fuera de zonas con luz urbana. Helsinki ciudad, peor visibilidad." },
      { label: "Variedad naturaleza", aScore: 10, bScore: 7, winner: "a", note: "Islandia: glaciares, géiseres, cascadas, fiordos. Helsinki: archipiélago, bosques." },
      { label: "Coste vida en destino", aScore: 4, bScore: 6, winner: "b", note: "Islandia es brutalmente cara. Finlandia cara pero asumible. Cerveza Reykjavik €12, Helsinki €8." },
      { label: "Acceso a campo", aScore: 7, bScore: 5, winner: "a", note: "Reykjavik a Golden Circle 1h coche. Helsinki a Laponia requiere vuelo a Rovaniemi (1h45m)." },
      { label: "Días recomendados", aScore: 10, bScore: 6, winner: "a", note: "Islandia 5-7 días son justos. Helsinki ciudad satura en 2 días, requiere extender a Laponia." },
      { label: "Wellness/sauna", aScore: 5, bScore: 10, winner: "b", note: "Helsinki sauna cultura nacional. Reykjavik tiene Blue Lagoon pero menos cultura sauna." },
    ],
    verdict: "Para auroras + naturaleza intensa, Reykjavik gana claramente: 5-7 días con Golden Circle + Sur de Islandia da experiencia inolvidable. Helsinki tiene sentido como base + extensión Rovaniemi (Laponia) si presupuesto ajustado o tienes hijos pequeños. Para soltero/pareja con presupuesto, Reykjavik. Para familia con niños y presupuesto controlado, Helsinki + Rovaniemi.",
    pickA: ["Buscas máxima probabilidad de auroras", "Te apasiona naturaleza extrema", "Tu presupuesto es flexible (€2000+/persona)", "Vas con pareja sin niños"],
    pickB: ["Vas con familia o niños", "Tu presupuesto es ajustado", "Te interesa cultura nórdica + diseño", "Quieres combinar ciudad + Laponia"],
  },
  {
    slug: "cancun-vs-punta-cana-caribe",
    title: "Cancún vs Punta Cana: cuál es mejor para vacaciones Caribe",
    description:
      "Comparativa Cancún (México) vs Punta Cana (Rep. Dominicana) para vacaciones todo incluido desde España: vuelo, playas, cultura, gastronomía, seguridad.",
    a: { name: "Cancún", iata: "CUN", country: "México", emoji: "🐚", tagline: "Playas turquesa, Mayan ruins, cenotes, Tulum cerca", typicalPriceFromMad: 580, minObserved: 320, flightTime: "11h directo", bestMonths: ["Diciembre", "Enero", "Febrero", "Marzo", "Abril"] },
    b: { name: "Punta Cana", iata: "PUJ", country: "Rep. Dominicana", emoji: "🌴", tagline: "Resorts, playas inmaculadas, Saona, golf", typicalPriceFromMad: 620, minObserved: 380, flightTime: "10h directo", bestMonths: ["Diciembre", "Enero", "Febrero", "Marzo"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 9, bScore: 8, winner: "a", note: "Cancún Iberia/Air Europa MAD-CUN directo. Punta Cana también directo, ligeramente más caro." },
      { label: "Variedad playas", aScore: 9, bScore: 10, winner: "b", note: "Punta Cana playas más blancas e inmaculadas (Bavaro). Cancún playas excelentes pero más urbano." },
      { label: "Cultura local", aScore: 10, bScore: 6, winner: "a", note: "Cancún base para Tulum + Chichén Itzá + cenotes + Mérida. Punta Cana cultura limitada fuera resort." },
      { label: "Resorts todo incluido", aScore: 8, bScore: 10, winner: "b", note: "Punta Cana es la capital mundial de all-inclusive. Cancún tiene resorts pero menos especializado." },
      { label: "Gastronomía local", aScore: 10, bScore: 7, winner: "a", note: "México ofrece street food + cocina regional excelente. RD comida más limitada en variedad." },
      { label: "Coste vacaciones 7 días", aScore: 7, bScore: 8, winner: "b", note: "Punta Cana all-inclusive €1100-1500 7 días. Cancún flexible pero similar precio." },
      { label: "Seguridad", aScore: 7, bScore: 9, winner: "b", note: "Punta Cana percepción más segura (resorts cerrados). Cancún seguro en zona hotelera, cuidado fuera." },
    ],
    verdict: "Si buscas vacaciones puras todo incluido sin moverte, Punta Cana gana claramente: especialización resort + playas top + simplicidad. Si quieres combinar playa + cultura + experiencias, Cancún sin duda: ruinas mayas + cenotes + Tulum + gastronomía mexicana son experiencia más rica. Para luna de miel sin estrés, Punta Cana. Para descubrimiento cultural + playa, Cancún.",
    pickA: ["Buscas combinar playa + cultura", "Te apasiona gastronomía mexicana", "Quieres ver ruinas mayas/cenotes", "Vas con espíritu explorador"],
    pickB: ["Buscas vacaciones puras de relax", "Vas en luna de miel", "Quieres todo incluido sin pensar", "Te gusta golf"],
  },
);

// abr-2026bb: +5 comparativas (target 20 total).
COMPARISONS.push(
  {
    slug: "berlin-vs-praga-fin-de-semana",
    title: "Berlín vs Praga: cuál escapada de fin de semana en 2026",
    description: "Comparativa Berlín (Alemania) vs Praga (Rep. Checa) para fin de semana cultural: vuelos, gastronomía, vida nocturna, museos.",
    a: { name: "Berlín", iata: "BER", country: "Alemania", emoji: "🐻", tagline: "Historia siglo XX, vida alternativa, museos top", typicalPriceFromMad: 145, minObserved: 38, flightTime: "3h", bestMonths: ["Mayo", "Junio", "Septiembre"] },
    b: { name: "Praga", iata: "PRG", country: "Rep. Checa", emoji: "🏰", tagline: "Cien torres, cerveza checa, casco gótico", typicalPriceFromMad: 95, minObserved: 28, flightTime: "2h 45min", bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 7, bScore: 9, winner: "b", note: "Praga desde €28. Berlín desde €38, frecuencia menor." },
      { label: "Volumen cultural", aScore: 10, bScore: 8, winner: "a", note: "Berlín: 170+ museos, Memorial, Museum Island. Praga: bonita pero menos profunda." },
      { label: "Vida nocturna", aScore: 10, bScore: 8, winner: "a", note: "Berlín techno + clubs 24h. Praga clásica más tradicional." },
      { label: "Walkability", aScore: 7, bScore: 10, winner: "b", note: "Praga compacta. Berlín exige metro, distancias enormes." },
      { label: "Coste vacaciones", aScore: 6, bScore: 9, winner: "b", note: "Praga 30% más barata en hotel y comida que Berlín." },
      { label: "Saturación turística", aScore: 7, bScore: 4, winner: "a", note: "Berlín se diluye por tamaño. Praga centro saturadísimo." },
      { label: "Comida única", aScore: 7, bScore: 9, winner: "b", note: "Praga: pivo + goulash auténticos. Berlín: variedad pero menos único." },
    ],
    verdict: "Si tienes 2 días, Praga: más concentrada, andable, barata. Si tienes 4+ días o eres outdoor/cultura profunda, Berlín: museos top, vida nocturna potente, ciudad enorme con muchos barrios distintos. Para primer viaje a Europa Central, Praga. Para segundo o ciudad-grande, Berlín.",
    pickA: ["Tienes 4+ días", "Buscas vida nocturna alternativa", "Te apasiona historia siglo XX", "Quieres ciudad grande con muchos barrios"],
    pickB: ["Tienes 2-3 días", "Buscas presupuesto ajustado", "Quieres caminar todo", "Es tu primera vez Europa Central"],
  },
  {
    slug: "madrid-vs-roma-fin-de-semana",
    title: "Madrid vs Roma: cuál capital prefieres para escapada europea",
    description: "Comparativa Madrid vs Roma para fin de semana: cultura, gastronomía, vida nocturna, walkability, precio. Decisión para residentes BCN/Norte.",
    a: { name: "Madrid", iata: "MAD", country: "España", emoji: "🐻", tagline: "Capital cultural, museos top, tapas, vida 24/7", typicalPriceFromMad: 0, minObserved: 0, flightTime: "AVE/vuelo", bestMonths: ["Abril", "Mayo", "Octubre", "Noviembre"] },
    b: { name: "Roma", iata: "FCO", country: "Italia", emoji: "🏛️", tagline: "Coliseo, Vaticano, pasta, 2500 años de historia", typicalPriceFromMad: 95, minObserved: 22, flightTime: "2h 30min", bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"] },
    criteria: [
      { label: "Vuelo/tren desde resto España", aScore: 9, bScore: 8, winner: "a", note: "Madrid AVE conectada toda España. Roma vuelo €22-95 ida." },
      { label: "Patrimonio histórico", aScore: 8, bScore: 10, winner: "b", note: "Roma 2500 años continuos. Madrid 500 años de capitalidad." },
      { label: "Variedad gastronomía", aScore: 10, bScore: 9, winner: "a", note: "Madrid: cocina internacional + tapas. Roma: cocina romana profunda pero más concentrada." },
      { label: "Idioma extranjero", aScore: 5, bScore: 9, winner: "b", note: "Roma cambio de idioma + país. Madrid sin friccion." },
      { label: "Vida nocturna", aScore: 10, bScore: 8, winner: "a", note: "Madrid bares 4am, escena diversa. Roma cierra 1am, más tradicional." },
      { label: "Walkability", aScore: 8, bScore: 7, winner: "a", note: "Madrid metro impecable. Roma centro turístico saturado, taxis caros." },
      { label: "Trampas turísticas", aScore: 8, bScore: 4, winner: "a", note: "Roma centro lleno de timos. Madrid menos hostil." },
    ],
    verdict: "Para residente español que ya conoce Madrid, Roma sin duda: es viaje real al extranjero, patrimonio único. Para residente otro país europeo, Madrid: capital cultural infravalorada, mejor precio que Roma. Para escapada cultural pura sin contar idioma extranjero, Roma es 8/10 vs Madrid 9/10.",
    pickA: ["Eres extranjero, primera vez España", "Te apasiona pintura clásica (Prado)", "Quieres vida nocturna distribuida", "Es tu primera escapada Europa"],
    pickB: ["Vives en España y nunca has ido a Roma", "Te apasiona historia romana", "Quieres cambio idioma + país", "Buscas Vaticano + Coliseo"],
  },
  {
    slug: "barcelona-vs-lisboa-fin-de-semana",
    title: "Barcelona vs Lisboa: dos ciudades atlánticas comparadas",
    description: "Comparativa BCN vs LIS para fin de semana: vuelo, gastronomía, walkability, playa, precio. Para residentes Madrid/Norte que dudan.",
    a: { name: "Barcelona", iata: "BCN", country: "España", emoji: "🏛️", tagline: "Gaudí, Modernismo, playa urbana, vermut", typicalPriceFromMad: 0, minObserved: 0, flightTime: "AVE 2h30min", bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"] },
    b: { name: "Lisboa", iata: "LIS", country: "Portugal", emoji: "🚋", tagline: "Tranvía 28, fado, pasteis, ribera Tajo", typicalPriceFromMad: 78, minObserved: 9, flightTime: "1h 15min", bestMonths: ["Febrero", "Marzo", "Octubre", "Noviembre"] },
    criteria: [
      { label: "Coste vuelo desde Madrid", aScore: 7, bScore: 10, winner: "b", note: "Lisboa €9 ida. BCN AVE €40-80." },
      { label: "Modernismo / arquitectura", aScore: 10, bScore: 8, winner: "a", note: "BCN tiene Gaudí completo. Lisboa azulejos pero menos único." },
      { label: "Playa", aScore: 10, bScore: 7, winner: "a", note: "Barceloneta a 15min metro. Lisboa playa requiere Cascais (40min tren)." },
      { label: "Coste vacaciones", aScore: 7, bScore: 9, winner: "b", note: "Lisboa 25-30% más barata que BCN en hotel y comida." },
      { label: "Walkability", aScore: 9, bScore: 9, winner: "tie", note: "Empate. Ambas compactas." },
      { label: "Gastronomía única", aScore: 9, bScore: 9, winner: "tie", note: "BCN: vermut + tapas mediterráneas. Lisboa: bacalhau + pasteis." },
      { label: "Saturación turística (menos = mejor)", aScore: 4, bScore: 5, winner: "b", note: "BCN más saturada. Lisboa también pero menos densamente." },
    ],
    verdict: "Si vives en Madrid y nunca has ido a Lisboa, Lisboa: vuelo barato, sensación viaje, presupuesto bajo. Si ya conoces Lisboa o quieres playa + ciudad combinados, BCN imbatible. Para escapada presupuesto pareja, Lisboa. Para combinar mar + cultura + comida, BCN.",
    pickA: ["Quieres combinar ciudad + playa", "Te apasiona modernismo", "Tu presupuesto es flexible", "Vives lejos de Madrid (BCN AVE conveniente)"],
    pickB: ["Buscas presupuesto mínimo", "Quieres viaje al extranjero rápido", "Te gusta caminar por colinas", "Vives en Madrid"],
  },
  {
    slug: "mexico-vs-buenos-aires-latinoamerica",
    title: "Ciudad de México vs Buenos Aires: cuál visitar primero desde España",
    description: "Comparativa real CDMX vs BUE para hispanohablante: vuelos, gastronomía, cultura, vida nocturna, costes. Para tu primera Latinoamérica.",
    a: { name: "Ciudad de México", iata: "MEX", country: "México", emoji: "🌮", tagline: "Tacos, Frida, mariachis, ruinas precolombinas cerca", typicalPriceFromMad: 720, minObserved: 410, flightTime: "11h directo", bestMonths: ["Octubre", "Noviembre", "Marzo", "Abril"] },
    b: { name: "Buenos Aires", iata: "EZE", country: "Argentina", emoji: "🥩", tagline: "Tango, asado, librerías, San Telmo", typicalPriceFromMad: 750, minObserved: 380, flightTime: "13h directo", bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 9, bScore: 8, winner: "a", note: "MEX 11h vs BUE 13h. Frecuencia similar Iberia/Aeroméxico." },
      { label: "Gastronomía única", aScore: 10, bScore: 9, winner: "a", note: "México capital street food + 7 cocinas regionales. BUE asado + pasta excelentes pero menos variedad." },
      { label: "Patrimonio precolombino", aScore: 10, bScore: 4, winner: "a", note: "MEX tiene Teotihuacán, Templo Mayor, museo Antropología top mundial. BUE no tiene esto." },
      { label: "Vida cultural urbana", aScore: 9, bScore: 10, winner: "b", note: "BUE más europeizada, librerías, teatros, tango. MEX más vibrante pero caótica." },
      { label: "Coste vida en destino", aScore: 8, bScore: 9, winner: "b", note: "Argentina con dolar blue es brutalmente barata para extranjeros. México decente pero menos extremo." },
      { label: "Seguridad percibida", aScore: 6, bScore: 7, winner: "b", note: "Ambas tienen zonas inseguras. BUE percepción ligeramente mejor en barrios turísticos." },
      { label: "Día/noche atractivo", aScore: 9, bScore: 9, winner: "tie", note: "Empate. Ambas mantienen actividad 24/7." },
    ],
    verdict: "Si nunca has estado en Latinoamérica, México: gastronomía + ruinas + cultura precolombina son experiencia más rica para 7-10 días. Si ya conoces México o eres más cultural-europeísta, BUE: librerías, tango, asado, sensación cosmopolita única en Latam. Para combo: MAD-MEX-BUE-MAD en 14 días con LATAM internal.",
    pickA: ["Es tu primera Latinoamérica", "Te apasiona la gastronomía", "Quieres ver ruinas precolombinas", "Buscas variedad de microclimas (Yucatán, costa)"],
    pickB: ["Ya conoces México", "Buscas ambiente más europeo-latinoamericano", "Tu presupuesto en destino es ajustado", "Te apasiona el tango/literatura"],
  },
  {
    slug: "maldivas-vs-seychelles-luna-miel",
    title: "Maldivas vs Seychelles: comparativa para luna de miel desde España",
    description: "Comparativa Maldivas vs Seychelles para luna de miel: vuelos, resorts, playas, snorkel/buceo, costes, romanticismo. Decisión clave 2026.",
    a: { name: "Maldivas", iata: "MLE", country: "Maldivas, Océano Índico", emoji: "🏝️", tagline: "Bungalows sobre agua, atolones, snorkel top mundial", typicalPriceFromMad: 920, minObserved: 580, flightTime: "13h con escala", bestMonths: ["Diciembre", "Enero", "Febrero", "Marzo", "Abril"] },
    b: { name: "Seychelles", iata: "SEZ", country: "Seychelles, África Oriental", emoji: "🌊", tagline: "Playas Anse Source d'Argent, naturaleza tropical, granito", typicalPriceFromMad: 1050, minObserved: 720, flightTime: "14h con escala", bestMonths: ["Abril", "Mayo", "Octubre", "Noviembre"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 8, bScore: 7, winner: "a", note: "Maldivas mejor frecuencia y precio que Seychelles. Ambos requieren conexión." },
      { label: "Bungalows sobre agua icónicos", aScore: 10, bScore: 5, winner: "a", note: "Maldivas inventó este formato. Seychelles tiene algunos pero menos icónicos." },
      { label: "Playas variedad", aScore: 7, bScore: 10, winner: "b", note: "Seychelles tiene playas de granito únicas (Anse Source d'Argent). Maldivas blanco perfecto pero más uniforme." },
      { label: "Snorkel y buceo", aScore: 10, bScore: 8, winner: "a", note: "Maldivas top mundial: tiburones ballena, mantas, corales. Seychelles bueno pero menos espectacular." },
      { label: "Naturaleza terrestre", aScore: 4, bScore: 10, winner: "b", note: "Seychelles selva, granito, fauna endémica. Maldivas atolones planos sin vida terrestre relevante." },
      { label: "Coste todo incluido 7 días", aScore: 7, bScore: 6, winner: "a", note: "Maldivas más resorts económicos. Seychelles más boutique caro." },
      { label: "Romanticismo isolation", aScore: 10, bScore: 8, winner: "a", note: "Maldivas atolones aislados = pareja sola. Seychelles más interconectada." },
    ],
    verdict: "Para luna de miel pura aislada, Maldivas: bungalows sobre agua, snorkel top, romanticismo. Para luna de miel + naturaleza terrestre + playas Instagram (Anse Source d'Argent), Seychelles. Combo perfecto: 5 días Maldivas + 4 días Seychelles si presupuesto lo permite. Para presupuesto único, Maldivas más versátil.",
    pickA: ["Buscas aislamiento total", "Te apasiona snorkel/buceo", "Quieres bungalow sobre agua", "Tu presupuesto es €4-8K pareja"],
    pickB: ["Quieres playas Instagram únicas", "Te interesa naturaleza terrestre + selva", "Tu presupuesto es €6-12K pareja", "Quieres combinar varias islas"],
  },
);

// abr-2026cc: +5 comparativas (target 25 total).
COMPARISONS.push(
  {
    slug: "madrid-vs-berlin-fin-de-semana",
    title: "Madrid vs Berlín: cuál escapada europea elegir 2026",
    description: "Comparativa Madrid vs Berlín para fin de semana cultural: vuelos, museos, gastronomía, vida nocturna, walkability. Para residentes BCN o internacional.",
    a: { name: "Madrid", iata: "MAD", country: "España", emoji: "🐻", tagline: "Capital cultural, museos top, tapas 24/7", typicalPriceFromMad: 0, minObserved: 0, flightTime: "AVE/vuelo", bestMonths: ["Abril", "Mayo", "Octubre", "Noviembre"] },
    b: { name: "Berlín", iata: "BER", country: "Alemania", emoji: "🐻", tagline: "Memorial, vida alternativa, techno 24h", typicalPriceFromMad: 145, minObserved: 38, flightTime: "3h", bestMonths: ["Mayo", "Junio", "Septiembre"] },
    criteria: [
      { label: "Vuelo", aScore: 9, bScore: 8, winner: "a", note: "Madrid AVE conectada toda España. Berlín requiere vuelo €38-145." },
      { label: "Museos top", aScore: 10, bScore: 10, winner: "tie", note: "Empate. Madrid: Prado, Reina Sofía, Thyssen. Berlín: Museum Island (5 museos juntos)." },
      { label: "Vida nocturna", aScore: 9, bScore: 10, winner: "b", note: "Berlín: techno legendario, Berghain, clubs 24h. Madrid: bares y tapeo." },
      { label: "Coste comida y bebida", aScore: 8, bScore: 7, winner: "a", note: "Madrid 15-20% más barata que Berlín en restaurantes." },
      { label: "Walkability", aScore: 8, bScore: 7, winner: "a", note: "Madrid centro andable. Berlín distancias enormes, requiere metro." },
      { label: "Patrimonio histórico siglo XX", aScore: 6, bScore: 10, winner: "b", note: "Berlín único: Memorial Holocausto, Mauer, Reichstag. Madrid menos protagonista." },
      { label: "Saturación turística", aScore: 7, bScore: 8, winner: "b", note: "Berlín se diluye más por tamaño. Madrid centro saturado en Sol/Gran Vía." },
    ],
    verdict: "Si vives en España y nunca has ido a Berlín, Berlín: cambio de país + idioma + vida nocturna alternativa única. Si ya conoces Berlín o eres extranjero buscando capital cultural, Madrid: museos top mundial, gastronomía variada, ambiente español auténtico. Para combinar: AVE Madrid + vuelo Berlín en mismo viaje.",
    pickA: ["Eres extranjero, primera vez España", "Buscas museos top + gastronomía", "Vienes en grupo familiar", "Tu presupuesto es ajustado"],
    pickB: ["Vives en España, buscas extranjero", "Te apasiona historia siglo XX", "Te encanta vida nocturna alternativa", "Eres outdoor / hipster"],
  },
  {
    slug: "bali-vs-maldivas-luna-miel",
    title: "Bali vs Maldivas: comparativa para luna de miel 2026",
    description: "Bali vs Maldivas para luna de miel desde España: precio, romanticismo, snorkel, gastronomía, isolation. Análisis para parejas decidiendo destino.",
    a: { name: "Bali", iata: "DPS", country: "Indonesia", emoji: "🌴", tagline: "Templos, arrozales, surf, yoga retreats", typicalPriceFromMad: 720, minObserved: 480, flightTime: "18-22h con escala", bestMonths: ["Mayo", "Junio", "Septiembre", "Octubre"] },
    b: { name: "Maldivas", iata: "MLE", country: "Maldivas, Océano Índico", emoji: "🏝️", tagline: "Bungalows agua, atolones, snorkel top mundial", typicalPriceFromMad: 920, minObserved: 580, flightTime: "13h con escala", bestMonths: ["Diciembre", "Enero", "Febrero", "Marzo", "Abril"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 7, bScore: 8, winner: "b", note: "Maldivas vía DOH 13h. Bali requiere 18-22h con 1-2 escalas." },
      { label: "Romanticismo aislamiento", aScore: 7, bScore: 10, winner: "b", note: "Maldivas atolones aislados = pareja sola. Bali más interconectada y turística." },
      { label: "Variedad experiencias", aScore: 10, bScore: 5, winner: "a", note: "Bali: cultura + surf + arrozales + yoga + playas + Ubud. Maldivas: snorkel + relax + isla." },
      { label: "Gastronomía", aScore: 9, bScore: 6, winner: "a", note: "Bali tiene cocina indonesia + opciones internacionales. Maldivas comida resort básica." },
      { label: "Bungalows sobre agua", aScore: 5, bScore: 10, winner: "b", note: "Maldivas inventó este formato icónico. Bali tiene algunos pero menos canónicos." },
      { label: "Coste todo incluido 7 días", aScore: 8, bScore: 5, winner: "a", note: "Bali villa privada + comida €1500-2500 pareja. Maldivas resort €4000-6000+." },
      { label: "Snorkel y buceo", aScore: 8, bScore: 10, winner: "b", note: "Maldivas top mundial corales, mantas, tiburones ballena. Bali bueno pero menos espectacular." },
    ],
    verdict: "Para luna de miel relax pura aislada con bungalow agua, Maldivas. Para luna de miel con variedad (cultura + surf + yoga + playa) y presupuesto controlado, Bali. Combo top 14 días: 7 Bali (variedad) + 7 Maldivas (aislamiento puro). Para presupuesto ajustado, Bali. Para experiencia singular y bucket-list, Maldivas.",
    pickA: ["Quieres variedad de experiencias", "Te apasiona surf, yoga o cultura", "Tu presupuesto es €1500-3000 pareja", "Tienes 10+ días"],
    pickB: ["Buscas isolation total", "Te encanta snorkel/buceo", "Tu presupuesto es €5000+ pareja", "Es tu luna de miel definitiva"],
  },
  {
    slug: "cuba-vs-republica-dominicana-caribe",
    title: "Cuba vs Rep. Dominicana: cuál visitar para vacaciones Caribe 2026",
    description: "Cuba vs RD para vacaciones desde España: vuelos, playas, cultura, gastronomía, todo incluido. Decisión clave para tu próximo viaje Caribe.",
    a: { name: "La Habana", iata: "HAV", country: "Cuba", emoji: "🚗", tagline: "Coches clásicos, salsa, Habana Vieja, ron", typicalPriceFromMad: 520, minObserved: 280, flightTime: "9h directo", bestMonths: ["Enero", "Febrero", "Marzo", "Noviembre", "Diciembre"] },
    b: { name: "Punta Cana", iata: "PUJ", country: "Rep. Dominicana", emoji: "🌴", tagline: "Resorts all-inclusive, Bávaro, Saona", typicalPriceFromMad: 620, minObserved: 380, flightTime: "10h directo", bestMonths: ["Diciembre", "Enero", "Febrero", "Marzo"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 9, bScore: 8, winner: "a", note: "Cuba vía Iberia/Air Europa MAD-HAV €280-520. RD MAD-PUJ €380-620." },
      { label: "Cultura local", aScore: 10, bScore: 6, winner: "a", note: "Cuba inmersión cultural intensa: arquitectura, salsa, vida de calle. RD más turística-resort." },
      { label: "Resorts todo incluido", aScore: 5, bScore: 10, winner: "b", note: "RD es la capital all-inclusive del mundo. Cuba tiene resorts pero menos especializados." },
      { label: "Playas inmaculadas", aScore: 7, bScore: 10, winner: "b", note: "RD: Bávaro, Saona top mundial. Cuba: Varadero bonita pero menos espectacular." },
      { label: "Coste vacaciones", aScore: 9, bScore: 7, winner: "a", note: "Cuba en pesos cubanos sale extremadamente barata. RD all-inclusive €1100-1500/persona 7 días." },
      { label: "Idioma + facilidad", aScore: 10, bScore: 9, winner: "a", note: "Ambos español pero Cuba más auténtico. RD más anglicismos turísticos." },
      { label: "Seguridad percibida", aScore: 8, bScore: 8, winner: "tie", note: "Empate. Ambas seguras en zonas turísticas, precaución fuera de centros." },
    ],
    verdict: "Para inmersión cultural + presupuesto ajustado, Cuba: arquitectura, música, salsa, vida real. Para vacaciones all-inclusive sin pensar, RD: resorts especializados + playas top + simplicidad. Combo perfecto: vuela a Cuba, visita La Habana 4 días, vuelo interno a Trinidad/Varadero. RD si quieres relax puro 7 días.",
    pickA: ["Buscas inmersión cultural auténtica", "Tu presupuesto es ajustado", "Te apasiona música/salsa", "Eres viajero independiente"],
    pickB: ["Buscas vacaciones todo incluido", "Vas con familia/niños", "Quieres playa de calidad mundial", "Tu presupuesto es €1500+/persona"],
  },
  {
    slug: "tailandia-vs-vietnam-sudeste-asiatico",
    title: "Tailandia vs Vietnam: cuál visitar primero en sudeste asiático",
    description: "Comparativa Tailandia vs Vietnam para tu primera Asia: vuelos, gastronomía, cultura, paisajes, costos, accesibilidad. Decisión clave 14 días.",
    a: { name: "Tailandia", iata: "BKK", country: "Tailandia", emoji: "🛕", tagline: "Bangkok urbano + islas paradisíacas", typicalPriceFromMad: 475, minObserved: 298, flightTime: "13-14h con escala", bestMonths: ["Noviembre", "Diciembre", "Enero", "Febrero"] },
    b: { name: "Vietnam", iata: "HAN", country: "Vietnam", emoji: "🍜", tagline: "Hanoi, Halong Bay, Saigón, comida callejera", typicalPriceFromMad: 595, minObserved: 380, flightTime: "14-16h con escala", bestMonths: ["Octubre", "Noviembre", "Diciembre", "Marzo", "Abril"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 9, bScore: 7, winner: "a", note: "Tailandia vía DOH/IST €298-475. Vietnam menos competencia, €380-595." },
      { label: "Variedad paisajes", aScore: 9, bScore: 10, winner: "b", note: "Vietnam: Halong + Sapa + Mekong + playas. Tailandia: islas + Bangkok + Chiang Mai." },
      { label: "Gastronomía callejera", aScore: 10, bScore: 10, winner: "tie", note: "Empate. Bangkok capital street-food. Vietnam pho/banh mi excepcionales." },
      { label: "Coste vida en destino", aScore: 9, bScore: 10, winner: "b", note: "Vietnam ligeramente más barato. Tailandia turística pero también muy barata." },
      { label: "Playas", aScore: 10, bScore: 7, winner: "a", note: "Tailandia: Phi Phi, Krabi, Koh Samui top mundial. Vietnam: Phu Quoc, An Bang más sencillas." },
      { label: "Idioma e inglés", aScore: 7, bScore: 6, winner: "a", note: "Tailandia más turística → inglés más extendido. Vietnam más limitado fuera ciudades grandes." },
      { label: "Saturación turística", aScore: 5, bScore: 8, winner: "b", note: "Tailandia muy turística (Phuket, Bangkok). Vietnam menos saturado, más auténtico aún." },
    ],
    verdict: "Para primera Asia con foco playa + cultura, Tailandia: más completa, mejor logística, comida calle top. Para experiencia más auténtica + paisajes únicos (Halong, Sapa), Vietnam: menos turístico, más barato, gastronomía excepcional. Combo ideal: 14 días Vietnam + extensión 7 días Tailandia (vuelo BKK-Saigon económico).",
    pickA: ["Es tu primer viaje Asia", "Buscas combinar ciudad + islas + cultura", "Quieres mejor logística turística", "Vas con niños"],
    pickB: ["Ya conoces Tailandia", "Buscas experiencia más auténtica/aventurera", "Te apasiona gastronomía callejera", "Eres viajero independiente"],
  },
  {
    slug: "marrakech-vs-cairo-norte-africa",
    title: "Marrakech vs El Cairo: cuál visitar primero en Norte de África",
    description: "Comparativa Marrakech (Marruecos) vs El Cairo (Egipto) para tu primer viaje Norte de África: vuelos, patrimonio, gastronomía, seguridad, costes.",
    a: { name: "Marrakech", iata: "RAK", country: "Marruecos", emoji: "🐪", tagline: "Zocos, Majorelle, riads, comida marroquí", typicalPriceFromMad: 125, minObserved: 18, flightTime: "3h directo", bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"] },
    b: { name: "El Cairo", iata: "CAI", country: "Egipto", emoji: "🐫", tagline: "Pirámides, Esfinge, Museo Egipcio, Khan el-Khalili", typicalPriceFromMad: 380, minObserved: 195, flightTime: "4h 30min", bestMonths: ["Octubre", "Noviembre", "Diciembre", "Febrero", "Marzo"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 10, bScore: 7, winner: "a", note: "Marrakech vuelo Ryanair €18 ida. Cairo €195-380." },
      { label: "Patrimonio único mundial", aScore: 7, bScore: 10, winner: "b", note: "Cairo: Pirámides + Esfinge son únicas. Marrakech bonita pero patrimonio menos icónico." },
      { label: "Gastronomía", aScore: 9, bScore: 7, winner: "a", note: "Marrakech: tagine, couscous, pastillas excepcionales. Cairo buena pero menos memorable." },
      { label: "Walkability", aScore: 9, bScore: 5, winner: "a", note: "Marrakech medina compacta y andable. Cairo distancias enormes, tráfico caótico." },
      { label: "Seguridad percibida", aScore: 8, bScore: 6, winner: "a", note: "Marrakech relativamente segura zonas turísticas. Cairo más caótico, requiere precaución." },
      { label: "Idioma facilidad", aScore: 8, bScore: 6, winner: "a", note: "Marrakech: francés + español funcional. Cairo árabe + inglés básico." },
      { label: "Días recomendados", aScore: 8, bScore: 9, winner: "b", note: "Marrakech: 3-4 días suficientes. Cairo: 4-5 días + extensión Luxor." },
    ],
    verdict: "Para primera vez Norte de África con presupuesto controlado y solo 3-4 días, Marrakech: vuelo barato, accesible, inmersivo. Para experiencia patrimonio único mundial (Pirámides) + 5+ días, Cairo: imprescindible si te apasiona historia antigua. Combo ideal: vuela a Marrakech 4 días, vuelo interno (€150) a El Cairo 5 días + Luxor.",
    pickA: ["Tu presupuesto es ajustado", "Buscas escapada 3-4 días", "Te encanta gastronomía mediterránea", "Es tu primera vez Norte de África"],
    pickB: ["Te apasiona historia antigua", "Tienes 5+ días", "Quieres ver Pirámides + Esfinge", "Tu presupuesto es flexible"],
  },
);

// abr-2026dd: +5 comparativas (target 30 total).
COMPARISONS.push(
  {
    slug: "madrid-vs-marrakech-escapada",
    title: "Madrid vs Marrakech: cuál escapada exótica desde España",
    description: "Comparativa Madrid (escapada interna) vs Marrakech (escapada exótica) para fin de semana: precio, cultura, gastronomía, walkability.",
    a: { name: "Madrid", iata: "MAD", country: "España", emoji: "🐻", tagline: "Capital cultural, museos top, tapas auténticas", typicalPriceFromMad: 0, minObserved: 0, flightTime: "AVE/vuelo", bestMonths: ["Abril", "Mayo", "Octubre", "Noviembre"] },
    b: { name: "Marrakech", iata: "RAK", country: "Marruecos", emoji: "🐪", tagline: "Zocos, Majorelle, riads tradicionales", typicalPriceFromMad: 125, minObserved: 18, flightTime: "3h", bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"] },
    criteria: [
      { label: "Coste vuelo desde España", aScore: 9, bScore: 10, winner: "b", note: "Marrakech €18-125. Madrid AVE €40-80." },
      { label: "Cambio idioma + cultura", aScore: 4, bScore: 10, winner: "b", note: "Marrakech sensación de viaje real. Madrid sin fricción." },
      { label: "Walkability", aScore: 8, bScore: 9, winner: "b", note: "Marrakech medina compacta. Madrid centro andable pero más extenso." },
      { label: "Coste comida + hotel", aScore: 7, bScore: 9, winner: "b", note: "Marrakech 30-40% más barato que Madrid en alojamiento y comida." },
      { label: "Volumen cultural", aScore: 10, bScore: 7, winner: "a", note: "Madrid: Prado, Reina Sofía, Thyssen top mundial. Marrakech: medina + Majorelle más concentrado." },
      { label: "Idioma", aScore: 10, bScore: 6, winner: "a", note: "Madrid sin barrera. Marrakech francés + español funcional pero requiere más esfuerzo." },
      { label: "Saturación turística", aScore: 7, bScore: 4, winner: "a", note: "Madrid se diluye más por tamaño. Marrakech medina muy turística." },
    ],
    verdict: "Si quieres escapada de extranjero con presupuesto controlado, Marrakech: vuelo Ryanair €18, sensación viaje real, presupuesto hotel y comida bajo. Si quieres reset cultural sin friccion idioma, Madrid: museos top + tapas. Para residente español no acostumbrado a Norte de África, Marrakech es nivel siguiente de exploración.",
    pickA: ["Eres extranjero, primera vez España", "Buscas reset cultural sin idioma extranjero", "Te apasiona pintura clásica", "Vas con familia o adultos mayores"],
    pickB: ["Vives en España, buscas viaje real al extranjero", "Tu presupuesto es ajustado", "Te encanta regatear en zocos", "Quieres sensación inmersiva exótica"],
  },
  {
    slug: "bangkok-vs-tokio-asia",
    title: "Bangkok vs Tokio: cuál capital asiática elegir 2026",
    description: "Bangkok vs Tokio para tu primera Asia: precios, gastronomía, vida nocturna, cultura, infraestructura. Decisión clave para 7-10 días.",
    a: { name: "Bangkok", iata: "BKK", country: "Tailandia", emoji: "🛕", tagline: "Templos, comida calle, vida 24/7, masajes", typicalPriceFromMad: 475, minObserved: 298, flightTime: "13-14h con escala", bestMonths: ["Noviembre", "Diciembre", "Enero", "Febrero"] },
    b: { name: "Tokio", iata: "NRT", country: "Japón", emoji: "🗼", tagline: "Tradición + neón, sushi top, trenes bala", typicalPriceFromMad: 980, minObserved: 480, flightTime: "11-14h con escala", bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 9, bScore: 8, winner: "a", note: "Bangkok €298-475. Tokio €480-980 — el doble." },
      { label: "Coste vida en destino", aScore: 10, bScore: 5, winner: "a", note: "Bangkok 60-70% más barato que Tokio. Hotel decente €30-60 vs €120-180 Tokio." },
      { label: "Volumen cultural único", aScore: 8, bScore: 10, winner: "b", note: "Tokio único globalmente. Bangkok excelente pero más típico sudeste asiático." },
      { label: "Gastronomía", aScore: 10, bScore: 10, winner: "tie", note: "Empate. Bangkok capital street-food + 5 cocinas regionales. Tokio sushi/ramen referenciales mundialmente." },
      { label: "Infraestructura/seguridad", aScore: 7, bScore: 10, winner: "b", note: "Tokio: limpieza + transporte impecable. Bangkok: tráfico caótico, smog en marzo-abril." },
      { label: "Vida nocturna", aScore: 9, bScore: 9, winner: "tie", note: "Empate. Bangkok: vida 24/7. Tokio: bares hasta 5am, izakayas únicos." },
      { label: "Idioma e inglés", aScore: 7, bScore: 5, winner: "a", note: "Bangkok más turístico → inglés más extendido. Tokio funcional pero limitado." },
    ],
    verdict: "Si es tu primera Asia y tu presupuesto es ajustado, Bangkok: precio + variedad + comida brutal. Si es tu primera Asia y presupuesto es €2500+/persona, Tokio: experiencia única, infraestructura impecable, gastronomía premium. Combo top: Bangkok 5 días + Tokio 7 días en mismo viaje, vuelo BKK-NRT €280.",
    pickA: ["Es tu primera Asia y presupuesto ajustado", "Quieres comida calle y mercados", "Te apasiona masajes/wellness", "Tienes solo 5-7 días"],
    pickB: ["Es tu primera Asia y presupuesto flexible", "Te apasiona cultura única + tradición", "Buscas experiencia visual single", "Tienes 10+ días"],
  },
  {
    slug: "cancun-vs-bali-luna-miel",
    title: "Cancún vs Bali: cuál luna de miel para parejas españolas 2026",
    description: "Cancún vs Bali para luna de miel: precios, romanticismo, naturaleza, gastronomía, accesibilidad. Decisión clave 10-14 días.",
    a: { name: "Cancún", iata: "CUN", country: "México", emoji: "🐚", tagline: "Caribe mexicano, ruinas mayas, cenotes", typicalPriceFromMad: 580, minObserved: 320, flightTime: "11h directo", bestMonths: ["Diciembre", "Enero", "Febrero", "Marzo", "Abril"] },
    b: { name: "Bali", iata: "DPS", country: "Indonesia", emoji: "🌴", tagline: "Templos, arrozales, surf, yoga, romance Ubud", typicalPriceFromMad: 720, minObserved: 480, flightTime: "18-22h con escala", bestMonths: ["Mayo", "Junio", "Septiembre", "Octubre"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 9, bScore: 6, winner: "a", note: "Cancún 11h directo Iberia/Air Europa. Bali 18-22h con 1-2 escalas." },
      { label: "Variedad experiencias", aScore: 9, bScore: 10, winner: "b", note: "Bali: cultura + surf + yoga + arrozales + playas. Cancún: playa + Tulum + cenotes." },
      { label: "Romanticismo único", aScore: 7, bScore: 10, winner: "b", note: "Ubud (Bali) es la capital del romanticismo asiático. Cancún más resort." },
      { label: "Coste vacaciones 10 días", aScore: 8, bScore: 9, winner: "b", note: "Bali villa privada €60-120/noche. Cancún resort all-inclusive €150-250/noche pareja." },
      { label: "Idioma + facilidad", aScore: 10, bScore: 7, winner: "a", note: "Cancún español nativo. Bali inglés funcional pero menor." },
      { label: "Patrimonio cultural", aScore: 9, bScore: 9, winner: "tie", note: "Empate. Cancún: ruinas mayas (Tulum, Chichén Itzá). Bali: templos + ceremonias hindúes." },
      { label: "Playas top mundial", aScore: 9, bScore: 7, winner: "a", note: "Cancún: playas Caribe blancas inmaculadas. Bali: playas decentes pero menos espectaculares." },
    ],
    verdict: "Para luna de miel relax + cultura precolombina + idioma español, Cancún: vuelo directo, ruinas mayas, gastronomía mexicana. Para luna de miel exótica + variedad experiencias + presupuesto controlado, Bali: vuelo más largo pero coste destino menor. Para presupuesto flexible y querer experiencia singular, Bali. Para presupuesto ajustado y vuelo directo, Cancún.",
    pickA: ["Quieres vuelo directo + idioma español", "Te apasiona historia precolombina", "Buscas playas top + all-inclusive", "Tu presupuesto es €4000-6000 pareja"],
    pickB: ["Buscas experiencia exótica + variedad", "Te apasiona yoga, surf o cultura asiática", "Tu presupuesto es €5000-7000 pareja", "Tienes 12+ días"],
  },
  {
    slug: "praga-vs-viena-fin-de-semana",
    title: "Praga vs Viena: dos capitales centroeuropeas comparadas 2026",
    description: "Praga vs Viena para fin de semana: precio, patrimonio, gastronomía, vida nocturna, walkability. Decisión clásica Europa Central.",
    a: { name: "Praga", iata: "PRG", country: "Rep. Checa", emoji: "🏰", tagline: "Cien torres, gótico, cerveza checa", typicalPriceFromMad: 95, minObserved: 28, flightTime: "2h 45min", bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"] },
    b: { name: "Viena", iata: "VIE", country: "Austria", emoji: "🎵", tagline: "Imperial, Mozart, café histórico, palacios", typicalPriceFromMad: 165, minObserved: 65, flightTime: "3h", bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 9, bScore: 7, winner: "a", note: "Praga €28-95. Viena €65-165, menos competencia low-cost." },
      { label: "Patrimonio histórico", aScore: 9, bScore: 10, winner: "b", note: "Viena imperial Habsburg + palacios. Praga gótico + barroco extensos." },
      { label: "Coste vida en destino", aScore: 9, bScore: 6, winner: "a", note: "Praga 35-40% más barata que Viena. Cerveza Praga €2.50, Viena €5.50." },
      { label: "Música clásica", aScore: 6, bScore: 10, winner: "b", note: "Viena: Ópera Estatal + conciertos diarios + Mozart/Beethoven. Praga buena pero menor." },
      { label: "Café histórico", aScore: 7, bScore: 10, winner: "b", note: "Viena cafés famosos: Central, Sacher, Demel. Praga buenos cafés pero menos icónicos." },
      { label: "Vida nocturna", aScore: 9, bScore: 7, winner: "a", note: "Praga: cerveza tradicional + clubs alternativos. Viena más conservadora hasta 1am." },
      { label: "Walkability", aScore: 9, bScore: 9, winner: "tie", note: "Empate. Ambas compactas y andables." },
    ],
    verdict: "Para presupuesto ajustado + cerveza + ambiente joven, Praga. Para experiencia imperial + ópera + cafés legendarios, Viena. Combo perfecto: tren Praga-Viena (4h, €30) en mismo viaje, conoces ambas en 6-7 días.",
    pickA: ["Tu presupuesto es ajustado", "Te encanta cerveza tradicional", "Buscas vida nocturna alternativa", "Vives en España (vuelo más barato)"],
    pickB: ["Te apasiona música clásica/ópera", "Buscas experiencia imperial-histórica", "Tu presupuesto es flexible", "Vas con adultos mayores"],
  },
  {
    slug: "estambul-vs-atenas-cultura-historica",
    title: "Estambul vs Atenas: cuál escapada cultural histórica elegir 2026",
    description: "Estambul vs Atenas para escapada cultural: vuelos, patrimonio, gastronomía, walkability, costos. Para amantes de historia antigua.",
    a: { name: "Estambul", iata: "IST", country: "Turquía", emoji: "🕌", tagline: "Hagia Sofía, Bósforo, hub Europa-Asia", typicalPriceFromMad: 295, minObserved: 85, flightTime: "4h", bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"] },
    b: { name: "Atenas", iata: "ATH", country: "Grecia", emoji: "🏛️", tagline: "Acrópolis, Plaka, museos arqueológicos", typicalPriceFromMad: 245, minObserved: 75, flightTime: "3h 30min", bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"] },
    criteria: [
      { label: "Vuelo desde España", aScore: 8, bScore: 9, winner: "b", note: "Atenas €75-245 mediana inferior. Estambul €85-295." },
      { label: "Patrimonio milenario", aScore: 10, bScore: 10, winner: "tie", note: "Empate. Estambul 2700 años continuos. Atenas 3500 años de historia." },
      { label: "Gastronomía", aScore: 10, bScore: 9, winner: "a", note: "Estambul: capital mundial gastronomía mediterránea-otomana. Atenas: griega excelente pero menos variedad." },
      { label: "Walkability", aScore: 9, bScore: 10, winner: "b", note: "Atenas centro compacto. Estambul muy extenso, distancias largas." },
      { label: "Coste vida en destino", aScore: 9, bScore: 8, winner: "a", note: "Estambul más barato que Atenas en hotel y comida." },
      { label: "Combinable con extensión", aScore: 8, bScore: 10, winner: "b", note: "Atenas + islas griegas (Mykonos, Santorini). Estambul + Capadocia o Egeo costa." },
      { label: "Saturación turística", aScore: 6, bScore: 5, winner: "a", note: "Atenas centro saturadísimo. Estambul se diluye más por tamaño." },
    ],
    verdict: "Para 4-5 días enfocados en patrimonio único, Estambul: bizantino + otomano excepcional. Para 4-5 días + extensión islas, Atenas: ciudad como base para ver Mykonos/Santorini. Combo perfecto: Estambul + Atenas + isla griega en 14 días con vuelos económicos en TK o Aegean.",
    pickA: ["Buscas patrimonio bizantino + otomano", "Te apasiona gastronomía variada", "Quieres hub para más viajes (Asia/Cáucaso)", "Tienes 4-5 días"],
    pickB: ["Te apasiona Grecia clásica", "Quieres extender a islas griegas", "Tu presupuesto es ajustado", "Eres outdoor (hiking + playa)"],
  },
);

export function getComparisonBySlug(slug: string): DestinationComparison | null {
  return COMPARISONS.find((c) => c.slug === slug) || null;
}
