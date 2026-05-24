/**
 * hotel_seed — fase yy YY1 (expansion 30→60 + categorías + imágenes + reviews)
 *
 * Fallback con 210+ hoteles reales cuando el backend hotel_hunter devuelve [].
 *
 * Mejoras vs WW1:
 *  - 210+ hoteles: cobertura mundial masiva con todos los rangos de precio
 *  - Cada hotel con `hotel_image_id` Unsplash (whitelisted en /api/img)
 *  - `category` (beach / city / luxury / family / budget) → filtros tabs
 *  - `review_score` (8.0–9.6) y `review_count` para social proof
 *  - `slug` único por hotel → /hoteles/[slug] detail pages
 *
 * Cada vez que un usuario reserva clickando estos enlaces nos llevamos comisión
 * Travelpayouts (~4-6% del total). Re-actualizar cada 3-6 meses con precios
 * realistas de temporada.
 */
import type { Deal } from "@/lib/api";

const TP_MARKER = process.env.NEXT_PUBLIC_BOOKING_AID || "714734";

export type HotelCategory = "beach" | "city" | "luxury" | "family" | "budget";

export interface HotelEntry {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  region: string;
  stars: number;
  pricePerNight: number;
  emoji: string;
  daysAgo: number;
  category: HotelCategory;
  imageId: string; // Unsplash photo ID (sin dominio)
  reviewScore: number; // 0-10, formato Booking
  reviewCount: number;
  highlight?: string; // ej "Vistas al mar", "Spa incluido"
  /** Coordenadas opcionales para mostrar en mapa. Si no, derivamos por país. */
  lat?: number;
  lng?: number;
  /** Lista de amenities. Auto-rellenado por defaults si no se especifica. */
  amenities?: string[];
}

