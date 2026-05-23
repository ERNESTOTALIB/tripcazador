/**
 * eventos_es_catalog.ts — SSS439 (23 may 2026)
 *
 * 8 eventos top España con datos prácticos para landings SEO.
 *
 * High-intent queries: "san fermines fechas 2026 hotel", "feria abril
 * sevilla cuando es", "fallas valencia donde dormir", "carnaval tenerife
 * vuelos".
 *
 * Cada landing tiene fechas + ciudad/aeropuerto + tips alojamiento +
 * mejor zona + cross-link a /escapadas, /destinos, /preparar-viaje y
 * /seguro-viaje.
 */

export interface EventoEsEntry {
  slug: string;
  name: string;
  city: string;
  /** IATA aeropuerto principal. */
  iata: string;
  emoji: string;
  /** Fecha aproximada (puede variar por año). */
  dates: string;
  /** Resumen 1-2 frases. */
  summary: string;
  /** Por qué la gente viaja. */
  whyAttend: string[];
  /** Tips prácticos clave. */
  practicalTips: string[];
  /** Zona donde alojarse. */
  bestArea: string;
  /** Anti-tips (qué evitar). */
  caveats: string[];
  /** Cross-link slug de escapada si aplica. */
  escapadaSlug?: string;
  /** Slug destino catalog si aplica (para /preparar-viaje). */
  destinoSlug?: string;
}

