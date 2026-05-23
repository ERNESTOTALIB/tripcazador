/**
 * glosario_catalog.ts — SSS422 (23 may 2026)
 *
 * Glosario de términos de viaje. Info-only SEO con cross-links a
 * verticales relevantes (/equipaje, /esim, /seguro-viaje, /deals, etc.).
 *
 * High-intent queries: "que es error fare", "que es escala layover",
 * "que es open jaw vuelo", "diferencia layover stopover".
 *
 * Source of truth para /glosario hub + /glosario/[term] landings.
 */

export interface GlosarioEntry {
  slug: string;
  /** Término en español como debería aparecer en title. */
  term: string;
  /** Equivalente inglés cuando aplica. */
  englishEquivalent?: string;
  emoji: string;
  /** Categoría (filtrable en futuro). */
  category: "tarifas" | "rutas" | "operacion" | "documentacion" | "servicios" | "millas";
  /** Definición corta — 1-2 frases — para hero + meta description. */
  shortDef: string;
  /** Definición detallada — 1-3 párrafos. */
  longDef: string;
  /** Ejemplo concreto. */
  example?: string;
  /** Tips para viajeros relacionados con este término. */
  tips?: string[];
  /** Cross-links a otras secciones del sitio. */
  relatedLinks: Array<{ href: string; label: string }>;
  /** Slugs relacionados dentro del propio glosario. */
  relatedTerms?: string[];
}

