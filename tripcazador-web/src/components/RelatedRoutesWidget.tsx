/**
 * RelatedRoutesWidget — TTT07 (May 2026).
 *
 * Pure SEO internal-linking component. Dado un origen y/o destino,
 * sugiere 4-6 rutas relacionadas (mismo origin, mismo destination, o
 * país/región vecino) hacia /vuelos/{origen-destino}. Mejora PageRank
 * interno + dwell time + reduce bounce.
 *
 * Server component (no hooks, no client JS). Se renderiza con un set
 * curado de rutas top que sabemos que existen como página pareada
 * (vuelos/[ruta]/page.tsx TOP_ROUTES — 50 rutas).
 */

import Link from "next/link";

interface Props {
  origin?: string;     // IATA u origen-slug ("madrid")
  destination?: string; // IATA u destino-slug ("tokio")
  /** Título personalizable del widget. */
  heading?: string;
  /** Excluye una ruta concreta (para evitar mostrarse a sí misma). */
  excludeSlug?: string;
  /** Cantidad de rutas a mostrar. */
  limit?: number;
}

/**
 * Catálogo de las 50 rutas pareadas que existen como /vuelos/{slug}.
 * Mantén sincronizado con TOP_ROUTES de vuelos/[ruta]/page.tsx +
 * sitemap.ts TOP_ROUTE_SLUGS.
 */
const ALL_ROUTES = [
  // Short-haul ES → EU
  "madrid-lisboa", "madrid-londres", "barcelona-roma", "madrid-paris",
  "barcelona-londres", "madrid-roma", "barcelona-paris", "madrid-amsterdam",
  "madrid-berlin", "barcelona-amsterdam",
  // Long-haul ES → mundo
  "madrid-nueva-york", "madrid-tokio", "madrid-bangkok", "madrid-buenos-aires",
  "barcelona-nueva-york", "madrid-cancun", "madrid-bali", "madrid-cuba",
  "barcelona-tokio", "madrid-marrakech",
  // ES regional emerging (TTT02)
  "sevilla-roma", "sevilla-londres", "valencia-londres", "valencia-roma",
  "bilbao-paris", "bilbao-londres", "malaga-londres", "malaga-paris",
  "alicante-londres", "palma-zurich",
  // EU emerging
  "madrid-praga", "madrid-budapest", "madrid-viena", "madrid-dublin",
  "madrid-copenhague", "barcelona-praga", "barcelona-berlin", "barcelona-viena",
  "barcelona-dublin", "barcelona-atenas",
  // Cross-EU populars
  "paris-roma", "londres-amsterdam", "amsterdam-berlin", "viena-praga",
  "lisboa-paris", "roma-atenas", "berlin-paris", "milan-londres",
  "zurich-londres", "amsterdam-roma",
];

function parseSlug(slug: string): { from: string; to: string } {
  const dashIdx = slug.indexOf("-");
  if (dashIdx === -1) return { from: slug, to: "" };
  return { from: slug.slice(0, dashIdx), to: slug.slice(dashIdx + 1) };
}

/** Match origin / destination contra la slug heurísticamente.
 * Acepta IATA y slug-name (lowercased). */
function tokenMatches(token: string | undefined, slugSide: string): boolean {
  if (!token) return false;
  const t = token.toLowerCase();
  // IATA → mapeo simple a city slug
  const IATA_TO_SLUG: Record<string, string> = {
    mad: "madrid", bcn: "barcelona", agp: "malaga", svq: "sevilla",
    vlc: "valencia", bio: "bilbao", alc: "alicante", pmi: "palma",
    cdg: "paris", ory: "paris", lhr: "londres", lgw: "londres",
    fco: "roma", cia: "roma", mxp: "milan", ams: "amsterdam",
    ber: "berlin", txl: "berlin", vie: "viena", prg: "praga",
    bud: "budapest", dub: "dublin", cph: "copenhague", ath: "atenas",
    lis: "lisboa", zrh: "zurich",
    jfk: "nueva-york", ewr: "nueva-york", nrt: "tokio", hnd: "tokio",
    bkk: "bangkok", dps: "bali", eze: "buenos-aires", aep: "buenos-aires",
    cun: "cancun", hav: "cuba", rak: "marrakech",
  };
  const slug = IATA_TO_SLUG[t] || t;
  return slugSide === slug;
}

export function RelatedRoutesWidget({
  origin,
  destination,
  heading = "Rutas similares populares",
  excludeSlug,
  limit = 6,
}: Props) {
  // Score: misma origin + dest pareja = 0 (excluido si excludeSlug match).
  // Misma origin: +3, mismo destination: +3, ambos: +6 (la propia ruta).
  // Sino, fallback a alfabético.
  const scored = ALL_ROUTES
    .filter((slug) => slug !== excludeSlug)
    .map((slug) => {
      const { from, to } = parseSlug(slug);
      let score = 0;
      if (tokenMatches(origin, from)) score += 3;
      if (tokenMatches(destination, to)) score += 3;
      // Cross-match: orig de la ruta es destination del input → ruta inversa
      if (tokenMatches(destination, from)) score += 1;
      if (tokenMatches(origin, to)) score += 1;
      return { slug, score };
    })
    .sort((a, b) => b.score - a.score)
    .filter((r) => r.score > 0 || origin === undefined && destination === undefined);

  // Si no hay match con score>0, fallback a primeras N rutas top.
  const final = (scored.length > 0
    ? scored
    : ALL_ROUTES.filter((s) => s !== excludeSlug).slice(0, limit).map((slug) => ({ slug, score: 0 }))
  ).slice(0, limit);

  if (final.length === 0) return null;

  return (
    <aside
      aria-labelledby="related-routes-heading"
      className="my-10 rounded-xl border border-gray-800 bg-gray-900/60 p-5"
    >
      <h2
        id="related-routes-heading"
        className="text-base font-semibold text-amber-300 mb-3"
      >
        {heading}
      </h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        {final.map(({ slug }) => {
          const { from, to } = parseSlug(slug);
          const fromLabel = from.charAt(0).toUpperCase() + from.slice(1).replace(/-/g, " ");
          const toLabel = to.charAt(0).toUpperCase() + to.slice(1).replace(/-/g, " ");
          return (
            <li key={slug}>
              <Link
                href={`/vuelos/${slug}`}
                className="block px-3 py-2 rounded-lg bg-gray-800/60 hover:bg-amber-500/10 hover:text-amber-300 text-gray-300 border border-transparent hover:border-amber-500/30 transition-colors"
                prefetch={false}
              >
                {fromLabel} → {toLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default RelatedRoutesWidget;
