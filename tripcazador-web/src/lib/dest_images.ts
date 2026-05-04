/**
 * dest_images.ts — fase SSS56 (May 2026)
 *
 * Mapping destino → imagen Unsplash curada para usar como fondo de IG OG.
 * Las URLs son photo IDs de Unsplash que ya usamos en DestinationCard.
 *
 * Pattern: clave puede ser IATA (3 letras), nombre ciudad lowercase,
 * o región. Devolvemos URL completa con params optimizados para 1080×1080
 * o 1080×1920 (story).
 *
 * Uso:
 *   getDestImage("DPS")        → bali
 *   getDestImage("Bali")       → bali
 *   getDestImage("Asia")       → Asia generic fallback
 *   getDestImage("unknown")    → world generic fallback
 */

export interface DestImage {
  /** Photo ID de Unsplash. */
  photoId: string;
  /** Brief alt text para a11y. */
  alt: string;
  /** Tinted color complementario (overlay). */
  accent: string;
}

const PHOTOS: Record<string, DestImage> = {
  // ── Asia tropical ──
  bali: { photoId: "1537996194471-e657df975ab4", alt: "Bali rice terraces", accent: "#10B981" },
  bangkok: { photoId: "1563492065599-3520f775eeed", alt: "Bangkok temples", accent: "#F59E0B" },
  tokio: { photoId: "1540959733332-eab4deabeeaf", alt: "Tokyo neon street", accent: "#DC2626" },
  tokyo: { photoId: "1540959733332-eab4deabeeaf", alt: "Tokyo neon street", accent: "#DC2626" },
  seul: { photoId: "1538485399081-7c8979e372f6", alt: "Seoul skyline", accent: "#6366F1" },
  singapur: { photoId: "1525625293386-3f8f99389edd", alt: "Singapore Marina Bay", accent: "#0EA5E9" },
  maldivas: { photoId: "1514282401047-d79a71a590e8", alt: "Maldives overwater villa", accent: "#06B6D4" },

  // ── Mediterráneo / Europa Sur ──
  lisboa: { photoId: "1555881400-74d7acaacd8b", alt: "Lisbon tram", accent: "#F59E0B" },
  roma: { photoId: "1552832230-c0197dd311b5", alt: "Rome Colosseum", accent: "#DC2626" },
  paris: { photoId: "1502602898657-3e91760cbb34", alt: "Paris Eiffel tower", accent: "#3B82F6" },
  milan: { photoId: "1520440229-6469a149ac59", alt: "Milan duomo", accent: "#9333EA" },
  amsterdam: { photoId: "1534351590666-13e3e96c5017", alt: "Amsterdam canal", accent: "#10B981" },
  berlin: { photoId: "1567593810070-7a3d471af022", alt: "Berlin landmarks", accent: "#6B7280" },
  praga: { photoId: "1592906209472-a36b1f3782ef", alt: "Prague old town", accent: "#F59E0B" },
  estambul: { photoId: "1524231757912-21f4fe3a7200", alt: "Istanbul Bosphorus", accent: "#0EA5E9" },
  marrakech: { photoId: "1597212618440-806262de4f6b", alt: "Marrakech medina", accent: "#F59E0B" },

  // ── UK / Atlántico Norte ──
  londres: { photoId: "1513635269975-59663e0ac1ad", alt: "London Big Ben", accent: "#3B82F6" },
  reikiavik: { photoId: "1492571350019-22de08371fd3", alt: "Iceland landscape", accent: "#0EA5E9" },

  // ── Norteamérica ──
  nueva_york: { photoId: "1496442226666-8d4d0e62e6e9", alt: "New York skyline", accent: "#FBBF24" },
  miami: { photoId: "1500916434205-0c77489c6cf7", alt: "Miami beach palms", accent: "#06B6D4" },
  los_angeles: { photoId: "1502175353174-a7a44e8de93d", alt: "Los Angeles skyline", accent: "#F59E0B" },

  // ── Sudamérica ──
  buenos_aires: { photoId: "1589909202802-8f4aadce1849", alt: "Buenos Aires architecture", accent: "#0EA5E9" },
  rio: { photoId: "1483729558449-99ef09a8c325", alt: "Rio de Janeiro beach", accent: "#10B981" },
  cdmx: { photoId: "1547504717-65b6395b3a7b", alt: "Mexico City colonial", accent: "#F59E0B" },
  cancun: { photoId: "1552074284-5e88ef1aef18", alt: "Cancún beach aerial Caribbean", accent: "#06B6D4" },

  // ── España ──
  madrid: { photoId: "1543783207-ec64e4d95325", alt: "Madrid Plaza Mayor", accent: "#DC2626" },
  barcelona: { photoId: "1583422409516-2895a77efded", alt: "Barcelona Sagrada Familia", accent: "#F59E0B" },
  malaga: { photoId: "1518002171953-a080ee817e1f", alt: "Málaga Costa del Sol", accent: "#06B6D4" },
  valencia: { photoId: "1564507592333-c60657eea523", alt: "Valencia city of arts", accent: "#3B82F6" },
  sevilla: { photoId: "1562979314-bee7453e911c", alt: "Seville Plaza España", accent: "#F59E0B" },
  palma: { photoId: "1473496169904-658ba7c44d8a", alt: "Palma de Mallorca Mediterranean beach", accent: "#0EA5E9" },

  // ── África ──
  cairo: { photoId: "1572252009286-268acec5ca0a", alt: "Cairo pyramids", accent: "#F59E0B" },

  // ── Generic fallbacks por región ──
  europa: { photoId: "1502602898657-3e91760cbb34", alt: "Europe travel", accent: "#3B82F6" },
  asia: { photoId: "1540959733332-eab4deabeeaf", alt: "Asia travel", accent: "#DC2626" },
  caribe: { photoId: "1514282401047-d79a71a590e8", alt: "Caribbean beach", accent: "#06B6D4" },
  africa: { photoId: "1597212618440-806262de4f6b", alt: "Africa travel", accent: "#F59E0B" },
  oceania: { photoId: "1525625293386-3f8f99389edd", alt: "Oceania landscape", accent: "#10B981" },
  norteamerica: { photoId: "1496442226666-8d4d0e62e6e9", alt: "North America", accent: "#FBBF24" },
  sudamerica: { photoId: "1589909202802-8f4aadce1849", alt: "South America", accent: "#0EA5E9" },
  oriente_medio: { photoId: "1572252009286-268acec5ca0a", alt: "Middle East", accent: "#F59E0B" },

  // ── World fallback ──
  world: { photoId: "1488646953014-85cb44e25828", alt: "World travel", accent: "#fbbf24" },
};

