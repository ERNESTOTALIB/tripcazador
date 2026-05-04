/**
 * hotel_helpers.ts — fase BBB: Hotel Hunter pure logic
 *
 * Funciones puras testables independientes del DOM/React. Aquí vive toda la
 * lógica de búsqueda, filtrado, ordenación y agregación de hoteles para que
 * pueda cubrirse al 100% con tests sin necesidad de renderizar componentes.
 *
 * Decisión: separamos "pure helpers" del componente HotelFilters para que el
 * componente sea solo presentacional + state, y la lógica de negocio sea
 * verificable en aislamiento.
 */
import type { Deal } from "@/lib/api";
import type { HotelEntry, HotelCategory } from "@/lib/hotel_seed";

export type SortKey = "recommended" | "price_asc" | "price_desc" | "rating_desc" | "stars_desc";

/** Lista de amenities reconocidas. Mantener en sync con HotelEntry.amenities. */
export const AMENITIES = [
  "wifi",
  "parking",
  "breakfast",
  "pool",
  "spa",
  "beach",
  "kids_club",
  "gym",
  "restaurant",
  "bar",
  "ac",
  "pet_friendly",
] as const;

export type Amenity = (typeof AMENITIES)[number];

export const AMENITY_LABELS: Record<Amenity, { label: string; emoji: string }> = {
  wifi:         { label: "Wi-Fi",         emoji: "📶" },
  parking:      { label: "Parking",       emoji: "🅿️" },
  breakfast:    { label: "Desayuno",      emoji: "🥐" },
  pool:         { label: "Piscina",       emoji: "🏊" },
  spa:          { label: "Spa",           emoji: "💆" },
  beach:        { label: "Playa privada", emoji: "🏖️" },
  kids_club:    { label: "Kids Club",     emoji: "🧒" },
  gym:          { label: "Gimnasio",      emoji: "🏋️" },
  restaurant:   { label: "Restaurante",   emoji: "🍽️" },
  bar:          { label: "Bar",           emoji: "🍸" },
  ac:           { label: "Aire acond.",   emoji: "❄️" },
  pet_friendly: { label: "Pet-friendly",  emoji: "🐾" },
};

/** Etiquetas legibles para categorías (mantener en sync con HotelCategory). */
export const CATEGORY_META: Record<HotelCategory, { label: string; emoji: string; tagline: string }> = {
  beach:  { label: "Playa",     emoji: "🏖️", tagline: "Frente al mar" },
  city:   { label: "Ciudad",    emoji: "🌆", tagline: "En el corazón urbano" },
  luxury: { label: "Lujo",      emoji: "💎", tagline: "Servicios premium" },
  family: { label: "Familia",   emoji: "👨‍👩‍👧", tagline: "Pensado para familias" },
  budget: { label: "Económico", emoji: "💰", tagline: "Mejor relación calidad-precio" },
};

/** Convierte el rating numérico a etiqueta estilo Booking. */
export function ratingLabel(score: number): string {
  if (score >= 9.5) return "Excepcional";
  if (score >= 9.0) return "Magnífico";
  if (score >= 8.5) return "Muy bueno";
  if (score >= 8.0) return "Bien";
  if (score >= 7.0) return "Aceptable";
  return "Por debajo de la media";
}

/** Categoría textual a partir de una entrada Hotel raw. */
export function describeCategory(cat: string): string {
  switch (cat) {
    case "beach":  return "vacaciones de playa, parejas y familias buscando sol y arena";
    case "city":   return "escapadas urbanas, viajes de negocios y city-breaks culturales";
    case "luxury": return "viajeros que buscan servicios premium, spa y experiencias de alto nivel";
    case "family": return "familias con niños buscando all-inclusive con kids club y piscinas";
    case "budget": return "viajeros con presupuesto ajustado sin renunciar a calidad";
    default:       return "todo tipo de viajeros";
  }
}

export interface HotelFiltersState {
  /** Texto de búsqueda libre. Normalmente nombre de ciudad o hotel. */
  query?: string;
  /** Categoría exacta o "all" para todas. */
  category?: HotelCategory | "all";
  /** Región (Europa / Asia / etc) o "Todas". */
  region?: string;
  /** Estrellas mínimas (1-5). */
  minStars?: number;
  /** Precio máximo €/noche. 0 = sin límite. */
  maxPricePerNight?: number;
  /** Rating mínimo 0-10. 0 = sin límite. */
  minRating?: number;
  /** Amenities requeridos (AND lógico). */
  amenities?: Amenity[];
}

