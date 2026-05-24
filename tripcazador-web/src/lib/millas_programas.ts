/**
 * millas_programas.ts — SUPER-1D (24 may 2026)
 *
 * Datos de valor real (cpm = cents per mile) para 6 programas de millas
 * principales. Estos son valores observados en redenciones reales 2024-2026,
 * no los "valuations" oficiales (que son hype-marketing).
 *
 * cpm = euros que vale 1.000 millas en promedio cuando rediméis a saver.
 * Ejemplos: Avios 1.3 cpm → 25.000 Avios saver = ~€325 equivalente real.
 */

export interface MillasProgram {
  slug: string;
  name: string; // "Iberia Plus (Avios)"
  emoji: string;
  cpm: number; // euros por 1.000 millas en redenciones saver realistas
  bestUse: string;
  worstUse: string;
  expirationMonths: number; // 0 = no expira
  transferPartners: string[];
  notes: string;
}

export const MILLAS_PROGRAMAS: MillasProgram[] = [
  {
    slug: "avios",
    name: "Iberia Plus / British Avios",
    emoji: "🇪🇸",
    cpm: 13,
    bestUse: "MAD-NYC saver 25K Avios + €100 tasas (~€800 cash). Sweet-spot internacional para Latam tier.",
    worstUse: "Redimir económicos cortos europeos donde el cash es bajo (Vueling MAD-BCN 5K = ~€35 → cash €30 mejor).",
    expirationMonths: 36,
    transferPartners: ["Amex Membership Rewards (1:1 ES)", "Chase UR (1:1 USA)", "Marriott Bonvoy (3:1)"],
    notes: "El programa con mejor ratio para hispanohablante. Avios se pueden mover entre Iberia/BA/Aer Lingus/Qatar.",
  },
  {
    slug: "miles-and-more",
    name: "Miles & More (Lufthansa)",
    emoji: "🇩🇪",
    cpm: 11,
    bestUse: "FRA-NRT business 95K M&M saver (~€2.800 cash). Star Alliance largo radio en cabinas premium.",
    worstUse: "Redenciones short-haul europeas — tasas YQ altas (€150+) eliminan valor real.",
    expirationMonths: 36,
    transferPartners: ["Amex Membership Rewards (2:1 ES)", "Marriott Bonvoy (3:1)"],
    notes: "Mejor para business class long-haul europeo→Asia/USA. Status HON/Senator beneficios reales.",
  },
  {
    slug: "skymiles",
    name: "Delta SkyMiles",
    emoji: "🇺🇸",
    cpm: 11,
    bestUse: "ATL/JFK→Europa Premium Economy 65K saver (~€1.300 cash). USA→Caribe es competitivo también.",
    worstUse: "Vuelos Delta domésticos premium — Delta no publica saver, depende de demanda dinámica (peor que United).",
    expirationMonths: 0,
    transferPartners: ["Amex Membership Rewards (1:1 USA)", "Marriott Bonvoy (3:1)"],
    notes: "No expira nunca. SkyTeam alliance da acceso a Air France/KLM/Korean/Aeroméxico — útil para hispanohablantes.",
  },
  {
    slug: "aadvantage",
    name: "American AAdvantage",
    emoji: "🦅",
    cpm: 14,
    bestUse: "NYC-HKG Cathay Pacific First class 110K (~€10.000 cash). El sweet-spot más famoso del mundo.",
    worstUse: "Vuelos AA propios MAD-USA — saturados y precios dinámicos.",
    expirationMonths: 24,
    transferPartners: ["Citi ThankYou (1:1 USA)", "Marriott Bonvoy (3:1)", "Bilt Rewards (1:1)"],
    notes: "Oneworld alliance amplia. Mejor valor del mundo para First class en partners (CX, JL, QR).",
  },
  {
    slug: "united-mileageplus",
    name: "United MileagePlus",
    emoji: "🛩️",
    cpm: 12,
    bestUse: "USA→Europa economy 60K saver (~€720 cash). Star Alliance Excursionist Perk para multi-stop.",
    worstUse: "Redenciones business class United (devaluado en 2023).",
    expirationMonths: 0,
    transferPartners: ["Chase UR (1:1)", "Marriott Bonvoy (3:1)"],
    notes: "Excursionist Perk: en un award internacional, segmento intermedio doméstico EXTRA gratis. Único valor MileagePlus 2025.",
  },
  {
    slug: "flying-blue",
    name: "Flying Blue (AF/KL)",
    emoji: "🇫🇷",
    cpm: 10,
    bestUse: "Promo Awards mensuales: rutas long-haul a -50% (50K MAD-Bali en lugar de 110K). Suscribirse newsletter.",
    worstUse: "Awards estándar AF/KL economy — caros vs cash.",
    expirationMonths: 24,
    transferPartners: ["Amex Membership Rewards (1:1)", "Citi ThankYou (1:1)", "Marriott Bonvoy (3:1)"],
    notes: "Promo Rewards mensual es la única razón real para acumular Flying Blue. Calendar awards web AF.",
  },
];

export const MILLAS_SLUGS: string[] = MILLAS_PROGRAMAS.map((m) => m.slug);

export function getMillasProgram(slug: string): MillasProgram | undefined {
  return MILLAS_PROGRAMAS.find((m) => m.slug === slug.toLowerCase());
}

/**
 * Valor en euros de X millas para el programa dado.
 */
export function valorMillas(slug: string, millas: number): number | null {
  const p = getMillasProgram(slug);
  if (!p) return null;
  return Math.round((millas / 1000) * p.cpm * 100) / 100; // 2 decimales
}