/**
 * Mapping IATA → slug ciudad. Cubrimos los IATAs más usados en deals.
 */
const IATA_TO_KEY: Record<string, string> = {
  DPS: "bali", BKK: "bangkok", NRT: "tokio", HND: "tokio", ICN: "seul",
  SIN: "singapur", MLE: "maldivas",
  LIS: "lisboa", FCO: "roma", CDG: "paris", ORY: "paris",
  MXP: "milan", LIN: "milan", AMS: "amsterdam", BER: "berlin",
  PRG: "praga", IST: "estambul", RAK: "marrakech",
  LHR: "londres", LGW: "londres", STN: "londres", LTN: "londres", LCY: "londres",
  KEF: "reikiavik", JFK: "nueva_york", LGA: "nueva_york", EWR: "nueva_york",
  MIA: "miami", LAX: "los_angeles",
  EZE: "buenos_aires", AEP: "buenos_aires",
  GIG: "rio", SDU: "rio", MEX: "cdmx", CUN: "cancun",
  MAD: "madrid", TOJ: "madrid",
  BCN: "barcelona", AGP: "malaga", VLC: "valencia", SVQ: "sevilla", PMI: "palma",
  CAI: "cairo",
};

/**
 * Resuelve input (IATA/ciudad/región) a DestImage. Siempre devuelve algo
 * (fallback a world si nada matchea).
 */
