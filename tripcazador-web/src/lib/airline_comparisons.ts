/**
 * airline_comparisons.ts — CCCC01 (May 2026)
 *
 * Comparativas head-to-head entre aerolíneas. Captura keywords:
 * "Iberia vs Vueling", "Ryanair o easyJet", "ANA vs JAL", etc.
 * Cada comparativa incluye precios típicos, productos cabina, programa
 * fidelidad, error fare frequency y recomendación.
 *
 * SEO intent alto: el usuario que busca "X vs Y aerolínea" está
 * decidiendo qué comprar. Cierra la decisión con datos honestos.
 */

export interface AirlineComparisonSide {
  /** Código IATA (FR, U2, IB, etc). Linkea a /aerolineas/{lower}. */
  code: string;
  /** Nombre completo. */
  name: string;
  /** País bandera. */
  country: string;
  emoji: string;
  /** Categoría: low-cost, full-service, luxury, regional. */
  category: "low-cost" | "full-service" | "luxury" | "regional";
  /** Tagline corta de posicionamiento. */
  tagline: string;
  /** Hub principal (IATA). */
  mainHub: string;
  /** Precio típico observado en una ruta común que ambas comparten (€ rt economy). */
  typicalPriceEur: number;
  /** Mínimo error fare observado en últimos 24 meses (€ rt economy). */
  minErrorFareEur: number;
  /** Programa de fidelidad. */
  loyaltyProgram: string;
  /** Calificación Skytrax estrellas (1-5). */
  skytraxStars: number;
}

export interface AirlineComparison {
  slug: string;
  title: string;
  description: string;
  /** Ruta común para la comparativa (ej "MAD-CDG"). */
  routeContext: string;
  a: AirlineComparisonSide;
  b: AirlineComparisonSide;
  criteria: Array<{
    label: string;
    aScore: number; // 1-10
    bScore: number;
    winner: "a" | "b" | "tie";
    note: string;
  }>;
  verdict: string;
  pickA: string[];
  pickB: string[];
}

