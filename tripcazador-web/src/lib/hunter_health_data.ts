/**
 * hunter_health_data.ts — fase qqq4
 *
 * Re-export the FALLBACK_CATALOG read-only para usar en /api/admin/hunters-health
 * sin importar el archivo entero (que tiene side-effects en build con
 * applyFilter / sortByFeaturedRanking que pueden fallar en runtime edge).
 *
 * Patrón: importa el array, no las funciones.
 */

import type { Deal } from "./api";

// Re-import desde seed_diversifier — TS resolve estructural verifica forma
type CatalogTemplate = Partial<Deal> & { _key: string; airline_code?: string };

// Acceso al array via dynamic import — workaround para evitar circular deps
import * as seed from "./seed_diversifier";

// FALLBACK_CATALOG es interna (no exported) en seed_diversifier — usamos
// función helper que devuelve los templates como Deal[].
// Para health endpoint necesitamos el array crudo de templates.

// Workaround: re-construct from public diversifyDeals call
export const FALLBACK_CATALOG: CatalogTemplate[] = (() => {
  // diversifyDeals con array vacío devuelve TODO el FALLBACK_CATALOG ya construido
  const all = seed.diversifyDeals([]);
  // Mapeamos a CatalogTemplate-like (perdemos _key pero ganamos campos públicos)
  return all.map((d) => ({
    _key: `${d.origin}-${d.destination}`,
    type: d.type,
    headline: d.headline,
    origin: d.origin,
    destination: d.destination,
    city_from: d.city_from,
    city_to: d.city_to,
    country_to: d.country_to,
    region: d.region,
    price_eur: d.price_eur,
    savings_pct: d.savings_pct,
    savings_eur: d.savings_eur,
    nights: d.nights,
    date_out: d.date_out,
    date_ret: d.date_ret,
    classification: d.classification,
    cabin: d.cabin,
    airline_name: d.airline_name,
    stops: d.stops,
    duration_min: d.duration_min,
    score: d.score,
  }));
})();
