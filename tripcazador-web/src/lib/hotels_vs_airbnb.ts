/**
 * hotels_vs_airbnb.ts — F6 (May 2026)
 *
 * Catálogo de comparativas Hotels vs Airbnb por ciudad. 12 ciudades top:
 * Tokio, Bali, Lisboa, París, Roma, NYC, Bangkok, Estambul, Barcelona, Berlín,
 * Marrakech, Dubai. Cada ciudad tiene métricas, recomendación y links.
 */

export type ComparisonAxis = "precio" | "espacio" | "ubicacion" | "limpieza" | "cancelacion" | "experiencia";

export type CityComparison = {
  slug: string;
  city: string;
  country: string;
  hero_emoji: string;
  intro: string;
  hotel_pros: string[];
  hotel_cons: string[];
  airbnb_pros: string[];
  airbnb_cons: string[];
  axes: Record<ComparisonAxis, { hotel: number; airbnb: number; note: string }>;
  recommendation: {
    solo: "hotel" | "airbnb";
    pareja: "hotel" | "airbnb";
    familia: "hotel" | "airbnb";
    business: "hotel" | "airbnb";
    long_stay: "hotel" | "airbnb";
  };
  avg_price_per_night: { hotel_3star: number; hotel_4star: number; airbnb_room: number; airbnb_apt: number };
  best_neighborhoods_hotel: string[];
  best_neighborhoods_airbnb: string[];
};

