/**
 * DestinationsMap — SSS144 (11 may 2026)
 *
 * Server-side rendered SVG world map using REAL TopoJSON data from
 * public/world-110m.json (Natural Earth 110m, ~108KB on disk).
 *
 * Why SSS144 rewrite: SSS80 used hand-drawn 14 polygons that looked
 * like random blobs, not continents. Now we use d3-geo Mercator
 * projection + topojson-client.feature() to render the real ~250
 * countries with proper coastlines.
 *
 * No "use client" → the SVG is fully rendered in the server response,
 * no hydration, no JS needed. Pins are <a> elements with CSS-only
 * hover/focus tooltips.
 *
 * The same Mercator projection is used both for country paths and for
 * pin placement, so coordinates line up exactly.
 */
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { geoPath, geoMercator } from "d3-geo";
import { feature } from "topojson-client";

export interface DestinationPin {
  slug: string;
  name: string;
  emoji: string;
  lat: number;
  lon: number;
}

interface Props {
  destinations: DestinationPin[];
}

const MAP_W = 1000;
const MAP_H = 500;

// ──────────────────────────── projection ────────────────────────────
// Mercator with scale + translate tuned so the full inhabited world
// (lat -55..+72, lon -170..+180) fills the 1000×500 canvas, with
// Antarctica clipped out (we shift the equator down a bit to crop the
// extreme south where Mercator distortion explodes).
const projection = geoMercator()
  .scale(155)
  .center([10, 30])
  .translate([MAP_W / 2, MAP_H / 2])
  .precision(0.5);

const pathGen = geoPath(projection);

// ─────────────────────────── world data ─────────────────────────────
// Loaded once at module init (server-only). The path generator + paths
// array are computed once and reused for every render of every request.
type TopoData = {
  type: "Topology";
  objects: { countries: unknown };
  arcs: unknown;
  transform?: unknown;
};

const COUNTRY_PATHS: string[] = (() => {
  try {
    const topoPath = path.join(process.cwd(), "public", "world-110m.json");
    const raw = fs.readFileSync(topoPath, "utf-8");
    const topo = JSON.parse(raw) as TopoData;
    // topojson-client's feature() returns a FeatureCollection for a
    // GeometryCollection object.
    // topojson-client.feature() returns a FeatureCollection when given
    // a GeometryCollection. Types are loose here — we cast minimally.
    const fc = feature(
      topo as never,
      topo.objects.countries as never,
    ) as unknown as { features: Array<Parameters<typeof pathGen>[0]> };
    return fc.features
      .map((f) => pathGen(f) || "")
      .filter((d) => d.length > 0);
  } catch (err) {
    // Defensive: if the file is missing or corrupt, fall back to empty
    // map (just ocean + pins). Logged server-side only.
    console.warn("[DestinationsMap] world-110m.json load failed:", err);
    return [];
  }
})();

function projectPin(lat: number, lon: number): [number, number] {
  const pt = projection([lon, lat]);
  if (!pt || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) {
    return [MAP_W / 2, MAP_H / 2];
  }
  return [pt[0], pt[1]];
}

// ─────────────────────────── component ──────────────────────────────
export function DestinationsMap({ destinations }: Props) {
  return (
    <div className="rounded-2xl border border-gray-800 p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Mapa de destinos</h2>
          <p className="text-sm text-gray-400">
            {destinations.length} destinos con guía activa — pulsa un pin para abrir su página.
          </p>
        </div>
      </div>

      <div className="relative w-full rounded-xl bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700 overflow-hidden">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
          role="img"
          aria-label="Mapa mundial con destinos disponibles"
          style={{ display: "block" }}
        >
          <defs>
            <pattern id="tcgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.4" />
            </pattern>
            <radialGradient id="tcocean" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0b1220" />
            </radialGradient>
          </defs>

          {/* Ocean + subtle grid */}
          <rect width={MAP_W} height={MAP_H} fill="url(#tcocean)" />
          <rect width={MAP_W} height={MAP_H} fill="url(#tcgrid)" />

          {/* Continents: real Natural Earth 110m coastlines projected with d3 Mercator */}
          <g
            fill="#334155"
            stroke="#475569"
            strokeWidth="0.4"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.96"
          >
            {COUNTRY_PATHS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          {/* Pins — server-rendered <a> with native CSS hover */}
          {destinations.map((d) => {
            const [x, y] = projectPin(d.lat, d.lon);
            return (
              <a
                key={d.slug}
                href={`/destinos/${d.slug}`}
                aria-label={`${d.name} — ver guía`}
                className="tc-map-pin"
              >
                {/* Pulse ring */}
                <circle cx={x} cy={y} r={10} fill="#fbbf24" opacity={0.18}>
                  <animate attributeName="r" values="6;14;6" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite" />
                </circle>
                {/* Solid dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={5.5}
                  fill="#fbbf24"
                  stroke="#0f172a"
                  strokeWidth="1.8"
                  className="tc-map-dot"
                />
                {/* Tooltip — CSS-only display */}
                <g className="tc-map-tooltip" pointerEvents="none">
                  <rect
                    x={x - 60}
                    y={y - 34}
                    width={120}
                    height={22}
                    rx={4}
                    fill="#0f172a"
                    stroke="#fbbf24"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={y - 19}
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {d.emoji} {d.name}
                  </text>
                </g>
              </a>
            );
          })}
        </svg>
      </div>

      {/* CSS-only hover/focus — no JS needed */}
      <style>{`
        .tc-map-pin .tc-map-dot { transition: r 0.15s ease, fill 0.15s ease; cursor: pointer; }
        .tc-map-pin:hover .tc-map-dot, .tc-map-pin:focus .tc-map-dot { r: 7.5; fill: #fcd34d; }
        .tc-map-pin .tc-map-tooltip { opacity: 0; transition: opacity 0.15s ease; }
        .tc-map-pin:hover .tc-map-tooltip, .tc-map-pin:focus .tc-map-tooltip { opacity: 1; }
        .tc-map-pin:focus { outline: none; }
      `}</style>

      {/* Lista debajo del mapa */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {destinations.map((d) => (
          <Link
            key={d.slug}
            href={`/destinos/${d.slug}`}
            className="text-sm text-gray-300 hover:text-amber-400 hover:bg-slate-800/50 rounded px-2 py-1 transition flex items-center gap-2"
          >
            <span aria-hidden="true">{d.emoji}</span>
            <span>{d.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
