/**
 * airlines.ts — abr-2026x.
 *
 * Catálogo de aerolíneas para las páginas SEO /aerolineas y /aerolineas/[code].
 * Incluye campos para ranking, descripción long-form, hubs principales, rutas
 * típicas desde España, rangos de precio observados por el motor (datos
 * agregados de fase-l in_engine stats).
 *
 * NO carga datos en runtime — todo es estático para que cada página renderice
 * fast como SSG. Si se quisieran rangos en vivo, llamar /api/admin/overview
 * desde server component, pero hoy esto es overkill: las cifras cambian
 * lentamente y el SEO valor no requiere live data.
 */

export type AirlineCategory =
  | "low-cost"
  | "full-service"
  | "luxury"
  | "regional";

export interface Airline {
  /** IATA code (2 letras). Stable identity. */
  code: string;
  /** ICAO 3-letter (info útil pero no clave). */
  icao?: string;
  /** Nombre comercial. */
  name: string;
  /** Categoría operativa. */
  category: AirlineCategory;
  /** País de origen. */
  country: string;
  /** Hubs principales (IATA). */
  hubs: string[];
  /** Top rutas desde España observadas por el motor. */
  popularRoutesFromSpain: Array<{
    route: string; // "MAD-LIS"
    typicalPriceEur: number; // mediana observada
    minPriceEur: number; // error fare floor observado
  }>;
  /** Bullet points clave. */
  keyPoints: string[];
  /** Descripción long-form en ES (2-4 párrafos). */
  description: string;
  /** Logo url (opcional). */
  logoUrl?: string;
}