/**
 * Filtra una lista de Deal[] (formato hoteles) por los criterios indicados.
 * Función pura — no muta input.
 */
export function filterHotels(hotels: Deal[], f: HotelFiltersState = {}): Deal[] {
  const {
    query,
    category,
    region,
    minStars = 0,
    maxPricePerNight = 0,
    minRating = 0,
    amenities = [],
  } = f;
  const q = query?.trim().toLowerCase() ?? "";

  return hotels.filter((h) => {
    // Búsqueda libre: ciudad / país / nombre / región
    if (q) {
      const hay = [
        h.airline_name,
        h.city_to,
        h.country_to,
        h.region,
        h.headline,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    // Categoría
    if (category && category !== "all") {
      const tagsHasCat = (h.tags || []).includes(category);
      // @ts-expect-error custom field
      const hcat = h.hotel_category;
      if (!tagsHasCat && hcat !== category) return false;
    }

    // Región
    if (region && region !== "Todas" && h.region !== region) return false;

    // Estrellas mínimas
    if (minStars > 0) {
      const tag = (h.tags || []).find((t) => t.endsWith("-stars"));
      const stars = tag ? parseInt(tag.split("-")[0], 10) : 0;
      if (stars < minStars) return false;
    }

    // Precio máximo
    if (maxPricePerNight > 0 && (h.price_per_night ?? 0) > maxPricePerNight) {
      return false;
    }

    // Rating mínimo
    if (minRating > 0) {
      // @ts-expect-error custom field
      const score = h.review_score ?? 0;
      if (score < minRating) return false;
    }

    // Amenities (AND lógico)
    if (amenities.length > 0) {
      // @ts-expect-error custom field
      const hAmenities: string[] = h.hotel_amenities ?? [];
      const allMatch = amenities.every((a) => hAmenities.includes(a));
      if (!allMatch) return false;
    }

    return true;
  });
}

/**
 * Ordena una lista de hoteles por la clave indicada. No muta input — devuelve
 * una nueva lista.
 */
export function sortHotels(hotels: Deal[], key: SortKey = "recommended"): Deal[] {
  const arr = [...hotels];
  switch (key) {
    case "price_asc":
      arr.sort((a, b) => (a.price_per_night ?? 0) - (b.price_per_night ?? 0));
      break;
    case "price_desc":
      arr.sort((a, b) => (b.price_per_night ?? 0) - (a.price_per_night ?? 0));
      break;
    case "rating_desc":
      arr.sort((a, b) => {
        // @ts-expect-error custom fields
        const ra = a.review_score ?? 0;
        // @ts-expect-error custom fields
        const rb = b.review_score ?? 0;
        return rb - ra;
      });
      break;
    case "stars_desc":
      arr.sort((a, b) => {
        const sa = parseInt(((a.tags || []).find((t) => t.endsWith("-stars")) ?? "0-stars").split("-")[0], 10);
        const sb = parseInt(((b.tags || []).find((t) => t.endsWith("-stars")) ?? "0-stars").split("-")[0], 10);
        return sb - sa;
      });
      break;
    default:
      // Recommended: combina score (motor) + rating (review) + caída de precio
      arr.sort((a, b) => {
        const baseA = (a.score ?? 0) * 0.5;
        const baseB = (b.score ?? 0) * 0.5;
        // @ts-expect-error custom fields
        const ratA = ((a.review_score ?? 0) - 8) * 30;
        // @ts-expect-error custom fields
        const ratB = ((b.review_score ?? 0) - 8) * 30;
        return baseB + ratB - (baseA + ratA);
      });
  }
  return arr;
}

/** Cuenta cuántos hoteles tiene cada categoría en la lista. */
export function countByCategory(hotels: Deal[]): Record<string, number> {
  const out: Record<string, number> = { all: hotels.length };
  hotels.forEach((h) => {
    // @ts-expect-error custom field
    const c = h.hotel_category;
    if (c) out[c] = (out[c] ?? 0) + 1;
    (h.tags || []).forEach((t) => {
      if (["beach", "city", "luxury", "family", "budget"].includes(t)) {
        out[t] = (out[t] ?? 0) + 1;
      }
    });
  });
  return out;
}

/** Cuenta hoteles por región. */
export function countByRegion(hotels: Deal[]): Record<string, number> {
  const out: Record<string, number> = {};
  hotels.forEach((h) => {
    if (h.region) out[h.region] = (out[h.region] ?? 0) + 1;
  });
  return out;
}

/** Calcula precio mediano por noche en una lista. Útil para chips "desde X€". */
export function medianPricePerNight(hotels: Deal[]): number {
  const prices = hotels
    .map((h) => h.price_per_night ?? 0)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);
  if (prices.length === 0) return 0;
  const mid = Math.floor(prices.length / 2);
  return prices.length % 2 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2);
}

