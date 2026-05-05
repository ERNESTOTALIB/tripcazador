/**
 * dest_coords.ts — fase SSS74 (May 2026)
 *
 * Coordenadas geográficas formateadas estilo magazine editorial
 * (e.g. "41°24′ N · 02°10′ E") para usar en el top strip de los
 * carousel slides de Instagram (estilo Barcelona Canva v3).
 *
 * Si el deal tiene `lat`/`lon` los usamos. Si no, fallback al catálogo
 * curado por IATA / nombre ciudad.
 */

interface DegMin {
  d: number;
  m: number;
  hemi: string;
}

function toDegMin(value: number, posHemi: string, negHemi: string): DegMin {
  const abs = Math.abs(value);
  const d = Math.floor(abs);
  const m = Math.round((abs - d) * 60);
  return { d, m, hemi: value >= 0 ? posHemi : negHemi };
}

export function formatCoord(lat?: number, lon?: number): string | null {
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const la = toDegMin(lat, "N", "S");
  const lo = toDegMin(lon, "E", "W");
  return `${la.d}°${String(la.m).padStart(2, "0")}′ ${la.hemi} · ${lo.d}°${String(lo.m).padStart(2, "0")}′ ${lo.hemi}`;
}

/**
 * Lookup coords por slug o IATA. Cubrimos los destinos más usados
 * en deals + variantes de nombre.
 */
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  // Europa
  barcelona: { lat: 41.4, lon: 2.17 },
  bcn: { lat: 41.4, lon: 2.17 },
  madrid: { lat: 40.42, lon: -3.7 },
  mad: { lat: 40.42, lon: -3.7 },
  lisboa: { lat: 38.72, lon: -9.14 },
  lis: { lat: 38.72, lon: -9.14 },
  porto: { lat: 41.16, lon: -8.61 },
  paris: { lat: 48.86, lon: 2.35 },
  cdg: { lat: 48.86, lon: 2.35 },
  ory: { lat: 48.86, lon: 2.35 },
  roma: { lat: 41.9, lon: 12.5 },
  fco: { lat: 41.9, lon: 12.5 },
  milan: { lat: 45.46, lon: 9.19 },
  mxp: { lat: 45.46, lon: 9.19 },
  amsterdam: { lat: 52.37, lon: 4.9 },
  ams: { lat: 52.37, lon: 4.9 },
  berlin: { lat: 52.52, lon: 13.4 },
  ber: { lat: 52.52, lon: 13.4 },
  praga: { lat: 50.08, lon: 14.43 },
  prg: { lat: 50.08, lon: 14.43 },
  estambul: { lat: 41.01, lon: 28.98 },
  ist: { lat: 41.01, lon: 28.98 },
  londres: { lat: 51.5, lon: -0.13 },
  lhr: { lat: 51.5, lon: -0.13 },
  reikiavik: { lat: 64.13, lon: -21.94 },
  kef: { lat: 64.13, lon: -21.94 },
  munich: { lat: 48.14, lon: 11.58 },
  muc: { lat: 48.14, lon: 11.58 },
  frankfurt: { lat: 50.11, lon: 8.68 },
  fra: { lat: 50.11, lon: 8.68 },
  fráncfort: { lat: 50.11, lon: 8.68 },
  zurich: { lat: 47.37, lon: 8.55 },
  zrh: { lat: 47.37, lon: 8.55 },
  basilea: { lat: 47.56, lon: 7.59 },
  bsl: { lat: 47.56, lon: 7.59 },

  // España
  palma: { lat: 39.57, lon: 2.65 },
  pmi: { lat: 39.57, lon: 2.65 },
  malaga: { lat: 36.72, lon: -4.42 },
  agp: { lat: 36.72, lon: -4.42 },
  valencia: { lat: 39.47, lon: -0.38 },
  vlc: { lat: 39.47, lon: -0.38 },
  sevilla: { lat: 37.39, lon: -5.99 },
  svq: { lat: 37.39, lon: -5.99 },

  // Marrakech / África Norte
  marrakech: { lat: 31.63, lon: -8 },
  rak: { lat: 31.63, lon: -8 },
  cairo: { lat: 30.04, lon: 31.24 },
  cai: { lat: 30.04, lon: 31.24 },

  // Asia
  bangkok: { lat: 13.75, lon: 100.5 },
  bkk: { lat: 13.75, lon: 100.5 },
  bali: { lat: -8.65, lon: 115.22 },
  dps: { lat: -8.65, lon: 115.22 },
  tokio: { lat: 35.68, lon: 139.69 },
  tokyo: { lat: 35.68, lon: 139.69 },
  nrt: { lat: 35.68, lon: 139.69 },
  hnd: { lat: 35.68, lon: 139.69 },
  seul: { lat: 37.57, lon: 126.98 },
  icn: { lat: 37.57, lon: 126.98 },
  singapur: { lat: 1.35, lon: 103.82 },
  sin: { lat: 1.35, lon: 103.82 },
  maldivas: { lat: 4.18, lon: 73.51 },
  mle: { lat: 4.18, lon: 73.51 },

  // Norteamérica
  nueva_york: { lat: 40.71, lon: -74.01 },
  jfk: { lat: 40.71, lon: -74.01 },
  miami: { lat: 25.77, lon: -80.19 },
  mia: { lat: 25.77, lon: -80.19 },
  los_angeles: { lat: 34.05, lon: -118.24 },
  lax: { lat: 34.05, lon: -118.24 },

  // Sudamérica
  buenos_aires: { lat: -34.61, lon: -58.38 },
  eze: { lat: -34.61, lon: -58.38 },
  rio: { lat: -22.91, lon: -43.17 },
  gig: { lat: -22.91, lon: -43.17 },
  cdmx: { lat: 19.43, lon: -99.13 },
  mex: { lat: 19.43, lon: -99.13 },
  cancun: { lat: 21.16, lon: -86.85 },
  cun: { lat: 21.16, lon: -86.85 },
};

export function lookupCoord(input?: string | null): { lat: number; lon: number } | null {
  if (!input) return null;
  const slug = input.toLowerCase().trim().replace(/\s+/g, "_");
  const direct = CITY_COORDS[slug];
  if (direct) return direct;
  const iata = input.trim().toLowerCase();
  if (iata.length === 3 && CITY_COORDS[iata]) return CITY_COORDS[iata];
  // Quitar acentos y reintentar
  const norm = slug
    .replace(/é/g, "e").replace(/á/g, "a").replace(/í/g, "i")
    .replace(/ó/g, "o").replace(/ú/g, "u").replace(/ñ/g, "n");
  if (CITY_COORDS[norm]) return CITY_COORDS[norm];
  return null;
}

/**
 * Devuelve coord formateada para un deal. Prioriza lat/lon del deal,
 * luego catálogo por destino/ciudad/IATA. Devuelve null si no hay nada.
 */
export function getCoordForDeal(opts: {
  lat?: number;
  lon?: number;
  destination?: string;
  cityTo?: string;
}): string | null {
  const direct = formatCoord(opts.lat, opts.lon);
  if (direct) return direct;
  const fromCatalog =
    lookupCoord(opts.destination) || lookupCoord(opts.cityTo);
  if (fromCatalog) return formatCoord(fromCatalog.lat, fromCatalog.lon);
  return null;
}
