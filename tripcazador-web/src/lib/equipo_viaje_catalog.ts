/**
 * equipo_viaje_catalog.ts — SUPER-SPONSORS (25 may 2026)
 *
 * Catalog de 12 productos travel gear con landings programmatic.
 * Amazon Associates ready — los ASINs son del marketplace ES.
 *
 * Filosofía content: NO listamos modelos específicos premium ni
 * "el mejor de X". Listamos categoría, criterios técnicos, picks
 * por presupuesto. Esto evita el problema de "review desactualizado"
 * y le quita la presión a Amazon de cambiar ASINs constantemente.
 *
 * Cada landing genera ingresos vía:
 *  - Amazon Associates link (NEXT_PUBLIC_AMAZON_TAG)
 *  - Cross-link a /comprar-online concierge si pide ayuda
 *  - Cross-link a verticals relacionados (/equipaje, /jet-lag etc.)
 */

export interface EquipoViajeProduct {
  slug: string;
  /** Nombre legible categoria (no marca específica) */
  name: string;
  emoji: string;
  /** SEO title específico mes-año proof */
  seoTitle: string;
  seoDescription: string;
  /** Búsqueda Amazon — usamos search no ASIN para evitar deads links */
  amazonQuery: string;
  /** Criterios técnicos clave a evaluar */
  criterios: string[];
  /** Tres tiers presupuesto (€) */
  picks: {
    presupuesto: { label: string; rangeEur: string; example: string };
    medio: { label: string; rangeEur: string; example: string };
    premium: { label: string; rangeEur: string; example: string };
  };
  /** 3-5 puntos clave guía compra */
  guia: string[];
  /** 3 FAQ específicas categoría */
  faqs: Array<{ q: string; a: string }>;
  /** Slug de vertical relacionada para cross-link */
  related?: string[];
  lastUpdated: string;
}