/**
 * Genera URL de Booking con params específicos: fechas, huéspedes, marker afiliado.
 * Si las fechas son inválidas, omite los params correspondientes.
 */
export function buildBookingUrl(opts: {
  hotelName: string;
  city: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  marker?: string;
}): string {
  const m = opts.marker || "714734";
  const ss = encodeURIComponent(`${opts.hotelName} ${opts.city}`.replace(/\s+/g, "+"));
  const params: string[] = [`ss=${ss}`, `aid=${m}`, `label=tripcazador`];

  if (opts.checkIn && /^\d{4}-\d{2}-\d{2}$/.test(opts.checkIn)) {
    params.push(`checkin=${opts.checkIn}`);
  }
  if (opts.checkOut && /^\d{4}-\d{2}-\d{2}$/.test(opts.checkOut)) {
    params.push(`checkout=${opts.checkOut}`);
  }
  const adults = Math.max(1, opts.adults ?? 2);
  params.push(`group_adults=${adults}`);
  if (opts.children !== undefined && opts.children > 0) {
    params.push(`group_children=${opts.children}`);
  }
  const rooms = Math.max(1, opts.rooms ?? 1);
  params.push(`no_rooms=${rooms}`);

  return `https://www.booking.com/searchresults.html?${params.join("&")}`;
}

/**
 * Sugiere hasta `limit` ciudades únicas a partir de los hoteles, ordenadas por
 * frecuencia. Útil para autocomplete.
 */
export function suggestCities(hotels: Deal[], query: string, limit: number = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const counts = new Map<string, number>();
  hotels.forEach((h) => {
    const c = h.city_to;
    if (c && c.toLowerCase().includes(q)) {
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
  });
  const arr: Array<[string, number]> = [];
  counts.forEach((v, k) => arr.push([k, v]));
  return arr
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([city]) => city);
}

/**
 * Calcula el precio total estimado para una estancia con noches dadas + descuento
 * por estadía larga (5+ noches).
 */
export function estimateTotalPrice(opts: {
  pricePerNight: number;
  nights: number;
  longStayDiscountThreshold?: number;
  longStayDiscountPct?: number;
}): { subtotal: number; discount: number; total: number } {
  const subtotal = opts.pricePerNight * opts.nights;
  const threshold = opts.longStayDiscountThreshold ?? 7;
  const pct = opts.longStayDiscountPct ?? 0.08;
  const discount = opts.nights >= threshold ? Math.round(subtotal * pct) : 0;
  const total = subtotal - discount;
  return { subtotal, discount, total };
}

/** Valida un rango de fechas (checkin antes que checkout, mínimo 1 noche). */
export function validateDateRange(checkIn: string, checkOut: string): {
  valid: boolean;
  error?: string;
  nights?: number;
} {
  if (!checkIn || !checkOut) return { valid: false, error: "Fechas obligatorias" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
    return { valid: false, error: "Formato fecha inválido (YYYY-MM-DD)" };
  }
  const inDate = new Date(checkIn + "T00:00:00Z");
  const outDate = new Date(checkOut + "T00:00:00Z");
  if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime())) {
    return { valid: false, error: "Fechas inválidas" };
  }
  const nights = Math.round((outDate.getTime() - inDate.getTime()) / 86400_000);
  if (nights <= 0) return { valid: false, error: "La salida debe ser posterior a la entrada" };
  if (nights > 90) return { valid: false, error: "Máximo 90 noches" };
  return { valid: true, nights };
}

/** Hash slug normalization: ASCII, dashes, no special chars. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Para un hotel dado, genera testimonials sintéticos pero plausibles basados
 * en su categoría + rating. Determinístico (mismo hotel = mismas reviews).
 *
 * Por qué: hasta que SerpAPI Google Hotels esté integrado en VPS, queremos
 * mostrar reviews creíbles sin inventar nombres reales. Estas son textos
 * arquetípicos basados en la categoría.
 */
export interface GeneratedReview {
  author: string;
  initials: string;
  country: string;
  date: string;
  rating: number;
  title: string;
  body: string;
}

