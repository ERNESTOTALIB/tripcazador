/**
 * dest_content.ts — fase SSS57 (May 2026)
 *
 * Contenido contextual por destino para Instagram carousel:
 *   - Top atracciones (lugares que ver)
 *   - Restaurantes / comidas típicas
 *   - Tips locales
 *   - Hashtags optimizados (mix popular + nicho)
 *
 * Uso por carousel multi-slide:
 *   /api/og/social/carousel?dealId=X&slide=places  → atracciones
 *   /api/og/social/carousel?dealId=X&slide=food    → restaurantes
 *   /api/og/social/carousel?dealId=X&slide=tips    → tips locales
 *   /api/og/social/carousel?dealId=X&slide=blog    → CTA al blog post
 *
 * Para destinos sin entry curada → fallback genérico por país/región.
 */

export interface DestAttraction {
  name: string;
  emoji: string;
  /** Brief description (max 70 chars). */
  desc: string;
}

export interface DestFood {
  name: string;
  emoji: string;
  /** What it is + price hint (max 70 chars). */
  desc: string;
}

export interface DestTip {
  emoji: string;
  /** Short actionable tip (max 90 chars). */
  text: string;
}

export interface DestContent {
  /** Hashtags públicos optimizados (mix popular + nicho + brand). */
  hashtags: string[];
  attractions: DestAttraction[];
  food: DestFood[];
  tips: DestTip[];
}

// ════════════════════════════════════════════════════
// Catálogo curado — 20 destinos top
// ════════════════════════════════════════════════════

