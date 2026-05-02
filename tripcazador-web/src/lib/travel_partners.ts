/**
 * travel_partners.ts — fase lll LLL1 (May 2026)
 *
 * Catálogo central de partners afiliados de viaje. Cada uno con:
 *   - Slug URL-safe para `/como-viajar/[slug]`.
 *   - Categoría (booking, payments, transport, esim, insurance).
 *   - URL afiliada con fallback utm si env ref no está configurada.
 *   - Descripción corta + uso (cómo usarlo paso a paso).
 *   - Tips/quirks que el viajero debería saber.
 */

export interface TravelPartner {
  slug: string;
  name: string;
  category: "vuelos" | "hoteles" | "tours" | "transporte" | "alquiler" | "pagos" | "esim" | "seguro";
  emoji: string;
  shortDescription: string;
  longDescription: string;
  useCase: string[];
  tips: string[];
  pros: string[];
  cons: string[];
  affiliateUrl: () => string;
  ctaLabel: string;
  commissionNote?: string;
}

const env = (k: string) => (process.env[k] || "").trim();
const tpMarker = env("NEXT_PUBLIC_BOOKING_AID") || "714734";

export const PARTNERS: TravelPartner[] = [
  {
    slug: "booking",
    name: "Booking.com",
    category: "hoteles",
    emoji: "🏨",
    shortDescription: "Reserva de hoteles con cancelación gratis. La mayor selección global.",
    longDescription:
      "Booking.com es el agregador de hoteles más grande del mundo. Ventaja clave: la mayoría de hoteles permiten cancelación gratis hasta 24-48h antes, lo que te deja reservar pronto y luego ir comparando.",
    useCase: [
      "Reserva nada más cerrar el vuelo (precios suelen subir cerca de la fecha)",
      "Filtra siempre por 'cancelación gratis' — luego puedes optimizar más tarde",
      "Genius Level 2 (5 estancias) desbloquea -10% extra automático",
    ],
    tips: [
      "El precio en la app móvil suele ser 2-5% menor que web",
      "El programa de fidelidad acumula noches automáticamente",
      "Filtra por 'desayuno incluido' si vas a quedarte 3+ noches",
    ],
    pros: [
      "Mayor selección (28M+ alojamientos)",
      "Cancelación gratis en la mayoría",
      "Pago en el hotel (no inmovilizas dinero)",
    ],
    cons: [
      "Puede haber precios más bajos en la web del hotel directamente",
      "Las fotos a veces optimistas — verifica reseñas",
    ],
    affiliateUrl: () => `https://www.booking.com/?aid=${tpMarker}&utm_source=tripcazador`,
    ctaLabel: "Buscar hotel en Booking",
    commissionNote: "Travelpayouts marker activo",
  },
  {
    slug: "getyourguide",
    name: "GetYourGuide",
    category: "tours",
    emoji: "🎫",
    shortDescription: "Tours, actividades y entradas sin colas en cualquier ciudad del mundo.",
    longDescription:
      "Plataforma líder de tours guiados, excursiones de día y entradas. Reserva con cancelación gratis hasta 24h antes en la mayoría. Mejor catálogo en Europa + Asia, con guías locales verificados.",
    useCase: [
      "Reserva el día anterior — los free walking tours suelen llenarse",
      "Filtra por 'instant confirmation' para evitar esperas de email",
      "Compara precios con Viator (TripAdvisor) — a veces 5-10% más barato",
    ],
    tips: [
      "Las reviews verificadas (con foto) son más fiables que las texto-only",
      "Tours en grupo pequeño (<15 pers) = mejor experiencia que los grandes",
      "Apps de city pass (Go City, iVenture) suelen incluir tours GYG con descuento",
    ],
    pros: [
      "Cancelación gratis flexible",
      "Catálogo enorme (60k+ actividades)",
      "App con tickets QR offline",
    ],
    cons: [
      "Mark-up sobre precios de operador local en pueblos pequeños",
      "Algunos tours son 'soft' — research si quieres autenticidad",
    ],
    affiliateUrl: () => {
      const partnerId = env("NEXT_PUBLIC_GYG_PARTNER_ID");
      const base = "https://www.getyourguide.com/";
      const params = `?cmp=tripcazador&utm_source=tripcazador${partnerId ? `&partner_id=${partnerId}` : ""}`;
      return `${base}${params}`;
    },
    ctaLabel: "Ver tours en GetYourGuide",
    commissionNote: "Cuando user setee NEXT_PUBLIC_GYG_PARTNER_ID en Vercel",
  },
  {
    slug: "discovercars",
    name: "DiscoverCars",
    category: "alquiler",
    emoji: "🚗",
    shortDescription: "Alquiler de coche con la mejor cobertura mundial. Compara 600+ proveedores.",
    longDescription:
      "DiscoverCars es el meta-buscador #1 para alquiler de coches. Ventaja: incluye cobertura premium gratis (Full Insurance) que las webs propias de Hertz/Avis cobran €15-25/día. Compara también local vendors que tienen 30-50% más barato que las marcas grandes.",
    useCase: [
      "Reserva con 4-6 semanas de antelación para mejor precio",
      "Activa siempre 'Full Insurance' — cubre el deducible hasta €5000",
      "Verifica oficina de recogida — el aeropuerto suele tener fee extra",
    ],
    tips: [
      "Toma video 360° del coche al recoger (cubre disputas de daños)",
      "Combustible: 'Full to Full' siempre, NUNCA 'Full to Empty'",
      "Tarjeta crédito (no débito) suele ser obligatoria para depósito",
    ],
    pros: [
      "Comparador transparente con costos finales",
      "Insurance opcional cubre todo (€7-12/día)",
      "Cancelación gratis hasta 48h antes",
    ],
    cons: [
      "Local vendors a veces sin atención al cliente local",
      "Verifica reseñas del proveedor específico antes de reservar",
    ],
    affiliateUrl: () => {
      const ref = env("NEXT_PUBLIC_DISCOVERCARS_REF");
      const base = "https://www.discovercars.com/";
      return `${base}?utm_source=tripcazador${ref ? `&a_aid=${ref}` : ""}`;
    },
    ctaLabel: "Comparar alquiler de coche",
    commissionNote: "4-8% comisión",
  },
  {
    slug: "trainline",
    name: "Trainline",
    category: "transporte",
    emoji: "🚆",
    shortDescription: "Trenes EU + UK. La mejor app para combinar operadores europeos.",
    longDescription:
      "Trainline agrega 270+ operadores ferroviarios europeos. Ventaja vs Renfe/SNCF/DB directo: precio combinado en una sola compra y cambios sin penalización en muchas tarifas. Especialmente útil para itinerarios multi-país (París → Bruselas → Ámsterdam).",
    useCase: [
      "Compra con 90 días de antelación para tarifas Sparpreis (DE) / Prem (FR)",
      "Filtra por 'flexible fare' si tu plan no es 100% cerrado",
      "Para España solo, Renfe directo a veces es 5% más barato",
    ],
    tips: [
      "Eurail/Interrail solo merece la pena si haces 5+ viajes",
      "Trenes de noche (€60-120) ahorran hotel del primer día",
      "Asiento ventana en TGV: pares (12, 14) lado izquierdo viendo la cabina",
    ],
    pros: [
      "App con eTickets + cambios desde móvil",
      "270+ operadores en una sola app",
      "Notificaciones de cambio de andén",
    ],
    cons: [
      "Recargo 1-3% sobre precio del operador local",
      "App principalmente UK-focused, otros idiomas a veces flojos",
    ],
    affiliateUrl: () => {
      const ref = env("NEXT_PUBLIC_TRAINLINE_REF");
      const base = "https://www.trainline.com/";
      return `${base}?utm_source=tripcazador${ref ? `&affiliate=${ref}` : ""}`;
    },
    ctaLabel: "Buscar trenes en Trainline",
    commissionNote: "4-6% comisión",
  },
  {
    slug: "omio",
    name: "Omio",
    category: "transporte",
    emoji: "🚌",
    shortDescription: "Trenes, buses y vuelos cortos en Europa. Muy fuerte en buses (FlixBus).",
    longDescription:
      "Omio (antes GoEuro) compara trenes + buses + vuelos cortos en Europa. Su mayor ventaja es el catálogo de buses (FlixBus, BlaBlaCar bus, Eurolines, Alsa) que muchos comparadores no integran. Para distancias <1500 km en EU, suele ser más barato + sin equipaje extra.",
    useCase: [
      "Compara siempre tren vs bus — el bus puede ser 60-70% más barato",
      "Para distancias <600 km, bus nocturno = ahorro hotel",
      "Filtra por 'Direct only' si no quieres trasbordos",
    ],
    tips: [
      "FlixBus tiene WiFi + enchufe en la mayoría de rutas EU",
      "Buses nocturnos: silla mediados (no eje rueda) duermes mejor",
      "Equipaje en bus suele ser 1 maleta cabina + 1 bodega gratis (vs €50 low-cost)",
    ],
    pros: [
      "Catálogo bus + tren combinado",
      "Algoritmo sugiere combinaciones inteligentes",
      "App con boletos QR offline",
    ],
    cons: [
      "Trenes premium (alta velocidad) suelen ser 2-5% más caros que web del operador",
      "Customer support relativamente lento",
    ],
    affiliateUrl: () => {
      const ref = env("NEXT_PUBLIC_OMIO_REF");
      const base = "https://www.omio.com/";
      return `${base}?utm_source=tripcazador${ref ? `&aid=${ref}` : ""}`;
    },
    ctaLabel: "Buscar transporte en Omio",
    commissionNote: "6-12% comisión",
  },
  {
    slug: "revolut",
    name: "Revolut",
    category: "pagos",
    emoji: "💳",
    shortDescription: "Tarjeta sin comisiones de cambio + cuenta multi-divisa para viajes.",
    longDescription:
      "Revolut te da una tarjeta virtual + física que cambia divisas al tipo interbancario sin comisión (hasta €1000/mes en plan free). Imprescindible para viajeros internacionales: ahorras 2-4% que tu banco te cobraría en cada compra fuera de la Eurozona.",
    useCase: [
      "Compra €100 en USD/JPY/etc → reservas el cambio antes del viaje",
      "Sacar efectivo de cajero sin comisión hasta €200/mes (plan free)",
      "Apple/Google Pay en países donde tu banco no funciona",
    ],
    tips: [
      "Vincula a Apple Pay para pagar sin sacar la tarjeta",
      "Las tarjetas virtuales de un solo uso son perfectas para webs sospechosas",
      "El plan Premium (€7.99/mes) merece pena si gastas €1000+ en cambio mensual",
    ],
    pros: [
      "Tipo de cambio interbancario (mejor que el de tu banco)",
      "Multi-divisa: tienes saldos separados EUR/USD/GBP",
      "Activación instantánea + tarjeta virtual antes de la física",
    ],
    cons: [
      "Soporte solo por chat (no teléfono en plan free)",
      "Algunos países bloquean cuentas Revolut por compliance",
    ],
    affiliateUrl: () => {
      const ref = env("NEXT_PUBLIC_REVOLUT_REF") || "ernestv";
      return `https://www.revolut.com/referral/${ref}`;
    },
    ctaLabel: "Abrir cuenta Revolut gratis",
    commissionNote: "$30-50 por signup activado",
  },
  {
    slug: "holafly",
    name: "Holafly",
    category: "esim",
    emoji: "📱",
    shortDescription: "eSIM con datos ilimitados. Sin SIM física, activación QR instantánea.",
    longDescription:
      "Holafly te da una eSIM (SIM virtual) con datos ilimitados desde €5/día. La activas escaneando un QR antes de salir de casa, y cuando aterrices ya tienes internet sin tener que comprar SIM local ni pagar roaming. Funciona en 200+ países.",
    useCase: [
      "Compra el plan días-de-viaje (no semanas) — pagas solo lo que usas",
      "Conecta tu portátil al hotspot de la eSIM (más rápido que WiFi de hotel)",
      "Plan multi-país (Europa, Asia, Latam) si haces varios destinos",
    ],
    tips: [
      "Verifica que tu móvil soporta eSIM (iPhone XS+, Samsung S20+)",
      "Activa en casa con WiFi, NO en aeropuerto (puede haber problemas)",
      "Mantén tu SIM original activa para SMS de tu banco",
    ],
    pros: [
      "Activación instantánea con QR",
      "Datos ilimitados en la mayoría de planes",
      "Sin contrato ni cargos sorpresa",
    ],
    cons: [
      "Algunas no incluyen llamadas (solo data + apps mensajería)",
      "Más caro que SIM local en países baratos (Tailandia, Vietnam)",
    ],
    affiliateUrl: () => {
      const ref = env("NEXT_PUBLIC_HOLAFLY_REF");
      const base = "https://esim.holafly.com/";
      return `${base}?utm_source=tripcazador${ref ? `&ref=${ref}` : ""}`;
    },
    ctaLabel: "Ver planes eSIM Holafly",
    commissionNote: "5-7% comisión",
  },
  {
    slug: "heymondo",
    name: "Heymondo",
    category: "seguro",
    emoji: "🛡️",
    shortDescription: "Seguro de viaje con cobertura médica €5M y cancelación incluidas.",
    longDescription:
      "Heymondo es uno de los mejores seguros de viaje en español. Cobertura desde €1.5/día con asistencia médica 24h, cancelación por causa justificada (incluye COVID), equipaje perdido y repatriación. Especialmente fuerte para viajes a EE.UU., Asia y África donde un accidente médico te cuesta €30k+.",
    useCase: [
      "Para viajes fuera UE: imprescindible (visa requirement en muchos países)",
      "Para viajes UE: tarjeta sanitaria europea cubre lo básico, este cubre privado",
      "Para nómadas digitales: plan anual €350-500 cubre 60 días/viaje",
    ],
    tips: [
      "Compra ANTES del vuelo (no en aeropuerto — más caro)",
      "Conserva siempre fotos de DNI + tarjeta sanitaria UE en email",
      "Si gestionas la baja por enfermedad: avisa Heymondo en 24h",
    ],
    pros: [
      "Hasta €5M en gastos médicos",
      "App con asistencia 24h en español",
      "Cancelación incluida (causas justificadas + COVID)",
    ],
    cons: [
      "Deportes extremos requieren upgrade (€30-60 extra)",
      "Pre-existentes a veces no cubiertas — leer letra pequeña",
    ],
    affiliateUrl: () => {
      const ref = env("NEXT_PUBLIC_HEYMONDO_REF");
      const base = "https://heymondo.com/";
      return `${base}?utm_source=tripcazador${ref ? `&affiliate_id=${ref}` : ""}`;
    },
    ctaLabel: "Cotizar seguro Heymondo",
    commissionNote: "$25-60 por venta",
  },
];

export const PARTNERS_BY_SLUG = Object.fromEntries(PARTNERS.map((p) => [p.slug, p]));

export function getPartner(slug: string): TravelPartner | undefined {
  return PARTNERS_BY_SLUG[slug];
}

export function getPartnersByCategory(cat: TravelPartner["category"]): TravelPartner[] {
  return PARTNERS.filter((p) => p.category === cat);
}
