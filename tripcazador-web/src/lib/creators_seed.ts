/**
 * creators_seed.ts — SSS364 (21 may 2026)
 *
 * Catálogo seed de creators marketplace. Cada creator tiene una landing
 * /creator/[handle] branded con sus chollos + tracking links 8% comm.
 *
 * Para escalar: convertir a backend store o CMS. Por ahora hardcoded.
 */

export interface Creator {
  handle: string; // url slug
  display_name: string;
  bio: string; // 1 párrafo
  avatar: string; // emoji o URL (placeholder hasta tener imagen real)
  social: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  /** Regions / topics preferidos para mostrar deals matched */
  topics: string[];
  /** Track code para attribuir ventas — 8% comm sobre Premium signups */
  ref_code: string;
  /** Cuántos followers totales (manual update). */
  followers_total?: number;
  active: boolean;
}

export const CREATORS: Creator[] = [
  {
    handle: "demo-creator",
    display_name: "Ejemplo Creator",
    bio: "Cazador de chollos a Asia y América Latina. Especializado en business class. Comparte sus mejores hallazgos cada semana.",
    avatar: "🎯",
    social: {
      instagram: "https://instagram.com/tripcazador",
      tiktok: "https://www.tiktok.com/@tripcazador",
    },
    topics: ["asia", "america", "business-class"],
    ref_code: "CREATOR-DEMO",
    followers_total: 12000,
    active: true,
  },
  // SSS397 — slots placeholder para creators reales (operator activa cada
  // uno al aprobar la partnership). Bios genéricos por nicho — actualizar
  // cuando lleguen aplicaciones reales.
  {
    handle: "asia-low-cost",
    display_name: "Asia Low Cost",
    bio: "Curador de vuelos baratos a Asia desde España. Especializado en Tokio, Bangkok, Bali y rutas error fare con escalas en hubs Gulf (Doha, Dubai, Estambul).",
    avatar: "🌏",
    social: {},
    topics: ["asia", "tokio", "bali", "tailandia", "error-fare"],
    ref_code: "CREATOR-ASIA-LC",
    followers_total: 8500,
    active: false, // operator pone true cuando creator aplique
  },
  {
    handle: "vuelta-al-mundo",
    display_name: "Vuelta al Mundo",
    bio: "Cazador de RTW tickets (round-the-world) baratos. Mejores combinaciones multi-destino para nómadas digitales y viajeros de gap-year.",
    avatar: "🌍",
    social: {},
    topics: ["multidestino", "rtw", "nomad", "long-haul"],
    ref_code: "CREATOR-RTW",
    followers_total: 14200,
    active: false,
  },
  {
    handle: "business-class-cazador",
    display_name: "Business Class Cazador",
    bio: "Vuelos en business desde 600€ ida-vuelta. Specializado en Avios + Iberia Plus + error fares de aerolíneas asiáticas (Korean, Cathay, Singapore).",
    avatar: "💺",
    social: {},
    topics: ["business-class", "premium-cabin", "millas", "avios"],
    ref_code: "CREATOR-BCN-CZ",
    followers_total: 21000,
    active: false,
  },
  {
    handle: "viajar-con-niños",
    display_name: "Viajar con Niños",
    bio: "Recomendaciones de vuelos baratos + hoteles family-friendly. Destinos seguros y comidas internacionales. Mejores fechas escolares y precios.",
    avatar: "👨‍👩‍👧",
    social: {},
    topics: ["familia", "kids-friendly", "vacaciones-escolares"],
    ref_code: "CREATOR-FAMILY",
    followers_total: 6700,
    active: false,
  },
  {
    handle: "latam-mochilero",
    display_name: "LATAM Mochilero",
    bio: "Vuelos desde España a Latinoamérica. Especialista en Argentina, Chile, Perú, México, Colombia. Conexiones baratas via Madrid y Barcelona.",
    avatar: "🎒",
    social: {},
    topics: ["latam", "argentina", "mexico", "peru", "mochilero"],
    ref_code: "CREATOR-LATAM-MO",
    followers_total: 9300,
    active: false,
  },
  {
    handle: "europa-fin-de-semana",
    display_name: "Europa Fin de Semana",
    bio: "Escapadas baratas de fin de semana a capitales europeas. Vuelos low-cost + hoteles boutique. Inspiración para puentes y festivos.",
    avatar: "✈️",
    social: {},
    topics: ["europa", "city-break", "low-cost", "fin-de-semana"],
    ref_code: "CREATOR-EU-WKND",
    followers_total: 11500,
    active: false,
  },
  {
    handle: "luna-de-miel",
    display_name: "Luna de Miel Cazada",
    bio: "Lunas de miel románticas asequibles. Maldivas, Bali, Polinesia, Seychelles sin pagar precio honeymoon premium. Tips de fechas óptimas.",
    avatar: "💕",
    social: {},
    topics: ["honeymoon", "romantico", "maldivas", "bali", "polinesia"],
    ref_code: "CREATOR-LM",
    followers_total: 7800,
    active: false,
  },
  {
    handle: "nomada-digital",
    display_name: "Nómada Digital",
    bio: "Mejores destinos digital-nomad con visado fácil + cost of living bajo. Bali, Lisboa, Medellín, Chiang Mai, Tbilisi. Vuelos + esim + coworking.",
    avatar: "💻",
    social: {},
    topics: ["nomad", "remote-work", "bali", "lisboa", "medellin"],
    ref_code: "CREATOR-NOMAD",
    followers_total: 18600,
    active: false,
  },
];

export function findCreator(handle: string): Creator | undefined {
  return CREATORS.find((c) => c.handle === handle && c.active);
}

export function getAllCreatorHandles(): string[] {
  return CREATORS.filter((c) => c.active).map((c) => c.handle);
}
