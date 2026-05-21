/**
 * currency_convert.ts — SSS380 (21 may 2026)
 *
 * Conversión EUR → 8 monedas relevantes para audience ES/LATAM:
 *  - USD (Estados Unidos)
 *  - GBP (Reino Unido)
 *  - MXN (México)
 *  - ARS (Argentina)
 *  - COP (Colombia)
 *  - CLP (Chile)
 *  - BRL (Brasil)
 *  - PEN (Perú)
 *
 * Tasas snapshot ECB referencia 21 may 2026 — actualizar cuando lo demande
 * el plan o cuando movimos a tasas live via API (ECB diario gratuito).
 *
 * Pure fns sin red. Para tasas dinámicas, swap getRates() por fetch.
 */

export type CurrencyCode =
  | "EUR"
  | "USD"
  | "GBP"
  | "MXN"
  | "ARS"
  | "COP"
  | "CLP"
  | "BRL"
  | "PEN";

/**
 * Tasas 1 EUR = X UNIT. Snapshot 21 may 2026 (ficticio + ECB estilo).
 * En prod: cargar de cache 24h o fetch ECB.
 */
const RATES_EUR_BASE: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.85,
  MXN: 18.45,
  ARS: 950.0, // ARS muy inestable
  COP: 4280.0,
  CLP: 985.0,
  BRL: 5.45,
  PEN: 4.10,
};

const SYMBOL: Record<CurrencyCode, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  MXN: "MX$",
  ARS: "AR$",
  COP: "COL$",
  CLP: "CL$",
  BRL: "R$",
  PEN: "S/",
};

const FRIENDLY_NAMES: Record<CurrencyCode, string> = {
  EUR: "Euro",
  USD: "Dólar EE.UU.",
  GBP: "Libra esterlina",
  MXN: "Peso mexicano",
  ARS: "Peso argentino",
  COP: "Peso colombiano",
  CLP: "Peso chileno",
  BRL: "Real brasileño",
  PEN: "Sol peruano",
};

/**
 * Convierte un monto en EUR a otra moneda.
 * Round behavior:
 *  - EUR/USD/GBP/BRL/PEN: 2 decimales
 *  - MXN: 1 decimal
 *  - ARS/COP/CLP: 0 decimales (montos altos)
 */
export function convertFromEur(amount_eur: number, to: CurrencyCode): number {
  if (!Number.isFinite(amount_eur) || amount_eur < 0) return 0;
  const rate = RATES_EUR_BASE[to];
  if (!rate) return 0;
  const raw = amount_eur * rate;
  const decimals = ["ARS", "COP", "CLP"].includes(to) ? 0 : to === "MXN" ? 1 : 2;
  const m = 10 ** decimals;
  return Math.round(raw * m) / m;
}

export function formatCurrency(amount: number, code: CurrencyCode): string {
  const decimals = ["ARS", "COP", "CLP"].includes(code) ? 0 : code === "MXN" ? 1 : 2;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: code,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function symbolFor(code: CurrencyCode): string {
  return SYMBOL[code] || code;
}

export function nameFor(code: CurrencyCode): string {
  return FRIENDLY_NAMES[code] || code;
}

export function listSupportedCurrencies(): CurrencyCode[] {
  return Object.keys(RATES_EUR_BASE) as CurrencyCode[];
}

/**
 * Detecta moneda más probable por código región/IATA.
 *  - destino USA → USD
 *  - destino UK → GBP
 *  - destino MX → MXN
 *  - destino LATAM → moneda local
 *
 * Útil para sugerir conversión por defecto en deal pages.
 */
const COUNTRY_DEFAULT: Record<string, CurrencyCode> = {
  US: "USD", UK: "GBP", GB: "GBP", MX: "MXN", AR: "ARS",
  CO: "COP", CL: "CLP", BR: "BRL", PE: "PEN",
};

export function defaultCurrencyForCountry(countryCode: string): CurrencyCode {
  return COUNTRY_DEFAULT[countryCode.toUpperCase()] || "EUR";
}

/** Aproximación por IATA destino (común). */
const IATA_TO_COUNTRY: Record<string, string> = {
  // USA
  NYC: "US", JFK: "US", LAX: "US", MIA: "US", ORD: "US", SFO: "US", BOS: "US",
  // UK
  LON: "GB", LHR: "GB", LGW: "GB", STN: "GB", MAN: "GB", EDI: "GB",
  // México
  MEX: "MX", CUN: "MX", GDL: "MX", PVR: "MX",
  // Argentina
  EZE: "AR", BUE: "AR", AEP: "AR", COR: "AR",
  // Colombia
  BOG: "CO", MDE: "CO", CTG: "CO",
  // Chile
  SCL: "CL",
  // Brasil
  GIG: "BR", GRU: "BR", REC: "BR", SSA: "BR",
  // Perú
  LIM: "PE", CUZ: "PE",
};

export function defaultCurrencyForIata(iata: string): CurrencyCode {
  const country = IATA_TO_COUNTRY[iata.toUpperCase()];
  return country ? defaultCurrencyForCountry(country) : "EUR";
}

export const __test__ = {
  RATES_EUR_BASE,
  COUNTRY_DEFAULT,
  IATA_TO_COUNTRY,
};
