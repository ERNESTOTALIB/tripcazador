/**
 * hotel_seed — fase yy YY1 (expansion 30→60 + categorías + imágenes + reviews)
 *
 * Fallback con 60 hoteles reales cuando el backend hotel_hunter devuelve [].
 *
 * Mejoras vs WW1:
 *  - 60 hoteles (antes 30): cobertura mundial mucho mayor
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

// 60 hoteles reales. Cada uno con su propia imagen Unsplash y categoría.
const HOTEL_ENTRIES: HotelEntry[] = [
  // ───────── Asia · Tailandia
  { id: "th-1", slug: "dusit-thani-phuket", name: "Dusit Thani Phuket", city: "Phuket", country: "Tailandia", region: "Asia", stars: 5, pricePerNight: 95, emoji: "🏝️", daysAgo: 1, category: "beach", imageId: "1573843981267-be1999ff37cd", reviewScore: 8.7, reviewCount: 2840, highlight: "Acceso directo a playa privada" },
  { id: "th-2", slug: "krabi-resort", name: "Krabi Resort", city: "Krabi", country: "Tailandia", region: "Asia", stars: 4, pricePerNight: 62, emoji: "🌊", daysAgo: 3, category: "beach", imageId: "1528181304800-259b08848526", reviewScore: 8.4, reviewCount: 1920, highlight: "Bungalows con vistas al mar" },
  { id: "th-3", slug: "anantara-chiang-mai", name: "Anantara Chiang Mai", city: "Chiang Mai", country: "Tailandia", region: "Asia", stars: 5, pricePerNight: 110, emoji: "⛩️", daysAgo: 5, category: "luxury", imageId: "1542640244-7e672d6cef4e", reviewScore: 9.1, reviewCount: 1350, highlight: "Spa thai + clases de cocina" },
  { id: "th-4", slug: "sukhothai-bangkok", name: "The Sukhothai Bangkok", city: "Bangkok", country: "Tailandia", region: "Asia", stars: 5, pricePerNight: 145, emoji: "🛕", daysAgo: 7, category: "city", imageId: "1508009603885-50cf7c579365", reviewScore: 9.0, reviewCount: 3200, highlight: "Centro de Bangkok con piscina infinity" },
  { id: "th-5", slug: "kc-resort-phi-phi", name: "KC Resort Phi Phi", city: "Phi Phi", country: "Tailandia", region: "Asia", stars: 4, pricePerNight: 88, emoji: "🐠", daysAgo: 4, category: "beach", imageId: "1506929562872-bb421503ef21", reviewScore: 8.5, reviewCount: 1620, highlight: "Snorkel en aguas cristalinas" },

  // ───────── Asia · Indonesia
  { id: "id-1", slug: "padma-resort-ubud", name: "Padma Resort Ubud", city: "Ubud", country: "Indonesia", region: "Asia", stars: 5, pricePerNight: 125, emoji: "🌴", daysAgo: 2, category: "luxury", imageId: "1518002171953-a080ee817e1f", reviewScore: 9.2, reviewCount: 2150, highlight: "Vistas a las terrazas de arroz" },
  { id: "id-2", slug: "the-mulia-bali", name: "The Mulia Bali", city: "Nusa Dua", country: "Indonesia", region: "Asia", stars: 5, pricePerNight: 165, emoji: "🏖️", daysAgo: 4, category: "luxury", imageId: "1582719508461-905c673771fd", reviewScore: 9.3, reviewCount: 4180, highlight: "Suite con jacuzzi privado" },
  { id: "id-3", slug: "komaneka-bisma", name: "Komaneka at Bisma", city: "Ubud", country: "Indonesia", region: "Asia", stars: 4, pricePerNight: 78, emoji: "🌿", daysAgo: 6, category: "beach", imageId: "1622396481328-9b1b78cdd9fd", reviewScore: 8.9, reviewCount: 980, highlight: "Inmerso en la jungla balinesa" },
  { id: "id-4", slug: "alila-seminyak", name: "Alila Seminyak", city: "Seminyak", country: "Indonesia", region: "Asia", stars: 5, pricePerNight: 145, emoji: "🌅", daysAgo: 5, category: "beach", imageId: "1559814047-7f788ef58e7d", reviewScore: 9.0, reviewCount: 1730, highlight: "Frente al mar de Seminyak" },
  { id: "id-5", slug: "fairmont-sanur", name: "Fairmont Sanur Beach Bali", city: "Sanur", country: "Indonesia", region: "Asia", stars: 5, pricePerNight: 135, emoji: "🌊", daysAgo: 8, category: "family", imageId: "1571003123894-1f0594d2b5d9", reviewScore: 8.8, reviewCount: 2050, highlight: "Familiar con kids club" },

  // ───────── Asia · Maldivas
  { id: "mv-1", slug: "adaaran-hudhuranfushi", name: "Adaaran Select Hudhuranfushi", city: "Atolón Norte de Malé", country: "Maldivas", region: "Asia", stars: 4, pricePerNight: 285, emoji: "🏝️", daysAgo: 8, category: "beach", imageId: "1514282401047-d79a71a590e8", reviewScore: 8.5, reviewCount: 890, highlight: "Bungalows sobre el agua" },
  { id: "mv-2", slug: "oblu-sangeli", name: "OBLU Select Sangeli", city: "Atolón Norte de Malé", country: "Maldivas", region: "Asia", stars: 5, pricePerNight: 425, emoji: "🌊", daysAgo: 12, category: "luxury", imageId: "1551918120-9739cb430c6d", reviewScore: 9.4, reviewCount: 1240, highlight: "All-inclusive premium 5★" },
  { id: "mv-3", slug: "soneva-fushi", name: "Soneva Fushi", city: "Atolón Baa", country: "Maldivas", region: "Asia", stars: 5, pricePerNight: 750, emoji: "✨", daysAgo: 15, category: "luxury", imageId: "1517840901100-8179e982acb7", reviewScore: 9.7, reviewCount: 480, highlight: "Eco-luxury con observatorio" },

  // ───────── Asia · Vietnam
  { id: "vn-1", slug: "intercontinental-danang", name: "InterContinental Danang", city: "Da Nang", country: "Vietnam", region: "Asia", stars: 5, pricePerNight: 195, emoji: "🌊", daysAgo: 7, category: "luxury", imageId: "1571896349842-33c89424de2d", reviewScore: 9.2, reviewCount: 1560, highlight: "Diseño Bill Bensley impresionante" },
  { id: "vn-2", slug: "metropole-hanoi", name: "Sofitel Legend Metropole Hanoi", city: "Hanói", country: "Vietnam", region: "Asia", stars: 5, pricePerNight: 165, emoji: "🏯", daysAgo: 9, category: "city", imageId: "1540541338287-41700207dee6", reviewScore: 9.3, reviewCount: 3450, highlight: "Hotel histórico colonial" },
  { id: "vn-3", slug: "fusion-resort-cam-ranh", name: "Fusion Resort Cam Ranh", city: "Nha Trang", country: "Vietnam", region: "Asia", stars: 5, pricePerNight: 125, emoji: "🏖️", daysAgo: 11, category: "beach", imageId: "1605538883669-825200433431", reviewScore: 8.8, reviewCount: 920, highlight: "Spa ilimitado incluido" },

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
  { id: "gr-4", slug: "athens-was-hotel", name: "Athens Was Hotel", city: "Atenas", country: "Grecia", region: "Europa", stars: 5, pricePerNight: 165, emoji: "🏛️", daysAgo: 14, category: "city", imageId: "1601565415267-724ddf3f57c2", reviewScore: 9.2, reviewCount: 2150, highlight: "Vistas a la Acrópolis" },
  { id: "gr-5", slug: "blue-palace-creta", name: "Blue Palace Elounda", city: "Creta", country: "Grecia", region: "Europa", stars: 5, pricePerNight: 295, emoji: "🌅", daysAgo: 6, category: "luxury", imageId: "1601751818941-571144562ff8", reviewScore: 9.0, reviewCount: 1680, highlight: "Bungalows con piscina privada" },

  // ───────── Europa · Italia
  { id: "it-1", slug: "caruso-belvedere", name: "Hotel Caruso Belvedere", city: "Ravello", country: "Italia", region: "Europa", stars: 5, pricePerNight: 380, emoji: "⛪", daysAgo: 6, category: "luxury", imageId: "1467269204594-9661b134dd2b", reviewScore: 9.5, reviewCount: 580, highlight: "Vistas a la Costa Amalfitana" },
  { id: "it-2", slug: "locarno-roma", name: "Hotel Locarno Roma", city: "Roma", country: "Italia", region: "Europa", stars: 4, pricePerNight: 145, emoji: "🏛️", daysAgo: 4, category: "city", imageId: "1552832230-c0197dd311b5", reviewScore: 8.6, reviewCount: 3420, highlight: "Cerca de Piazza del Popolo" },
  { id: "it-3", slug: "belmond-cipriani", name: "Hotel Belmond Cipriani", city: "Venecia", country: "Italia", region: "Europa", stars: 5, pricePerNight: 510, emoji: "🛶", daysAgo: 10, category: "luxury", imageId: "1564013799919-ab600027ffc6", reviewScore: 9.6, reviewCount: 720, highlight: "Lancha privada al San Marcos" },
  { id: "it-4", slug: "castello-ama-toscana", name: "Castello di Ama", city: "Toscana", country: "Italia", region: "Europa", stars: 5, pricePerNight: 295, emoji: "🍷", daysAgo: 13, category: "luxury", imageId: "1611346024156-8c95cf1d4a2c", reviewScore: 9.3, reviewCount: 410, highlight: "Castillo del s.XII + bodega" },
  { id: "it-5", slug: "grand-hotel-tremezzo", name: "Grand Hotel Tremezzo", city: "Lago Como", country: "Italia", region: "Europa", stars: 5, pricePerNight: 425, emoji: "💎", daysAgo: 8, category: "luxury", imageId: "1551133989-93c5c93ff547", reviewScore: 9.4, reviewCount: 980, highlight: "Frente al Lago di Como" },
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
  { id: "tz-1", slug: "andbeyond-ngorongoro", name: "&Beyond Ngorongoro Crater Lodge", city: "Cráter Ngorongoro", country: "Tanzania", region: "África", stars: 5, pricePerNight: 875, emoji: "🦓", daysAgo: 20, category: "luxury", imageId: "1494500764479-0c8f2919a3d8", reviewScore: 9.7, reviewCount: 180, highlight: "Vistas al cráter + safaris" },

  // ───────── Caribe
  { id: "do-1", slug: "iberostar-grand-bavaro", name: "Iberostar Grand Bávaro", city: "Punta Cana", country: "República Dominicana", region: "Caribe", stars: 5, pricePerNight: 285, emoji: "🌴", daysAgo: 4, category: "family", imageId: "1552074284-5e88ef1aef18", reviewScore: 9.0, reviewCount: 8420, highlight: "All-inclusive premium adults" },
  { id: "cu-1", slug: "iberostar-varadero", name: "Iberostar Selection Varadero", city: "Varadero", country: "Cuba", region: "Caribe", stars: 5, pricePerNight: 195, emoji: "🏖️", daysAgo: 7, category: "family", imageId: "1500759285222-a95626b934cb", reviewScore: 8.7, reviewCount: 5240, highlight: "Playa de arena blanca" },
  { id: "mx-1", slug: "rosewood-mayakoba", name: "Rosewood Mayakoba", city: "Riviera Maya", country: "México", region: "Caribe", stars: 5, pricePerNight: 525, emoji: "🌊", daysAgo: 10, category: "luxury", imageId: "1602002418082-a4443e081dd1", reviewScore: 9.5, reviewCount: 1680, highlight: "Suites con piscina privada" },
  { id: "mx-2", slug: "secrets-the-vine-cancun", name: "Secrets The Vine Cancún", city: "Cancún", country: "México", region: "Caribe", stars: 5, pricePerNight: 245, emoji: "🍷", daysAgo: 9, category: "family", imageId: "1547504717-65b6395b3a7b", reviewScore: 9.0, reviewCount: 4820, highlight: "Adults-only all-inclusive" },
  { id: "jm-1", slug: "sandals-royal-caribbean", name: "Sandals Royal Caribbean", city: "Montego Bay", country: "Jamaica", region: "Caribe", stars: 5, pricePerNight: 365, emoji: "🌺", daysAgo: 11, category: "luxury", imageId: "1538935732373-f7a495fea3f6", reviewScore: 9.1, reviewCount: 3240, highlight: "Adults-only frente al Caribe" },

  // ───────── América
  { id: "us-1", slug: "the-plaza-new-york", name: "The Plaza New York", city: "Nueva York", country: "Estados Unidos", region: "América Norte", stars: 5, pricePerNight: 685, emoji: "🗽", daysAgo: 13, category: "luxury", imageId: "1545324418-cc1a3fa10c00", reviewScore: 9.0, reviewCount: 4280, highlight: "Frente a Central Park" },
  { id: "us-2", slug: "fontainebleau-miami", name: "Fontainebleau Miami Beach", city: "Miami", country: "Estados Unidos", region: "América Norte", stars: 4, pricePerNight: 345, emoji: "🌴", daysAgo: 8, category: "beach", imageId: "1500916434205-0c77489c6cf7", reviewScore: 8.6, reviewCount: 5840, highlight: "Frente al océano + Liv club" },
  { id: "ar-1", slug: "alvear-buenos-aires", name: "Alvear Palace Hotel", city: "Buenos Aires", country: "Argentina", region: "América Sur", stars: 5, pricePerNight: 195, emoji: "🥩", daysAgo: 7, category: "city", imageId: "1589395937772-f67057e233df", reviewScore: 9.2, reviewCount: 1820, highlight: "Estilo Belle Époque parisino" },
  { id: "br-1", slug: "copacabana-palace", name: "Copacabana Palace", city: "Río de Janeiro", country: "Brasil", region: "América Sur", stars: 5, pricePerNight: 425, emoji: "🏖️", daysAgo: 14, category: "luxury", imageId: "1483729558449-99ef09a8c325", reviewScore: 9.3, reviewCount: 2640, highlight: "Frente a Copacabana" },
  { id: "pe-1", slug: "belmond-machu-picchu", name: "Belmond Sanctuary Lodge", city: "Machu Picchu", country: "Perú", region: "América Sur", stars: 5, pricePerNight: 685, emoji: "🏔️", daysAgo: 19, category: "luxury", imageId: "1606830733744-0ad778449672", reviewScore: 9.4, reviewCount: 480, highlight: "Único hotel en Machu Picchu" },

  // ───────── Oceanía
  { id: "au-1", slug: "park-hyatt-sydney", name: "Park Hyatt Sydney", city: "Sídney", country: "Australia", region: "Oceanía", stars: 5, pricePerNight: 565, emoji: "🌉", daysAgo: 16, category: "luxury", imageId: "1506973035872-a4ec16b8e8d9", reviewScore: 9.4, reviewCount: 1820, highlight: "Vistas a la Opera House" },
  { id: "pf-1", slug: "intercontinental-bora-bora", name: "InterContinental Bora Bora Resort", city: "Bora Bora", country: "Polinesia Francesa", region: "Oceanía", stars: 5, pricePerNight: 945, emoji: "🌊", daysAgo: 21, category: "luxury", imageId: "1542301554-c6018851abeb", reviewScore: 9.5, reviewCount: 320, highlight: "Bungalows sobre laguna turquesa" },

  // ───────── Oriente Medio
  { id: "ae-1", slug: "burj-al-arab", name: "Burj Al Arab Jumeirah", city: "Dubái", country: "Emiratos Árabes Unidos", region: "Oriente Medio", stars: 5, pricePerNight: 1450, emoji: "💎", daysAgo: 17, category: "luxury", imageId: "1512453979798-5ea266f8880c", reviewScore: 9.2, reviewCount: 1240, highlight: "Suite 7 estrellas icónica" },
  { id: "ae-2", slug: "atlantis-the-palm", name: "Atlantis The Palm", city: "Dubái", country: "Emiratos Árabes Unidos", region: "Oriente Medio", stars: 5, pricePerNight: 425, emoji: "🐬", daysAgo: 9, category: "family", imageId: "1564501049412-61c2a3083791", reviewScore: 8.8, reviewCount: 12400, highlight: "Aquaventure waterpark" },
  { id: "qa-1", slug: "mandarin-oriental-doha", name: "Mandarin Oriental Doha", city: "Doha", country: "Catar", region: "Oriente Medio", stars: 5, pricePerNight: 285, emoji: "🌃", daysAgo: 11, category: "city", imageId: "1580418827493-f2b22c0a76cb", reviewScore: 9.3, reviewCount: 1820, highlight: "Frente al casco antiguo" },
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
    "1559814047-7f788ef58e7d",    // beach resort
    "1622396481328-9b1b78cdd9fd", // jungle bungalow
    "1505881502353-a1986add3762", // mediterranean
    "1620735692151-26a7e0748429", // beach umbrella
    "1517840901100-8179e982acb7", // beach villa
    "1571003123894-1f0594d2b5d9", // suite balcony
    "1611892440504-42a792e24d32", // spa modern
    "1584132967334-10e028bd69f7", // pool view
  ],
  city: [
    "1564501049412-61c2a3083791", // modern lobby
    "1601565415267-724ddf3f57c2", // penthouse view
    "1551105378-78e609e1d468",    // urban suite
    "1567593810070-7a3d471af022", // city architecture
    "1542301554-c6018851abeb",    // boutique
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
    "1611346024156-8c95cf1d4a2c", // luxe interior
    "1566073771259-6a8506099945", // bed luxury
    "1602002418082-a4443e081dd1", // resort villa
    "1551133989-93c5c93ff547",    // lake view
    "1571397133301-3f0b3676f8e3", // modern luxe
    "1538935732373-f7a495fea3f6", // suite
    "1601751818941-571144562ff8", // cliff hotel
  ],
  family: [
    "1582719508461-905c673771fd", // pool
    "1571003123894-1f0594d2b5d9", // family balcony
    "1605538883669-825200433431", // resort spa
    "1576354302919-96748cb8299e", // exterior
    "1620735692151-26a7e0748429", // beach
    "1517840901100-8179e982acb7", // resort villa
    "1500916434205-0c77489c6cf7", // beach palms
    "1547504717-65b6395b3a7b",    // colonial city
    "1559599189-d8669cdd9e96",    // spa
    "1559814047-7f788ef58e7d",    // beach resort
  ],
  budget: [
    "1576354302919-96748cb8299e", // simple exterior
    "1542301554-c6018851abeb",    // boutique
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
