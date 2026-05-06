/**
 * DestinationsMap — SSS80 (May 2026)
 *
 * Server-side rendered SVG map. SIN "use client" — esto significa que el
 * SVG completo viene en el HTML inicial, no depende de hidratación ni JS.
 * Si el usuario tiene JS off o el chunk client falla, el mapa SE VE igual.
 *
 * Hover/active gestionados con CSS pure (`:hover` + `<a>`s nativos),
 * no necesita useState ni useEffect.
 */
import Link from "next/link";

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

function project(lat: number, lon: number): [number, number] {
  const lonClamped = Math.max(-180, Math.min(180, lon));
  const latClamped = Math.max(-60, Math.min(75, lat));
  const x = ((lonClamped + 180) / 360) * MAP_W;
  const phi = (latClamped * Math.PI) / 180;
  const yMerc = Math.log(Math.tan(Math.PI / 4 + phi / 2));
  const yMercMin = Math.log(Math.tan(Math.PI / 4 + (-60 * Math.PI) / 180 / 2));
  const yMercMax = Math.log(Math.tan(Math.PI / 4 + (75 * Math.PI) / 180 / 2));
  const y = MAP_H - ((yMerc - yMercMin) / (yMercMax - yMercMin)) * MAP_H;
  return [x, y];
}

// Continent paths (simplified Mercator-projected ~30 polygons, hand-tuned)
const CONTINENT_PATHS = [
  // Europe
  "M460,150 L490,135 L530,130 L580,135 L610,150 L625,170 L615,195 L590,210 L555,220 L520,215 L490,205 L470,185 L460,165 Z",
  // Africa
  "M490,225 L530,220 L575,235 L605,255 L620,290 L625,325 L615,360 L595,395 L570,420 L540,440 L510,440 L485,420 L470,390 L470,355 L480,320 L490,285 L490,255 Z",
  // Asia
  "M620,140 L660,130 L720,135 L780,145 L830,160 L860,180 L865,210 L850,235 L820,250 L780,255 L740,250 L700,240 L665,225 L640,205 L625,180 Z",
  // Russia/N-Asia
  "M555,100 L640,95 L730,100 L820,105 L890,115 L900,140 L880,160 L850,170 L800,170 L745,165 L685,160 L625,150 L580,135 Z",
  // SE Asia / Indonesia
  "M810,260 L850,265 L880,275 L890,295 L875,310 L845,315 L815,305 L795,285 Z",
  // North America
  "M150,140 L200,125 L260,120 L310,130 L355,150 L370,180 L355,210 L325,235 L290,250 L250,255 L215,245 L180,225 L155,200 L145,170 Z",
  // Central America
  "M260,260 L295,255 L320,265 L335,290 L320,310 L290,315 L265,300 L255,280 Z",
  // South America
  "M310,310 L345,305 L375,315 L395,340 L405,370 L400,405 L385,440 L365,465 L340,475 L315,470 L295,445 L290,410 L295,375 L302,340 Z",
  // Australia
  "M820,395 L860,395 L890,405 L905,425 L900,445 L880,455 L850,455 L820,445 L805,425 L810,410 Z",
  // UK / Ireland
  "M450,135 L470,130 L478,145 L470,160 L455,162 L445,150 Z",
  // Iceland
  "M425,115 L445,113 L450,125 L440,135 L425,132 Z",
  // Madagascar
  "M635,375 L650,372 L658,395 L650,420 L635,420 L630,395 Z",
  // Japan
  "M870,200 L885,195 L895,210 L890,225 L878,228 L870,215 Z",
  // New Zealand
  "M935,455 L955,452 L960,465 L948,478 L932,475 L928,463 Z",
];

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
          </defs>

          {/* Ocean */}
          <rect width={MAP_W} height={MAP_H} fill="#0f172a" />
          <rect width={MAP_W} height={MAP_H} fill="url(#tcgrid)" />

          {/* Continents */}
          <g fill="#475569" stroke="#64748b" strokeWidth="0.7" opacity="0.95">
            {CONTINENT_PATHS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          {/* Pins — server-rendered <a> with native hover (CSS) */}
          {destinations.map((d) => {
            const [x, y] = project(d.lat, d.lon);
            return (
              <a
                key={d.slug}
                href={`/destinos/${d.slug}`}
                aria-label={`${d.name} — ver guía`}
                className="tc-map-pin"
              >
                {/* Pulse outer */}
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
                {/* Hover label (CSS-only display) */}
                <g className="tc-map-tooltip" pointerEvents="none">
                  <rect x={x - 50} y={y - 32} width={100} height={22} rx={4} fill="#0f172a" stroke="#fbbf24" strokeWidth="1" />
                  <text x={x} y={y - 17} textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">
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