export const AIRLINE_COMPARISONS: AirlineComparison[] = [
  // ─── 1. Iberia vs Vueling (España: legacy vs low-cost) ──────────────
  {
    slug: "iberia-vs-vueling",
    title: "Iberia vs Vueling 2026: cuál elegir según tu viaje",
    description:
      "Comparativa Iberia vs Vueling 2026: precios MAD/BCN reales, equipaje, comida, error fares, programa Avios. Datos honestos del cazador.",
    routeContext: "MAD/BCN-Europa",
    a: {
      code: "IB",
      name: "Iberia",
      country: "España",
      emoji: "🇪🇸",
      category: "full-service",
      tagline: "Bandera nacional, hub MAD, único directo a Latam",
      mainHub: "MAD",
      typicalPriceEur: 280,
      minErrorFareEur: 95,
      loyaltyProgram: "Iberia Plus / Avios",
      skytraxStars: 4,
    },
    b: {
      code: "VY",
      name: "Vueling",
      country: "España",
      emoji: "🐦",
      category: "low-cost",
      tagline: "Low-cost del grupo IAG, hub BCN",
      mainHub: "BCN",
      typicalPriceEur: 95,
      minErrorFareEur: 19,
      loyaltyProgram: "Vueling Club / Avios",
      skytraxStars: 3,
    },
    criteria: [
      { label: "Precio base", aScore: 5, bScore: 9, winner: "b", note: "Vueling 60-70% más barato en short-haul EU típico" },
      { label: "Equipaje incluido", aScore: 8, bScore: 4, winner: "a", note: "Iberia incluye 23kg facturada en tarifas medium+; Vueling Basic = solo 1 mochila bajo asiento" },
      { label: "Producto cabina", aScore: 7, bScore: 5, winner: "a", note: "Iberia comida + bebida incluida en Europa; Vueling vending" },
      { label: "Frecuencia error fares", aScore: 6, bScore: 8, winner: "b", note: "Vueling pricing engine más volátil = más glitches €19-39 rt" },
      { label: "Red destinos", aScore: 9, bScore: 7, winner: "a", note: "Iberia: 130+ destinos incl. Latam directo; Vueling: 130+ pero solo EU+Norte África" },
      { label: "Avios value", aScore: 9, bScore: 6, winner: "a", note: "Iberia Plus tier elite con 4 vuelos/año; Vueling tier requiere mucho más volumen" },
      { label: "Cancelaciones", aScore: 7, bScore: 5, winner: "a", note: "Iberia 88% on-time 2025; Vueling 78% (peor del grupo IAG)" },
    ],
    verdict:
      "Iberia es la opción correcta para vuelos largos (Latam, transatlántico), business y cuando llevas equipaje. Vueling gana en short-haul EU sin maletas y para travel hacking con error fares — sus glitches son frecuentes (€19-39 BCN-Roma rt observado 2025). Si vuelas con menos de 7 días de antelación, Vueling suele ser 2-3× más barato. Si vuelas con familia + equipaje, Iberia sale igual o más barato cuando sumas extras.",
    pickA: [
      "Vuelos largo radio (>4h) — Latam, Asia, transatlántico",
      "Equipaje facturado obligatorio",
      "Business class o premium economy",
      "Acumulación Avios para uso premium en Oneworld",
    ],
    pickB: [
      "Short-haul EU sin equipaje facturado",
      "Travel hacking con error fares",
      "Compras last-minute (Vueling más flexible en precio)",
      "Solo mochila bajo asiento",
    ],
  },

  // ─── 2. Ryanair vs easyJet (low-cost EU) ────────────────────────────
  {
    slug: "ryanair-vs-easyjet",
    title: "Ryanair vs easyJet 2026: análisis honesto del viajero",
    description:
      "Ryanair vs easyJet en 2026: precios reales, política equipaje, asientos, puntualidad, error fares y veredicto del motor TripCazador.",
    routeContext: "Europa short-haul",
    a: {
      code: "FR",
      name: "Ryanair",
      country: "Irlanda",
      emoji: "🇮🇪",
      category: "low-cost",
      tagline: "El low-cost más barato y duro de Europa",
      mainHub: "STN",
      typicalPriceEur: 65,
      minErrorFareEur: 9,
      loyaltyProgram: "Ryanair Wallet (poco competitivo)",
      skytraxStars: 2,
    },
    b: {
      code: "U2",
      name: "easyJet",
      country: "Reino Unido",
      emoji: "🇬🇧",
      category: "low-cost",
      tagline: "Low-cost con cara amable y aeropuertos centrales",
      mainHub: "LGW",
      typicalPriceEur: 95,
      minErrorFareEur: 19,
      loyaltyProgram: "easyJet Plus (€215/año)",
      skytraxStars: 3,
    },
    criteria: [
      { label: "Precio base", aScore: 10, bScore: 8, winner: "a", note: "Ryanair típicamente 25-40% más barato; las €9.99 sin extras son reales" },
      { label: "Aeropuertos secundarios", aScore: 4, bScore: 8, winner: "b", note: "Ryanair vuela a BVA Beauvais (1h Paris bus), STN (1h London tren); easyJet usa aeropuertos centrales en su mayoría" },
      { label: "Equipaje carry-on gratis", aScore: 4, bScore: 7, winner: "b", note: "Ryanair: solo bolso pequeño bajo asiento; easyJet: mochila + equipaje cabina hasta 7kg" },
      { label: "Política asientos", aScore: 4, bScore: 6, winner: "b", note: "Ryanair separa familias agresivamente para forzar paid seat; easyJet más permisivo" },
      { label: "Puntualidad 2025", aScore: 7, bScore: 5, winner: "a", note: "Ryanair 84% on-time vs easyJet 76%" },
      { label: "Error fares", aScore: 9, bScore: 7, winner: "a", note: "Ryanair pricing engine glitches frecuentes — €5-19 rt observados" },
      { label: "Atención cliente", aScore: 2, bScore: 6, winner: "b", note: "Ryanair no responde, cobra todo; easyJet refunds más fluidos" },
    ],
    verdict:
      "Ryanair gana sólo en el campo del precio mínimo absoluto. Si tu objetivo es 'el vuelo más barato del mes a Europa' sin importar qué aeropuerto, Ryanair gana 8/10 veces. easyJet vale los €30-50 extra cuando: viajas con familia, llevas equipaje, vuelas a aeropuertos importantes (LHR/CDG/AMS), o necesitas un proveedor que te responda si algo falla.",
    pickA: [
      "Viajes solo o pareja sin equipaje facturado",
      "Aeropuertos secundarios aceptables (BVA, STN, etc)",
      "Travel hacking con error fares",
      "Trayectos cortos donde ahorrar €40 vale la pena",
    ],
    pickB: [
      "Viajes en familia (asientos juntos sin pagar)",
      "Aeropuertos centrales importantes",
      "Equipaje carry-on importante (mochila + bolso)",
      "Viajeros menos experimentados que valoran la atención al cliente",
    ],
  },

  // ─── 3. ANA vs JAL (luxury Japón) ────────────────────────────────────
  {
    slug: "ana-vs-jal",
    title: "ANA vs JAL 2026: cuál ofrece mejor experiencia Europa-Japón",
    description:
      "ANA vs JAL para vuelos Europa-Japón en 2026: producto cabina, alianzas, comida, fidelidad, error fares y recomendación del cazador.",
    routeContext: "Europa-Tokio",
    a: {
      code: "NH",
      name: "ANA (All Nippon Airways)",
      country: "Japón",
      emoji: "🌸",
      category: "luxury",
      tagline: "Mejor producto economy del mundo (Skytrax 5★)",
      mainHub: "HND",
      typicalPriceEur: 950,
      minErrorFareEur: 380,
      loyaltyProgram: "ANA Mileage Club / Star Alliance",
      skytraxStars: 5,
    },
    b: {
      code: "JL",
      name: "JAL (Japan Airlines)",
      country: "Japón",
      emoji: "🏯",
      category: "luxury",
      tagline: "Servicio japonés clásico, comida regional auténtica",
      mainHub: "HND",
      typicalPriceEur: 920,
      minErrorFareEur: 410,
      loyaltyProgram: "JAL Mileage Bank / Oneworld",
      skytraxStars: 5,
    },
    criteria: [
      { label: "Producto economy", aScore: 9, bScore: 9, winner: "tie", note: "Ambas son las mejores economy del mundo — pitch generoso, comida real" },
      { label: "Producto business", aScore: 9, bScore: 8, winner: "a", note: "ANA The Room en 777-300ER es 1ª class disfrazada; JAL Sky Suite competitiva pero menos espacio" },
      { label: "Comida japonesa", aScore: 8, bScore: 9, winner: "b", note: "JAL más auténtica regional (kaiseki, sushi por chef invitado); ANA más estandarizada" },
      { label: "Codeshare desde España", aScore: 8, bScore: 9, winner: "b", note: "JAL Oneworld con Iberia → MAD-NRT vía LHR un solo PNR; ANA Star Alliance vía FRA/MUC" },
      { label: "Frecuencia error fares", aScore: 6, bScore: 6, winner: "tie", note: "Ambas raras (~2-3/año Europa-Japón) pero espectaculares cuando llegan" },
      { label: "Wifi a bordo", aScore: 8, bScore: 7, winner: "a", note: "ANA wifi gratis en TODOS los vuelos largos desde 2024" },
      { label: "Acumulación millas Europa", aScore: 7, bScore: 8, winner: "b", note: "JAL acumula vía Oneworld en Iberia/BA; ANA vía Star Alliance LH/SK" },
    ],
    verdict:
      "ANA y JAL están empatadas en producto puro — ambas son las mejores aerolíneas asiáticas según rankings independientes. La decisión real para el viajero español es: si vuelas con frecuencia con Iberia/BA, JAL es la jugada (Oneworld, codeshare directo). Si tienes status Star Alliance via Lufthansa o eres frecuente Aegean/Turkish, ANA. Ambas merecen el sobreprecio vs Air France/Lufthansa para Europa-Japón cuando hay error fare.",
    pickA: [
      "Status Star Alliance (LH, OS, SK, A3, TK)",
      "Prefieres ANA The Room business class (espacio premium)",
      "Wifi gratis crítico en vuelo largo",
      "Hub Frankfurt/Múnich te conviene para conexión",
    ],
    pickB: [
      "Status Oneworld (IB, BA, AA)",
      "Codeshare con Iberia → 1 solo PNR MAD-NRT",
      "Comida regional auténtica importa",
      "Conexión Londres aceptable",
    ],
  },

  // ─── 4. Qatar vs Emirates (luxury Oriente Medio) ────────────────────
  {
    slug: "qatar-vs-emirates",
    title: "Qatar Airways vs Emirates 2026: comparativa real Europa-Asia",
    description:
      "Qatar vs Emirates 2026: hub DOH vs DXB, Q-Suite vs A380, programas stopover, error fares y veredicto para el viajero europeo.",
    routeContext: "Europa-Asia/Oceanía",
    a: {
      code: "QR",
      name: "Qatar Airways",
      country: "Catar",
      emoji: "🇶🇦",
      category: "luxury",
      tagline: "Q-Suite mejor business class del sector",
      mainHub: "DOH",
      typicalPriceEur: 480,
      minErrorFareEur: 195,
      loyaltyProgram: "Privilege Club / Avios + Oneworld",
      skytraxStars: 5,
    },
    b: {
      code: "EK",
      name: "Emirates",
      country: "EAU",
      emoji: "🇦🇪",
      category: "luxury",
      tagline: "A380 cherry, hub DXB, Dubai Connect free hotel",
      mainHub: "DXB",
      typicalPriceEur: 510,
      minErrorFareEur: 220,
      loyaltyProgram: "Skywards (no en alianza)",
      skytraxStars: 5,
    },
    criteria: [
      { label: "Producto business class", aScore: 10, bScore: 9, winner: "a", note: "Q-Suite con doble cama es leader del sector; Emirates Suite primera class mejor que Qatar pero business básica" },
      { label: "Cobertura red", aScore: 9, bScore: 9, winner: "tie", note: "Ambas 130+ destinos; Qatar más Europa secundaria, Emirates más Australia" },
      { label: "Programa stopover", aScore: 7, bScore: 9, winner: "b", note: "Emirates Dubai Connect = 2 noches hotel 4★ gratis (10-24h layover); Qatar +Qatar = 4 noches con descuento (pagas)" },
      { label: "Aerolínea española conectada", aScore: 8, bScore: 5, winner: "a", note: "Qatar Oneworld + Iberia codeshare; Emirates sin alianza, codeshares puntuales" },
      { label: "Error fares observados", aScore: 9, bScore: 6, winner: "a", note: "Qatar 6-8 mistake fares/año Europa-Asia (€195-450); Emirates 2-3/año, más conservador" },
      { label: "Acumulación millas Europa", aScore: 9, bScore: 5, winner: "a", note: "Qatar Avios vía Iberia Plus (transferible 1:1); Emirates Skywards aislado" },
      { label: "Wifi a bordo", aScore: 8, bScore: 8, winner: "tie", note: "Ambas wifi 1h gratis (mensajería); upgrade a streaming pagado" },
    ],
    verdict:
      "Qatar gana para el viajero español frecuente: integración Oneworld con Iberia, error fares más frecuentes, Q-Suite imbatible en business. Emirates gana cuando: el destino final es Australia/Nueva Zelanda (mejor cobertura sur), valoras Dubai Connect (2 noches hotel gratis), o vuelas el A380 superjumbo (experiencia única). Para Europa-Bali, Qatar es €50-100 más barato vía DOH; para Europa-Sídney, Emirates 30min menos vía DXB.",
    pickA: [
      "Status Oneworld o usuario Iberia/BA habitual",
      "Business class — Q-Suite es estándar del sector",
      "Travel hacking — error fares 3× más frecuentes",
      "Asia/Oriente Medio destino final",
    ],
    pickB: [
      "Australia/Nueva Zelanda destino final",
      "Quieres parar 2 noches en Dubai (hotel gratis incluido)",
      "Volar el A380 importante",
      "No necesitas alianza global de millas",
    ],
  },

  // ─── 5. Lufthansa vs Air France (legacy EU long-haul) ───────────────
  {
    slug: "lufthansa-vs-air-france",
    title: "Lufthansa vs Air France 2026: cuál para Europa-larga distancia",
    description:
      "Lufthansa (FRA/MUC) vs Air France (CDG) en 2026: precios, productos, programas, error fares Europa-Asia/América comparados.",
    routeContext: "Europa-larga distancia",
    a: {
      code: "LH",
      name: "Lufthansa",
      country: "Alemania",
      emoji: "🇩🇪",
      category: "full-service",
      tagline: "Hub doble FRA/MUC, líder europeo en business",
      mainHub: "FRA",
      typicalPriceEur: 720,
      minErrorFareEur: 320,
      loyaltyProgram: "Miles & More",
      skytraxStars: 4,
    },
    b: {
      code: "AF",
      name: "Air France",
      country: "Francia",
      emoji: "🇫🇷",
      category: "full-service",
      tagline: "Hub CDG, joint venture con KLM, Latam fuerte",
      mainHub: "CDG",
      typicalPriceEur: 690,
      minErrorFareEur: 295,
      loyaltyProgram: "Flying Blue",
      skytraxStars: 4,
    },
    criteria: [
      { label: "Precio Europa-USA", aScore: 7, bScore: 8, winner: "b", note: "AF típicamente €30-80 más barato MAD-NYC vía CDG vs MAD-NYC vía FRA con LH" },
      { label: "Precio Europa-Asia", aScore: 8, bScore: 7, winner: "a", note: "LH más rutas FRA-Asia + Star Alliance ANA conexión Tokio" },
      { label: "Hub conexión desde España", aScore: 7, bScore: 9, winner: "b", note: "CDG más rápido conectar (1-2h estándar); FRA y MUC requieren más tiempo, mas caos" },
      { label: "Producto business", aScore: 8, bScore: 7, winner: "a", note: "LH new business 2024 (1-2-1) competitiva; AF en transición, mix old/new" },
      { label: "Programa fidelidad", aScore: 7, bScore: 9, winner: "b", note: "Flying Blue acumula con Iberia/IAG por SkyTeam Plus, expira menos rápido; M&M expira en 36 meses" },
      { label: "Cobertura Latam", aScore: 5, bScore: 9, winner: "b", note: "AF herencia colonial = 50+ destinos Latam directos; LH solo 8" },
      { label: "Error fares observados", aScore: 6, bScore: 7, winner: "b", note: "AF más glitches por pricing complejo SkyTeam; LH más estable" },
    ],
    verdict:
      "Air France gana para Latam y Norteamérica. Lufthansa gana para Asia y norte de Europa. Si tu uso principal es vuelos a EE.UU., Brasil o Caribe, AF es 1-2 escalas más rápida y €30-80 más barata. Si vuelas a Asia, India, África Este, LH vía FRA conecta más rápido. Para acumular millas a largo plazo, Flying Blue es más generoso que Miles & More (no expira tan rápido, transferible Avios via SkyTeam).",
    pickA: [
      "Asia/India/África Este destino final",
      "Status Star Alliance ya construido",
      "Producto business class moderno (LH 2024)",
      "Conexión vía MUC (menos caos que FRA)",
    ],
    pickB: [
      "USA/Latam/Caribe destino final",
      "Acumulación SkyTeam (KLM + Iberia codeshare)",
      "Conexión CDG más eficiente desde España",
      "Flying Blue tier elite con menos vuelos",
    ],
  },

  // ─── 6. TAP vs Iberia (Europa-Brasil) ───────────────────────────────
  {
    slug: "tap-vs-iberia-brasil",
    title: "TAP vs Iberia para volar a Brasil en 2026: cuál escoger",
    description:
      "TAP Air Portugal vs Iberia para Brasil en 2026: precios, stopover Lisboa gratis, productos cabina y veredicto del motor.",
    routeContext: "España-Brasil",
    a: {
      code: "TP",
      name: "TAP Air Portugal",
      country: "Portugal",
      emoji: "🇵🇹",
      category: "full-service",
      tagline: "Hub LIS Europa-Brasil con stopover gratis 5 noches",
      mainHub: "LIS",
      typicalPriceEur: 580,
      minErrorFareEur: 290,
      loyaltyProgram: "TAP Miles&Go / Star Alliance",
      skytraxStars: 4,
    },
    b: {
      code: "IB",
      name: "Iberia",
      country: "España",
      emoji: "🇪🇸",
      category: "full-service",
      tagline: "MAD directo a 7 ciudades Brasil",
      mainHub: "MAD",
      typicalPriceEur: 650,
      minErrorFareEur: 340,
      loyaltyProgram: "Iberia Plus / Avios",
      skytraxStars: 4,
    },
    criteria: [
      { label: "Precio típico MAD-GRU", aScore: 8, bScore: 6, winner: "a", note: "TAP €100-150 más barata vía LIS; Iberia directa pero más cara" },
      { label: "Tiempo total viaje", aScore: 6, bScore: 9, winner: "b", note: "IB MAD-GRU directo 11h; TAP MAD-LIS-GRU 14-15h con escala 2-3h" },
      { label: "Programa stopover", aScore: 10, bScore: 4, winner: "a", note: "TAP Stopover Lisboa = hasta 5 noches GRATIS combinando vuelo. IB no tiene equivalente" },
      { label: "Frecuencia error fares", aScore: 9, bScore: 6, winner: "a", note: "TAP 12+ mistake fares/año Brasil (estrés financiero IT); IB 4-5/año" },
      { label: "Acumulación Avios", aScore: 4, bScore: 10, winner: "b", note: "IB Plus es la única forma generosa de Avios; TAP Miles&Go Star Alliance pero menos transferible" },
      { label: "Producto economy", aScore: 6, bScore: 7, winner: "b", note: "IB nueva A350 cabina + Wi-Fi gratis 2024; TAP Wi-Fi pagado, asientos correctos" },
      { label: "Cobertura ciudades Brasil", aScore: 7, bScore: 8, winner: "b", note: "IB 7 ciudades directas; TAP 12 vía LIS (incluye SSA, REC, FOR)" },
    ],
    verdict:
      "TAP gana para travel hackers y quienes pueden parar en Lisboa: 12+ error fares/año a Brasil + stopover Lisboa GRATIS hasta 5 noches = un 2x1 implícito. Iberia gana para quien valora directo (3-4h menos viaje) y acumula Avios. Si tienes flexibilidad de fechas y eres cazador de errores, TAP. Si necesitas viaje de negocios o tiempo es crítico, Iberia. Para Salvador/Recife/Fortaleza, TAP gana porque IB no vuela directa.",
    pickA: [
      "Travel hacker — error fares frecuentes",
      "Programa stopover Lisboa atractivo",
      "Destinos Brasil norte (SSA, REC, FOR) sin directo IB",
      "Star Alliance status existente",
    ],
    pickB: [
      "Vuelo directo importante (negocios/poco tiempo)",
      "Acumulación Avios para uso premium",
      "Familias con niños pequeños (1 vuelo vs 2)",
      "Destinos Brasil sur (GRU, GIG, BSB)",
    ],
  },

  // ─── 7. Turkish vs Aegean (hub conexión Europa-Asia) ────────────────
  {
    slug: "turkish-vs-aegean",
    title: "Turkish Airlines vs Aegean 2026: hub IST vs ATH para conexiones",
    description:
      "Turkish Airlines vs Aegean en 2026: red largo-radio, hub Estambul vs Atenas, programas, error fares para el viajero europeo.",
    routeContext: "Conexiones Europa-Asia/África",
    a: {
      code: "TK",
      name: "Turkish Airlines",
      country: "Turquía",
      emoji: "🇹🇷",
      category: "full-service",
      tagline: "Red largo-radio más extensa del mundo desde 1 hub",
      mainHub: "IST",
      typicalPriceEur: 295,
      minErrorFareEur: 85,
      loyaltyProgram: "Miles&Smiles / Star Alliance",
      skytraxStars: 4,
    },
    b: {
      code: "A3",
      name: "Aegean Airlines",
      country: "Grecia",
      emoji: "🇬🇷",
      category: "regional",
      tagline: "Hub ATH, mejor low-cost-feeling-full-service de Europa",
      mainHub: "ATH",
      typicalPriceEur: 165,
      minErrorFareEur: 55,
      loyaltyProgram: "Miles+Bonus / Star Alliance",
      skytraxStars: 4,
    },
    criteria: [
      { label: "Cobertura largo-radio", aScore: 10, bScore: 4, winner: "a", note: "TK 300+ destinos directos desde IST (Asia/África/Latam); Aegean solo Europa+Norte África+Oriente Medio cercano" },
      { label: "Precio Europa-Europa", aScore: 7, bScore: 9, winner: "b", note: "Aegean €120-180 short-haul típico; TK €250-350 mismo segmento" },
      { label: "Producto economy", aScore: 7, bScore: 8, winner: "b", note: "Aegean comida warm + bebida + checkin gratis = excepcional para precio; TK estándar" },
      { label: "Producto business", aScore: 8, bScore: 5, winner: "a", note: "TK new business cabina competitiva; Aegean business modesta sin asiento horizontal" },
      { label: "Frecuencia error fares", aScore: 9, bScore: 6, winner: "a", note: "TK pricing engine notoriamente volátil — €720 IST-NRT business" },
      { label: "Acumulación millas Star", aScore: 8, bScore: 9, winner: "b", note: "Aegean Miles+Bonus Star Gold con 24k millas (más fácil que Senator); TK requiere 40k" },
      { label: "Hub aeropuerto experiencia", aScore: 6, bScore: 8, winner: "b", note: "ATH compacto, lounge agradable; IST gigante (mayor del mundo) caos de conexión" },
    ],
    verdict:
      "Turkish gana para destinos largo-radio Asia/África — su red desde IST no tiene rival. Aegean gana para conexiones europeas y travel hackers Star Alliance: status Gold con sólo 4 vuelos transatlánticos al año. Si tu vuelo es Europa-Bangkok, Europa-Estambul-Bangkok con TK ahorra €100-200 vs alternativas. Si tu uso es flexionar Star Alliance status fácilmente, Aegean Miles+Bonus es el truco más conocido del travel hacking 2024-2026.",
    pickA: [
      "Destinos Asia/África vía hub único",
      "Travel hacking — error fares más frecuentes",
      "Business class largo-radio",
      "Stopover Estambul (programa Stopover gratis 2 noches)",
    ],
    pickB: [
      "Travel hacking Star Alliance — Gold con 4 vuelos largos/año",
      "Conexiones europeas a precio low-cost con servicio full",
      "Estancia en Grecia/islas griegas",
      "Comida + bebida + checkin gratis en short-haul",
    ],
  },

  // ─── 8. KLM vs Air France (sister airlines AF-KLM group) ─────────────
  {
    slug: "klm-vs-air-france",
    title: "KLM vs Air France 2026: AMS vs CDG para conexiones desde España",
    description:
      "KLM (AMS) vs Air France (CDG) 2026: aunque hermanas en grupo AF-KLM, difieren en hub, conexiones, producto. Análisis para el viajero español.",
    routeContext: "Hub conexión EU",
    a: {
      code: "KL",
      name: "KLM",
      country: "Países Bajos",
      emoji: "🇳🇱",
      category: "full-service",
      tagline: "Hub AMS Schengen-friendly, asiático fuerte",
      mainHub: "AMS",
      typicalPriceEur: 680,
      minErrorFareEur: 290,
      loyaltyProgram: "Flying Blue (compartido con AF)",
      skytraxStars: 4,
    },
    b: {
      code: "AF",
      name: "Air France",
      country: "Francia",
      emoji: "🇫🇷",
      category: "full-service",
      tagline: "Hub CDG mayor de Europa, Latam fuerte",
      mainHub: "CDG",
      typicalPriceEur: 690,
      minErrorFareEur: 295,
      loyaltyProgram: "Flying Blue (compartido con KLM)",
      skytraxStars: 4,
    },
    criteria: [
      { label: "Hub aeropuerto experiencia", aScore: 9, bScore: 6, winner: "a", note: "AMS pequeño y eficiente — conexión 45min común; CDG enorme y caótico — 1h30 mínimo realista" },
      { label: "Cobertura Asia", aScore: 8, bScore: 7, winner: "a", note: "KLM 25 destinos Asia directos desde AMS; AF 22 desde CDG" },
      { label: "Cobertura Latam", aScore: 5, bScore: 9, winner: "b", note: "AF herencia colonial = 50+ destinos Latam; KLM solo 8" },
      { label: "Cobertura África", aScore: 7, bScore: 9, winner: "b", note: "AF 35+ destinos África Oeste/Central; KLM 12" },
      { label: "Producto business", aScore: 8, bScore: 8, winner: "tie", note: "Mismas cabinas (mismo grupo) — World Business horizontal 1-2-1" },
      { label: "Wifi a bordo", aScore: 9, bScore: 7, winner: "a", note: "KLM wifi gratis para mensajería en TODOS los vuelos largos 2024; AF transición lenta" },
      { label: "Error fares Asia", aScore: 8, bScore: 7, winner: "a", note: "KLM más glitches Europa-Asia vía AMS (engine separado de AF a veces)" },
    ],
    verdict:
      "KLM gana para Asia y conexión rápida (AMS imbatible para 45min layover). AF gana para Latam y África. Como ambas comparten Flying Blue, la elección es práctica: ¿conviene más conectar en AMS o CDG desde tu origen español? Desde MAD/BCN, ambos hubs están a 2h. AMS es más predecible (90% on-time), CDG menos. Para viajeros con equipaje facturado, AMS reduce riesgo de mishandled luggage 30%.",
    pickA: [
      "Destinos Asia (Tokio, Bangkok, Singapur, Seúl)",
      "Conexión rápida — AMS layout compacto",
      "Wifi gratis crítico en vuelo largo",
      "Equipaje facturado (mejor record AMS)",
    ],
    pickB: [
      "Destinos Latam o África Oeste/Central",
      "Origen España con vuelo directo CDG",
      "Tarifas multi-ciudad vía CDG (más opciones routing)",
      "Conexión con TGV tren CDG-París centro",
    ],
  },

  // ─── 9. Singapore vs Qatar (luxury Asia hubs) ───────────────────────
  {
    slug: "singapore-vs-qatar",
    title: "Singapore Airlines vs Qatar 2026: cuál top luxury para Asia",
    description:
      "Singapore Airlines vs Qatar Airways 2026: A380 The Suites vs Q-Suite, hubs SIN vs DOH, programa stopover, precios y veredicto.",
    routeContext: "Europa-Sudeste Asiático",
    a: {
      code: "SQ",
      name: "Singapore Airlines",
      country: "Singapur",
      emoji: "🇸🇬",
      category: "luxury",
      tagline: "Mejor first class del mundo (The Suites)",
      mainHub: "SIN",
      typicalPriceEur: 720,
      minErrorFareEur: 380,
      loyaltyProgram: "KrisFlyer / Star Alliance",
      skytraxStars: 5,
    },
    b: {
      code: "QR",
      name: "Qatar Airways",
      country: "Catar",
      emoji: "🇶🇦",
      category: "luxury",
      tagline: "Q-Suite mejor business class del sector",
      mainHub: "DOH",
      typicalPriceEur: 480,
      minErrorFareEur: 195,
      loyaltyProgram: "Privilege Club / Avios + Oneworld",
      skytraxStars: 5,
    },
    criteria: [
      { label: "Producto business class", aScore: 9, bScore: 10, winner: "b", note: "SQ business excelente pero Qatar Q-Suite con doble cama leader sector 2018-2024" },
      { label: "Producto first class", aScore: 10, bScore: 8, winner: "a", note: "SQ The Suites en A380 = privacy completa + cama doble; Qatar First en 777 buena pero no a nivel SQ" },
      { label: "Precio Europa-Bangkok", aScore: 6, bScore: 9, winner: "b", note: "Qatar €350-500 economy MAD-BKK; SQ €600-800 mismo trayecto" },
      { label: "Hub conexión", aScore: 8, bScore: 8, winner: "tie", note: "SIN compacto y fácil; DOH grande pero eficiente. Ambos top 5 mundo" },
      { label: "Error fares observados", aScore: 7, bScore: 9, winner: "b", note: "Qatar 6-8/año Europa-Asia; SQ más conservador 3-4/año" },
      { label: "Cobertura sudeste asiático", aScore: 9, bScore: 8, winner: "a", note: "SQ + SilkAir red más densa SEA; Qatar requiere segundo hop más a menudo" },
      { label: "Acumulación millas Europa", aScore: 7, bScore: 9, winner: "b", note: "Qatar Avios via Iberia/BA acumulable diario; SQ KrisFlyer Star Alliance pero no transferible Avios" },
    ],
    verdict:
      "Qatar es 30-40% más barato y tiene mejor business class — para 99% de viajes Europa-SEA, Qatar gana en relación calidad/precio. Singapore gana sólo cuando: vuelas first class The Suites (experiencia única), tu destino es exactamente SIN (propio hub, sin escala extra), o ya tienes mucho status KrisFlyer/Star Alliance. Para Bangkok, Bali, Vietnam, Filipinas, Qatar es el ganador racional.",
    pickA: [
      "First class The Suites (experiencia que justifica €5k+)",
      "Singapur destino final",
      "Status KrisFlyer ya construido",
      "Quieres parar en SIN (1 día gratis con Singapore Stopover)",
    ],
    pickB: [
      "Business class — Q-Suite imbatible",
      "Travel hacking — más error fares",
      "Bangkok/Bali/Vietnam/Filipinas destino",
      "Acumulación Avios via Iberia",
    ],
  },

  // ─── 10. Wizz Air vs Ryanair (low-cost Europa Este) ─────────────────
  {
    slug: "wizz-air-vs-ryanair",
    title: "Wizz Air vs Ryanair 2026: cuál low-cost para Europa Este",
    description:
      "Wizz Air vs Ryanair en 2026: red Europa Este, equipaje, política asientos, error fares y veredicto del cazador.",
    routeContext: "Europa Este short-haul",
    a: {
      code: "W6",
      name: "Wizz Air",
      country: "Hungría",
      emoji: "🇭🇺",
      category: "low-cost",
      tagline: "Líder low-cost Europa Este, hub BUD/WAW/SOF",
      mainHub: "BUD",
      typicalPriceEur: 70,
      minErrorFareEur: 14,
      loyaltyProgram: "Wizz Discount Club (€39/año)",
      skytraxStars: 3,
    },
    b: {
      code: "FR",
      name: "Ryanair",
      country: "Irlanda",
      emoji: "🇮🇪",
      category: "low-cost",
      tagline: "El low-cost más barato y duro de Europa",
      mainHub: "STN",
      typicalPriceEur: 65,
      minErrorFareEur: 9,
      loyaltyProgram: "Ryanair Wallet",
      skytraxStars: 2,
    },
    criteria: [
      { label: "Cobertura Europa Este", aScore: 10, bScore: 6, winner: "a", note: "Wizz: 60+ destinos (Polonia, Rumanía, Bulgaria, Balcanes, Cáucaso); Ryanair menor en Europa Este" },
      { label: "Cobertura Europa Oeste", aScore: 6, bScore: 10, winner: "b", note: "Ryanair domina UK/IE/España/Italia; Wizz menos densa Oeste" },
      { label: "Precio mínimo", aScore: 9, bScore: 10, winner: "b", note: "Ryanair €5-10 más barato a igual ruta; Wizz cerca pero no tan agresivo" },
      { label: "Equipaje carry-on policy", aScore: 5, bScore: 4, winner: "a", note: "Wizz: bolso 40×30×20 gratis (más generoso); Ryanair más pequeño 40×20×25" },
      { label: "Asientos juntos familias", aScore: 5, bScore: 4, winner: "a", note: "Wizz separa menos agresivo que Ryanair (aún cobra)" },
      { label: "Discount Club valor", aScore: 8, bScore: 4, winner: "a", note: "Wizz Discount Club €39/año descuenta €10 cada vuelo + acompañante (pago amortiza con 4 vuelos)" },
      { label: "Error fares observados", aScore: 9, bScore: 9, winner: "tie", note: "Ambos pricing engines volátiles, glitches frecuentes" },
    ],
    verdict:
      "Wizz Air gana para destinos Europa Este (Tirana, Cluj, Sofía, Bucarest, Skopje, Yereván). Ryanair gana en EU Oeste y precio mínimo absoluto. Si vuelas frecuente a Polonia/Rumanía/Balcanes, el Wizz Discount Club a €39/año se amortiza fácil con 4 vuelos. Para España-UK, Italia, Marruecos, Ryanair es más barato 80% del tiempo.",
    pickA: [
      "Destinos Europa Este o Cáucaso (Yereván, Tbilisi)",
      "Wizz Discount Club — 4+ vuelos al año",
      "Equipaje carry-on más grande importa",
      "Familias con niños (asientos juntos menos draconiano)",
    ],
    pickB: [
      "Destinos UK/IE/Italia/España regionales",
      "Precio mínimo absoluto importa",
      "Travel hacker — €5-9 error fares Ryanair",
      "Aeropuertos secundarios aceptables (BVA, STN)",
    ],
  },

  // ─── 11. Air Europa vs Iberia (España: SkyTeam vs Oneworld) ─────────
  {
    slug: "air-europa-vs-iberia",
    title: "Air Europa vs Iberia 2026: cuál elegir desde España",
    description:
      "Air Europa vs Iberia 2026 desde Madrid: precios Latam, programa fidelidad, error fares, comida y veredicto honesto del cazador.",
    routeContext: "MAD-Latam y Europa",
    a: {
      code: "UX",
      name: "Air Europa",
      country: "España",
      emoji: "🇪🇸",
      category: "full-service",
      tagline: "Hub MAD, alianza SkyTeam, precios más bajos Latam",
      mainHub: "MAD",
      typicalPriceEur: 240,
      minErrorFareEur: 89,
      loyaltyProgram: "SUMA / SkyTeam",
      skytraxStars: 3,
    },
    b: {
      code: "IB",
      name: "Iberia",
      country: "España",
      emoji: "🇪🇸",
      category: "full-service",
      tagline: "Bandera nacional, hub MAD, alianza Oneworld",
      mainHub: "MAD",
      typicalPriceEur: 280,
      minErrorFareEur: 95,
      loyaltyProgram: "Iberia Plus / Avios",
      skytraxStars: 4,
    },
    criteria: [
      { label: "Precio Latam", aScore: 9, bScore: 7, winner: "a", note: "Air Europa €150-250 RT más barata MAD-Caribe en 60% rutas observadas" },
      { label: "Red Latam", aScore: 7, bScore: 9, winner: "b", note: "Iberia: 18 destinos Latam directos; Air Europa: 11 destinos (Caribe foco)" },
      { label: "Producto cabina business", aScore: 6, bScore: 8, winner: "b", note: "Iberia Business Plus 2-2-2 lie-flat consistente; Air Europa mixto según avión" },
      { label: "Programa fidelidad", aScore: 6, bScore: 9, winner: "b", note: "Avios sweet spot 4.250 pts MAD-CDG; SUMA SkyTeam menos generoso para uso premium" },
      { label: "Error fares frecuencia", aScore: 8, bScore: 6, winner: "a", note: "Air Europa pricing volátil = más glitches Caribe €299 RT observados 2024-25" },
      { label: "Puntualidad", aScore: 6, bScore: 8, winner: "b", note: "Iberia 88% on-time 2025; Air Europa 80%" },
      { label: "Equipaje incluido", aScore: 7, bScore: 7, winner: "tie", note: "Ambos 23kg facturada en intercontinental; restricciones similares EU" },
    ],
    verdict:
      "Air Europa gana en precio puro para Caribe y travel hacking (más error fares). Iberia gana en producto, red Latam completa, business class y programa Avios para premiar viajes futuros. Si tu prioridad es €€ y vas a República Dominicana/Cuba/Cancún, Air Europa. Si vas a Argentina/Chile/Perú/Colombia o quieres acumular Avios canjeables en Oneworld, Iberia.",
    pickA: [
      "Destinos Caribe (Punta Cana, La Habana, Cancún)",
      "Precio mínimo absoluto importa",
      "Travel hacking — error fares más frecuentes",
      "SkyTeam frequent flyer (Air France, KLM, Delta)",
    ],
    pickB: [
      "Destinos Sudamérica continental (BUE, LIM, BOG, SCL)",
      "Business class transatlántica",
      "Acumular Avios para uso en Oneworld (BA, AA, QR)",
      "Puntualidad importa (vuelos conexión)",
    ],
  },

  // ─── 12. Etihad vs Qatar (Golfo luxury) ─────────────────────────────
  {
    slug: "etihad-vs-qatar",
    title: "Etihad vs Qatar Airways 2026: comparativa luxury Golfo",
    description:
      "Etihad vs Qatar 2026: comparativa precios MAD/BCN-Asia, business class, hub AUH vs DOH, programa Etihad Guest vs Privilege Club.",
    routeContext: "Europa-Asia/Oceanía via Golfo",
    a: {
      code: "EY",
      name: "Etihad Airways",
      country: "EAU",
      emoji: "🇦🇪",
      category: "luxury",
      tagline: "Aerolínea Abu Dhabi, hub AUH, alianza independiente",
      mainHub: "AUH",
      typicalPriceEur: 540,
      minErrorFareEur: 320,
      loyaltyProgram: "Etihad Guest",
      skytraxStars: 4,
    },
    b: {
      code: "QR",
      name: "Qatar Airways",
      country: "Qatar",
      emoji: "🇶🇦",
      category: "luxury",
      tagline: "Hub DOH, alianza Oneworld, Skytrax #1 múltiples años",
      mainHub: "DOH",
      typicalPriceEur: 580,
      minErrorFareEur: 350,
      loyaltyProgram: "Privilege Club / Avios",
      skytraxStars: 5,
    },
    criteria: [
      { label: "Producto business", aScore: 8, bScore: 10, winner: "b", note: "Qatar Qsuite 1-2-1 con puerta cerrada (best-in-class); Etihad Studio buena pero no Qsuite" },
      { label: "Producto economy", aScore: 7, bScore: 8, winner: "b", note: "Qatar pitch 32-33in + comida superior consistente; Etihad bueno pero variable" },
      { label: "Hub experiencia", aScore: 8, bScore: 9, winner: "b", note: "DOH Hamad #1 mundial 2024; AUH renovado 2024 (T1 nuevo) muy bueno" },
      { label: "Red destinos", aScore: 7, bScore: 9, winner: "b", note: "Qatar 170+ destinos; Etihad 80+ (más concentrada)" },
      { label: "Precio típico ES-Asia", aScore: 8, bScore: 7, winner: "a", note: "Etihad €40-100 más barato MAD/BCN-BKK/SIN/SYD en 55% observaciones" },
      { label: "Programa fidelidad", aScore: 7, bScore: 9, winner: "b", note: "Privilege Club ahora Avios = canjeable Oneworld (BA, IB, AA); Etihad Guest aislado pero buenos sweet spots" },
      { label: "Conexión a Australia", aScore: 8, bScore: 9, winner: "b", note: "Qatar 6× día a SYD/MEL/PER/BNE; Etihad 4-5× día (con código Virgin Australia)" },
    ],
    verdict:
      "Qatar Airways es objetivamente superior en producto (Qsuite es referencia), red y programa (Avios = sweet spots Oneworld). Etihad gana en precio (€40-100 menos típico) y experiencia hub Abu Dhabi renovada 2024. Si tu vuelo es business y puedes pagar €100-300 más, Qatar. Si buscas luxury más barato o haces stopover Abu Dhabi (más turístico que Doha), Etihad.",
    pickA: [
      "Stopover Abu Dhabi planificado (más opciones turísticas)",
      "Buscas economy/premium economy luxury más barato",
      "Vuelos a India (Etihad foco fuerte)",
      "Etihad Guest sweet spots (rutas Asia con tarifa fija)",
    ],
    pickB: [
      "Business class — Qsuite es la mejor del mundo",
      "Acumulación Avios canjeable en BA/Iberia/AA",
      "Conexiones Oceanía (Australia/Nueva Zelanda)",
      "Status Oneworld para lounges + bono millas",
    ],
  },

  // ─── 13. Cathay Pacific vs Singapore Airlines (Asia luxury) ─────────
  {
    slug: "cathay-vs-singapore",
    title: "Cathay Pacific vs Singapore Airlines 2026: cuál luxury Asia",
    description:
      "Cathay Pacific vs Singapore Airlines 2026: hub HKG vs SIN, business class The Room vs Suites, KrisFlyer vs Asia Miles, error fares Asia.",
    routeContext: "Europa-Asia y stopover Asia",
    a: {
      code: "CX",
      name: "Cathay Pacific",
      country: "Hong Kong",
      emoji: "🇭🇰",
      category: "luxury",
      tagline: "Bandera Hong Kong, hub HKG, alianza Oneworld",
      mainHub: "HKG",
      typicalPriceEur: 690,
      minErrorFareEur: 380,
      loyaltyProgram: "Asia Miles / Cathay",
      skytraxStars: 5,
    },
    b: {
      code: "SQ",
      name: "Singapore Airlines",
      country: "Singapur",
      emoji: "🇸🇬",
      category: "luxury",
      tagline: "Hub SIN, alianza Star Alliance, Skytrax top 3 consistente",
      mainHub: "SIN",
      typicalPriceEur: 720,
      minErrorFareEur: 410,
      loyaltyProgram: "KrisFlyer",
      skytraxStars: 5,
    },
    criteria: [
      { label: "Business class", aScore: 9, bScore: 10, winner: "b", note: "SQ Suites en A380 (cuarto privado con cama doble) > CX The Room. Pero CX The Room en 777 muy buena 1-2-1" },
      { label: "Economy long-haul", aScore: 9, bScore: 10, winner: "b", note: "SQ pitch 32in + comida + servicio consistentemente top; CX excelente también" },
      { label: "Hub experiencia", aScore: 7, bScore: 10, winner: "b", note: "Changi SIN #1 mundial varios años (Jewel waterfall); HKG bueno pero más funcional" },
      { label: "Red destinos Europa-Asia", aScore: 8, bScore: 8, winner: "tie", note: "CX desde MAD/BCN via HKG; SQ desde MAD/BCN via SIN (frecuencia similar)" },
      { label: "Precio típico ES-Asia", aScore: 8, bScore: 7, winner: "a", note: "CX €30-80 más barato MAD/BCN-BKK/HKG/MNL típico; SQ premium price" },
      { label: "Programa fidelidad", aScore: 8, bScore: 9, winner: "b", note: "KrisFlyer sweet spots brutales (35K Saver SIN-Tokyo); Asia Miles bueno con OneWorld" },
      { label: "Conexión Oceanía", aScore: 7, bScore: 9, winner: "b", note: "SQ líder Australia (6× día SYD/MEL/PER); CX presente pero menor frecuencia" },
    ],
    verdict:
      "Singapore Airlines es la elección si quieres lo mejor en producto y eres Star Alliance. Cathay Pacific es ligeramente más barata y excelente en Oneworld (Avios). Para Tokio/Bangkok/Manila, Cathay vía HKG suele ser más barata y rápida. Para Sídney/Melbourne, Singapore es referencia. KrisFlyer mejores sweet spots; Asia Miles transferible Avios = canjeable Iberia/BA.",
    pickA: [
      "Destinos Tokio, Bangkok, Manila, Singapur (vía HKG)",
      "Oneworld frequent flyer (status BA/Iberia)",
      "Asia Miles transfer a Avios (uso en Europa)",
      "Precio €30-80 menos importa",
    ],
    pickB: [
      "Australia/Nueva Zelanda (mayor frecuencia)",
      "Business class A380 — Suites con cama doble",
      "Star Alliance (status United/Lufthansa/ANA)",
      "Stopover Singapur planeado (mejor experiencia urbana)",
    ],
  },

  // ─── 14. Norwegian vs SAS (Escandinavia low-cost vs legacy) ─────────
  {
    slug: "norwegian-vs-sas",
    title: "Norwegian vs SAS 2026: cuál elegir para Escandinavia",
    description:
      "Norwegian vs SAS 2026: precios MAD/BCN-OSL/CPH/ARN, equipaje, programa Reward vs EuroBonus, error fares y veredicto.",
    routeContext: "España-Escandinavia",
    a: {
      code: "DY",
      name: "Norwegian",
      country: "Noruega",
      emoji: "🇳🇴",
      category: "low-cost",
      tagline: "Low-cost escandinava, hub OSL, modelo híbrido",
      mainHub: "OSL",
      typicalPriceEur: 145,
      minErrorFareEur: 39,
      loyaltyProgram: "Norwegian Reward",
      skytraxStars: 3,
    },
    b: {
      code: "SK",
      name: "SAS",
      country: "Escandinavia",
      emoji: "🇸🇪",
      category: "full-service",
      tagline: "Bandera escandinava, alianza SkyTeam (post-2024)",
      mainHub: "CPH",
      typicalPriceEur: 220,
      minErrorFareEur: 89,
      loyaltyProgram: "EuroBonus / SkyTeam",
      skytraxStars: 3,
    },
    criteria: [
      { label: "Precio base", aScore: 9, bScore: 6, winner: "a", note: "Norwegian €60-100 más barato MAD/BCN-OSL/CPH típico" },
      { label: "Equipaje incluido", aScore: 5, bScore: 7, winner: "b", note: "SAS Go Smart incluye 23kg facturada; Norwegian Lowfare = solo carry-on" },
      { label: "Producto cabina", aScore: 5, bScore: 7, winner: "b", note: "SAS comida + bebida en EU; Norwegian vending pago" },
      { label: "Red destinos", aScore: 6, bScore: 8, winner: "b", note: "SAS 90+ destinos red feeder norte; Norwegian 60+ centrada en EU" },
      { label: "Error fares frecuencia", aScore: 8, bScore: 5, winner: "a", note: "Norwegian glitches frecuentes BCN-OSL €39-69 RT; SAS pricing más estable" },
      { label: "Puntualidad", aScore: 6, bScore: 7, winner: "b", note: "SAS 82% on-time 2025; Norwegian 76%" },
      { label: "Programa fidelidad", aScore: 5, bScore: 8, winner: "b", note: "EuroBonus SkyTeam tras 2024 = útil con KLM/Air France; Norwegian Reward modesto" },
    ],
    verdict:
      "Norwegian gana en precio puro y travel hacking (error fares €39-69 BCN-OSL frecuentes). SAS gana en producto, red y programa (EuroBonus ahora SkyTeam = útil con KLM/Air France/Delta). Si vuelas sin equipaje y precio importa, Norwegian. Si llevas familia con maletas o quieres acumular millas SkyTeam, SAS sale igual o mejor sumando extras.",
    pickA: [
      "Vuelo sin equipaje facturado",
      "Travel hacking — error fares Escandinavia",
      "Compras last-minute (Norwegian más flexible)",
      "Rutas BCN-OSL, MAD-OSL directas",
    ],
    pickB: [
      "Familia con equipaje facturado",
      "EuroBonus SkyTeam (KLM, Air France, Delta status)",
      "Puntualidad importa (vuelos conexión Asia/USA)",
      "Comida + servicio incluido",
    ],
  },

  // ─── 15. KLM vs Lufthansa (legacy EU norte) ─────────────────────────
  {
    slug: "klm-vs-lufthansa",
    title: "KLM vs Lufthansa 2026: cuál legacy EU para conexión",
    description:
      "KLM vs Lufthansa 2026: hub AMS vs FRA/MUC, alianzas SkyTeam vs Star Alliance, business class, error fares, programa Flying Blue vs Miles & More.",
    routeContext: "Europa hub conexión transatlántica",
    a: {
      code: "KL",
      name: "KLM",
      country: "Países Bajos",
      emoji: "🇳🇱",
      category: "full-service",
      tagline: "Aerolínea más antigua del mundo (1919), hub AMS, SkyTeam",
      mainHub: "AMS",
      typicalPriceEur: 320,
      minErrorFareEur: 145,
      loyaltyProgram: "Flying Blue / SkyTeam",
      skytraxStars: 4,
    },
    b: {
      code: "LH",
      name: "Lufthansa",
      country: "Alemania",
      emoji: "🇩🇪",
      category: "full-service",
      tagline: "Bandera alemana, hubs FRA + MUC, Star Alliance",
      mainHub: "FRA",
      typicalPriceEur: 340,
      minErrorFareEur: 162,
      loyaltyProgram: "Miles & More / Star Alliance",
      skytraxStars: 4,
    },
    criteria: [
      { label: "Hub experiencia", aScore: 8, bScore: 7, winner: "a", note: "AMS Schiphol más rápido conexión 50min mín, layout simple; FRA/MUC funcionales pero más laberínticos" },
      { label: "Red transatlántica", aScore: 8, bScore: 9, winner: "b", note: "Lufthansa 30+ destinos USA via FRA/MUC; KLM 18+ via AMS" },
      { label: "Business class", aScore: 7, bScore: 8, winner: "b", note: "Lufthansa Allegris (rollout 2024-26) Business Premium superior; KLM World Business sólido pero más antiguo" },
      { label: "Precio típico ES-USA", aScore: 8, bScore: 7, winner: "a", note: "KLM €30-80 más barato MAD/BCN-USA East Coast vía AMS típico" },
      { label: "Programa fidelidad", aScore: 8, bScore: 6, winner: "a", note: "Flying Blue Promo Awards (descuentos 25-50% mensuales); Miles & More cobra impuestos altos en redenciones" },
      { label: "Cancelaciones/huelgas", aScore: 7, bScore: 5, winner: "a", note: "Lufthansa huelgas frecuentes 2023-25 (Verdi, Cockpit); KLM más estable laboralmente" },
      { label: "Servicio/comida", aScore: 7, bScore: 7, winner: "tie", note: "Ambos producto consistente Europa; ligero edge KLM en transat" },
    ],
    verdict:
      "KLM es la elección honesta para vuelos transatlánticos desde España: hub AMS más rápido, precios €30-80 menos, Flying Blue tiene Promo Awards mensuales (25-50% descuento millas). Lufthansa gana en red USA bruta (más destinos) y producto Allegris business cuando esté disponible (2024-26 rollout). Si haces conexión USA East Coast, KLM. Si vas a destinos secundarios USA o Asia, Lufthansa.",
    pickA: [
      "Destinos USA East Coast (NYC, BOS, MIA)",
      "Flying Blue Promo Awards (mensual 25-50% off)",
      "Conexión rápida — AMS 50min mínimo",
      "SkyTeam frequent flyer (Delta, Air France)",
    ],
    pickB: [
      "Destinos USA Midwest/West Coast (LAX, SFO, ORD)",
      "Vuelos a destinos secundarios Asia/India",
      "Star Alliance (United, ANA, Singapore)",
      "Allegris Business Premium 2024-26 disponible",
    ],
  },

  // ─── 16. Aer Lingus vs British Airways (Atlántico Norte) ────────────
  {
    slug: "aer-lingus-vs-british-airways",
    title: "Aer Lingus vs British Airways 2026: cuál para USA East Coast",
    description:
      "Aer Lingus vs British Airways 2026: hub DUB vs LHR, business class, AAdvantage vs Avios, error fares trasatlánticos desde España.",
    routeContext: "España vía DUB/LHR a USA East Coast",
    a: {
      code: "EI",
      name: "Aer Lingus",
      country: "Irlanda",
      emoji: "🇮🇪",
      category: "full-service",
      tagline: "Hub DUB con preclearance USA, partner Oneworld",
      mainHub: "DUB",
      typicalPriceEur: 320,
      minErrorFareEur: 145,
      loyaltyProgram: "AerClub / Avios",
      skytraxStars: 4,
    },
    b: {
      code: "BA",
      name: "British Airways",
      country: "Reino Unido",
      emoji: "🇬🇧",
      category: "full-service",
      tagline: "Bandera UK, hub LHR, alianza Oneworld",
      mainHub: "LHR",
      typicalPriceEur: 360,
      minErrorFareEur: 175,
      loyaltyProgram: "Executive Club / Avios",
      skytraxStars: 4,
    },
    criteria: [
      { label: "Precio típico ES-USA", aScore: 8, bScore: 7, winner: "a", note: "Aer Lingus €30-60 más barato MAD/BCN-USA East Coast vía DUB en 60% rutas" },
      { label: "Pre-clearance USA", aScore: 10, bScore: 5, winner: "a", note: "DUB pre-clearance USA = aterrizas como vuelo doméstico (sin colas inmigración); LHR no" },
      { label: "Producto business", aScore: 7, bScore: 8, winner: "b", note: "BA Club Suite 1-2-1 con puerta nuevo (rollout 2024); Aer Lingus Business sólido pero más antiguo" },
      { label: "Red destinos", aScore: 6, bScore: 9, winner: "b", note: "BA: 200+ destinos vía LHR; Aer Lingus 90+ vía DUB" },
      { label: "Equipaje incluido", aScore: 7, bScore: 7, winner: "tie", note: "Ambos 23kg medium+ EU; 23-32kg long-haul" },
      { label: "Programa fidelidad", aScore: 7, bScore: 9, winner: "b", note: "BA Executive Club Avios + status BAEC global; AerClub más limitado pero transferible Avios" },
      { label: "Hassles LHR vs DUB", aScore: 9, bScore: 6, winner: "a", note: "DUB conexión 60min mín, terminal único; LHR T3-T5 traslados, conexiones 75-90min" },
    ],
    verdict:
      "Aer Lingus gana para vuelos USA East Coast desde España (NYC, BOS, MIA, ORD): €30-60 más barato típico, pre-clearance USA en DUB es game-changer (aterrizas en USA como doméstico, sin colas), conexión 60min mín. BA gana en producto business class (Club Suite nuevo), red global (vuelos Asia/África) y status Avios elite. Para escapadas East Coast → Aer Lingus. Para business luxury o destinos Asia/África → BA.",
    pickA: [
      "Vuelos USA East Coast (NYC, BOS, ORD, MIA, IAD)",
      "Pre-clearance USA importa (familias, conexiones tight)",
      "Precio €30-60 menos importa",
      "Conexión rápida (60min DUB)",
    ],
    pickB: [
      "Business class — Club Suite nuevo",
      "Destinos Asia, África o Oriente Medio",
      "BA Executive Club status Gold/Silver",
      "Acumulación Avios elite con BA frequent flyer",
    ],
  },

  // ─── 17. easyJet vs Vueling (BCN regional low-cost) ─────────────────
  {
    slug: "easyjet-vs-vueling",
    title: "easyJet vs Vueling 2026: low-cost desde Barcelona",
    description:
      "easyJet vs Vueling 2026 desde BCN: precios short-haul EU, equipaje, programa Avios, error fares y veredicto cazador honesto.",
    routeContext: "BCN-Europa short-haul",
    a: {
      code: "U2",
      name: "easyJet",
      country: "Reino Unido",
      emoji: "🇬🇧",
      category: "low-cost",
      tagline: "Low-cost UK, fuerte BCN secundario, primary airports",
      mainHub: "LGW",
      typicalPriceEur: 105,
      minErrorFareEur: 29,
      loyaltyProgram: "easyJet Plus (€169/año)",
      skytraxStars: 3,
    },
    b: {
      code: "VY",
      name: "Vueling",
      country: "España",
      emoji: "🇪🇸",
      category: "low-cost",
      tagline: "Low-cost del grupo IAG, hub BCN",
      mainHub: "BCN",
      typicalPriceEur: 95,
      minErrorFareEur: 19,
      loyaltyProgram: "Vueling Club / Avios",
      skytraxStars: 3,
    },
    criteria: [
      { label: "Precio base BCN-EU", aScore: 7, bScore: 9, winner: "b", note: "Vueling €10-20 más barato típico BCN-Roma/París/Lisboa; easyJet competitivo en BCN-LGW/CDG" },
      { label: "Equipaje incluido", aScore: 7, bScore: 5, winner: "a", note: "easyJet: small bag + cabin bag 45×36×20cm. Vueling: solo personal item, todo extra" },
      { label: "Cobertura destinos desde BCN", aScore: 7, bScore: 9, winner: "b", note: "Vueling: 130+ EU + Marruecos desde BCN. easyJet: 60+ destinos BCN, peso UK + Suiza" },
      { label: "Programa fidelidad", aScore: 5, bScore: 8, winner: "b", note: "Vueling Club + Avios transferible IAG (Iberia/BA). easyJet Plus €169/año perks limitados" },
      { label: "Puntualidad", aScore: 8, bScore: 7, winner: "a", note: "easyJet 79% on-time; Vueling 78%. Casi empate" },
      { label: "Error fares frecuencia", aScore: 6, bScore: 8, winner: "b", note: "Vueling glitches frecuentes BCN-EU €19-39 RT; easyJet menos volátil pero ocurre" },
      { label: "Aeropuertos", aScore: 9, bScore: 9, winner: "tie", note: "Ambos primary (BCN, LGW, CDG, FCO, AMS). Sin tema secundarios" },
    ],
    verdict:
      "Vueling es generalmente mejor desde Barcelona: más rutas EU directas, precios €10-20 menos, programa Avios transferible Iberia/BA. easyJet gana en equipaje incluido (cabin bag grande free) y rutas BCN-UK/Suiza específicas. Si vuelas con familia y bag, easyJet sale igual o mejor sumando extras Vueling.",
    pickA: [
      "Vuelos BCN-UK (LGW, MAN, BHX, EDI)",
      "BCN-Suiza (GVA, BSL, ZRH)",
      "Llevas cabin bag grande (45×36×20cm free)",
      "easyJet Plus member (4+ vuelos al año)",
    ],
    pickB: [
      "Vuelos BCN-EU resto (Italia, Francia, Alemania, Portugal)",
      "BCN-Marruecos directo (RAK, FEZ, CMN)",
      "Acumulación Avios para uso Iberia/BA",
      "Solo mochila pequeña — Vueling más barato",
    ],
  },

  // ─── 18. Iberia vs LATAM Airlines (España-Sudamérica) ───────────────
  {
    slug: "iberia-vs-latam",
    title: "Iberia vs LATAM Airlines 2026: cuál para Sudamérica",
    description:
      "Iberia vs LATAM 2026: precios MAD-Sudamérica, business class, LATAM Pass vs Avios, conexión Brasil/Argentina/Chile.",
    routeContext: "España-Sudamérica continental",
    a: {
      code: "IB",
      name: "Iberia",
      country: "España",
      emoji: "🇪🇸",
      category: "full-service",
      tagline: "Bandera España, hub MAD, líder histórico Latam directo",
      mainHub: "MAD",
      typicalPriceEur: 580,
      minErrorFareEur: 295,
      loyaltyProgram: "Iberia Plus / Avios",
      skytraxStars: 4,
    },
    b: {
      code: "LA",
      name: "LATAM Airlines",
      country: "Chile/Brasil",
      emoji: "🇨🇱",
      category: "full-service",
      tagline: "Líder Sudamérica, hubs SCL/GRU, alianza Oneworld",
      mainHub: "GRU",
      typicalPriceEur: 540,
      minErrorFareEur: 260,
      loyaltyProgram: "LATAM Pass / Oneworld",
      skytraxStars: 4,
    },
    criteria: [
      { label: "Precio MAD-Sudamérica", aScore: 7, bScore: 8, winner: "b", note: "LATAM €40-100 más barato MAD-GRU/EZE/SCL típico (vuelo directo MAD-GRU operado por ambas)" },
      { label: "Vuelo directo Sudamérica", aScore: 9, bScore: 8, winner: "a", note: "Iberia: directo a 18 destinos Latam. LATAM: directo MAD-GRU + conexión SCL hub" },
      { label: "Producto business", aScore: 8, bScore: 8, winner: "tie", note: "Ambos lie-flat 1-2-1 long-haul. Iberia Business Plus refrescada 2024; LATAM Premium Business sólido" },
      { label: "Programa fidelidad ES", aScore: 9, bScore: 6, winner: "a", note: "Avios mucho más útil en Europa (BA, IB, Aer Lingus, Vueling). LATAM Pass requiere uso en Sudamérica" },
      { label: "Red Sudamérica interna", aScore: 6, bScore: 10, winner: "b", note: "LATAM: 100+ destinos internos Sudamérica (Patagonia, Amazonia, Andes). Iberia: solo capitales" },
      { label: "Error fares ES-Sudamérica", aScore: 7, bScore: 8, winner: "b", note: "LATAM glitches MAD-GRU €299-450 RT observados 2024-25; Iberia €395 RT pero menos frecuentes" },
      { label: "Puntualidad", aScore: 8, bScore: 7, winner: "a", note: "Iberia 88% on-time 2025; LATAM 81% (delays Brasil internos)" },
    ],
    verdict:
      "Iberia gana si tu viaje termina en la capital (BUE, SCL, BOG, LIM, MEX): vuelo directo, precio similar, programa Avios brutalmente más útil en EU. LATAM gana si vas a destinos internos Sudamérica (Patagonia, Iguazú, Cusco): cobertura interna 100+ destinos imbatible. Combo óptimo: Iberia ida (con Avios) + LATAM doméstico al destino interno.",
    pickA: [
      "Destino capital Sudamérica (BUE, SCL, BOG, LIM, MEX)",
      "Avios para canjes EU futuros",
      "Vuelo directo importa (sin escala SCL/GRU)",
      "Status Iberia Plus elite (lounges, bono millas)",
    ],
    pickB: [
      "Destino interno Sudamérica (Patagonia, Cusco, Iguazú, Manaus)",
      "Múltiples vuelos internos durante el viaje",
      "Precio mínimo €40-100 menos importa",
      "Conexión SCL como stopover (turismo Chile)",
    ],
  },

  // ─── 19. Aeroméxico vs Iberia (España-México) ───────────────────────
  {
    slug: "aeromexico-vs-iberia",
    title: "Aeroméxico vs Iberia 2026: cuál para España-México",
    description:
      "Aeroméxico vs Iberia 2026: precios MAD-MEX/CUN, business class, programa Premier vs Avios, error fares y veredicto cazador.",
    routeContext: "España-México (MEX, CUN, GDL, MTY)",
    a: {
      code: "AM",
      name: "Aeroméxico",
      country: "México",
      emoji: "🇲🇽",
      category: "full-service",
      tagline: "Bandera México, hub MEX, alianza SkyTeam",
      mainHub: "MEX",
      typicalPriceEur: 540,
      minErrorFareEur: 285,
      loyaltyProgram: "Aeroméxico Rewards / SkyTeam",
      skytraxStars: 4,
    },
    b: {
      code: "IB",
      name: "Iberia",
      country: "España",
      emoji: "🇪🇸",
      category: "full-service",
      tagline: "Bandera España, hub MAD, alianza Oneworld",
      mainHub: "MAD",
      typicalPriceEur: 590,
      minErrorFareEur: 320,
      loyaltyProgram: "Iberia Plus / Avios",
      skytraxStars: 4,
    },
    criteria: [
      { label: "Precio MAD-MEX directo", aScore: 8, bScore: 7, winner: "a", note: "Aeroméxico €30-80 más barato MAD-MEX típico; ambas vuelan directo diario" },
      { label: "Vuelos directos México", aScore: 8, bScore: 9, winner: "b", note: "Iberia: directo MAD-MEX + GDL + MTY. Aeroméxico: solo MEX directo desde MAD" },
      { label: "Producto business", aScore: 7, bScore: 8, winner: "b", note: "Iberia Business Plus 2-2-2 lie-flat consistente; Aeroméxico Clase Premier 1-2-1 buena pero variable" },
      { label: "Programa fidelidad ES", aScore: 6, bScore: 9, winner: "b", note: "Avios Iberia Plus = canjeable Oneworld (BA, AA). Aeroméxico Rewards SkyTeam requiere uso AF/KL/Delta" },
      { label: "Cobertura interna México", aScore: 10, bScore: 5, winner: "a", note: "Aeroméxico: 90+ destinos internos México (Cancún, Mérida, Oaxaca, Tijuana). Iberia: codeshare AA solo algunos" },
      { label: "Equipaje", aScore: 8, bScore: 7, winner: "a", note: "Aeroméxico: 2 maletas 23kg gratis Premier; Iberia: 1 maleta 23kg medium+, 2 maletas Business" },
      { label: "Hub experiencia MEX vs MAD", aScore: 6, bScore: 8, winner: "b", note: "MAD T4 fluido, MEX T2 mejorado pero más caótico" },
    ],
    verdict:
      "Aeroméxico gana si tu plan es México con destinos internos (Yucatán, Baja California, Pacífico): cobertura interna 90+ destinos imbatible, precio €30-80 menos directo MAD-MEX. Iberia gana si solo vas a Ciudad de México o Cancún directo, valoras Avios para Europa, o vuelas también a USA (codeshare AA).",
    pickA: [
      "Múltiples destinos internos México (Yucatán, Pacífico, Baja)",
      "Cancún sin necesidad de stop en MEX",
      "SkyTeam frequent flyer (AF, KL, Delta)",
      "2 maletas 23kg gratis Premier importa",
    ],
    pickB: [
      "Solo vas a Ciudad de México o Guadalajara",
      "Acumular Avios para uso EU futuro",
      "Connection a USA con AA (codeshare)",
      "Iberia Plus elite status",
    ],
  },

  // ─── 20. ITA Airways vs Iberia (España-Italia + transat) ────────────
  {
    slug: "ita-vs-iberia",
    title: "ITA Airways vs Iberia 2026: España-Italia y transat comparada",
    description:
      "ITA Airways vs Iberia 2026: BCN/MAD-Roma, business class A350, programa Volare vs Avios, error fares 2026 post-Lufthansa Group.",
    routeContext: "España-Italia + transat vía FCO/MAD",
    a: {
      code: "AZ",
      name: "ITA Airways",
      country: "Italia",
      emoji: "🇮🇹",
      category: "full-service",
      tagline: "Bandera Italia (post-Alitalia), hub FCO, parte Lufthansa Group 2024",
      mainHub: "FCO",
      typicalPriceEur: 195,
      minErrorFareEur: 79,
      loyaltyProgram: "Volare / SkyTeam (transición a Star 2025-26)",
      skytraxStars: 4,
    },
    b: {
      code: "IB",
      name: "Iberia",
      country: "España",
      emoji: "🇪🇸",
      category: "full-service",
      tagline: "Bandera España, hub MAD, alianza Oneworld",
      mainHub: "MAD",
      typicalPriceEur: 220,
      minErrorFareEur: 95,
      loyaltyProgram: "Iberia Plus / Avios",
      skytraxStars: 4,
    },
    criteria: [
      { label: "Precio BCN/MAD-Roma directo", aScore: 8, bScore: 7, winner: "a", note: "ITA €25-50 más barato BCN/MAD-FCO/MXP típico, especialmente desde MAD" },
      { label: "Producto business", aScore: 8, bScore: 8, winner: "tie", note: "ITA A350 Business 1-2-1 lie-flat (refrescado 2023). Iberia Business Plus también 2-2-2 lie-flat" },
      { label: "Red Italia interna", aScore: 9, bScore: 5, winner: "a", note: "ITA: 30+ destinos internos Italia + Sicilia/Cerdeña. Iberia: codeshare BA (no directo)" },
      { label: "Programa fidelidad", aScore: 6, bScore: 8, winner: "b", note: "Avios brutalmente útil EU. Volare en transición SkyTeam→Star 2025-26 (incertidumbre)" },
      { label: "Vuelos transat", aScore: 7, bScore: 8, winner: "b", note: "Iberia: 18+ destinos Latam directos. ITA: 10+ destinos USA + Asia limitado" },
      { label: "Puntualidad", aScore: 7, bScore: 8, winner: "b", note: "Iberia 88% on-time 2025; ITA 82% (mejorando post-Alitalia chaos)" },
      { label: "Equipaje", aScore: 7, bScore: 7, winner: "tie", note: "Ambos 23kg medium+ EU; 23kg long-haul economy, 32kg business" },
    ],
    verdict:
      "ITA Airways gana para España-Italia directo (€25-50 menos, A350 nuevo, red interna Italia 30+ destinos). Iberia gana para acumulación Avios (programa más útil), red Latam (18+ directos) y status Oneworld. Si tu viaje es solo Roma-España, ITA. Si combinas Italia con otros destinos EU/Latam o quieres Avios, Iberia.",
    pickA: [
      "Vuelos directos BCN/MAD-Italia (FCO, MXP, NAP, VCE)",
      "Múltiples destinos internos Italia (Sicilia, Cerdeña, Pulla)",
      "Business class A350 refrescada 2023",
      "Precio €25-50 menos importa",
    ],
    pickB: [
      "Acumulación Avios para uso futuro EU/Latam",
      "Vuelo Italia + Latam combinado (Roma→Madrid→BUE)",
      "Status Iberia Plus / Oneworld global",
      "Estabilidad alianza (Volare en transición incierta)",
    ],
  },

  // ─── 21. Swiss vs Lufthansa (Star Alliance EU central) ──────────────
  {
    slug: "swiss-vs-lufthansa",
    title: "Swiss vs Lufthansa 2026: cuál Star Alliance hub elegir",
    description:
      "Swiss vs Lufthansa 2026: ZRH vs FRA, business class, Miles & More compartido, error fares ES-Asia/USA via Suiza vs Alemania.",
    routeContext: "España vía ZRH/FRA a USA/Asia",
    a: {
      code: "LX",
      name: "Swiss",
      country: "Suiza",
      emoji: "🇨🇭",
      category: "luxury",
      tagline: "Bandera Suiza, parte Lufthansa Group, hub ZRH premium",
      mainHub: "ZRH",
      typicalPriceEur: 380,
      minErrorFareEur: 195,
      loyaltyProgram: "Miles & More / Star Alliance",
      skytraxStars: 4,
    },
    b: {
      code: "LH",
      name: "Lufthansa",
      country: "Alemania",
      emoji: "🇩🇪",
      category: "full-service",
      tagline: "Bandera alemana, hubs FRA + MUC, Star Alliance",
      mainHub: "FRA",
      typicalPriceEur: 340,
      minErrorFareEur: 162,
      loyaltyProgram: "Miles & More / Star Alliance",
      skytraxStars: 4,
    },
    criteria: [
      { label: "Producto cabina", aScore: 9, bScore: 7, winner: "a", note: "Swiss Business 1-2-1 lie-flat refrescada 2024 + chocolate suizo. LH Business mixta (Allegris rollout 2024-26)" },
      { label: "Precio típico ES-Asia", aScore: 6, bScore: 8, winner: "b", note: "LH €40-80 más barato MAD/BCN-BKK/SIN/HKG vía FRA típico" },
      { label: "Hub experiencia", aScore: 9, bScore: 6, winner: "a", note: "ZRH airport top 5 mundial — eficiente, vistas Alpes. FRA caótico T1-T2, MUC mejor" },
      { label: "Red destinos USA", aScore: 7, bScore: 9, winner: "b", note: "LH 30+ destinos USA via FRA/MUC. Swiss 8 destinos USA" },
      { label: "Puntualidad", aScore: 8, bScore: 6, winner: "a", note: "Swiss 84% on-time 2025 (top 5 EU). LH 78% (huelgas Verdi/Cockpit recurrentes)" },
      { label: "Programa fidelidad", aScore: 7, bScore: 7, winner: "tie", note: "Compartido Miles & More — cobran impuestos altos en redenciones idéntico" },
      { label: "Conexión vía hub", aScore: 9, bScore: 6, winner: "a", note: "ZRH conexión 40min mín, terminal único pequeño. FRA conexión 60-90min, layout complejo" },
    ],
    verdict:
      "Swiss gana en producto + experiencia hub (ZRH es top mundial, conexión 40min, lie-flat refrescado). Lufthansa gana en precio + red USA (€40-80 menos, 30+ destinos USA vs 8). Si haces conexión vía Suiza es mucho menos hassle. Si vuelas USA Midwest/West Coast → LH. Si valoras experiencia luxury intra-EU desde España → Swiss.",
    pickA: [
      "Conexión rápida importa (ZRH 40min mín)",
      "Producto business luxury (Swiss > LH actual)",
      "Stopover Zurich planeado",
      "Puntualidad crítica (huelgas LH recurrentes)",
    ],
    pickB: [
      "Vuelos USA Midwest/West Coast (LAX, ORD, SFO)",
      "Precio €40-80 menos importa",
      "Red Asia/India destinos secundarios",
      "Allegris Business Premium rollout disponible",
    ],
  },

  // ─── 22. Virgin Atlantic vs British Airways (UK transat) ────────────
  {
    slug: "virgin-vs-british-airways",
    title: "Virgin Atlantic vs British Airways 2026: UK transat compared",
    description:
      "Virgin Atlantic vs British Airways 2026: Upper Class vs Club Suite, Flying Club vs Avios, error fares ES vía LHR/MAN a USA.",
    routeContext: "Reino Unido transatlántico USA",
    a: {
      code: "VS",
      name: "Virgin Atlantic",
      country: "Reino Unido",
      emoji: "🇬🇧",
      category: "luxury",
      tagline: "Disrupción luxury UK, hub LHR/MAN, alianza SkyTeam",
      mainHub: "LHR",
      typicalPriceEur: 420,
      minErrorFareEur: 215,
      loyaltyProgram: "Flying Club / SkyTeam (Delta, Air France)",
      skytraxStars: 4,
    },
    b: {
      code: "BA",
      name: "British Airways",
      country: "Reino Unido",
      emoji: "🇬🇧",
      category: "full-service",
      tagline: "Bandera UK, hub LHR, alianza Oneworld",
      mainHub: "LHR",
      typicalPriceEur: 380,
      minErrorFareEur: 175,
      loyaltyProgram: "Executive Club / Avios",
      skytraxStars: 4,
    },
    criteria: [
      { label: "Business class producto", aScore: 9, bScore: 8, winner: "a", note: "Virgin Upper Class A350 1-1 con bar comunal en cabina (único). BA Club Suite 1-2-1 con puerta sólido pero más estándar" },
      { label: "Economy", aScore: 8, bScore: 7, winner: "a", note: "Virgin Economy mejor IFE + ambiente luxury cabin (purple light, vibe boutique). BA correcto pero más conservador" },
      { label: "Red destinos transat", aScore: 7, bScore: 9, winner: "b", note: "BA: 28+ destinos USA + Caribe + LATAM. Virgin: 12 destinos USA principales" },
      { label: "Precio típico ES-USA", aScore: 7, bScore: 8, winner: "b", note: "BA €40-80 más barato MAD/BCN-USA via LHR típico (Virgin premium)" },
      { label: "Programa fidelidad", aScore: 7, bScore: 9, winner: "b", note: "Avios Oneworld global con BA + IB + AA + Aer Lingus = imbatible. Flying Club SkyTeam útil con Delta + AF/KLM" },
      { label: "Manchester hub option", aScore: 9, bScore: 6, winner: "a", note: "Virgin opera MAN-USA directo (alternativa a LHR). BA solo LHR/LGW" },
      { label: "Conexión LHR experience", aScore: 7, bScore: 8, winner: "b", note: "BA T5 dedicada — conexión 75min. Virgin T3 — conexión 90-120min con T2/T5" },
    ],
    verdict:
      "Virgin Atlantic gana en producto cabina (Upper Class bar comunal único, economy mejor IFE) y disponibilidad MAN como alternativa a LHR. BA gana en red (28 destinos USA vs 12), precio (€40-80 menos), y programa Avios (Oneworld global, partners imbatibles). Si vuelas USA East Coast principal y valoras experiencia luxury → Virgin. Si vuelas USA destino secundario o quieres Avios → BA.",
    pickA: [
      "Salida Manchester (MAN-USA directo)",
      "Business class luxury — bar comunal A350",
      "SkyTeam frequent flyer (Delta, Air France, KLM)",
      "Experiencia cabina premium economy importa",
    ],
    pickB: [
      "Destino USA secundario (12 vs 28)",
      "Acumulación Avios global Oneworld",
      "Precio €40-80 menos importa",
      "Conexión T5 dedicada (75min)",
    ],
  },

  // ─── 23. Finnair vs SAS (Escandinavia + Asia stopover) ──────────────
  {
    slug: "finnair-vs-sas",
    title: "Finnair vs SAS 2026: cuál escandinava + Asia comparada",
    description:
      "Finnair vs SAS 2026: HEL vs CPH, business class, Asia stopover, Finnair Plus vs EuroBonus SkyTeam, error fares.",
    routeContext: "Escandinavia + Asia stopover",
    a: {
      code: "AY",
      name: "Finnair",
      country: "Finlandia",
      emoji: "🇫🇮",
      category: "luxury",
      tagline: "Bandera Finlandia, hub HEL, ruta corta a Asia, Oneworld",
      mainHub: "HEL",
      typicalPriceEur: 360,
      minErrorFareEur: 165,
      loyaltyProgram: "Finnair Plus / Oneworld",
      skytraxStars: 4,
    },
    b: {
      code: "SK",
      name: "SAS",
      country: "Escandinavia",
      emoji: "🇸🇪",
      category: "full-service",
      tagline: "Bandera escandinava, hub CPH, alianza SkyTeam (post-2024)",
      mainHub: "CPH",
      typicalPriceEur: 320,
      minErrorFareEur: 135,
      loyaltyProgram: "EuroBonus / SkyTeam",
      skytraxStars: 3,
    },
    criteria: [
      { label: "Ruta a Asia", aScore: 10, bScore: 6, winner: "a", note: "HEL es punto más cercano EU a Asia (Tokio 9h45min vs LHR 11h30min). Finnair líder histórico Asia desde EU" },
      { label: "Producto business", aScore: 8, bScore: 7, winner: "a", note: "Finnair A350 Business 1-2-1 reverse herringbone refrescada. SAS Plus suficiente pero menos premium" },
      { label: "Red Sudeste Asiático", aScore: 9, bScore: 5, winner: "a", note: "Finnair: 11 destinos Asia incl. Tokio/Osaka/Singapur/Bangkok/Hong Kong. SAS: 4 destinos Asia" },
      { label: "Red EU/USA", aScore: 6, bScore: 8, winner: "b", note: "SAS 90+ destinos red feeder Nordic + transat USA. Finnair 70+ centrada Asia" },
      { label: "Programa fidelidad", aScore: 7, bScore: 8, winner: "b", note: "EuroBonus SkyTeam (post-2024) = útil con KLM/AF/Delta. Finnair Plus aislado (Oneworld)" },
      { label: "Precio ES-Asia vía hub", aScore: 7, bScore: 6, winner: "a", note: "Finnair €30-80 más barato MAD/BCN-Asia via HEL típico" },
      { label: "Stopover hub", aScore: 8, bScore: 7, winner: "a", note: "Helsinki Stopover gratis + ofertas turismo invernal (auroras boreales). CPH bueno pero menos planificado" },
    ],
    verdict:
      "Finnair gana decisivamente para Asia desde España (€30-80 menos vía HEL, ruta más corta, 11 destinos Asia, business class A350 mejor, stopover Helsinki con auroras boreales). SAS gana en red EU/USA y programa SkyTeam si vuelas frecuente con KLM/AF/Delta. Si tu destino es Asia → Finnair sin duda. Si vuelas USA o Escandinavia interna → SAS.",
    pickA: [
      "Destino Asia (Japón, Sudeste Asiático, China)",
      "Stopover Helsinki invernal con auroras boreales",
      "Business class A350 producto importante",
      "Status Oneworld con BA/IB/AA",
    ],
    pickB: [
      "Destinos Escandinavia + USA East Coast",
      "EuroBonus SkyTeam (KLM, Air France, Delta)",
      "Precio €30-80 menos importa",
      "Familia con maletas (SAS Go Smart 23kg incluido)",
    ],
  },

  // ─── 24. TAP Air Portugal vs Azores Airlines (Portugal+Brasil) ──────
  {
    slug: "tap-vs-azores-airlines",
    title: "TAP vs Azores Airlines 2026: Portugal-Brasil cuál elegir",
    description:
      "TAP Air Portugal vs Azores Airlines 2026: LIS vs PDL, precios España-Brasil, business class, programa Miles&Go vs SATA Imagine.",
    routeContext: "España-Portugal-Brasil + Azores",
    a: {
      code: "TP",
      name: "TAP Air Portugal",
      country: "Portugal",
      emoji: "🇵🇹",
      category: "full-service",
      tagline: "Bandera Portugal, hub LIS, líder Brasil-EU, Star Alliance",
      mainHub: "LIS",
      typicalPriceEur: 480,
      minErrorFareEur: 245,
      loyaltyProgram: "Miles&Go / Star Alliance",
      skytraxStars: 4,
    },
    b: {
      code: "S4",
      name: "Azores Airlines",
      country: "Portugal (Azores)",
      emoji: "🇵🇹",
      category: "regional",
      tagline: "Hub PDL, especialista Azores + Brasil + USA East Coast",
      mainHub: "PDL",
      typicalPriceEur: 520,
      minErrorFareEur: 295,
      loyaltyProgram: "SATA Imagine",
      skytraxStars: 3,
    },
    criteria: [
      { label: "Frecuencia España-Brasil", aScore: 10, bScore: 6, winner: "a", note: "TAP: 8 destinos Brasil directos desde LIS, varias frecuencias diarias. Azores: solo PDL-Brasil con stopover" },
      { label: "Stopover gratis hub", aScore: 9, bScore: 8, winner: "a", note: "TAP Stopover Lisboa 1-5 noches gratis (programa estructurado). Azores PDL Stopover Azores 1-7 noches gratis (más turismo)" },
      { label: "Precio típico ES-Brasil", aScore: 8, bScore: 6, winner: "a", note: "TAP €40-100 más barato MAD/BCN-GRU/GIG típico (pricing engine más volátil)" },
      { label: "Producto business", aScore: 7, bScore: 6, winner: "a", note: "TAP A330neo Business 1-2-1 lie-flat. Azores Business cabin Boeing 757 dated" },
      { label: "Cobertura Azores interna", aScore: 4, bScore: 10, winner: "b", note: "Azores: 9 islas archipiélago + Madeira. TAP: solo PDL/TER directo (sin saltar islas)" },
      { label: "Programa fidelidad", aScore: 8, bScore: 5, winner: "a", note: "Miles&Go Star Alliance global. SATA Imagine local + códigos compartidos limitados" },
      { label: "Error fares frecuencia", aScore: 8, bScore: 6, winner: "a", note: "TAP glitches MAD/BCN-Brasil €450-600 RT observados 2024-25; Azores menos frecuentes" },
    ],
    verdict:
      "TAP gana decisivamente para Brasil desde España: 8 destinos directos LIS-Brasil, frecuencias múltiples, precio €40-100 menos, business A330neo refrescada, Star Alliance, error fares más frecuentes. Azores Airlines gana SOLO si tu plan es viaje a Azores archipiélago (9 islas) o combinas Azores + Brasil con stopover en mid-Atlantic. Para 95% de viajes ES-Brasil → TAP.",
    pickA: [
      "España-Brasil directo (GRU, GIG, FOR, REC, SSA, BSB, BEL, MCZ)",
      "Stopover Lisboa 1-5 noches gratis",
      "Acumular Star Alliance miles (LH/UA/SQ)",
      "Mejor producto business A330neo",
    ],
    pickB: [
      "Viaje a Azores archipiélago (9 islas + Madeira)",
      "Stopover Ponta Delgada turismo natural (avistamiento ballenas, Sete Cidades)",
      "Combo PDL + USA East Coast (BOS/JFK)",
      "Aventura mid-Atlantic poco turística",
    ],
  },

  // ─── 25. Brussels Airlines vs KLM (BRU vs AMS hub) ──────────────────
  {
    slug: "brussels-vs-klm",
    title: "Brussels Airlines vs KLM 2026: hub BRU vs AMS comparada",
    description:
      "Brussels Airlines vs KLM 2026: BRU vs AMS, precios España-África/USA, business class, Miles & More vs Flying Blue.",
    routeContext: "España vía BRU/AMS a África + USA",
    a: {
      code: "SN",
      name: "Brussels Airlines",
      country: "Bélgica",
      emoji: "🇧🇪",
      category: "full-service",
      tagline: "Bandera Bélgica, parte Lufthansa Group, hub BRU, África focus",
      mainHub: "BRU",
      typicalPriceEur: 285,
      minErrorFareEur: 125,
      loyaltyProgram: "Miles & More / Star Alliance",
      skytraxStars: 4,
    },
    b: {
      code: "KL",
      name: "KLM",
      country: "Países Bajos",
      emoji: "🇳🇱",
      category: "full-service",
      tagline: "Aerolínea más antigua del mundo (1919), hub AMS, SkyTeam",
      mainHub: "AMS",
      typicalPriceEur: 320,
      minErrorFareEur: 145,
      loyaltyProgram: "Flying Blue / SkyTeam",
      skytraxStars: 4,
    },
    criteria: [
      { label: "Red África subsahariana", aScore: 10, bScore: 7, winner: "a", note: "Brussels Airlines: 18+ destinos África subsahariana directos (Kinshasa, Yaoundé, Lomé, Cotonou, Luanda). KLM: 12 destinos África" },
      { label: "Red USA/Asia", aScore: 5, bScore: 9, winner: "b", note: "KLM: 18+ USA + Asia red completa. Brussels: codeshare LH/UA, sin red propia transat amplia" },
      { label: "Hub experiencia", aScore: 7, bScore: 9, winner: "b", note: "AMS Schiphol top 5 mundial, conexión 50min mín, layout simple. BRU mid-tier, conexión 60min" },
      { label: "Precio España-África", aScore: 9, bScore: 6, winner: "a", note: "Brussels €60-120 más barato MAD/BCN-África subsahariana típico. KLM premium price" },
      { label: "Programa fidelidad", aScore: 7, bScore: 9, winner: "b", note: "Flying Blue Promo Awards mensuales 25-50% off (mejor programa EU). Miles & More cobra impuestos altos" },
      { label: "Producto business", aScore: 7, bScore: 7, winner: "tie", note: "Ambos lie-flat 1-2-1 long-haul. Calidad similar, ambos refrescados 2023-24" },
      { label: "Puntualidad", aScore: 7, bScore: 9, winner: "b", note: "KLM 89% on-time 2025 (top 3 EU). Brussels 80% (variable África disrupciones)" },
    ],
    verdict:
      "Brussels Airlines gana decisivamente para África subsahariana (18 destinos directos vs 12 KLM, €60-120 menos, ruta única ES-Brussels-Kinshasa/Yaoundé/Lomé). KLM gana para casi todo lo demás (USA, Asia, hub AMS top mundial, Flying Blue Promos brutales, puntualidad 89%). Si tu destino es África subsahariana → Brussels. Si vuelas USA East Coast, Asia, o quieres Flying Blue → KLM.",
    pickA: [
      "Destinos África subsahariana (Kinshasa, Yaoundé, Cotonou, Lomé, Luanda)",
      "Precio €60-120 menos importa",
      "Star Alliance frequent flyer (LH, United, ANA)",
      "Brussels Stopover planeado (cerveza belga + chocolate)",
    ],
    pickB: [
      "USA East Coast directo (NYC, BOS, IAD)",
      "Asia red completa (BKK, HKG, KUL, SIN, etc)",
      "Flying Blue Promo Awards (mensual 25-50% off)",
      "Hub AMS conexión 50min (familia, conexiones tight)",
    ],
  },
];

export function getAirlineComparisonBySlug(slug: string): AirlineComparison | undefined {
  return AIRLINE_COMPARISONS.find((c) => c.slug === slug);
}
