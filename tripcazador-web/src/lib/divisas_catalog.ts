/**
 * divisas_catalog.ts — SSS457 (23 may 2026)
 *
 * Conversor estático EUR ↔ X currency para landings SEO. Tipo cambio
 * approx mayo 2026, refrescar trimestralmente.
 *
 * NO es un live converter — la herramienta interactiva está en /deals
 * (CurrencyToggle de SSS424). Estas landings capturan tráfico SEO de
 * "cambio euro a dolar 100", "convertir euro yen" y monetizan vía Wise.
 *
 * SEO: "cambio euro libra hoy", "convertir euros a dolares",
 * "tasa cambio euro yen".
 */

export interface DivisaEntry {
  code: string; // ISO 4217 — "USD", "GBP", etc.
  name: string;
  nameEs: string; // nombre español
  symbol: string;
  countries: string[]; // países top que la usan
  emoji: string; // flag emoji
  /** 1 EUR = X. Refrescar trimestralmente. */
  rateFromEur: number;
  /** Volatilidad observada (Low: <5% trim, Medium: 5-15%, High: >15%). */
  volatility: "low" | "medium" | "high";
  /** Notas relevantes para viajeros. */
  travelTips: string[];
  /** Última actualización del rate. */
  lastUpdated: string;
}

export const DIVISAS_CATALOG: DivisaEntry[] = [
  {
    code: "USD",
    name: "US Dollar",
    nameEs: "Dólar estadounidense",
    symbol: "$",
    countries: ["EE.UU.", "Ecuador (oficial)", "Panamá (paralelo)"],
    emoji: "🇺🇸",
    rateFromEur: 1.08,
    volatility: "low",
    travelTips: [
      "Cambio aeropuerto USA: 5-8% comisión + mal tipo. Usa Revolut/Wise.",
      "Billetes 50-100$ rechazados frecuentemente en pequeños comercios — lleva 1-5-10-20.",
      "Propina (tip) 18-22% restaurante, 15% taxi. Esperado, no opcional.",
    ],
    lastUpdated: "2026-05-23",
  },
  {
    code: "GBP",
    name: "Pound Sterling",
    nameEs: "Libra esterlina",
    symbol: "£",
    countries: ["Reino Unido"],
    emoji: "🇬🇧",
    rateFromEur: 0.85,
    volatility: "low",
    travelTips: [
      "Sin libras al llegar: contactless funciona en TODO el transporte y comercios.",
      "Revolut/Wise para evitar comisiones cambio (típicas 2-3% banco español).",
      "Pubs: muchos sólo card desde COVID — paga siempre con tarjeta antes que efectivo.",
    ],
    lastUpdated: "2026-05-23",
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    nameEs: "Yen japonés",
    symbol: "¥",
    countries: ["Japón"],
    emoji: "🇯🇵",
    rateFromEur: 168,
    volatility: "medium",
    travelTips: [
      "Japón sigue siendo CASH economy en muchos lugares — saca 20-30k¥ al llegar (≈€120-180).",
      "Cajeros 7-Eleven aceptan tarjetas extranjeras 24h sin comisión local (banco origen puede cobrar).",
      "IC cards (Suica/Pasmo) recargables — transporte + tiendas convenience. Comprar al llegar.",
    ],
    lastUpdated: "2026-05-23",
  },
  {
    code: "CHF",
    name: "Swiss Franc",
    nameEs: "Franco suizo",
    symbol: "CHF",
    countries: ["Suiza", "Liechtenstein"],
    emoji: "🇨🇭",
    rateFromEur: 0.95,
    volatility: "low",
    travelTips: [
      "Suiza acepta EUR en muchos comercios PERO con cambio desfavorable. Mejor pagar en CHF.",
      "Ginebra/Zúrich son ciudades caras — calcula €30-50 por comida casual.",
      "SBB (trenes) aceptan tarjeta sin problema — no necesitas efectivo CHF si vas solo train+restaurantes.",
    ],
    lastUpdated: "2026-05-23",
  },
  {
    code: "THB",
    name: "Thai Baht",
    nameEs: "Baht tailandés",
    symbol: "฿",
    countries: ["Tailandia"],
    emoji: "🇹🇭",
    rateFromEur: 40,
    volatility: "low",
    travelTips: [
      "Cajeros Tailandia cobran 220฿ (~€5.50) por retirada — saca grande de una.",
      "Mercados/comida calle SOLO efectivo. Hoteles y restaurantes turísticos card OK.",
      "Devolver USD/EUR en aeropuerto al volver tiene buen tipo en KasikornBank exchange.",
    ],
    lastUpdated: "2026-05-23",
  },
  {
    code: "ARS",
    name: "Argentine Peso",
    nameEs: "Peso argentino",
    symbol: "$",
    countries: ["Argentina"],
    emoji: "🇦🇷",
    rateFromEur: 1100,
    volatility: "high",
    travelTips: [
      "Argentina tiene dos tipos de cambio: oficial y blue. Llevar USD/EUR en efectivo y cambiar en cuevas/Western Union para tipo blue (mejor).",
      "Tarjetas extranjeras desde 2023 usan tipo MEP (mejor que oficial). Revolut/Wise funciona OK.",
      "Inflación alta — precios en menús cambian semanalmente.",
    ],
    lastUpdated: "2026-05-23",
  },
  {
    code: "BRL",
    name: "Brazilian Real",
    nameEs: "Real brasileño",
    symbol: "R$",
    countries: ["Brasil"],
    emoji: "🇧🇷",
    rateFromEur: 5.5,
    volatility: "medium",
    travelTips: [
      "PIX (transferencia instantánea local) más usado que tarjeta — útil entre Uber/comercios.",
      "Casas de câmbio en aeropuertos tienen tipos malos. Mejor cambiar 100-200€ en USD primero.",
      "Bolsas robar comunes en Río/São Paulo — no llevar grandes cantidades visibles.",
    ],
    lastUpdated: "2026-05-23",
  },
  {
    code: "MXN",
    name: "Mexican Peso",
    nameEs: "Peso mexicano",
    symbol: "$",
    countries: ["México"],
    emoji: "🇲🇽",
    rateFromEur: 19,
    volatility: "medium",
    travelTips: [
      "Cajeros Banco Azteca/Banamex aceptan tarjetas extranjeras con menos comisión que Citibanamex.",
      "Tarjeta de crédito ampliamente aceptada — efectivo solo para mercados/taxis rurales.",
      "Propina 10-15% restaurante (no incluida normalmente).",
    ],
    lastUpdated: "2026-05-23",
  },
];

export const DIVISAS_BY_CODE: Record<string, DivisaEntry> = Object.fromEntries(
  DIVISAS_CATALOG.map((d) => [d.code.toLowerCase(), d]),
);

export const DIVISAS_CODES = DIVISAS_CATALOG.map((d) => d.code.toLowerCase());

export function getDivisa(code: string): DivisaEntry | null {
  return DIVISAS_BY_CODE[code.toLowerCase()] ?? null;
}

/** Convierte 1 EUR → currency con rate del catálogo. */
export function eurToCurrency(eur: number, code: string): number | null {
  const d = getDivisa(code);
  if (!d) return null;
  return eur * d.rateFromEur;
}

/** Convierte currency → EUR con rate del catálogo. */
export function currencyToEur(amount: number, code: string): number | null {
  const d = getDivisa(code);
  if (!d) return null;
  return amount / d.rateFromEur;
}