const CONTENT: Record<string, DestContent> = {
  // ── España ──
  madrid: {
    hashtags: ["#madrid", "#viajeresmadrid", "#vueloseuropa", "#vuelosbaratos", "#chollodeviajes", "#tripcazador"],
    attractions: [
      { name: "Museo del Prado", emoji: "🖼️", desc: "Colección Velázquez, Goya, Rembrandt" },
      { name: "Parque del Retiro", emoji: "🌳", desc: "120 ha + Palacio de Cristal" },
      { name: "Plaza Mayor", emoji: "🏛️", desc: "Corazón histórico, terrazas tapas" },
      { name: "Mercado San Miguel", emoji: "🍷", desc: "Tapas gourmet siglo XX" },
    ],
    food: [
      { name: "Cocido madrileño", emoji: "🍲", desc: "Garbanzos + chorizo, 18-25€/menú" },
      { name: "Bocadillo de calamares", emoji: "🥖", desc: "Plaza Mayor, 4-6€" },
      { name: "Churros con chocolate", emoji: "☕", desc: "San Ginés, 4€" },
    ],
    tips: [
      { emoji: "🚇", text: "Abono Turístico Metro 1-7 días: 8.40-35.40€ ilimitado" },
      { emoji: "🆓", text: "Prado gratis lunes-sábado 18-20h y domingos 17-19h" },
    ],
  },
  bcn: {
    hashtags: ["#barcelona", "#bcn", "#sagradafamilia", "#vueloseuropa", "#vuelosbaratos", "#chollodeviajes", "#tripcazador"],
    attractions: [
      { name: "Sagrada Família", emoji: "⛪", desc: "Obra Gaudí, entrada 26€ (reservar online)" },
      { name: "Park Güell", emoji: "🦎", desc: "Mosaicos icónicos, vista 360º Barcelona" },
      { name: "Barrio Gótico", emoji: "🏰", desc: "Catedral + Plaça Reial + tapas" },
      { name: "Playa Barceloneta", emoji: "🏖️", desc: "Chiringuitos + paddle surf 25€/hr" },
    ],
    food: [
      { name: "Pa amb tomàquet", emoji: "🍅", desc: "Pan + tomate + jamón, 4-8€" },
      { name: "Paella Barceloneta", emoji: "🥘", desc: "Mariscos frescos, 18-25€" },
      { name: "Vermut + bombas", emoji: "🍸", desc: "La Cova Fumada, ritual barri" },
    ],
    tips: [
      { emoji: "🎫", text: "Articket BCN 35€ = 6 museos (Picasso, MNAC, MACBA...)" },
      { emoji: "🚴", text: "Bicing 47€/año o e-bikes Donkey Republic 12€/día" },
    ],
  },
  lis: {
    hashtags: ["#lisboa", "#portugal", "#fado", "#vueloseuropa", "#vuelosbaratos", "#chollodeviajes", "#tripcazador"],
    attractions: [
      { name: "Tranvía 28", emoji: "🚋", desc: "Ruta histórica Alfama→Bairro Alto, 3€" },
      { name: "Torre de Belém", emoji: "🗼", desc: "UNESCO, vistas Tajo, 6€" },
      { name: "Mirador da Senhora do Monte", emoji: "🌅", desc: "Mejor sunset gratis sobre la ciudad" },
      { name: "LX Factory", emoji: "🎨", desc: "Hub creativo, librerías, brunch" },
    ],
    food: [
      { name: "Pastéis de Belém", emoji: "🥮", desc: "Receta original 1837, 1.30€/ud" },
      { name: "Bacalhau à brás", emoji: "🐟", desc: "Bacalao + huevo + patatas, 12-18€" },
      { name: "Ginginha A Ginjinha", emoji: "🍒", desc: "Licor cereza chupito 1.50€" },
    ],
    tips: [
      { emoji: "🚆", text: "Cascais ida-vuelta tren CP 4.60€ — playa 30min" },
      { emoji: "🎶", text: "Fado nocturno Alfama: Mesa de Frades o Tasca do Chico, 30€" },
    ],
  },
  pmi: {
    hashtags: ["#mallorca", "#palmademallorca", "#baleares", "#vueloseuropa", "#vuelosbaratos", "#chollodeviajes", "#tripcazador"],
    attractions: [
      { name: "Catedral La Seu", emoji: "⛪", desc: "Gótica + rosetón Gaudí, 9€" },
      { name: "Sa Calobra", emoji: "🏞️", desc: "Cala virgen + carretera Snake, ferry 27€" },
      { name: "Valldemossa", emoji: "🏘️", desc: "Pueblo Chopin + George Sand" },
      { name: "Cap de Formentor", emoji: "🌊", desc: "Punta norte cliff + faro" },
    ],
    food: [
      { name: "Pa amb oli", emoji: "🫒", desc: "Pan moreno + aceite mallorquín, 4-6€" },
      { name: "Sobrasada + miel", emoji: "🌶️", desc: "Embutido típico, mercado 8€/kg" },
      { name: "Ensaimada", emoji: "🥐", desc: "Pastel típico, Forn des Teatre 2€" },
    ],
    tips: [
      { emoji: "🚗", text: "Coche imprescindible — alquiler desde 35€/día abr-jun" },
      { emoji: "🏖️", text: "Cala Varques + Cala Romántica = vírgenes vs Cala Major" },
    ],
  },
  cun: {
    hashtags: ["#cancun", "#mexico", "#caribe", "#playadelcarmen", "#vueloslargos", "#vuelosbaratos", "#chollodeviajes", "#tripcazador"],
    attractions: [
      { name: "Chichén Itzá", emoji: "🏛️", desc: "Maya UNESCO, tour día 60-90€" },
      { name: "Cenote Ik Kil", emoji: "🌊", desc: "Pozo sagrado nadar, entrada 5€" },
      { name: "Isla Mujeres", emoji: "🏝️", desc: "Ferry 19€ + snorkel + Playa Norte" },
      { name: "Tulum ruinas + playa", emoji: "🌴", desc: "Maya frente al mar, 7€" },
    ],
    food: [
      { name: "Cochinita pibil", emoji: "🌮", desc: "Cerdo marinado en achiote, 6-10€" },
      { name: "Ceviche Caribe", emoji: "🐟", desc: "Pulpo + lima + chile habanero, 12€" },
      { name: "Marquesitas", emoji: "🥨", desc: "Crep crujiente Edam + Nutella, 2€" },
    ],
    tips: [
      { emoji: "💧", text: "Agua embotellada SIEMPRE — evita hielo en chiringos" },
      { emoji: "💰", text: "Pesos mejor que USD en mercados; ATMs HSBC sin comisión" },
    ],
  },
  jfk: {
    hashtags: ["#nyc", "#nuevayork", "#newyork", "#bigapple", "#vuelostransatlanticos", "#vuelosbaratos", "#chollodeviajes", "#tripcazador"],
    attractions: [
      { name: "Central Park", emoji: "🌳", desc: "341 ha verde, Bow Bridge + Strawberry Fields" },
      { name: "MoMA", emoji: "🎨", desc: "Van Gogh, Warhol, Picasso, 25$" },
      { name: "High Line", emoji: "🛤️", desc: "Park elevado vías abandonadas, gratis" },
      { name: "Brooklyn Bridge sunset", emoji: "🌉", desc: "Cruzar a pie 30min, vistas top" },
    ],
    food: [
      { name: "NY pizza slice", emoji: "🍕", desc: "Joe's Pizza Greenwich, 4-6$ slice" },
      { name: "Bagel + lox", emoji: "🥯", desc: "Russ & Daughters, 18-25$" },
      { name: "Pastrami sandwich", emoji: "🥪", desc: "Katz's Deli, 28$ leyenda" },
    ],
    tips: [
      { emoji: "🚇", text: "MetroCard 7-day unlimited 34$ — vale 50+ trips" },
      { emoji: "🎟️", text: "Broadway TKTS Times Square: -50% same-day shows" },
    ],
  },
  bali: {
    hashtags: ["#bali", "#indonesia", "#ubud", "#balitemple", "#vueloslargos", "#vuelosbaratos", "#chollodeviajes", "#tripcazador"],
    attractions: [
      { name: "Tegallalang rice terraces", emoji: "🌾", desc: "Arrozales escalonados Ubud, 1€" },
      { name: "Templo Tanah Lot", emoji: "🛕", desc: "Sobre roca al mar, sunset, 4€" },
      { name: "Monkey Forest Ubud", emoji: "🐒", desc: "Macacos + templos hindú, 5€" },
      { name: "Nusa Penida cliff", emoji: "🌊", desc: "Kelingking Beach T-Rex, ferry 12€" },
    ],
    food: [
      { name: "Nasi goreng", emoji: "🍚", desc: "Arroz frito + huevo + sate, 2-4€" },
      { name: "Babi guling", emoji: "🐷", desc: "Cochinillo asado balines, 6-10€" },
      { name: "Es campur", emoji: "🍧", desc: "Helado + frutas + leche coco, 1.50€" },
    ],
    tips: [
      { emoji: "🛵", text: "Scooter 5€/día — esencial para Ubud y Uluwatu" },
      { emoji: "💵", text: "Cash es rey — efectivo IDR para warungs y templos" },
    ],
  },
  bkk: {
    hashtags: ["#bangkok", "#tailandia", "#thailand", "#streetfood", "#vueloslargos", "#vuelosbaratos", "#chollodeviajes", "#tripcazador"],
    attractions: [
      { name: "Wat Pho Buda Reclinado", emoji: "🛕", desc: "46m largo, masaje thai cuna, 5€" },
      { name: "Gran Palacio", emoji: "👑", desc: "Wat Phra Kaew + esmeralda, 12€" },
      { name: "Mercado Chatuchak", emoji: "🛍️", desc: "15.000 puestos solo finde" },
      { name: "Khao San Road", emoji: "🌃", desc: "Calle mochileros + bares 2€/cerveza" },
    ],
    food: [
      { name: "Pad thai", emoji: "🍜", desc: "Fideos arroz + gamba, 1.50-3€" },
      { name: "Som tam", emoji: "🥗", desc: "Ensalada papaya verde picante, 1.50€" },
      { name: "Mango sticky rice", emoji: "🥭", desc: "Postre coco + mango, 2€" },
    ],
    tips: [
      { emoji: "🚕", text: "Tuk-tuk solo turistas — Grab/taxi metered 5x más barato" },
      { emoji: "💧", text: "Hidratarse: 35°C+ humedad — agua sellada 0.30€/litro" },
    ],
  },
  fco: {
    hashtags: ["#roma", "#rome", "#italia", "#italy", "#coliseo", "#vueloseuropa", "#vuelosbaratos", "#chollodeviajes", "#tripcazador"],
    attractions: [
      { name: "Coliseo + Foro Romano", emoji: "🏟️", desc: "Combo 24€, reservar slot online" },
      { name: "Vaticano + Sistina", emoji: "⛪", desc: "Capilla Miguel Ángel, 17€ early" },
      { name: "Fontana di Trevi", emoji: "💧", desc: "Lanza moneda, gratis, va a Caritas" },
      { name: "Trastevere noche", emoji: "🍷", desc: "Barrio empedrado, terrazas vino" },
    ],
    food: [
      { name: "Carbonara auténtica", emoji: "🍝", desc: "Roscioli o Da Enzo, 14€" },
      { name: "Pizza al taglio", emoji: "🍕", desc: "Bonci + Antico Forno Roscioli, 4€" },
      { name: "Gelato Giolitti", emoji: "🍦", desc: "Desde 1900, pistacchio + nocciola, 3€" },
    ],
    tips: [
      { emoji: "🎫", text: "Roma Pass 72h 52€ = transporte + 2 museos + skip-queue" },
      { emoji: "🚶", text: "Centro caminable — evitar coche, ZTL 100€ multa" },
    ],
  },
  cdg: {
    hashtags: ["#paris", "#france", "#francia", "#torreeiffel", "#vueloseuropa", "#vuelosbaratos", "#chollodeviajes", "#tripcazador"],
    attractions: [
      { name: "Torre Eiffel cima", emoji: "🗼", desc: "Subir cumbre 28€, mejor reserva" },
      { name: "Louvre", emoji: "🖼️", desc: "Mona Lisa + Venus, 22€ skip-line" },
      { name: "Montmartre + Sacré-Cœur", emoji: "⛪", desc: "Vista 360º + artistas plaza" },
      { name: "Versalles", emoji: "👑", desc: "Tren RER C 7.50€ + entrada 18€" },
    ],
    food: [
      { name: "Croissant + café", emoji: "🥐", desc: "Du Pain et des Idées, 2.50€" },
      { name: "Steak frites", emoji: "🥩", desc: "Le Relais de l'Entrecôte, 28€" },
      { name: "Macarons Pierre Hermé", emoji: "🍪", desc: "Ispahan rosa-frambuesa, 2.50€/ud" },
    ],
    tips: [
      { emoji: "🚇", text: "Carnet 10 viajes metro 17.35€ vs 21.50€ sueltos" },
      { emoji: "🎟️", text: "Museum Pass 4 días 79€ = 50+ museos sin colas" },
    ],
  },
};