export const HOTELS_VS_AIRBNB: CityComparison[] = [
  {
    slug: "tokio",
    city: "Tokio",
    country: "Japón",
    hero_emoji: "🗼",
    intro:
      "Tokio es probablemente la ciudad donde más diverge la experiencia hotel vs Airbnb. Por seguridad regulatoria y limpieza, el hotel suele ganar; por inmersión y precio, Airbnb se cuela.",
    hotel_pros: [
      "Limpieza japonesa (omotenashi) — sábanas frescas cada día",
      "Estaciones JR cercanas a casi todos",
      "Recepción 24h con inglés intermedio",
      "Onsen en hoteles ryokan tradicionales",
    ],
    hotel_cons: [
      "Habitaciones extremadamente pequeñas en business hotels",
      "Precios picos en Sakura (mar-abr) y Koyo (oct-nov)",
      "WiFi a veces de pago",
    ],
    airbnb_pros: [
      "Apartamentos espaciosos vs business hotel",
      "Lavadora (clave para 7+ días)",
      "Inmersión en barrios reales (Yanaka, Shimokitazawa)",
    ],
    airbnb_cons: [
      "Regulación minpaku — muchos listings retirados desde 2018",
      "Check-in remoto puede ser frustrante con maletas",
      "Algunos host aún pierden licencia en mid-stay",
    ],
    axes: {
      precio: { hotel: 6, airbnb: 7, note: "Airbnb 15-25% más barato si quedas 4+ noches" },
      espacio: { hotel: 4, airbnb: 9, note: "Airbnb 2-3× más m²" },
      ubicacion: { hotel: 9, airbnb: 7, note: "Hotel cerca de JR/metro siempre" },
      limpieza: { hotel: 10, airbnb: 7, note: "Hotel limpia diario" },
      cancelacion: { hotel: 8, airbnb: 5, note: "Hotel flexible, Airbnb suele estricto" },
      experiencia: { hotel: 7, airbnb: 9, note: "Airbnb inmersivo, hotel internacional" },
    },
    recommendation: {
      solo: "hotel",
      pareja: "hotel",
      familia: "airbnb",
      business: "hotel",
      long_stay: "airbnb",
    },
    avg_price_per_night: { hotel_3star: 95, hotel_4star: 145, airbnb_room: 65, airbnb_apt: 110 },
    best_neighborhoods_hotel: ["Shinjuku", "Shibuya", "Asakusa", "Ginza"],
    best_neighborhoods_airbnb: ["Shimokitazawa", "Yanaka", "Koenji", "Kichijoji"],
  },
  {
    slug: "bali",
    city: "Bali",
    country: "Indonesia",
    hero_emoji: "🏝️",
    intro:
      "Bali es el destino donde Airbnb (y villas privadas) genuinamente compite con hoteles boutique por precio y experiencia. Hoteles ganan en servicio, Airbnb gana en valor.",
    hotel_pros: [
      "Resorts en playa con desayuno + spa incluido",
      "Servicio de habitaciones 24h",
      "Personal habla inglés fluido",
    ],
    hotel_cons: [
      "Resorts grandes pueden sentirse impersonales",
      "Precios doblan en julio-agosto y diciembre",
    ],
    airbnb_pros: [
      "Villas con piscina privada por menos que un hotel 4★",
      "Cocina equipada — desayunos sin pagar 25€/persona",
      "Mejor ubicación en Ubud y Canggu",
    ],
    airbnb_cons: [
      "Algunas villas mal mantenidas — leer reseñas",
      "Falta de seguridad 24h en propiedades aisladas",
    ],
    axes: {
      precio: { hotel: 6, airbnb: 9, note: "Villa Airbnb 40% del precio del hotel equivalente" },
      espacio: { hotel: 7, airbnb: 10, note: "Villas con jardín, piscina, varios dormitorios" },
      ubicacion: { hotel: 8, airbnb: 8, note: "Empate" },
      limpieza: { hotel: 8, airbnb: 7, note: "Hotel limpia diario incluido" },
      cancelacion: { hotel: 8, airbnb: 5, note: "Hotel suele flexible" },
      experiencia: { hotel: 7, airbnb: 9, note: "Airbnb conecta con cultura local" },
    },
    recommendation: {
      solo: "hotel",
      pareja: "airbnb",
      familia: "airbnb",
      business: "hotel",
      long_stay: "airbnb",
    },
    avg_price_per_night: { hotel_3star: 35, hotel_4star: 75, airbnb_room: 18, airbnb_apt: 65 },
    best_neighborhoods_hotel: ["Seminyak", "Nusa Dua", "Sanur"],
    best_neighborhoods_airbnb: ["Ubud", "Canggu", "Uluwatu"],
  },
  {
    slug: "lisboa",
    city: "Lisboa",
    country: "Portugal",
    hero_emoji: "🚋",
    intro:
      "En Lisboa la balanza ha cambiado: regulación AL ha encarecido Airbnb y los hoteles boutique han mejorado mucho. Para 1-3 noches, hotel; para 5+, Airbnb si encuentras buen precio.",
    hotel_pros: [
      "Hoteles boutique en Príncipe Real / Chiado son una experiencia",
      "Desayuno con vistas en muchas opciones",
      "Sin lío de check-in remoto",
    ],
    hotel_cons: [
      "Precios picos junio-septiembre",
      "Habitaciones pequeñas en edificios antiguos",
    ],
    airbnb_pros: [
      "Apartamentos con vistas al Tajo a 80€/noche fuera de temporada",
      "Cocina = desayuno en panadería local",
      "Mejor para grupos 4+",
    ],
    airbnb_cons: [
      "Subida de precios desde 2023 por regulación AL",
      "Muchos edificios sin ascensor — Lisboa es colina",
    ],
    axes: {
      precio: { hotel: 6, airbnb: 7, note: "Airbnb sólo gana en estancias 5+" },
      espacio: { hotel: 5, airbnb: 8, note: "Airbnb apartamentos son más amplios" },
      ubicacion: { hotel: 9, airbnb: 8, note: "Hotel zonas centrales premium" },
      limpieza: { hotel: 9, airbnb: 7, note: "Hotel limpia diario" },
      cancelacion: { hotel: 8, airbnb: 5, note: "Hotel flexible" },
      experiencia: { hotel: 8, airbnb: 8, note: "Empate, ambos pueden ser únicos" },
    },
    recommendation: {
      solo: "hotel",
      pareja: "hotel",
      familia: "airbnb",
      business: "hotel",
      long_stay: "airbnb",
    },
    avg_price_per_night: { hotel_3star: 95, hotel_4star: 145, airbnb_room: 60, airbnb_apt: 110 },
    best_neighborhoods_hotel: ["Chiado", "Príncipe Real", "Avenida"],
    best_neighborhoods_airbnb: ["Alfama", "Graça", "Bairro Alto"],
  },
  {
    slug: "paris",
    city: "París",
    country: "Francia",
    hero_emoji: "🗼",
    intro:
      "París tiene una regulación Airbnb agresiva (límite 120 días/año por unidad). Resultado: oferta limitada y precios altos. Para estancias <4 noches, hotel suele ganar.",
    hotel_pros: [
      "Hoteles haussmannianos con encanto",
      "Conserjería en hoteles 4★ resuelve mucho",
      "Limpieza diaria",
    ],
    hotel_cons: [
      "Precios siempre altos, picos brutales",
      "Habitaciones diminutas en hoteles antiguos",
    ],
    airbnb_pros: [
      "Apartamentos en Marais por ~150€/noche",
      "Cocina ahorra mucho en una ciudad cara",
      "Sentir el barrio (panadería al lado)",
    ],
    airbnb_cons: [
      "Regulación 120 días limita oferta",
      "Pisos viejos sin ascensor en 5º",
    ],
    axes: {
      precio: { hotel: 5, airbnb: 6, note: "Empate aproximado" },
      espacio: { hotel: 5, airbnb: 8, note: "Airbnb gana 1-2 categorías" },
      ubicacion: { hotel: 9, airbnb: 8, note: "Hotel mejor cerca de monumentos" },
      limpieza: { hotel: 9, airbnb: 7, note: "Hotel siempre" },
      cancelacion: { hotel: 8, airbnb: 5, note: "Hotel flexible" },
      experiencia: { hotel: 8, airbnb: 9, note: "Airbnb apartamentos haussmannianos = único" },
    },
    recommendation: {
      solo: "hotel",
      pareja: "airbnb",
      familia: "airbnb",
      business: "hotel",
      long_stay: "airbnb",
    },
    avg_price_per_night: { hotel_3star: 145, hotel_4star: 240, airbnb_room: 95, airbnb_apt: 175 },
    best_neighborhoods_hotel: ["Marais", "Saint-Germain", "Châtelet"],
    best_neighborhoods_airbnb: ["Marais", "Belleville", "Canal Saint-Martin"],
  },
  {
    slug: "roma",
    city: "Roma",
    country: "Italia",
    hero_emoji: "🏛️",
    intro:
      "Roma centro histórico es perfecto para hotel boutique 3-4★. Airbnb gana sólo en zonas residenciales (Trastevere, Monti) y para grupos.",
    hotel_pros: [
      "Hoteles dentro del Centro Storico walkable a todo",
      "Aire acondicionado siempre (Roma en julio = horno)",
      "Desayuno italiano incluido",
    ],
    hotel_cons: [
      "Precios picos junio-octubre",
      "Habitaciones pequeñas en palazzi",
    ],
    airbnb_pros: [
      "Trastevere y Monti tienen apartamentos con encanto",
      "Mejor para 4+ personas",
      "Cocina = ahorras en cenas",
    ],
    airbnb_cons: [
      "Algunas zonas turistadas tienen problemas con basura/ruido",
    ],
    axes: {
      precio: { hotel: 6, airbnb: 7, note: "Airbnb gana sólo si grupo 4+" },
      espacio: { hotel: 5, airbnb: 8, note: "Airbnb más espacio" },
      ubicacion: { hotel: 9, airbnb: 7, note: "Hotel = centro storico" },
      limpieza: { hotel: 9, airbnb: 7, note: "Hotel diario" },
      cancelacion: { hotel: 8, airbnb: 5, note: "Hotel flexible" },
      experiencia: { hotel: 8, airbnb: 8, note: "Ambos pueden ser únicos" },
    },
    recommendation: {
      solo: "hotel",
      pareja: "hotel",
      familia: "airbnb",
      business: "hotel",
      long_stay: "airbnb",
    },
    avg_price_per_night: { hotel_3star: 110, hotel_4star: 165, airbnb_room: 70, airbnb_apt: 130 },
    best_neighborhoods_hotel: ["Centro Storico", "Spagna", "Pantheon"],
    best_neighborhoods_airbnb: ["Trastevere", "Monti", "Testaccio"],
  },
  {
    slug: "nueva-york",
    city: "Nueva York",
    country: "Estados Unidos",
    hero_emoji: "🗽",
    intro:
      "Nueva York es el caso más asimétrico: Airbnb está prácticamente prohibido para estancias <30 días desde 2023 (Local Law 18). Para visitas turísticas, hotel es la opción legal.",
    hotel_pros: [
      "Único legal para estancias <30 días desde 2023",
      "Servicio NYC = excelente",
      "Conserjería resuelve restaurantes/shows",
    ],
    hotel_cons: [
      "Caro de inicio, picos brutales",
      "Habitaciones diminutas a precios altos",
      "Resort fees + taxes inflados",
    ],
    airbnb_pros: [
      "Sólo viable para estancias 30+ días (sublet legal)",
      "Apartamentos amplios para nómadas",
    ],
    airbnb_cons: [
      "Local Law 18 = casi todos los listings <30 días son ilegales y arriesgan cancelación",
      "Si reservas <30 días, Airbnb puede cancelar el día antes",
    ],
    axes: {
      precio: { hotel: 4, airbnb: 6, note: "NYC es caro en ambos" },
      espacio: { hotel: 4, airbnb: 8, note: "Airbnb apartments mucho más espacio" },
      ubicacion: { hotel: 9, airbnb: 6, note: "Hotel mejor para Manhattan" },
      limpieza: { hotel: 9, airbnb: 7, note: "Hotel diario" },
      cancelacion: { hotel: 8, airbnb: 3, note: "Airbnb cancela por LL18" },
      experiencia: { hotel: 7, airbnb: 8, note: "Airbnb mejor para nómada" },
    },
    recommendation: {
      solo: "hotel",
      pareja: "hotel",
      familia: "hotel",
      business: "hotel",
      long_stay: "airbnb",
    },
    avg_price_per_night: { hotel_3star: 195, hotel_4star: 320, airbnb_room: 140, airbnb_apt: 280 },
    best_neighborhoods_hotel: ["Midtown", "Times Square", "FiDi"],
    best_neighborhoods_airbnb: ["Brooklyn (Williamsburg)", "Long Island City"],
  },
  {
    slug: "bangkok",
    city: "Bangkok",
    country: "Tailandia",
    hero_emoji: "🛕",
    intro:
      "Bangkok hoteles son tan baratos que Airbnb compite poco en visitas turísticas <7 días. Apartamentos Airbnb ganan sólo para estancias largas o grupos.",
    hotel_pros: [
      "Hoteles 4★ a 60€/noche",
      "Piscina en azotea con vistas al skyline",
      "Servicio thai = excelente",
    ],
    hotel_cons: [
      "Pueden ser turistadas (Khao San, Sukhumvit)",
    ],
    airbnb_pros: [
      "Condos modernos en Sukhumvit con piscina",
      "Cocina ahorra (aunque street food es ya barato)",
      "Lavadora útil para 7+ días",
    ],
    airbnb_cons: [
      "Edificios condo a veces no permiten Airbnb (multas posibles)",
      "Por menos del precio de Airbnb hay hoteles 4★",
    ],
    axes: {
      precio: { hotel: 9, airbnb: 8, note: "Hotel competitivo, Tailandia es ya barata" },
      espacio: { hotel: 7, airbnb: 9, note: "Condos amplios" },
      ubicacion: { hotel: 9, airbnb: 7, note: "Hotel cerca BTS/MRT siempre" },
      limpieza: { hotel: 9, airbnb: 7, note: "Hotel diario" },
      cancelacion: { hotel: 8, airbnb: 5, note: "Hotel flexible" },
      experiencia: { hotel: 7, airbnb: 8, note: "Airbnb más residencial" },
    },
    recommendation: {
      solo: "hotel",
      pareja: "hotel",
      familia: "airbnb",
      business: "hotel",
      long_stay: "airbnb",
    },
    avg_price_per_night: { hotel_3star: 35, hotel_4star: 65, airbnb_room: 22, airbnb_apt: 55 },
    best_neighborhoods_hotel: ["Sukhumvit", "Silom", "Riverside"],
    best_neighborhoods_airbnb: ["Thonglor", "Ari", "Phra Khanong"],
  },
  {
    slug: "estambul",
    city: "Estambul",
    country: "Turquía",
    hero_emoji: "🕌",
    intro:
      "Estambul tiene gran oferta de hoteles boutique en zonas históricas y Airbnb amplio en Beyoğlu y Kadıköy. Casi empate.",
    hotel_pros: [
      "Hoteles boutique en Sultanahmet con vistas al Bósforo",
      "Hammam en muchos hoteles 4★",
    ],
    hotel_cons: [
      "Algunas zonas turísticas masificadas (Sultanahmet)",
    ],
    airbnb_pros: [
      "Beyoğlu y Cihangir con apartamentos auténticos",
      "Kadıköy lado asiático mejor precio",
    ],
    airbnb_cons: [
      "Tráfico Estambul = ubicación mal puede arruinar el viaje",
    ],
    axes: {
      precio: { hotel: 7, airbnb: 8, note: "Airbnb 20% más barato" },
      espacio: { hotel: 6, airbnb: 8, note: "Airbnb más espacio" },
      ubicacion: { hotel: 8, airbnb: 7, note: "Hotel zonas centrales" },
      limpieza: { hotel: 8, airbnb: 7, note: "Hotel diario" },
      cancelacion: { hotel: 8, airbnb: 5, note: "Hotel flexible" },
      experiencia: { hotel: 8, airbnb: 8, note: "Ambos buenos" },
    },
    recommendation: {
      solo: "hotel",
      pareja: "hotel",
      familia: "airbnb",
      business: "hotel",
      long_stay: "airbnb",
    },
    avg_price_per_night: { hotel_3star: 55, hotel_4star: 95, airbnb_room: 35, airbnb_apt: 70 },
    best_neighborhoods_hotel: ["Sultanahmet", "Beyoğlu", "Karaköy"],
    best_neighborhoods_airbnb: ["Cihangir", "Galata", "Kadıköy"],
  },
  {
    slug: "barcelona",
    city: "Barcelona",
    country: "España",
    hero_emoji: "🏖️",
    intro:
      "Barcelona regula Airbnb estrictamente: licencia HUTB obligatoria, oferta limitada. Hoteles tienen mejor relación calidad-precio que en otras grandes EU.",
    hotel_pros: [
      "Hoteles 4★ a precios EU mid",
      "Aire acondicionado siempre",
      "Desayuno mediterráneo",
    ],
    hotel_cons: [
      "Picos brutales agosto y eventos (MWC, Primavera Sound)",
    ],
    airbnb_pros: [
      "Eixample apartamentos modernistas",
      "Mejor para 4+ personas",
      "Cocina ahorra (cenas en BCN no son baratas)",
    ],
    airbnb_cons: [
      "Sin licencia HUTB el host arriesga multa y cancelación",
      "Quejas vecinales activas en Gràcia/Born",
    ],
    axes: {
      precio: { hotel: 7, airbnb: 7, note: "Empate" },
      espacio: { hotel: 5, airbnb: 8, note: "Airbnb más" },
      ubicacion: { hotel: 9, airbnb: 7, note: "Hotel zonas turísticas" },
      limpieza: { hotel: 9, airbnb: 7, note: "Hotel diario" },
      cancelacion: { hotel: 8, airbnb: 5, note: "Hotel flexible" },
      experiencia: { hotel: 8, airbnb: 9, note: "Airbnb modernista = único" },
    },
    recommendation: {
      solo: "hotel",
      pareja: "hotel",
      familia: "airbnb",
      business: "hotel",
      long_stay: "airbnb",
    },
    avg_price_per_night: { hotel_3star: 110, hotel_4star: 165, airbnb_room: 75, airbnb_apt: 130 },
    best_neighborhoods_hotel: ["Eixample", "Gòtic", "Born"],
    best_neighborhoods_airbnb: ["Eixample", "Gràcia", "Poblenou"],
  },
  {
    slug: "berlin",
    city: "Berlín",
    country: "Alemania",
    hero_emoji: "🐻",
    intro:
      "Berlín fue de las primeras grandes EU en regular Airbnb (Zweckentfremdungsgesetz). Resultado: oferta legal limitada. Hoteles boutique en Mitte y Kreuzberg ofrecen buena relación.",
    hotel_pros: [
      "Hoteles boutique con encanto en Mitte / Kreuzberg",
      "Desayuno alemán",
      "Personal habla inglés fluido",
    ],
    hotel_cons: [
      "Algunas zonas (Mitte) turistadas",
    ],
    airbnb_pros: [
      "Apartamentos auténticos en barrios alternativos (Friedrichshain, Neukölln)",
      "Mejor para 4+ personas",
    ],
    airbnb_cons: [
      "Regulación estricta — algunas reservas se cancelan",
      "Edificios viejos sin ascensor",
    ],
    axes: {
      precio: { hotel: 7, airbnb: 8, note: "Airbnb gana en larga estancia" },
      espacio: { hotel: 6, airbnb: 9, note: "Apartamentos berlineses son grandes" },
      ubicacion: { hotel: 9, airbnb: 7, note: "Hotel = centro" },
      limpieza: { hotel: 9, airbnb: 7, note: "Hotel diario" },
      cancelacion: { hotel: 8, airbnb: 5, note: "Hotel flexible" },
      experiencia: { hotel: 7, airbnb: 9, note: "Airbnb auténtico Berlin" },
    },
    recommendation: {
      solo: "hotel",
      pareja: "airbnb",
      familia: "airbnb",
      business: "hotel",
      long_stay: "airbnb",
    },
    avg_price_per_night: { hotel_3star: 95, hotel_4star: 145, airbnb_room: 65, airbnb_apt: 105 },
    best_neighborhoods_hotel: ["Mitte", "Kreuzberg", "Charlottenburg"],
    best_neighborhoods_airbnb: ["Friedrichshain", "Neukölln", "Prenzlauer Berg"],
  },
  {
    slug: "marrakech",
    city: "Marrakech",
    country: "Marruecos",
    hero_emoji: "🌶️",
    intro:
      "Marrakech tiene la categoría única del Riad: Airbnb riads ofrecen experiencia que los hoteles no pueden replicar. Para inmersión, Airbnb (riad). Para resort, hotel.",
    hotel_pros: [
      "Resorts en Hivernage con piscina y spa",
      "Algunos hoteles son palacios convertidos",
      "Ride airport included en muchos",
    ],
    hotel_cons: [
      "Hoteles modernos en zonas alejadas de la medina",
    ],
    airbnb_pros: [
      "Riads tradicionales = la experiencia auténtica de Marrakech",
      "Patio interior, desayuno marroquí",
      "Anfitrión local",
    ],
    airbnb_cons: [
      "Llegar al riad puede ser laberíntico (medina sin coches)",
      "Algunos riads no tienen aire acondicionado",
    ],
    axes: {
      precio: { hotel: 6, airbnb: 9, note: "Airbnb riad muchísimo más barato" },
      espacio: { hotel: 7, airbnb: 8, note: "Riads grandes" },
      ubicacion: { hotel: 6, airbnb: 9, note: "Riads en medina (donde quieres estar)" },
      limpieza: { hotel: 8, airbnb: 7, note: "Hotel diario, riad ok" },
      cancelacion: { hotel: 8, airbnb: 5, note: "Hotel flexible" },
      experiencia: { hotel: 6, airbnb: 10, note: "Riad = experiencia única" },
    },
    recommendation: {
      solo: "airbnb",
      pareja: "airbnb",
      familia: "airbnb",
      business: "hotel",
      long_stay: "airbnb",
    },
    avg_price_per_night: { hotel_3star: 65, hotel_4star: 145, airbnb_room: 35, airbnb_apt: 75 },
    best_neighborhoods_hotel: ["Hivernage", "Gueliz", "Palmeraie"],
    best_neighborhoods_airbnb: ["Medina", "Mellah", "Kasbah"],
  },
  {
    slug: "dubai",
    city: "Dubai",
    country: "Emiratos Árabes",
    hero_emoji: "🏙️",
    intro:
      "Dubai hoteles 5★ tienen oferta sin igual y precios sorprendentemente competitivos en temporada baja. Airbnb sólo gana para grupos largos en torres residenciales.",
    hotel_pros: [
      "Hoteles 5★ con playa privada a precios mid-range fuera de temporada",
      "Servicio Dubai = primer mundo",
      "Desayunos buffet enormes",
    ],
    hotel_cons: [
      "Picos en Año Nuevo y eventos (Expo, F1)",
    ],
    airbnb_pros: [
      "Apartamentos Marina/Downtown con vistas",
      "Mejor para grupos 4+ y estancias 7+",
    ],
    airbnb_cons: [
      "Comunidades torres a veces cobran fees adicionales",
      "No tienes la experiencia 5★ de hotel",
    ],
    axes: {
      precio: { hotel: 7, airbnb: 7, note: "Empate, hotel sorprende" },
      espacio: { hotel: 7, airbnb: 9, note: "Apartments grandes" },
      ubicacion: { hotel: 9, airbnb: 8, note: "Hotel mejor playa" },
      limpieza: { hotel: 10, airbnb: 7, note: "Hotel daily premium" },
      cancelacion: { hotel: 8, airbnb: 5, note: "Hotel flexible" },
      experiencia: { hotel: 9, airbnb: 7, note: "Hotel experiencia Dubai" },
    },
    recommendation: {
      solo: "hotel",
      pareja: "hotel",
      familia: "airbnb",
      business: "hotel",
      long_stay: "airbnb",
    },
    avg_price_per_night: { hotel_3star: 95, hotel_4star: 175, airbnb_room: 75, airbnb_apt: 145 },
    best_neighborhoods_hotel: ["JBR", "Downtown", "Palm Jumeirah"],
    best_neighborhoods_airbnb: ["Marina", "Downtown", "Business Bay"],
  },
];

export function getCityComparison(slug: string): CityComparison | undefined {
  return HOTELS_VS_AIRBNB.find((c) => c.slug === slug);
}
