/**
 * outbound_link.ts — SUPER-SPONSORS (25 may 2026)
 *
 * Wrapper para enlaces outbound. Si SKIMLINKS_SITE_ID está set, rutea
 * por go.skimresources.com para monetizar links a marcas afiliadas
 * (Booking, Expedia, BestBuy, etc.) sin requerir cada programa manual.
 *
 * Skimlinks tiene 20.000+ retailers preset — paga ~75% comisión que
 * recibe de cada compra. ROI inmediato para sitios con tráfico outbound
 * sustantivo.
 *
 * Pure function. Llamable en RSC + client. Pasa-thru si SKIMLINKS no
 * configurado.
 *
 * USER ACTION: registrar en skimlinks.com → obtener site_id → set como
 * NEXT_PUBLIC_SKIMLINKS_ID en Vercel. Aprobación automática.
 *
 * Sovrn Commerce (ex-VigLink) es alternativa con interfaz similar.
 */

const SKIMLINKS_ID = process.env.NEXT_PUBLIC_SKIMLINKS_ID || "";

/** Dominios que YA tienen programa afiliado directo — no rutear por Skimlinks */
const DIRECT_AFFILIATE_DOMAINS = new Set<string>([
  // Travelpayouts marker 513030
  "aviasales.com",
  "skyscanner.com",
  "ryanair.com",
  // Booking AID 714734
  "booking.com",
  // Direct affiliate programs already configured
  "holafly.com",
  "heymondo.com",
  "getyourguide.com",
  "parclick.com",
  // Amazon Associates (uses tag param)
  "amazon.es",
  "amazon.com",
  "amazon.co.uk",
  "amazon.de",
  "amazon.fr",
  "amazon.it",
  // Self
  "tripcazador.com",
]);

/** Dominios excluidos de Skimlinks por política (autoridad/UGC/government) */
const SKIMLINKS_EXCLUDED_DOMAINS = new Set<string>([
  "wikipedia.org",
  "wikimedia.org",
  "gov",
  ".gov.uk",
  ".gov.es",
  "europa.eu",
  "iata.org",
]);

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isDirectAffiliateDomain(host: string): boolean {
  const list = Array.from(DIRECT_AFFILIATE_DOMAINS);
  for (let i = 0; i < list.length; i++) {
    const d = list[i];
    if (host === d || host.endsWith(`.${d}`)) return true;
  }
  return false;
}

function isExcludedFromSkimlinks(host: string): boolean {
  const list = Array.from(SKIMLINKS_EXCLUDED_DOMAINS);
  for (let i = 0; i < list.length; i++) {
    const d = list[i];
    if (host === d || host.endsWith(d)) return true;
  }
  return false;
}

/**
 * Wrap an outbound URL. Returns the URL unchanged if:
 *  - SKIMLINKS_ID not configured
 *  - host is a direct affiliate domain (Amazon, Booking, etc.)
 *  - host is excluded (Wikipedia, gov, etc.)
 *  - URL is invalid
 *
 * Otherwise wraps via Skimlinks redirect.
 */
export function wrapOutboundLink(url: string): string {
  if (!url) return url;
  if (!SKIMLINKS_ID) return url;

  const host = getHostname(url);
  if (!host) return url;

  if (isDirectAffiliateDomain(host)) return url;
  if (isExcludedFromSkimlinks(host)) return url;

  // Skimlinks REST redirect format
  return `https://go.skimresources.com/?id=${SKIMLINKS_ID}&xs=1&url=${encodeURIComponent(url)}`;
}

/** Test-friendly helper — does NOT use env, takes explicit configured flag. */
export function wrapOutboundLinkWith(
  url: string,
  options: { skimlinksId?: string },
): string {
  if (!url || !options.skimlinksId) return url;
  const host = getHostname(url);
  if (!host) return url;
  if (isDirectAffiliateDomain(host)) return url;
  if (isExcludedFromSkimlinks(host)) return url;
  return `https://go.skimresources.com/?id=${options.skimlinksId}&xs=1&url=${encodeURIComponent(url)}`;
}

/** Useful for showing/hiding affiliate disclaimer */
export function isSkimlinksConfigured(): boolean {
  return !!SKIMLINKS_ID;
}