export function getDestImage(input: string | undefined | null): DestImage {
  if (!input) return PHOTOS.world;

  // Probar IATA
  const iata = input.trim().toUpperCase();
  if (IATA_TO_KEY[iata]) {
    const key = IATA_TO_KEY[iata];
    return PHOTOS[key] || PHOTOS.world;
  }

  // Probar slug directo lowercase
  const slug = input.toLowerCase().trim().replace(/\s+/g, "_");
  if (PHOTOS[slug]) return PHOTOS[slug];

  // Probar región
  const norm = slug
    .replace(/é/g, "e")
    .replace(/á/g, "a")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ñ/g, "n");
  if (PHOTOS[norm]) return PHOTOS[norm];

  return PHOTOS.world;
}

/**
 * Construye URL Unsplash optimizada para dimensiones IG.
 * Los photoIds ya incluyen el dígito inicial completo (ej "1537996194471-..."),
 * solo necesitamos prefijar con "photo-".
 *
 * SSS56b BUG FIX: antes prefixaba "photo-1" duplicando el 1 inicial → URL
 * inválida → fetch fallaba silenciosamente → ImageResponse sin bg.
 */
export function buildUnsplashUrl(
  photoId: string,
  width = 1080,
  height = 1080,
): string {
  const id = photoId.startsWith("photo-") ? photoId : `photo-${photoId}`;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

/**
 * SSS64 — variantes estacionales para destinos donde el momento del año
 * cambia drásticamente la imagen icónica. Devuelve la variante adecuada
 * según el mes (UTC) actual, o la base si no hay variante.
 *
 * Uso: imagen Tokio en marzo-abril → sakura en flor (rosa)
 *      imagen Reikiavik en oct-marzo → auroras boreales (verde sobre nieve)
 *      imagen Bali en jul-sept → terrazas de arroz seco doradas
 *
 * Mapping season → photoId distinto al base. El accent también cambia
 * para reflejar la paleta del momento.
 */
const SEASONAL_VARIANTS: Record<string, Array<{ months: number[]; image: DestImage }>> = {
  tokio: [
    {
      months: [3, 4],
      image: { photoId: "1522383225653-ed111181a951", alt: "Tokyo cherry blossoms", accent: "#EC4899" },
    },
    {
      months: [11, 12, 1],
      image: { photoId: "1542051841857-5f90071e7989", alt: "Tokyo winter illuminations", accent: "#F59E0B" },
    },
  ],
  tokyo: [
    {
      months: [3, 4],
      image: { photoId: "1522383225653-ed111181a951", alt: "Tokyo cherry blossoms", accent: "#EC4899" },
    },
  ],
  reikiavik: [
    {
      months: [10, 11, 12, 1, 2, 3],
      image: { photoId: "1483347756197-71ef80e95f73", alt: "Iceland aurora borealis", accent: "#10B981" },
    },
  ],
  bali: [
    {
      months: [7, 8, 9],
      image: { photoId: "1500964757637-c85e8a162699", alt: "Bali dry-season terraces", accent: "#D97706" },
    },
  ],
  paris: [
    {
      months: [11, 12],
      image: { photoId: "1551866442-67c95cc7e0ef", alt: "Paris winter Christmas", accent: "#DC2626" },
    },
  ],
  nueva_york: [
    {
      months: [11, 12],
      image: { photoId: "1543341724-13ec3196c47c", alt: "New York Christmas tree", accent: "#10B981" },
    },
  ],
  amsterdam: [
    {
      months: [3, 4],
      image: { photoId: "1576763595295-c0371a3e6e6f", alt: "Amsterdam tulip fields", accent: "#EC4899" },
    },
  ],
};

/**
 * Get destination image with optional seasonal variant.
 * If `month` is provided (1-12) and there's a seasonal variant for that
 * destination + month, returns the variant. Otherwise base image.
 */
export function getSeasonalDestImage(
  input: string | undefined | null,
  month?: number,
): DestImage {
  const base = getDestImage(input);
  if (!input || month === undefined) return base;

  const key = String(input).toLowerCase().trim();
  const variants = SEASONAL_VARIANTS[key];
  if (!variants) return base;

  const matching = variants.find((v) => v.months.includes(month));
  return matching ? matching.image : base;
}

/**
 * Convenience: returns variant for current UTC month.
 */
export function getCurrentSeasonalDestImage(input: string | undefined | null): DestImage {
  const month = new Date().getUTCMonth() + 1; // 1-12
  return getSeasonalDestImage(input, month);
}