export const EQUIPO_VIAJE: EquipoViajeProduct[] = [
  {
    slug: "mochilas-viaje",
    name: "Mochilas de viaje",
    emoji: "🎒",
    seoTitle: "Mejores mochilas viaje 2026: cabina, peso, presupuesto",
    seoDescription: "Cómo elegir mochila de viaje: capacidad, medidas cabina, peso vacío, apertura. Picks 30-80 €, 80-180 €, premium 180+ €.",
    amazonQuery: "mochila viaje 40L cabina",
    criterios: [
      "Capacidad: 25-30L vuelo corto, 35-45L 1-2 semanas, 50-65L mochilero",
      "Medidas cabina: 55×40×20cm máx para Ryanair/Vueling sin tarifa",
      "Peso vacío: <1.2kg para no quemar peso disponible",
      "Apertura: tipo maleta (clamshell) mejor que tipo trekking",
      "Bolsillo laptop dedicado 15.6\" mínimo",
      "Compresión lateral + asas para hand-carry secundario",
    ],
    picks: {
      presupuesto: { label: "Presupuesto", rangeEur: "30-80 €", example: "AmazonBasics, Mountaintop 40L" },
      medio: { label: "Medio", rangeEur: "80-180 €", example: "Osprey Farpoint 40, Cabin Zero Classic 36L" },
      premium: { label: "Premium", rangeEur: "180-350 €", example: "Aer Travel Pack 3, Peak Design Travel 45L" },
    },
    guia: [
      "Mide en casa antes de comprar — coge una caja de cartón 55×40×20 cm y comprueba que tu mochila full pasa.",
      "Pesa la mochila vacía en báscula. Cada 100 g vacío son 100 g menos de ropa.",
      "Apertura clamshell (estilo maleta) ahorra 30 min al día buscando cosas.",
      "Si vuelas Ryanair priority Plus, puedes meter una mochila 55×40×20 + bolso personal 40×20×25 — total 65L estimados.",
    ],
    faqs: [
      {
        q: "¿Cabe una mochila 40L como equipaje de cabina Ryanair?",
        a: "Sí si las medidas son ≤55×40×20 cm. Muchas mochilas 'cabin 40L' pasan PRIORITY pero NO sin priority (donde la medida es 40×20×25 cm bolso pequeño). Verifica medidas exactas + tu tarifa.",
      },
      {
        q: "¿Mochila vs maleta de cabina rígida?",
        a: "Mochila gana en flexibilidad (escaleras, cobblestones, espacio sobrante para souvenirs). Maleta gana si no quieres cargar peso en espalda o vas a hotel + uber. Para Interrail/mochileo Asia → mochila. Para weekend exec → maleta.",
      },
      {
        q: "¿Merece la pena pagar 250 € por una mochila travel pack?",
        a: "Si viajas 5+ veces al año o eres digital nomad, sí — duran 5+ años y la diferencia en organización + comodidad es real. Si viajas 1-2 vacaciones al año, una de 80 € te sirve igual.",
      },
    ],
    related: ["equipaje", "preparar-viaje"],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "adaptadores-viaje",
    name: "Adaptadores enchufe internacional",
    emoji: "🔌",
    seoTitle: "Adaptador enchufe viaje universal: USB-C, 220V, qué comprar",
    seoDescription: "Adaptador enchufe universal con USB-C, USB-A y compatibilidad UK/US/EU/AU. Picks 15-60 €. Diferencia entre adaptador y convertidor de voltaje.",
    amazonQuery: "adaptador enchufe universal USB-C viaje",
    criterios: [
      "Universal 4-en-1: UK + US + EU + AU mínimo",
      "Mínimo 2 USB-A + 1 USB-C PD (Power Delivery)",
      "Potencia USB-C ≥18W para cargar iPhone fast charge",
      "Fusible reemplazable para evitar fritura en short-circuit",
      "Marca con CE/RoHS (no clones AliExpress dudosos)",
      "OJO: adaptador ≠ convertidor de voltaje. Solo cambia forma del enchufe.",
    ],
    picks: {
      presupuesto: { label: "Presupuesto", rangeEur: "15-25 €", example: "JOLLYFIT, EPICKA universal" },
      medio: { label: "Medio", rangeEur: "25-60 €", example: "Anker 312 PD travel adapter" },
      premium: { label: "Premium", rangeEur: "60-120 €", example: "Zendure Passport Pro USB-C 100W" },
    },
    guia: [
      "Si vuelas a USA + Japón + Reino Unido en mismo viaje → adaptador universal. Si solo Europa → no necesitas nada (España, Francia, Alemania misma enchufe).",
      "Comprueba si tus aparatos aceptan 100-240V. iPhone/iPad/laptop sí. Secador de pelo NO (110V US ≠ 220V EU = quemado).",
      "Para secadores/planchas en USA/Japón: alquila uno en el hotel o compra local barato (10 $).",
      "Power Delivery (PD) USB-C carga iPhone 50% en 30 min. Sin PD tarda 2h+.",
    ],
    faqs: [
      {
        q: "¿Mi cargador europeo funciona en USA?",
        a: "Físicamente no (enchufe diferente). Eléctricamente sí si dice '100-240V' (todos los cargadores modernos). Necesitas SOLO adaptador, no convertidor.",
      },
      {
        q: "¿Funciona un adaptador europeo en Japón?",
        a: "Sí, pero Japón usa 100V (Europa 230V). Aparatos modernos (laptop, móvil) auto-detectan. Aparatos calefactores (secador) NO funcionan bien (lentos).",
      },
      {
        q: "¿Adaptador 1 vs adaptador con USB?",
        a: "Con USB ahorra cargadores (no necesitas el del iPhone aparte). Vale 10-15 € más pero te quita 2 cables del equipaje y libera enchufes en hotel.",
      },
    ],
    related: ["preparar-viaje"],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "organizadores-equipaje",
    name: "Organizadores de equipaje (packing cubes)",
    emoji: "🧳",
    seoTitle: "Packing cubes 2026: cubos organizadores maleta — sí o no",
    seoDescription: "Packing cubes/cubos organizadores: ventajas reales, mejor material (nylon vs poliéster), tamaños, cuántos comprar.",
    amazonQuery: "cubos organizadores maleta packing cubes",
    criterios: [
      "Nylon ripstop > poliéster — más resistente al desgaste y se rompe menos en cremallera",
      "Doble cremallera para reducir presión en una sola línea",
      "Mesh panel (ventanilla) ayuda identificar contenido + airflow",
      "Compression cubes (con cremallera doble) para ropa abultada",
      "Set mixto 4-6 piezas tamaños diversos > 6 iguales",
    ],
    picks: {
      presupuesto: { label: "Presupuesto", rangeEur: "15-30 €", example: "AmazonBasics, BAGSMART set 6" },
      medio: { label: "Medio", rangeEur: "30-70 €", example: "Eagle Creek Pack-It Original, Bagail set" },
      premium: { label: "Premium", rangeEur: "70-150 €", example: "Peak Design Packing Cubes" },
    },
    guia: [
      "1 cubo por outfit-día > 1 cubo por categoría — saca cubo entero al hotel.",
      "Cubo compression para ropa interior + calcetines → libera 30% volumen.",
      "Cubo dedicado 'sucio' → ropa usada sin mezclarse con limpia.",
      "Mesh permite ver contenido sin abrir — evita olvidos.",
    ],
    faqs: [
      {
        q: "¿Realmente caben más cosas con packing cubes?",
        a: "Compression cubes sí (10-20% más). Cubos normales no — pero te ahorran 15 min de buscar cada día. El valor real es organización, no volumen.",
      },
      {
        q: "¿Cuántos cubos necesito para un viaje de 7 días?",
        a: "3-4 medianos: 1 tops, 1 bottoms+ropa interior, 1 misc (toiletries, cables), 1 sucio (vacío al ir).",
      },
      {
        q: "¿Vale la pena pagar 60 € vs 20 €?",
        a: "Para uso 1-2 viajes/año, no. Para >5 viajes/año la diferencia en durabilidad sí merece — los baratos se rompen en cremallera al 2º año.",
      },
    ],
    related: ["preparar-viaje", "equipaje"],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "almohadas-cuello",
    name: "Almohadas de cuello",
    emoji: "💤",
    seoTitle: "Mejor almohada cuello avión 2026: memory foam, hinchable, scarf",
    seoDescription: "Almohada cuello avión: memory foam vs hinchable vs scarf wrap. Cuál duerme mejor en vuelos largos. Picks 15-90 €.",
    amazonQuery: "almohada cuello viaje avion memory foam",
    criterios: [
      "Memory foam: mejor soporte, peor volumen empaquetado",
      "Hinchable: cabe en bolsillo, soporte débil",
      "Scarf/wrap: estética 'no llevo almohada' + soporte decent",
      "Funda lavable es esencial (vuelos = saliva, sudor)",
      "Anchura 7-12 cm — más estrecho = no aguanta cabeza, más ancho = molesta",
    ],
    picks: {
      presupuesto: { label: "Presupuesto", rangeEur: "15-25 €", example: "BCOZZY contoured, hinchables" },
      medio: { label: "Medio", rangeEur: "25-60 €", example: "Cabeau Evolution, Trtl pillow" },
      premium: { label: "Premium", rangeEur: "60-130 €", example: "Ostrichpillow Go, Aeris" },
    },
    guia: [
      "Si duermes con cabeza caída hacia adelante → Cabeau o BCOZZY (soporte frontal).",
      "Si caes lateralmente → Trtl (estructura interna sujeta lateral).",
      "Para business class flat-bed no necesitas — usa la del avión.",
      "Hinchable solo si peso/volumen es crítico (mochileo).",
    ],
    faqs: [
      {
        q: "¿Hinchable o memory foam para vuelo de 10h?",
        a: "Memory foam. Hinchables se desinflan ligeramente durante la noche y duermes peor. Diferencia real en vuelos >6h.",
      },
      {
        q: "¿Cuánto cuesta una almohada cuello decente?",
        a: "25-45 € es el sweet spot. <20 € no aguanta cabeza adulta. >70 € paga marca, no mejora soporte vs gama media.",
      },
      {
        q: "¿Puedo lavar en lavadora?",
        a: "Funda sí (extraíble en buenas marcas). Memory foam interno NO — solo paño húmedo. Por eso funda extraíble es non-negotiable.",
      },
    ],
    related: ["jet-lag"],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "candados-tsa",
    name: "Candados TSA aprobados",
    emoji: "🔒",
    seoTitle: "Candados TSA 2026: cuáles son y cuándo necesitas uno",
    seoDescription: "Candados TSA-aprobados: qué son, cuándo necesitas uno (USA, Canadá), cómo elegir entre combinación 3 vs 4 dígitos. Picks 8-30 €.",
    amazonQuery: "candado TSA combinación maleta",
    criterios: [
      "TSA-approved: tienen llave maestra para personal aduanas USA/Canadá",
      "Combinación 4 dígitos > 3 (10× más combinaciones)",
      "Cable flexible mejor que arco rígido para varias cremalleras",
      "Indicador rojo cuando TSA lo abrió — sabes si lo revisaron",
      "Marca con sello TSA reconocible (TSA002, TSA007, TSA008)",
    ],
    picks: {
      presupuesto: { label: "Presupuesto", rangeEur: "8-15 €", example: "Master Lock 4683 set 3, Safe Skies" },
      medio: { label: "Medio", rangeEur: "15-25 €", example: "Master Lock 4684D, Tarriss" },
      premium: { label: "Premium", rangeEur: "25-60 €", example: "AwardWallet Tracker (Bluetooth+TSA)" },
    },
    guia: [
      "Solo necesitas TSA-approved si vuelas a/desde USA o Canadá. Resto del mundo cualquier candado vale.",
      "Si vas a USA SIN candado TSA, aduanas puede romper el candado y NO compensa.",
      "Para mochilas con cremalleras paralelas: cable largo > arco rígido.",
      "Anota la combinación en notas móvil — los olvidos son la causa #1 de cremalleras forzadas.",
    ],
    faqs: [
      {
        q: "¿Necesito candado para viajar dentro de Europa?",
        a: "No estrictamente. Aeropuertos europeos no abren maletas sin tu presencia. Candado más útil contra hostel/AirBnB mate-curiosos que aduanas.",
      },
      {
        q: "¿TSA puede romper mi candado normal?",
        a: "Sí, si necesitan revisar tu maleta en USA. Tienes derecho a reclamar pero rara vez compensan. Por eso TSA-approved.",
      },
      {
        q: "¿Candado vs strap maleta?",
        a: "Strap (correa) ayuda contra apertura accidental + identificación. Candado contra ladrón casual. Combinar ambos en check-in larga distancia.",
      },
    ],
    related: ["equipaje"],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "bascula-equipaje",
    name: "Báscula portátil equipaje",
    emoji: "⚖️",
    seoTitle: "Báscula portátil maleta 2026: digital, precio, dónde comprar",
    seoDescription: "Báscula portátil maleta: digital vs analógica, precisión, capacidad máx 40-50 kg. Picks 8-30 €. Evita tarifa exceso peso aerolínea.",
    amazonQuery: "báscula portátil maleta digital",
    criterios: [
      "Digital LCD > analógica (más precisa, ±50 g vs ±300 g)",
      "Capacidad máx 40-50 kg cubre 99% maletas",
      "Botón tara y unidades (kg/lb) — útil USA",
      "Auto-off ahorra batería (1 botón pila CR2032 dura 1+ año)",
      "Asa cómoda — vas a sostener 23 kg colgando 5 segundos",
    ],
    picks: {
      presupuesto: { label: "Presupuesto", rangeEur: "8-15 €", example: "AmazonBasics, Etekcity báscula portátil" },
      medio: { label: "Medio", rangeEur: "15-25 €", example: "Travel Inspira, Beurer LS06" },
      premium: { label: "Premium", rangeEur: "25-50 €", example: "Balanzza Ergo Digital con app" },
    },
    guia: [
      "Pesa SIEMPRE antes de ir al aeropuerto. Reservar maleta 23 kg y pesar 24.5 kg cuesta 75-120 € en mostrador.",
      "Mete báscula en maleta facturada (no cabina). La usas al volver para no exceder peso.",
      "Aerolíneas low cost suelen ser permisivas hasta +1 kg. >2 kg = tarifa.",
      "Si pesas siempre 22-23 kg, considera tarifa 25 kg (Ryanair tiene 20/25/30 kg tiers).",
    ],
    faqs: [
      {
        q: "¿La báscula del baño vale?",
        a: "Funciona como hack: te pesas tú, te pesas con maleta, restas. Margen error grande (±500 g). Si tu maleta va al límite 22.5/23 kg necesitas báscula maleta.",
      },
      {
        q: "¿Por qué la báscula del aeropuerto marca más que la mía?",
        a: "Las del aeropuerto están calibradas a peso real. Las portátiles baratas tienen ±300 g de error. Si tu portátil dice 22.5 kg, ve a aeropuerto con 22 kg margen.",
      },
      {
        q: "¿Vale para maletas grandes 32 kg?",
        a: "Sí — la mayoría aguantan hasta 40-50 kg. Verifica capacidad antes de comprar (algunos modelos baratos paran en 25 kg).",
      },
    ],
    related: ["equipaje", "equipaje-medidor"],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "power-banks-viaje",
    name: "Power banks (baterías externas)",
    emoji: "🔋",
    seoTitle: "Power bank viaje 2026: 10000-20000mAh, USB-C PD, avión",
    seoDescription: "Power bank avión: límite 100Wh, capacidad ideal 10000-20000mAh, USB-C PD para carga rápida. Picks 25-90 €. Qué llevar en cabina.",
    amazonQuery: "power bank 20000mAh USB-C PD avión",
    criterios: [
      "Capacidad: 10000mAh = 2-3 cargas iPhone, 20000mAh = 4-5",
      "USB-C PD ≥18W para fast charge",
      "Pass-through charging — carga el power bank mientras carga tu móvil",
      "<100Wh permitido en cabina (= 26.800mAh aprox a 3.7V)",
      "Display LED % batería > LEDs de barra",
      "Múltiples puertos (2× USB-C + 1× USB-A mínimo)",
    ],
    picks: {
      presupuesto: { label: "Presupuesto", rangeEur: "20-40 €", example: "Anker PowerCore 10000, Xiaomi 20000mAh" },
      medio: { label: "Medio", rangeEur: "40-90 €", example: "Anker 737 PowerCore 24K, Baseus Blade" },
      premium: { label: "Premium", rangeEur: "90-200 €", example: "Zendure SuperTank Pro 26800mAh PD 100W" },
    },
    guia: [
      "Power banks van SIEMPRE en cabina, NUNCA facturados (riesgo fuego litio).",
      "Máximo permitido en cabina 100Wh sin declaración (= 26800mAh a 3.7V).",
      "Si tu power bank no muestra Wh sino mAh, calcula: Wh = (mAh × 3.7) / 1000. Ej 20000mAh = 74 Wh ✓.",
      "Para portátil USB-C necesitas PD 60W+ y power bank ≥20000mAh.",
    ],
    faqs: [
      {
        q: "¿Puedo llevar 2 power banks en cabina?",
        a: "Sí, mientras cada uno sea <100Wh. Algunos países limitan a 2-3 unidades — verifica antes de vuelos a China.",
      },
      {
        q: "¿Carga power bank en el avión?",
        a: "Sí si el avión tiene USB. Pero la carga es lenta (USB-A 0.5A normalmente). Mejor cargarlo en lounge antes del vuelo.",
      },
      {
        q: "¿Cuál capacidad para viaje 7 días sin enchufe?",
        a: "Imposible — necesitas cargar power bank en algún momento. Para 1-2 días sin acceso a enchufe, 20000mAh suficiente. >2 días = solar charger o cambia plan.",
      },
    ],
    related: ["preparar-viaje"],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "neceser-colgar",
    name: "Neceser para colgar",
    emoji: "🧴",
    seoTitle: "Neceser viaje 2026: con gancho colgar, líquidos LAGs, picks",
    seoDescription: "Neceser viaje con gancho colgar: capacidad LAGs cabina (100ml/1L), materiales impermeables, organizadores interiores.",
    amazonQuery: "neceser viaje colgar gancho impermeable",
    criterios: [
      "Gancho rígido (no cuerda) — aguanta peso en perchero baño hotel",
      "Material impermeable nylon ripstop o TPU coated",
      "Bolsillo transparente para LAGs (líquidos cabina) — cumple regla 100ml/1L",
      "Compartimentos separados líquidos vs sólidos vs cepillos",
      "Cremallera estanca (waterproof YKK)",
    ],
    picks: {
      presupuesto: { label: "Presupuesto", rangeEur: "12-25 €", example: "BAGSMART, Hanging Toiletry" },
      medio: { label: "Medio", rangeEur: "25-50 €", example: "Eagle Creek Pack-It Wallaby, Osprey Ultralight" },
      premium: { label: "Premium", rangeEur: "50-100 €", example: "Peak Design Wash Pouch, Aer Toiletry" },
    },
    guia: [
      "Llena tus envases recargables 100ml DESDE casa — no compras envases nuevos cada viaje.",
      "Botes etiquetados (sharpie permanente) — distinguir champú vs gel del 2º día.",
      "Lleva bolsa transparente reciclable como backup — algunos aeropuertos exigen bag visible (Italia estricta).",
      "Cepillo dental con funda — el aire del baño hotel no es limpio.",
    ],
    faqs: [
      {
        q: "¿Cuánto líquido puedo llevar en cabina?",
        a: "Máx 100ml por envase, total 1L en bolsa transparente 20×20 cm. Excedes uno solo y te lo confiscan en control.",
      },
      {
        q: "¿Pasta dental cuenta como líquido?",
        a: "Sí. La crema solar también. Sticks (desodorante sólido, labial) NO. Geles y aerosoles SÍ.",
      },
      {
        q: "¿Vale la pena un neceser caro?",
        a: "Si viajas >10 veces al año sí — los baratos pierden el gancho al año. Para viajes esporádicos vale uno de 20 €.",
      },
    ],
    related: ["preparar-viaje", "equipaje"],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "adaptador-clavija-usb",
    name: "Cargadores USB-C múltiples puertos",
    emoji: "⚡",
    seoTitle: "Cargador USB-C multi-puerto viaje 2026: 4+ devices simultáneo",
    seoDescription: "Cargador USB-C multi-puerto para viaje: 4-6 puertos, Power Delivery, GaN compact. Cargas iPhone+laptop+iPad+watch del mismo enchufe.",
    amazonQuery: "cargador USB-C 65W multi-puerto GaN",
    criterios: [
      "GaN (Gallium Nitride) = mismo W que cargador clásico pero 50% tamaño",
      "4-6 puertos: 2× USB-C PD + 2× USB-A",
      "Total ≥65W para cargar laptop USB-C + 3 devices simultáneo",
      "Foldable plug — evita romper el enchufe en mochila",
      "Multi-voltage 100-240V (universal)",
    ],
    picks: {
      presupuesto: { label: "Presupuesto", rangeEur: "25-50 €", example: "Anker 511 30W, UGREEN 65W" },
      medio: { label: "Medio", rangeEur: "50-100 €", example: "Anker 735 GaNPrime 65W, Baseus 100W" },
      premium: { label: "Premium", rangeEur: "100-200 €", example: "Apple 140W USB-C, UGREEN 200W desktop" },
    },
    guia: [
      "1 cargador 65W multi-puerto sustituye 4 cargadores individuales → -300g en mochila.",
      "Para MacBook Pro 16\" necesitas 96W+. Para 13/14\" basta 65W.",
      "Puertos PD priorizan el dispositivo más exigente — si cargas laptop, móvil tarda más.",
      "Adaptador de enchufe internacional aparte → puedes usar el mismo cargador en USA/UK/EU.",
    ],
    faqs: [
      {
        q: "¿Puedo cargar mi MacBook con cargador no-Apple?",
        a: "Sí, si tiene USB-C PD ≥65W. Apple cobra premium por el suyo — Anker/UGREEN funcionan igual con MFi/certificación PD.",
      },
      {
        q: "¿Cargar 4 cosas a la vez ralentiza la carga?",
        a: "Sí pero proporcional. Un 65W repartido = 16W cada device. Para iPhone (max 27W) tarda más pero no se daña.",
      },
      {
        q: "¿Vale la pena GaN vs cargador normal?",
        a: "Sí — mitad tamaño, no se calienta tanto, durabilidad similar. La diferencia 25 € vs 50 € se paga en 2 viajes.",
      },
    ],
    related: ["preparar-viaje"],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "tarjeta-equipaje-perdido",
    name: "Tags rastreables equipaje (AirTag, Tile)",
    emoji: "📍",
    seoTitle: "AirTag maleta 2026: rastrear equipaje perdido, alternativas",
    seoDescription: "AirTag para maleta facturada: cómo funciona, alternativas Tile/Samsung, batería, aerolíneas que lo permiten.",
    amazonQuery: "Apple AirTag rastreador maleta",
    criterios: [
      "Apple AirTag: red 1.5B+ iPhones — mejor cobertura aeropuertos",
      "Tile Pro: Android friendly + batería reemplazable",
      "Samsung SmartTag2: solo Android Galaxy",
      "Chipolo Card: formato tarjeta, cabe en cualquier compartimento",
      "Batería 1+ año + UWB para localización precisa (AirTag/SmartTag)",
    ],
    picks: {
      presupuesto: { label: "Presupuesto", rangeEur: "20-40 €", example: "Chipolo One, Tile Mate" },
      medio: { label: "Medio", rangeEur: "40-60 €", example: "Apple AirTag (4-pack 100 €)" },
      premium: { label: "Premium", rangeEur: "60-150 €", example: "Apple AirTag + Tile Pro combo" },
    },
    guia: [
      "Mete AirTag en bolsillo interior maleta — no exterior (riesgo robo).",
      "Activa 'Marcado como perdido' en Find My ANTES de salir del aeropuerto si tu maleta no aparece.",
      "AirTag + iPhone = funciona en aeropuertos con red de iPhones cerca (99% del mundo).",
      "Si maleta perdida >24h, fotos del AirTag con timestamp son evidencia legal vs aerolínea.",
    ],
    faqs: [
      {
        q: "¿Las aerolíneas permiten AirTag en equipaje facturado?",
        a: "Sí — IATA emitió aclaración en 2022. Lufthansa intentó prohibirlos brevemente y back-tracked. Hoy 100% permitidos.",
      },
      {
        q: "¿Cuánto dura la batería AirTag?",
        a: "1 año (CR2032). Reemplazable user-side, no requiere Apple Service.",
      },
      {
        q: "¿Funciona AirTag con Android?",
        a: "Limitado: puede detectar AirTag cerca (anti-stalking notificación), pero no rastrearlo. Para Android usa Samsung SmartTag o Tile Pro.",
      },
    ],
    related: ["maleta-perdida", "equipaje"],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "slippers-avion",
    name: "Slippers/calcetines de compresión avión",
    emoji: "🧦",
    seoTitle: "Calcetines compresión avión 2026: trombosis vuelo largo (DVT)",
    seoDescription: "Calcetines de compresión para vuelos largos: prevención trombosis (DVT), nivel mmHg, marcas. Picks 15-50 €.",
    amazonQuery: "calcetines compresión avión 20-30 mmHg",
    criterios: [
      "Compresión gradual 15-20 mmHg (vuelos generales) o 20-30 mmHg (riesgo trombosis)",
      "Material: nylon/elastano con drying rápido para vuelos largos",
      "Largo hasta rodilla (knee-high) > tobillo",
      "Talla precisa según circunferencia tobillo (no por talla pie)",
      "Marca con certificación médica si tienes historial DVT/varices",
    ],
    picks: {
      presupuesto: { label: "Presupuesto", rangeEur: "15-25 €", example: "Sockwell Elevation, AmazonBasics compression" },
      medio: { label: "Medio", rangeEur: "25-50 €", example: "Wrightsock Coolmesh II, CEP recovery" },
      premium: { label: "Premium", rangeEur: "50-100 €", example: "Sigvaris medical 20-30 mmHg, Bauerfeind" },
    },
    guia: [
      "Vuelos >4h aumentan riesgo trombosis 4×. Si tienes >40 años, antecedentes, o vuelas mucho, compresión es seguro extra de 20 € que evita drama médico.",
      "Pónlos ANTES del vuelo (en taxi al aeropuerto), no en pleno aire — más difícil con tobillos hinchados.",
      "Bebe agua, anda por el pasillo cada 1-2h, evita alcohol — son medidas complementarias.",
      "Si te marcan los calcetines tras 1h = demasiado apretados. Mide circunferencia tobillo y compra talla correcta.",
    ],
    faqs: [
      {
        q: "¿Necesito calcetines compresión para vuelo 3h?",
        a: "Si eres sano <40 años, no. Para 6h+ o si tienes varices/sedentario sí. Para >10h SI/SI.",
      },
      {
        q: "¿Cualquier calcetín apretado vale?",
        a: "No — compresión médica es gradual (más apretado en tobillo, va disminuyendo). Calcetín apretado uniforme puede ser peor que nada.",
      },
      {
        q: "¿Cómo escojo la talla?",
        a: "Mide tu circunferencia tobillo en cm. Mira tabla del fabricante — varía. NUNCA elijas por talla de pie EU.",
      },
    ],
    related: ["jet-lag"],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "auriculares-cancelacion-ruido",
    name: "Auriculares cancelación de ruido viaje",
    emoji: "🎧",
    seoTitle: "Auriculares ANC viaje 2026: avión, batería, precio",
    seoDescription: "Auriculares cancelación ruido para vuelo: in-ear vs over-ear, batería, conexión avión. Picks 80-400 €.",
    amazonQuery: "auriculares cancelación ruido avión Sony Bose",
    criterios: [
      "ANC activa real (no solo passive isolation)",
      "Batería ≥30h para vuelos transatlánticos + jet-lag",
      "Bluetooth 5.0+ o adaptador jack para entretenimiento avión",
      "Plegable + estuche rígido — sobreviven a maleta-handling",
      "Multipoint conexión 2 dispositivos (laptop + móvil)",
      "Modo transparencia para anuncios cabina sin sacar auriculares",
    ],
    picks: {
      presupuesto: { label: "Presupuesto", rangeEur: "80-200 €", example: "Sony WH-CH720N, Soundcore Q45" },
      medio: { label: "Medio", rangeEur: "200-350 €", example: "Sony WH-1000XM5, Bose QC45" },
      premium: { label: "Premium", rangeEur: "350-600 €", example: "Apple AirPods Max, Bose QC Ultra" },
    },
    guia: [
      "ANC real (Sony XM5/Bose QC45) reduce hum motor avión 20-30dB → llegas menos fatigado.",
      "In-ear (Sony WF-1000XM5, AirPods Pro) ganan en portabilidad — pero peor ANC vs over-ear.",
      "Para avión: lleva adaptador jack 3.5mm si tu auriculares solo Bluetooth (sistemas entretenimiento avión jack analog).",
      "Carga FULL antes de salir — vuelo + películas + walk-around aeropuerto = 8-10h uso real.",
    ],
    faqs: [
      {
        q: "¿Merece la pena pagar 400 € en auriculares ANC?",
        a: "Si vuelas >5 long-haul al año, sí. Te ahorra fatiga + escuchas films/podcast claros + duermen mejor. Si vuelas 1-2/año, gama 200 € (Sony WH-CH720N) ya es decente.",
      },
      {
        q: "¿AirPods Pro o over-ear para viaje?",
        a: "Pro: ligeros, no molestan dormir lateral. Contra: batería 5-6h, peor ANC. Over-ear: 30h+ batería, mejor ANC. Para vuelos transatlánticos elige over-ear.",
      },
      {
        q: "¿Puedo usar auriculares ANC en despegue/aterrizaje?",
        a: "Bluetooth NO durante taxi/despegue/aterrizaje en muchas aerolíneas — modo avión. Con cable jack SÍ. Mejor opción: auriculares con jack + bluetooth dual.",
      },
    ],
    related: ["jet-lag"],
    lastUpdated: "2026-05-25",
  },
];

export const EQUIPO_VIAJE_SLUGS = EQUIPO_VIAJE.map((p) => p.slug);

export function getEquipoBySlug(slug: string): EquipoViajeProduct | undefined {
  return EQUIPO_VIAJE.find((p) => p.slug === slug);
}
