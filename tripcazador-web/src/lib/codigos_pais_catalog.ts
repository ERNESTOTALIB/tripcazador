/**
 * codigos_pais_catalog.ts — SSS444 (23 may 2026)
 *
 * Lookup compacto por país top: huso horario, divisa, idioma, prefijo
 * telefónico, enchufe, conducción, sanidad, tiempo medio Madrid.
 *
 * SEO: "codigos pais japon viaje", "prefijo telefonico estados unidos",
 * "huso horario tailandia", "que enchufe en marruecos".
 *
 * 15 países cubriendo los destinos más buscados por viajeros ES.
 */

export interface CodigoPaisEntry {
  iso: string; // ISO 3166-1 alpha-2 lowercase, ej: "jp"
  name: string;
  emoji: string;
  capital: string;
  /** UTC offset principal (algunos países tienen varios — anotar). */
  timezone: string;
  timezoneNote?: string;
  /** Divisa ISO 4217 + signo. */
  currency: { code: string; name: string; symbol: string };
  /** Idioma oficial principal. */
  language: string;
  /** Prefijo telefónico internacional. */
  phonePrefix: string;
  /** Tipo enchufe + voltaje. */
  plug: { type: string; voltage: string; needsAdapterFromSpain: boolean };
  /** Lado de la conducción. */
  driving: "derecho" | "izquierdo";
  /** Tiempo vuelo medio desde Madrid en horas. */
  flightHoursFromMad: number;
  /** Visado requerido para españoles. */
  visa: "schengen" | "no-required" | "evisa" | "on-arrival" | "embassy";
  /** Slug en destinos_catalog si aplica (cross-link). */
  destinoSlug?: string;
  /** Tip curioso. */
  funFact: string;
}