// ════════════════════════════════════════════════════
// Fallbacks regionales para destinos sin entry curada
// ════════════════════════════════════════════════════

const REGIONAL_FALLBACK: Record<string, DestContent> = {
  europa: {
    hashtags: ["#europa", "#europatrip", "#vueloseuropa", "#vuelosbaratos", "#chollodeviajes", "#tripcazador"],
    attractions: [
      { name: "Casco histórico", emoji: "🏛️", desc: "Monumentos UNESCO + plazas centrales" },
      { name: "Mercado local", emoji: "🛍️", desc: "Productos artesanales + comida típica" },
      { name: "Mirador panorámico", emoji: "🌅", desc: "Vista 360º — gratis o entrada simbólica" },
    ],
    food: [
      { name: "Plato típico regional", emoji: "🍽️", desc: "Receta tradicional, 12-20€/menú" },
      { name: "Café + dulce típico", emoji: "☕", desc: "Cafetería local, 4-6€" },
    ],
    tips: [
      { emoji: "🚇", text: "Tarjeta turística 24-72h ahorra hasta 50% transporte" },
      { emoji: "📅", text: "Museos suelen ser gratis 1er domingo de mes" },
    ],
  },
  asia: {
    hashtags: ["#asia", "#vueloslargos", "#aventura", "#vuelosbaratos", "#chollodeviajes", "#tripcazador"],
    attractions: [
      { name: "Templo principal", emoji: "🛕", desc: "Sitio sagrado + arquitectura tradicional" },
      { name: "Mercado nocturno", emoji: "🏮", desc: "Street food + souvenirs hasta 23h" },
      { name: "Naturaleza tropical", emoji: "🌴", desc: "Playas / arrozales / cascadas" },
    ],
    food: [
      { name: "Street food local", emoji: "🍜", desc: "Plato icónico 1-3€ en mercados" },
      { name: "Fruta tropical", emoji: "🥭", desc: "Mango, durian, lychee — temporada" },
    ],
    tips: [
      { emoji: "💵", text: "Cash > tarjeta en mercados y warungs/sodas locales" },
      { emoji: "💧", text: "Solo agua embotellada — incluido para cepillarse" },
    ],
  },
  caribe: {
    hashtags: ["#caribe", "#playa", "#paraisos", "#vueloslargos", "#vuelosbaratos", "#chollodeviajes", "#tripcazador"],
    attractions: [
      { name: "Playa estrella", emoji: "🏖️", desc: "Arena blanca + agua turquesa cristalina" },
      { name: "Snorkel arrecife", emoji: "🐠", desc: "Tour barco día 30-50€ con equipo" },
      { name: "Casco colonial", emoji: "🏘️", desc: "Edificios pastel + plaza central" },
    ],
    food: [
      { name: "Pescado del día", emoji: "🐟", desc: "Pargo / mero a la parrilla, 12-18€" },
      { name: "Coco fresco + ron", emoji: "🥥", desc: "Chiringuito playa, 5-8€" },
    ],
    tips: [
      { emoji: "🌞", text: "Protector reef-safe obligatorio en muchas reservas" },
      { emoji: "💵", text: "Propina 10-15% no incluida en cuenta restaurantes" },
    ],
  },
  world: {
    hashtags: ["#viajar", "#vuelosbaratos", "#chollodeviajes", "#travelhacks", "#tripcazador"],
    attractions: [
      { name: "Top sitio turístico", emoji: "📍", desc: "Imprescindible — reservar online" },
      { name: "Plato local típico", emoji: "🍽️", desc: "Probar mercado o tasca local" },
      { name: "Sunset spot", emoji: "🌅", desc: "Mirador con vista panorámica gratis" },
    ],
    food: [
      { name: "Comida tradicional", emoji: "🍴", desc: "Receta regional, 10-20€" },
    ],
    tips: [
      { emoji: "🎫", text: "Reserva entradas online — ahorra cola y -10/20% precio" },
    ],
  },
};

