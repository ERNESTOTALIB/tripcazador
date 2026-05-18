/**
 * seasonal_data.ts — MMMM01 (May 2026)
 *
 * SEO vertical /cuando-viajar/[destino] — captura keywords con alto
 * search volume + intent comercial:
 *   "cuando ir a Tailandia", "mejor mes Marruecos",
 *   "cuando viajar a Bali", "Japón en otoño", etc.
 *
 * Cada destino expone 12 meses con clima (temp min/max, lluvia),
 * crowd level + price level, notas y "sweet spot" computado (los meses
 * óptimos para visitar). El algoritmo se inclina por temperatura
 * agradable + lluvia baja + precios mid + crowds mid → high.
 *
 * 12 destinos cubren los buscados más densos (japón / tailandia /
 * bali / marruecos / mexico / vietnam / peru / india / egipto /
 * kenia / islandia / nueva-zelanda). Datos basados en patrones reales
 * de turismo (no exactos al grado pero suficientes para SEO informativo).
 */

export type MonthIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type PriceLevel = "low" | "mid" | "high";
export type CrowdLevel = "low" | "mid" | "high";

export interface SeasonalEntry {
  month: MonthIndex;
  /** Nivel de precio relativo durante ese mes en el destino. */
  priceLevel: PriceLevel;
  /** Temperatura mínima media del mes en °C. */
  tempMin: number;
  /** Temperatura máxima media del mes en °C. */
  tempMax: number;
  /** Precipitación típica mensual en mm. */
  rainfallMm: number;
  /** Densidad de turistas — correlaciona con priceLevel mayormente. */
  crowdLevel: CrowdLevel;
  /** Nota corta 1-2 frases sobre qué es ese mes en ese destino. */
  notes: string;
}

export interface Destination {
  slug: string;
  /** Nombre del país/región en español. */
  name: string;
  /** País oficial (puede coincidir con name). */
  country: string;
  /** Macro-región para clustering. */
  region: string;
  /** Hubs IATA principales para llegar (link a /vuelos-a/[slug]). */
  hubIATAs: string[];
  /** Slug opcional para hero image (referencia a dest_images.ts). */
  heroImageSlug?: string;
  /** 12 entradas, una por mes (jan-dec). */
  months: [
    SeasonalEntry, SeasonalEntry, SeasonalEntry,
    SeasonalEntry, SeasonalEntry, SeasonalEntry,
    SeasonalEntry, SeasonalEntry, SeasonalEntry,
    SeasonalEntry, SeasonalEntry, SeasonalEntry,
  ];
  /** Meses sweet-spot (mejor relación clima/crowds/precio). */
  sweetSpotMonths: MonthIndex[];
  /** Meses a evitar (mal tiempo, monzón, calor extremo, etc.). */
  avoidMonths: MonthIndex[];
  /** Descripción 2-3 párrafos para SEO + contexto. */
  description: string;
  /** Tips concretos del destino — mínimo 5. */
  tips: string[];
}

const MONTH_NAMES_ES = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function monthName(m: MonthIndex): string {
  return MONTH_NAMES_ES[m];
}

