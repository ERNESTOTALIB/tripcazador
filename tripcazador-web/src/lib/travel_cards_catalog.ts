/**
 * travel_cards_catalog.ts — SSS452 (23 may 2026)
 *
 * Tarjetas de débito/crédito orientadas a viaje internacional.
 * Comparativa fees retiradas, comisiones cambio, top-up, brand.
 *
 * Datos verificados mayo 2026 — fees varían frecuentemente, marcar
 * lastVerified.
 *
 * SEO: "mejor tarjeta para viajar", "tarjeta sin comisiones extranjero",
 * "revolut vs wise", "tarjeta para sacar dinero en el extranjero".
 */

export interface TravelCardEntry {
  slug: string;
  name: string;
  emoji: string;
  type: "neobanco" | "tradicional" | "fintech";
  /** Comisión cambio fuera del horario mercado (fin de semana). */
  fxFee: string;
  /** Comisión retirada cajero extranjero. */
  atmFee: string;
  /** Cuota mensual. */
  monthlyFee: string;
  /** Características clave. */
  features: string[];
  /** Pros. */
  pros: string[];
  /** Cons. */
  cons: string[];
  /** Cobertura geográfica. */
  coverage: string;
  /** Programa referral (sin afiliación directa por defecto). */
  signupNote?: string;
  /** URL oficial (sin afiliación específica). */
  officialUrl: string;
  lastVerified: string;
}