function bookingUrl(city: string, hotelName: string): string {
  const search = `${hotelName} ${city}`.replace(/\s+/g, "+");
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    search,
  )}&aid=${TP_MARKER}&label=tripcazador`;
}

function hotelImageUrl(imageId: string, w: number = 640): string {
  // Pasamos por nuestro proxy /api/img para tener cache + privacy + anti-SSRF.
  const upstream = `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=${w}&q=78`;
  return `/api/img?u=${encodeURIComponent(upstream)}&w=${w}&q=78`;
}

/**
 * Coordenadas aproximadas por país. Útil para mostrar mapa cuando el hotel
 * no tiene lat/lng específicos. Centroides geográficos turísticos, no exactos.
 */
const COUNTRY_COORDS: Record<string, [number, number]> = {
  Tailandia: [13.7563, 100.5018],
  Indonesia: [-8.4095, 115.1889],
  Maldivas: [3.2028, 73.2207],
  Vietnam: [10.7769, 106.7009],
  Japón: [35.6762, 139.6503],
  Singapur: [1.3521, 103.8198],
  Grecia: [37.9838, 23.7275],
  Italia: [41.9028, 12.4964],
  España: [40.4168, -3.7038],
  Portugal: [38.7223, -9.1393],
  Francia: [48.8566, 2.3522],
  "Reino Unido": [51.5074, -0.1278],
  Alemania: [52.5200, 13.4050],
  Islandia: [64.1466, -21.9426],
  Turquía: [41.0082, 28.9784],
  Marruecos: [31.6295, -7.9811],
  Sudáfrica: [-33.9249, 18.4241],
  Tanzania: [-6.7924, 39.2083],
  "República Dominicana": [18.5601, -68.3725],
  Cuba: [23.1136, -82.3666],
  México: [19.4326, -99.1332],
  Jamaica: [18.0179, -76.8099],
  "Estados Unidos": [40.7128, -74.0060],
  Argentina: [-34.6037, -58.3816],
  Brasil: [-22.9068, -43.1729],
  Perú: [-13.5320, -71.9675],
  Australia: [-33.8688, 151.2093],
  "Polinesia Francesa": [-17.6797, -149.4068],
  "Emiratos Árabes Unidos": [25.2048, 55.2708],
  Catar: [25.2854, 51.5310],
  Suecia: [59.3293, 18.0686],
  Noruega: [59.9139, 10.7522],
  Dinamarca: [55.6761, 12.5683],
  Finlandia: [60.1699, 24.9384],
  "República Checa": [50.0755, 14.4378],
  Hungría: [47.4979, 19.0402],
  Croacia: [42.6507, 18.0944],
  Polonia: [50.0647, 19.9450],
  India: [19.0760, 72.8777],
  "Sri Lanka": [7.2906, 80.6337],
  "Costa Rica": [10.4933, -84.7068],
  Colombia: [10.3910, -75.5364],
  Barbados: [13.1939, -59.5432],
  Kenia: [-1.2921, 36.8219],
  Egipto: [24.0889, 32.8998],
  "Corea del Sur": [37.5665, 126.9780],
  Camboya: [13.4125, 103.8670],
  Myanmar: [16.8661, 96.1951],
  Bulgaria: [43.2141, 27.9147],
  Albania: [39.8751, 20.0047],
  Túnez: [36.8625, 10.1956],
  Nepal: [27.7172, 85.3240],
  Filipinas: [10.3157, 123.8854],
  Malasia: [3.139, 101.6869],
  China: [31.2304, 121.4737],
  "Taiwán": [25.033, 121.5654],
  "Países Bajos": [52.3676, 4.9041],
  Suiza: [47.3769, 8.5417],
  Austria: [48.2082, 16.3738],
  "Bélgica": [50.8503, 4.3517],
  Irlanda: [53.3498, -6.2603],
  Montenegro: [42.4304, 18.7714],
  Malta: [35.8989, 14.5146],
  Mauricio: [-20.1609, 57.5012],
  Seychelles: [-4.6796, 55.492],
  Ruanda: [-1.9403, 29.8739],
  Ghana: [5.6037, -0.187],
  Senegal: [14.7167, -17.4677],
  "Turks y Caicos": [21.7944, -72.1531],
  Aruba: [12.5211, -69.9683],
  "Santa Lucía": [13.9094, -60.9789],
  "Puerto Rico": [18.4655, -66.1057],
  "Canadá": [45.5017, -73.5673],
  Chile: [-33.4489, -70.6693],
  Ecuador: [-0.1807, -78.4678],
  Uruguay: [-34.9011, -54.9508],
  Bolivia: [-20.4637, -66.9903],
  "Nueva Zelanda": [-45.0312, 168.6626],
  Fiyi: [-17.7765, 177.9631],
  "Omán": [23.5880, 58.3829],
  Jordania: [31.5697, 35.4697],
  Israel: [31.7683, 35.2137],
  "Arabia Saudita": [24.7136, 46.6753],
  Eslovenia: [46.0569, 14.5058],
  "Rumanía": [44.4268, 26.1025],
  Serbia: [44.7866, 20.4489],
};

/**
 * Amenities por defecto según categoría. Para datos auto-completados cuando
 * el hotel raw no especifica `amenities`.
 */
const DEFAULT_AMENITIES_BY_CAT: Record<HotelCategory, string[]> = {
  beach:  ["wifi", "pool", "beach", "restaurant", "bar", "ac", "parking"],
  city:   ["wifi", "breakfast", "ac", "restaurant", "bar", "gym"],
  luxury: ["wifi", "pool", "spa", "restaurant", "bar", "gym", "ac", "parking", "breakfast"],
  family: ["wifi", "pool", "kids_club", "restaurant", "ac", "parking", "breakfast"],
  budget: ["wifi", "ac", "breakfast"],
};

function deriveAmenities(h: HotelEntry): string[] {
  if (h.amenities && h.amenities.length > 0) return h.amenities;
  const base = DEFAULT_AMENITIES_BY_CAT[h.category];
  // 5★ siempre suma spa+gym
  if (h.stars === 5) {
    return Array.from(new Set([...base, "spa", "gym", "restaurant"]));
  }
  return base;
}

function deriveCoords(h: HotelEntry): [number, number] {
  if (h.lat !== undefined && h.lng !== undefined) return [h.lat, h.lng];
  return COUNTRY_COORDS[h.country] ?? [0, 0];
}

function makeHotel(h: HotelEntry): Deal {
  const checkIn = new Date(Date.now() + 30 * 86400_000)
    .toISOString()
    .slice(0, 10);
  const checkOut = new Date(Date.now() + 35 * 86400_000)
    .toISOString()
    .slice(0, 10);
  const found = new Date(Date.now() - h.daysAgo * 3600_000).toISOString();
  return {
    id: `hotel-${h.id}`,
    type: "hotel",
    headline: `${h.name} (${h.stars}★) — ${h.city} desde ${h.pricePerNight}€/noche`,
    origin: "",
    destination: h.city.toUpperCase().slice(0, 3),
    city_from: "",
    city_to: h.city,
    country_to: h.country,
    region: h.region,
    price_eur: h.pricePerNight * 5,
    savings_pct: 35,
    savings_eur: Math.round(h.pricePerNight * 5 * 0.35),
    nights: 5,
    price_per_night: h.pricePerNight,
    date_out: checkIn,
    date_ret: checkOut,
    cabin: "",
    airline: "",
    airline_name: h.name,
    stops: 0,
    duration_min: 0,
    distance_category: "short",
    score: 80 + Math.round(Math.random() * 15),
    classification: "OFERTA",
    tags: [
      "hotel",
      `${h.stars}-stars`,
      h.region.toLowerCase(),
      h.category,
    ],
    found_at: found,
    expires_at: new Date(Date.now() + 7 * 86400_000).toISOString(),
    booking_url: bookingUrl(h.city, h.name),
    image_url: hotelImageUrl(h.imageId, 640),
    emoji: h.emoji,
    description:
      `${h.name} ${h.stars}★ en ${h.city}, ${h.country}. Precio típico ` +
      `${h.pricePerNight}€/noche para 2 personas con desayuno incluido. ` +
      (h.highlight ? `${h.highlight}.` : ""),
    note: undefined,
    // Campos custom para HotelCard / detail page
    hotel_slug: h.slug,
    hotel_category: h.category,
    review_score: h.reviewScore,
    review_count: h.reviewCount,
    hotel_image_id: h.imageId,
    highlight: h.highlight,
    hotel_amenities: deriveAmenities(h),
    hotel_coords: deriveCoords(h),
  } as unknown as Deal;
}

// 210 hoteles reales. Cada uno con su propia imagen Unsplash y categoría.
const HOTEL_ENTRIES: HotelEntry[] = [
  // ───────── Asia · Tailandia
  { id: "th-1", slug: "dusit-thani-phuket", name: "Dusit Thani Phuket", city: "Phuket", country: "Tailandia", region: "Asia", stars: 5, pricePerNight: 95, emoji: "🏝️", daysAgo: 1, category: "beach", imageId: "1573843981267-be1999ff37cd", reviewScore: 8.7, reviewCount: 2840, highlight: "Acceso directo a playa privada" },
  { id: "th-2", slug: "krabi-resort", name: "Krabi Resort", city: "Krabi", country: "Tailandia", region: "Asia", stars: 4, pricePerNight: 62, emoji: "🌊", daysAgo: 3, category: "beach", imageId: "1528181304800-259b08848526", reviewScore: 8.4, reviewCount: 1920, highlight: "Bungalows con vistas al mar" },
  { id: "th-3", slug: "anantara-chiang-mai", name: "Anantara Chiang Mai", city: "Chiang Mai", country: "Tailandia", region: "Asia", stars: 5, pricePerNight: 110, emoji: "⛩️", daysAgo: 5, category: "luxury", imageId: "1542640244-7e672d6cef4e", reviewScore: 9.1, reviewCount: 1350, highlight: "Spa thai + clases de cocina" },
  { id: "th-4", slug: "sukhothai-bangkok", name: "The Sukhothai Bangkok", city: "Bangkok", country: "Tailandia", region: "Asia", stars: 5, pricePerNight: 145, emoji: "🛕", daysAgo: 7, category: "city", imageId: "1508009603885-50cf7c579365", reviewScore: 9.0, reviewCount: 3200, highlight: "Centro de Bangkok con piscina infinity" },
  { id: "th-5", slug: "kc-resort-phi-phi", name: "KC Resort Phi Phi", city: "Phi Phi", country: "Tailandia", region: "Asia", stars: 4, pricePerNight: 88, emoji: "🐠", daysAgo: 4, category: "beach", imageId: "1506929562872-bb421503ef21", reviewScore: 8.5, reviewCount: 1620, highlight: "Snorkel en aguas cristalinas" },

  // ───────── Asia · Indonesia
  { id: "id-1", slug: "padma-resort-ubud", name: "Padma Resort Ubud", city: "Ubud", country: "Indonesia", region: "Asia", stars: 5, pricePerNight: 125, emoji: "🌴", daysAgo: 2, category: "luxury", imageId: "1537996194471-e657df975ab4", reviewScore: 9.2, reviewCount: 2150, highlight: "Vistas a las terrazas de arroz" },
  { id: "id-2", slug: "the-mulia-bali", name: "The Mulia Bali", city: "Nusa Dua", country: "Indonesia", region: "Asia", stars: 5, pricePerNight: 165, emoji: "🏖️", daysAgo: 4, category: "luxury", imageId: "1582719508461-905c673771fd", reviewScore: 9.3, reviewCount: 4180, highlight: "Suite con jacuzzi privado" },
  { id: "id-3", slug: "komaneka-bisma", name: "Komaneka at Bisma", city: "Ubud", country: "Indonesia", region: "Asia", stars: 4, pricePerNight: 78, emoji: "🌿", daysAgo: 6, category: "beach", imageId: "1622396481328-9b1b78cdd9fd", reviewScore: 8.9, reviewCount: 980, highlight: "Inmerso en la jungla balinesa" },
  { id: "id-4", slug: "alila-seminyak", name: "Alila Seminyak", city: "Seminyak", country: "Indonesia", region: "Asia", stars: 5, pricePerNight: 145, emoji: "🌅", daysAgo: 5, category: "beach", imageId: "1582719508461-905c673771fd", reviewScore: 9.0, reviewCount: 1730, highlight: "Frente al mar de Seminyak" },
  { id: "id-5", slug: "fairmont-sanur", name: "Fairmont Sanur Beach Bali", city: "Sanur", country: "Indonesia", region: "Asia", stars: 5, pricePerNight: 135, emoji: "🌊", daysAgo: 8, category: "family", imageId: "1571003123894-1f0594d2b5d9", reviewScore: 8.8, reviewCount: 2050, highlight: "Familiar con kids club" },

  // ───────── Asia · Maldivas
  { id: "mv-1", slug: "adaaran-hudhuranfushi", name: "Adaaran Select Hudhuranfushi", city: "Atolón Norte de Malé", country: "Maldivas", region: "Asia", stars: 4, pricePerNight: 285, emoji: "🏝️", daysAgo: 8, category: "beach", imageId: "1514282401047-d79a71a590e8", reviewScore: 8.5, reviewCount: 890, highlight: "Bungalows sobre el agua" },
  { id: "mv-2", slug: "oblu-sangeli", name: "OBLU Select Sangeli", city: "Atolón Norte de Malé", country: "Maldivas", region: "Asia", stars: 5, pricePerNight: 425, emoji: "🌊", daysAgo: 12, category: "luxury", imageId: "1551918120-9739cb430c6d", reviewScore: 9.4, reviewCount: 1240, highlight: "All-inclusive premium 5★" },
  { id: "mv-3", slug: "soneva-fushi", name: "Soneva Fushi", city: "Atolón Baa", country: "Maldivas", region: "Asia", stars: 5, pricePerNight: 750, emoji: "✨", daysAgo: 15, category: "luxury", imageId: "1514282401047-d79a71a590e8", reviewScore: 9.7, reviewCount: 480, highlight: "Eco-luxury con observatorio" },

  // ───────── Asia · Vietnam
  { id: "vn-1", slug: "intercontinental-danang", name: "InterContinental Danang", city: "Da Nang", country: "Vietnam", region: "Asia", stars: 5, pricePerNight: 195, emoji: "🌊", daysAgo: 7, category: "luxury", imageId: "1571896349842-33c89424de2d", reviewScore: 9.2, reviewCount: 1560, highlight: "Diseño Bill Bensley impresionante" },
  { id: "vn-2", slug: "metropole-hanoi", name: "Sofitel Legend Metropole Hanoi", city: "Hanói", country: "Vietnam", region: "Asia", stars: 5, pricePerNight: 165, emoji: "🏯", daysAgo: 9, category: "city", imageId: "1540541338287-41700207dee6", reviewScore: 9.3, reviewCount: 3450, highlight: "Hotel histórico colonial" },
  { id: "vn-3", slug: "fusion-resort-cam-ranh", name: "Fusion Resort Cam Ranh", city: "Nha Trang", country: "Vietnam", region: "Asia", stars: 5, pricePerNight: 125, emoji: "🏖️", daysAgo: 11, category: "beach", imageId: "1571003123894-1f0594d2b5d9", reviewScore: 8.8, reviewCount: 920, highlight: "Spa ilimitado incluido" },

  // ───────── Asia · Japón
  { id: "jp-1", slug: "hotel-niwa-tokyo", name: "Hotel Niwa Tokyo", city: "Tokio", country: "Japón", region: "Asia", stars: 4, pricePerNight: 145, emoji: "🗼", daysAgo: 16, category: "city", imageId: "1493976040374-85c8e12f0c0e", reviewScore: 8.7, reviewCount: 4200, highlight: "Estética japonesa contemporánea" },
  { id: "jp-2", slug: "park-hyatt-tokyo", name: "Park Hyatt Tokyo", city: "Tokio", country: "Japón", region: "Asia", stars: 5, pricePerNight: 425, emoji: "🌸", daysAgo: 18, category: "luxury", imageId: "1540959733332-eab4deabeeaf", reviewScore: 9.4, reviewCount: 1850, highlight: "Vistas al Monte Fuji" },
  { id: "jp-3", slug: "ryokan-asaba", name: "Ryokan Asaba", city: "Shuzenji", country: "Japón", region: "Asia", stars: 5, pricePerNight: 285, emoji: "🍃", daysAgo: 13, category: "luxury", imageId: "1568084680786-a84f91d1153c", reviewScore: 9.6, reviewCount: 320, highlight: "Onsen tradicional + kaiseki" },

  // ───────── Asia · Singapur
  { id: "sg-1", slug: "marina-bay-sands", name: "Marina Bay Sands", city: "Singapur", country: "Singapur", region: "Asia", stars: 5, pricePerNight: 285, emoji: "🌃", daysAgo: 10, category: "luxury", imageId: "1525625293386-3f8f99389edd", reviewScore: 9.0, reviewCount: 12500, highlight: "Piscina infinity icónica" },

  // ───────── Europa · Grecia
  { id: "gr-1", slug: "aqua-blu-kos", name: "Aqua Blu Boutique Hotel", city: "Kos", country: "Grecia", region: "Europa", stars: 5, pricePerNight: 195, emoji: "🏛️", daysAgo: 2, category: "beach", imageId: "1497302347632-904729bc24aa", reviewScore: 9.1, reviewCount: 1820, highlight: "Adults-only frente al mar Egeo" },
  { id: "gr-2", slug: "mykonos-theoxenia", name: "Mykonos Theoxenia", city: "Mykonos", country: "Grecia", region: "Europa", stars: 5, pricePerNight: 245, emoji: "⛵", daysAgo: 9, category: "beach", imageId: "1533105079780-92b9be482077", reviewScore: 8.9, reviewCount: 920, highlight: "En el casco antiguo de Mykonos" },
  { id: "gr-3", slug: "astro-palace-santorini", name: "Astro Palace Suites", city: "Santorini", country: "Grecia", region: "Europa", stars: 5, pricePerNight: 320, emoji: "🏛️", daysAgo: 11, category: "luxury", imageId: "1556909114-f6e7ad7d3136", reviewScore: 9.3, reviewCount: 1450, highlight: "Vistas a la caldera de Fira" },
  { id: "gr-4", slug: "athens-was-hotel", name: "Athens Was Hotel", city: "Atenas", country: "Grecia", region: "Europa", stars: 5, pricePerNight: 165, emoji: "🏛️", daysAgo: 14, category: "city", imageId: "1503152394-c571994fd383", reviewScore: 9.2, reviewCount: 2150, highlight: "Vistas a la Acrópolis" },
  { id: "gr-5", slug: "blue-palace-creta", name: "Blue Palace Elounda", city: "Creta", country: "Grecia", region: "Europa", stars: 5, pricePerNight: 295, emoji: "🌅", daysAgo: 6, category: "luxury", imageId: "1601751818941-571144562ff8", reviewScore: 9.0, reviewCount: 1680, highlight: "Bungalows con piscina privada" },

  // ───────── Europa · Italia
  { id: "it-1", slug: "caruso-belvedere", name: "Hotel Caruso Belvedere", city: "Ravello", country: "Italia", region: "Europa", stars: 5, pricePerNight: 380, emoji: "⛪", daysAgo: 6, category: "luxury", imageId: "1467269204594-9661b134dd2b", reviewScore: 9.5, reviewCount: 580, highlight: "Vistas a la Costa Amalfitana" },
  { id: "it-2", slug: "locarno-roma", name: "Hotel Locarno Roma", city: "Roma", country: "Italia", region: "Europa", stars: 4, pricePerNight: 145, emoji: "🏛️", daysAgo: 4, category: "city", imageId: "1552832230-c0197dd311b5", reviewScore: 8.6, reviewCount: 3420, highlight: "Cerca de Piazza del Popolo" },
  { id: "it-3", slug: "belmond-cipriani", name: "Hotel Belmond Cipriani", city: "Venecia", country: "Italia", region: "Europa", stars: 5, pricePerNight: 510, emoji: "🛶", daysAgo: 10, category: "luxury", imageId: "1564013799919-ab600027ffc6", reviewScore: 9.6, reviewCount: 720, highlight: "Lancha privada al San Marcos" },
  { id: "it-4", slug: "castello-ama-toscana", name: "Castello di Ama", city: "Toscana", country: "Italia", region: "Europa", stars: 5, pricePerNight: 295, emoji: "🍷", daysAgo: 13, category: "luxury", imageId: "1518733057094-95b53143d2a7", reviewScore: 9.3, reviewCount: 410, highlight: "Castillo del s.XII + bodega" },
  { id: "it-5", slug: "grand-hotel-tremezzo", name: "Grand Hotel Tremezzo", city: "Lago Como", country: "Italia", region: "Europa", stars: 5, pricePerNight: 425, emoji: "💎", daysAgo: 8, category: "luxury", imageId: "1518733057094-95b53143d2a7", reviewScore: 9.4, reviewCount: 980, highlight: "Frente al Lago di Como" },
  { id: "it-6", slug: "ravello-art-hotel", name: "Ravello Art Hotel Marmorata", city: "Costa Amalfitana", country: "Italia", region: "Europa", stars: 4, pricePerNight: 125, emoji: "🍋", daysAgo: 5, category: "beach", imageId: "1505881502353-a1986add3762", reviewScore: 8.7, reviewCount: 1240, highlight: "Vistas al mar Tirreno" },

  // ───────── Europa · España
  { id: "es-1", slug: "alfonso-xiii-sevilla", name: "Hotel Alfonso XIII", city: "Sevilla", country: "España", region: "Europa", stars: 5, pricePerNight: 245, emoji: "🏛️", daysAgo: 2, category: "city", imageId: "1562979314-bee7453e911c", reviewScore: 9.1, reviewCount: 4320, highlight: "Patio andaluz histórico" },
  { id: "es-2", slug: "hotel-arts-barcelona", name: "Hotel Arts Barcelona", city: "Barcelona", country: "España", region: "Europa", stars: 5, pricePerNight: 320, emoji: "🌆", daysAgo: 6, category: "city", imageId: "1583422409516-2895a77efded", reviewScore: 8.9, reviewCount: 6850, highlight: "Frente a la playa Barceloneta" },
  { id: "es-3", slug: "cap-rocat-mallorca", name: "Hotel Cap Rocat", city: "Mallorca", country: "España", region: "Europa", stars: 5, pricePerNight: 425, emoji: "🏰", daysAgo: 11, category: "luxury", imageId: "1473496169904-658ba7c44d8a", reviewScore: 9.5, reviewCount: 380, highlight: "Fortaleza militar reconvertida" },
  { id: "es-4", slug: "barcelo-conil", name: "Barceló Conil Playa", city: "Conil", country: "España", region: "Europa", stars: 4, pricePerNight: 95, emoji: "🏖️", daysAgo: 3, category: "family", imageId: "1539037116277-4db20889f2d4", reviewScore: 8.4, reviewCount: 1820, highlight: "All-inclusive en Costa de la Luz" },
  { id: "es-5", slug: "iberostar-andalucia", name: "Iberostar Selection Andalucía Playa", city: "Costa del Sol", country: "España", region: "Europa", stars: 5, pricePerNight: 145, emoji: "☀️", daysAgo: 9, category: "family", imageId: "1576354302919-96748cb8299e", reviewScore: 8.6, reviewCount: 2640, highlight: "Spa + 5 piscinas" },

  // ───────── Europa · Portugal
  { id: "pt-1", slug: "memmo-principe-real", name: "Memmo Príncipe Real", city: "Lisboa", country: "Portugal", region: "Europa", stars: 4, pricePerNight: 165, emoji: "🏛️", daysAgo: 5, category: "city", imageId: "1555881400-74d7acaacd8b", reviewScore: 9.2, reviewCount: 1830, highlight: "Boutique en Príncipe Real" },
  { id: "pt-2", slug: "the-yeatman-porto", name: "The Yeatman", city: "Porto", country: "Portugal", region: "Europa", stars: 5, pricePerNight: 285, emoji: "🍷", daysAgo: 8, category: "luxury", imageId: "1542314831-068cd1dbfeeb", reviewScore: 9.4, reviewCount: 1450, highlight: "Vistas al Douro + bodega" },
  { id: "pt-3", slug: "vilalara-thalassa", name: "Vilalara Thalassa Resort", city: "Algarve", country: "Portugal", region: "Europa", stars: 5, pricePerNight: 195, emoji: "🌊", daysAgo: 7, category: "beach", imageId: "1611892440504-42a792e24d32", reviewScore: 9.0, reviewCount: 920, highlight: "Spa de talasoterapia" },

  // ───────── Europa · Centro
  { id: "fr-1", slug: "le-bristol-paris", name: "Le Bristol Paris", city: "París", country: "Francia", region: "Europa", stars: 5, pricePerNight: 580, emoji: "🥐", daysAgo: 12, category: "luxury", imageId: "1502602898657-3e91760cbb34", reviewScore: 9.5, reviewCount: 2150, highlight: "Palacio en rue du Faubourg" },
  { id: "fr-2", slug: "hotel-particulier-montmartre", name: "Hotel Particulier Montmartre", city: "París", country: "Francia", region: "Europa", stars: 5, pricePerNight: 345, emoji: "🎨", daysAgo: 7, category: "city", imageId: "1551105378-78e609e1d468", reviewScore: 9.0, reviewCount: 480, highlight: "Mansión privada en Montmartre" },
  { id: "uk-1", slug: "the-savoy-london", name: "The Savoy", city: "Londres", country: "Reino Unido", region: "Europa", stars: 5, pricePerNight: 525, emoji: "🎩", daysAgo: 10, category: "luxury", imageId: "1513635269975-59663e0ac1ad", reviewScore: 9.2, reviewCount: 4280, highlight: "Frente al Támesis" },
  { id: "de-1", slug: "adlon-kempinski-berlin", name: "Hotel Adlon Kempinski", city: "Berlín", country: "Alemania", region: "Europa", stars: 5, pricePerNight: 295, emoji: "🏛️", daysAgo: 11, category: "city", imageId: "1567593810070-7a3d471af022", reviewScore: 9.0, reviewCount: 3450, highlight: "Junto a la Puerta de Brandeburgo" },
  { id: "is-1", slug: "ion-adventure-hotel", name: "ION Adventure Hotel", city: "Reikiavik", country: "Islandia", region: "Europa", stars: 4, pricePerNight: 245, emoji: "❄️", daysAgo: 9, category: "luxury", imageId: "1531168556467-80aace0d0144", reviewScore: 9.1, reviewCount: 720, highlight: "Auroras boreales en directo" },
  { id: "tr-1", slug: "pera-palace-istanbul", name: "Pera Palace Hotel", city: "Estambul", country: "Turquía", region: "Europa", stars: 5, pricePerNight: 195, emoji: "🕌", daysAgo: 6, category: "city", imageId: "1524231757912-21f4fe3a7200", reviewScore: 8.8, reviewCount: 2840, highlight: "Histórico Orient Express" },

  // ───────── África
  { id: "ma-1", slug: "riad-yasmine-marrakech", name: "Riad Yasmine", city: "Marrakech", country: "Marruecos", region: "África", stars: 4, pricePerNight: 75, emoji: "🕌", daysAgo: 3, category: "city", imageId: "1539020140153-e479b8c22e70", reviewScore: 9.4, reviewCount: 1820, highlight: "Riad tradicional con zellige" },
  { id: "ma-2", slug: "la-mamounia-marrakech", name: "La Mamounia", city: "Marrakech", country: "Marruecos", region: "África", stars: 5, pricePerNight: 425, emoji: "🌹", daysAgo: 15, category: "luxury", imageId: "1597212618440-806262de4f6b", reviewScore: 9.5, reviewCount: 1240, highlight: "Jardines de 8 hectáreas" },
  { id: "ma-3", slug: "kasbah-tamadot", name: "Kasbah Tamadot", city: "Atlas", country: "Marruecos", region: "África", stars: 5, pricePerNight: 385, emoji: "🏔️", daysAgo: 18, category: "luxury", imageId: "1566073771259-6a8506099945", reviewScore: 9.6, reviewCount: 280, highlight: "Kasbah de Richard Branson" },
  { id: "za-1", slug: "twelve-apostles-cape-town", name: "The Twelve Apostles Hotel", city: "Ciudad del Cabo", country: "Sudáfrica", region: "África", stars: 5, pricePerNight: 245, emoji: "🦁", daysAgo: 12, category: "luxury", imageId: "1547721064-da6cfb341d50", reviewScore: 9.3, reviewCount: 1450, highlight: "Frente al océano Atlántico" },
  { id: "za-2", slug: "mount-nelson-cape-town", name: "Belmond Mount Nelson Hotel", city: "Ciudad del Cabo", country: "Sudáfrica", region: "África", stars: 5, pricePerNight: 285, emoji: "🌷", daysAgo: 8, category: "city", imageId: "1535827841776-24afc1e255ac", reviewScore: 9.2, reviewCount: 2150, highlight: "Té de la tarde icónico" },
  { id: "tz-1", slug: "andbeyond-ngorongoro", name: "&Beyond Ngorongoro Crater Lodge", city: "Cráter Ngorongoro", country: "Tanzania", region: "África", stars: 5, pricePerNight: 875, emoji: "🦓", daysAgo: 20, category: "luxury", imageId: "1516026672322-bc52d61a55d5", reviewScore: 9.7, reviewCount: 180, highlight: "Vistas al cráter + safaris" },

  // ───────── Caribe
  { id: "do-1", slug: "iberostar-grand-bavaro", name: "Iberostar Grand Bávaro", city: "Punta Cana", country: "República Dominicana", region: "Caribe", stars: 5, pricePerNight: 285, emoji: "🌴", daysAgo: 4, category: "family", imageId: "1552074284-5e88ef1aef18", reviewScore: 9.0, reviewCount: 8420, highlight: "All-inclusive premium adults" },
  { id: "cu-1", slug: "iberostar-varadero", name: "Iberostar Selection Varadero", city: "Varadero", country: "Cuba", region: "Caribe", stars: 5, pricePerNight: 195, emoji: "🏖️", daysAgo: 7, category: "family", imageId: "1500759285222-a95626b934cb", reviewScore: 8.7, reviewCount: 5240, highlight: "Playa de arena blanca" },
  { id: "mx-1", slug: "rosewood-mayakoba", name: "Rosewood Mayakoba", city: "Riviera Maya", country: "México", region: "Caribe", stars: 5, pricePerNight: 525, emoji: "🌊", daysAgo: 10, category: "luxury", imageId: "1602002418082-a4443e081dd1", reviewScore: 9.5, reviewCount: 1680, highlight: "Suites con piscina privada" },
  { id: "mx-2", slug: "secrets-the-vine-cancun", name: "Secrets The Vine Cancún", city: "Cancún", country: "México", region: "Caribe", stars: 5, pricePerNight: 245, emoji: "🍷", daysAgo: 9, category: "family", imageId: "1552074284-5e88ef1aef18", reviewScore: 9.0, reviewCount: 4820, highlight: "Adults-only all-inclusive" },
  { id: "jm-1", slug: "sandals-royal-caribbean", name: "Sandals Royal Caribbean", city: "Montego Bay", country: "Jamaica", region: "Caribe", stars: 5, pricePerNight: 365, emoji: "🌺", daysAgo: 11, category: "luxury", imageId: "1538935732373-f7a495fea3f6", reviewScore: 9.1, reviewCount: 3240, highlight: "Adults-only frente al Caribe" },

  // ───────── América
  { id: "us-1", slug: "the-plaza-new-york", name: "The Plaza New York", city: "Nueva York", country: "Estados Unidos", region: "América Norte", stars: 5, pricePerNight: 685, emoji: "🗽", daysAgo: 13, category: "luxury", imageId: "1545324418-cc1a3fa10c00", reviewScore: 9.0, reviewCount: 4280, highlight: "Frente a Central Park" },
  { id: "us-2", slug: "fontainebleau-miami", name: "Fontainebleau Miami Beach", city: "Miami", country: "Estados Unidos", region: "América Norte", stars: 4, pricePerNight: 345, emoji: "🌴", daysAgo: 8, category: "beach", imageId: "1500916434205-0c77489c6cf7", reviewScore: 8.6, reviewCount: 5840, highlight: "Frente al océano + Liv club" },
  { id: "ar-1", slug: "alvear-buenos-aires", name: "Alvear Palace Hotel", city: "Buenos Aires", country: "Argentina", region: "América Sur", stars: 5, pricePerNight: 195, emoji: "🥩", daysAgo: 7, category: "city", imageId: "1589909202802-8f4aadce1849", reviewScore: 9.2, reviewCount: 1820, highlight: "Estilo Belle Époque parisino" },
  { id: "br-1", slug: "copacabana-palace", name: "Copacabana Palace", city: "Río de Janeiro", country: "Brasil", region: "América Sur", stars: 5, pricePerNight: 425, emoji: "🏖️", daysAgo: 14, category: "luxury", imageId: "1483729558449-99ef09a8c325", reviewScore: 9.3, reviewCount: 2640, highlight: "Frente a Copacabana" },
  { id: "pe-1", slug: "belmond-machu-picchu", name: "Belmond Sanctuary Lodge", city: "Machu Picchu", country: "Perú", region: "América Sur", stars: 5, pricePerNight: 685, emoji: "🏔️", daysAgo: 19, category: "luxury", imageId: "1606830733744-0ad778449672", reviewScore: 9.4, reviewCount: 480, highlight: "Único hotel en Machu Picchu" },

  // ───────── Oceanía
  { id: "au-1", slug: "park-hyatt-sydney", name: "Park Hyatt Sydney", city: "Sídney", country: "Australia", region: "Oceanía", stars: 5, pricePerNight: 565, emoji: "🌉", daysAgo: 16, category: "luxury", imageId: "1506973035872-a4ec16b8e8d9", reviewScore: 9.4, reviewCount: 1820, highlight: "Vistas a la Opera House" },
  { id: "pf-1", slug: "intercontinental-bora-bora", name: "InterContinental Bora Bora Resort", city: "Bora Bora", country: "Polinesia Francesa", region: "Oceanía", stars: 5, pricePerNight: 945, emoji: "🌊", daysAgo: 21, category: "luxury", imageId: "1502602898657-3e91760cbb34", reviewScore: 9.5, reviewCount: 320, highlight: "Bungalows sobre laguna turquesa" },

  // ───────── Oriente Medio
  { id: "ae-1", slug: "burj-al-arab", name: "Burj Al Arab Jumeirah", city: "Dubái", country: "Emiratos Árabes Unidos", region: "Oriente Medio", stars: 5, pricePerNight: 1450, emoji: "💎", daysAgo: 17, category: "luxury", imageId: "1512453979798-5ea266f8880c", reviewScore: 9.2, reviewCount: 1240, highlight: "Suite 7 estrellas icónica" },
  { id: "ae-2", slug: "atlantis-the-palm", name: "Atlantis The Palm", city: "Dubái", country: "Emiratos Árabes Unidos", region: "Oriente Medio", stars: 5, pricePerNight: 425, emoji: "🐬", daysAgo: 9, category: "family", imageId: "1564501049412-61c2a3083791", reviewScore: 8.8, reviewCount: 12400, highlight: "Aquaventure waterpark" },
  { id: "qa-1", slug: "mandarin-oriental-doha", name: "Mandarin Oriental Doha", city: "Doha", country: "Catar", region: "Oriente Medio", stars: 5, pricePerNight: 285, emoji: "🌃", daysAgo: 11, category: "city", imageId: "1580418827493-f2b22c0a76cb", reviewScore: 9.3, reviewCount: 1820, highlight: "Frente al casco antiguo" },
  // --- Expansion mayo-2026: 30 hoteles nuevos ---
  // Escandinavia
  { id: "se-1", slug: "grand-hotel-stockholm", name: "Grand Hôtel Stockholm", city: "Estocolmo", country: "Suecia", region: "Europa", stars: 5, pricePerNight: 295, emoji: "🏰", daysAgo: 3, category: "city", imageId: "1513635269975-59663e0ac1ad", reviewScore: 9.1, reviewCount: 3420, highlight: "Frente al palacio real" },
  { id: "no-1", slug: "the-thief-oslo", name: "The Thief", city: "Oslo", country: "Noruega", region: "Europa", stars: 5, pricePerNight: 265, emoji: "🎨", daysAgo: 5, category: "city", imageId: "1567593810070-7a3d471af022", reviewScore: 8.9, reviewCount: 1820, highlight: "Hotel museo de arte contemporáneo" },
  { id: "dk-1", slug: "hotel-dangleterre-copenhagen", name: "Hotel d'Angleterre", city: "Copenhague", country: "Dinamarca", region: "Europa", stars: 5, pricePerNight: 345, emoji: "🧜", daysAgo: 7, category: "luxury", imageId: "1551105378-78e609e1d468", reviewScore: 9.3, reviewCount: 2150, highlight: "Palacio nórdico en Nyhavn" },
  { id: "fi-1", slug: "hotel-kamp-helsinki", name: "Hotel Kämp", city: "Helsinki", country: "Finlandia", region: "Europa", stars: 5, pricePerNight: 225, emoji: "❄️", daysAgo: 9, category: "city", imageId: "1531168556467-80aace0d0144", reviewScore: 9.0, reviewCount: 1450, highlight: "Grand hotel desde 1887" },
  // Europa del Este
  { id: "cz-1", slug: "aria-hotel-prague", name: "Aria Hotel Prague", city: "Praga", country: "República Checa", region: "Europa", stars: 5, pricePerNight: 185, emoji: "🎵", daysAgo: 4, category: "city", imageId: "1552832230-c0197dd311b5", reviewScore: 9.2, reviewCount: 2840, highlight: "Cada planta dedicada a un género musical" },
  { id: "hu-1", slug: "four-seasons-gresham-budapest", name: "Four Seasons Gresham Palace", city: "Budapest", country: "Hungría", region: "Europa", stars: 5, pricePerNight: 265, emoji: "🏛️", daysAgo: 6, category: "luxury", imageId: "1567593810070-7a3d471af022", reviewScore: 9.4, reviewCount: 3180, highlight: "Art Nouveau frente al Danubio" },
  { id: "hr-1", slug: "hotel-excelsior-dubrovnik", name: "Hotel Excelsior Dubrovnik", city: "Dubrovnik", country: "Croacia", region: "Europa", stars: 5, pricePerNight: 225, emoji: "🏰", daysAgo: 5, category: "city", imageId: "1556909114-f6e7ad7d3136", reviewScore: 9.0, reviewCount: 2450, highlight: "Vistas al casco viejo y el Adriático" },
  { id: "pl-1", slug: "hotel-stary-krakow", name: "Hotel Stary", city: "Cracovia", country: "Polonia", region: "Europa", stars: 5, pricePerNight: 155, emoji: "🏛️", daysAgo: 8, category: "city", imageId: "1503152394-c571994fd383", reviewScore: 9.1, reviewCount: 1620, highlight: "En la plaza del mercado medieval" },
  // India y Sri Lanka
  { id: "in-1", slug: "taj-mahal-palace-mumbai", name: "Taj Mahal Palace", city: "Bombay", country: "India", region: "Asia", stars: 5, pricePerNight: 195, emoji: "🕌", daysAgo: 7, category: "luxury", imageId: "1524231757912-21f4fe3a7200", reviewScore: 9.3, reviewCount: 5840, highlight: "Palacio icónico frente al Gateway" },
  { id: "in-2", slug: "oberoi-udaipur", name: "The Oberoi Udaivilas", city: "Udaipur", country: "India", region: "Asia", stars: 5, pricePerNight: 325, emoji: "🏰", daysAgo: 10, category: "luxury", imageId: "1542640244-7e672d6cef4e", reviewScore: 9.5, reviewCount: 1280, highlight: "A orillas del lago Pichola" },
  { id: "in-3", slug: "itc-grand-chola-chennai", name: "ITC Grand Chola", city: "Chennai", country: "India", region: "Asia", stars: 5, pricePerNight: 125, emoji: "🛕", daysAgo: 12, category: "city", imageId: "1508009603885-50cf7c579365", reviewScore: 8.9, reviewCount: 4200, highlight: "Inspirado en la dinastía Chola" },
  { id: "lk-1", slug: "aman-galle-sri-lanka", name: "Amangalla", city: "Galle", country: "Sri Lanka", region: "Asia", stars: 5, pricePerNight: 285, emoji: "🌴", daysAgo: 11, category: "luxury", imageId: "1537996194471-e657df975ab4", reviewScore: 9.4, reviewCount: 380, highlight: "En el fuerte colonial holandés" },
  { id: "lk-2", slug: "ceylon-tea-trails", name: "Ceylon Tea Trails", city: "Hill Country", country: "Sri Lanka", region: "Asia", stars: 5, pricePerNight: 345, emoji: "🍵", daysAgo: 14, category: "luxury", imageId: "1622396481328-9b1b78cdd9fd", reviewScore: 9.3, reviewCount: 280, highlight: "Bungalows coloniales en plantaciones de té" },
  // Budget y familiar Europa
  { id: "es-6", slug: "melia-costa-del-sol", name: "Meliá Costa del Sol", city: "Torremolinos", country: "España", region: "Europa", stars: 4, pricePerNight: 75, emoji: "☀️", daysAgo: 2, category: "budget", imageId: "1539037116277-4db20889f2d4", reviewScore: 8.3, reviewCount: 4820, highlight: "Playa + todo incluido económico" },
  { id: "es-7", slug: "vincci-seleccion-posada-patio", name: "Vincci Selección Posada del Patio", city: "Málaga", country: "España", region: "Europa", stars: 5, pricePerNight: 145, emoji: "🏛️", daysAgo: 4, category: "city", imageId: "1562979314-bee7453e911c", reviewScore: 9.0, reviewCount: 2180, highlight: "Sobre ruinas fenicias del s.VII" },
  { id: "gr-6", slug: "naxian-collection", name: "Naxian Collection", city: "Naxos", country: "Grecia", region: "Europa", stars: 5, pricePerNight: 165, emoji: "🏝️", daysAgo: 3, category: "beach", imageId: "1497302347632-904729bc24aa", reviewScore: 9.2, reviewCount: 620, highlight: "Villas privadas con piscina" },
  { id: "it-7", slug: "masseria-torre-maizza", name: "Masseria Torre Maizza", city: "Puglia", country: "Italia", region: "Europa", stars: 5, pricePerNight: 285, emoji: "🫒", daysAgo: 6, category: "luxury", imageId: "1518733057094-95b53143d2a7", reviewScore: 9.1, reviewCount: 480, highlight: "Masseria en olivares centenarios" },
  { id: "it-8", slug: "hotel-santa-caterina-amalfi", name: "Hotel Santa Caterina", city: "Amalfi", country: "Italia", region: "Europa", stars: 5, pricePerNight: 345, emoji: "🍋", daysAgo: 8, category: "luxury", imageId: "1505881502353-a1986add3762", reviewScore: 9.4, reviewCount: 920, highlight: "Ascensor privado a la playa" },
  // Más Caribe y América
  { id: "cr-1", slug: "tabacon-resort-arenal", name: "Tabacón Thermal Resort", city: "Arenal", country: "Costa Rica", region: "América Sur", stars: 5, pricePerNight: 245, emoji: "🌋", daysAgo: 5, category: "luxury", imageId: "1571003123894-1f0594d2b5d9", reviewScore: 9.0, reviewCount: 3420, highlight: "Aguas termales naturales volcánicas" },
  { id: "co-1", slug: "sofitel-santa-clara-cartagena", name: "Sofitel Legend Santa Clara", city: "Cartagena", country: "Colombia", region: "América Sur", stars: 5, pricePerNight: 225, emoji: "🏛️", daysAgo: 7, category: "city", imageId: "1589909202802-8f4aadce1849", reviewScore: 9.2, reviewCount: 2640, highlight: "Antiguo convento del siglo XVII" },
  { id: "bb-1", slug: "sandy-lane-barbados", name: "Sandy Lane", city: "Holetown", country: "Barbados", region: "Caribe", stars: 5, pricePerNight: 685, emoji: "🌴", daysAgo: 13, category: "luxury", imageId: "1538935732373-f7a495fea3f6", reviewScore: 9.5, reviewCount: 480, highlight: "Golf + spa en playa caribeña" },
  // África
  { id: "ke-1", slug: "giraffe-manor-nairobi", name: "Giraffe Manor", city: "Nairobi", country: "Kenia", region: "África", stars: 5, pricePerNight: 585, emoji: "🦒", daysAgo: 15, category: "luxury", imageId: "1516026672322-bc52d61a55d5", reviewScore: 9.6, reviewCount: 320, highlight: "Desayuno con jirafas Rothschild" },
  { id: "eg-1", slug: "old-cataract-aswan", name: "Sofitel Legend Old Cataract", city: "Asuán", country: "Egipto", region: "África", stars: 5, pricePerNight: 195, emoji: "🏺", daysAgo: 9, category: "luxury", imageId: "1566073771259-6a8506099945", reviewScore: 9.3, reviewCount: 1820, highlight: "Donde escribía Agatha Christie" },
  // Más Asia
  { id: "kr-1", slug: "park-hyatt-seoul", name: "Park Hyatt Seoul", city: "Seúl", country: "Corea del Sur", region: "Asia", stars: 5, pricePerNight: 285, emoji: "🏙️", daysAgo: 8, category: "city", imageId: "1540959733332-eab4deabeeaf", reviewScore: 9.1, reviewCount: 2450, highlight: "Diseño minimalista con vistas a Gangnam" },
  { id: "kh-1", slug: "raffles-grand-hotel-angkor", name: "Raffles Grand Hotel d'Angkor", city: "Siem Reap", country: "Camboya", region: "Asia", stars: 5, pricePerNight: 165, emoji: "🛕", daysAgo: 10, category: "luxury", imageId: "1568084680786-a84f91d1153c", reviewScore: 9.2, reviewCount: 1450, highlight: "Junto a Angkor Wat" },
  { id: "mm-1", slug: "belmond-governor-yangon", name: "Belmond Governor's Residence", city: "Yangón", country: "Myanmar", region: "Asia", stars: 5, pricePerNight: 145, emoji: "🛕", daysAgo: 14, category: "luxury", imageId: "1542314831-068cd1dbfeeb", reviewScore: 9.0, reviewCount: 480, highlight: "Mansión colonial con jardines tropicales" },
  // Budget global
  { id: "bg-1", slug: "maxi-park-hotel-varna", name: "Maxi Park Hotel & Spa", city: "Varna", country: "Bulgaria", region: "Europa", stars: 4, pricePerNight: 45, emoji: "🏖️", daysAgo: 2, category: "budget", imageId: "1576354302919-96748cb8299e", reviewScore: 8.2, reviewCount: 2840, highlight: "Spa + playa del Mar Negro por 45€" },
  { id: "al-1", slug: "hotel-butrinti-saranda", name: "Hotel Butrinti", city: "Saranda", country: "Albania", region: "Europa", stars: 4, pricePerNight: 38, emoji: "🏝️", daysAgo: 3, category: "budget", imageId: "1601751818941-571144562ff8", reviewScore: 8.0, reviewCount: 1620, highlight: "Riviera albanesa a precio irreal" },
  { id: "tn-1", slug: "dar-said-sidi-bou-said", name: "Dar Said", city: "Sidi Bou Said", country: "Túnez", region: "África", stars: 4, pricePerNight: 55, emoji: "🕌", daysAgo: 6, category: "budget", imageId: "1539020140153-e479b8c22e70", reviewScore: 8.5, reviewCount: 920, highlight: "Riad con vistas al Mediterráneo" },
  { id: "np-1", slug: "dwarika-hotel-kathmandu", name: "Dwarika's Hotel", city: "Katmandú", country: "Nepal", region: "Asia", stars: 5, pricePerNight: 95, emoji: "🏔️", daysAgo: 11, category: "city", imageId: "1606830733744-0ad778449672", reviewScore: 9.1, reviewCount: 680, highlight: "Patrimonio UNESCO reconstruido" },
  // ═══════════════════════════════════════════════════════════════════════════
  // EXPANSION MAYO 2026 — 110 hoteles nuevos (total ~210)
  // ═══════════════════════════════════════════════════════════════════════════

  // ───────── Asia · Tailandia (más)
  { id: "th-6", slug: "137-pillars-chiang-mai", name: "137 Pillars House", city: "Chiang Mai", country: "Tailandia", region: "Asia", stars: 5, pricePerNight: 185, emoji: "🌿", daysAgo: 2, category: "luxury", imageId: "1542640244-7e672d6cef4e", reviewScore: 9.3, reviewCount: 820, highlight: "Colonial teak mansion" },
  { id: "th-7", slug: "budget-box-bangkok", name: "The Yard Hostel Bangkok", city: "Bangkok", country: "Tailandia", region: "Asia", stars: 3, pricePerNight: 22, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1576354302919-96748cb8299e", reviewScore: 8.1, reviewCount: 3420, highlight: "Hostel boutique en Khao San" },
  { id: "th-8", slug: "centara-grand-hua-hin", name: "Centara Grand Beach Resort Hua Hin", city: "Hua Hin", country: "Tailandia", region: "Asia", stars: 5, pricePerNight: 105, emoji: "🏖️", daysAgo: 4, category: "family", imageId: "1571003123894-1f0594d2b5d9", reviewScore: 8.6, reviewCount: 4150, highlight: "Resort familiar junto al tren histórico" },

  // ───────── Asia · Filipinas
  { id: "ph-1", slug: "el-nido-resorts-lagen", name: "El Nido Resorts Lagen Island", city: "El Nido", country: "Filipinas", region: "Asia", stars: 5, pricePerNight: 195, emoji: "🏝️", daysAgo: 3, category: "beach", imageId: "1514282401047-d79a71a590e8", reviewScore: 9.0, reviewCount: 1240, highlight: "Laguna privada en Palawan" },
  { id: "ph-2", slug: "shangrila-boracay", name: "Shangri-La Boracay", city: "Boracay", country: "Filipinas", region: "Asia", stars: 5, pricePerNight: 165, emoji: "🌅", daysAgo: 5, category: "beach", imageId: "1582719508461-905c673771fd", reviewScore: 9.1, reviewCount: 2840, highlight: "Playa White Beach exclusiva" },
  { id: "ph-3", slug: "henann-alona-bohol", name: "Henann Resort Alona Beach", city: "Bohol", country: "Filipinas", region: "Asia", stars: 4, pricePerNight: 68, emoji: "🐠", daysAgo: 2, category: "beach", imageId: "1506929562872-bb421503ef21", reviewScore: 8.5, reviewCount: 1920, highlight: "Snorkel y Chocolate Hills cerca" },

  // ───────── Asia · Malasia
  { id: "my-1", slug: "four-seasons-langkawi", name: "Four Seasons Langkawi", city: "Langkawi", country: "Malasia", region: "Asia", stars: 5, pricePerNight: 245, emoji: "🌴", daysAgo: 6, category: "luxury", imageId: "1537996194471-e657df975ab4", reviewScore: 9.4, reviewCount: 1680, highlight: "Villas con playa privada" },
  { id: "my-2", slug: "mandarin-oriental-kl", name: "Mandarin Oriental KL", city: "Kuala Lumpur", country: "Malasia", region: "Asia", stars: 5, pricePerNight: 145, emoji: "🏙️", daysAgo: 4, category: "city", imageId: "1525625293386-3f8f99389edd", reviewScore: 9.0, reviewCount: 3420, highlight: "Vistas a las Torres Petronas" },
  { id: "my-3", slug: "tune-hotel-kl", name: "Tune Hotel KLIA2", city: "Kuala Lumpur", country: "Malasia", region: "Asia", stars: 3, pricePerNight: 28, emoji: "✈️", daysAgo: 1, category: "budget", imageId: "1576354302919-96748cb8299e", reviewScore: 7.8, reviewCount: 5240, highlight: "Junto al aeropuerto low-cost" },

  // ───────── Asia · China
  { id: "cn-1", slug: "peninsula-shanghai", name: "The Peninsula Shanghai", city: "Shanghái", country: "China", region: "Asia", stars: 5, pricePerNight: 285, emoji: "🏙️", daysAgo: 7, category: "luxury", imageId: "1525625293386-3f8f99389edd", reviewScore: 9.3, reviewCount: 2150, highlight: "Art Deco en el Bund" },
  { id: "cn-2", slug: "aman-summer-palace-beijing", name: "Aman at Summer Palace", city: "Pekín", country: "China", region: "Asia", stars: 5, pricePerNight: 425, emoji: "🏯", daysAgo: 10, category: "luxury", imageId: "1568084680786-a84f91d1153c", reviewScore: 9.5, reviewCount: 480, highlight: "Dentro del Palacio de Verano" },
  { id: "cn-3", slug: "citizen-hotel-shanghai", name: "Citizen Hotel Shanghai", city: "Shanghái", country: "China", region: "Asia", stars: 3, pricePerNight: 45, emoji: "🎒", daysAgo: 2, category: "budget", imageId: "1564501049412-61c2a3083791", reviewScore: 8.0, reviewCount: 1820, highlight: "Boutique budget en French Concession" },

  // ───────── Asia · Taiwán
  { id: "tw-1", slug: "mandarin-oriental-taipei", name: "Mandarin Oriental Taipei", city: "Taipéi", country: "Taiwán", region: "Asia", stars: 5, pricePerNight: 225, emoji: "🏙️", daysAgo: 5, category: "luxury", imageId: "1540959733332-eab4deabeeaf", reviewScore: 9.2, reviewCount: 1820, highlight: "Spa y vistas a Taipei 101" },

  // ───────── Europa · España (más)
  { id: "es-8", slug: "hotel-maria-cristina-san-sebastian", name: "Hotel María Cristina", city: "San Sebastián", country: "España", region: "Europa", stars: 5, pricePerNight: 285, emoji: "🎬", daysAgo: 3, category: "luxury", imageId: "1562979314-bee7453e911c", reviewScore: 9.2, reviewCount: 2640, highlight: "Sede del festival de cine" },
  { id: "es-9", slug: "hospes-palacio-bailio-cordoba", name: "Hospes Palacio del Bailío", city: "Córdoba", country: "España", region: "Europa", stars: 5, pricePerNight: 165, emoji: "🕌", daysAgo: 5, category: "city", imageId: "1562979314-bee7453e911c", reviewScore: 9.3, reviewCount: 1240, highlight: "Palacio del XVI con ruinas romanas" },
  { id: "es-10", slug: "parador-granada", name: "Parador de Granada", city: "Granada", country: "España", region: "Europa", stars: 4, pricePerNight: 195, emoji: "🏰", daysAgo: 4, category: "city", imageId: "1583422409516-2895a77efded", reviewScore: 9.0, reviewCount: 3820, highlight: "Dentro de la Alhambra" },
  { id: "es-11", slug: "hotel-negresco-sitges", name: "Hotel Negresco Sitges", city: "Sitges", country: "España", region: "Europa", stars: 3, pricePerNight: 55, emoji: "🏖️", daysAgo: 1, category: "budget", imageId: "1539037116277-4db20889f2d4", reviewScore: 8.0, reviewCount: 2150, highlight: "Budget en playa de Sitges" },
  { id: "es-12", slug: "hostal-central-madrid", name: "Hostal Central Palace Madrid", city: "Madrid", country: "España", region: "Europa", stars: 2, pricePerNight: 42, emoji: "🏛️", daysAgo: 1, category: "budget", imageId: "1502602898657-3e91760cbb34", reviewScore: 8.2, reviewCount: 4820, highlight: "En plena Puerta del Sol" },

  // ───────── Europa · Italia (más)
  { id: "it-9", slug: "belmond-splendido-portofino", name: "Belmond Splendido", city: "Portofino", country: "Italia", region: "Europa", stars: 5, pricePerNight: 595, emoji: "⟵", daysAgo: 8, category: "luxury", imageId: "1505881502353-a1986add3762", reviewScore: 9.5, reviewCount: 620, highlight: "Frente al puerto de Portofino" },
  { id: "it-10", slug: "hotel-lunetta-roma", name: "Hotel Lunetta", city: "Roma", country: "Italia", region: "Europa", stars: 3, pricePerNight: 65, emoji: "🏛️", daysAgo: 2, category: "budget", imageId: "1552832230-c0197dd311b5", reviewScore: 8.1, reviewCount: 3240, highlight: "Budget cerca de Campo de' Fiori" },
  { id: "it-11", slug: "nh-firenze", name: "NH Firenze", city: "Florencia", country: "Italia", region: "Europa", stars: 4, pricePerNight: 95, emoji: "🎨", daysAgo: 3, category: "city", imageId: "1467269204594-9661b134dd2b", reviewScore: 8.4, reviewCount: 2840, highlight: "A 10 min del Duomo" },

  // ───────── Europa · Francia (más)
  { id: "fr-3", slug: "hotel-negresco-nice", name: "Hotel Negresco", city: "Niza", country: "Francia", region: "Europa", stars: 5, pricePerNight: 285, emoji: "🎨", daysAgo: 6, category: "luxury", imageId: "1502602898657-3e91760cbb34", reviewScore: 9.0, reviewCount: 2450, highlight: "Palacio Belle Époque en Promenade" },
  { id: "fr-4", slug: "chateau-de-bagnols", name: "Château de Bagnols", city: "Lyon", country: "Francia", region: "Europa", stars: 5, pricePerNight: 345, emoji: "🏰", daysAgo: 9, category: "luxury", imageId: "1518733057094-95b53143d2a7", reviewScore: 9.4, reviewCount: 380, highlight: "Castillo del s.XIII con viñedos" },
  { id: "fr-5", slug: "generator-paris", name: "Generator Paris", city: "París", country: "Francia", region: "Europa", stars: 2, pricePerNight: 35, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1551105378-78e609e1d468", reviewScore: 8.0, reviewCount: 6240, highlight: "Hostel design en Canal Saint-Martin" },

  // ───────── Europa · Alemania (más)
  { id: "de-2", slug: "hotel-zoo-berlin", name: "Hotel Zoo Berlin", city: "Berlín", country: "Alemania", region: "Europa", stars: 5, pricePerNight: 195, emoji: "🐻", daysAgo: 4, category: "city", imageId: "1567593810070-7a3d471af022", reviewScore: 8.8, reviewCount: 1820, highlight: "Boutique en Kurfürstendamm" },
  { id: "de-3", slug: "hotel-vier-jahreszeiten-munich", name: "Hotel Vier Jahreszeiten Kempinski", city: "Münich", country: "Alemania", region: "Europa", stars: 5, pricePerNight: 345, emoji: "🏰", daysAgo: 7, category: "luxury", imageId: "1513635269975-59663e0ac1ad", reviewScore: 9.2, reviewCount: 2840, highlight: "En Maximilianstraße desde 1858" },
  { id: "de-4", slug: "motel-one-hamburg", name: "Motel One Hamburg", city: "Hamburgo", country: "Alemania", region: "Europa", stars: 3, pricePerNight: 59, emoji: "⚓", daysAgo: 1, category: "budget", imageId: "1576354302919-96748cb8299e", reviewScore: 8.3, reviewCount: 5840, highlight: "Design budget en HafenCity" },

  // ───────── Europa · Países Bajos
  { id: "nl-1", slug: "waldorf-astoria-amsterdam", name: "Waldorf Astoria Amsterdam", city: "Ámsterdam", country: "Países Bajos", region: "Europa", stars: 5, pricePerNight: 425, emoji: "🌷", daysAgo: 6, category: "luxury", imageId: "1551105378-78e609e1d468", reviewScore: 9.3, reviewCount: 1820, highlight: "6 mansiones del canal unidas" },
  { id: "nl-2", slug: "citizen-m-amsterdam", name: "citizenM Amsterdam", city: "Ámsterdam", country: "Países Bajos", region: "Europa", stars: 3, pricePerNight: 85, emoji: "🚲", daysAgo: 2, category: "budget", imageId: "1564501049412-61c2a3083791", reviewScore: 8.4, reviewCount: 4820, highlight: "Smart hotel junto a Museumplein" },

  // ───────── Europa · Suiza
  { id: "ch-1", slug: "the-dolder-grand-zurich", name: "The Dolder Grand", city: "Zúrich", country: "Suiza", region: "Europa", stars: 5, pricePerNight: 525, emoji: "🏔️", daysAgo: 10, category: "luxury", imageId: "1531168556467-80aace0d0144", reviewScore: 9.4, reviewCount: 1450, highlight: "Vistas a los Alpes y al lago" },
  { id: "ch-2", slug: "hotel-breakfast-zurich", name: "Hotel & Breakfast Zürich", city: "Zúrich", country: "Suiza", region: "Europa", stars: 3, pricePerNight: 95, emoji: "🧀", daysAgo: 2, category: "budget", imageId: "1502602898657-3e91760cbb34", reviewScore: 8.0, reviewCount: 2150, highlight: "Económico para Suiza con desayuno" },

  // ───────── Europa · Austria
  { id: "at-1", slug: "hotel-sacher-vienna", name: "Hotel Sacher Wien", city: "Viena", country: "Austria", region: "Europa", stars: 5, pricePerNight: 385, emoji: "🎼", daysAgo: 7, category: "luxury", imageId: "1567593810070-7a3d471af022", reviewScore: 9.3, reviewCount: 3420, highlight: "Hogar de la Sachertorte original" },

  // ───────── Europa · Bélgica
  { id: "be-1", slug: "hotel-amigo-brussels", name: "Rocco Forte Hotel Amigo", city: "Bruselas", country: "Bélgica", region: "Europa", stars: 5, pricePerNight: 265, emoji: "🍫", daysAgo: 5, category: "city", imageId: "1551105378-78e609e1d468", reviewScore: 9.1, reviewCount: 2150, highlight: "A pasos de la Grand Place" },

  // ───────── Europa · Irlanda
  { id: "ie-1", slug: "ashford-castle", name: "Ashford Castle", city: "Cong", country: "Irlanda", region: "Europa", stars: 5, pricePerNight: 425, emoji: "🏰", daysAgo: 8, category: "luxury", imageId: "1531168556467-80aace0d0144", reviewScore: 9.5, reviewCount: 1240, highlight: "Castillo medieval del s.XIII" },

  // ───────── Europa · Escocia
  { id: "gb-2", slug: "gleneagles-scotland", name: "Gleneagles", city: "Perthshire", country: "Reino Unido", region: "Europa", stars: 5, pricePerNight: 385, emoji: "⛳", daysAgo: 9, category: "luxury", imageId: "1513635269975-59663e0ac1ad", reviewScore: 9.3, reviewCount: 1820, highlight: "3 campos de golf + spa" },

  // ───────── Europa · Montenegro
  { id: "me-1", slug: "aman-sveti-stefan", name: "Aman Sveti Stefan", city: "Sveti Stefan", country: "Montenegro", region: "Europa", stars: 5, pricePerNight: 525, emoji: "🏝️", daysAgo: 11, category: "luxury", imageId: "1556909114-f6e7ad7d3136", reviewScore: 9.5, reviewCount: 480, highlight: "Isla privada en el Adriático" },

  // ───────── Europa · Malta
  { id: "mt-1", slug: "iniala-harbour-house-valletta", name: "Iniala Harbour House", city: "La Valeta", country: "Malta", region: "Europa", stars: 5, pricePerNight: 285, emoji: "🏛️", daysAgo: 6, category: "city", imageId: "1503152394-c571994fd383", reviewScore: 9.2, reviewCount: 620, highlight: "Boutique en el Gran Puerto" },

  // ───────── África (más)
  { id: "za-3", slug: "singita-kruger", name: "Singita Lebombo Lodge", city: "Parque Kruger", country: "Sudáfrica", region: "África", stars: 5, pricePerNight: 1250, emoji: "🦁", daysAgo: 18, category: "luxury", imageId: "1516026672322-bc52d61a55d5", reviewScore: 9.8, reviewCount: 180, highlight: "Safari ultra-luxury con Big 5" },
  { id: "mu-1", slug: "le-touessrok-mauritius", name: "Shangri-La Le Touessrok", city: "Trou d'Eau Douce", country: "Mauricio", region: "África", stars: 5, pricePerNight: 325, emoji: "🏝️", daysAgo: 9, category: "beach", imageId: "1514282401047-d79a71a590e8", reviewScore: 9.2, reviewCount: 1820, highlight: "Playa privada + isla exclusiva" },
  { id: "sc-1", slug: "four-seasons-seychelles", name: "Four Seasons Resort Seychelles", city: "Mahé", country: "Seychelles", region: "África", stars: 5, pricePerNight: 685, emoji: "🐢", daysAgo: 14, category: "luxury", imageId: "1582719508461-905c673771fd", reviewScore: 9.5, reviewCount: 920, highlight: "Villas en la selva tropical" },
  { id: "rw-1", slug: "bisate-lodge-rwanda", name: "Wilderness Bisate Lodge", city: "Volcanoes NP", country: "Ruanda", region: "África", stars: 5, pricePerNight: 945, emoji: "🦍", daysAgo: 16, category: "luxury", imageId: "1516026672322-bc52d61a55d5", reviewScore: 9.7, reviewCount: 120, highlight: "Trekking con gorilas de montaña" },
  { id: "gh-1", slug: "kempinski-accra", name: "Kempinski Gold Coast City", city: "Accra", country: "Ghana", region: "África", stars: 5, pricePerNight: 165, emoji: "🌍", daysAgo: 5, category: "city", imageId: "1564501049412-61c2a3083791", reviewScore: 8.7, reviewCount: 1240, highlight: "Mejor hotel de West Africa" },
  { id: "sn-1", slug: "terrou-bi-dakar", name: "Terrou-Bi Beach Resort", city: "Dakar", country: "Senegal", region: "África", stars: 5, pricePerNight: 125, emoji: "🌊", daysAgo: 7, category: "beach", imageId: "1571003123894-1f0594d2b5d9", reviewScore: 8.4, reviewCount: 820, highlight: "Frente al océano Atlántico" },

  // ───────── Caribe (más)
  { id: "mx-3", slug: "hotel-xcaret-arte", name: "Hotel Xcaret Arte", city: "Playa del Carmen", country: "México", region: "Caribe", stars: 5, pricePerNight: 385, emoji: "🎨", daysAgo: 6, category: "luxury", imageId: "1602002418082-a4443e081dd1", reviewScore: 9.3, reviewCount: 2840, highlight: "All-inclusive + parques Xcaret" },
  { id: "mx-4", slug: "hotel-básico-playa", name: "Hotel Básico", city: "Playa del Carmen", country: "México", region: "Caribe", stars: 3, pricePerNight: 55, emoji: "🏄", daysAgo: 1, category: "budget", imageId: "1500759285222-a95626b934cb", reviewScore: 8.2, reviewCount: 1820, highlight: "Rooftop pool en la Quinta Avenida" },
  { id: "tc-1", slug: "grace-bay-club-turks", name: "Grace Bay Club", city: "Providenciales", country: "Turks y Caicos", region: "Caribe", stars: 5, pricePerNight: 525, emoji: "🏖️", daysAgo: 10, category: "luxury", imageId: "1538935732373-f7a495fea3f6", reviewScore: 9.4, reviewCount: 1240, highlight: "Mejor playa del mundo" },
  { id: "aw-1", slug: "ritz-carlton-aruba", name: "The Ritz-Carlton Aruba", city: "Palm Beach", country: "Aruba", region: "Caribe", stars: 5, pricePerNight: 385, emoji: "🌴", daysAgo: 7, category: "beach", imageId: "1552074284-5e88ef1aef18", reviewScore: 9.1, reviewCount: 2450, highlight: "En la playa Palm Beach" },
  { id: "lc-1", slug: "jade-mountain-st-lucia", name: "Jade Mountain", city: "Soufrière", country: "Santa Lucía", region: "Caribe", stars: 5, pricePerNight: 795, emoji: "🏔️", daysAgo: 13, category: "luxury", imageId: "1506929562872-bb421503ef21", reviewScore: 9.6, reviewCount: 480, highlight: "Piscina infinity con vistas a los Pitons" },
  { id: "pr-1", slug: "condado-vanderbilt-san-juan", name: "Condado Vanderbilt", city: "San Juan", country: "Puerto Rico", region: "Caribe", stars: 5, pricePerNight: 295, emoji: "🏛️", daysAgo: 6, category: "luxury", imageId: "1500916434205-0c77489c6cf7", reviewScore: 9.0, reviewCount: 1820, highlight: "Art Deco oceanfront" },

  // ───────── América Norte (más)
  { id: "us-3", slug: "four-seasons-maui", name: "Four Seasons Resort Maui", city: "Wailea", country: "Estados Unidos", region: "América Norte", stars: 5, pricePerNight: 685, emoji: "🌺", daysAgo: 12, category: "beach", imageId: "1582719508461-905c673771fd", reviewScore: 9.4, reviewCount: 2450, highlight: "Frente a Wailea Beach" },
  { id: "us-4", slug: "hotel-del-coronado-san-diego", name: "Hotel del Coronado", city: "San Diego", country: "Estados Unidos", region: "América Norte", stars: 4, pricePerNight: 345, emoji: "🏖️", daysAgo: 8, category: "beach", imageId: "1500916434205-0c77489c6cf7", reviewScore: 8.8, reviewCount: 4820, highlight: "Hotel victoriano icónico" },
  { id: "us-5", slug: "pod-times-square-nyc", name: "Pod Times Square", city: "Nueva York", country: "Estados Unidos", region: "América Norte", stars: 3, pricePerNight: 95, emoji: "🗽", daysAgo: 1, category: "budget", imageId: "1545324418-cc1a3fa10c00", reviewScore: 7.9, reviewCount: 8420, highlight: "Micro-hotel en Times Square" },
  { id: "us-6", slug: "bellagio-las-vegas", name: "Bellagio Las Vegas", city: "Las Vegas", country: "Estados Unidos", region: "América Norte", stars: 5, pricePerNight: 225, emoji: "🎰", daysAgo: 5, category: "luxury", imageId: "1564501049412-61c2a3083791", reviewScore: 9.0, reviewCount: 15200, highlight: "Fuentes + Cirque du Soleil" },
  { id: "ca-1", slug: "fairmont-chateau-lake-louise", name: "Fairmont Chateau Lake Louise", city: "Lake Louise", country: "Canadá", region: "América Norte", stars: 5, pricePerNight: 385, emoji: "🏔️", daysAgo: 9, category: "luxury", imageId: "1531168556467-80aace0d0144", reviewScore: 9.2, reviewCount: 3420, highlight: "Frente al lago esmeralda" },
  { id: "ca-2", slug: "hi-montreal-hostel", name: "HI Montreal Hostel", city: "Montreal", country: "Canadá", region: "América Norte", stars: 2, pricePerNight: 32, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1576354302919-96748cb8299e", reviewScore: 8.0, reviewCount: 4820, highlight: "Hostel en el Vieux-Montréal" },

  // ───────── América Sur (más)
  { id: "ar-2", slug: "llao-llao-bariloche", name: "Llao Llao Resort", city: "Bariloche", country: "Argentina", region: "América Sur", stars: 5, pricePerNight: 285, emoji: "🏔️", daysAgo: 7, category: "luxury", imageId: "1531168556467-80aace0d0144", reviewScore: 9.3, reviewCount: 2150, highlight: "Resort entre lagos y montañas" },
  { id: "ar-3", slug: "selina-buenos-aires", name: "Selina Buenos Aires", city: "Buenos Aires", country: "Argentina", region: "América Sur", stars: 3, pricePerNight: 28, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1589909202802-8f4aadce1849", reviewScore: 8.1, reviewCount: 2840, highlight: "Hostel trendy en Palermo" },
  { id: "cl-1", slug: "tierra-atacama", name: "Tierra Atacama", city: "San Pedro de Atacama", country: "Chile", region: "América Sur", stars: 5, pricePerNight: 425, emoji: "🏜️", daysAgo: 10, category: "luxury", imageId: "1606830733744-0ad778449672", reviewScore: 9.4, reviewCount: 680, highlight: "Spa + excursiones al desierto" },
  { id: "cl-2", slug: "the-singular-santiago", name: "The Singular Santiago", city: "Santiago", country: "Chile", region: "América Sur", stars: 5, pricePerNight: 185, emoji: "🏙️", daysAgo: 5, category: "city", imageId: "1564501049412-61c2a3083791", reviewScore: 9.1, reviewCount: 1450, highlight: "En el barrio Lastarria" },
  { id: "ec-1", slug: "mashpi-lodge-ecuador", name: "Mashpi Lodge", city: "Quito", country: "Ecuador", region: "América Sur", stars: 5, pricePerNight: 525, emoji: "🌿", daysAgo: 12, category: "luxury", imageId: "1622396481328-9b1b78cdd9fd", reviewScore: 9.5, reviewCount: 480, highlight: "Eco-lodge en bosque nublado" },
  { id: "uy-1", slug: "fasano-punta-del-este", name: "Hotel Fasano Punta del Este", city: "Punta del Este", country: "Uruguay", region: "América Sur", stars: 5, pricePerNight: 285, emoji: "🏖️", daysAgo: 7, category: "beach", imageId: "1500916434205-0c77489c6cf7", reviewScore: 9.0, reviewCount: 920, highlight: "Arquitectura brutalista frente al mar" },
  { id: "bo-1", slug: "palacio-de-sal-uyuni", name: "Palacio de Sal", city: "Uyuni", country: "Bolivia", region: "América Sur", stars: 4, pricePerNight: 85, emoji: "🧂", daysAgo: 6, category: "city", imageId: "1606830733744-0ad778449672", reviewScore: 8.7, reviewCount: 1240, highlight: "Hotel construido con bloques de sal" },

  // ───────── Oceanía (más)
  { id: "au-2", slug: "qualia-hamilton-island", name: "qualia Hamilton Island", city: "Hamilton Island", country: "Australia", region: "Oceanía", stars: 5, pricePerNight: 685, emoji: "🐠", daysAgo: 14, category: "luxury", imageId: "1582719508461-905c673771fd", reviewScore: 9.6, reviewCount: 920, highlight: "Gran Barrera de Coral" },
  { id: "au-3", slug: "ovolo-woolloomooloo-sydney", name: "Ovolo Woolloomooloo", city: "Sídney", country: "Australia", region: "Oceanía", stars: 4, pricePerNight: 185, emoji: "🌉", daysAgo: 4, category: "city", imageId: "1506973035872-a4ec16b8e8d9", reviewScore: 8.9, reviewCount: 2450, highlight: "Wharf histórico renovado" },
  { id: "nz-1", slug: "huka-lodge-taupo", name: "Huka Lodge", city: "Taupo", country: "Nueva Zelanda", region: "Oceanía", stars: 5, pricePerNight: 525, emoji: "🌿", daysAgo: 11, category: "luxury", imageId: "1531168556467-80aace0d0144", reviewScore: 9.5, reviewCount: 480, highlight: "Lodge en bosque junto al río Waikato" },
  { id: "nz-2", slug: "base-queenstown", name: "Base Queenstown", city: "Queenstown", country: "Nueva Zelanda", region: "Oceanía", stars: 2, pricePerNight: 35, emoji: "🎿", daysAgo: 1, category: "budget", imageId: "1576354302919-96748cb8299e", reviewScore: 7.8, reviewCount: 3420, highlight: "Hostel de aventura" },
  { id: "fj-1", slug: "likuliku-fiji", name: "Likuliku Lagoon Resort", city: "Malolo", country: "Fiyi", region: "Oceanía", stars: 5, pricePerNight: 595, emoji: "🏝️", daysAgo: 13, category: "beach", imageId: "1514282401047-d79a71a590e8", reviewScore: 9.4, reviewCount: 620, highlight: "Bures sobre el agua" },

  // ───────── Oriente Medio (más)
  { id: "ae-3", slug: "one-only-the-palm", name: "One&Only The Palm", city: "Dubái", country: "Emiratos Árabes Unidos", region: "Oriente Medio", stars: 5, pricePerNight: 525, emoji: "🌴", daysAgo: 8, category: "luxury", imageId: "1564501049412-61c2a3083791", reviewScore: 9.3, reviewCount: 2150, highlight: "Resort íntimo en The Palm" },
  { id: "om-1", slug: "alila-jabal-akhdar-oman", name: "Alila Jabal Akhdar", city: "Jebel Akhdar", country: "Omán", region: "Oriente Medio", stars: 5, pricePerNight: 345, emoji: "🏔️", daysAgo: 10, category: "luxury", imageId: "1566073771259-6a8506099945", reviewScore: 9.4, reviewCount: 680, highlight: "En un acantilado a 2000m" },
  { id: "jo-1", slug: "kempinski-dead-sea-jordan", name: "Kempinski Ishtar Dead Sea", city: "Mar Muerto", country: "Jordania", region: "Oriente Medio", stars: 5, pricePerNight: 195, emoji: "🧖", daysAgo: 6, category: "beach", imageId: "1611892440504-42a792e24d32", reviewScore: 8.9, reviewCount: 1820, highlight: "Spa con lodo del Mar Muerto" },
  { id: "il-1", slug: "david-citadel-jerusalem", name: "David Citadel Hotel", city: "Jerusalén", country: "Israel", region: "Oriente Medio", stars: 5, pricePerNight: 285, emoji: "🏛️", daysAgo: 7, category: "city", imageId: "1503152394-c571994fd383", reviewScore: 9.0, reviewCount: 2450, highlight: "Vistas a la Ciudad Vieja" },
  { id: "sa-1", slug: "ritz-carlton-riyadh", name: "The Ritz-Carlton Riyadh", city: "Riad", country: "Arabia Saudita", region: "Oriente Medio", stars: 5, pricePerNight: 385, emoji: "🕌", daysAgo: 9, category: "luxury", imageId: "1580418827493-f2b22c0a76cb", reviewScore: 9.1, reviewCount: 1240, highlight: "Palacio en el distrito diplomático" },

  // ───────── Asia · Más países
  { id: "th-9", slug: "hostel-loft-phuket", name: "The Loft Hostel Phuket", city: "Phuket", country: "Tailandia", region: "Asia", stars: 2, pricePerNight: 15, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1576354302919-96748cb8299e", reviewScore: 7.9, reviewCount: 2840, highlight: "Hostel más barato de Phuket" },
  { id: "id-6", slug: "capsule-hotel-bali", name: "Capsule Hotel Bali", city: "Kuta", country: "Indonesia", region: "Asia", stars: 2, pricePerNight: 18, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1564501049412-61c2a3083791", reviewScore: 7.7, reviewCount: 3240, highlight: "Cápsulas a precio mini" },
  { id: "vn-4", slug: "la-siesta-classic-hanoi", name: "La Siesta Classic Hanoi", city: "Hanói", country: "Vietnam", region: "Asia", stars: 4, pricePerNight: 55, emoji: "🏯", daysAgo: 2, category: "budget", imageId: "1540541338287-41700207dee6", reviewScore: 9.0, reviewCount: 4820, highlight: "Boutique en Old Quarter" },
  { id: "jp-4", slug: "hoshinoya-kyoto", name: "Hoshinoya Kyoto", city: "Kioto", country: "Japón", region: "Asia", stars: 5, pricePerNight: 525, emoji: "🍃", daysAgo: 10, category: "luxury", imageId: "1568084680786-a84f91d1153c", reviewScore: 9.5, reviewCount: 680, highlight: "Solo accesible en barca por el río" },
  { id: "jp-5", slug: "nine-hours-shinjuku", name: "nine hours Shinjuku", city: "Tokio", country: "Japón", region: "Asia", stars: 2, pricePerNight: 28, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1493976040374-85c8e12f0c0e", reviewScore: 8.0, reviewCount: 6240, highlight: "Hotel cápsula futurista" },

  // ───────── Más budget/mid-range Europa
  { id: "pt-4", slug: "hostel-rossio-lisboa", name: "My Story Hotel Rossio", city: "Lisboa", country: "Portugal", region: "Europa", stars: 3, pricePerNight: 65, emoji: "🏛️", daysAgo: 1, category: "budget", imageId: "1555881400-74d7acaacd8b", reviewScore: 8.3, reviewCount: 3420, highlight: "En la plaza principal de Lisboa" },
  { id: "pt-5", slug: "pestana-porto", name: "Pestana Vintage Porto", city: "Porto", country: "Portugal", region: "Europa", stars: 4, pricePerNight: 95, emoji: "🍷", daysAgo: 3, category: "city", imageId: "1542314831-068cd1dbfeeb", reviewScore: 8.7, reviewCount: 2840, highlight: "En la Ribeira patrimonio UNESCO" },
  { id: "gr-7", slug: "budget-athens-backpackers", name: "Athens Backpackers", city: "Atenas", country: "Grecia", region: "Europa", stars: 2, pricePerNight: 22, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1503152394-c571994fd383", reviewScore: 8.0, reviewCount: 4820, highlight: "Rooftop bar con vista a la Acrópolis" },
  { id: "hr-2", slug: "hotel-marmont-heritage-split", name: "Hotel Marmont Heritage", city: "Split", country: "Croacia", region: "Europa", stars: 4, pricePerNight: 95, emoji: "🏛️", daysAgo: 3, category: "city", imageId: "1556909114-f6e7ad7d3136", reviewScore: 8.8, reviewCount: 1820, highlight: "Dentro del palacio de Diocleciano" },
  { id: "si-1", slug: "intercontinental-ljubljana", name: "InterContinental Ljubljana", city: "Liubliana", country: "Eslovenia", region: "Europa", stars: 5, pricePerNight: 165, emoji: "🌿", daysAgo: 4, category: "city", imageId: "1551105378-78e609e1d468", reviewScore: 9.0, reviewCount: 1450, highlight: "Vistas al castillo medieval" },
  { id: "ro-1", slug: "epoque-hotel-bucharest", name: "Epoque Hotel Bucharest", city: "Bucarest", country: "Rumanía", region: "Europa", stars: 5, pricePerNight: 95, emoji: "🏛️", daysAgo: 3, category: "city", imageId: "1567593810070-7a3d471af022", reviewScore: 9.1, reviewCount: 1240, highlight: "Boutique Art Nouveau a precio ganga" },
  { id: "rs-1", slug: "square-nine-belgrade", name: "Square Nine Hotel Belgrade", city: "Belgrado", country: "Serbia", region: "Europa", stars: 5, pricePerNight: 125, emoji: "🏙️", daysAgo: 4, category: "city", imageId: "1564501049412-61c2a3083791", reviewScore: 9.0, reviewCount: 1820, highlight: "Design hotel en plaza Studentski" },

  // ───────── Más mid-range familiar
  { id: "es-13", slug: "hard-rock-tenerife", name: "Hard Rock Hotel Tenerife", city: "Tenerife", country: "España", region: "Europa", stars: 5, pricePerNight: 165, emoji: "🎸", daysAgo: 4, category: "family", imageId: "1576354302919-96748cb8299e", reviewScore: 8.7, reviewCount: 4820, highlight: "Piscina con olas + rock" },
  { id: "es-14", slug: "portaventura-hotel-gold-river", name: "PortAventura Hotel Gold River", city: "Salou", country: "España", region: "Europa", stars: 4, pricePerNight: 85, emoji: "🎢", daysAgo: 2, category: "family", imageId: "1571003123894-1f0594d2b5d9", reviewScore: 8.3, reviewCount: 6840, highlight: "Acceso directo al parque temático" },
  { id: "it-12", slug: "hotel-le-fontanelle-toscana", name: "Hotel Le Fontanelle", city: "Siena", country: "Italia", region: "Europa", stars: 4, pricePerNight: 145, emoji: "🌻", daysAgo: 5, category: "family", imageId: "1518733057094-95b53143d2a7", reviewScore: 8.9, reviewCount: 920, highlight: "Agroturismo con piscina en viñedos" },
  { id: "pt-6", slug: "martinhal-sagres", name: "Martinhal Sagres Beach Family Resort", city: "Sagres", country: "Portugal", region: "Europa", stars: 5, pricePerNight: 195, emoji: "🏄", daysAgo: 4, category: "family", imageId: "1611892440504-42a792e24d32", reviewScore: 9.0, reviewCount: 2450, highlight: "Mejor resort familiar de Europa" },
  { id: "gr-8", slug: "grecotel-corfu-imperial", name: "Grecotel Corfu Imperial", city: "Corfú", country: "Grecia", region: "Europa", stars: 5, pricePerNight: 195, emoji: "🏝️", daysAgo: 5, category: "family", imageId: "1497302347632-904729bc24aa", reviewScore: 8.8, reviewCount: 2840, highlight: "Playa privada + kids club" },

  // ───────── Budget global extra
  { id: "vn-5", slug: "the-common-room-saigon", name: "The Common Room Project", city: "Ho Chi Minh", country: "Vietnam", region: "Asia", stars: 2, pricePerNight: 12, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1571896349842-33c89424de2d", reviewScore: 8.3, reviewCount: 2150, highlight: "12€/noche en el centro de Saigón" },
  { id: "in-4", slug: "zostel-jaipur", name: "Zostel Jaipur", city: "Jaipur", country: "India", region: "Asia", stars: 2, pricePerNight: 8, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1524231757912-21f4fe3a7200", reviewScore: 8.1, reviewCount: 3820, highlight: "Hostel a 8€ en la Ciudad Rosa" },
  { id: "ma-4", slug: "riad-joya-marrakech", name: "Riad Joya", city: "Marrakech", country: "Marruecos", region: "África", stars: 3, pricePerNight: 35, emoji: "🕌", daysAgo: 2, category: "budget", imageId: "1539020140153-e479b8c22e70", reviewScore: 8.6, reviewCount: 1240, highlight: "Riad budget con patio interior" },
  { id: "co-2", slug: "selina-cartagena", name: "Selina Cartagena", city: "Cartagena", country: "Colombia", region: "América Sur", stars: 3, pricePerNight: 25, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1589909202802-8f4aadce1849", reviewScore: 8.0, reviewCount: 2840, highlight: "Hostel en ciudad amurallada" },
  { id: "hu-2", slug: "maverick-city-lodge-budapest", name: "Maverick City Lodge", city: "Budapest", country: "Hungría", region: "Europa", stars: 3, pricePerNight: 28, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1567593810070-7a3d471af022", reviewScore: 8.2, reviewCount: 3420, highlight: "Hostel design en el centro" },
  { id: "tr-2", slug: "cheers-hostel-istanbul", name: "Cheers Hostel Istanbul", city: "Estambul", country: "Turquía", region: "Europa", stars: 2, pricePerNight: 18, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1524231757912-21f4fe3a7200", reviewScore: 8.0, reviewCount: 4820, highlight: "Rooftop con vista a Santa Sofía" },
  // ───────── Más hoteles para llegar a 210+
  { id: "us-7", slug: "ace-hotel-portland", name: "Ace Hotel Portland", city: "Portland", country: "Estados Unidos", region: "América Norte", stars: 4, pricePerNight: 145, emoji: "🌲", daysAgo: 3, category: "city", imageId: "1545324418-cc1a3fa10c00", reviewScore: 8.5, reviewCount: 2840, highlight: "Hipster-chic en el Pearl District" },
  { id: "us-8", slug: "freehand-los-angeles", name: "Freehand Los Angeles", city: "Los Ángeles", country: "Estados Unidos", region: "América Norte", stars: 3, pricePerNight: 85, emoji: "🌴", daysAgo: 2, category: "budget", imageId: "1500916434205-0c77489c6cf7", reviewScore: 8.3, reviewCount: 3820, highlight: "Pool scene en DTLA" },
  { id: "sg-2", slug: "pod-capsule-singapore", name: "The Pod Boutique Capsule", city: "Singapur", country: "Singapur", region: "Asia", stars: 2, pricePerNight: 35, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1525625293386-3f8f99389edd", reviewScore: 8.2, reviewCount: 2840, highlight: "Cápsulas de diseño en Chinatown" },
  { id: "kr-2", slug: "signiel-seoul", name: "Signiel Seoul", city: "Seúl", country: "Corea del Sur", region: "Asia", stars: 5, pricePerNight: 385, emoji: "🏙️", daysAgo: 7, category: "luxury", imageId: "1540959733332-eab4deabeeaf", reviewScore: 9.3, reviewCount: 1820, highlight: "En la torre Lotte World Tower" },
  { id: "jp-6", slug: "aman-tokyo", name: "Aman Tokyo", city: "Tokio", country: "Japón", region: "Asia", stars: 5, pricePerNight: 685, emoji: "✨", daysAgo: 11, category: "luxury", imageId: "1493976040374-85c8e12f0c0e", reviewScore: 9.6, reviewCount: 620, highlight: "Zen minimalism en Otemachi" },
  { id: "mv-4", slug: "gili-lankanfushi", name: "Gili Lankanfushi", city: "North Malé Atoll", country: "Maldivas", region: "Asia", stars: 5, pricePerNight: 895, emoji: "🐢", daysAgo: 14, category: "luxury", imageId: "1551918120-9739cb430c6d", reviewScore: 9.6, reviewCount: 480, highlight: "Villas sobre el agua sin zapatos" },
  { id: "id-7", slug: "nihi-sumba", name: "NIHI Sumba", city: "Sumba", country: "Indonesia", region: "Asia", stars: 5, pricePerNight: 795, emoji: "🏄", daysAgo: 15, category: "luxury", imageId: "1537996194471-e657df975ab4", reviewScore: 9.7, reviewCount: 320, highlight: "Mejor hotel del mundo 2x" },
  { id: "uk-2", slug: "yha-london-central", name: "YHA London Central", city: "Londres", country: "Reino Unido", region: "Europa", stars: 2, pricePerNight: 35, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1513635269975-59663e0ac1ad", reviewScore: 7.9, reviewCount: 8420, highlight: "Hostel céntrico en St Pancras" },
  { id: "fr-6", slug: "mama-shelter-paris", name: "Mama Shelter Paris", city: "París", country: "Francia", region: "Europa", stars: 4, pricePerNight: 95, emoji: "🎬", daysAgo: 2, category: "city", imageId: "1551105378-78e609e1d468", reviewScore: 8.4, reviewCount: 4820, highlight: "Design by Starck en Belleville" },
  { id: "za-4", slug: "backpack-cape-town", name: "The Backpack Cape Town", city: "Ciudad del Cabo", country: "Sudáfrica", region: "África", stars: 2, pricePerNight: 18, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1547721064-da6cfb341d50", reviewScore: 8.0, reviewCount: 3240, highlight: "Hostel premiado en Gardens" },
  { id: "is-2", slug: "kex-hostel-reykjavik", name: "Kex Hostel", city: "Reikiavik", country: "Islandia", region: "Europa", stars: 2, pricePerNight: 45, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1531168556467-80aace0d0144", reviewScore: 8.3, reviewCount: 3820, highlight: "En antigua fábrica de galletas" },
  { id: "cu-2", slug: "iberostar-grand-packard-havana", name: "Iberostar Grand Packard", city: "La Habana", country: "Cuba", region: "Caribe", stars: 5, pricePerNight: 225, emoji: "🚗", daysAgo: 6, category: "city", imageId: "1500759285222-a95626b934cb", reviewScore: 8.8, reviewCount: 2840, highlight: "Frente al Malecón con piscina infinity" },
  { id: "br-2", slug: "janeiro-hotel-leblon", name: "Janeiro Hotel", city: "Río de Janeiro", country: "Brasil", region: "América Sur", stars: 4, pricePerNight: 145, emoji: "🏖️", daysAgo: 3, category: "beach", imageId: "1483729558449-99ef09a8c325", reviewScore: 8.9, reviewCount: 1820, highlight: "Boutique en playa de Leblon" },
  { id: "pe-2", slug: "selina-cusco", name: "Selina Plaza de Armas Cusco", city: "Cusco", country: "Perú", region: "América Sur", stars: 3, pricePerNight: 22, emoji: "🎒", daysAgo: 1, category: "budget", imageId: "1606830733744-0ad778449672", reviewScore: 8.2, reviewCount: 3420, highlight: "Hostel en plaza principal" },
  { id: "eg-2", slug: "sofitel-winter-palace-luxor", name: "Sofitel Winter Palace", city: "Luxor", country: "Egipto", region: "África", stars: 5, pricePerNight: 145, emoji: "🏺", daysAgo: 7, category: "luxury", imageId: "1566073771259-6a8506099945", reviewScore: 9.0, reviewCount: 2150, highlight: "Junto al Valle de los Reyes" },
  { id: "tz-2", slug: "four-seasons-serengeti", name: "Four Seasons Safari Lodge Serengeti", city: "Serengeti", country: "Tanzania", region: "África", stars: 5, pricePerNight: 795, emoji: "🦁", daysAgo: 17, category: "luxury", imageId: "1516026672322-bc52d61a55d5", reviewScore: 9.5, reviewCount: 480, highlight: "La gran migración desde la piscina" },

];

export const HOTEL_SEED: Deal[] = HOTEL_ENTRIES.map(makeHotel);

/**
 * Devuelve hoteles del seed filtrando por minStars + ordenando por price_per_night.
 * Reservado como fallback cuando el backend devuelve [] (hotel_hunter aún no
 * ha corrido en VPS o ha fallado).
 */
export function getHotelSeedFallback(opts?: {
  limit?: number;
  minStars?: number;
  maxPricePerNight?: number;
  category?: HotelCategory;
  region?: string;
  city?: string;
}): Deal[] {
  const minStars = opts?.minStars ?? 3;
  const limit = opts?.limit ?? 30;
  const maxPpn = opts?.maxPricePerNight;
  const cat = opts?.category;
  const region = opts?.region;
  const city = opts?.city?.toLowerCase();
  const arr = HOTEL_SEED.filter((h) => {
    const ppn = h.price_per_night ?? 0;
    const stars = parseInt(
      (h.tags || []).find((t) => t.endsWith("-stars"))?.split("-")[0] ?? "0",
      10,
    );
    if (stars < minStars) return false;
    if (maxPpn && ppn > maxPpn) return false;
    if (cat && (h.tags || []).indexOf(cat) === -1) return false;
    if (region && h.region !== region) return false;
    if (city && (h.city_to ?? "").toLowerCase() !== city) return false;
    return true;
  });
  arr.sort((a, b) => (a.price_per_night ?? 0) - (b.price_per_night ?? 0));
  return arr.slice(0, limit);
}

/** Lista pública de entries con campos custom para detail pages + filtros. */
export function getHotelEntries(): HotelEntry[] {
  return HOTEL_ENTRIES;
}

/** Busca un hotel por slug → para /hoteles/[slug]. */
export function getHotelBySlug(slug: string): HotelEntry | null {
  return HOTEL_ENTRIES.find((h) => h.slug === slug) ?? null;
}

/** Amenities para un hotel (entrada raw). Mismo helper que se usa en makeHotel. */
export function getHotelAmenities(h: HotelEntry): string[] {
  return deriveAmenities(h);
}

/** Coordenadas para un hotel. Si no están explícitas, usa centroide país. */
export function getHotelCoords(h: HotelEntry): [number, number] {
  return deriveCoords(h);
}

/**
 * Pool grande de fotos por categoría — usamos esto para componer galerías
 * con 4 imágenes adicionales por hotel SIN repetir entre hoteles del mismo
 * slug.
 *
 * SSS86 (May 2026): expandimos el pool y derivamos las imágenes secundarias
 * mediante un offset estable basado en el slug, para que cada hotel reciba
 * 4 fotos diferentes (y diferentes entre hoteles vecinos).
 */
const GALLERY_POOL_BY_CAT: Record<HotelCategory, string[]> = {
  beach: [
    "1582719508461-905c673771fd", // pool resort
    "1610530460358-dc9ed7e15ba0", // tropical island
    "1582719508461-905c673771fd",    // beach resort
    "1622396481328-9b1b78cdd9fd", // jungle bungalow
    "1505881502353-a1986add3762", // mediterranean
    "1620735692151-26a7e0748429", // beach umbrella
    "1514282401047-d79a71a590e8", // beach villa
    "1571003123894-1f0594d2b5d9", // suite balcony
    "1611892440504-42a792e24d32", // spa modern
    "1584132967334-10e028bd69f7", // pool view
  ],
  city: [
    "1564501049412-61c2a3083791", // modern lobby
    "1503152394-c571994fd383", // penthouse view
    "1551105378-78e609e1d468",    // urban suite
    "1567593810070-7a3d471af022", // city architecture
    "1502602898657-3e91760cbb34",    // boutique
    "1535827841776-24afc1e255ac", // panorama
    "1551918120-9739cb430c6d",    // skyline view
    "1611339555312-e607c8352fd7", // modern interior
    "1576354302919-96748cb8299e", // exterior
    "1556909114-f6e7ad7d3136",    // rooftop
  ],
  luxury: [
    "1551882547-ff40c63fe5fa",    // luxury bed white
    "1542314831-068cd1dbfeeb",    // luxury bedroom
    "1564013799919-ab600027ffc6", // luxury bedroom 2
    "1518733057094-95b53143d2a7", // luxe interior
    "1566073771259-6a8506099945", // bed luxury
    "1602002418082-a4443e081dd1", // resort villa
    "1518733057094-95b53143d2a7",    // lake view
    "1571397133301-3f0b3676f8e3", // modern luxe
    "1538935732373-f7a495fea3f6", // suite
    "1601751818941-571144562ff8", // cliff hotel
  ],
  family: [
    "1582719508461-905c673771fd", // pool
    "1571003123894-1f0594d2b5d9", // family balcony
    "1571003123894-1f0594d2b5d9", // resort spa
    "1576354302919-96748cb8299e", // exterior
    "1620735692151-26a7e0748429", // beach
    "1514282401047-d79a71a590e8", // resort villa
    "1500916434205-0c77489c6cf7", // beach palms
    "1552074284-5e88ef1aef18",    // colonial city
    "1559599189-d8669cdd9e96",    // spa
    "1582719508461-905c673771fd",    // beach resort
  ],
  budget: [
    "1576354302919-96748cb8299e", // simple exterior
    "1502602898657-3e91760cbb34",    // boutique
    "1568084680786-a84f91d1153c", // riad
    "1542640244-7e672d6cef4e",    // asian themed
    "1611892440504-42a792e24d32", // bath
    "1571896349842-33c89424de2d", // mountain
    "1540541338287-41700207dee6", // boutique colonial
    "1564501049412-61c2a3083791", // lobby
    "1551105378-78e609e1d468",    // suite
    "1611339555312-e607c8352fd7", // modern
  ],
};

/**
 * Hash simple FNV-1a determinístico para obtener un offset estable por slug.
 * Mismo slug → mismo offset → mismas fotos secundarias en cada render.
 */
function slugOffset(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
}

export function getHotelGallery(h: HotelEntry): string[] {
  const pool = GALLERY_POOL_BY_CAT[h.category] ?? GALLERY_POOL_BY_CAT.city;
  // Excluir el imageId base para no duplicar el hero.
  let candidates = pool.filter((id) => id !== h.imageId);
  // SSS91 defensive: si el filter dejó pool vacío (sólo pasaría si el imageId
  // base coincide con TODAS las entradas del pool — improbable pero no
  // imposible si alguien reusa el mismo ID), fallback al pool city sin
  // filtrar para que la galería siempre tenga ≥4 fotos secundarias.
  if (candidates.length < 4) {
    const fallback = GALLERY_POOL_BY_CAT.city.filter((id) => id !== h.imageId);
    candidates = candidates.length > 0
      ? [...candidates, ...fallback.filter((id) => !candidates.includes(id))]
      : fallback;
  }
  // Offset determinístico por slug — cada hotel arranca en un punto distinto
  // del pool, lo que da 4 fotos diferentes entre hoteles vecinos.
  const offset = slugOffset(h.slug);
  const picks: string[] = [];
  for (let i = 0; i < 4 && i < candidates.length; i++) {
    picks.push(candidates[(offset + i) % candidates.length]);
  }
  return [h.imageId, ...picks];
}

/** Categorías disponibles con conteo, para tabs. */
export function getCategoryCounts(): Record<HotelCategory, number> {
  const counts: Record<HotelCategory, number> = {
    beach: 0, city: 0, luxury: 0, family: 0, budget: 0,
  };
  HOTEL_ENTRIES.forEach((h) => { counts[h.category]++; });
  return counts;
}
