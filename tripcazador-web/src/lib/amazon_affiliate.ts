/**
 * amazon_affiliate.ts — SUPER-SPONSORS (25 may 2026)
 *
 * Wrapper para enlaces Amazon Associates. Inyecta el tag affiliate
 * configurado en NEXT_PUBLIC_AMAZON_TAG si está set.
 *
 * Pure function — testeable y safe a llamar en RSC o cliente.
 * Si el tag no está configurado, devuelve la URL original sin tag
 * (no rompe links — solo se pierde la atribución de comisión).
 *
 * USER ACTION pendiente: Una vez Ernesto se registre como Amazon
 * Associates ES (https://afiliados.amazon.es) recibe un tag formato
 * "xxx-21". Set como NEXT_PUBLIC_AMAZON_TAG en Vercel y todos los
 * links empiezan a generar comisión automáticamente.
 */

export type AmazonLocale = "es" | "com" | "uk" | "de" | "fr" | "it";

const AMAZON_DOMAINS: Record<AmazonLocale, string> = {
  es: "amazon.es",
  com: "amazon.com",
  uk: "amazon.co.uk",
  de: "amazon.de",
  fr: "amazon.fr",
  it: "amazon.it",
};

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG || "";

/**
 * Build Amazon Associates URL desde ASIN o URL completa.
 * Si recibe ASIN, construye URL canonical /dp/ASIN.
 * Si recibe URL, parsea y rebuilda con el tag.
 */
export function buildAmazonLink(
  asinOrUrl: string,
  locale: AmazonLocale = "es",
  tagOverride?: string,
): string {
  const tag = tagOverride || AMAZON_TAG;
  const domain = AMAZON_DOMAINS[locale] || AMAZON_DOMAINS.es;

  // Si parece ASIN (10 chars alphanumerics)
  if (/^[A-Z0-9]{10}$/.test(asinOrUrl)) {
    const base = `https://www.${domain}/dp/${asinOrUrl}`;
    return tag ? `${base}?tag=${tag}&linkCode=ll1` : base;
  }

  // Si es URL completa
  try {
    const u = new URL(asinOrUrl);
    if (tag) u.searchParams.set("tag", tag);
    return u.toString();
  } catch {
    return asinOrUrl;
  }
}

/**
 * Check si el tag está configurado — útil para conditional UI
 * (ej. mostrar disclaimer "afiliado" o no).
 */
export function isAmazonAffiliateConfigured(): boolean {
  return !!AMAZON_TAG;
}

/**
 * Build search URL Amazon con tag.
 */
export function buildAmazonSearchLink(
  query: string,
  locale: AmazonLocale = "es",
): string {
  const domain = AMAZON_DOMAINS[locale] || AMAZON_DOMAINS.es;
  const tag = AMAZON_TAG;
  const base = `https://www.${domain}/s?k=${encodeURIComponent(query)}`;
  return tag ? `${base}&tag=${tag}` : base;
}
