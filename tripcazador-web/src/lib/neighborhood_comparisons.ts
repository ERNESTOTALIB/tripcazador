/**
 * neighborhood_comparisons.ts — LLLL01 (May 2026)
 *
 * Comparativas head-to-head entre barrios populares para alojarse en
 * ciudades top EU. Captura keywords con alto commercial intent:
 *   "donde dormir en barcelona", "que zona quedarse en roma",
 *   "trastevere vs centro storico", "gotic vs eixample", etc.
 *
 * Cada comparativa lleva a CTA Booking.com con marker afiliado (4-7% comm
 * via Travelpayouts AID 714734). SEO long-tail: searcher con intent claro
 * de reservar tras decidir zona.
 *
 * Patrón replica el éxito de airline_comparisons.ts (30 entries) pero
 * vertical hoteles. No hay competidor ES con este formato a fecha de hoy.
 */

export interface NeighborhoodSide {
  /** Nombre del barrio. */
  name: string;
  /** Emoji representativo (no flag — Satori safe para futuro OG). */
  emoji: string;
  /** Tagline corta posicionamiento (10-14 palabras). */
  tagline: string;
  /** Precio medio noche hotel 3★ doble (€). */
  avgPriceEur: number;
  /** Precio medio noche hotel 4★ doble (€). */
  avgPrice4starEur: number;
  /** Tipo de viajero principal: pareja, mochilero, familia, business, foodie. */
  bestFor: string;
  /** Distancia al centro (minutos andando o metro). */
  centerDistance: string;
  /** Vibe en 1-2 palabras (ej "bohemia turística", "elegante residencial"). */
  vibe: string;
}

export interface NeighborhoodComparison {
  slug: string;
  /** Ciudad (slug minúsculas, ej "barcelona"). Usado para Booking.com city param. */
  citySlug: string;
  /** Nombre de la ciudad en ES para UI. */
  cityName: string;
  title: string;
  description: string;
  /** Mes/temporada en que la comparativa está optimizada. */
  seasonContext: string;
  a: NeighborhoodSide;
  b: NeighborhoodSide;
  criteria: Array<{
    label: string;
    aScore: number; // 1-10
    bScore: number;
    winner: "a" | "b" | "tie";
    note: string;
  }>;
  verdict: string;
  pickA: string[];
  pickB: string[];
  /** Hoteles destacados (3) en el barrio a, con nombre exacto para link Booking. */
  hotelsA: string[];
  /** Hoteles destacados (3) en el barrio b. */
  hotelsB: string[];
}

