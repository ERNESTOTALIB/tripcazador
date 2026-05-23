/**
 * tasa_turistica_catalog.ts — SSS459 (23 may 2026)
 *
 * Tasa turística por ciudad. Datos may 2026, refrescar trimestralmente.
 *
 * High-intent queries: "tasa turistica roma cuanto", "tasa turistica
 * barcelona 2026", "amsterdam city tax", "vienna tourist tax".
 */

export interface TasaTuristicaEntry {
  slug: string;
  city: string;
  country: string;
  emoji: string;
  /** Tasa por noche y persona (rango si varía por estrella hotel). */
  ratePerNight: string;
  /** Máximo noches que cobra (algunas ciudades cobran solo primeras N). */
  maxNights?: number;
  /** Cuándo se cobra (al check-in / online / impuesto separado). */
  collection: string;
  /** Excepciones (menores, residentes, etc.). */
  exemptions: string[];
  /** Notas relevantes. */
  notes: string;
  lastUpdated: string;
}

export const TASA_TURISTICA_CATALOG: TasaTuristicaEntry[] = [
  {
    slug: "roma",
    city: "Roma",
    country: "Italia",
    emoji: "🇮🇹",
    ratePerNight: "€3-7 según categoría hotel (3*=€4, 4*=€6, 5*=€7)",
    maxNights: 10,
    collection: "En hotel al check-out, efectivo o tarjeta",
    exemptions: ["Menores 10 años", "Discapacitados + acompañante", "Personal sanitario en viaje médico"],
    notes:
      "Una de las tasas más altas de Europa. Hoteles 5* cobran €7/noche/persona — familia 4 pax 3 noches puede ser €84 extra. Booking suele incluirla destacada en la factura.",
    lastUpdated: "2026-05-23",
  },
  {
    slug: "barcelona",
    city: "Barcelona",
    country: "España",
    emoji: "🇪🇸",
    ratePerNight: "€3.50-7.00 (recargo municipal + autonómico)",
    maxNights: 7,
    collection: "En hotel al check-in",
    exemptions: ["Menores 17 años", "Estancias por motivos médicos"],
    notes:
      "Sube cada año desde 2022. Apartamentos turísticos pagan más que hoteles. La Generalitat de Catalunya considera nuevas subidas 2026-2027.",
    lastUpdated: "2026-05-23",
  },
  {
    slug: "amsterdam",
    city: "Ámsterdam",
    country: "Países Bajos",
    emoji: "🇳🇱",
    ratePerNight: "12.5% del precio habitación + €3/noche fijo",
    collection: "Incluida en la factura del hotel — sin pagar separado",
    exemptions: ["Menores 16 años"],
    notes:
      "La más alta de Europa proporcionalmente. Para hotel €200/noche pagas €28 + €3 = €31 extra (15.5%). Booking suele desglosarla al pagar.",
    lastUpdated: "2026-05-23",
  },
  {
    slug: "berlin",
    city: "Berlín",
    country: "Alemania",
    emoji: "🇩🇪",
    ratePerNight: "5% del precio habitación pre-IVA",
    maxNights: 21,
    collection: "Hotel cobra al check-in. Empresariales exentos con formulario.",
    exemptions: ["Viajes business (con formulario A1 firmado por empresa)", "Estancias > 21 noches"],
    notes:
      "Solo aplica viajes turísticos. Si vienes por trabajo y rellenas formulario, gratis. Verificable post-hoc por la administración (rara vez).",
    lastUpdated: "2026-05-23",
  },
  {
    slug: "viena",
    city: "Viena",
    country: "Austria",
    emoji: "🇦🇹",
    ratePerNight: "3.2% del precio neto habitación",
    collection: "Incluida en factura hotel",
    exemptions: ["Menores 15 años", "Estudiantes en cursos"],
    notes:
      "Una de las más bajas Europa. Para hotel €100/noche son ~€3 extra.",
    lastUpdated: "2026-05-23",
  },
  {
    slug: "praga",
    city: "Praga",
    country: "República Checa",
    emoji: "🇨🇿",
    ratePerNight: "50 CZK (~€2) por adulto/noche",
    maxNights: 60,
    collection: "Hotel cobra al check-in en CZK",
    exemptions: ["Menores 18 años", "Mayores 65"],
    notes:
      "Una de las más bajas. Sube ligeramente 2025-2026.",
    lastUpdated: "2026-05-23",
  },
  {
    slug: "lisboa",
    city: "Lisboa",
    country: "Portugal",
    emoji: "🇵🇹",
    ratePerNight: "€4/noche por adulto",
    maxNights: 7,
    collection: "Hotel cobra al check-out, efectivo o tarjeta",
    exemptions: ["Menores 13 años", "Viajeros con descapacidad"],
    notes:
      "Sólo 7 primeras noches por estancia. Tras octubre 2024 sube €1.",
    lastUpdated: "2026-05-23",
  },
  {
    slug: "paris",
    city: "París",
    country: "Francia",
    emoji: "🇫🇷",
    ratePerNight: "€2.60-15.60 según categoría (palacio €15.60, 1*=€2.60)",
    collection: "Incluida en factura. Algunos Airbnb cobran aparte.",
    exemptions: ["Menores 18 años", "Trabajadores temporales"],
    notes:
      "Una de las más altas. Hoteles 5* cobran €10.73/noche. Palacios oficiales (Crillon, Ritz, Bristol) €15.60.",
    lastUpdated: "2026-05-23",
  },
  {
    slug: "venecia",
    city: "Venecia",
    country: "Italia",
    emoji: "🇮🇹",
    ratePerNight: "€1-5 según hotel + nueva tasa €5 entrada centro (días pico)",
    maxNights: 5,
    collection: "Hotel: en factura. Entrada centro: online o portales fronterizos.",
    exemptions: ["Pernoctas en hotel del centro exentas de tasa entrada"],
    notes:
      "Desde 2024 Venecia cobra €5 extra para visitantes de día (no pernoctas) en fechas pico. Hotel mantiene tasa normal por noche.",
    lastUpdated: "2026-05-23",
  },
  {
    slug: "lisboa-aeropuerto",
    city: "Lisboa (tasa aeropuerto)",
    country: "Portugal",
    emoji: "🇵🇹",
    ratePerNight: "€2 por pax pasajero salida internacional",
    collection: "Incluida en precio billete (no separada)",
    exemptions: ["Conexiones tránsito"],
    notes:
      "No es tasa turística por noche — es tasa aeroportuaria. Incluida en todos los billetes desde LIS.",
    lastUpdated: "2026-05-23",
  },
  {
    slug: "edimburgo",
    city: "Edimburgo",
    country: "Reino Unido (Escocia)",
    emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    ratePerNight: "5% del precio habitación (desde mid-2026)",
    maxNights: 7,
    collection: "Hotel cobra al check-out",
    exemptions: ["Menores 17 años", "Residentes Edinburgh"],
    notes:
      "Primera ciudad UK con tasa turística (entra en vigor 24 julio 2026). Otras escocesas (Glasgow, Highlands) preparan tasa similar.",
    lastUpdated: "2026-05-23",
  },
  {
    slug: "ibiza",
    city: "Ibiza",
    country: "España (Baleares)",
    emoji: "🇪🇸",
    ratePerNight: "€1-4 según categoría hotel y temporada",
    collection: "Hotel cobra al check-out",
    exemptions: ["Menores 16 años"],
    notes:
      "Eco-tasa Baleares aplicable también en Mallorca, Menorca, Formentera. Sube en temporada alta (jul-ago).",
    lastUpdated: "2026-05-23",
  },
];

export const TASA_TURISTICA_BY_SLUG: Record<string, TasaTuristicaEntry> = Object.fromEntries(
  TASA_TURISTICA_CATALOG.map((t) => [t.slug, t]),
);

export const TASA_TURISTICA_SLUGS = TASA_TURISTICA_CATALOG.map((t) => t.slug);

export function getTasaTuristica(slug: string): TasaTuristicaEntry | null {
  return TASA_TURISTICA_BY_SLUG[slug] ?? null;
}