/**
 * Map IATA / city slug → content key.
 */
const KEY_MAP: Record<string, string> = {
  // Spain
  MAD: "madrid", TOJ: "madrid",
  BCN: "bcn", barcelona: "bcn",
  PMI: "pmi", palma: "pmi",
  // Portugal
  LIS: "lis", lisboa: "lis",
  // Mexico/Caribbean
  CUN: "cun", cancun: "cun",
  // USA
  JFK: "jfk", LGA: "jfk", EWR: "jfk", nueva_york: "jfk",
  // Asia
  DPS: "bali", bali: "bali",
  BKK: "bkk", bangkok: "bkk",
  // Europe
  FCO: "fco", roma: "fco",
  CDG: "cdg", ORY: "cdg", paris: "cdg",
};

/**
 * Resolve destination input → content (with regional fallback chain).
 */
export function getDestContent(input: string | undefined | null, region?: string): DestContent {
  if (!input) return REGIONAL_FALLBACK.world;

  // 1) Direct IATA or slug match
  const iata = input.trim().toUpperCase();
  if (KEY_MAP[iata] && CONTENT[KEY_MAP[iata]]) return CONTENT[KEY_MAP[iata]];

  const slug = input.toLowerCase().trim().replace(/\s+/g, "_");
  if (KEY_MAP[slug] && CONTENT[KEY_MAP[slug]]) return CONTENT[KEY_MAP[slug]];
  if (CONTENT[slug]) return CONTENT[slug];

  // 2) Normalize accents and retry
  const norm = slug
    .replace(/é/g, "e").replace(/á/g, "a").replace(/í/g, "i")
    .replace(/ó/g, "o").replace(/ú/g, "u").replace(/ñ/g, "n");
  if (CONTENT[norm]) return CONTENT[norm];

  // 3) Regional fallback
  const regionLower = (region || "").toLowerCase().trim();
  if (regionLower.includes("europa") || regionLower.includes("europe")) return REGIONAL_FALLBACK.europa;
  if (regionLower.includes("asia")) return REGIONAL_FALLBACK.asia;
  if (regionLower.includes("caribe") || regionLower.includes("caribbean")) return REGIONAL_FALLBACK.caribe;

  // 4) World generic fallback
  return REGIONAL_FALLBACK.world;
}