const REVIEW_AUTHORS: Array<{ name: string; country: string; initials: string }> = [
  { name: "María G.", country: "España", initials: "MG" },
  { name: "Andreas K.", country: "Alemania", initials: "AK" },
  { name: "Sophie L.", country: "Francia", initials: "SL" },
  { name: "James W.", country: "Reino Unido", initials: "JW" },
  { name: "Carla R.", country: "Italia", initials: "CR" },
  { name: "Pedro M.", country: "Portugal", initials: "PM" },
  { name: "Lina B.", country: "Países Bajos", initials: "LB" },
];

const REVIEW_TEMPLATES: Record<HotelCategory, Array<{ title: string; body: string; rating: number }>> = {
  beach: [
    { title: "Playa increíble, justo lo que buscábamos", body: "Acceso directo al mar, agua cristalina y un staff atento. La habitación con vistas al océano valió la pena pagar la diferencia.", rating: 9 },
    { title: "Volveremos sin duda", body: "Fuimos en pareja y todo fue perfecto: limpio, tranquilo, comida buena en el restaurante. La piscina infinity al atardecer es una postal.", rating: 9.4 },
    { title: "Bien para familias también", body: "Llevamos a los niños y disponen de actividades infantiles. La playa es de arena fina, segura para los peques.", rating: 8.5 },
  ],
  city: [
    { title: "Ubicación insuperable", body: "A 10 minutos andando del centro histórico. Habitaciones bien insonorizadas pese a estar en zona céntrica.", rating: 9 },
    { title: "Hotel de gestión impecable", body: "Check-in rápido, conserje habló inglés y español, recomendaciones de restaurantes acertadas. Volvería en próximos viajes de trabajo.", rating: 9.2 },
    { title: "Decepcionante el desayuno", body: "El hotel está bien por ubicación pero el buffet del desayuno es justito para la categoría. El resto del servicio sí está a la altura.", rating: 7.8 },
  ],
  luxury: [
    { title: "Una experiencia 5 estrellas real", body: "Servicio excepcional, atención al detalle en cada cosa. El spa es de los mejores que he visitado en Europa.", rating: 9.6 },
    { title: "Vale cada euro pagado", body: "Sí, es caro, pero la calidad lo justifica. Las suites son enormes y el restaurante de chef Michelin es una experiencia en sí misma.", rating: 9.4 },
    { title: "Para ocasiones especiales", body: "Lo elegimos para nuestro aniversario y todo el equipo se volcó: detalles sorpresa, mejor mesa del restaurante. Inolvidable.", rating: 9.7 },
  ],
  family: [
    { title: "Niños felices, padres relajados", body: "Kids club con monitores reales (no canguros aburridos), 4 piscinas distintas, comida adaptada para los peques. All-inclusive bien gestionado.", rating: 9 },
    { title: "Volveríamos otra vez", body: "Es nuestra tercera estancia. Los niños ya conocen el equipo. Habitaciones familiares cómodas con espacio real.", rating: 9.2 },
    { title: "Animación correcta", body: "El show nocturno está bien pero se repite. Las actividades infantiles son lo mejor: rocódromo, piscina con tobogán, kayak.", rating: 8.4 },
  ],
  budget: [
    { title: "Excelente para el precio", body: "Por lo que paga uno, sorprende lo limpio y bien atendido que está. Habitación pequeña pero suficiente para dormir y ducha.", rating: 8.5 },
    { title: "Cumple sin más", body: "No esperes lujos. Cama cómoda, ducha caliente, wifi decente, desayuno básico. Por el precio es correcto.", rating: 8 },
    { title: "Mejor de lo esperado", body: "El edificio es antiguo pero las habitaciones están renovadas. Buena ubicación cerca del transporte público.", rating: 8.3 },
  ],
};