export const GLOSARIO_CATALOG: GlosarioEntry[] = [
  {
    slug: "error-fare",
    term: "Error fare (tarifa error)",
    englishEquivalent: "Error fare",
    emoji: "🎯",
    category: "tarifas",
    shortDef:
      "Tarifa publicada por error por una aerolínea, normalmente por fallo técnico o de tipo de cambio, que ofrece precios extremadamente bajos.",
    longDef:
      "Un error fare es una tarifa publicada por error por una aerolínea —por confusión de divisa, tipo de cambio mal aplicado, fallo del sistema de revenue management o promoción que se sale de control— que resulta en precios anormalmente bajos (frecuentemente 50-90% por debajo del precio normal). Una vez detectados, las aerolíneas suelen retirar la tarifa en horas, aunque por buena fe a menudo respetan las reservas ya confirmadas. TripCazador detecta error fares en tiempo real y avisa por email/push.",
    example:
      "Madrid–Buenos Aires por 280€ ida y vuelta (precio típico 900€) en agosto 2024 — detectado por TripCazador, ventana ~6 horas antes de cerrarse.",
    tips: [
      "Cuando veas un error fare, reserva primero, planifica después. La ventana suele ser <24h.",
      "No llames a la aerolínea preguntando si es real — es la mejor forma de que la cierren antes.",
      "Las aerolíneas no están obligadas a respetar errores groseros (ej. 50€ Madrid-Tokio) pero suelen cumplir errores razonables (ej. 280€ Madrid-Buenos Aires).",
    ],
    relatedLinks: [
      { href: "/deals", label: "Chollos detectados ahora" },
      { href: "/premium", label: "Alertas Premium tiempo real" },
      { href: "/seguro-viaje", label: "Seguro de viaje (cancelación incluida)" },
    ],
    relatedTerms: ["tarifa-promo", "low-cost"],
  },
  {
    slug: "layover",
    term: "Layover (escala)",
    englishEquivalent: "Layover",
    emoji: "🔄",
    category: "rutas",
    shortDef:
      "Parada técnica en un aeropuerto intermedio entre el origen y el destino final, normalmente de duración corta (1-4 horas).",
    longDef:
      "Un layover es una escala corta —entre 1 y 24 horas— en un aeropuerto intermedio durante un vuelo con varias etapas. El viajero permanece en zona de tránsito sin pasar inmigración (en muchos casos) y vuelve a embarcar para la siguiente etapa. Si la escala supera 24h se convierte en \"stopover\" y suele requerir reserva separada o tarifa especial. Layovers cortas (<90min) son arriesgadas si los aeropuertos son grandes (LHR T3-T5).",
    example:
      "Madrid → Doha (8h vuelo) → Tokio (10h vuelo) con layover de 2h 30min en Doha = vuelo con un layover.",
    tips: [
      "Mínimo recomendado para conexión internacional: 90 min (Schengen-Schengen), 2h (internacional), 3h (cambio aeropuerto).",
      "Si compras dos billetes por separado (no en código compartido), el riesgo de perder conexión es 100% tuyo.",
      "Aerolíneas en mismo billete reprotegen si pierdes conexión por su retraso.",
    ],
    relatedLinks: [
      { href: "/seguro-viaje", label: "Seguro con cobertura pérdida conexión" },
      { href: "/deals", label: "Ver chollos con escalas favorables" },
    ],
    relatedTerms: ["stopover", "open-jaw"],
  },
  {
    slug: "stopover",
    term: "Stopover (escala larga)",
    englishEquivalent: "Stopover",
    emoji: "🌍",
    category: "rutas",
    shortDef:
      "Escala superior a 24 horas en un aeropuerto intermedio, generalmente aprovechada para visitar la ciudad sin coste adicional de billete.",
    longDef:
      "Un stopover es una escala de más de 24 horas (en algunas definiciones, más de 4h en vuelos domésticos) durante un viaje. Muchas aerolíneas la ofrecen como ventaja: Turkish Airlines, Icelandair, Qatar Airways, Emirates y Singapore Airlines tienen programas oficiales de \"free stopover\" donde puedes visitar el hub de la aerolínea sin coste extra. Es la forma más barata de añadir un \"2x1\" de destinos a un único billete.",
    example:
      "Madrid → Estambul (stopover 3 días gratis con Turkish Airlines) → Bangkok. Pagas el mismo precio que un vuelo directo pero visitas Estambul.",
    tips: [
      "Programas oficiales de stopover free: Turkish (Istanbul), Icelandair (Reykjavik), Qatar (Doha), Emirates (Dubai).",
      "Reserva el stopover en la web de la aerolínea, no en agregadores — los agregadores no procesan stopovers gratis.",
      "Aprovecha para visitar destinos lejanos que de otra manera requerirían vuelo aparte.",
    ],
    relatedLinks: [
      { href: "/seguro-viaje", label: "Seguro stopover (multi-país)" },
      { href: "/esim", label: "eSIM para usar en hub de stopover" },
    ],
    relatedTerms: ["layover", "open-jaw"],
  },
  {
    slug: "open-jaw",
    term: "Open jaw (vuelo asimétrico)",
    englishEquivalent: "Open jaw",
    emoji: "↔️",
    category: "rutas",
    shortDef:
      "Vuelo de ida y vuelta donde el aeropuerto de regreso es distinto al de llegada, evitando duplicar el desplazamiento por tierra.",
    longDef:
      "Un vuelo open jaw —literalmente \"mandíbula abierta\"— es un billete redondo donde llegas a una ciudad y vuelves desde otra (o sales de una y vuelves a otra). Frecuente en viajes por carretera, por ejemplo aterrizar en Roma, recorrer Italia, y volar de vuelta desde Milán. Ahorra el tiempo y dinero de volver al aeropuerto original. Puede ser más barato O más caro que un round-trip estándar — siempre comparar.",
    example:
      "Madrid → Roma + Milán → Madrid. Aterrizas en Roma, recorres Italia 10 días, vuelas de vuelta desde Milán.",
    tips: [
      "En Google Flights y Kayak busca con \"Multi-city\" no \"Round trip\".",
      "Open jaw entre ciudades del mismo país suele ser barato (ej. Roma-Milán en Italia).",
      "Open jaw entre países distintos puede activar tarifas internacionales más caras — comparar.",
    ],
    relatedLinks: [
      { href: "/deals", label: "Ver chollos abiertos por destino" },
      { href: "/esim", label: "eSIM con cobertura multi-país" },
    ],
    relatedTerms: ["multidestino", "stopover"],
  },
  {
    slug: "multidestino",
    term: "Multidestino (multi-ciudad)",
    englishEquivalent: "Multi-city",
    emoji: "🗺️",
    category: "rutas",
    shortDef:
      "Itinerario que visita 3 o más ciudades en un único billete combinado, distinto del round-trip estándar.",
    longDef:
      "Un billete multidestino agrupa 3+ vuelos en una única reserva, normalmente con tarifa combinada más eficiente que comprar cada tramo aparte. Cobra fuerza para viajes Asia (Bangkok → Hanoi → Singapur → Bangkok) o Sudamérica (Buenos Aires → Bariloche → Iguazú → Buenos Aires). Las aerolíneas con tarifas especiales son las legacy (Iberia, Air France, KLM); las low-cost rara vez ofrecen multidestino combinado.",
    example:
      "Madrid → Bangkok → Hanoi → Singapur → Madrid en un solo billete. 4 vuelos, una sola reserva, una sola tarifa.",
    tips: [
      "Reservar en la web oficial de aerolínea legacy (Iberia, Air France, KLM) para mejores precios.",
      "Verificar que el cambio de aerolínea entre tramos esté protegido por el mismo PNR.",
      "Multidestino con misma alianza (oneworld/SkyTeam/Star Alliance) facilita reprotección.",
    ],
    relatedLinks: [
      { href: "/seguro-viaje", label: "Seguro multidestino (cobertura amplia)" },
      { href: "/esim", label: "eSIM cobertura multi-país" },
    ],
    relatedTerms: ["open-jaw", "stopover"],
  },
  {
    slug: "red-eye",
    term: "Red-eye (vuelo nocturno)",
    englishEquivalent: "Red-eye flight",
    emoji: "🌙",
    category: "rutas",
    shortDef:
      "Vuelo nocturno que sale tarde y llega muy temprano, generalmente más barato y con menos retrasos por congestión.",
    longDef:
      "Un vuelo red-eye sale entre 21:00-01:00 y llega entre 05:00-08:00, atravesando la noche. Llamado así porque los pasajeros suelen llegar con \"ojos rojos\" de cansancio. Ventajas: 15-30% más baratos, aprovechas un día completo en destino sin perder uno en vuelo, aeropuertos vacíos. Desventajas: dormir mal en clase turista, llegar agotado, transporte limitado a esas horas en destino.",
    example:
      "Madrid 23:30 → Nueva York 02:15 (hora local) con LOT Polish Airlines. Llegas al hotel 5am — duermes 4h y arrancas turismo.",
    tips: [
      "Asiento ventana es clave para apoyar la cabeza y dormir.",
      "Lleva almohada cervical inflable + antifaz + tapones (la diferencia entre dormir y no dormir).",
      "Reserva habitación con \"early check-in\" disponible — sin esto te toca esperar hasta 15:00.",
    ],
    relatedLinks: [
      { href: "/deals", label: "Ver chollos nocturnos detectados" },
      { href: "/equipaje", label: "Tips equipaje vuelo nocturno" },
    ],
    relatedTerms: ["error-fare", "low-cost"],
  },
  {
    slug: "tarifa-promo",
    term: "Tarifa promo (promocional)",
    englishEquivalent: "Promo fare",
    emoji: "🏷️",
    category: "tarifas",
    shortDef:
      "Tarifa especial publicada oficialmente por la aerolínea por tiempo limitado, restricciones de fechas o equipaje y normalmente no reembolsable.",
    longDef:
      "Las tarifas promo son ofertas oficiales (no errores) con descuento real pero con condiciones: fechas concretas, restricción equipaje, no reembolso, no cambios o solo previo pago. Suelen aparecer en \"flash sales\" (Black Friday, ofertas miércoles low-cost) o como respuesta a una guerra de precios con competencia. A diferencia del error fare, las tarifas promo son intencionales y rara vez se retiran.",
    example:
      "Vueling Black Friday: Madrid-Roma 19€ ida y vuelta solo en febrero, sin equipaje facturado, sin cambios.",
    tips: [
      "Suscríbete al newsletter de aerolíneas low-cost — anuncian sales antes que en agregadores.",
      "Compara siempre con equipaje incluido: una tarifa promo 19€ + 35€ facturado = 54€ — no siempre la mejor.",
      "Las tarifas promo Premium TripCazador llegan filtradas a tu email.",
    ],
    relatedLinks: [
      { href: "/premium", label: "Alertas Premium con tarifas promo" },
      { href: "/equipaje", label: "Reglas equipaje por aerolínea" },
    ],
    relatedTerms: ["error-fare", "low-cost", "tarifa-flex"],
  },
  {
    slug: "tarifa-flex",
    term: "Tarifa flex (flexible)",
    englishEquivalent: "Flex / Flexible fare",
    emoji: "🔁",
    category: "tarifas",
    shortDef:
      "Tarifa más cara que permite cambios de fechas o ruta sin penalización, normalmente reembolsable.",
    longDef:
      "Una tarifa flex permite cambios de fecha, hora o ruta sin pagar penalización (a veces con \"fare difference\" si la nueva tarifa es más alta) y suele ser reembolsable parcial o totalmente. Pagas 30-50% más que una tarifa básica a cambio de tranquilidad. Vale la pena si tu agenda es incierta o el viaje es de negocios. Para viajes de placer con fechas fijas, la promo + seguro de viaje suele ser más eficiente.",
    example:
      "Madrid-Roma básico 80€ no cambios; Madrid-Roma Flex 140€ con cambios gratuitos hasta 2h antes del vuelo.",
    tips: [
      "Calcula: ¿el seguro de viaje cancelación (15-30€) ofrece misma flexibilidad? Suele ser más barato que flex.",
      "Flex tiene sentido para viajes negocios con probabilidad real de cambio.",
      "Aerolíneas low-cost (Ryanair, Vueling) tienen \"flex\" pero limitado — leer letra pequeña.",
    ],
    relatedLinks: [
      { href: "/seguro-viaje", label: "Seguro de viaje con cancelación" },
      { href: "/deals", label: "Comparar tarifas básicas vs flex" },
    ],
    relatedTerms: ["tarifa-promo", "seguro-cancelacion"],
  },
  {
    slug: "millas-aereas",
    term: "Millas aéreas (frequent flyer)",
    englishEquivalent: "Frequent flyer miles",
    emoji: "💎",
    category: "millas",
    shortDef:
      "Puntos acumulados por volar con una aerolínea o usar tarjetas asociadas, canjeables por vuelos gratis, upgrades o productos.",
    longDef:
      "Las millas aéreas son la moneda de los programas de fidelización de aerolíneas (Iberia Plus, AAdvantage, Avios, Miles & More). Acumulas por volar, por uso de tarjeta de crédito asociada (cobranded), o por compras en partners. Canjeables por: vuelos gratis (\"award flight\"), upgrades a Business/First, productos en el catálogo, hoteles o coches. El valor por milla varía: 1 milla Avios ≈ 1-2 céntimos; 1 milla Air France ≈ 1,2 céntimos.",
    example:
      "60.000 Avios + 70€ tasas = vuelo Madrid-Nueva York Business en Iberia (valor real >2.000€).",
    tips: [
      "El mayor valor de millas es upgrade a Business/First (3-5 céntimos/milla vs 1-2 céntimos en economy).",
      "Vincula tarjeta de crédito cobranded (Iberia Plus, Avianca LifeMiles) para acumular sin volar.",
      "Las millas caducan — Iberia Plus 36 meses inactividad, Lufthansa M&M 36 meses inactividad.",
    ],
    relatedLinks: [
      { href: "/aerolineas", label: "Aerolíneas con programa de millas" },
      { href: "/premium", label: "TripCazador Premium" },
    ],
    relatedTerms: ["tarifa-flex", "status-match"],
  },
  {
    slug: "asiento-xl",
    term: "Asiento XL (extra espacio)",
    englishEquivalent: "Extra legroom / XL seat",
    emoji: "🪑",
    category: "servicios",
    shortDef:
      "Asiento con más espacio de piernas, normalmente en salida de emergencia o primera fila, con coste extra.",
    longDef:
      "Los asientos XL —también llamados \"extra legroom\", \"economy plus\" o \"comfort\"— ofrecen 5-15cm más de espacio para piernas que los asientos estándar de turista. Suelen estar en filas de salida de emergencia, primera fila tras mampara, o filas designadas Plus. Coste: 15-50€ vuelo corto, 80-200€ vuelo largo. Vale la pena si: mides >1,80m, vuelas más de 6h, o quieres bajar primero del avión.",
    example:
      "Vuelo Madrid-Buenos Aires 12h con Iberia: asiento estándar 0€, asiento XL salida emergencia 120€. La diferencia: 81cm vs 91cm pitch.",
    tips: [
      "Asientos salida de emergencia: prohibidos bebés, menores, embarazadas, viajeros con movilidad reducida — la aerolínea puede reasignar sin compensar.",
      "En vuelos cortos (<3h), normalmente no compensa el coste.",
      "Comprar con bastante antelación es más barato que en el aeropuerto.",
    ],
    relatedLinks: [
      { href: "/equipaje", label: "Equipaje permitido en XL seat" },
      { href: "/aerolineas", label: "Compara servicios por aerolínea" },
    ],
    relatedTerms: ["tarifa-flex", "low-cost"],
  },
  {
    slug: "evisa",
    term: "eVisa (visado electrónico)",
    englishEquivalent: "Electronic visa",
    emoji: "📄",
    category: "documentacion",
    shortDef:
      "Visado tramitado completamente online sin acudir a embajada, válido para entrada en muchos países (EE.UU., Australia, India, Turquía).",
    longDef:
      "Un eVisa es un permiso electrónico de entrada que se obtiene completamente online: rellenas formulario, pagas tasa, recibes confirmación por email. No requiere visita a embajada ni sellado físico del pasaporte. Países con eVisa para españoles: EE.UU. (ESTA, ~21$), Canadá (ETA, ~7$), Australia (eVisitor 651, gratis), India (e-Tourist Visa, ~25$), Turquía (gratis para españoles), Sri Lanka (35$), Egipto (25$). Procesamiento: minutos a 72h.",
    example:
      "Viaje Madrid-Nueva York: necesitas ESTA (21$, válido 2 años, multi-entrada). Solicita online en web oficial 72h antes mínimo.",
    tips: [
      "Solicita SIEMPRE en la web oficial del gobierno (esta.cbp.dhs.gov para EE.UU., no en intermediarios que cobran 5x).",
      "La validez del eVisa no equivale a aprobación garantizada — los oficiales en frontera pueden denegar entrada.",
      "Imprime una copia del eVisa por seguridad — algunas aerolíneas la piden en check-in.",
    ],
    relatedLinks: [
      { href: "/visados", label: "Visados por destino" },
      { href: "/seguro-viaje", label: "Seguro de viaje (a veces obligatorio)" },
    ],
    relatedTerms: ["seguro-cancelacion"],
  },
  {
    slug: "seguro-cancelacion",
    term: "Seguro de cancelación",
    englishEquivalent: "Trip cancellation insurance",
    emoji: "🛡️",
    category: "servicios",
    shortDef:
      "Cobertura que reembolsa el coste del viaje si tienes que cancelar por motivos cubiertos (enfermedad, fallecimiento familiar, despido).",
    longDef:
      "Un seguro de cancelación es una póliza específica que reembolsa el coste de tu viaje si tienes que cancelar antes del inicio por causas justificadas: enfermedad propia o familiar, accidente, fallecimiento, despido laboral, citación judicial. NO cubre: cambio de opinión, miedo a volar, motivos no documentables. Suele costar 4-8% del coste del viaje. Existe \"Cancel for Any Reason\" (CFAR) que cubre cualquier motivo pero cuesta 40-60% más y solo reembolsa 50-75%.",
    example:
      "Viaje Madrid-Tokio 1.500€ + hotel 800€ = 2.300€. Seguro cancelación 90€. Cancelas por enfermedad → reembolso 2.300€.",
    tips: [
      "Contratar el seguro en las 48-72h posteriores a comprar el vuelo (algunos seguros exigen esta ventana).",
      "Guardar facturas médicas/justificantes — sin documentación, no reembolso.",
      "Heymondo, Mondo, AXA tienen pólizas en español con cobertura cancelación incluida.",
    ],
    relatedLinks: [
      { href: "/seguro-viaje", label: "Seguro por destino" },
      { href: "/premium", label: "TripCazador Premium" },
    ],
    relatedTerms: ["tarifa-flex", "evisa"],
  },
  {
    slug: "fast-track",
    term: "Fast track (acceso rápido aeropuerto)",
    englishEquivalent: "Fast track / Priority security",
    emoji: "⚡",
    category: "servicios",
    shortDef:
      "Servicio que permite saltar la cola de seguridad o pasaporte en el aeropuerto, normalmente con coste extra de 5-20€.",
    longDef:
      "Fast track es un acceso priorizado a los controles de seguridad y/o pasaporte (immigration) en aeropuertos. Cuesta 5-20€ y ahorra 20-60 minutos de cola en picos. Se compra en la web del aeropuerto, de la aerolínea, o incluida en tarjetas Priority Pass / Business Class / Gold tier de programas frequent flyer. Indispensable cuando la conexión es ajustada (<90min) o el aeropuerto tiene fama de colas largas (BCN T1, LHR T5, FCO).",
    example:
      "Barcelona T1 sábado mañana julio: cola seguridad normal 45min, Fast Track 5min. Pagas 8€ y no pierdes el vuelo.",
    tips: [
      "Mira si tu tarjeta de crédito Visa/Amex Platino la incluye gratis.",
      "Algunos aeropuertos venden Fast Track combinado (seguridad + inmigración).",
      "En aeropuertos pequeños rara vez vale la pena — la cola normal ya es corta.",
    ],
    relatedLinks: [
      { href: "/aeropuertos", label: "Aeropuertos con Fast Track" },
      { href: "/lounge", label: "Salas VIP con Fast Track incluido" },
    ],
    relatedTerms: ["asiento-xl", "lounge"],
  },
  {
    slug: "lounge",
    term: "Lounge (sala VIP aeropuerto)",
    englishEquivalent: "Airport lounge",
    emoji: "🛋️",
    category: "servicios",
    shortDef:
      "Sala privada en el aeropuerto con asientos cómodos, comida, bebida y wifi, accesible con tarjeta Priority Pass, tarjeta business o pago directo.",
    longDef:
      "Un lounge aeroportuario es una sala privada con asientos cómodos, comida y bebida ilimitada, wifi rápido, duchas (en muchos) y zona de trabajo. Accesible por: 1) tarjeta Business/First del vuelo, 2) Priority Pass (~300€/año, 1.500+ lounges), 3) tier Gold/Platinum frequent flyer, 4) pago directo (~30-50€ por uso). Vale la pena si vuelas 4+ veces/año o tienes una escala larga (>3h). Comer en lounge ahorra 15-30€ vs restaurante aeropuerto.",
    example:
      "Conexión Barcelona-Doha-Bangkok con escala 4h Doha: acceso lounge Qatar Premium = ducha, comida, dormir 2h = llegada a Bangkok descansado en lugar de zombi.",
    tips: [
      "Priority Pass se rentabiliza con 6+ visitas anuales (~50€/visita pago directo).",
      "Verifica los lounges incluidos antes de comprar — algunos lounges \"contractual\" no entran.",
      "American Express Platinum incluye Centurion + Priority Pass por su tarifa anual.",
    ],
    relatedLinks: [
      { href: "/aeropuertos", label: "Aeropuertos con lounges destacados" },
      { href: "/premium", label: "TripCazador Premium" },
    ],
    relatedTerms: ["fast-track", "millas-aereas"],
  },
  {
    slug: "low-cost",
    term: "Low-cost (aerolínea de bajo coste)",
    englishEquivalent: "Low-cost carrier (LCC)",
    emoji: "💸",
    category: "operacion",
    shortDef:
      "Aerolínea con modelo de tarifa básica baja y servicios extra de pago (equipaje, asiento, comida), maximizando ocupación con flota homogénea.",
    longDef:
      "Una aerolínea low-cost (LCC) opera con modelo de ingresos \"unbundled\": tarifa básica muy baja (a veces 9-19€) y todo lo demás se cobra aparte (equipaje facturado 25-60€, asiento elegido 4-25€, comida a bordo 5-12€, prioridad de embarque 6-15€). Las grandes en Europa: Ryanair (IATA FR), easyJet (U2), Vueling (VY), Wizz Air (W6), Norwegian (DY). Suelen volar a aeropuertos secundarios para reducir costes de slot. Excelentes para viajes cortos con poco equipaje; complicadas para familias o equipaje grande.",
    example:
      "Madrid-Roma Ryanair tarifa básica 14€ + 35€ equipaje + 10€ asiento + 8€ embarque prioritario = 67€ real. Comparar siempre con tarifa total.",
    tips: [
      "Si llevas poco equipaje (solo bolso pequeño) Ryanair/Vueling suelen ser imbatibles.",
      "Si llevas maleta facturada >10kg, comparar SIEMPRE con Iberia/Vueling tarifa básica + equipaje incluido.",
      "Los aeropuertos secundarios (Gerona, Castellón, Reus) requieren más tiempo de desplazamiento — calcular ROI.",
    ],
    relatedLinks: [
      { href: "/aerolineas", label: "Comparar aerolíneas" },
      { href: "/equipaje", label: "Reglas equipaje por aerolínea" },
    ],
    relatedTerms: ["error-fare", "tarifa-promo"],
  },
];

export const GLOSARIO_BY_SLUG: Record<string, GlosarioEntry> = Object.fromEntries(
  GLOSARIO_CATALOG.map((e) => [e.slug, e]),
);

export const GLOSARIO_SLUGS = GLOSARIO_CATALOG.map((e) => e.slug);

export function getGlosario(slug: string): GlosarioEntry | null {
  return GLOSARIO_BY_SLUG[slug] ?? null;
}

export const GLOSARIO_CATEGORIES = Array.from(
  new Set(GLOSARIO_CATALOG.map((e) => e.category)),
);