export const AIRLINES: Airline[] = [
  {
    code: "FR",
    icao: "RYR",
    name: "Ryanair",
    category: "low-cost",
    country: "Irlanda",
    hubs: ["DUB", "STN", "BGY", "MAD", "BCN"],
    popularRoutesFromSpain: [
      { route: "MAD-LIS", typicalPriceEur: 78, minPriceEur: 9 },
      { route: "BCN-FCO", typicalPriceEur: 65, minPriceEur: 12 },
      { route: "AGP-LGW", typicalPriceEur: 58, minPriceEur: 14 },
      { route: "VLC-CRL", typicalPriceEur: 72, minPriceEur: 18 },
    ],
    keyPoints: [
      "Ratio error-fare más alto de Europa: 4-6 glitches anuales en rutas DACH/IT",
      "Pricing en USD interno → bugs de conversión más frecuentes",
      "Política equipaje agresiva — solo bolso pequeño en tarifa básica",
    ],
    description:
      "Ryanair es el mayor low-cost de Europa por pasajeros y, paradójicamente, una de las aerolíneas que más oportunidades genera para el cazador de chollos. Su modelo de yield management hyper-agresivo y los frecuentes ajustes de pricing por divisa producen ventanas de error fares cortas pero potentes (€9-25 ida en rutas que normalmente están a €70-120). \n\nDesde España opera 200+ rutas con base operativa fuerte en MAD, BCN, AGP, VLC, IBZ, PMI y SVQ. Los meses con más leakage observados son enero, febrero y noviembre — la temporada baja real de la mayoría de destinos europeos. \n\nLimitaciones reales: solo bolso pequeño en tarifa básica (cualquier extra cuesta €20-40), salidas desde aeropuertos secundarios (Beauvais en lugar de CDG), y el riesgo de cancelación operativa los días de huelga sindical. Para un fin de semana europeo en mes correcto, sigue siendo la mejor relación precio/capacidad del continente.",
  },
  {
    code: "U2",
    icao: "EZY",
    name: "easyJet",
    category: "low-cost",
    country: "Reino Unido",
    hubs: ["LGW", "STN", "LTN", "MAN", "GVA", "CDG", "BCN"],
    popularRoutesFromSpain: [
      { route: "BCN-LGW", typicalPriceEur: 95, minPriceEur: 28 },
      { route: "MAD-AMS", typicalPriceEur: 110, minPriceEur: 35 },
      { route: "PMI-LGW", typicalPriceEur: 88, minPriceEur: 22 },
    ],
    keyPoints: [
      "Mejor experiencia pasajero que Ryanair (snack, asiento más amplio)",
      "Aeropuertos primarios (LGW, CDG, BCN) en lugar de secundarios",
      "Error fares menos frecuentes pero más estables (5-15h vs 2-4h Ryanair)",
    ],
    description:
      "easyJet ocupa el espacio entre Ryanair y full-service: low-cost por estructura de precios pero con producto más amigable, asientos más cómodos y, sobre todo, salidas desde aeropuertos primarios (Gatwick en lugar de Stansted, CDG en lugar de Beauvais). \n\nDesde España, su red en BCN es especialmente fuerte hacia UK y centro de Europa. Para escapadas BCN-LGW, BCN-AMS o BCN-GVA, easyJet suele ser la combinación de mejor confort por precio. \n\nLos error fares de easyJet son menos frecuentes que los de Ryanair pero tienden a durar más (5-15 horas) y a aparecer en horarios europeos, no horario US. Esto significa que un alerta bien configurado tiene tiempo real de capturarlos.",
  },
  {
    code: "IB",
    icao: "IBE",
    name: "Iberia",
    category: "full-service",
    country: "España",
    hubs: ["MAD"],
    popularRoutesFromSpain: [
      { route: "MAD-EZE", typicalPriceEur: 750, minPriceEur: 380 },
      { route: "MAD-LIS", typicalPriceEur: 95, minPriceEur: 22 },
      { route: "MAD-JFK", typicalPriceEur: 580, minPriceEur: 290 },
      { route: "MAD-SCL", typicalPriceEur: 720, minPriceEur: 410 },
    ],
    keyPoints: [
      "Hub único MAD — toda la red converge en Barajas",
      "Mejor opción ES → América Latina (red más densa que Air Europa)",
      "Codeshare con Finnair → glitches HEL-NRT propagados a MAD",
    ],
    description:
      "Iberia es la aerolínea de bandera española y, por su red largo-radio hacia Latinoamérica, una pieza clave para el viajero hispanohablante. Hub único en MAD, lo que significa que las rutas long-haul siempre son MAD-X — desde otros origenes ES hay que conectar. \n\nLa fortaleza histórica está en ES → Argentina, Chile, Cuba, México, Colombia, Perú: la red más densa para hispanohablante de cualquier carrier, con 8-12 frecuencias semanales a destinos clave. Error fares typical: MAD-EZE business class a €380 RT (vs €750 normal), MAD-JFK a €290 (vs €580). \n\nEl truco para cazar es el codeshare con Finnair (oneworld): cuando Finnair vende segmento HEL-NRT a precio glitched, el segmento MAD-HEL-NRT comparte el mismo error fare a veces a precios muy bajos. Iberia Plus (Avios) vale la pena para viajero frecuente — los premios saver MAD-NYC están a 25-35K Avios + tasas, una de las redenciones más eficientes del programa.",
  },
  {
    code: "VY",
    icao: "VLG",
    name: "Vueling",
    category: "low-cost",
    country: "España",
    hubs: ["BCN", "MAD", "AGP"],
    popularRoutesFromSpain: [
      { route: "BCN-CDG", typicalPriceEur: 95, minPriceEur: 28 },
      { route: "BCN-LIS", typicalPriceEur: 78, minPriceEur: 22 },
      { route: "BCN-FCO", typicalPriceEur: 88, minPriceEur: 32 },
      { route: "BCN-AMS", typicalPriceEur: 105, minPriceEur: 38 },
    ],
    keyPoints: [
      "Hub principal BCN — mejor red europea desde Cataluña",
      "IAG group → mejora de servicio respecto a 2018-2020",
      "Error fares menos frecuentes que Ryanair pero rutas más útiles",
    ],
    description:
      "Vueling es el low-cost español por excelencia, con base operativa en BCN. Para cualquier residente en Cataluña que quiera escapadas europeas, es prácticamente la primera opción por frecuencia y distribución de horarios. \n\nDesde la integración en IAG (2013) ha ido mejorando producto: snacks pagados pero bolso de mano más amplio que Ryanair, asignación de asiento más predecible. Ratio de cancelaciones operativas más bajo que la media low-cost europea. \n\nDesde BCN su red europea es excelente (60+ destinos directos), pero MAD es secundario para Vueling — aquí compite con Ryanair y Iberia y casi siempre pierde en precio. Como cazador, vigilar VY especialmente desde BCN hacia ciudades secundarias italianas (Bari, Palermo, Catania) — las tarifas más bajas observadas suelen ser ahí.",
  },
  {
    code: "AF",
    icao: "AFR",
    name: "Air France",
    category: "full-service",
    country: "Francia",
    hubs: ["CDG", "ORY"],
    popularRoutesFromSpain: [
      { route: "MAD-CDG-NRT", typicalPriceEur: 4300, minPriceEur: 980 },
      { route: "BCN-CDG", typicalPriceEur: 145, minPriceEur: 45 },
      { route: "MAD-CDG-PPT", typicalPriceEur: 1850, minPriceEur: 850 },
    ],
    keyPoints: [
      "Pricing engine SkyTeam menos rígido → más glitches",
      "Hub CDG con conexiones únicas (Polinesia, África Occidental)",
      "Códigos compartidos con KLM amplían superficie de error fares",
    ],
    description:
      "Air France junto con KLM forman SkyTeam Europa — y ambos tienen pricing engines que se actualizan menos frecuentemente que los de Lufthansa Group, lo que produce más ventanas de error fares. \n\nPara el cazador hispanohablante, AF brilla en dos casos: Polinesia (CDG-PPT directo, único en Europa) y conexiones largo-radio hacia África Occidental (Senegal, Costa de Marfil) donde es prácticamente el único operador competitivo. \n\nError fares observados: CDG-NRT business class a €980 RT (vs €4,300 publicado), CDG-PPT a €850 (vs €1,850). Para usar desde España, la jugada es booking del segmento MAD-CDG por separado (€45-95) cuando el long-haul aparece glitched, en lugar de esperar a un MAD-CDG-X integrado.",
  },
  {
    code: "KL",
    icao: "KLM",
    name: "KLM",
    category: "full-service",
    country: "Países Bajos",
    hubs: ["AMS"],
    popularRoutesFromSpain: [
      { route: "AMS-NRT", typicalPriceEur: 4100, minPriceEur: 890 },
      { route: "BCN-AMS", typicalPriceEur: 165, minPriceEur: 38 },
      { route: "AMS-CGK", typicalPriceEur: 920, minPriceEur: 480 },
    ],
    keyPoints: [
      "Aerolínea con MÁS error fares Europa-Asia confirmados 2024-2025",
      "Hub AMS bien conectado desde MAD/BCN/AGP",
      "Política de honra de error fares relativamente buena",
    ],
    description:
      "KLM ha sido la aerolínea con más error fares Europa-Asia confirmados durante 2024-2025 según trackers especializados. La razón técnica es que su sistema interno opera con conversión USD ↔ EUR ↔ JPY que produce mismatch de pricing en ventanas de 6-18 horas. \n\nDestino estrella: AMS-NRT business class. Precio publicado: €4,100. Floor observado en errores: €890 RT. El glitch típico aparece miércoles-jueves entre las 14:00-04:00 CET (window de actualización GDS). \n\nDesde España, la combinación BCN-AMS-NRT bookeada en el mismo PNR cuando KLM glitchea es una de las jugadas más rentables del año. KLM tiene fama de honrar los error fares (no cancela tickets), lo que la hace más atractiva que carriers que sí lo hacen.",
  },
  {
    code: "LH",
    icao: "DLH",
    name: "Lufthansa",
    category: "full-service",
    country: "Alemania",
    hubs: ["FRA", "MUC"],
    popularRoutesFromSpain: [
      { route: "FRA-NRT", typicalPriceEur: 4400, minPriceEur: 1400 },
      { route: "MAD-FRA", typicalPriceEur: 195, minPriceEur: 58 },
      { route: "MUC-PEK", typicalPriceEur: 2950, minPriceEur: 1100 },
    ],
    keyPoints: [
      "Pricing engine premium → menos error fares que SkyTeam",
      "Cuando glitchea, los descuentos son MUY profundos (-65% típico)",
      "Hub MUC mejor opción que FRA para conexiones desde España",
    ],
    description:
      "Lufthansa es la aerolínea con menos error fares per-cápita de las grandes europeas. Su pricing engine es el más actualizado y los empleados de revenue management son legendarios por reaccionar rápido a errores. \n\nPero cuando un error fare LH aparece, suele ser muy profundo: FRA-NRT business class a €1,400 (vs €4,400 publicado), MUC-PEK a €1,100 (vs €2,950). La duración típica es corta (2-6 horas) — hay que tener alertas configuradas. \n\nDesde España, la conexión por MUC suele ser mejor que por FRA: aeropuerto más eficiente, conexión menos congestionada, y casi siempre 30-50€ más barato en el segmento ES → hub.",
  },
  {
    code: "AY",
    icao: "FIN",
    name: "Finnair",
    category: "full-service",
    country: "Finlandia",
    hubs: ["HEL"],
    popularRoutesFromSpain: [
      { route: "HEL-NRT", typicalPriceEur: 3800, minPriceEur: 840 },
      { route: "MAD-HEL", typicalPriceEur: 195, minPriceEur: 65 },
      { route: "HEL-HKG", typicalPriceEur: 920, minPriceEur: 510 },
    ],
    keyPoints: [
      "Ruta polar HEL-Asia — la más corta de Europa a Tokio/Pekín/Seúl",
      "Codeshare con Iberia — error fares HEL-NRT propagados a MAD",
      "Pricing inestable post-pandemia → más glitches que histórico",
    ],
    description:
      "Finnair tiene la geografía más privilegiada de Europa para el viajero a Asia: Helsinki está estratégicamente ubicado para volar sobre el Polo Norte hacia Tokio, Pekín y Seúl, ahorrando 1-2 horas vs cualquier otro hub europeo. \n\nDesde España, la combinación MAD-HEL-NRT en codeshare con Iberia (oneworld) es a menudo el itinerario más barato en clase business cuando hay glitches. Floor observado: €840 RT business HEL-NRT (vs €3,800 publicado). \n\nNota práctica: Finnair pasó por re-estructuración financiera en 2024-2025 y su sistema de pricing es menos estable que pre-pandemia. Esto tradujo en más error fares de los habituales — buena señal para el cazador.",
  },
  {
    code: "TK",
    icao: "THY",
    name: "Turkish Airlines",
    category: "full-service",
    country: "Turquía",
    hubs: ["IST"],
    popularRoutesFromSpain: [
      { route: "IST-NRT", typicalPriceEur: 3200, minPriceEur: 720 },
      { route: "MAD-IST", typicalPriceEur: 295, minPriceEur: 85 },
      { route: "IST-CMB", typicalPriceEur: 580, minPriceEur: 290 },
    ],
    keyPoints: [
      "Red largo-radio más extensa del mundo desde un solo hub (IST)",
      "Pricing engine más volátil → glitches frecuentes long-haul",
      "Buen producto business class por el precio (a veces a precio de premium economy europea)",
    ],
    description:
      "Turkish Airlines opera la red largo-radio más extensa del mundo desde un solo hub, con 300+ destinos directos desde IST. Para el viajero desde España hacia África, Oriente Medio o Asia, suele ser el itinerario con menos tiempo total de viaje. \n\nSu pricing engine es notoriamente volátil — los precios en business class oscilan ±40% en 24 horas regularmente, y los error fares verdaderos (€720 IST-NRT business) aparecen 2-3 veces al año durando 8-24 horas. \n\nProducto business class: las nuevas cabinas Crystal y la lounge en IST (la más grande del mundo) son competitivos con Singapore o Qatar a la mitad del precio.",
  },
  {
    code: "BA",
    icao: "BAW",
    name: "British Airways",
    category: "full-service",
    country: "Reino Unido",
    hubs: ["LHR", "LGW"],
    popularRoutesFromSpain: [
      { route: "LHR-NRT", typicalPriceEur: 5200, minPriceEur: 1400 },
      { route: "MAD-LHR", typicalPriceEur: 195, minPriceEur: 65 },
      { route: "LHR-MIA", typicalPriceEur: 850, minPriceEur: 420 },
    ],
    keyPoints: [
      "Acumulación de Avios poderosa para hispanohablante",
      "Programa Lifetime Tier (Bronze/Silver/Gold) sin caducidad",
      "Códigos compartidos con Iberia → error fares amplificados",
    ],
    description:
      "British Airways es interesante para el viajero español por dos razones: el codeshare profundo con Iberia (mismo grupo IAG) y el programa Avios — la moneda de viaje más eficiente para vuelos cortos europeos. \n\nDesde España, la jugada típica es booking MAD-LHR-X o BCN-LHR-X cuando hay error fares en la pierna LHR-X. Por ejemplo, LHR-MIA business class glitched a €420 RT + segment MAD-LHR a €65 = total €485 RT business España-Miami. \n\nProducto en cabina business (Club World) es decente pero no destacable. Lo verdaderamente diferencial es el ecosistema Avios.",
  },
  // ZZZ03 (May 2026) — Aerolíneas referenciadas desde blog posts (NH/JL/QR/TP/EK/SQ).
  {
    code: "NH",
    icao: "ANA",
    name: "ANA (All Nippon Airways)",
    category: "luxury",
    country: "Japón",
    hubs: ["NRT", "HND"],
    popularRoutesFromSpain: [
      { route: "MAD-NRT", typicalPriceEur: 950, minPriceEur: 380 },
      { route: "FRA-HND", typicalPriceEur: 1100, minPriceEur: 520 },
      { route: "LHR-NRT", typicalPriceEur: 1050, minPriceEur: 480 },
    ],
    keyPoints: [
      "Mejor producto economy del mundo — Skytrax 5★ desde 2013",
      "Vuelos Europa-Japón con escala FRA o LHR (sin hub directo desde Madrid)",
      "Star Alliance — acumulación con Lufthansa, United, Singapore",
    ],
    description:
      "ANA (All Nippon Airways) es la aerolínea japonesa con el mejor producto economy del mundo según rankings independientes (Skytrax 5★, AirHelp top 5). Para el viajero español hacia Japón, requiere escala en FRA, LHR o MUC porque no opera ruta directa desde MAD/BCN. \n\nLos error fares NH son raros pero verdaderamente espectaculares cuando aparecen — €380 economy MAD-NRT vs €950 normal — porque el pricing engine de Star Alliance suma errores a través de codeshares. La cabina premium economy (Couchii) es la más espaciosa del mercado, mejor que la business de algunas aerolíneas EU.",
  },
  {
    code: "JL",
    icao: "JAL",
    name: "JAL (Japan Airlines)",
    category: "luxury",
    country: "Japón",
    hubs: ["NRT", "HND", "KIX"],
    popularRoutesFromSpain: [
      { route: "MAD-NRT", typicalPriceEur: 920, minPriceEur: 410 },
      { route: "CDG-HND", typicalPriceEur: 1050, minPriceEur: 480 },
      { route: "LHR-HND", typicalPriceEur: 1100, minPriceEur: 540 },
    ],
    keyPoints: [
      "Servicio japonés clásico — comida + atención superior a competencia",
      "Vía hub Tokio (NRT o HND), HND más céntrico al centro",
      "Oneworld — codeshares con Iberia (IB) → MAD-NRT vía LHR posible",
    ],
    description:
      "JAL (Japan Airlines) es el competidor de ANA con servicio igualmente premium pero con personalidad ligeramente diferente: más tradicional, comida regional auténtica, atención incluso más detallada. Para el viajero desde España, Oneworld-codeshare con Iberia/BA hace MAD-NRT factible vía LHR con un solo PNR. \n\nLa diferencia visible vs ANA: HND (Haneda) está mucho más cerca del centro Tokio (Shibuya 30min) que NRT (1h en tren), y JAL tiene más slots HND. Los error fares JL históricos: €410 economy MAD-NRT (2024), €1.500 business class round-trip (2025).",
  },
  {
    code: "QR",
    icao: "QTR",
    name: "Qatar Airways",
    category: "luxury",
    country: "Catar",
    hubs: ["DOH"],
    popularRoutesFromSpain: [
      { route: "MAD-DOH", typicalPriceEur: 480, minPriceEur: 195 },
      { route: "DOH-BKK", typicalPriceEur: 380, minPriceEur: 165 },
      { route: "DOH-MLE", typicalPriceEur: 540, minPriceEur: 280 },
      { route: "MAD-DPS", typicalPriceEur: 850, minPriceEur: 380 },
    ],
    keyPoints: [
      "Q-Suite Business class — votada mejor del mundo 2017-2024",
      "Hub DOH conecta Europa-Asia/Oceanía/África con escala única",
      "Error fares Europa-Asia frecuentes — pricing volátil",
    ],
    description:
      "Qatar Airways es la aerolínea con el producto business class más reconocido del sector aéreo (Q-Suite, ganador Skytrax 7 años consecutivos). Para el viajero desde España hacia Asia, Oceanía o África, su hub DOH es competitivo con Emirates DXB pero típicamente más barato. \n\nError fares Europa-Asia con Qatar son frecuentes — 6-8 mistake fares al año Madrid/Barcelona-Bangkok/Bali/Tokio bajo €450 economy round-trip. La razón estructural es que Qatar tarifica Europa-Asia como una sola pierna virtual cuando hay escala en DOH, y los errores en uno de los segmentos se propagan al precio total.",
  },
  {
    code: "TP",
    icao: "TAP",
    name: "TAP Air Portugal",
    category: "full-service",
    country: "Portugal",
    hubs: ["LIS"],
    popularRoutesFromSpain: [
      { route: "MAD-LIS", typicalPriceEur: 95, minPriceEur: 35 },
      { route: "LIS-GRU", typicalPriceEur: 580, minPriceEur: 290 },
      { route: "LIS-EZE", typicalPriceEur: 720, minPriceEur: 340 },
      { route: "LIS-RIO", typicalPriceEur: 620, minPriceEur: 310 },
    ],
    keyPoints: [
      "Hub LIS conecta Europa con Brasil/Latam con escala corta + barata",
      "Programa stopover gratuito en Lisboa hasta 5 noches",
      "Sometidos a estrés financiero — error fares estructurales más frecuentes",
    ],
    description:
      "TAP Air Portugal opera el hub más eficiente Europa-Brasil/Latam desde Lisboa, con vuelos diarios a São Paulo, Río, Buenos Aires, Caracas. Para el viajero desde España, la combinación MAD-LIS + LIS-GRU/EZE es típicamente €100-200 más barata que IB/AF/LH directos.\n\nEl programa Stopover Lisboa permite hasta 5 noches en Lisboa sin coste extra en el ticket — ideal para combinar Brasil + Lisboa en un solo viaje. Los error fares TAP son frecuentes (12+ al año) por restructuras IT y precariedad financiera del grupo, especialmente en segments LIS-Brasil business class.",
  },
  // SSS277 (17 may 2026): expansión a 20 aerolíneas — añade 6 nuevas con tráfico real ES.
  {
    code: "W6",
    icao: "WZZ",
    name: "Wizz Air",
    category: "low-cost",
    country: "Hungría",
    hubs: ["BUD", "WAW", "KRK", "VAR", "OTP"],
    popularRoutesFromSpain: [
      { route: "BCN-BUD", typicalPriceEur: 95, minPriceEur: 22 },
      { route: "MAD-WAW", typicalPriceEur: 110, minPriceEur: 28 },
      { route: "VLC-OTP", typicalPriceEur: 88, minPriceEur: 24 },
      { route: "BCN-KRK", typicalPriceEur: 92, minPriceEur: 25 },
    ],
    keyPoints: [
      "Hub Budapest + base secundaria en KTW, KRK, OTP — mejor red Este Europa",
      "Tarifas ultra-low pero política equipaje aún más estricta que Ryanair",
      "Error fares en rutas ES → Hungría/Rumanía/Polonia 4-6× al año",
    ],
    description:
      "Wizz Air es el low-cost dominante de Europa del Este, con base operativa en Budapest. Para el viajero ES que quiera Polonia (Cracovia, Varsovia), Hungría (Budapest), Rumanía (Bucarest), Bulgaria (Varna) o Lituania (Vilna), suele ser la opción más barata por mucho margen.\n\nLas rutas BCN/MAD/VLC hacia capitales del Este suelen oscilar entre €22 (error fare) y €110 (alta demanda). El sweet spot está en martes/miércoles + booking 6-8 semanas antes. Política equipaje muy estricta: solo bolso pequeño en tarifa básica; añadir cabina cuesta €30-50.\n\nWizz también opera rutas exóticas como BUD-DXB y BUD-MLE (Maldivas) con tarifas competitivas. Para combinaciones ES → Asia con hub Budapest, los error fares aparecen 4-6 veces al año (Madrid-Tbilisi €180 RT, BCN-Yerevan €150 RT observados en 2025-2026).",
  },
  {
    code: "DY",
    icao: "NAX",
    name: "Norwegian",
    category: "low-cost",
    country: "Noruega",
    hubs: ["OSL", "ARN", "CPH", "TRD"],
    popularRoutesFromSpain: [
      { route: "MAD-OSL", typicalPriceEur: 145, minPriceEur: 45 },
      { route: "BCN-CPH", typicalPriceEur: 125, minPriceEur: 38 },
      { route: "MAD-ARN", typicalPriceEur: 155, minPriceEur: 48 },
    ],
    keyPoints: [
      "Hub Oslo + bases secundarias Copenhague/Estocolmo — mejor red Escandinavia",
      "Tras restructura post-COVID, foco en Europa intra-regional",
      "Error fares ES → Nórdicos 6-8 al año, especialmente en marzo/octubre",
    ],
    description:
      "Norwegian es el low-cost dominante en Escandinavia tras la restructura de 2021. Operativa enfocada en Europa intra-regional, con red densa desde OSL, ARN y CPH hacia Madrid, Barcelona, Málaga, Palma, Alicante, Las Palmas y Tenerife.\n\nPara el viajero ES que quiera ver auroras boreales (Tromsø, Reikiavik vía OSL), o simplemente escapar a Estocolmo/Copenhague, Norwegian suele ser 30-40% más barato que SAS o Lufthansa. Los error fares ES → Nórdicos aparecen especialmente en marzo (post-temporada esquí) y octubre (entretiempo).\n\nA diferencia de Ryanair y Wizz, Norwegian incluye snack + drink básico incluso en tarifa Low. Aeropuertos primarios (OSL, ARN, CPH) sin recargo. Servicio más cómodo que low-cost típico europeo.",
  },
  {
    code: "EK",
    icao: "UAE",
    name: "Emirates",
    category: "luxury",
    country: "Emiratos Árabes",
    hubs: ["DXB"],
    popularRoutesFromSpain: [
      { route: "MAD-DXB", typicalPriceEur: 520, minPriceEur: 280 },
      { route: "BCN-DXB", typicalPriceEur: 540, minPriceEur: 295 },
      { route: "MAD-DXB-BKK", typicalPriceEur: 720, minPriceEur: 380 },
      { route: "MAD-DXB-DPS", typicalPriceEur: 980, minPriceEur: 450 },
    ],
    keyPoints: [
      "Hub Dubai conecta Europa-Asia/Oceanía/África en escala única",
      "Producto a bordo top-tier (A380, cabin entertainment, comida)",
      "Error fares Europa-Asia con stopover DXB 8-10 al año",
    ],
    description:
      "Emirates es la aerolínea más reconocida del Golfo, con producto top-tier en business y first class a bordo de A380. Su hub Dubai conecta Europa con Asia (Bangkok, Bali, Tokio, Singapore), Oceanía (Sídney, Melbourne) y África (Johannesburgo, Mauricio) con escala única.\n\nPara el viajero ES, los error fares más jugosos aparecen en rutas con stopover DXB hacia Asia. MAD-DXB-BKK por €380 RT economy (vs €720 normal), MAD-DXB-DPS por €450 (vs €980): 8-10 oportunidades al año, especialmente noviembre-febrero.\n\nDubai Stopover Programme: Emirates ofrece hotel + transfer + visa gratuita por hasta 96 horas en muchos tickets transit. Forma legítima de añadir un destino al itinerario sin coste extra. Programa Skywards (Emirates miles) válido también para Qantas, JetBlue, EasyJet (limitado).",
  },
  {
    code: "EY",
    icao: "ETD",
    name: "Etihad Airways",
    category: "luxury",
    country: "Emiratos Árabes",
    hubs: ["AUH"],
    popularRoutesFromSpain: [
      { route: "MAD-AUH", typicalPriceEur: 480, minPriceEur: 240 },
      { route: "BCN-AUH", typicalPriceEur: 510, minPriceEur: 260 },
      { route: "MAD-AUH-MLE", typicalPriceEur: 780, minPriceEur: 380 },
      { route: "MAD-AUH-SYD", typicalPriceEur: 1450, minPriceEur: 720 },
    ],
    keyPoints: [
      "Hub Abu Dhabi — alternativa Premium a DXB con menos congestión",
      "Programa Etihad Guest aliado con Air France-KLM (transferencia millas)",
      "Error fares Australia/Asia frecuentes — pricing engine menos refinado que Emirates",
    ],
    description:
      "Etihad Airways es la aerolínea nacional de Abu Dhabi y la alternativa Premium a Emirates desde el Golfo. Producto a bordo equivalente en business class (Apartment, Residence), pero menos volumen de pasajeros y hub AUH más ágil que DXB.\n\nPara el viajero ES, Etihad brilla en rutas Madrid/Barcelona-Maldivas (€380 RT economy en glitch vs €780 normal), Madrid-Sídney (€720 vs €1,450) y Madrid-Bangkok via AUH. El pricing engine de Etihad es menos refinado que el de Emirates, lo que produce error fares más frecuentes y duraderos (24-48h vs 4-8h Emirates).\n\nEtihad Guest (programa frequent flyer) tiene partnership con Air France-KLM Flying Blue — las millas se pueden transferir entre programas, útil para acumular en Europa y redimir en SkyTeam.",
  },
  {
    code: "LX",
    icao: "SWR",
    name: "SWISS",
    category: "full-service",
    country: "Suiza",
    hubs: ["ZRH", "GVA", "BSL"],
    popularRoutesFromSpain: [
      { route: "MAD-ZRH", typicalPriceEur: 195, minPriceEur: 78 },
      { route: "BCN-ZRH", typicalPriceEur: 175, minPriceEur: 65 },
      { route: "MAD-ZRH-NRT", typicalPriceEur: 980, minPriceEur: 420 },
      { route: "MAD-ZRH-JNB", typicalPriceEur: 850, minPriceEur: 380 },
    ],
    keyPoints: [
      "Hub Zúrich premium con conexiones Asia/África competitivas",
      "Star Alliance + IAG codeshare: superficie error-fares amplia",
      "Calidad cabina + puntualidad líderes — premium worth it para business",
    ],
    description:
      "SWISS es la aerolínea de bandera suiza, integrada en Lufthansa Group y Star Alliance. Hub principal Zúrich con bases secundarias GVA + BSL. Calidad de cabina y puntualidad consistentemente top-tier en Europa.\n\nPara el viajero ES, los error fares más interesantes aparecen en rutas long-haul vía ZRH: Madrid-Zúrich-Tokio por €420 (vs €980), Madrid-Zúrich-Johannesburgo por €380 (vs €850). 4-6 oportunidades al año, especialmente febrero-marzo y septiembre.\n\nSiendo parte del grupo Lufthansa, SWISS comparte algunos error fares con LH cuando el pricing engine se desincroniza entre carriers. Importante: vigilar los segmentos LH y LX en paralelo si quieres maximizar superficie de detección.",
  },
  {
    code: "AZ",
    icao: "ITY",
    name: "ITA Airways",
    category: "full-service",
    country: "Italia",
    hubs: ["FCO", "MXP"],
    popularRoutesFromSpain: [
      { route: "MAD-FCO", typicalPriceEur: 145, minPriceEur: 48 },
      { route: "BCN-FCO", typicalPriceEur: 125, minPriceEur: 42 },
      { route: "MAD-FCO-NRT", typicalPriceEur: 1100, minPriceEur: 480 },
      { route: "MAD-FCO-EZE", typicalPriceEur: 850, minPriceEur: 390 },
    ],
    keyPoints: [
      "Sucesora de Alitalia (2021) — ahora propiedad de Lufthansa Group (2024)",
      "Hub Roma Fiumicino con conexiones Asia/Latam competitivas",
      "Error fares ES → Argentina vía FCO frecuentes — segmento ITA-AR a precios glitched",
    ],
    description:
      "ITA Airways es la aerolínea nacional de Italia, sucesora de la histórica Alitalia tras quiebra de 2021. En 2024 fue adquirida por Lufthansa Group, lo que está unificando pricing engines y programa frequent flyer con LH/LX/OS.\n\nPara el viajero ES, las rutas más interesantes son ES → Argentina vía FCO (MAD-FCO-EZE por €390 economy en error fare vs €850 normal) y ES → Tokio vía FCO (€480 vs €1,100). La integración con LH significa que ahora los error fares LH también se propagan a ITA — vigilar ambas en paralelo.\n\nProducto a bordo en proceso de modernización (flota A220, A330neo). Programa Volare (frequent flyer) ahora integrado con Miles & More — útil acumular si vuelas Lufthansa Group con frecuencia.",
  },
  // SSS286 (17 may 2026): expansión a 25 aerolíneas — añade 5 más (SK/OS/EW/QF/CX).
  {
    code: "SK",
    icao: "SAS",
    name: "SAS Scandinavian",
    category: "full-service",
    country: "Suecia/Dinamarca/Noruega",
    hubs: ["CPH", "ARN", "OSL"],
    popularRoutesFromSpain: [
      { route: "MAD-CPH", typicalPriceEur: 195, minPriceEur: 85 },
      { route: "BCN-ARN", typicalPriceEur: 220, minPriceEur: 95 },
      { route: "MAD-OSL", typicalPriceEur: 185, minPriceEur: 78 },
    ],
    keyPoints: [
      "Hub triple Copenhague + Estocolmo + Oslo — mejor red Escandinavia",
      "Tras restructura 2023, ahora en Star Alliance + Air France-KLM",
      "Error fares Europa → USA/Asia vía CPH frecuentes",
    ],
    description:
      "SAS Scandinavian es la aerolínea nacional sueca/danesa/noruega, con hubs en Copenhague (CPH), Estocolmo (ARN) y Oslo (OSL). Tras la restructura financiera de 2023, salió del Star Alliance y se unió a SkyTeam (Air France-KLM partnership), lo que abre nuevas oportunidades de error fares con segmentos compartidos.\n\nPara el viajero ES, SAS brilla en rutas a Escandinavia (más cómoda y puntual que Norwegian, ligeramente más cara) y especialmente en long-haul vía CPH a USA (Boston, Newark, Chicago) y Asia (Shanghai, Tokio). Error fares ES → USA vía CPH a €380-450 RT economy aparecen 3-4× al año.\n\nProducto cabina actualizado en A350 (long-haul) muy bien valorado en business. EuroBonus (frequent flyer) ahora cooperante con Flying Blue — millas transferibles.",
  },
  {
    code: "OS",
    icao: "AUA",
    name: "Austrian Airlines",
    category: "full-service",
    country: "Austria",
    hubs: ["VIE"],
    popularRoutesFromSpain: [
      { route: "MAD-VIE", typicalPriceEur: 175, minPriceEur: 65 },
      { route: "BCN-VIE", typicalPriceEur: 165, minPriceEur: 58 },
      { route: "MAD-VIE-NRT", typicalPriceEur: 950, minPriceEur: 420 },
    ],
    keyPoints: [
      "Hub Viena con conexiones únicas Europa Central + Este",
      "Lufthansa Group — error fares propagados desde LH",
      "Programa Miles & More integrado",
    ],
    description:
      "Austrian Airlines es la aerolínea nacional de Austria, parte del Lufthansa Group (con LH, LX, EW). Hub principal Viena (VIE) — el aeropuerto más conveniente para conexiones a Europa Central (Bratislava, Praga, Budapest, Liubliana) y Este (Bucarest, Sofía, Kiev, Belgrado).\n\nPara el viajero ES, Austrian es competitiva en rutas largo-radio vía VIE: Madrid-Viena-Tokio por €420 RT economy (vs €950 normal) — error fare observado 2× en 2025. También fuerte en rutas Europa Central a precios consistentes.\n\nMejor opción para combinar varios países Europa Central en un solo viaje (combinaciones triple-stopover gratis en VIE para Austrian Plus tier). Programa Miles & More compartido con todo el Lufthansa Group.",
  },
  {
    code: "EW",
    icao: "EWG",
    name: "Eurowings",
    category: "low-cost",
    country: "Alemania",
    hubs: ["DUS", "CGN", "HAM", "STR"],
    popularRoutesFromSpain: [
      { route: "MAD-DUS", typicalPriceEur: 145, minPriceEur: 38 },
      { route: "BCN-CGN", typicalPriceEur: 125, minPriceEur: 32 },
      { route: "AGP-HAM", typicalPriceEur: 165, minPriceEur: 48 },
    ],
    keyPoints: [
      "Low-cost subsidiary de Lufthansa Group",
      "Hub principal DUS + base CGN, HAM, STR",
      "Aeropuertos primarios alemanes (no secundarios como Ryanair)",
    ],
    description:
      "Eurowings es el low-cost del Lufthansa Group, operando rutas intra-europeas con base operativa en Düsseldorf (DUS), Colonia (CGN), Hamburgo (HAM) y Stuttgart (STR). Ventaja vs Ryanair: aeropuertos primarios alemanes, mejor experiencia pasajero, bolso de mano amplio incluido.\n\nPara el viajero ES, las rutas más interesantes son Madrid/Barcelona/Málaga/Palma → DUS/CGN/HAM/STR. Precios típicos €120-180 RT con error fares ocasionales a €35-50 RT. Especialmente útil para conectar destinos secundarios alemanes sin pasar por FRA o MUC.\n\nDesde la integración en Lufthansa Group, ahora forma parte de Miles & More — útil para acumular millas Lufthansa volando en low-cost. Ratio de cancelaciones bajo (mejor que Ryanair típico).",
  },
  {
    code: "QF",
    icao: "QFA",
    name: "Qantas",
    category: "full-service",
    country: "Australia",
    hubs: ["SYD", "MEL", "BNE", "PER"],
    popularRoutesFromSpain: [
      { route: "MAD-LHR-SYD", typicalPriceEur: 1450, minPriceEur: 680 },
      { route: "BCN-DXB-PER", typicalPriceEur: 1380, minPriceEur: 650 },
      { route: "MAD-SIN-SYD", typicalPriceEur: 1520, minPriceEur: 720 },
    ],
    keyPoints: [
      "Aerolínea de bandera Australia con red oceanía sin igual",
      "Project Sunrise: vuelos directos Europa-Sídney lanzamiento 2026-2027",
      "Error fares Europa-Oceanía con escala asiática 4-5× al año",
    ],
    description:
      "Qantas es la aerolínea nacional de Australia, parte de oneworld alliance. La red más densa hacia Oceanía (Sídney, Melbourne, Brisbane, Perth) + Pacífico Sur (Auckland, Wellington). Producto a bordo top-tier en business class A380.\n\nPara el viajero ES, Qantas opera vía hub asiático (Singapur, Hong Kong, Bangkok) o europeo (Londres). Error fares Europa-Sídney bajo €700 RT economy aparecen 4-5× al año, especialmente en octubre-noviembre (mejor mes para viajar a Australia).\n\nProject Sunrise (lanzamiento previsto 2026-2027) propone vuelos directos Sídney-Londres / Sídney-París sin escala — los primeros precios serán premium pero los lanzamientos suelen generar mistake fares de marketing. Vigilar dic 2026.",
  },
  {
    code: "CX",
    icao: "CPA",
    name: "Cathay Pacific",
    category: "luxury",
    country: "Hong Kong",
    hubs: ["HKG"],
    popularRoutesFromSpain: [
      { route: "MAD-HKG", typicalPriceEur: 680, minPriceEur: 320 },
      { route: "BCN-HKG", typicalPriceEur: 720, minPriceEur: 340 },
      { route: "MAD-HKG-SYD", typicalPriceEur: 1180, minPriceEur: 580 },
      { route: "MAD-HKG-BKK", typicalPriceEur: 580, minPriceEur: 280 },
    ],
    keyPoints: [
      "Hub Hong Kong conecta Europa con todo el Sudeste Asiático",
      "Producto a bordo Skytrax 5-star — business class top-tier",
      "Error fares Europa-Asia con stopover HKG muy frecuentes",
    ],
    description:
      "Cathay Pacific es la aerolínea nacional de Hong Kong, parte de oneworld alliance. Hub único en HKG con red densa a todo Sudeste Asiático (Bangkok, Singapur, Bali, Manila, Tokio, Seúl) + Oceanía (Sídney, Melbourne, Auckland) + Norteamérica oeste (LAX, SFO, YVR, JFK).\n\nPara el viajero ES, Cathay brilla en rutas vía HKG hacia destinos exóticos asiáticos. Error fares Madrid-Hong Kong-Bangkok por €280 RT economy (vs €580 normal) aparecen 5-6× al año, especialmente noviembre-febrero. La calidad del producto a bordo (especialmente en A350) es consistente top-tier — Skytrax 5-star.\n\nPrograma Asia Miles (frequent flyer) tiene partnerships valiosos con Alaska Airlines, JAL y Qantas — útil para redenciones premium. Hong Kong Stopover Programme permite hasta 5 días en HK sin coste extra en muchos tickets transit.",
  },
];

export function getAirlineByCode(code: string): Airline | null {
  const u = code.toUpperCase();
  return AIRLINES.find((a) => a.code === u) || null;
}

export function getAirlinesByCategory(cat: AirlineCategory): Airline[] {
  return AIRLINES.filter((a) => a.category === cat);
}