export const EVENTOS_ES_CATALOG: EventoEsEntry[] = [
  {
    slug: "san-fermines",
    name: "San Fermines",
    city: "Pamplona",
    iata: "PNA",
    emoji: "🐂",
    dates: "6-14 julio (anual, fechas fijas)",
    summary:
      "Fiestas de San Fermín en Pamplona — encierros con toros, conciertos, vida en la calle 24/7 durante 9 días. Patrimonio Cultural Inmaterial.",
    whyAttend: [
      "Encierros 8am cada mañana del 7 al 14 julio (vivir desde balcón o desde la calle)",
      "Atmósfera única — 1M+ personas en 200k habitantes de Pamplona",
      "Pantalones blanco + camisa blanco + pañuelo rojo (uniforme obligatorio)",
    ],
    practicalTips: [
      "Alojamiento se llena con 6+ meses de antelación, precios x3-5",
      "Alternativa: dormir en San Sebastián (1h en coche) y comutar — mucho más barato",
      "Llevar mochila pequeña — no hay taquillas, todo se queda contigo",
      "Comprar el txupinazo (chupinazo) inicio fiestas el 6 julio 12pm en Plaza del Ayuntamiento",
    ],
    bestArea: "Casco Viejo (caro pero céntrico) o Iruñerria/Erripagaña (más barato, bus al centro)",
    caveats: [
      "Encierro es peligroso — solo participar si conoces la ruta y estás sobrio",
      "Hoteles cobran 5-10x el precio normal en San Fermines",
      "Si vas solo por turismo, mejor llegar 8 julio (post-txupinazo) y salir 11 julio",
    ],
  },
  {
    slug: "feria-abril-sevilla",
    name: "Feria de Abril",
    city: "Sevilla",
    iata: "SVQ",
    emoji: "💃",
    dates: "Lunes-domingo 2 semanas después Semana Santa (abril o mayo)",
    summary:
      "Feria de Abril de Sevilla — 7 días de casetas con flamenco, rebujito (jerez con limonada), sevillanas y caballos. Indumentaria flamenca tradicional.",
    whyAttend: [
      "Casetas privadas (necesitas invitación) y públicas en el Real de la Feria",
      "Encendido de farolillos lunes ('alumbrao') 9pm — momento icónico",
      "Calle del Infierno: parque de atracciones gigante (también gratis entrar)",
    ],
    practicalTips: [
      "Reservar hotel 3+ meses antes — precios x2-3 vs no-feria",
      "Indumentaria flamenca = ~150€ alquiler para mujer; chaqueta corto y camisa blanca para hombre",
      "Sevillanas: aprende los 4 pasos básicos antes de ir (YouTube 'sevillanas 4 paseos')",
      "Bus Linea EA conecta aeropuerto SVQ → Plaza de Armas (40 min, 4€)",
    ],
    bestArea: "Los Remedios (al lado del Real de la Feria), Triana (con vida nocturna), o Centro Histórico",
    caveats: [
      "Sin invitación a una caseta privada, la experiencia se limita a casetas públicas + Real",
      "Verano: temperaturas a veces 35°C en abril — hidratarse mucho con el rebujito de por medio",
    ],
    destinoSlug: "sevilla",
  },
  {
    slug: "carnaval-tenerife",
    name: "Carnaval de Santa Cruz de Tenerife",
    city: "Santa Cruz de Tenerife",
    // FIX-SEO-2: TFN (Tenerife Norte) no está en catalog ES. Mantenemos
    // TFS (Tenerife Sur) que SÍ está y sirve igual para llegar al Carnaval
    // (bus TITSA conecta directo en 50 min).
    iata: "TFS",
    emoji: "🎭",
    dates: "Febrero o marzo (2 semanas) — fecha cambia con Cuaresma",
    summary:
      "Segundo Carnaval más grande del mundo tras Río de Janeiro. Coso final con carrozas, comparsas y disfraces gigantes. Elección de Reina del Carnaval.",
    whyAttend: [
      "Coso (desfile final) día Carnaval Martes — 100+ carrozas",
      "Murgas: grupos cantando letras satíricas en plazas",
      "Disfraz obligatorio (incluso turistas) — atmósfera 100%",
      "Temperatura invierno tinerfeño 20-23°C — perfecto",
    ],
    practicalTips: [
      "Vuelo a TFN (Tenerife Norte) si vas a Santa Cruz, no TFS (Tenerife Sur)",
      "Hotel en La Laguna (más barato + 20 min tranvía a Santa Cruz)",
      "Carnaval De Día (Sábado Coso Apoteósico) y Carnaval De Noche tienen ambientes muy distintos",
      "Entrar al recinto del Coso desde la 4pm para tener buen sitio",
    ],
    bestArea: "Santa Cruz centro (caro) o La Laguna (Patrimonio UNESCO, tranvía 20 min al centro)",
    caveats: [
      "Plazas hoteleras escasas — reservar 4+ meses antes",
      "Domingo Piñata = día más tranquilo, ya muchos turistas se fueron",
    ],
  },
  {
    slug: "fallas-valencia",
    name: "Fallas",
    city: "Valencia",
    iata: "VLC",
    emoji: "🔥",
    dates: "15-19 marzo (anual, fechas fijas)",
    summary:
      "Fiesta del fuego en Valencia — monumentos de cartón ('fallas') hechos en barrios, mascletàs diarias, traca, ofrenda a la Virgen, y noche del 19 todas las fallas se queman ('cremà').",
    whyAttend: [
      "Mascletà diaria en Plaza Ayuntamiento 14:00 (espectáculo pirotécnico)",
      "Cremà 19 marzo madrugada — todas las fallas arden simultáneamente",
      "Verlas en la calle de día (gratis) — son obras de arte temporal",
      "Buñuelos + chocolate caliente en cada esquina",
    ],
    practicalTips: [
      "Aeropuerto VLC → centro con Metro L3/L5 (25 min, 4,90€)",
      "Reservar hotel/apartamento 2-3 meses antes — precios x2",
      "Llevar tapones para los oídos (mascletà 120dB)",
      "Cremà ver desde balcón si posible — calle se llena en exceso",
    ],
    bestArea: "Ciutat Vella (donde están la mayoría de fallas grandes) o Ruzafa (vida nocturna)",
    caveats: [
      "Ruido constante 5 días 24/7 — no apto para niños pequeños",
      "Tráfico cortado en el centro — coche es problemático",
    ],
    destinoSlug: "valencia",
  },
  {
    slug: "la-tomatina",
    name: "La Tomatina",
    city: "Buñol (Valencia)",
    iata: "VLC",
    emoji: "🍅",
    dates: "Último miércoles de agosto",
    summary:
      "Batalla de tomates en Buñol (40km de Valencia). Una hora de tiros de tomate desde camiones a 20.000 participantes. Inscripción €13 obligatoria.",
    whyAttend: [
      "Experiencia única — 150 toneladas de tomate vs 20k personas",
      "Solo dura 1h (11am-12pm) pero el evento total es todo el día",
      "Ambiente festivalero con bebida + música antes/después",
    ],
    practicalTips: [
      "Comprar entrada oficial obligatoria (€13) en latomatina.info — sin esto no entras al pueblo",
      "Tren Cercanías Valencia-Buñol, 45 min, 4€ ida y vuelta",
      "Llevar: ropa y zapatos que NO te importe tirar, gafas snorkel para ojos",
      "Mochila NO recomendable — sólo lo imprescindible en bolsillo cerrado",
    ],
    bestArea: "Dormir en Valencia ciudad (Buñol no tiene capacidad). Tren temprano al amanecer.",
    caveats: [
      "Tomate ácido pica los ojos — gafas obligatorias",
      "Cancelación posible por mal tiempo — política reembolso variable",
      "Sólo 20.000 entradas — agotan en 2-3 meses",
    ],
    destinoSlug: "valencia",
  },
  {
    slug: "semana-santa-sevilla",
    name: "Semana Santa de Sevilla",
    city: "Sevilla",
    iata: "SVQ",
    emoji: "✝️",
    dates: "Domingo Ramos a Domingo Resurrección (marzo o abril)",
    summary:
      "Semana Santa más famosa de España — 60+ hermandades sacan pasos por Sevilla. Madrugada del Jueves al Viernes Santo ('La Madrugá') es la noche cumbre.",
    whyAttend: [
      "Procesiones con pasos del XVII-XVIII y bandas de música",
      "La Macarena, El Cachorro, El Gran Poder — pasos icónicos",
      "Saetas: cantos flamencos espontáneos al paso",
      "Capirotes (gorros puntiagudos) — solemnidad única",
    ],
    practicalTips: [
      "Reservar hotel 4+ meses antes",
      "Imprimir el 'callero' (mapa con rutas y horarios pasos)",
      "Algunas iglesias entran solo con itinerario específico — leer prensa local",
      "Bocadillo de calamares en bar tradicional entre procesiones",
    ],
    bestArea: "Centro histórico (caro pero a 5 min de cualquier procesión) o Triana (lado río)",
    caveats: [
      "Madrugá: noche larga y fría hasta amanecer — ropa abrigada incluso en abril",
      "Lluvia cancela procesiones — política reembolso es de cada cofradía",
      "Comidas en restaurantes turísticos sobrevaloradas en esos días",
    ],
    destinoSlug: "sevilla",
  },
  {
    slug: "festival-cap-roig",
    name: "Festival de Cap Roig",
    city: "Calella de Palafrugell (Girona)",
    iata: "GRO",
    emoji: "🎵",
    dates: "Mediados julio a mediados agosto (4-5 semanas)",
    summary:
      "Festival de música al aire libre en los Jardines de Cap Roig (Costa Brava). Programación de artistas internacionales — pop, jazz, clásica, flamenco. Asientos numerados.",
    whyAttend: [
      "Anfiteatro natural sobre el mar — atardecer + concierto inolvidable",
      "Cartel mainstream (años recientes: Sting, Norah Jones, Joaquín Sabina, etc.)",
      "Acceso a Jardines de Cap Roig (botánico) incluido — visitar de día",
    ],
    practicalTips: [
      "Comprar entradas en festivaldecaproig.com con 2-3 meses de antelación",
      "Bus desde Calella de Palafrugell al recinto incluido en algunos paquetes",
      "Llevar chaqueta — la brisa mar nocturna refresca incluso en julio",
      "Aeropuerto GRO → Calella en coche 35 min (alquilar)",
    ],
    bestArea: "Calella de Palafrugell (mismo pueblo del festival) o Llafranc (5 min)",
    caveats: [
      "Conciertos sometidos a tiempo — política reembolso si cancelación",
      "Sin pubs o vida nocturna inmediata al recinto — planificar after-concert",
    ],
  },
  {
    slug: "ano-nuevo-puerta-del-sol",
    name: "Año Nuevo Puerta del Sol",
    city: "Madrid",
    iata: "MAD",
    emoji: "🍇",
    dates: "31 diciembre (Nochevieja)",
    summary:
      "Las uvas de Nochevieja en Puerta del Sol — campanadas del reloj de Gobernación al ritmo de RTVE. 80.000 personas en una hora, hasta 50k según restricciones.",
    whyAttend: [
      "Experiencia 'aquí y ahora' — verlo en TV vs estar allí",
      "Atmósfera única con uvas, cava, cotillón gratis",
      "Pre-uvas el 30 diciembre (ensayo no-oficial) menos saturado",
    ],
    practicalTips: [
      "Llegar a Sol con 3-4h antes (a partir de 9pm si quieres sitio decente)",
      "Sin acceso con bolsos grandes — controles policía",
      "Metro Sol cerrado 12-1am — usar Tirso de Molina o Sevilla",
      "Plan B si se llena: bares con TV en zona Latina o Malasaña",
    ],
    bestArea: "Cualquier hotel zona centro (Sol/Gran Vía/Latina) — sin coche día 31",
    caveats: [
      "Frío real en diciembre — abrigo + guantes",
      "Sin baños públicos — ir antes",
      "Los hoteles cobran tarifa premium 30 dic-1 ene",
    ],
    destinoSlug: "madrid",
  },
];

export const EVENTOS_ES_BY_SLUG: Record<string, EventoEsEntry> = Object.fromEntries(
  EVENTOS_ES_CATALOG.map((e) => [e.slug, e]),
);

export const EVENTOS_ES_SLUGS = EVENTOS_ES_CATALOG.map((e) => e.slug);

export function getEventoEs(slug: string): EventoEsEntry | null {
  return EVENTOS_ES_BY_SLUG[slug] ?? null;
}
