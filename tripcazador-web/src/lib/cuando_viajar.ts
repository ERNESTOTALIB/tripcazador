/**
 * cuando_viajar.ts — MMMM01 (May 2026)
 *
 * Vertical SEO long-tail "¿cuándo viajar a X?". Captura keywords con
 * altísimo intent informacional + comercial:
 *   "mejor mes para viajar a Tailandia", "cuando ir a Japón",
 *   "mejor época para Bali", "cuando viajar a Maldivas".
 *
 * Cada destino expone los 12 meses con:
 *   - Precio relativo (€€/€€€/€€€€)
 *   - Clima (temperatura + lluvias)
 *   - Crowds (vacío/normal/saturado)
 *   - Recomendación (1-10) + nota cazador
 *
 * Linkea a /destinos/{slug} (info general) y /vuelos-baratos/{mes}
 * (deals concretos del mes). Refuerza autoridad SEO + cross-link interno.
 */

export type PriceLevel = "€" | "€€" | "€€€" | "€€€€";
export type CrowdLevel = "vacío" | "tranquilo" | "normal" | "lleno" | "saturado";

export interface MonthEntry {
  /** 1-12 */
  month: number;
  /** Nombre completo del mes en ES. */
  name: string;
  /** Precio relativo (€€ barato, €€€€ pico). */
  price: PriceLevel;
  /** Temperatura media diurna (Celsius). */
  tempC: number;
  /** Día con lluvia esperados al mes (aproximado). */
  rainyDays: number;
  /** Crowds. */
  crowds: CrowdLevel;
  /** Recomendación general (1-10). */
  score: number;
  /** Nota cazador (1-2 frases). */
  note: string;
}

export interface CuandoViajarDestino {
  /** Slug URL — debe coincidir con /destinos/{slug} cuando existe. */
  slug: string;
  /** Nombre del destino en ES. */
  name: string;
  emoji: string;
  /** Bandera país. */
  countryEmoji: string;
  /** Categoría general. */
  category: "playa" | "ciudad" | "naturaleza" | "cultural";
  /** Aeropuerto principal IATA. */
  mainAirport: string;
  /** Temporada óptima resumida en 1 frase. */
  bestSeason: string;
  /** Temporada que conviene evitar en 1 frase. */
  worstSeason: string;
  /** Resumen general 2-3 frases sobre cuándo ir. */
  summary: string;
  /** 12 meses ordenados ene→dic. */
  months: MonthEntry[];
}

const M = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function months(
  data: Array<[PriceLevel, number, number, CrowdLevel, number, string]>,
): MonthEntry[] {
  return data.map((d, i) => ({
    month: i + 1,
    name: M[i],
    price: d[0],
    tempC: d[1],
    rainyDays: d[2],
    crowds: d[3],
    score: d[4],
    note: d[5],
  }));
}