/**
 * Match a destination to an existing blog post slug if available.
 * Returns null if no good match — caller can skip blog slide.
 *
 * Mapping curado para top destinos. Para extender: añadir más entries
 * cuando se publican posts SEO long-tail por destino.
 */
const BLOG_BY_DEST: Record<string, { slug: string; title: string; lang: "es" | "en" }> = {
  bali: {
    slug: "vuelos-baratos-asia-mejor-mes-comprar-2026",
    title: "Mejor mes para volar a Asia en 2026 (datos reales)",
    lang: "es",
  },
  bkk: {
    slug: "tailandia-monzon-cuando-ir-vuelos-baratos",
    title: "Tailandia en monzón: ¿merece la pena? (datos 2026)",
    lang: "es",
  },
  cun: {
    slug: "vuelos-cuba-baratos-desde-espana-2026",
    title: "Vuelos Caribe baratos desde España 2026",
    lang: "es",
  },
  jfk: {
    slug: "vuelos-business-class-baratos-tokio-2026",
    title: "Errores de tarifa intercontinentales: cómo cazarlos",
    lang: "es",
  },
  fco: {
    slug: "vuelos-baratos-italia-desde-espana-2026",
    title: "Vuelos baratos a Italia desde España 2026",
    lang: "es",
  },
  cdg: {
    slug: "vuelos-baratos-fechas-flexibles-2026",
    title: "Fechas flexibles: cómo ahorrar €100-200 por vuelo",
    lang: "es",
  },
  madrid: {
    slug: "puente-mayo-2026-baratos",
    title: "Vuelos puente mayo 2026 desde Madrid",
    lang: "es",
  },
  bcn: {
    slug: "vuelos-baratos-fechas-flexibles-2026",
    title: "Fechas flexibles: cómo ahorrar €100-200 por vuelo",
    lang: "es",
  },
  lis: {
    slug: "vuelos-baratos-lisboa-fin-de-semana-2026",
    title: "Lisboa fin de semana: <€150 ida y vuelta 2026",
    lang: "es",
  },
  pmi: {
    slug: "vuelos-puente-mayo-2026-baratos",
    title: "Mallorca puente mayo: cuándo cazar mejor",
    lang: "es",
  },
};

export function getBlogForDest(input: string | undefined | null): { slug: string; title: string; lang: "es" | "en" } | null {
  if (!input) return null;
  const iata = input.trim().toUpperCase();
  if (KEY_MAP[iata] && BLOG_BY_DEST[KEY_MAP[iata]]) return BLOG_BY_DEST[KEY_MAP[iata]];
  const slug = input.toLowerCase().trim().replace(/\s+/g, "_");
  if (KEY_MAP[slug] && BLOG_BY_DEST[KEY_MAP[slug]]) return BLOG_BY_DEST[KEY_MAP[slug]];
  if (BLOG_BY_DEST[slug]) return BLOG_BY_DEST[slug];
  return null;
}