export const CODIGOS_PAIS_CATALOG: CodigoPaisEntry[] = [
  {
    iso: "jp",
    name: "Japón",
    emoji: "🇯🇵",
    capital: "Tokio",
    timezone: "UTC+9",
    timezoneNote: "Sin DST. Solo +7h vs Madrid en verano, +8h en invierno.",
    currency: { code: "JPY", name: "Yen", symbol: "¥" },
    language: "Japonés",
    phonePrefix: "+81",
    plug: { type: "Type A (2 pin plano)", voltage: "100V / 50-60Hz", needsAdapterFromSpain: true },
    driving: "izquierdo",
    flightHoursFromMad: 14,
    visa: "no-required",
    destinoSlug: "japon",
    funFact: "Voltaje 100V — el más bajo del mundo. Verifica que tu cargador acepte 'INPUT 100-240V'.",
  },
  {
    iso: "us",
    name: "Estados Unidos",
    emoji: "🇺🇸",
    capital: "Washington D.C.",
    timezone: "UTC-5 a UTC-10",
    timezoneNote: "6 husos horarios. NYC -5, LA -8. Aplica DST.",
    currency: { code: "USD", name: "Dólar estadounidense", symbol: "$" },
    language: "Inglés",
    phonePrefix: "+1",
    plug: { type: "Type A/B (2-3 pin plano)", voltage: "120V / 60Hz", needsAdapterFromSpain: true },
    driving: "derecho",
    flightHoursFromMad: 8,
    visa: "evisa",
    destinoSlug: "nueva-york",
    funFact: "ESTA online obligatorio para españoles (~$21, válido 2 años, múltiples entradas).",
  },
  {
    iso: "gb",
    name: "Reino Unido",
    emoji: "🇬🇧",
    capital: "Londres",
    timezone: "UTC+0",
    timezoneNote: "1h menos que Madrid. Aplica DST.",
    currency: { code: "GBP", name: "Libra esterlina", symbol: "£" },
    language: "Inglés",
    phonePrefix: "+44",
    plug: { type: "Type G (3 pin)", voltage: "230V / 50Hz", needsAdapterFromSpain: true },
    driving: "izquierdo",
    flightHoursFromMad: 2.5,
    visa: "no-required",
    destinoSlug: "londres",
    funFact: "Conducir por la izquierda — recuérdalo al cruzar calles a pie (mirar derecha primero).",
  },
  {
    iso: "th",
    name: "Tailandia",
    emoji: "🇹🇭",
    capital: "Bangkok",
    timezone: "UTC+7",
    timezoneNote: "Sin DST. +6h vs Madrid en invierno, +5h en verano.",
    currency: { code: "THB", name: "Baht tailandés", symbol: "฿" },
    language: "Tailandés",
    phonePrefix: "+66",
    plug: { type: "Type A/B/C/F", voltage: "230V / 50Hz", needsAdapterFromSpain: false },
    driving: "izquierdo",
    flightHoursFromMad: 12,
    visa: "no-required",
    destinoSlug: "tailandia",
    funFact: "Hasta 30 días sin visado para españoles. Multi-estándar enchufe — Type C europeo funciona.",
  },
  {
    iso: "ma",
    name: "Marruecos",
    emoji: "🇲🇦",
    capital: "Rabat",
    timezone: "UTC+1",
    timezoneNote: "Misma hora que Madrid casi todo el año (excepto Ramadán).",
    currency: { code: "MAD", name: "Dírham marroquí", symbol: "DH" },
    language: "Árabe + Francés (turismo)",
    phonePrefix: "+212",
    plug: { type: "Type C/E (2 pin)", voltage: "220V / 50Hz", needsAdapterFromSpain: false },
    driving: "derecho",
    flightHoursFromMad: 2.5,
    visa: "no-required",
    destinoSlug: "marruecos",
    funFact: "Dírham no convertible fuera del país — cambia al llegar y antes de salir (no se puede sacar).",
  },
  {
    iso: "tr",
    name: "Turquía",
    emoji: "🇹🇷",
    capital: "Ankara",
    timezone: "UTC+3",
    timezoneNote: "Sin DST. +2h vs Madrid en verano, +3h en invierno.",
    currency: { code: "TRY", name: "Lira turca", symbol: "₺" },
    language: "Turco",
    phonePrefix: "+90",
    plug: { type: "Type C/F (2 pin)", voltage: "230V / 50Hz", needsAdapterFromSpain: false },
    driving: "derecho",
    flightHoursFromMad: 4,
    visa: "no-required",
    destinoSlug: "estambul",
    funFact: "Hasta 90 días sin visado para españoles. Lira muy volátil — usa euros para transacciones grandes si puedes.",
  },
  {
    iso: "ae",
    name: "Emiratos Árabes Unidos",
    emoji: "🇦🇪",
    capital: "Abu Dabi",
    timezone: "UTC+4",
    currency: { code: "AED", name: "Dírham emiratí", symbol: "د.إ" },
    language: "Árabe + Inglés (turismo)",
    phonePrefix: "+971",
    plug: { type: "Type G (3 pin UK)", voltage: "220V / 50Hz", needsAdapterFromSpain: true },
    driving: "derecho",
    flightHoursFromMad: 7,
    visa: "no-required",
    destinoSlug: "dubai",
    funFact: "Verano (jun-sep) 45°C — visita mejor en invierno (nov-mar). No alcohol en lugares públicos.",
  },
  {
    iso: "ar",
    name: "Argentina",
    emoji: "🇦🇷",
    capital: "Buenos Aires",
    timezone: "UTC-3",
    timezoneNote: "Sin DST. -5h vs Madrid en invierno, -4h en verano.",
    currency: { code: "ARS", name: "Peso argentino", symbol: "$" },
    language: "Español",
    phonePrefix: "+54",
    plug: { type: "Type C/I", voltage: "220V / 50Hz", needsAdapterFromSpain: false },
    driving: "derecho",
    flightHoursFromMad: 13,
    visa: "no-required",
    destinoSlug: "buenos-aires",
    funFact: "Type C europeo funciona en la mayoría de enchufes. Type I (nuevos edificios) requiere adaptador.",
  },
  {
    iso: "br",
    name: "Brasil",
    emoji: "🇧🇷",
    capital: "Brasilia",
    timezone: "UTC-3",
    timezoneNote: "Aplica DST en algunas regiones. Sao Paulo y Río -3h en verano local.",
    currency: { code: "BRL", name: "Real brasileño", symbol: "R$" },
    language: "Portugués",
    phonePrefix: "+55",
    plug: { type: "Type N (3 pin redondo)", voltage: "127V o 220V", needsAdapterFromSpain: true },
    driving: "derecho",
    flightHoursFromMad: 11,
    visa: "no-required",
    funFact: "Voltaje varía por ciudad — Sao Paulo 127V, Brasilia 220V. Verifica antes en cada hotel.",
  },
  {
    iso: "mx",
    name: "México",
    emoji: "🇲🇽",
    capital: "Ciudad de México",
    timezone: "UTC-6 a UTC-7",
    timezoneNote: "3 zonas horarias. CDMX -7h vs Madrid.",
    currency: { code: "MXN", name: "Peso mexicano", symbol: "$" },
    language: "Español",
    phonePrefix: "+52",
    plug: { type: "Type A/B (US)", voltage: "127V / 60Hz", needsAdapterFromSpain: true },
    driving: "derecho",
    flightHoursFromMad: 11,
    visa: "no-required",
    funFact: "Hasta 180 días sin visado para españoles. FMM (Forma Migratoria Múltiple) obligatoria en frontera.",
  },
  {
    iso: "cn",
    name: "China",
    emoji: "🇨🇳",
    capital: "Pekín",
    timezone: "UTC+8",
    timezoneNote: "Un solo huso para todo el país. +6h vs Madrid verano, +7h invierno.",
    currency: { code: "CNY", name: "Yuan renminbi", symbol: "¥" },
    language: "Mandarín",
    phonePrefix: "+86",
    plug: { type: "Type A/C/I", voltage: "220V / 50Hz", needsAdapterFromSpain: true },
    driving: "derecho",
    flightHoursFromMad: 12,
    visa: "embassy",
    funFact: "Visa obligatoria (~$120). Servicios Google/WhatsApp bloqueados — VPN necesario o instalar WeChat antes.",
  },
  {
    iso: "in",
    name: "India",
    emoji: "🇮🇳",
    capital: "Nueva Delhi",
    timezone: "UTC+5:30",
    timezoneNote: "Único país con offset +30min. +3:30h Madrid verano, +4:30h invierno.",
    currency: { code: "INR", name: "Rupia india", symbol: "₹" },
    language: "Hindi + Inglés",
    phonePrefix: "+91",
    plug: { type: "Type D/M (3 pin)", voltage: "230V / 50Hz", needsAdapterFromSpain: true },
    driving: "izquierdo",
    flightHoursFromMad: 11,
    visa: "evisa",
    funFact: "eVisa online ($25, 30 días, doble entrada). Conducción por la izquierda. Adaptador universal D/M necesario.",
  },
  {
    iso: "id",
    name: "Indonesia",
    emoji: "🇮🇩",
    capital: "Yakarta",
    timezone: "UTC+7 a UTC+9",
    timezoneNote: "3 husos horarios. Bali UTC+8.",
    currency: { code: "IDR", name: "Rupia indonesia", symbol: "Rp" },
    language: "Bahasa Indonesia",
    phonePrefix: "+62",
    plug: { type: "Type C/F (2 pin)", voltage: "230V / 50Hz", needsAdapterFromSpain: false },
    driving: "izquierdo",
    flightHoursFromMad: 16,
    visa: "on-arrival",
    destinoSlug: "bali",
    funFact: "Visa on arrival ~$35 (30 días). Enchufe europeo C/F funciona — sin adaptador necesario.",
  },
  {
    iso: "au",
    name: "Australia",
    emoji: "🇦🇺",
    capital: "Canberra",
    timezone: "UTC+8 a UTC+11",
    timezoneNote: "3 husos. Sídney UTC+10. Aplica DST en algunas regiones.",
    currency: { code: "AUD", name: "Dólar australiano", symbol: "A$" },
    language: "Inglés",
    phonePrefix: "+61",
    plug: { type: "Type I (3 pin angular)", voltage: "230V / 50Hz", needsAdapterFromSpain: true },
    driving: "izquierdo",
    flightHoursFromMad: 22,
    visa: "evisa",
    destinoSlug: "sydney",
    funFact: "eVisitor 651 online gratis para españoles, 3 meses por entrada. Sistema enchufe único — Type I.",
  },
  {
    iso: "za",
    name: "Sudáfrica",
    emoji: "🇿🇦",
    capital: "Pretoria",
    timezone: "UTC+2",
    currency: { code: "ZAR", name: "Rand sudafricano", symbol: "R" },
    language: "Inglés + Afrikaans + 9 más",
    phonePrefix: "+27",
    plug: { type: "Type M (3 pin grande)", voltage: "230V / 50Hz", needsAdapterFromSpain: true },
    driving: "izquierdo",
    flightHoursFromMad: 11,
    visa: "no-required",
    destinoSlug: "sudafrica",
    funFact: "Type M es único — adaptador universal puede no encajar. Pedir M específico en hoteles.",
  },
];

export const CODIGOS_PAIS_BY_ISO: Record<string, CodigoPaisEntry> = Object.fromEntries(
  CODIGOS_PAIS_CATALOG.map((c) => [c.iso, c]),
);

export const CODIGOS_PAIS_ISOS = CODIGOS_PAIS_CATALOG.map((c) => c.iso);

export function getCodigoPais(iso: string): CodigoPaisEntry | null {
  return CODIGOS_PAIS_BY_ISO[iso.toLowerCase()] ?? null;
}