export const NEIGHBORHOOD_COMPARISONS: NeighborhoodComparison[] = [
  // ─── 1. Barcelona: Barrio Gòtic vs Eixample ────────────────────────
  {
    slug: "barcelona-gotic-vs-eixample",
    citySlug: "barcelona",
    cityName: "Barcelona",
    title:
      "Dónde dormir en Barcelona 2026: Gòtic vs Eixample (datos honestos)",
    description:
      "Comparativa barrios Barcelona 2026: precios reales 3★/4★, vibe, conexiones metro, seguridad nocturna. Veredicto cazador por tipo de viajero.",
    seasonContext: "Validez todo el año, precios pico jun-sep + Mobile World Congress feb",
    a: {
      name: "Barri Gòtic",
      emoji: "🏛️",
      tagline: "Casco antiguo medieval, callejuelas, tapas y catedral a 5 minutos",
      avgPriceEur: 115,
      avgPrice4starEur: 175,
      bestFor: "pareja, primer viaje",
      centerDistance: "0 min (es el centro histórico)",
      vibe: "histórico turístico",
    },
    b: {
      name: "Eixample",
      emoji: "🏢",
      tagline: "Cuadrícula modernista, anchas avenidas, Sagrada Familia y diseño",
      avgPriceEur: 130,
      avgPrice4starEur: 195,
      bestFor: "business, foodie, familia",
      centerDistance: "8-15 min metro a Plaça Catalunya",
      vibe: "elegante residencial",
    },
    criteria: [
      { label: "Precio medio noche", aScore: 7, bScore: 6, winner: "a", note: "Gòtic ~12% más barato en 3★, similar en 4★" },
      { label: "Centralidad turística", aScore: 10, bScore: 7, winner: "a", note: "Gòtic = Catedral, Rambla, Born andando. Eixample necesita metro" },
      { label: "Tranquilidad nocturna", aScore: 4, bScore: 8, winner: "b", note: "Gòtic ruidoso fin de semana (botellón, bares). Eixample silencioso a partir de las 23h" },
      { label: "Restaurantes locales", aScore: 6, bScore: 9, winner: "b", note: "Eixample concentra estrellas Michelin (Disfrutar, Cinc Sentits). Gòtic dominado por trampas turísticas" },
      { label: "Seguridad", aScore: 6, bScore: 9, winner: "b", note: "Gòtic top 3 zona carteristas BCN. Eixample tasa baja" },
      { label: "Transporte aeropuerto", aScore: 8, bScore: 9, winner: "b", note: "Eixample tiene parada Aerobus Plaça Espanya y R2 Norte. Gòtic vía L3 Drassanes (transbordo)" },
      { label: "Familia con niños", aScore: 4, bScore: 8, winner: "b", note: "Calles Gòtic estrechas, sin parques. Eixample tiene Joan Miró y Sagrada Família verdes" },
    ],
    verdict:
      "Gòtic gana si es tu primera vez en Barcelona y priorizas atmósfera medieval y andar todo. Eixample gana en relación calidad-precio si buscas tranquilidad, gastronomía o vienes con familia. Para estancias 3+ noches, Eixample renta más; para escapadas 2 noches viviendo la ciudad antigua, Gòtic.",
    pickA: [
      "Primera vez en Barcelona, máximo 2-3 noches",
      "Pareja sin coche, quieres andar todo el día",
      "Atmósfera histórica con catedrales y calles medievales",
      "Presupuesto ajustado <€100/noche",
    ],
    pickB: [
      "Familia con niños o estancia larga",
      "Buscas restaurantes locales serios (Michelin, slow food)",
      "Vienes a un congreso/evento (MWC, Smart City)",
      "Quieres dormir tranquilo después de las 23h",
    ],
    hotelsA: ["Hotel Neri", "Mercer Hotel Barcelona", "Hotel DO Plaça Reial"],
    hotelsB: ["Hotel Casa Fuster", "Cotton House Hotel", "Hotel Casa Bonay"],
  },
  // ─── 2. Madrid: Centro Sol vs Malasaña ─────────────────────────────
  {
    slug: "madrid-centro-vs-malasana",
    citySlug: "madrid",
    cityName: "Madrid",
    title:
      "Dónde dormir en Madrid 2026: Sol Centro vs Malasaña (guía cazador)",
    description:
      "Comparativa barrios Madrid 2026: Sol-Gran Vía vs Malasaña. Precios, vibe, transporte aeropuerto Barajas. Veredicto honesto por tipo de viajero.",
    seasonContext: "Validez todo el año, picos San Isidro mayo + Madrid Pride julio",
    a: {
      name: "Sol / Gran Vía",
      emoji: "📍",
      tagline: "Corazón turístico, Puerta del Sol, museos a pie y vida 24/7",
      avgPriceEur: 110,
      avgPrice4starEur: 170,
      bestFor: "primer viaje, pareja",
      centerDistance: "0 min (kilómetro cero literal)",
      vibe: "turístico bullicioso",
    },
    b: {
      name: "Malasaña",
      emoji: "🎨",
      tagline: "Bohemia indie, bares de vinilos, brunch y diseño independiente",
      avgPriceEur: 95,
      avgPrice4starEur: 155,
      bestFor: "mochilero, foodie, treintañeros",
      centerDistance: "10 min andando a Gran Vía",
      vibe: "alternativo creativo",
    },
    criteria: [
      { label: "Precio medio noche", aScore: 6, bScore: 8, winner: "b", note: "Malasaña ~15% más barato. Gran Vía picos en hoteles cadena premium" },
      { label: "Centralidad", aScore: 10, bScore: 8, winner: "a", note: "Sol = todo a pie (Prado, Reina Sofía, Plaza Mayor). Malasaña andable pero con cuesta" },
      { label: "Vida nocturna", aScore: 7, bScore: 10, winner: "b", note: "Malasaña = epicentro indie/garito/cocktail. Sol más turisteo + cadenas" },
      { label: "Comida no-trampa", aScore: 5, bScore: 9, winner: "b", note: "Sol = bares con menú en 7 idiomas. Malasaña conserva tabernas reales (Bodega de la Ardosa, etc)" },
      { label: "Ruido", aScore: 3, bScore: 5, winner: "b", note: "Ambas ruidosas pero Sol +metro+turistas+manifestaciones. Malasaña fin de semana hasta 5am" },
      { label: "Conexión Barajas", aScore: 9, bScore: 7, winner: "a", note: "Sol = L1 sin transbordo. Malasaña vía Tribunal o Gran Vía + L1" },
      { label: "Pareja romántica", aScore: 5, bScore: 7, winner: "b", note: "Sol demasiado caótico para velada. Malasaña tiene rincones bohemios" },
    ],
    verdict:
      "Sol gana en pura centralidad: a 5 minutos andando del Prado, Reina Sofía y Thyssen. Malasaña gana en autenticidad, mejor precio y noche real (no turistas). Si vienes 2 noches en plan museo-monumento, Sol. Si vienes 4-7 noches y quieres vivir como madrileño, Malasaña.",
    pickA: [
      "Primer viaje Madrid, prioridad Triángulo del Arte",
      "Llegas tarde noche desde Barajas (L1 directa)",
      "Quieres todo a pie sin coger metro",
      "Vacaciones de 2 noches",
    ],
    pickB: [
      "Vienes 4+ noches y quieres vibe local",
      "Foodie buscando tabernas no turísticas",
      "Pareja joven con plan de bares cocktail",
      "Presupuesto <€100/noche en 3★",
    ],
    hotelsA: ["Hotel Riu Plaza España", "The Principal Madrid", "Dear Hotel Madrid"],
    hotelsB: ["7 Islas Hotel", "Tótem Madrid", "Hostal Acapulco"],
  },
  // ─── 3. Roma: Trastevere vs Centro Storico ─────────────────────────
  {
    slug: "roma-trastevere-vs-centro-storico",
    citySlug: "roma",
    cityName: "Roma",
    title:
      "Dónde dormir en Roma 2026: Trastevere vs Centro Storico (datos reales)",
    description:
      "Comparativa barrios Roma 2026: Trastevere bohemio vs Centro Storico monumental. Precios, transporte Fiumicino, mejor zona por tipo de viajero.",
    seasonContext: "Pico turístico abr-jun + sept-oct. Precios suben 30% en Pascua",
    a: {
      name: "Trastevere",
      emoji: "🍷",
      tagline: "Empedrado, hiedra, trattorias auténticas al otro lado del Tíber",
      avgPriceEur: 130,
      avgPrice4starEur: 195,
      bestFor: "foodie, pareja, primera vez",
      centerDistance: "15-20 min andando al Vaticano y Piazza Navona",
      vibe: "bohemio romántico",
    },
    b: {
      name: "Centro Storico",
      emoji: "🏛️",
      tagline: "Panteón, Piazza Navona, Fontana Trevi todo en un radio de 800m",
      avgPriceEur: 165,
      avgPrice4starEur: 245,
      bestFor: "monumentos, primera vez, business",
      centerDistance: "0 min (es el centro)",
      vibe: "monumental turístico",
    },
    criteria: [
      { label: "Precio medio noche", aScore: 7, bScore: 5, winner: "a", note: "Trastevere ~20% más barato. Centro Storico cobra premium ubicación" },
      { label: "Monumentos andando", aScore: 6, bScore: 10, winner: "b", note: "Centro Storico = Panteón a 2 min, Trevi a 5, Navona en puerta. Trastevere cruza Tíber" },
      { label: "Restaurantes auténticos", aScore: 9, bScore: 5, winner: "a", note: "Trastevere = Da Enzo, Tonnarello, Antico Forno. Centro Storico saturado de menús turísticos en 6 idiomas" },
      { label: "Vida nocturna", aScore: 9, bScore: 6, winner: "a", note: "Trastevere = epicentro romano nocturno (bares, plazas). Centro Storico cierra temprano" },
      { label: "Vaticano cerca", aScore: 8, bScore: 6, winner: "a", note: "Trastevere a 15 min andando al Vaticano. Centro Storico ~25 min" },
      { label: "Transporte Fiumicino", aScore: 5, bScore: 8, winner: "b", note: "Centro Storico = Leonardo Express + bus directo. Trastevere requiere taxi o tren regional" },
      { label: "Familias con niños", aScore: 6, bScore: 7, winner: "b", note: "Centro Storico más amplio + parques cerca (Villa Borghese). Trastevere callejuelas estrechas" },
    ],
    verdict:
      "Trastevere gana en autenticidad, gastronomía romana real y vida nocturna — el barrio que recomiendan los italianos. Centro Storico gana en pura conveniencia: literalmente duermes al lado de la Fontana de Trevi. Si vienes 4+ noches y ya conoces lo básico, Trastevere. Si es tu primera vez y son 3 noches, Centro Storico ahorra horas andando.",
    pickA: [
      "4+ noches en Roma, ya conoces los monumentos básicos",
      "Foodie buscando cucina romana de verdad (cacio e pepe, carbonara)",
      "Pareja romántica, quieres calles empedradas",
      "Tope presupuesto €150/noche en 3★",
    ],
    pickB: [
      "Primera vez en Roma, máximo 3 noches",
      "Plan intensivo monumentos (Coliseo + Vaticano + Foros)",
      "Llegas tarde a Fiumicino y necesitas tren directo",
      "Viajas con padres mayores que necesitan radio andable",
    ],
    hotelsA: ["Hotel Santa Maria Trastevere", "Relais Le Clarisse", "Arco del Lauro"],
    hotelsB: ["Hotel Albergo del Senato", "Hotel Raphael", "G-Rough Roma"],
  },
  // ─── 4. París: Marais vs Montmartre ────────────────────────────────
  {
    slug: "paris-marais-vs-montmartre",
    citySlug: "paris",
    cityName: "París",
    title:
      "Dónde dormir en París 2026: Marais vs Montmartre (guía cazador)",
    description:
      "Comparativa barrios París 2026: Le Marais chic vs Montmartre bohemio. Precios, transporte aeropuertos CDG/Orly, vibe. Veredicto por viajero.",
    seasonContext: "Validez todo el año, picos Fashion Week (feb/sept) + Roland-Garros (mayo)",
    a: {
      name: "Le Marais",
      emoji: "🥐",
      tagline: "Tiendas vintage, falafels, galerías y vida judía y queer histórica",
      avgPriceEur: 175,
      avgPrice4starEur: 280,
      bestFor: "pareja, foodie, fashionista",
      centerDistance: "5-10 min metro a Châtelet",
      vibe: "chic vintage",
    },
    b: {
      name: "Montmartre",
      emoji: "🎨",
      tagline: "Sacré-Cœur, calles bohemias, artistas en Place du Tertre",
      avgPriceEur: 140,
      avgPrice4starEur: 215,
      bestFor: "romántico, presupuesto medio, primera vez",
      centerDistance: "20-25 min metro al centro",
      vibe: "bohemio postal",
    },
    criteria: [
      { label: "Precio medio noche", aScore: 5, bScore: 8, winner: "b", note: "Montmartre ~20-25% más barato. Marais premium fashion" },
      { label: "Centralidad", aScore: 9, bScore: 5, winner: "a", note: "Marais entre Notre-Dame, Centro Pompidou y Bastille. Montmartre periférico (norte)" },
      { label: "Restaurantes", aScore: 10, bScore: 6, winner: "a", note: "Marais = epicentro foodie (Big Mamma, Septime cerca, falafels). Montmartre más turístico" },
      { label: "Compras / tiendas", aScore: 10, bScore: 4, winner: "a", note: "Marais = vintage premium + diseñadores indie. Montmartre souvenirs" },
      { label: "Vida nocturna", aScore: 8, bScore: 5, winner: "a", note: "Marais = bares cocktail, queer scene. Montmartre tras Pigalle más turista" },
      { label: "Vistas / atmósfera", aScore: 6, bScore: 10, winner: "b", note: "Montmartre = Sacré-Cœur con vistas París. Marais sin elevación" },
      { label: "Familia con niños", aScore: 7, bScore: 6, winner: "a", note: "Marais parques (Square Léo-Ferré). Montmartre escaleras complican carriolas" },
    ],
    verdict:
      "Marais gana en relación céntrico-foodie-shopping y es la elección por defecto si vienes 3-5 noches y tu plan es vivir París adulto. Montmartre gana en romance, vistas y precio — pero estás 25 min metro de todo lo central. Para primera vez con presupuesto justo y romance, Montmartre. Para resto, Marais.",
    pickA: [
      "Foodie, fashion lover, pareja chic 30-50 años",
      "Estancia 3+ noches con plan museos (Pompidou, Picasso, d'Orsay)",
      "Quieres todo el día a pie sin metro",
      "Disfrutas escena queer/vintage",
    ],
    pickB: [
      "Pareja romántica, primera vez en París",
      "Presupuesto medio €100-140/noche",
      "Atardeceres con vistas (Sacré-Cœur)",
      "Plan tranquilo, no necesitas estar en el centro",
    ],
    hotelsA: ["Hôtel Jules & Jim", "Hôtel de la Bretonnerie", "Hôtel Saintonge"],
    hotelsB: ["Terrass'' Hotel", "Hôtel Particulier Montmartre", "Le Pigalle"],
  },
  // ─── 5. Lisboa: Alfama vs Chiado ────────────────────────────────────
  {
    slug: "lisboa-alfama-vs-chiado",
    citySlug: "lisboa",
    cityName: "Lisboa",
    title:
      "Dónde dormir en Lisboa 2026: Alfama vs Chiado (precios + transporte)",
    description:
      "Comparativa barrios Lisboa 2026: Alfama callejuelas fado vs Chiado elegante shopping. Precios, transporte aeropuerto, vibe. Veredicto cazador.",
    seasonContext: "Validez todo el año, picos mayo-jul + festival Santo António 12-13 jun",
    a: {
      name: "Alfama",
      emoji: "🎶",
      tagline: "Casco antiguo, casas de fado, tranvía 28 y miradores al Tajo",
      avgPriceEur: 95,
      avgPrice4starEur: 150,
      bestFor: "pareja, primera vez, romántico",
      centerDistance: "15-20 min andando a Baixa",
      vibe: "histórico íntimo",
    },
    b: {
      name: "Chiado / Baixa",
      emoji: "🏛️",
      tagline: "Cafés históricos, librerías centenarias, shopping y conexiones",
      avgPriceEur: 110,
      avgPrice4starEur: 170,
      bestFor: "shopping, foodie, primera vez",
      centerDistance: "0 min (es el centro neurálgico)",
      vibe: "elegante céntrico",
    },
    criteria: [
      { label: "Precio medio noche", aScore: 8, bScore: 7, winner: "a", note: "Alfama ~13% más barato en 3★. Diferencia se aplana en 4★+" },
      { label: "Atmósfera tradicional", aScore: 10, bScore: 6, winner: "a", note: "Alfama = barrio Fado UNESCO, autenticidad lisboeta. Chiado más moderno burgués" },
      { label: "Conexiones metro", aScore: 4, bScore: 10, winner: "b", note: "Chiado = Baixa-Chiado L Verde+Azul. Alfama sin metro directo (solo Santa Apolónia tren)" },
      { label: "Restaurantes", aScore: 7, bScore: 9, winner: "b", note: "Chiado = café A Brasileira, Manteigaria, Time Out. Alfama tabernas locales con fado en vivo" },
      { label: "Compras", aScore: 4, bScore: 10, winner: "b", note: "Chiado = librería Bertrand (más antigua del mundo), boutiques diseñadores PT. Alfama souvenirs" },
      { label: "Aeropuerto LIS", aScore: 6, bScore: 7, winner: "b", note: "Chiado vía metro L Roja (35min total). Alfama mismo tiempo pero más complicado con maletas (escaleras)" },
      { label: "Pareja romántica", aScore: 10, bScore: 7, winner: "a", note: "Alfama = miradores Sta Luzia, casas de fado. Romance inconfundible" },
    ],
    verdict:
      "Alfama gana en pura magia lisboeta — el barrio que sigue siendo barrio, con vecinos colgando ropa, fado callejero y miradores al Tajo. Chiado gana en conveniencia: metro, shopping, restaurantes y rapidez al aeropuerto. Si vienes en pareja romántica 3-4 noches, Alfama. Si vienes con maletas grandes o plan intenso, Chiado.",
    pickA: [
      "Pareja romántica 30-50, primer viaje Lisboa",
      "Te importa la autenticidad sobre conveniencia",
      "Plan tranquilo: fado, miradores, tranvía 28",
      "Sin maletas pesadas (Alfama llena de escaleras)",
    ],
    pickB: [
      "Maletas grandes, llegas tarde noche al aeropuerto",
      "Plan intenso: museos + Belém + LX Factory + Sintra",
      "Foodie buscando lo mejor de la nueva cocina PT",
      "Compras y librerías históricas",
    ],
    hotelsA: ["Hotel Convento do Salvador", "Memmo Alfama", "Solar do Castelo"],
    hotelsB: ["Bairro Alto Hotel", "Hotel do Chiado", "Pousada de Lisboa"],
  },
  // ─── 6. Sevilla: Centro / Catedral vs Triana ───────────────────────
  {
    slug: "sevilla-centro-vs-triana",
    citySlug: "sevilla",
    cityName: "Sevilla",
    title:
      "Dónde dormir en Sevilla 2026: Centro Catedral vs Triana (datos reales)",
    description:
      "Comparativa barrios Sevilla 2026: Centro Catedral monumental vs Triana ceramista al otro lado del Guadalquivir. Precios, Semana Santa, Feria. Veredicto.",
    seasonContext: "Semana Santa (abril) + Feria de Abril multiplican precios x3-4",
    a: {
      name: "Centro / Santa Cruz",
      emoji: "🕌",
      tagline: "Catedral, Giralda, Alcázar, judería andaluza con patios y azulejos",
      avgPriceEur: 105,
      avgPrice4starEur: 165,
      bestFor: "primera vez, monumentos",
      centerDistance: "0 min (es el corazón histórico)",
      vibe: "monumental andaluz",
    },
    b: {
      name: "Triana",
      emoji: "🌊",
      tagline: "Otro lado del Guadalquivir, cuna del flamenco y tapas locales",
      avgPriceEur: 85,
      avgPrice4starEur: 130,
      bestFor: "foodie, presupuesto, segunda vez",
      centerDistance: "10-15 min andando al Centro",
      vibe: "flamenco trabajador",
    },
    criteria: [
      { label: "Precio medio noche", aScore: 6, bScore: 9, winner: "b", note: "Triana ~20% más barato todo el año. Diferencia gigante en Semana Santa/Feria" },
      { label: "Monumentos a pie", aScore: 10, bScore: 6, winner: "a", note: "Centro = Catedral, Alcázar, Cabildo en 200m. Triana cruza puente (10-15 min)" },
      { label: "Tapas auténticas", aScore: 5, bScore: 9, winner: "b", note: "Triana = Casa Cuesta, Sol y Sombra, Bar Casa Antonio. Centro saturado de menús turísticos" },
      { label: "Flamenco real", aScore: 6, bScore: 10, winner: "b", note: "Triana = cuna del flamenco, peñas auténticas (Casa Anselma). Centro = tablaos turísticos €40" },
      { label: "Vida nocturna", aScore: 6, bScore: 8, winner: "b", note: "Triana = barra Calle Betis con vistas catedral. Centro más turista nocturno" },
      { label: "Semana Santa proximidad", aScore: 10, bScore: 8, winner: "a", note: "Centro = pasos pasan literalmente por tu puerta. Triana sale 'al otro lado'" },
      { label: "Familia / parques", aScore: 7, bScore: 8, winner: "b", note: "Triana tiene Parque de los Príncipes + Mercado de Triana. Centro más denso" },
    ],
    verdict:
      "Centro gana si es tu primera vez en Sevilla, vienes 2-3 noches y tu prioridad es Catedral, Alcázar, Giralda andando. Triana gana en relación calidad-precio, autenticidad y mejor flamenco real — pero estás cruzando el río para todo monumento. Para Semana Santa/Feria reservadas con 6 meses, Centro. Para escapada de fin de semana flamenco-foodie, Triana.",
    pickA: [
      "Primera vez Sevilla, máximo 2-3 noches",
      "Quieres Catedral y Alcázar a 5 minutos andando",
      "Vienes en Semana Santa con entradas Carrera Oficial",
      "Plan tranquilo sin caminar mucho",
    ],
    pickB: [
      "Foodie buscando tapas no turísticas",
      "Quieres flamenco real (no tablao para guiris)",
      "Presupuesto <€90/noche en 3★",
      "Vienes 4+ noches y ya conoces Sevilla básica",
    ],
    hotelsA: ["Hotel Alfonso XIII", "EME Catedral Mercer", "Hotel Casa 1800"],
    hotelsB: ["Hotel Boutique Casas de Santa Cruz", "Triana Boutique Hotel", "Patio de la Cartuja"],
  },
];

export function getNeighborhoodComparisonBySlug(
  slug: string,
): NeighborhoodComparison | undefined {
  return NEIGHBORHOOD_COMPARISONS.find((c) => c.slug === slug);
}

/**
 * Comparativas relacionadas — misma ciudad o ciudades cercanas geográficamente.
 * Útil para cross-link en el footer de cada comparativa.
 */
export function getRelatedNeighborhoodComparisons(
  slug: string,
  limit: number = 4,
): NeighborhoodComparison[] {
  const current = getNeighborhoodComparisonBySlug(slug);
  if (!current) return NEIGHBORHOOD_COMPARISONS.slice(0, limit);

  // Misma ciudad primero, luego resto.
  const sameCity = NEIGHBORHOOD_COMPARISONS.filter(
    (c) => c.slug !== slug && c.citySlug === current.citySlug,
  );
  const otherCities = NEIGHBORHOOD_COMPARISONS.filter(
    (c) => c.slug !== slug && c.citySlug !== current.citySlug,
  );
  return [...sameCity, ...otherCities].slice(0, limit);
}