export function formatMonthList(months: MonthIndex[]): string {
  if (months.length === 0) return "";
  if (months.length === 1) return monthName(months[0]);
  const names = months.map(monthName);
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

/* ────────────────────────────────────────────────────────────────────────
 *  DESTINATIONS_SEASONAL — 12 destinos
 * ────────────────────────────────────────────────────────────────────── */

export const DESTINATIONS_SEASONAL: Destination[] = [
  {
    slug: "japon",
    name: "Japón",
    country: "Japón",
    region: "Asia oriental",
    hubIATAs: ["NRT", "HND", "KIX"],
    heroImageSlug: "japon",
    months: [
      { month: 1, priceLevel: "low", tempMin: 1, tempMax: 10, rainfallMm: 50, crowdLevel: "mid", notes: "Mes frío y seco. Temporada baja salvo Año Nuevo (1-3 ene). Ideal nieve en Hokkaido y onsen sin masas." },
      { month: 2, priceLevel: "low", tempMin: 1, tempMax: 11, rainfallMm: 60, crowdLevel: "low", notes: "Sigue frío pero ya empiezan ciruelos en flor (ume). Sapporo Snow Festival a primeros." },
      { month: 3, priceLevel: "mid", tempMin: 4, tempMax: 14, rainfallMm: 100, crowdLevel: "mid", notes: "Última semana puede pillar inicio sakura en Tokio/Kioto. Tiempo aún fresco e impredecible." },
      { month: 4, priceLevel: "high", tempMin: 9, tempMax: 19, rainfallMm: 110, crowdLevel: "high", notes: "Pico sakura primera quincena en Tokio/Kioto. Hoteles +50-100%. Reservar con 4 meses." },
      { month: 5, priceLevel: "mid", tempMin: 14, tempMax: 23, rainfallMm: 130, crowdLevel: "mid", notes: "Golden Week (29 abr-5 may) saturado. Tras eso clima ideal, todo verde, crowds aceptables." },
      { month: 6, priceLevel: "low", tempMin: 19, tempMax: 26, rainfallMm: 170, crowdLevel: "low", notes: "Inicio tsuyu (estación lluvias). Hortensias en flor pero llueve casi a diario. Hoteles -20-30%." },
      { month: 7, priceLevel: "mid", tempMin: 23, tempMax: 30, rainfallMm: 160, crowdLevel: "mid", notes: "Sigue tsuyu hasta mediados. Calor + humedad +85%. Matsuris (festivales) compensan." },
      { month: 8, priceLevel: "mid", tempMin: 24, tempMax: 31, rainfallMm: 150, crowdLevel: "mid", notes: "Bochorno extremo, fuegos artificiales icónicos. Obon (mid-aug) cierra museos y satura tren bala." },
      { month: 9, priceLevel: "mid", tempMin: 20, tempMax: 27, rainfallMm: 220, crowdLevel: "mid", notes: "Riesgo tifón hasta mediados. Última quincena ya estabiliza. Hoteles vuelven a precios normales." },
      { month: 10, priceLevel: "high", tempMin: 14, tempMax: 22, rainfallMm: 130, crowdLevel: "high", notes: "Inicio koyo (hojas rojas) Hokkaido + montaña. Tiempo perfecto, días soleados. Pico turístico." },
      { month: 11, priceLevel: "high", tempMin: 8, tempMax: 17, rainfallMm: 80, crowdLevel: "high", notes: "Pico koyo en Kioto/Tokio — momiji por todas partes. Hoteles altos pero mejor relación clima/precio del año." },
      { month: 12, priceLevel: "mid", tempMin: 3, tempMax: 12, rainfallMm: 50, crowdLevel: "mid", notes: "Frío seco, mucho sol, iluminaciones navideñas espectaculares. 27-31 dic se dispara por Año Nuevo." },
    ],
    sweetSpotMonths: [4, 10, 11],
    avoidMonths: [6, 7, 8],
    description:
      "Japón tiene dos picos turísticos clarísimos: sakura (cerezos) en abril y koyo (arces rojos) entre mediados de octubre y finales de noviembre. Ambos vienen con hoteles +50-100% sobre precio normal, pero compensan: pocas experiencias culturales del planeta igualan una mañana en el templo Kiyomizu-dera con hojas rojas o un parque del castillo Himeji bajo nubes rosas.\n\nEn medio hay una ventana de oro: finales de mayo (post-Golden Week) y todo septiembre tras los tifones. Clima de transición, hoteles a precio decente, escasas multitudes. Junio-agosto es agresivo: lluvia diaria + 85% humedad + 32 °C. Diciembre-marzo es frío seco y excelente para ski en Hokkaido / onsen en Hakone.\n\nLos vuelos desde Europa raramente bajan de 600 € en sakura/koyo, pero en febrero o junio aparecen ofertas desde Madrid o Barcelona a 450-550 € con Turkish, Air China o KLM.",
    tips: [
      "Reserva el Japan Rail Pass desde fuera (más barato) si vas a moverte entre 3+ ciudades.",
      "En sakura, la previsión oficial sale a finales de marzo — vuelo a Tokio 1-7 abril maximiza probabilidad.",
      "Hokkaido en agosto evita el bochorno de Honshu (clima oceánico, 22-25 °C).",
      "Ryokans (posadas tradicionales) cuestan 1.5-2x un hotel pero incluyen onsen y kaiseki — vale al menos una noche.",
      "Las tiendas convini (7-Eleven, Lawson, FamilyMart) son cajeros viables, hoteles y muchos restaurantes solo aceptan efectivo.",
      "Para koyo, Kioto pico va 15-25 noviembre — reservar con 4 meses de antelación.",
    ],
  },
  {
    slug: "bali",
    name: "Bali",
    country: "Indonesia",
    region: "Sudeste asiático",
    hubIATAs: ["DPS"],
    heroImageSlug: "bali",
    months: [
      { month: 1, priceLevel: "low", tempMin: 24, tempMax: 31, rainfallMm: 350, crowdLevel: "low", notes: "Pleno monzón. Lluvia diaria pero corta. Arrozales verde intenso. Pocos turistas, precios bajos." },
      { month: 2, priceLevel: "low", tempMin: 24, tempMax: 31, rainfallMm: 280, crowdLevel: "low", notes: "Última fase monzón. Olas grandes en costa oeste (Uluwatu surf pico)." },
      { month: 3, priceLevel: "low", tempMin: 24, tempMax: 31, rainfallMm: 220, crowdLevel: "mid", notes: "Lluvia se reduce. Nyepi (día silencio) cierra todo 24h en marzo — fechas varían." },
      { month: 4, priceLevel: "mid", tempMin: 23, tempMax: 31, rainfallMm: 100, crowdLevel: "mid", notes: "Mes pivote: pasa de húmedo a seco. Día soleado típico. Crowds aún bajos." },
      { month: 5, priceLevel: "mid", tempMin: 22, tempMax: 30, rainfallMm: 80, crowdLevel: "mid", notes: "Sweet spot: clima estable, humedad baja, precios pre-pico. Recomendado para primer viaje." },
      { month: 6, priceLevel: "mid", tempMin: 22, tempMax: 29, rainfallMm: 60, crowdLevel: "mid", notes: "Inicio temporada seca. Días largos, brisa. Surfistas llegan a Uluwatu/Padang Padang." },
      { month: 7, priceLevel: "high", tempMin: 22, tempMax: 29, rainfallMm: 40, crowdLevel: "high", notes: "Pico turístico (vacaciones Europa/Australia). Hoteles +30-50%. Tráfico denso Canggu-Seminyak." },
      { month: 8, priceLevel: "high", tempMin: 22, tempMax: 29, rainfallMm: 30, crowdLevel: "high", notes: "Mismo pico que julio. Tiempo perfecto pero hay que reservar todo con 2-3 meses." },
      { month: 9, priceLevel: "mid", tempMin: 22, tempMax: 29, rainfallMm: 50, crowdLevel: "mid", notes: "Final temporada seca. Clima ideal, crowds bajando. Excelente relación calidad/precio." },
      { month: 10, priceLevel: "mid", tempMin: 23, tempMax: 30, rainfallMm: 110, crowdLevel: "mid", notes: "Lluvias regresan progresivas. Aún muchos días buenos. Arroz cosechado en algunas zonas." },
      { month: 11, priceLevel: "low", tempMin: 24, tempMax: 30, rainfallMm: 220, crowdLevel: "low", notes: "Monzón gana fuerza. Lluvia frecuente pero generalmente vespertina. Precios caen." },
      { month: 12, priceLevel: "mid", tempMin: 24, tempMax: 30, rainfallMm: 320, crowdLevel: "mid", notes: "Lluvia consistente excepto últimas 2 semanas dic que se disparan por Navidad/NY (precios +60%)." },
    ],
    sweetSpotMonths: [5, 6, 9],
    avoidMonths: [1, 2, 12],
    description:
      "Bali tiene clima ecuatorial con dos estaciones: seca (abr-oct) y húmeda (nov-mar). La diferencia de temperatura es mínima (siempre 28-32 °C), pero la lluvia cambia drásticamente: en pleno monzón cae 300+ mm/mes, mientras que agosto puede pasar 3 semanas sin una gota.\n\nLa ventana ideal son mayo, junio y septiembre: clima estable de temporada seca, humedad razonable, crowds y precios todavía por debajo del pico (julio-agosto). Diciembre-enero hay que evitarlo salvo Año Nuevo si buscas fiesta — la lluvia es intensa y las dos últimas semanas de diciembre suben hoteles +60%.\n\nVuelos desde España son de los más caros de Asia (no hay vuelos directos): mejor búsqueda combinada con Singapore (SIN) o Doha (DOH). Precios típicos 700-900 € en off-season, 1100-1400 € en pico.",
    tips: [
      "Reserva hoteles en Ubud (cultura/arrozales) + Uluwatu o Canggu (playa/surf). Skip Kuta/Legian salvo low-budget.",
      "Visa-on-arrival 30 días $35 USD — paga con tarjeta para evitar el cambio en aeropuerto.",
      "Tráfico Canggu-Ubud puede ser 1h+ en hora punta. Moto Gojek/Grab es 5x más rápido que coche.",
      "Si vas en seca, llevar protector solar reef-safe (la mayoría hoteles lo exigen en piscinas).",
      "Nusa Penida day-trip vale el dinero, pero embárcate temprano (las olas hacen vomitar a partir de las 11 am).",
      "Comida local (warung) cuesta 2-4 €, restaurantes turísticos 12-18 €. Calidad similar.",
    ],
  },
  {
    slug: "marruecos",
    name: "Marruecos",
    country: "Marruecos",
    region: "Norte de África",
    hubIATAs: ["CMN", "RAK", "AGA"],
    heroImageSlug: "marrakech",
    months: [
      { month: 1, priceLevel: "low", tempMin: 5, tempMax: 18, rainfallMm: 30, crowdLevel: "low", notes: "Frío por la noche (Atlas nevado), días soleados. Marrakech 18 °C tarde. Riads sin calefacción → llevar capas." },
      { month: 2, priceLevel: "low", tempMin: 7, tempMax: 20, rainfallMm: 25, crowdLevel: "low", notes: "Mismo perfil que enero. Mejor mes para esquí en Oukaïmeden. Almendros en flor zona Tafraout." },
      { month: 3, priceLevel: "mid", tempMin: 9, tempMax: 22, rainfallMm: 25, crowdLevel: "mid", notes: "Temperatura sube, lluvia residual. Excelente para senderismo Atlas (M'Goun) o desierto Merzouga." },
      { month: 4, priceLevel: "high", tempMin: 11, tempMax: 24, rainfallMm: 20, crowdLevel: "high", notes: "Sweet spot: temperaturas perfectas, valles verdes, Atlas nevado de fondo. Hoteles pico Semana Santa." },
      { month: 5, priceLevel: "high", tempMin: 13, tempMax: 27, rainfallMm: 10, crowdLevel: "high", notes: "Mismo sweet spot. Días largos, noches frescas, sin lluvia. Festival Rosas en Kelaat M'Gouna a mediados." },
      { month: 6, priceLevel: "mid", tempMin: 17, tempMax: 32, rainfallMm: 3, crowdLevel: "mid", notes: "Empieza el calor. Costa (Essaouira, Agadir) sigue 22-25 °C. Interior Marrakech 35 °C +. Ramadán puede caer." },
      { month: 7, priceLevel: "low", tempMin: 20, tempMax: 38, rainfallMm: 1, crowdLevel: "low", notes: "Calor extremo interior (40 °C+ Marrakech, Fes). Solo costa atlántica respira. Precios caen pero incomodidad sube." },
      { month: 8, priceLevel: "low", tempMin: 20, tempMax: 38, rainfallMm: 1, crowdLevel: "low", notes: "Igual o peor que julio. Festival Asilah arte mural. Buen mes solo si te quedas en costa." },
      { month: 9, priceLevel: "mid", tempMin: 17, tempMax: 32, rainfallMm: 5, crowdLevel: "mid", notes: "Calor cede, costa aún cálida. Excelente para combinar Marrakech + Sahara + Atlas." },
      { month: 10, priceLevel: "high", tempMin: 14, tempMax: 27, rainfallMm: 25, crowdLevel: "high", notes: "Sweet spot otoño: clima ideal, palmeras verdes, pico de turismo. Hoteles +40% sobre verano." },
      { month: 11, priceLevel: "high", tempMin: 10, tempMax: 22, rainfallMm: 30, crowdLevel: "high", notes: "Mejor relación clima/crowds del año. Día perfecto, noche fresca. Aún sin lluvia consistente." },
      { month: 12, priceLevel: "mid", tempMin: 6, tempMax: 19, rainfallMm: 30, crowdLevel: "mid", notes: "Frío empieza a notarse de noche. Navidad/NY se dispara en Marrakech (riads +80%)." },
    ],
    sweetSpotMonths: [4, 5, 10, 11],
    avoidMonths: [7, 8],
    description:
      "Marruecos tiene clima muy variado por geografía: la costa atlántica vive su clima oceánico templado todo el año, mientras que el interior (Marrakech, Fes, Meknes) se calienta hasta 40 °C+ en julio-agosto. El Atlas tiene nieve en cumbres de diciembre a marzo, y el Sahara es brutal en verano (45 °C en Erg Chebbi al mediodía).\n\nLa ventana ideal es bipolar: abril-mayo (primavera, valles verdes, Atlas nevado de fondo) y octubre-noviembre (otoño suave, sin lluvia, días largos). Estos cuatro meses son el pico turístico — riads y hoteles +40-80%. Junio y septiembre también funcionan si no te molesta calor moderado. Julio-agosto solo si te quedas en Essaouira o Agadir.\n\nVuelos desde España son baratísimos: Ryanair vuela Madrid/Barcelona-Marrakech desde 30 € one-way en temporada, 60-80 € en sweet spot.",
    tips: [
      "Reserva riad en la medina con terraza — el clima de tejado es 5 °C más fresco que la calle.",
      "El sur (desierto Merzouga, Zagora) es 5-10 °C más caluroso que Marrakech en verano. Solo nov-mar.",
      "Llevar efectivo (dírham): muchas riads no aceptan tarjeta y el regateo se hace en cash.",
      "Tour Sahara 3D/2N desde Marrakech vale 100-150 €. Pasar al menos una noche en haima.",
      "El tren ONCF (Casablanca-Marrakech-Fes) es puntual y barato — mejor que bus para distancias largas.",
      "Mes de Ramadán (varía cada año, mar-may en 2026-27) cambia horarios y cierra algunos restaurantes hasta sunset.",
    ],
  },
  {
    slug: "tailandia",
    name: "Tailandia",
    country: "Tailandia",
    region: "Sudeste asiático",
    hubIATAs: ["BKK", "HKT", "CNX"],
    heroImageSlug: "tailandia",
    months: [
      { month: 1, priceLevel: "high", tempMin: 21, tempMax: 32, rainfallMm: 20, crowdLevel: "high", notes: "Sweet spot pico turístico: cielo despejado, humedad baja, temperatura agradable. Hoteles +50%." },
      { month: 2, priceLevel: "high", tempMin: 22, tempMax: 33, rainfallMm: 25, crowdLevel: "high", notes: "Mismo perfil que enero. Mejor mes para combinar Bangkok + islas + Chiang Mai." },
      { month: 3, priceLevel: "mid", tempMin: 24, tempMax: 35, rainfallMm: 50, crowdLevel: "mid", notes: "Empieza calor extremo. Chiang Mai contamina (quema arroz). Hoteles bajando." },
      { month: 4, priceLevel: "mid", tempMin: 25, tempMax: 36, rainfallMm: 90, crowdLevel: "mid", notes: "Mes más caluroso (40 °C interior). Songkran 13-15 abril (fiesta del agua) — saturación masiva." },
      { month: 5, priceLevel: "low", tempMin: 25, tempMax: 34, rainfallMm: 170, crowdLevel: "low", notes: "Llega monzón. Lluvia vespertina diaria pero corta. Mar gulf calmo (Samui/Phangan)." },
      { month: 6, priceLevel: "low", tempMin: 24, tempMax: 33, rainfallMm: 180, crowdLevel: "low", notes: "Monzón en costa oeste (Phuket lluvia/oleaje). Costa este (gulf) bien. Precios mínimos." },
      { month: 7, priceLevel: "low", tempMin: 24, tempMax: 33, rainfallMm: 170, crowdLevel: "low", notes: "Igual que junio. Buen mes si flexible con clima. Hoteles -40% sobre pico." },
      { month: 8, priceLevel: "low", tempMin: 24, tempMax: 33, rainfallMm: 200, crowdLevel: "low", notes: "Monzón más intenso. Costa oeste cerrada. Bangkok inundaciones esporádicas." },
      { month: 9, priceLevel: "low", tempMin: 24, tempMax: 32, rainfallMm: 280, crowdLevel: "low", notes: "Mes con más lluvia del año. Solo recomendable para budget travelers flexibles." },
      { month: 10, priceLevel: "mid", tempMin: 23, tempMax: 32, rainfallMm: 220, crowdLevel: "mid", notes: "Lluvia disminuyendo. Crowds empiezan a llegar. Costa gulf todavía variable." },
      { month: 11, priceLevel: "high", tempMin: 22, tempMax: 31, rainfallMm: 50, crowdLevel: "high", notes: "Sweet spot inicio temporada seca. Hoteles suben rápido. Loy Krathong (festival luces) a mediados." },
      { month: 12, priceLevel: "high", tempMin: 21, tempMax: 31, rainfallMm: 10, crowdLevel: "high", notes: "Pico absoluto. NY Bangkok/Koh Phi Phi se dispara +100%. Reservar con 4 meses." },
    ],
    sweetSpotMonths: [11, 12, 1, 2],
    avoidMonths: [8, 9],
    description:
      "Tailandia opera con dos macro-estaciones: seca (nov-feb) y monzón (may-oct). La temperatura no varía mucho (28-34 °C), pero la lluvia y la humedad cambian todo. Nov-feb es el pico — cielo despejado, humedad baja, mar calmo en ambas costas. Hoteles y vuelos +40-80% sobre off-season.\n\nMarzo-abril es el período más caluroso (hasta 40 °C), con humo en el norte (Chiang Mai) por quemas de arroz. Songkran (13-15 abril) atrae visitantes para la fiesta del agua pero satura todo. Mayo a octubre es monzón: lluvia vespertina diaria (no constante) en gulf-side (Koh Samui, Koh Phangan), pero costa oeste (Phuket, Krabi) tiene mar muy revuelto y muchos boats cancelan.\n\nVuelos desde Europa: Madrid-Bangkok desde 450 € en mayo-junio con Qatar o Etihad, 700-900 € en pico. Excelente destino para combinar con escala Doha o Dubái.",
    tips: [
      "Si vas en monzón, elige costa gulf (Koh Samui, Koh Tao) — costa oeste es brutal.",
      "Visa exempt 30 días para españoles. Llegada por avión, extensible 30 días más en imm office.",
      "Tren overnight Bangkok-Chiang Mai (12h) cama segunda clase ~25 €, mucho más cómodo que bus.",
      "Reservar islas (Phi Phi, Tao, Lipe) con 2+ meses si vas en pico. Hoteles se llenan.",
      "Songkran (13-15 abril) es divertido pero salir a la calle = mojarse — proteger pasaporte/móvil bolsa estanca.",
      "Tuktuks negocian: ofrece 50% del primer precio y aléjate si no acepta. Grab/Bolt apps fijan precio.",
    ],
  },
  {
    slug: "vietnam",
    name: "Vietnam",
    country: "Vietnam",
    region: "Sudeste asiático",
    hubIATAs: ["HAN", "SGN", "DAD"],
    heroImageSlug: "vietnam",
    months: [
      { month: 1, priceLevel: "mid", tempMin: 14, tempMax: 21, rainfallMm: 20, crowdLevel: "mid", notes: "Norte (Hanoi) fresco/seco. Sur (Saigón) cálido seco. Tết (año nuevo lunar) cierra todo a finales." },
      { month: 2, priceLevel: "mid", tempMin: 15, tempMax: 22, rainfallMm: 25, crowdLevel: "mid", notes: "Sweet spot: post-Tết, clima fresco norte, perfecto sur. Sin lluvia, sin calor extremo." },
      { month: 3, priceLevel: "mid", tempMin: 18, tempMax: 25, rainfallMm: 30, crowdLevel: "mid", notes: "Sweet spot continúa. Sapa terrazas arroz verdes. Costa central (Da Nang/Hoi An) perfecta." },
      { month: 4, priceLevel: "mid", tempMin: 22, tempMax: 30, rainfallMm: 60, crowdLevel: "mid", notes: "Empieza calor. Norte aún tolerable. Sur muy húmedo. Buen mes para combinar todo." },
      { month: 5, priceLevel: "low", tempMin: 25, tempMax: 33, rainfallMm: 180, crowdLevel: "low", notes: "Calor + humedad fuertes. Inicio monzón sur (Saigón). Hoteles bajan." },
      { month: 6, priceLevel: "low", tempMin: 26, tempMax: 33, rainfallMm: 220, crowdLevel: "low", notes: "Monzón pleno sur. Norte calor pero estable. Bahía Halong cruceros riesgo tifón ocasional." },
      { month: 7, priceLevel: "low", tempMin: 26, tempMax: 33, rainfallMm: 320, crowdLevel: "low", notes: "Mes más lluvioso en sur. Centro (Hoi An/Da Nang) seco aún. Hoteles -40%." },
      { month: 8, priceLevel: "low", tempMin: 25, tempMax: 32, rainfallMm: 340, crowdLevel: "low", notes: "Similar julio. Centro empieza a recibir lluvia." },
      { month: 9, priceLevel: "low", tempMin: 24, tempMax: 31, rainfallMm: 280, crowdLevel: "low", notes: "Lluvia se mueve al centro. Hoi An inundaciones esporádicas. Norte mejora." },
      { month: 10, priceLevel: "mid", tempMin: 22, tempMax: 28, rainfallMm: 200, crowdLevel: "mid", notes: "Norte sweet spot otoño. Centro aún lluvioso. Mejor mes para Hanoi/Sapa/Halong." },
      { month: 11, priceLevel: "high", tempMin: 18, tempMax: 25, rainfallMm: 50, crowdLevel: "high", notes: "Sweet spot completo: norte fresco seco, centro seco, sur seco. Inicio pico turístico." },
      { month: 12, priceLevel: "high", tempMin: 15, tempMax: 22, rainfallMm: 25, crowdLevel: "high", notes: "Pico turístico Europa. Norte 12-18 °C — llevar capas. Sur 28-30 °C ideal." },
    ],
    sweetSpotMonths: [2, 3, 11, 12],
    avoidMonths: [7, 8],
    description:
      "Vietnam tiene tres climas distintos (norte/centro/sur), lo que hace que NO haya un mes ideal para todo el país a la vez. Norte (Hanoi, Sapa, Halong) tiene 4 estaciones reales: invierno fresco/seco dic-feb, primavera ideal mar-abr, verano húmedo jun-ago, otoño perfecto sep-nov. Sur (Saigón, delta Mekong, Phú Quốc) tiene seca nov-abr y húmeda may-oct. Centro (Da Nang, Hoi An, Hue) es el más complejo: seco feb-may, húmedo jun-aug, lluvioso/inundaciones sep-nov.\n\nLa ventana sweet spot que funciona para todo el país son febrero-marzo y noviembre-diciembre. Si vas a moverte de norte a sur, evita julio-agosto (calor brutal + monzón) y septiembre-octubre (Hoi An se inunda). Tết (año nuevo lunar, finales enero o febrero según año) bloquea trenes y cierra muchos restaurantes 3-7 días.\n\nVuelos desde Madrid/Barcelona a Hanoi/Saigón: 550-700 € en mayo-agosto, 800-1100 € pico, vía Doha, Estambul o Bangkok.",
    tips: [
      "Vuelo doméstico Hanoi-Saigón es 30-50 € (VietJet) — ahorra 30h de tren.",
      "Visa-on-arrival se eliminó: para españoles, e-visa $25 USD online (apply 5 días antes).",
      "Bahía Halong: cruceros de 2D/1N son trampa turística masificada — 3D/2N en Bai Tu Long evita el bullicio.",
      "Hoi An sastrería es real: ropa a medida en 24h, calidad alta, 60-100 € por traje completo.",
      "Si vas a Sapa, mejor agosto-octubre (terrazas verdes) o septiembre (cosecha dorada).",
      "Comida callejera: pho desayuno (1-2 €), banh mi (1 €), bun cha en Hanoi (2-3 €). No te pierdas.",
    ],
  },
  {
    slug: "mexico",
    name: "México",
    country: "México",
    region: "Norteamérica",
    hubIATAs: ["MEX", "CUN", "SJD"],
    heroImageSlug: "mexico",
    months: [
      { month: 1, priceLevel: "high", tempMin: 19, tempMax: 28, rainfallMm: 30, crowdLevel: "high", notes: "Sweet spot Caribe: temperaturas perfectas, mar calmo, vientos sec. Hoteles caribeños +60%." },
      { month: 2, priceLevel: "high", tempMin: 19, tempMax: 29, rainfallMm: 20, crowdLevel: "high", notes: "Igual que enero. Mejor mes para combinar CDMX + Yucatán + Caribe." },
      { month: 3, priceLevel: "high", tempMin: 21, tempMax: 30, rainfallMm: 15, crowdLevel: "high", notes: "Spring break (semanas 2-3) satura Cancún/Playa. Aún seco y caluroso." },
      { month: 4, priceLevel: "high", tempMin: 22, tempMax: 32, rainfallMm: 20, crowdLevel: "high", notes: "Sweet spot final temporada seca. Semana Santa cierra todo el país y dispara precios." },
      { month: 5, priceLevel: "mid", tempMin: 24, tempMax: 33, rainfallMm: 70, crowdLevel: "mid", notes: "Calor extremo Yucatán/costa Pacífico. Llegan crowds europeos. Crowds caen post Semana Santa." },
      { month: 6, priceLevel: "low", tempMin: 24, tempMax: 32, rainfallMm: 130, crowdLevel: "low", notes: "Inicio lluvia + huracanes (Caribe/Pacífico). Lluvia tropical vespertina. Precios bajan." },
      { month: 7, priceLevel: "mid", tempMin: 24, tempMax: 32, rainfallMm: 150, crowdLevel: "mid", notes: "Lluvia + sargazo Caribe. Pacífico mejor. Vacaciones EEUU sube precios destinos resort." },
      { month: 8, priceLevel: "mid", tempMin: 24, tempMax: 31, rainfallMm: 170, crowdLevel: "mid", notes: "Pico huracanes. Lluvia intensa. CDMX tiempo perfecto (20-25 °C, lluvia vespertina)." },
      { month: 9, priceLevel: "low", tempMin: 23, tempMax: 30, rainfallMm: 200, crowdLevel: "low", notes: "Mes más lluvioso. Riesgo huracán pico mid-sep. Hoteles caribeños -50%." },
      { month: 10, priceLevel: "low", tempMin: 22, tempMax: 30, rainfallMm: 130, crowdLevel: "low", notes: "Lluvia disminuye. Huracanes residuales. Excelente CDMX." },
      { month: 11, priceLevel: "high", tempMin: 20, tempMax: 28, rainfallMm: 50, crowdLevel: "high", notes: "Sweet spot otoño: lluvia se va, Caribe calmo, Día de Muertos (1-2 nov) imperdible." },
      { month: 12, priceLevel: "high", tempMin: 19, tempMax: 27, rainfallMm: 30, crowdLevel: "high", notes: "Pico pre-Navidad. NY/Navidad Caribe se dispara +80%. Reservar con 4 meses." },
    ],
    sweetSpotMonths: [11, 12, 4],
    avoidMonths: [8, 9],
    description:
      "México opera con dos macro-climas según altitud y costa: la meseta central (CDMX, Oaxaca, Guanajuato) tiene clima templado todo el año (10-25 °C), mientras que costas (Caribe, Pacífico, Baja) son tropicales 22-33 °C. La temporada de huracanes en el Caribe es de junio a noviembre, con pico septiembre.\n\nLa ventana óptima es noviembre-abril: clima seco, mar calmo, días soleados. Diciembre-enero pico turístico mundial (especialmente NY) con hoteles +60-100%. Día de Muertos (1-2 noviembre) es una experiencia cultural única en Oaxaca/Michoacán/CDMX. Mayo es mes pivote — calor extremo Yucatán pero aún seco. Junio-octubre lluvia + posibles huracanes en Caribe.\n\nVuelos Madrid-Cancún/Ciudad de México: directos desde 400 € en off-season, 600-900 € pico. Iberia tiene rutas diarias.",
    tips: [
      "Yucatán sin coche es difícil — alquila en Cancún/Mérida desde 25 €/día (no aceptan tarjeta débito).",
      "Sargazo Caribe (mayo-octubre): playas Mahahual/Holbox/Mujeres tienen menos. Tulum/Playa del Carmen muy afectadas en pico.",
      "CDMX altitud 2240m — primer día baja ritmo y mucha agua. La primera noche en hotel a tener en cuenta.",
      "Día de Muertos: Pátzcuaro/Janitzio (Michoacán) más auténtico que Oaxaca turística. Reservar 3+ meses.",
      "Visa: españoles entran con FMM (forma migratoria) gratis 180 días — guardar el papel hasta salir.",
      "Cenotes: visita temprano (antes 10 am) para evitar tours masivos. Cenote Ik Kil queda sobrevalorado.",
    ],
  },
  {
    slug: "peru",
    name: "Perú",
    country: "Perú",
    region: "Sudamérica",
    hubIATAs: ["LIM", "CUZ"],
    heroImageSlug: "peru",
    months: [
      { month: 1, priceLevel: "mid", tempMin: 19, tempMax: 27, rainfallMm: 15, crowdLevel: "mid", notes: "Costa Lima cálida soleada. Sierra (Cuzco) lluviosa — Inca Trail cerrado en febrero, intermitente enero." },
      { month: 2, priceLevel: "low", tempMin: 19, tempMax: 28, rainfallMm: 15, crowdLevel: "low", notes: "Inca Trail cerrado todo el mes. Machu Picchu accesible pero lluvia diaria. Costa pico verano." },
      { month: 3, priceLevel: "low", tempMin: 18, tempMax: 27, rainfallMm: 20, crowdLevel: "low", notes: "Inca Trail reabre. Sierra aún lluvia ocasional. Costa termina verano." },
      { month: 4, priceLevel: "mid", tempMin: 16, tempMax: 24, rainfallMm: 15, crowdLevel: "mid", notes: "Sierra empieza a secarse. Costa enfría. Lluvia residual." },
      { month: 5, priceLevel: "high", tempMin: 14, tempMax: 22, rainfallMm: 5, crowdLevel: "high", notes: "Sweet spot inicio temporada seca sierra. Machu Picchu cielo despejado mayoría días." },
      { month: 6, priceLevel: "high", tempMin: 12, tempMax: 21, rainfallMm: 2, crowdLevel: "high", notes: "Pico turístico Inca Trail. Inti Raymi (24 junio) en Cuzco — saturación. Reservar 4 meses." },
      { month: 7, priceLevel: "high", tempMin: 12, tempMax: 21, rainfallMm: 2, crowdLevel: "high", notes: "Vacaciones EEUU + Europa. Saturación máxima. Hoteles Cuzco +80%." },
      { month: 8, priceLevel: "high", tempMin: 13, tempMax: 22, rainfallMm: 3, crowdLevel: "high", notes: "Igual que julio. Cielo perfecto sierra. Costa Lima nublada típica (garúa)." },
      { month: 9, priceLevel: "mid", tempMin: 14, tempMax: 23, rainfallMm: 8, crowdLevel: "mid", notes: "Final temporada seca sierra. Crowds bajando. Clima ideal aún." },
      { month: 10, priceLevel: "mid", tempMin: 15, tempMax: 24, rainfallMm: 15, crowdLevel: "mid", notes: "Empieza lluvia sierra. Costa Lima sigue garúa. Hoteles bajando." },
      { month: 11, priceLevel: "mid", tempMin: 16, tempMax: 25, rainfallMm: 30, crowdLevel: "mid", notes: "Lluvia aumenta sierra. Costa Lima limpia (sol). Festival All Saints." },
      { month: 12, priceLevel: "mid", tempMin: 17, tempMax: 26, rainfallMm: 40, crowdLevel: "mid", notes: "Pico lluvia sierra empieza. Costa Lima verano. Diciembre fin año eleva hoteles." },
    ],
    sweetSpotMonths: [5, 6, 7, 8],
    avoidMonths: [1, 2, 3],
    description:
      "Perú tiene tres macro-regiones: costa (Lima, Paracas, norte), sierra (Cuzco, Machu Picchu, lago Titicaca) y selva (Iquitos, Tambopata). El clima en cada una es opuesto y casi inversamente correlacionado. La sierra — donde está la mayoría del turismo — tiene temporada seca mayo-septiembre y lluvia octubre-abril. Costa Lima tiene verano nov-abr (sol) y \"invierno\" may-oct (nublado garúa, 15-17 °C).\n\nSi vas a Machu Picchu / Inca Trail / Cuzco, la única ventana razonable es mayo-agosto (especialmente junio-julio si quieres trek). Febrero el Inca Trail cierra por mantenimiento. Diciembre-marzo Machu Picchu es accesible pero con lluvia diaria + camino resbaladizo. La sierra es muy fría por la noche todo el año (4-8 °C en Cuzco).\n\nVuelos Madrid-Lima: 600-800 € off-season, 900-1300 € en pico (jun-ago). Iberia y Air Europa tienen directos.",
    tips: [
      "Reserva Inca Trail con 6+ meses (cupos limitados a 500/día incluido staff). Salkantay o Lares como alternativa.",
      "Cuzco está a 3400m — llega al menos 2 días antes para aclimatar. Mate de coca y descanso.",
      "Lima en mayo-octubre es gris y húmeda — vuelos baratos pero comer mucho mariscos (es la mejor compensación).",
      "Buses interurbanos Cruz del Sur tienen cama 180° y aseo. Lima-Cuzco 22h = mucho. Mejor vuelo doméstico (LAN/Star Perú).",
      "Soroche pills (para mal de altura): pídela en farmacias Cuzco/Puno. Si síntomas graves bajar a Sacred Valley (2700m).",
      "Machu Picchu: entrada CIRCUITO 2 incluye Huayna Picchu (el pico clásico de la foto). Reservar 3+ meses.",
    ],
  },
  {
    slug: "india",
    name: "India",
    country: "India",
    region: "Sur de Asia",
    hubIATAs: ["BOM", "DEL", "COK"],
    heroImageSlug: "india",
    months: [
      { month: 1, priceLevel: "high", tempMin: 8, tempMax: 21, rainfallMm: 20, crowdLevel: "high", notes: "Pico turístico norte (Delhi/Rajastán). Mañanas frías (5-10 °C), días soleados. Goa pico playa." },
      { month: 2, priceLevel: "high", tempMin: 11, tempMax: 24, rainfallMm: 25, crowdLevel: "high", notes: "Sweet spot norte: clima perfecto, sin lluvia. Holi (festival colores) último día febrero / primer marzo." },
      { month: 3, priceLevel: "high", tempMin: 16, tempMax: 30, rainfallMm: 20, crowdLevel: "high", notes: "Empieza calor norte. Sur (Kerala) aún manejable. Holi siempre llena hoteles." },
      { month: 4, priceLevel: "mid", tempMin: 22, tempMax: 36, rainfallMm: 30, crowdLevel: "mid", notes: "Calor sube fuerte norte (38 °C+). Sur empieza calor. Hoteles bajan." },
      { month: 5, priceLevel: "low", tempMin: 26, tempMax: 40, rainfallMm: 50, crowdLevel: "low", notes: "Brutal en norte/oeste (45 °C+). Solo Himalaya manejable. Pre-monzón Kerala." },
      { month: 6, priceLevel: "low", tempMin: 27, tempMax: 38, rainfallMm: 200, crowdLevel: "low", notes: "Monzón llega Kerala/Goa. Brutal humedad. Norte aún caliente. Mes peor turismo." },
      { month: 7, priceLevel: "low", tempMin: 26, tempMax: 35, rainfallMm: 320, crowdLevel: "low", notes: "Monzón nacional. Goa cerrado playa, Kerala inundaciones. Himachal/Ladakh accesible." },
      { month: 8, priceLevel: "low", tempMin: 26, tempMax: 33, rainfallMm: 280, crowdLevel: "low", notes: "Monzón continúa. Norte (Delhi) caluroso húmedo. Sur lluvia." },
      { month: 9, priceLevel: "low", tempMin: 25, tempMax: 33, rainfallMm: 180, crowdLevel: "low", notes: "Monzón retirándose. Diwali (oct/nov según año) levanta precios pre-festival." },
      { month: 10, priceLevel: "mid", tempMin: 20, tempMax: 31, rainfallMm: 70, crowdLevel: "mid", notes: "Sweet spot post-monzón: campos verdes, ríos llenos. Norte seca. Diwali ilumina ciudades." },
      { month: 11, priceLevel: "high", tempMin: 14, tempMax: 26, rainfallMm: 15, crowdLevel: "high", notes: "Sweet spot temporada alta inicio: clima perfecto, sin lluvia, Pushkar Camel Fair mediados nov." },
      { month: 12, priceLevel: "high", tempMin: 9, tempMax: 22, rainfallMm: 10, crowdLevel: "high", notes: "Pico turístico. Hoteles disparados Rajastán/Goa. NY playa Goa caos." },
    ],
    sweetSpotMonths: [10, 11, 2, 3],
    avoidMonths: [5, 6, 7],
    description:
      "India tiene tres macro-estaciones: invierno (oct-feb), verano (mar-may) y monzón (jun-sep). La temperatura y la lluvia varían enormemente según región: norte (Delhi, Rajastán, Agra, Varanasi) puede ir de 5 °C en enero a 48 °C en mayo. Sur (Kerala, Tamil Nadu, Goa) es más estable 22-35 °C pero recibe el monzón un mes antes (junio) que el norte.\n\nLa ventana óptima para circuito clásico (Rajastán + Agra + Varanasi) es octubre a marzo. Noviembre-febrero es el pico turístico, con hoteles +50-80% sobre off-season. Holi (febrero-marzo según año) y Diwali (oct-nov) son los dos festivales que justifican planear el viaje alrededor — pero llenan hoteles. Mayo-junio el norte es brutal (45 °C+); solo Himalaya (Ladakh, Manali) es accesible. Goa cierra playas en monzón (jun-sep).\n\nVuelos Madrid-Delhi/Bombay: 450-600 € off-season, 700-900 € pico, vía Estambul o Doha.",
    tips: [
      "Visa e-Tourist online ~25 USD, 30 días, aplicar 1-2 semanas antes (oficial).",
      "Tren overnight es seguro y barato en clase 2AC (compartimento 4 camas con cortina). Tatkal tickets se liberan 24h antes.",
      "Agua: siempre embotellada con seal. Hielo en restaurantes locales = riesgo Delhi belly.",
      "Goa norte (Vagator, Anjuna) es fiesta hippy; Goa sur (Palolem, Patnem) es tranquilo. Elige según vibe.",
      "Holi: festival increíble pero ropa que tires (los tintes no salen). Gafas de buceo evitan ojo irritado.",
      "Taj Mahal abre antes de salir el sol — entrada amanecer (sin colas, luz mágica) vale la madrugada.",
    ],
  },
  {
    slug: "egipto",
    name: "Egipto",
    country: "Egipto",
    region: "Norte de África",
    hubIATAs: ["CAI", "HRG", "SSH"],
    heroImageSlug: "egipto",
    months: [
      { month: 1, priceLevel: "high", tempMin: 9, tempMax: 19, rainfallMm: 5, crowdLevel: "high", notes: "Sweet spot temporada alta: Cairo/Luxor agradable, Mar Rojo tibio. Hoteles +50%." },
      { month: 2, priceLevel: "high", tempMin: 10, tempMax: 21, rainfallMm: 5, crowdLevel: "high", notes: "Igual enero. Mar Rojo (Hurghada/Sharm) 22-24 °C. Buceo perfecto." },
      { month: 3, priceLevel: "high", tempMin: 13, tempMax: 24, rainfallMm: 3, crowdLevel: "high", notes: "Sweet spot final temporada alta. Khamsin (viento desértico cálido) ocasional." },
      { month: 4, priceLevel: "high", tempMin: 16, tempMax: 28, rainfallMm: 2, crowdLevel: "high", notes: "Calor empieza desierto. Mar Rojo perfecto 26 °C. Semana Santa eleva hoteles." },
      { month: 5, priceLevel: "mid", tempMin: 19, tempMax: 32, rainfallMm: 1, crowdLevel: "mid", notes: "Calor fuerte interior. Mar Rojo todavía manejable. Crowds caen." },
      { month: 6, priceLevel: "low", tempMin: 22, tempMax: 35, rainfallMm: 0, crowdLevel: "low", notes: "Calor extremo Aswan/Luxor (40 °C+). Solo costa Mar Rojo razonable. Hoteles bajan." },
      { month: 7, priceLevel: "low", tempMin: 24, tempMax: 36, rainfallMm: 0, crowdLevel: "low", notes: "Peor mes Nilo. Mar Rojo 28-30 °C - bueno solo en agua." },
      { month: 8, priceLevel: "low", tempMin: 24, tempMax: 36, rainfallMm: 0, crowdLevel: "low", notes: "Igual julio. Vacaciones EU compensan ligeramente Mar Rojo." },
      { month: 9, priceLevel: "mid", tempMin: 22, tempMax: 33, rainfallMm: 1, crowdLevel: "mid", notes: "Calor bajando. Buen mes para Mar Rojo, todavía algo caluroso interior." },
      { month: 10, priceLevel: "high", tempMin: 18, tempMax: 29, rainfallMm: 5, crowdLevel: "high", notes: "Sweet spot otoño: temperaturas perfectas, mar 26 °C, crowds vuelven." },
      { month: 11, priceLevel: "high", tempMin: 14, tempMax: 25, rainfallMm: 5, crowdLevel: "high", notes: "Sweet spot inicio temporada alta. Cairo/Luxor 14-25 °C ideal." },
      { month: 12, priceLevel: "high", tempMin: 11, tempMax: 21, rainfallMm: 5, crowdLevel: "high", notes: "NY Mar Rojo dispara hoteles. Tiempo perfecto interior." },
    ],
    sweetSpotMonths: [10, 11, 3, 4],
    avoidMonths: [7, 8],
    description:
      "Egipto se divide turísticamente en Nilo (Cairo, Luxor, Aswan) y Mar Rojo (Hurghada, Sharm el-Sheikh, Marsa Alam). El clima desértico tiene veranos brutales (junio-agosto) con 38-45 °C en Aswan/Luxor — solo razonable a primera hora del día, y muchos templos no tienen sombra.\n\nLa ventana óptima para el circuito clásico (Nilo + Pirámides) es octubre a abril. Noviembre-marzo es el pico turístico, con hoteles +50-80% sobre off-season y Sharm/Hurghada llenísimos en NY y Semana Santa. Mar Rojo funciona casi todo el año (agua 22-30 °C), pero diciembre-febrero el agua está más fresca (22-24 °C, sigue siendo buceable con shorty).\n\nVuelos Madrid-Cairo/Hurghada: directos desde 200 € en off-season con Air Cairo / EgyptAir; 400-600 € pico (Semana Santa, NY).",
    tips: [
      "Visa e-Visa online $25 USD, 30 días, o on-arrival en Cairo. Ambas funcionan.",
      "Cairo es caótico — usa Uber/Careem (apps oficiales) en lugar de taxi blanco. Precio fijo.",
      "Crucero Nilo Luxor-Aswan 4N/5D es la forma cómoda de ver Edfu/Kom Ombo. Reservar barco de tamaño medio (no mega).",
      "Pirámides Giza al amanecer (apertura 7 am) — vacíos hasta 9.30 am. Después tours bus llegan masivos.",
      "Mar Rojo: Marsa Alam tiene mejor coral que Hurghada (más virgen). Sharm queda saturado pero infra buena.",
      "Propinas (baksheesh) son una constante — lleva billetes pequeños egipcios (5-20 LE = 0.10-0.40 €).",
    ],
  },
  {
    slug: "kenia",
    name: "Kenia",
    country: "Kenia",
    region: "África oriental",
    hubIATAs: ["NBO", "MBA"],
    heroImageSlug: "kenia",
    months: [
      { month: 1, priceLevel: "high", tempMin: 13, tempMax: 27, rainfallMm: 50, crowdLevel: "high", notes: "Sweet spot temporada seca corta. Safari excellente. Pico crowds europeos NY." },
      { month: 2, priceLevel: "high", tempMin: 14, tempMax: 28, rainfallMm: 60, crowdLevel: "high", notes: "Sweet spot continúa. Tiempo seco soleado. Animales en watering holes." },
      { month: 3, priceLevel: "mid", tempMin: 15, tempMax: 27, rainfallMm: 120, crowdLevel: "mid", notes: "Empieza long rains. Camuflaje verde de safari pero animales dispersos." },
      { month: 4, priceLevel: "low", tempMin: 15, tempMax: 26, rainfallMm: 220, crowdLevel: "low", notes: "Pico long rains. Mes peor safari. Pistas embarradas. Muchos campamentos cierran." },
      { month: 5, priceLevel: "low", tempMin: 14, tempMax: 25, rainfallMm: 170, crowdLevel: "low", notes: "Long rains continúan. Hoteles -50% pero experiencia comprometida." },
      { month: 6, priceLevel: "mid", tempMin: 13, tempMax: 24, rainfallMm: 30, crowdLevel: "mid", notes: "Empieza temporada seca larga. Aún algo de barro. Crowds aún bajos." },
      { month: 7, priceLevel: "high", tempMin: 12, tempMax: 24, rainfallMm: 15, crowdLevel: "high", notes: "Sweet spot Great Migration Masai Mara — llegan ñus de Tanzania. Crowds + precios disparados." },
      { month: 8, priceLevel: "high", tempMin: 12, tempMax: 24, rainfallMm: 20, crowdLevel: "high", notes: "Pico migration + river crossings (Mara River). Reservar 6+ meses." },
      { month: 9, priceLevel: "high", tempMin: 13, tempMax: 26, rainfallMm: 25, crowdLevel: "high", notes: "Migration sigue, vuelos baratos europeos vuelta cole. Excelente safari." },
      { month: 10, priceLevel: "mid", tempMin: 15, tempMax: 27, rainfallMm: 50, crowdLevel: "mid", notes: "Migration empieza a moverse de vuelta Tanzania. Aún muy buen safari." },
      { month: 11, priceLevel: "low", tempMin: 16, tempMax: 26, rainfallMm: 120, crowdLevel: "low", notes: "Short rains. Lluvia vespertina. Pistas pasables. Precios bajan rápidamente." },
      { month: 12, priceLevel: "high", tempMin: 14, tempMax: 27, rainfallMm: 80, crowdLevel: "high", notes: "Short rains termina mediados. NY/Navidad dispara hoteles costa Mombasa." },
    ],
    sweetSpotMonths: [7, 8, 1, 2],
    avoidMonths: [4, 5],
    description:
      "Kenia tiene dos temporadas de lluvia: long rains (abril-mayo) y short rains (noviembre principio diciembre). La temperatura es relativamente estable (Nairobi 1700m altitud, 13-26 °C todo el año), pero la lluvia cambia totalmente la calidad del safari.\n\nLa Great Migration de los ñus llega al Masai Mara entre julio y septiembre — es el evento safari más espectacular del mundo, con river crossings en el Mara River. Esto eleva precios masivamente: lodges premium pasan de $300/noche fuera de temporada a $800-1500/noche en pico. Reservar con 6+ meses. La temporada seca corta (enero-febrero) también es excelente — animales concentrados en watering holes y crowds más bajos.\n\nVuelos Madrid-Nairobi: 500-700 € off-season, 800-1100 € pico, vía Estambul, Doha o Ámsterdam (KLM).",
    tips: [
      "Visa e-Visa online ~50 USD, antes de viajar. Llega impresa.",
      "Safari requiere 4x4 — paquetes 7D/6N de 1500-2500 € incluyen Mara + Naivasha + Nakuru.",
      "Vacuna fiebre amarilla obligatoria (yellow card). Antipalúdicos también recomendados.",
      "Pequeños lodges/tented camps batten budget pero experiencia premium — alternativa a hoteles grandes.",
      "Combinar safari + playa Diani Beach (sur Mombasa) requiere vuelo doméstico (1h en lugar de 10h coche).",
      "Migration river crossing requiere paciencia — un día entero esperando puede no ver nada. 3-4 días en Mara aumenta probabilidad.",
    ],
  },
  {
    slug: "islandia",
    name: "Islandia",
    country: "Islandia",
    region: "Europa norte",
    hubIATAs: ["KEF"],
    heroImageSlug: "islandia",
    months: [
      { month: 1, priceLevel: "low", tempMin: -3, tempMax: 2, rainfallMm: 80, crowdLevel: "low", notes: "Pleno invierno, 5h luz diaria. Aurora boreal alta probabilidad. Carreteras complicadas." },
      { month: 2, priceLevel: "low", tempMin: -3, tempMax: 2, rainfallMm: 70, crowdLevel: "low", notes: "Igual enero. Días empiezan a alargarse. Ice caves Vatnajökull abiertas." },
      { month: 3, priceLevel: "low", tempMin: -2, tempMax: 4, rainfallMm: 65, crowdLevel: "low", notes: "Auroras todavía visibles primera quincena. Días 11h. Mejor balance auroras / luz." },
      { month: 4, priceLevel: "mid", tempMin: 0, tempMax: 7, rainfallMm: 55, crowdLevel: "mid", notes: "Primavera tímida. Carreteras se limpian. Crowds bajos. Nieve aún en interior." },
      { month: 5, priceLevel: "mid", tempMin: 4, tempMax: 10, rainfallMm: 45, crowdLevel: "mid", notes: "Casi sin oscuridad. Frailecillos llegan. Buen mes para Ring Road sin pico." },
      { month: 6, priceLevel: "high", tempMin: 7, tempMax: 13, rainfallMm: 50, crowdLevel: "high", notes: "Sweet spot sol de medianoche. Verde intenso. Pico turismo empieza." },
      { month: 7, priceLevel: "high", tempMin: 9, tempMax: 15, rainfallMm: 50, crowdLevel: "high", notes: "Mes pico absoluto. Carreteras interior (F-roads) abiertas. Hoteles +60%, reservar 4+ meses." },
      { month: 8, priceLevel: "high", tempMin: 8, tempMax: 14, rainfallMm: 65, crowdLevel: "high", notes: "Pico turístico continúa. Final agosto auroras pueden empezar a verse." },
      { month: 9, priceLevel: "mid", tempMin: 5, tempMax: 11, rainfallMm: 70, crowdLevel: "mid", notes: "Auroras regresan. Crowds bajando. Mejor mes para combinar todavía verde + auroras." },
      { month: 10, priceLevel: "low", tempMin: 2, tempMax: 7, rainfallMm: 80, crowdLevel: "low", notes: "Otoño naranja. Auroras potentes. F-roads cerradas mediados mes. Tiempo errático." },
      { month: 11, priceLevel: "low", tempMin: -1, tempMax: 4, rainfallMm: 80, crowdLevel: "low", notes: "Invierno empieza. Hielo en carreteras. Auroras pico." },
      { month: 12, priceLevel: "mid", tempMin: -2, tempMax: 3, rainfallMm: 80, crowdLevel: "mid", notes: "Solo 4h luz. Auroras + decoraciones Navidad. NY Reykjavík dispara precios." },
    ],
    sweetSpotMonths: [6, 7, 8],
    avoidMonths: [],
    description:
      "Islandia tiene un clima oceánico extremo: ni demasiado frío en invierno (la corriente del Golfo modera Reykjavík a -3/+2 °C en enero) ni caluroso en verano (máximas 14-15 °C en julio). Lo que cambia drásticamente es la luz: en junio el sol no se pone (sol de medianoche), mientras que en diciembre solo hay 4 horas de luz al día.\n\nEsto crea dos viajes muy distintos: invierno (oct-mar) para auroras boreales, ice caves, paisaje nevado; verano (jun-ago) para Ring Road con todas las carreteras abiertas, sol de medianoche, frailecillos. Pico turístico (julio-agosto) saturan hoteles y suben precios +60%. Mayo y septiembre son ventanas excelentes — clima razonable, crowds bajos, precios moderados.\n\nVuelos Madrid/Barcelona-Reykjavík: directos PLAY Airlines o Iberia desde 150 € one-way en off-season, 300-400 € pico. Combinable Vueling vía Barcelona.",
    tips: [
      "Alquilar coche (4x4 si vas en invierno o a interior) es obligatorio — no hay transporte público realista.",
      "Ring Road completo (1300 km) en 8-10 días con calma. 5-6 días es apretado.",
      "Auroras: descarga Aurora app, busca cielos despejados, +20 km lejos de Reykjavík para luz baja.",
      "Comer es caro: supermercado Bonus + restaurante 1 vez/día ahorra 50%. Plato típico 30-40 €.",
      "Hot springs / piscinas geotermales públicas (Reykjavík: Sundhöllin, Vesturbær) son 8-12 € — alternativa a Blue Lagoon (60-90 €).",
      "Tormentas invierno cierran carreteras horas — siempre revisar SafeTravel.is y vedur.is antes de salir.",
    ],
  },
  {
    slug: "nueva-zelanda",
    name: "Nueva Zelanda",
    country: "Nueva Zelanda",
    region: "Oceanía",
    hubIATAs: ["AKL"],
    heroImageSlug: "nueva-zelanda",
    months: [
      { month: 1, priceLevel: "high", tempMin: 13, tempMax: 23, rainfallMm: 70, crowdLevel: "high", notes: "Pleno verano sur. Vacaciones nacionales — saturación campings y airbnbs. Reservar 4+ meses." },
      { month: 2, priceLevel: "high", tempMin: 13, tempMax: 23, rainfallMm: 60, crowdLevel: "high", notes: "Sweet spot verano: clima estable, crowds bajan post escolar. Mes recomendado." },
      { month: 3, priceLevel: "high", tempMin: 12, tempMax: 22, rainfallMm: 70, crowdLevel: "mid", notes: "Sweet spot otoño temprano. Días largos, viñedos en cosecha, foliage empezando." },
      { month: 4, priceLevel: "mid", tempMin: 9, tempMax: 19, rainfallMm: 90, crowdLevel: "mid", notes: "Otoño. Crowds bajos. Riesgo lluvia. Hoteles bajan." },
      { month: 5, priceLevel: "mid", tempMin: 7, tempMax: 16, rainfallMm: 100, crowdLevel: "low", notes: "Lluvia frecuente. South Island puede pillar primera nieve sierra." },
      { month: 6, priceLevel: "mid", tempMin: 4, tempMax: 13, rainfallMm: 100, crowdLevel: "mid", notes: "Inicio invierno. Ski abre en isla sur (Queenstown, Wanaka)." },
      { month: 7, priceLevel: "high", tempMin: 3, tempMax: 12, rainfallMm: 90, crowdLevel: "high", notes: "Pico ski. Queenstown + The Remarkables disparados. Reservar lodge 4 meses." },
      { month: 8, priceLevel: "high", tempMin: 4, tempMax: 13, rainfallMm: 90, crowdLevel: "high", notes: "Continúa ski. Resto del país tranquilo." },
      { month: 9, priceLevel: "mid", tempMin: 6, tempMax: 16, rainfallMm: 80, crowdLevel: "mid", notes: "Primavera empieza. Cordilleras Alps blancas, prados verdes, flores. Buen mes fotografía." },
      { month: 10, priceLevel: "mid", tempMin: 8, tempMax: 18, rainfallMm: 80, crowdLevel: "mid", notes: "Primavera plena. Crías ovejas + camping abre. Pre-pico de turismo." },
      { month: 11, priceLevel: "high", tempMin: 10, tempMax: 20, rainfallMm: 80, crowdLevel: "high", notes: "Sweet spot fin primavera: clima ideal, flores, crowds aún razonables." },
      { month: 12, priceLevel: "high", tempMin: 12, tempMax: 22, rainfallMm: 75, crowdLevel: "high", notes: "Pico vacaciones Navidad. Sun sun sun. Lodges y campings disparados." },
    ],
    sweetSpotMonths: [2, 3, 11],
    avoidMonths: [],
    description:
      "Nueva Zelanda tiene estaciones invertidas respecto al hemisferio norte: verano dic-feb, otoño mar-may, invierno jun-aug, primavera sep-nov. El clima oceánico templado mantiene temperaturas razonables todo el año (raramente fuera del rango 5-25 °C), pero hay micro-climas extremos: la West Coast de South Island recibe 5 metros de lluvia/año mientras Otago solo 600 mm.\n\nLa ventana óptima son febrero-marzo (verano estabilizado, post-vacaciones locales) y noviembre (primavera completa, flores, crowds aún razonables). Diciembre-enero es saturación total (escolar nacional) y disparan precios. Si vas a hacer ski, julio-agosto es el pico — Queenstown se llena. Junio y septiembre son meses pivote interesantes: ski empezando + el resto del país tranquilo.\n\nVuelos Madrid-Auckland: 1200-1500 € off-season, 1700-2200 € pico, vía Dubái, Singapore, Hong Kong (Emirates/Qatar/Singapore Airlines). Stopover Asia es casi obligatorio (no hay vuelos directos).",
    tips: [
      "Visa: españoles necesitan NZeTA online (NZD$23) + IVL turismo (NZD$35), descarga app antes de viajar.",
      "Alquilar camper o coche es la mejor manera — public transport limitado entre ciudades.",
      "South Island prima sobre North para naturaleza (Fiordland, Mount Cook, Glaciers). 7-10 días South + 4 días Auckland/Rotorua.",
      "Camping freedom permitido en muchos sitios con self-contained vehicle. App CamperMate muestra spots legales.",
      "Tongariro Alpine Crossing (1 día, 19km) es el trek de día más famoso del país. Reservar shuttle.",
      "Milford Sound: ir desde Te Anau (no Queenstown — son 4h cada lado). Cruise 2h con BlueArrow / SouthernDiscoveries.",
    ],
  },
  // SSS296 (18 may 2026): +5 destinos (Argentina, Chile, Costa Rica, Sudáfrica, Dubai)
  {
    slug: "argentina",
    name: "Argentina",
    country: "Argentina",
    region: "Sudamérica",
    hubIATAs: ["EZE", "AEP", "BRC", "FTE", "USH"],
    heroImageSlug: "argentina",
    months: [
      { month: 1, priceLevel: "high", tempMin: 19, tempMax: 30, rainfallMm: 120, crowdLevel: "high", notes: "Verano austral pico. Patagonia accesible (Glaciar Perito Moreno) y Bariloche. BA húmedo y cerrado por vacaciones." },
      { month: 2, priceLevel: "high", tempMin: 18, tempMax: 29, rainfallMm: 110, crowdLevel: "high", notes: "Sigue verano alto. Buen mes para sur (Calafate, Ushuaia). Carnaval en Gualeguaychú a fin de mes." },
      { month: 3, priceLevel: "mid", tempMin: 15, tempMax: 26, rainfallMm: 130, crowdLevel: "mid", notes: "Otoño empieza, ideal Cataratas del Iguazú (caudal alto post-lluvias) y BA agradable. Mejor mes precio/clima Patagonia." },
      { month: 4, priceLevel: "mid", tempMin: 12, tempMax: 23, rainfallMm: 90, crowdLevel: "mid", notes: "Mendoza vendimia (vino). BA fresco y agradable. Patagonia con colores otoñales espectaculares antes del frío." },
      { month: 5, priceLevel: "low", tempMin: 9, tempMax: 19, rainfallMm: 70, crowdLevel: "low", notes: "Temporada baja, pero Iguazú y BA siguen buenos. Patagonia ya frío. Precios hoteles 30-40% más bajos." },
      { month: 6, priceLevel: "low", tempMin: 6, tempMax: 15, rainfallMm: 60, crowdLevel: "low", notes: "Invierno empieza. Esquí en Bariloche/Las Leñas/Catedral (jul es peak). BA tiene Tango Festival." },
      { month: 7, priceLevel: "mid", tempMin: 5, tempMax: 14, rainfallMm: 70, crowdLevel: "mid", notes: "Esquí peak en Andes. Vacaciones de invierno escolares en Argentina suben precios. Bariloche +50% vs jun." },
      { month: 8, priceLevel: "low", tempMin: 7, tempMax: 16, rainfallMm: 60, crowdLevel: "low", notes: "Post-vacaciones invierno. Esquí sigue activo pero más barato. Avistamiento ballenas Península Valdés." },
      { month: 9, priceLevel: "low", tempMin: 9, tempMax: 19, rainfallMm: 70, crowdLevel: "low", notes: "Primavera empieza. Ballena franca pico en Puerto Madryn. BA primavera precioso. Precios bajos." },
      { month: 10, priceLevel: "mid", tempMin: 13, tempMax: 22, rainfallMm: 100, crowdLevel: "mid", notes: "Primavera plena. Jacarandás florecen en BA. Iguazú y Patagonia accesibles. Sweet spot precio/clima." },
      { month: 11, priceLevel: "mid", tempMin: 16, tempMax: 26, rainfallMm: 110, crowdLevel: "mid", notes: "Pre-verano. Cataratas máximo caudal post lluvias octubre. Patagonia se abre (Calafate accesible)." },
      { month: 12, priceLevel: "high", tempMin: 18, tempMax: 29, rainfallMm: 120, crowdLevel: "high", notes: "Verano arranca. Patagonia peak. Reservar Calafate/Ushuaia/Torres del Paine 4-6 meses antes. BA Navidad cálida." },
    ],
    sweetSpotMonths: [3, 10],
    avoidMonths: [12, 1],
    description:
      "Argentina ofrece una variedad geográfica enorme — desde el subtropical Iguazú al norte hasta los glaciares de la Patagonia austral. Para el viajero ES, las mejores combinaciones son Buenos Aires + Iguazú (otoño marzo-abril o primavera octubre-noviembre) o Patagonia completa (Calafate + Torres del Paine + Ushuaia) en verano dic-feb. Iberia y Air Europa operan vuelo directo MAD-EZE diariamente; error fares Business class €380-580 RT aparecen 5-7×/año, especialmente mar y oct.\n\nEl sweet spot meteorológico es marzo (post-verano, Patagonia accesible, BA agradable) y octubre (primavera, jacarandás, Iguazú con caudal alto). Diciembre-febrero hay calidad superior en Patagonia pero pico de demanda + precios x2.\n\nMoneda: peso argentino con inflación alta. Llevar USD efectivo + tarjeta Revolut/Wise. Comer asado en parrilla de barrio (Palermo, San Telmo BA) cuesta €15-25/persona. Cataratas del Iguazú entrada €20 + lado brasileño €15 (combo recomendado).",
    tips: [
      "MAD-EZE Iberia/Air Europa: error fares Business €380-580 RT 5-7×/año, vigilar marzo/octubre",
      "Moneda dólar blue >> dólar oficial — cambiar USD en cuevas Florida (BA) o Western Union",
      "Patagonia Torres del Paine se hace desde Chile o Argentina (Calafate o Puerto Natales)",
      "Avistamiento ballenas Península Valdés: junio-noviembre, peak septiembre",
      "Bariloche esquí jul-sep, en oct ya derrite. Otoño abril-mayo colores brutales en Patagonia",
      "Cataratas Iguazú: lado argentino más caminata + lado brasileño vista panorámica. Hacer ambos.",
    ],
  },
  {
    slug: "chile",
    name: "Chile",
    country: "Chile",
    region: "Sudamérica",
    hubIATAs: ["SCL", "CJC", "PMC", "PUQ"],
    heroImageSlug: "chile",
    months: [
      { month: 1, priceLevel: "high", tempMin: 14, tempMax: 30, rainfallMm: 5, crowdLevel: "high", notes: "Verano austral. Santiago caluroso, Atacama agradable. Patagonia (Torres del Paine) accesible pero saturada — reservar 6 meses antes." },
      { month: 2, priceLevel: "high", tempMin: 13, tempMax: 29, rainfallMm: 5, crowdLevel: "high", notes: "Sigue verano. Mejor mes para Patagonia tras ene. Chiloé y Carretera Austral con menos lluvia." },
      { month: 3, priceLevel: "mid", tempMin: 11, tempMax: 26, rainfallMm: 15, crowdLevel: "mid", notes: "Otoño empieza. Cosecha viñedos Valle Casablanca/Maipo. Atacama estable. Sweet spot Patagonia con menos crowds." },
      { month: 4, priceLevel: "mid", tempMin: 8, tempMax: 22, rainfallMm: 30, crowdLevel: "low", notes: "Otoño pleno, colores en Patagonia + lagos region. Lluvias empiezan al sur. Atacama sigue seco." },
      { month: 5, priceLevel: "low", tempMin: 6, tempMax: 18, rainfallMm: 60, crowdLevel: "low", notes: "Mes barato. Santiago fresco, Patagonia ya cierra temporada (TDP nieva). Norte (Atacama) clima ideal." },
      { month: 6, priceLevel: "low", tempMin: 4, tempMax: 14, rainfallMm: 100, crowdLevel: "low", notes: "Invierno. Esquí Andes Santiago (Valle Nevado, Portillo) abre. Atacama frío de noche pero días buenos." },
      { month: 7, priceLevel: "mid", tempMin: 3, tempMax: 14, rainfallMm: 110, crowdLevel: "mid", notes: "Vacaciones invierno escolares. Esquí peak. Pucón onsen y aguas termales con nieve fuera." },
      { month: 8, priceLevel: "low", tempMin: 5, tempMax: 16, rainfallMm: 80, crowdLevel: "low", notes: "Post-vacaciones. Esquí sigue. Atacama clima ideal (sin turistas brasileños del invierno escolar)." },
      { month: 9, priceLevel: "low", tempMin: 7, tempMax: 19, rainfallMm: 60, crowdLevel: "low", notes: "Primavera empieza. Carrera Maratón Santiago a primeros. Patagonia aún cerrada." },
      { month: 10, priceLevel: "mid", tempMin: 9, tempMax: 22, rainfallMm: 40, crowdLevel: "mid", notes: "Primavera. Valles vinícolas verdes. Patagonia se abre (octubre = primer mes accesible)." },
      { month: 11, priceLevel: "mid", tempMin: 12, tempMax: 25, rainfallMm: 20, crowdLevel: "mid", notes: "Pre-verano. Torres del Paine ya activa. Sweet spot precio/clima para Patagonia sin masas." },
      { month: 12, priceLevel: "high", tempMin: 14, tempMax: 29, rainfallMm: 10, crowdLevel: "high", notes: "Verano arranca. Patagonia pico + reservar antes. Atacama clima ideal pero saturado." },
    ],
    sweetSpotMonths: [3, 11],
    avoidMonths: [12, 1],
    description:
      "Chile geográficamente extremo: 4.300km de norte a sur. Para visitarlo bien necesitas elegir 2-3 regiones (Atacama + Santiago/viñedos + Patagonia es la tríada clásica). El verano austral (dic-feb) abre Patagonia (Torres del Paine, Carretera Austral) pero satura todo. Marzo y noviembre son sweet spots — clima decente, menos crowds, precios 30-40% más bajos.\n\nDesde España, MAD-SCL es la ruta más directa (Iberia + LATAM diarios). Error fares MAD-SCL aparecen 4-6×/año a €450-580 Economy round-trip (vs €720 normal). Atacama (San Pedro) y Patagonia (Calafate/Puerto Natales) requieren vuelo interno + conexión.\n\nMoneda peso chileno, estable. Comer en mercado local €6-12, restaurante medio €18-30. Wifi excelente en Santiago y norte; patchy en Patagonia. Visado: no requiere visa para españoles hasta 90 días.",
    tips: [
      "MAD-SCL Iberia/LATAM directo 14h. Error fares €450-580 Economy 4-6×/año",
      "Combo clásico: 4d Santiago/Valparaíso + 3d Atacama + 5d Patagonia (12d ideal)",
      "Torres del Paine W-trek (5 días) requiere reserva refugios 6 meses antes en pico",
      "Atacama desierto: tours desde San Pedro €30-80/día (Valle de la Luna, Géiseres Tatio)",
      "Viñedos Maipo + Casablanca: tours desde Santiago €40-80, sin coche es ideal",
      "Carretera Austral: 1.200km en coche/moto. Necesita 7-10 días + planificación combustible",
    ],
  },
  {
    slug: "costa-rica",
    name: "Costa Rica",
    country: "Costa Rica",
    region: "Centroamérica",
    hubIATAs: ["SJO", "LIR"],
    heroImageSlug: "costa-rica",
    months: [
      { month: 1, priceLevel: "high", tempMin: 17, tempMax: 27, rainfallMm: 20, crowdLevel: "high", notes: "Estación seca. Pico turístico (americanos + europeos huida invierno). Pacífico ideal, Caribe puede llover algo." },
      { month: 2, priceLevel: "high", tempMin: 18, tempMax: 28, rainfallMm: 15, crowdLevel: "high", notes: "Sigue seco. Avistamiento ballenas jorobadas en Marino Ballena. Reservar hospedaje 3 meses antes." },
      { month: 3, priceLevel: "high", tempMin: 19, tempMax: 30, rainfallMm: 15, crowdLevel: "high", notes: "Final de estación seca. Semana Santa local sube precios +20%. Surfistas en peak Manuel Antonio." },
      { month: 4, priceLevel: "mid", tempMin: 20, tempMax: 31, rainfallMm: 60, crowdLevel: "mid", notes: "Empiezan lluvias tarde. Aún temporada media buena. Precios bajan 20% segundas dos semanas." },
      { month: 5, priceLevel: "low", tempMin: 20, tempMax: 30, rainfallMm: 220, crowdLevel: "low", notes: "Lluvias diarias por la tarde. Pero mañanas brillantes y verdor espectacular. Sweet spot precio/clima si toleras lluvia." },
      { month: 6, priceLevel: "low", tempMin: 20, tempMax: 29, rainfallMm: 240, crowdLevel: "low", notes: "Lluvioso. Tortuga marina anida en Pacífico (Ostional). Selvas en máximo verdor." },
      { month: 7, priceLevel: "mid", tempMin: 20, tempMax: 29, rainfallMm: 200, crowdLevel: "mid", notes: "Veranillo de San Juan: pausa lluvias 1-2 semanas en julio. Algunos vienen aprovechando esta ventana." },
      { month: 8, priceLevel: "low", tempMin: 20, tempMax: 29, rainfallMm: 260, crowdLevel: "low", notes: "Mes más lluvioso típicamente. Caribe peor que Pacífico. Surf pico (olas grandes)." },
      { month: 9, priceLevel: "low", tempMin: 19, tempMax: 28, rainfallMm: 320, crowdLevel: "low", notes: "Mes más complicado lluvia. Caribe seco curiosamente (Cahuita/Puerto Viejo aguanta bien). Vuelos baratos." },
      { month: 10, priceLevel: "low", tempMin: 19, tempMax: 28, rainfallMm: 280, crowdLevel: "low", notes: "Sigue lluvioso. Pero green season hace bosques explotar de vida. Precios mínimos del año." },
      { month: 11, priceLevel: "mid", tempMin: 19, tempMax: 28, rainfallMm: 130, crowdLevel: "mid", notes: "Transición. Lluvias bajan. Sweet spot post-temporada lluvias antes del peak. Aún precios decentes." },
      { month: 12, priceLevel: "high", tempMin: 18, tempMax: 28, rainfallMm: 40, crowdLevel: "high", notes: "Empieza pico turístico. Navidad y fin de año saturados. Reservar 4-6 meses antes." },
    ],
    sweetSpotMonths: [11, 4],
    avoidMonths: [8, 9],
    description:
      "Costa Rica es el destino latinoamericano más fácil para europeos: estable, infraestructura turística desarrollada, español accesible, naturaleza espectacular. Volcanes (Arenal), playas Pacífico (Manuel Antonio, Tamarindo), Caribe (Cahuita), selvas (Corcovado, Monteverde). Para 10-14 días ideal: Pacífico Norte + Monteverde + Arenal + Caribe.\n\nDesde España, vuelo más típico MAD-SJO con escala (MIA, MAD-MEX, AMS, FRA). Iberia opera directo MAD-SJO estacionalmente. Error fares €380-480 RT Economy aparecen 3-4×/año, especialmente septiembre-octubre.\n\nLa estación seca (dic-abr) es ideal pero saturada y cara. Green season (may-nov) ofrece naturaleza explosiva, precios 30-40% menores, lluvias intensas pero generalmente por la tarde (mañanas + mediodía soleados). Sweet spot: noviembre (lluvias bajando, aún precios mid) y abril (final estación seca, precios bajando).",
    tips: [
      "Coche alquiler 4WD imprescindible — caminos rurales y volcán Arenal requieren tracción",
      "Visa: no requiere para españoles hasta 90 días. Pasaporte mínimo 6 meses validez",
      "Manuel Antonio: parque cierra lunes. Llegar 6am evita calor + monos perezosos activos",
      "Monteverde: nubla casi diariamente. Nubeselva mejor por la mañana temprano (8-10am)",
      "Tortuguero (Caribe norte): no carreteras — solo barco o avión. Reservar lodge incluye transporte",
      "Arenal: aguas termales naturales en Tabacón €40-60/entrada. Cheaper: 'free hot springs' río al lado de Tabacón",
    ],
  },
  {
    slug: "sudafrica",
    name: "Sudáfrica",
    country: "Sudáfrica",
    region: "África",
    hubIATAs: ["JNB", "CPT", "DUR"],
    heroImageSlug: "sudafrica",
    months: [
      { month: 1, priceLevel: "high", tempMin: 17, tempMax: 27, rainfallMm: 25, crowdLevel: "high", notes: "Verano austral. Ciudad del Cabo pico (vacacionistas locales + europeos invierno). Safari muy caluroso." },
      { month: 2, priceLevel: "high", tempMin: 17, tempMax: 27, rainfallMm: 20, crowdLevel: "high", notes: "Sigue verano alto. Tiburón blanco False Bay activo. Safari Kruger calor +35°C (animales escondidos)." },
      { month: 3, priceLevel: "mid", tempMin: 16, tempMax: 26, rainfallMm: 35, crowdLevel: "mid", notes: "Otoño empieza. Cape Town aún cálido pero menos saturado. Safari mejora (menos calor + más visibilidad)." },
      { month: 4, priceLevel: "mid", tempMin: 13, tempMax: 23, rainfallMm: 60, crowdLevel: "mid", notes: "Otoño Cape Town con viñedos vendimia. Safari Kruger entra mejor mes (clima seco + animales en pozos)." },
      { month: 5, priceLevel: "low", tempMin: 9, tempMax: 19, rainfallMm: 80, crowdLevel: "low", notes: "Empieza invierno. Cape Town llueve, pero safari Kruger sweet spot (seco + animales activos)." },
      { month: 6, priceLevel: "low", tempMin: 6, tempMax: 17, rainfallMm: 70, crowdLevel: "low", notes: "Invierno. Frío Cape Town (necesitas chaqueta). Safari peak temporada — agua escasa, animales en pozos." },
      { month: 7, priceLevel: "mid", tempMin: 6, tempMax: 17, rainfallMm: 50, crowdLevel: "mid", notes: "Whale watching Cape Town (Hermanus) peak. Safari sigue ideal. Vacaciones escolares locales suben precios." },
      { month: 8, priceLevel: "mid", tempMin: 7, tempMax: 18, rainfallMm: 50, crowdLevel: "mid", notes: "Whale watching pico. Safari ideal. Cape Town empieza primavera. Días más largos." },
      { month: 9, priceLevel: "low", tempMin: 9, tempMax: 20, rainfallMm: 50, crowdLevel: "low", notes: "Primavera. West Coast flowers (Namaqualand) en flor — fenómeno único. Sweet spot Cape Town." },
      { month: 10, priceLevel: "mid", tempMin: 11, tempMax: 22, rainfallMm: 50, crowdLevel: "mid", notes: "Primavera plena. Safari aún bueno antes verano. Cape Town clima ideal sin saturación." },
      { month: 11, priceLevel: "mid", tempMin: 14, tempMax: 24, rainfallMm: 45, crowdLevel: "mid", notes: "Pre-verano. Cape Town agradable. Safari empieza a calentar. Sweet spot clima/precio." },
      { month: 12, priceLevel: "high", tempMin: 16, tempMax: 26, rainfallMm: 60, crowdLevel: "high", notes: "Verano arranca. Saturación pico Cape Town. Reservar 4-6 meses antes para hoteles V&A Waterfront." },
    ],
    sweetSpotMonths: [5, 10],
    avoidMonths: [1, 2],
    description:
      "Sudáfrica combina ciudad cosmopolita (Cape Town con Table Mountain), safaris world-class (Kruger NP), viñedos (Stellenbosch), playas (Garden Route) y vida salvaje marina (Hermanus whale watching). Ideal 14 días: 5d Cape Town + 4d Garden Route + 5d safari Kruger.\n\nDesde España, vuelo más típico MAD-JNB vía DXB (Emirates), DOH (Qatar) o ZRH (SWISS). Air France directo MAD-CDG-JNB también competitivo. Error fares MAD-JNB €380-450 Economy RT aparecen 4-6×/año, especialmente abril-mayo cuando termina temporada europea pero empieza ideal en Sudáfrica.\n\nSweet spot: mayo (post-Cape Town saturado pero antes lluvias) y octubre (primavera, flowers, safari aún ideal). Evitar dic-feb (calor extremo safari + saturación Cape Town).",
    tips: [
      "MAD-JNB vía DXB (Emirates) o DOH (Qatar) — error fares Business €1.200-1.800 RT 3-4×/año",
      "Safari Kruger: junio-octubre = animales en pozos (visible). Diciembre-marzo = bebés pero vegetación oculta",
      "Cape Town: Table Mountain por funicular (€20) o caminata (3-4h, Platteklip Gorge). Cerrar pre 5pm",
      "Garden Route: alquilar coche (autopista N2) desde Cape Town. 5-7 días Knysna, Plett, Tsitsikamma",
      "Safety: turismo es seguro en zonas turísticas. Township tours guiados solo (no solo). Carjacking real en JNB",
      "Whale watching Hermanus (1.5h de Cape Town): junio-noviembre, peak agosto-septiembre. Cliff path gratuito",
    ],
  },
  {
    slug: "dubai",
    name: "Dubai",
    country: "Emiratos Árabes Unidos",
    region: "Oriente Medio",
    hubIATAs: ["DXB", "DWC"],
    heroImageSlug: "dubai",
    months: [
      { month: 1, priceLevel: "high", tempMin: 15, tempMax: 24, rainfallMm: 15, crowdLevel: "high", notes: "Mes pico — clima perfecto (24°C días, frío noches). Dubai Shopping Festival. Reservar hoteles 3-4 meses antes." },
      { month: 2, priceLevel: "high", tempMin: 16, tempMax: 25, rainfallMm: 25, crowdLevel: "high", notes: "Sigue clima ideal. Lluvias ocasionales cortas. Vuelos Europa-DXB en pico (Emirates+Etihad llenos)." },
      { month: 3, priceLevel: "mid", tempMin: 18, tempMax: 28, rainfallMm: 15, crowdLevel: "mid", notes: "Final de temporada alta. Aún ideal para desierto safari y playa. Precios bajan 20% mid-marzo." },
      { month: 4, priceLevel: "mid", tempMin: 21, tempMax: 32, rainfallMm: 5, crowdLevel: "mid", notes: "Empieza calor. Aún tolerable. Precios bajan más. Buenos para excursiones temprano + mediodía piscina." },
      { month: 5, priceLevel: "low", tempMin: 25, tempMax: 37, rainfallMm: 2, crowdLevel: "low", notes: "Calor empieza fuerte. Outdoor solo amanecer/atardecer. Hoteles 40-50% más baratos. Mall touring + indoor." },
      { month: 6, priceLevel: "low", tempMin: 28, tempMax: 40, rainfallMm: 0, crowdLevel: "low", notes: "Pleno verano árabe. 40°C+ con humedad alta. Solo viable AC + indoor. Mínimo turismo (precios mínimos)." },
      { month: 7, priceLevel: "low", tempMin: 30, tempMax: 41, rainfallMm: 0, crowdLevel: "low", notes: "Mes más caluroso del año. Outdoor imposible salvo madrugada. Dubai Summer Surprises (descuentos shopping)." },
      { month: 8, priceLevel: "low", tempMin: 30, tempMax: 41, rainfallMm: 0, crowdLevel: "low", notes: "Sigue calor extremo + humedad. Mejores hoteles luxury accesibles (Burj Al Arab €600/noche vs €1.500 enero)." },
      { month: 9, priceLevel: "low", tempMin: 27, tempMax: 38, rainfallMm: 0, crowdLevel: "low", notes: "Calor bajando algo. Outdoor noche viable. Precios aún bajos. Buena opción budget Dubai." },
      { month: 10, priceLevel: "mid", tempMin: 23, tempMax: 34, rainfallMm: 5, crowdLevel: "mid", notes: "Otoño empieza. Clima vuelve a tolerable. Outdoor activities arrancan. Precios suben gradualmente." },
      { month: 11, priceLevel: "mid", tempMin: 19, tempMax: 30, rainfallMm: 5, crowdLevel: "mid", notes: "Mes ideal. Desierto safari perfecto. Beach clubs reabren. Sweet spot precio/clima antes pico." },
      { month: 12, priceLevel: "high", tempMin: 16, tempMax: 25, rainfallMm: 15, crowdLevel: "high", notes: "Empieza pico. Navidad y New Year saturación + €€€. Burj Khalifa fireworks famosos." },
    ],
    sweetSpotMonths: [11, 3],
    avoidMonths: [7, 8],
    description:
      "Dubai es destino multifacético: stopover de 2-3 días desde Asia, escapada lujo 5-7 días o base de exploración Oriente Medio. Atracciones top: Burj Khalifa (mirador 555m), Dubai Mall (más grande del mundo), Palm Jumeirah (Atlantis), desierto safari (Hatta), Old Town (Al Fahidi histórico).\n\nDesde España, MAD-DXB Emirates directo diario 7h. Error fares Business €1.200-1.700 RT aparecen 4-5×/año, especialmente mayo-junio cuando termina temporada europea. Stopover Dubai gratis en muchos tickets transit a Asia/Oceanía/África.\n\nClima dicta todo: nov-mar es ideal (24-28°C días) pero saturado y caro. Mayo-sept inhabitable outdoor pero hoteles luxury Burj Al Arab/Atlantis 50-60% más baratos. Sweet spot: noviembre (clima vuelve + precios mid) y marzo (final temporada + precios bajando).",
    tips: [
      "MAD-DXB Emirates directo 7h. Dubai Stopover programme: hotel + visa + transfer gratis 96h en tickets transit",
      "Burj Khalifa: reservar online 3-4 semanas antes para evitar colas + ahorrar 20-30%",
      "Desert safari: reservar con hotel (€60-80/persona) — cena beduina + sandboarding + camello",
      "Visa: españoles entran sin visa hasta 90 días con pasaporte 6+ meses validez",
      "Alcohol: solo en hoteles y restaurantes licenciados. Brunches viernes son tradición expat (€80-150)",
      "Ramadan (cambia cada año): outdoor eating prohibido durante el día. Hoteles tienen menu pero más caro",
    ],
  },
];

/* ────────────────────────────────────────────────────────────────────────
 *  Helpers
 * ────────────────────────────────────────────────────────────────────── */

export function getDestinationBySlug(slug: string): Destination | undefined {
  return DESTINATIONS_SEASONAL.find((d) => d.slug === slug);
}

export function getRelatedDestinations(
  currentSlug: string,
  limit: number,
): Destination[] {
  const current = getDestinationBySlug(currentSlug);
  if (!current) return DESTINATIONS_SEASONAL.slice(0, limit);
  // Priorize same region first, then any.
  const sameRegion = DESTINATIONS_SEASONAL.filter(
    (d) => d.slug !== currentSlug && d.region === current.region,
  );
  const others = DESTINATIONS_SEASONAL.filter(
    (d) => d.slug !== currentSlug && d.region !== current.region,
  );
  return [...sameRegion, ...others].slice(0, limit);
}

/**
 * Algoritmo simple sweetSpotMonth: si existe sweetSpotMonths definido
 * lo usa; si no, calcula por score (temperatura agradable + lluvia
 * baja + precio razonable). Devuelve el primer mes sweet spot del año.
 */
export function sweetSpotMonth(d: Destination): MonthIndex {
  if (d.sweetSpotMonths.length > 0) return d.sweetSpotMonths[0];
  // Fallback: pick month with best score.
  const scored = d.months.map((m) => ({
    month: m.month,
    score:
      // ideal 18-26 °C (rango cómodo)
      (m.tempMax >= 18 && m.tempMax <= 28 ? 30 : 0) +
      // lluvia < 80 mm
      (m.rainfallMm < 80 ? 20 : m.rainfallMm > 200 ? -20 : 0) +
      // precio mid (sweet spot) prefiere a high
      (m.priceLevel === "mid" ? 15 : m.priceLevel === "high" ? -5 : 5) +
      // crowd mid es mejor que high
      (m.crowdLevel === "mid" ? 10 : m.crowdLevel === "high" ? -10 : 5),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].month;
}