export const TRAVEL_CARDS_CATALOG: TravelCardEntry[] = [
  {
    slug: "revolut",
    name: "Revolut",
    emoji: "💳",
    type: "fintech",
    fxFee: "0% lun-vie horario mercado; +1% fin de semana (Standard)",
    atmFee: "Gratis hasta €200/mes (Standard); +2% después",
    monthlyFee: "Gratis (Standard) · €7.99 (Premium) · €13.99 (Metal)",
    features: [
      "Crypto + stocks integrados",
      "Multi-currency wallet (30+ divisas)",
      "Pagos instantáneos a otros Revolut",
      "Seguro viaje incluido en Premium/Metal",
    ],
    pros: [
      "App muy buena con notificaciones instantáneas",
      "Cambio de divisas a tipo real de mercado",
      "Cuotas Premium con valor (lounge access, seguro)",
    ],
    cons: [
      "Recargos fin de semana en operaciones FX",
      "Atención cliente solo chat",
      "Cuenta no es bancaria 'pura' — fondos vía Lithuania/UK",
    ],
    coverage: "Worldwide aceptación Visa/Mastercard",
    signupNote: "Plan gratuito desde la app oficial. Códigos referral comunes en redes sociales.",
    officialUrl: "https://www.revolut.com",
    lastVerified: "2026-05-23",
  },
  {
    slug: "wise",
    name: "Wise (antes TransferWise)",
    emoji: "🌐",
    type: "fintech",
    fxFee: "0.41-0.65% (variable por par de divisas)",
    atmFee: "€200/mes gratis (2 retiradas); luego 1.75% + €0.50",
    monthlyFee: "Gratis (cuenta + tarjeta)",
    features: [
      "Conversión a tipo mercado interbancario",
      "Multi-currency con IBAN local 40+ países",
      "Tarjeta física + virtual",
      "Cuenta business (freelancers)",
    ],
    pros: [
      "Transparencia total fees — no markups ocultos",
      "Recomendada por usuarios para transferencias",
      "IBAN local UE para recibir cobros desde sociedades extranjeras",
    ],
    cons: [
      "Retiradas tienen límite gratuito bajo (€200/mes)",
      "No tiene cuenta crédito tradicional",
      "Carecer de servicios bancarios como tarjetas crédito",
    ],
    coverage: "Worldwide Mastercard",
    signupNote: "Cuenta gratuita desde wise.com. Affiliate program disponible para creadores.",
    officialUrl: "https://wise.com",
    lastVerified: "2026-05-23",
  },
  {
    slug: "n26",
    name: "N26",
    emoji: "🇩🇪",
    type: "neobanco",
    fxFee: "0% (Mastercard al cambio)",
    atmFee: "5 retiradas gratis/mes (Standard); ilimitadas (You/Metal)",
    monthlyFee: "Gratis (Standard) · €9.90 (You) · €16.90 (Metal)",
    features: [
      "Banco regulado en Alemania (BaFin)",
      "Seguros viaje incluidos en You/Metal",
      "App alemana con detalle de transacciones",
      "Apple Pay + Google Pay nativos",
    ],
    pros: [
      "Cuenta bancaria pura regulada (no fintech UK)",
      "App fluida + notificaciones tiempo real",
      "Cobertura SEPA + UK",
    ],
    cons: [
      "Sin IBAN español (es DE) — algunos cobros rebotan",
      "Sólo 5 retiradas gratis mes (free)",
      "Sin oficinas físicas",
    ],
    coverage: "Mastercard worldwide",
    signupNote: "Onboarding 100% online en n26.com (~10 min).",
    officialUrl: "https://n26.com",
    lastVerified: "2026-05-23",
  },
  {
    slug: "bbva-aqua",
    name: "BBVA Aqua",
    emoji: "🇪🇸",
    type: "tradicional",
    fxFee: "2-3% según operación",
    atmFee: "0% en cajeros BBVA España + grupo BBVA mundial (BBVA México, Garanti, etc.)",
    monthlyFee: "Gratis (con cuenta Online)",
    features: [
      "Banco español tradicional",
      "Cajeros BBVA gratis worldwide (red propia)",
      "Tarjeta sin numeración (más seguro)",
      "Cuenta IBAN ES estándar",
    ],
    pros: [
      "Atención cliente español + oficinas físicas",
      "Buena para cuenta bancaria + tarjeta principal",
      "Fácil traspaso desde otros bancos ES",
    ],
    cons: [
      "Fees FX altos para pagos no-EUR",
      "App ok pero menos moderna que Revolut/N26",
      "Cajeros no-BBVA cobran comisión completa",
    ],
    coverage: "Visa worldwide",
    signupNote: "Apertura cuenta Online BBVA gratis con tarjeta Aqua incluida.",
    officialUrl: "https://www.bbva.es",
    lastVerified: "2026-05-23",
  },
  {
    slug: "vivid",
    name: "Vivid",
    emoji: "💎",
    type: "fintech",
    fxFee: "0% hasta €1000/mes (Standard); luego 0.5%",
    atmFee: "Gratis hasta €200/mes",
    monthlyFee: "Gratis (Standard) · €9.99 (Prime) · €19.99 (Plus)",
    features: [
      "Cashback hasta 25€/mes en categorías",
      "Stocks + crypto integrados",
      "Sub-cuentas (pockets) para presupuesto",
      "Plan familiar disponible",
    ],
    pros: [
      "Cashback agresivo en gasto",
      "Buena alternativa a Revolut para Europa",
    ],
    cons: [
      "Servicio relativamente nuevo (2020)",
      "Cobertura no global como Revolut",
    ],
    coverage: "Visa worldwide",
    signupNote: "Plan gratis suficiente para viajes ocasionales.",
    officialUrl: "https://vivid.money",
    lastVerified: "2026-05-23",
  },
  {
    slug: "openbank-debit",
    name: "Openbank Open Debit",
    emoji: "🟢",
    type: "tradicional",
    fxFee: "0% comisión (1-2% spread)",
    atmFee: "0% cajeros Santander España; 3% otros",
    monthlyFee: "Gratis (sin condiciones)",
    features: [
      "Banco Santander 100% online",
      "IBAN ES con respaldo Santander",
      "App competitiva",
    ],
    pros: [
      "Cuenta bancaria española sin condiciones",
      "Solidez Santander con UX neobanco",
    ],
    cons: [
      "ATM extranjeros con comisión",
      "FX no es 0% real (spread implícito)",
    ],
    coverage: "Visa worldwide",
    signupNote: "Apertura online ~10 min, sin domiciliación obligatoria.",
    officialUrl: "https://www.openbank.es",
    lastVerified: "2026-05-23",
  },
];

export const TRAVEL_CARDS_BY_SLUG: Record<string, TravelCardEntry> = Object.fromEntries(
  TRAVEL_CARDS_CATALOG.map((c) => [c.slug, c]),
);
// SSS456: TRAVEL_CARDS_SLUGS removed — was unused (single static /tarjetas-viaje
// page, no [slug] subroute). Si en futuro se añade /tarjetas-viaje/[slug],
// reañadir export.