export const CUANDO_VIAJAR_DESTINOS: CuandoViajarDestino[] = [
  // ─── 1. Tailandia ─────────────────────────────────────────────────
  {
    slug: "tailandia",
    name: "Tailandia",
    emoji: "🛕",
    countryEmoji: "🇹🇭",
    category: "playa",
    mainAirport: "BKK",
    bestSeason: "Noviembre a febrero (seco, ~30°C, sin monzón).",
    worstSeason: "Junio a octubre (monzón sudoeste, lluvias diarias).",
    summary:
      "Tailandia tiene una temporada seca clara (nov-feb) que coincide con el pico turístico y precios altos. Los meses transición (mar-may, oct) son sweet spot del cazador: precios moderados, monzón decreciente y menos turistas. Junio-septiembre es monzón pero las costas Andamán (Phuket, Krabi) sufren más que el Golfo (Koh Samui).",
    months: months([
      ["€€€€", 30, 2, "saturado", 9, "Pico absoluto turismo + temperatura ideal. Phuket/Krabi colapsa. Precios x2."],
      ["€€€€", 31, 1, "lleno", 9, "Igual que enero. Reserva con 4+ meses antelación."],
      ["€€€", 33, 2, "lleno", 8, "Calor seco, último mes seco antes lluvia. Sweet spot calidad-precio."],
      ["€€", 34, 4, "normal", 7, "Songkran (~13 abr) precios + multitud. Resto del mes calor extremo 35°C+."],
      ["€€", 34, 8, "tranquilo", 6, "Pre-monzón. Tormentas vespertinas pero precios bajan -30% vs enero."],
      ["€", 32, 12, "vacío", 5, "Monzón empieza. Cancelaciones playa, pero norte (Chiang Mai) sigue OK."],
      ["€", 32, 15, "vacío", 4, "Pleno monzón Andamán. Bali/Vietnam mejor opción este mes."],
      ["€", 32, 16, "tranquilo", 4, "Mes con más lluvia. Solo recomendado para viajeros con presupuesto justo."],
      ["€€", 32, 14, "tranquilo", 5, "Monzón retrocede. Posible buena ventana segunda mitad mes."],
      ["€€", 32, 9, "normal", 7, "Sweet spot oct-nov: lluvias bajando, precios aún no en pico."],
      ["€€€", 31, 3, "lleno", 9, "Temporada alta arranca. Aún precios sensatos vs dic-feb."],
      ["€€€€", 30, 2, "saturado", 9, "Navidad/NYE precios x3. Reserva con 6+ meses."],
    ]),
  },
  // ─── 2. Japón ──────────────────────────────────────────────────────
  {
    slug: "japon",
    name: "Japón",
    emoji: "🗾",
    countryEmoji: "🇯🇵",
    category: "cultural",
    mainAirport: "NRT",
    bestSeason: "Marzo-abril (sakura) y octubre-noviembre (koyo otoñal).",
    worstSeason: "Junio (tsuyu, lluvias) y agosto (calor extremo + tifones).",
    summary:
      "Japón tiene dos picos icónicos: sakura (cerezos, ~25 mar – 10 abr) y koyo (hojas rojas, oct-nov). Ambos suben precios x2-3 y saturan Kioto. Mayo y septiembre son los sweet spots cazadores: clima excelente, sin masas y precios estándar. Evita junio (tsuyu) y agosto (calor 35°C + festivales abarrotados).",
    months: months([
      ["€€", 8, 5, "tranquilo", 7, "Hatsumode (santuarios) primeros días. Frío seco, perfecto Tokio. Nieva Hokkaido."],
      ["€€", 9, 5, "tranquilo", 7, "Mismo perfil enero. Sapporo Snow Festival (1ª semana feb) precios suben Hokkaido."],
      ["€€€€", 12, 8, "saturado", 10, "Sakura desde ~22 mar Tokio/Kioto. Hoteles +200%. Reserva 6+ meses."],
      ["€€€€", 16, 8, "saturado", 10, "Continuación sakura primeros 7-10 días. Después baja precio rápido."],
      ["€€€", 21, 7, "normal", 9, "Sweet spot cazador #1: clima ideal, sin masas sakura, Golden Week (29 abr-5 may) excepción."],
      ["€", 24, 13, "vacío", 5, "Tsuyu (estación lluvias) Honshu. Solo Hokkaido recomendado. Precios mínimos del año."],
      ["€€", 28, 9, "normal", 7, "Tsuyu termina mid-jul. Festival temporada (Gion Matsuri Kioto). Calor empieza."],
      ["€€", 30, 8, "normal", 6, "Pico calor 35°C + humedad brutal. Tifones occidente. Obon (~13-15 ago) precios suben."],
      ["€€", 27, 9, "tranquilo", 8, "Sweet spot cazador #2: tifones retrocediendo, temperatura ideal, sin masas."],
      ["€€€", 21, 7, "lleno", 9, "Inicio koyo (hojas rojas) norte. Última semana Tokio enciende."],
      ["€€€€", 14, 5, "saturado", 10, "Pico koyo Kioto/Nikko. Hoteles +150%. Imagen postal absoluta."],
      ["€€€", 9, 4, "lleno", 7, "Iluminaciones invierno. Navidad/NYE precios suben. Frío seco."],
    ]),
  },
  // ─── 3. Bali ───────────────────────────────────────────────────────
  {
    slug: "bali",
    name: "Bali",
    emoji: "🏝️",
    countryEmoji: "🇮🇩",
    category: "playa",
    mainAirport: "DPS",
    bestSeason: "Mayo a septiembre (seco, brisa, surf).",
    worstSeason: "Diciembre a febrero (monzón, lluvias diarias).",
    summary:
      "Bali tiene seca (may-sep) y monzón (nov-mar). La seca atrae turistas + precios suben pico jul-ago. Sweet spot cazadores: mayo y septiembre — temperatura idéntica al pico pero precios -30%. Diciembre-febrero llueve casi a diario por tarde, pero por las mañanas suele estar despejado: viable con presupuesto ajustado.",
    months: months([
      ["€€", 29, 15, "tranquilo", 5, "Monzón pleno. Llueve tardes pero mañanas despejadas. Precio mínimo."],
      ["€€", 29, 14, "tranquilo", 5, "Igual enero. Año Nuevo Chino (~feb) sube precios en Ubud."],
      ["€€", 30, 11, "tranquilo", 6, "Monzón retrocede. Nyepi (Año Nuevo balinés ~mar) toda la isla cierra 24h."],
      ["€€€", 30, 8, "normal", 8, "Sweet spot pre-pico: tiempo seco, precios estándar, sin masas."],
      ["€€€", 30, 5, "normal", 9, "Mejor relación calidad-precio del año. Seca clara, surfistas llegando, precios moderados."],
      ["€€€€", 28, 3, "lleno", 9, "Inicio pico. Australianos en vacaciones escolares. Hoteles +50%."],
      ["€€€€", 28, 2, "saturado", 9, "Pico absoluto. Canggu lleno, Uluwatu reservas 3 meses. Surf óptimo."],
      ["€€€€", 28, 2, "saturado", 9, "Continuación pico. Algunos hostels +100% vs mayo."],
      ["€€€", 28, 3, "normal", 10, "Sweet spot cazador absoluto: tiempo idéntico julio, precios -30%."],
      ["€€€", 29, 6, "tranquilo", 8, "Octubre transición. Algo más nubes pero precios bajan."],
      ["€€", 29, 11, "vacío", 6, "Monzón empieza. Lluvias diarias tarde pero precios mínimos."],
      ["€€€€", 29, 14, "lleno", 5, "Navidad/NYE pico anómalo (vacaciones EU/AU). Cuidado: caro pero llueve."],
    ]),
  },
  // ─── 4. Maldivas ───────────────────────────────────────────────────
  {
    slug: "maldivas",
    name: "Maldivas",
    emoji: "🐠",
    countryEmoji: "🇲🇻",
    category: "playa",
    mainAirport: "MLE",
    bestSeason: "Diciembre a abril (seco, mar plano, snorkel ideal).",
    worstSeason: "Junio a agosto (monzón sudoeste, mar agitado).",
    summary:
      "Maldivas funciona inverso al hemisferio norte: el pico turístico es invierno EU (dic-abr) porque coincide con su estación seca. Sweet spots cazadores: noviembre (post-monzón, precios aún bajos) y mayo (transición, snorkel todavía bueno, precios bajan ~40% vs feb). Junio-agosto monzón sudoeste = mar agitado y visibilidad submarina baja.",
    months: months([
      ["€€€€", 30, 3, "saturado", 10, "Pico absoluto. Resorts overwater +150%. Tiburones ballena Ari Atoll."],
      ["€€€€", 30, 2, "saturado", 10, "Mes mar más plano del año. Manta rays Hanifaru visibles."],
      ["€€€€", 31, 4, "lleno", 10, "Último mes pico. Submarinismo top, precios aún altos."],
      ["€€€", 31, 7, "normal", 9, "Transición. Algunos resorts bajan -20%. Aún seco mayoría días."],
      ["€€", 31, 13, "tranquilo", 7, "Sweet spot cazador: precios -40% vs feb, snorkel todavía OK mañanas."],
      ["€", 31, 17, "vacío", 5, "Monzón sudoeste. Mar agitado. Solo si tu resort tiene atolón resguardado."],
      ["€", 31, 18, "vacío", 4, "Mes más lluvioso. Submarinismo difícil. Precios mínimos del año."],
      ["€", 31, 17, "vacío", 5, "Continuación monzón. Algunos resorts cierran o mantenimiento."],
      ["€€", 31, 14, "tranquilo", 6, "Monzón retrocede. Buenos descuentos last-minute."],
      ["€€", 31, 12, "tranquilo", 7, "Transición clara. Mar empieza a calmarse."],
      ["€€€", 31, 8, "normal", 9, "Sweet spot post-monzón: tiempo casi pico, precios aún -30% vs dic."],
      ["€€€€", 31, 5, "lleno", 10, "Navidad/NYE precios anómalos. Reserva 8+ meses si quieres overwater."],
    ]),
  },
  // ─── 5. Islandia ───────────────────────────────────────────────────
  {
    slug: "islandia",
    name: "Islandia",
    emoji: "🌋",
    countryEmoji: "🇮🇸",
    category: "naturaleza",
    mainAirport: "KEF",
    bestSeason: "Junio-agosto (sol medianoche) y oct-mar (auroras boreales).",
    worstSeason: "Noviembre (oscuridad sin nieve fotogénica todavía).",
    summary:
      "Islandia tiene dos tipos de viaje radicalmente diferentes: verano (jun-ago) para Ring Road completa con sol de medianoche y senderismo, o invierno (oct-mar) para auroras boreales + glaciares azules. Sweet spots cazadores: mayo (sol largo sin pico precios) y septiembre (puede ver auroras + Ring Road aún transitable + precios bajando).",
    months: months([
      ["€€€", 0, 13, "tranquilo", 7, "Auroras nivel pico. Carreteras Norte+Westfjords cerradas. Solo Reikiavik+Sur."],
      ["€€", -1, 12, "tranquilo", 7, "Igual enero pero más días sol. Glaciar cuevas tour disponible."],
      ["€€", 1, 13, "tranquilo", 8, "Sweet spot invierno: auroras + más luz + precios bajos."],
      ["€€", 4, 13, "tranquilo", 7, "Transición. Auroras posibles primeras 2 semanas. Carreteras norte abriendo."],
      ["€€€", 8, 11, "normal", 9, "Sweet spot cazador absoluto: sol 18h, casi todas carreteras abiertas, precios moderados."],
      ["€€€€", 12, 11, "lleno", 10, "Sol medianoche. Pico turismo. Reserva carro 3+ meses antelación."],
      ["€€€€", 14, 10, "saturado", 10, "Pico absoluto. Algunos sitios reserva ranger requerida (Landmannalaugar)."],
      ["€€€€", 13, 11, "saturado", 10, "Continuación pico. Última oportunidad puffins en Westman Islands."],
      ["€€€", 10, 12, "normal", 9, "Sweet spot otoño: precios bajan -25%, auroras vuelven última semana."],
      ["€€", 5, 14, "tranquilo", 8, "Primera nieve, auroras retornan, Ring Road aún transitable mayoría."],
      ["€€", 1, 13, "vacío", 6, "Mes problemático: días cortos, no suficiente nieve para paisaje invernal."],
      ["€€€", -1, 13, "lleno", 7, "Navidad/NYE invierno pleno + auroras. Pricing anómalo arriba en últimos 10 días."],
    ]),
  },
  // ─── 6. Marruecos ──────────────────────────────────────────────────
  {
    slug: "marruecos",
    name: "Marruecos",
    emoji: "🐪",
    countryEmoji: "🇲🇦",
    category: "cultural",
    mainAirport: "RAK",
    bestSeason: "Octubre a abril (clima suave, desierto perfecto).",
    worstSeason: "Junio a agosto (Marrakech 45°C+, desierto inviable mediodía).",
    summary:
      "Marruecos invierte el patrón mediterráneo: el verano (jun-ago) es brutal en interior (Marrakech, Fez, desierto) con 40-45°C que hacen inviables tours mediodía. La mejor temporada es otoño + invierno + primavera. Sweet spots cazadores: noviembre y febrero — todo abierto, precios bajos, clima 20-25°C diurno perfecto.",
    months: months([
      ["€€", 18, 8, "tranquilo", 8, "Invierno suave. Atlas con nieve para esquí Oukaïmeden. Desierto frío noche."],
      ["€€", 20, 7, "tranquilo", 9, "Sweet spot cazador invierno: temperatura ideal, precios bajos, sin masas."],
      ["€€€", 22, 7, "normal", 9, "Primavera arranca. Flores almendros. Precios suben anticipando Pascua."],
      ["€€€€", 25, 5, "lleno", 9, "Pascua precios pico. Resto del mes excelente clima sin masas."],
      ["€€€", 28, 3, "normal", 9, "Sweet spot pre-verano: clima cálido sin extremo, precios moderados."],
      ["€€", 33, 1, "tranquilo", 6, "Calor empieza interior. Costa (Essaouira) mantiene 22°C. Precios bajan inland."],
      ["€", 38, 0, "vacío", 4, "Calor brutal Marrakech. Solo costa o montañas Atlas viables."],
      ["€", 38, 0, "vacío", 4, "Mismo perfil julio. Desierto Merzouga inviable diurno."],
      ["€€", 33, 2, "tranquilo", 7, "Calor retrocede. Desierto vuelve viable. Precios todavía bajos."],
      ["€€€", 28, 4, "normal", 10, "Sweet spot otoño absoluto: clima ideal, todo abierto, precios moderados."],
      ["€€€", 23, 6, "normal", 10, "Continuación sweet spot. Festival International (Marrakech) bump puntual."],
      ["€€", 19, 7, "tranquilo", 8, "Diciembre suave. Navidad/NYE precios suben puntualmente. Atlas con nieve."],
    ]),
  },
  // ─── 7. Vietnam ────────────────────────────────────────────────────
  {
    slug: "vietnam",
    name: "Vietnam",
    emoji: "🥢",
    countryEmoji: "🇻🇳",
    category: "cultural",
    mainAirport: "SGN",
    bestSeason: "Marzo-abril Norte, mayo-jul Centro, nov-feb Sur.",
    worstSeason: "Octubre Centro (tifones Da Nang/Hoi An).",
    summary:
      "Vietnam es un país largo con 3 climas distintos: Norte (Hanoi, Ha Long, Sapa) tiene 4 estaciones, Centro (Hue, Hoi An, Da Nang) padece tifones oct-nov, y Sur (Saigón, Mekong) es trópico con monzón may-oct. No hay un mes ideal para todo el país. Sweet spot cazador para circuito completo: marzo-abril (Norte + Centro buenos, Sur aún seco).",
    months: months([
      ["€€", 18, 4, "normal", 7, "Norte frío (10°C noche Hanoi). Sur ideal. Tet (Año Nuevo) sube precios."],
      ["€€", 20, 3, "normal", 7, "Año Nuevo Vietnamita primeros días feb. Después clima excelente Sur+Centro."],
      ["€€€", 23, 4, "normal", 9, "Sweet spot circuito completo: Norte+Centro+Sur todos buenos."],
      ["€€€", 26, 6, "normal", 9, "Continuación sweet spot. Sur empieza a calentar pero aún viable."],
      ["€€", 30, 11, "tranquilo", 7, "Sur entra monzón. Norte+Centro excelentes. Sapa empieza arrozales verdes."],
      ["€€", 32, 14, "vacío", 6, "Sur monzón pleno. Hoi An + Da Nang aún OK. Precios bajan."],
      ["€€", 31, 15, "tranquilo", 6, "Vacaciones EU push, pero monzón Sur extenuante. Norte montañas refrescante."],
      ["€€", 30, 14, "tranquilo", 6, "Continuación monzón Sur. Centro tifones empezando esporádicamente."],
      ["€€€", 28, 11, "normal", 8, "Sweet spot Norte: arrozales Sapa dorados, clima fresco montañas."],
      ["€", 25, 15, "vacío", 4, "Tifones Centro (Hoi An inundaciones frecuentes). Solo Norte recomendado."],
      ["€€", 22, 8, "normal", 8, "Centro recuperándose. Norte excelente. Sur excelente. Sweet spot tras tifones."],
      ["€€€", 19, 5, "lleno", 8, "Navidad/NYE turismo. Norte muy frío en montañas. Sur ideal playa."],
    ]),
  },
  // ─── 8. Costa Rica ─────────────────────────────────────────────────
  {
    slug: "costa-rica",
    name: "Costa Rica",
    emoji: "🦥",
    countryEmoji: "🇨🇷",
    category: "naturaleza",
    mainAirport: "SJO",
    bestSeason: "Diciembre a abril (seca, fauna activa, surf Pacífico).",
    worstSeason: "Septiembre-octubre (lluvias pico, algunas carreteras cortadas).",
    summary:
      "Costa Rica tiene seca (dic-abr) y verde/lluviosa (may-nov). La seca es pico turístico, precios suben pero fauna está activa y carreteras todas abiertas. La estación verde es sweet spot del cazador: precios -30%, paisaje brutal verde, lluvias suelen ser tardes (mañana despejada). Septiembre-octubre evitar Caribe (Tortuguero) pero Pacífico Sur (Osa) está perfecto.",
    months: months([
      ["€€€€", 25, 4, "saturado", 9, "Pico absoluto. Manuel Antonio + Arenal saturados. Reserva 4+ meses."],
      ["€€€€", 26, 3, "lleno", 9, "Continuación pico seca. Avistamiento ballenas Bahía Drake."],
      ["€€€", 28, 4, "lleno", 9, "Sweet spot seca: tiempo perfecto, precios aún altos pero sin Navidad."],
      ["€€€", 28, 6, "normal", 8, "Semana Santa precios x2 puntualmente. Resto del mes excelente."],
      ["€€", 28, 13, "tranquilo", 7, "Inicio estación verde. Sweet spot cazador: -30% vs marzo, paisajes verdes."],
      ["€€", 28, 18, "vacío", 6, "Verde pleno. Lluvias tardes confiables. Mañanas para tours."],
      ["€€", 28, 16, "tranquilo", 7, "Veranillo (mini-seca) algunos años. Surf Pacífico óptimo este mes."],
      ["€€", 28, 17, "tranquilo", 6, "Mes con olas más grandes Pacífico. Hatching tortugas Tortuguero (Caribe)."],
      ["€", 28, 20, "vacío", 4, "Mes más lluvioso. Algunas carreteras secundarias cortadas. Pacífico Sur OK."],
      ["€", 28, 21, "vacío", 4, "Pico lluvias. Solo recomendado Osa Peninsula (clima estable allí)."],
      ["€€", 27, 13, "tranquilo", 8, "Transición a seca. Sweet spot post-lluvia: verdor + carreteras abiertas."],
      ["€€€€", 26, 6, "lleno", 9, "Navidad/NYE precios pico anómalos. Reserva temprano."],
    ]),
  },
];

export function getCuandoViajarBySlug(
  slug: string,
): CuandoViajarDestino | undefined {
  return CUANDO_VIAJAR_DESTINOS.find((d) => d.slug === slug);
}

/** Devuelve el/los mejores meses por score (top N). */
export function bestMonths(
  destino: CuandoViajarDestino,
  limit: number = 3,
): MonthEntry[] {
  return [...destino.months]
    .sort((a, b) => b.score - a.score || a.month - b.month)
    .slice(0, limit);
}

/** Sweet spot cazador: mes con mejor score relativo al price level
 *  (preferimos €€/€€€ con score alto sobre €€€€ con score 10). */
export function sweetSpotMonth(
  destino: CuandoViajarDestino,
): MonthEntry | undefined {
  const priceWeight: Record<PriceLevel, number> = {
    "€": 1.4,
    "€€": 1.2,
    "€€€": 1.0,
    "€€€€": 0.6,
  };
  return [...destino.months]
    .map((m) => ({ ...m, adj: m.score * priceWeight[m.price] }))
    .sort((a, b) => b.adj - a.adj)[0];
}
