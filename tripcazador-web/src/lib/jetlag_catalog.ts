/**
 * jetlag_catalog.ts — AUDIT-FULL-3 (24 may 2026)
 *
 * Plan recovery jet lag por ruta específica. 8 rutas long-haul desde
 * España con dirección eastbound/westbound + número de zonas horarias.
 *
 * Pure data — la recovery sigue regla universal: 1 día por hora de
 * diferencia. Eastbound (España→Asia) más duro que westbound (España→América).
 */

export interface JetlagRuta {
  slug: string; // "madrid-tokio"
  routeName: string; // "Madrid → Tokio"
  origin: string;
  destination: string;
  direction: "eastbound" | "westbound";
  tzDiffHours: number; // diferencia horaria absoluta
  flightHours: number;
  recoveryDays: number; // estimación universal: 1 día / hora
  severity: "leve" | "moderado" | "severo";
  // Plan día a día con acciones específicas (3-7 días)
  plan: Array<{ day: string; actions: string[] }>;
  destinoSlug?: string;
}

export const JETLAG_CATALOG: JetlagRuta[] = [
  {
    slug: "madrid-tokio",
    routeName: "Madrid → Tokio",
    origin: "Madrid",
    destination: "Tokio",
    direction: "eastbound",
    tzDiffHours: 8,
    flightHours: 14,
    recoveryDays: 7,
    severity: "severo",
    destinoSlug: "tokio",
    plan: [
      {
        day: "Día -3 (pre-viaje)",
        actions: [
          "Acuéstate 1h antes cada noche para acercarte al horario Tokio",
          "Hidrátate +25% normal (2.5L/día)",
          "Reduce cafeína a 1 taza/día max",
        ],
      },
      {
        day: "Día 0 (vuelo)",
        actions: [
          "Reloj a hora Tokio nada más despegar",
          "Si llegas tarde (mañana en Tokio): NO duermas en vuelo",
          "Hidratación 200ml/h vuelo, sin alcohol",
          "Comidas según horario Tokio, no según horas vuelo",
        ],
      },
      {
        day: "Día 1 (llegada)",
        actions: [
          "Llegada típicamente 9am hora local — NO siestas",
          "Luz solar directa 30 min mínimo (parque/calle)",
          "Café fuerte solo antes 14h, no después",
          "Cena ligera 19-20h, acostarse 22h-23h",
        ],
      },
      {
        day: "Días 2-3",
        actions: [
          "Despertar puntual 6:30-7:00 con alarma",
          "Luz solar primera hora del día (clave eastbound)",
          "Caminar 30+ min mañana para regular ritmo",
          "Evitar siestas >20 min",
        ],
      },
      {
        day: "Días 4-7",
        actions: [
          "Cuerpo ya ajustando — siéntete normal hacia día 5-6",
          "Mantén disciplina luz mañana + cena 19h",
          "Si despertar 3-4am persistente: melatonina 0.5mg",
        ],
      },
    ],
  },
  {
    slug: "madrid-bali",
    routeName: "Madrid → Bali",
    origin: "Madrid",
    destination: "Bali (Denpasar)",
    direction: "eastbound",
    tzDiffHours: 7,
    flightHours: 17,
    recoveryDays: 6,
    severity: "severo",
    destinoSlug: "bali",
    plan: [
      {
        day: "Día -2 (pre-viaje)",
        actions: [
          "Adelanta dormir 1h por noche",
          "Hidrátate fuerte (3L agua/día)",
          "Cena temprana (20h)",
        ],
      },
      {
        day: "Día 0 (vuelo)",
        actions: [
          "Suele haber escala (Dubai/Qatar) — duerme en tramo apropiado",
          "Reloj a Denpasar al despegar de escala",
          "Sin alcohol vuelo (deshidrata + jet lag peor)",
        ],
      },
      {
        day: "Día 1 (llegada)",
        actions: [
          "Llegada tarde-noche típica — duerme directo 7-8h",
          "Mañana siguiente: playa o piscina con sol pleno 1h",
          "Hidratación tropical: +1L vs normal",
        ],
      },
      {
        day: "Días 2-4",
        actions: [
          "Calor + humedad acentúan jet lag — descansa siesta corta (15min) post-comida",
          "Cafeína sólo mañana, té verde 14-16h OK",
          "Evita pool 12-15h (calor extremo cansa)",
        ],
      },
      {
        day: "Días 5-6",
        actions: [
          "Cuerpo ajustado — siéntete normal",
          "Mantén hidratación alta hasta vuelta",
        ],
      },
    ],
  },
  {
    slug: "madrid-buenos-aires",
    routeName: "Madrid → Buenos Aires",
    origin: "Madrid",
    destination: "Buenos Aires",
    direction: "westbound",
    tzDiffHours: 5,
    flightHours: 13,
    recoveryDays: 4,
    severity: "moderado",
    destinoSlug: "buenos-aires",
    plan: [
      {
        day: "Día -1 (pre-viaje)",
        actions: [
          "No cambies tu horario habitual (westbound más fácil)",
          "Descansa bien (7-8h sueño)",
          "Hidratación normal",
        ],
      },
      {
        day: "Día 0 (vuelo)",
        actions: [
          "Vuelo nocturno típico (sale 22-23h Madrid)",
          "Duerme primeras 6-7h del vuelo",
          "Despierta hora antes de aterrizaje, hidrátate",
        ],
      },
      {
        day: "Día 1 (llegada)",
        actions: [
          "Llegada típicamente mañana — desayuna pleno",
          "Día activo (paseo San Telmo, La Boca)",
          "Cena 21h argentina + acostarse 24h",
        ],
      },
      {
        day: "Días 2-4",
        actions: [
          "Cuerpo ajustado rápido (westbound -5h es manejable)",
          "Disfruta horario argentino (cena tarde + asado largos)",
        ],
      },
    ],
  },
  {
    slug: "madrid-nueva-york",
    routeName: "Madrid → Nueva York",
    origin: "Madrid",
    destination: "Nueva York (JFK)",
    direction: "westbound",
    tzDiffHours: 6,
    flightHours: 8,
    recoveryDays: 3,
    severity: "leve",
    destinoSlug: "nueva-york",
    plan: [
      {
        day: "Día 0 (vuelo)",
        actions: [
          "Sale 12-15h Madrid, llega tarde-mañana NYC",
          "NO duermas en vuelo (es de día NYC)",
          "Cafeína suave durante vuelo",
        ],
      },
      {
        day: "Día 1 (llegada)",
        actions: [
          "Tarde NYC activa: pasea Central Park, no siestas",
          "Cena 19-20h ligera, sueño 22-23h NYC",
        ],
      },
      {
        day: "Días 2-3",
        actions: [
          "Westbound corto = recovery rápida",
          "Desayuno fuerte para anclar horario",
        ],
      },
    ],
  },
  {
    slug: "madrid-mexico",
    routeName: "Madrid → Ciudad de México",
    origin: "Madrid",
    destination: "Ciudad de México",
    direction: "westbound",
    tzDiffHours: 7,
    flightHours: 12,
    recoveryDays: 4,
    severity: "moderado",
    plan: [
      {
        day: "Día 0 (vuelo)",
        actions: [
          "Vuelo diurno típico (sale 11-13h Madrid)",
          "NO duermas mucho — llegas tarde mañana México",
          "Hidratación alta (altitud DF = 2.250m)",
        ],
      },
      {
        day: "Día 1 (llegada)",
        actions: [
          "Llegada 16-18h México — sal a Roma/Condesa, no hotel",
          "Cena ligera 20h, sueño 23h",
          "Altitud: NO esfuerzo físico día 1",
        ],
      },
      {
        day: "Días 2-4",
        actions: [
          "Cuerpo ajusta jet lag + altitud simultáneamente",
          "Coca de hoja (té) ayuda con altitud para algunos",
        ],
      },
    ],
  },
  {
    slug: "madrid-bangkok",
    routeName: "Madrid → Bangkok",
    origin: "Madrid",
    destination: "Bangkok",
    direction: "eastbound",
    tzDiffHours: 6,
    flightHours: 12,
    recoveryDays: 5,
    severity: "moderado",
    destinoSlug: "tailandia",
    plan: [
      {
        day: "Día -2 (pre-viaje)",
        actions: [
          "Adelanta dormir 30-60 min/noche",
          "Hidratación 2.5L/día",
        ],
      },
      {
        day: "Día 0 (vuelo)",
        actions: [
          "Escala típica Doha/Estambul (4-5h)",
          "Duerme en tramo final hacia Bangkok",
          "Sin alcohol",
        ],
      },
      {
        day: "Día 1 (llegada)",
        actions: [
          "Llegada 14-16h Bangkok — luz solar inmediata",
          "Cena spicy 19-20h activa metabolismo",
          "Sueño 22h, no más tarde",
        ],
      },
      {
        day: "Días 2-5",
        actions: [
          "Calor + humedad cansan — siesta corta 15min post-comida OK",
          "Cuerpo ajustado día 4-5",
        ],
      },
    ],
  },
  {
    slug: "madrid-sidney",
    routeName: "Madrid → Sídney",
    origin: "Madrid",
    destination: "Sídney",
    direction: "eastbound",
    tzDiffHours: 9,
    flightHours: 24,
    recoveryDays: 9,
    severity: "severo",
    plan: [
      {
        day: "Día -4 (pre-viaje)",
        actions: [
          "Plan agresivo: adelanta dormir 90min/noche durante 4 días",
          "Reduce cafeína a 0 desde día -2",
          "Compra melatonina 0.5mg (legal España con receta)",
        ],
      },
      {
        day: "Día 0 (vuelo)",
        actions: [
          "Doble escala típica (Dubai + SE Asia)",
          "Sigue horario Sídney en cada tramo",
          "Hidratación 250ml/h",
        ],
      },
      {
        day: "Días 1-3 (llegada)",
        actions: [
          "Llegada típicamente mañana Sídney — luz solar 1h",
          "NO siestas día 1, sueño puntual 22h",
          "Melatonina 0.5mg al acostarte (días 1-3)",
        ],
      },
      {
        day: "Días 4-9",
        actions: [
          "Recovery más lenta — cuerpo ajusta paulatino",
          "Mantén disciplina horarios estricta",
          "Te sentirás normal hacia día 6-7",
        ],
      },
    ],
  },
  {
    slug: "madrid-dubai",
    routeName: "Madrid → Dubái",
    origin: "Madrid",
    destination: "Dubái",
    direction: "eastbound",
    tzDiffHours: 3,
    flightHours: 7,
    recoveryDays: 2,
    severity: "leve",
    destinoSlug: "dubai",
    plan: [
      {
        day: "Día 0 (vuelo)",
        actions: [
          "Vuelo diurno 7h directo — minimal jet lag",
          "Hidratación alta (Dubái es muy seco)",
        ],
      },
      {
        day: "Día 1 (llegada)",
        actions: [
          "Solo +3h diferencia — activate sin problema",
          "Disfruta destino sin recovery especial",
        ],
      },
      {
        day: "Día 2+",
        actions: [
          "Cuerpo ajusta solo en 24-48h",
          "Mantén hidratación alta (clima desértico)",
        ],
      },
    ],
  },
];

export const JETLAG_SLUGS: string[] = JETLAG_CATALOG.map((j) => j.slug);

export function getJetlag(slug: string): JetlagRuta | undefined {
  return JETLAG_CATALOG.find((j) => j.slug === slug.toLowerCase());
}