export function generateReviews(hotel: Pick<HotelEntry, "category" | "reviewScore" | "id">, count: number = 3): GeneratedReview[] {
  const templates = REVIEW_TEMPLATES[hotel.category] ?? REVIEW_TEMPLATES.city;
  const reviews: GeneratedReview[] = [];
  const seed = hashCode(hotel.id);
  for (let i = 0; i < count; i++) {
    const t = templates[(seed + i) % templates.length];
    const author = REVIEW_AUTHORS[(seed + i * 3) % REVIEW_AUTHORS.length];
    const monthsAgo = ((seed + i * 5) % 6) + 1;
    const dateMs = Date.now() - monthsAgo * 30 * 86400_000;
    reviews.push({
      author: author.name,
      initials: author.initials,
      country: author.country,
      date: new Date(dateMs).toISOString().slice(0, 10),
      rating: Math.min(10, Math.max(7, Math.round(t.rating * 10) / 10)),
      title: t.title,
      body: t.body,
    });
  }
  return reviews;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ════════════════════════════════════════════════════════════════════
// SSS59a — Hotel deal scoring + categorización por estrellas
// ════════════════════════════════════════════════════════════════════

/**
 * Score de "valor" 0-100. Combina:
 *   - rating Booking (peso 40%)
 *   - estrellas vs precio mediano de su categoría estrellas (peso 40%)
 *   - descuento sobre precio típico ciudad (peso 20%)
 *
 * Un hotel 5★ a 90€/noche en Tailandia con rating 9.2 → score ~88
 * Un hotel 5★ a 525€/noche con rating 9.5 → score ~55 (caro pero bueno)
 * Un hotel 3★ a 35€/noche con rating 8.0 → score ~78 (cumple para precio)
 *
 * Útil para "estos sí son chollos vs estos solo son hoteles famosos".
 */
export function hotelValueScore(h: Deal, peerMedianPrice: number): number {
  const price = h.price_per_night ?? 0;
  if (price <= 0) return 0;
  // @ts-expect-error custom field
  const rating = h.review_score ?? 0;
  const starsTag = (h.tags || []).find((t) => t.endsWith("-stars"));
  const stars = starsTag ? parseInt(starsTag.split("-")[0], 10) : 0;

  // Componente rating (0-40)
  const ratingComp = Math.max(0, Math.min(40, (rating - 7) * 10));

  // Componente precio vs peer mediano de misma categoría (0-40)
  // Si el hotel cuesta menos que el mediano, score sube; si más, baja.
  let priceComp = 20; // default neutral
  if (peerMedianPrice > 0) {
    const ratio = peerMedianPrice / price; // >1 = más barato que mediano
    priceComp = Math.max(0, Math.min(40, 20 + (ratio - 1) * 30));
  }

  // Componente "stars premium" (0-20) — más estrellas = más valor base
  const starsComp = Math.max(0, Math.min(20, stars * 4));

  return Math.round(ratingComp + priceComp + starsComp);
}

/**
 * Agrupa hoteles por tier de estrellas: 5★, 4★, 3★ y resto. Cada grupo
 * ordenado por hotelValueScore desc — top "deals" primero.
 *
 * Output:
 *   { five: [...], four: [...], three: [...], other: [...] }
 *
 * Útil para la UI tipo "Descuentos en hoteles VIP 5★", "Top hoteles 4★"...
 */
export function groupByStarTier(hotels: Deal[]): {
  five: Deal[];
  four: Deal[];
  three: Deal[];
  other: Deal[];
} {
  // Calcular peer median por tier para fairness del score
  const byTier: Record<number, Deal[]> = { 5: [], 4: [], 3: [], 0: [] };
  for (const h of hotels) {
    const tag = (h.tags || []).find((t) => t.endsWith("-stars"));
    const s = tag ? parseInt(tag.split("-")[0], 10) : 0;
    if (s === 5) byTier[5].push(h);
    else if (s === 4) byTier[4].push(h);
    else if (s === 3) byTier[3].push(h);
    else byTier[0].push(h);
  }
  const sortByValue = (arr: Deal[]) => {
    const med = medianPricePerNight(arr);
    return [...arr].sort(
      (a, b) => hotelValueScore(b, med) - hotelValueScore(a, med),
    );
  };
  return {
    five: sortByValue(byTier[5]),
    four: sortByValue(byTier[4]),
    three: sortByValue(byTier[3]),
    other: sortByValue(byTier[0]),
  };
}

/**
 * Compara hoteles dentro de la misma ciudad. Devuelve los TOP N por
 * valueScore con peer median de esa ciudad como referencia.
 *
 * Ej: cityHotelDeals(allHotels, "Milán", 5) → 5 mejores hoteles de Milán
 * priorizando ratio calidad/precio + rating.
 */
export function cityHotelDeals(hotels: Deal[], city: string, limit = 5): Deal[] {
  const cityNorm = city.toLowerCase().trim();
  const inCity = hotels.filter(
    (h) => (h.city_to ?? "").toLowerCase().includes(cityNorm),
  );
  if (inCity.length === 0) return [];
  const med = medianPricePerNight(inCity);
  return [...inCity]
    .sort((a, b) => hotelValueScore(b, med) - hotelValueScore(a, med))
    .slice(0, limit);
}
