"use client";

/**
 * DestinationsMap — Mapa mundial real con TopoJSON + react-simple-maps.
 *
 * SSS22 (May 2026): rewrite total. Antes usaba paths SVG dibujados a mano
 * que parecían polígonos abstractos. Ahora usa world-atlas/countries-110m.json
 * (107KB, CC0) renderizado vía react-simple-maps con projección Mercator.
 *
 * Diseño:
 *   - TopoJSON cargado lazy desde /world-110m.json (cache 1 año immutable).
 *   - Pins clicables con tooltip + animación hover.
 *   - Lista textual debajo para SEO + screen readers.
 *   - Responsive: el SVG escala con el contenedor.
 */
import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

const GEO_URL = "/world-110m.json";

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

export function DestinationsMap({ destinations }: Props) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="glass rounded-2xl border border-gray-800 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Mapa de destinos</h2>
          <p className="text-sm text-gray-400">
            {destinations.length} destinos con guía activa — pulsa un pin para abrir su página.
          </p>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-800">
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 160 }}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#273548" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {destinations.map((d) => {
            const isActive = active === d.slug;
            return (
              <Marker key={d.slug} coordinates={[d.lon, d.lat]}>
                <a
                  href={`/destinos/${d.slug}`}
                  aria-label={`Ver guía de ${d.name}`}
                  onMouseEnter={() => setActive(d.slug)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(d.slug)}
                  onBlur={() => setActive(null)}
                >
                  {/* Glow halo */}
                  <circle
                    r={isActive ? 14 : 10}
                    fill="#fbbf24"
                    fillOpacity={0.18}
                    aria-hidden="true"
                  />
                  {/* Pin */}
                  <circle
                    r={isActive ? 5 : 4}
                    fill="#f59e0b"
                    stroke="#0b1120"
                    strokeWidth={1.5}
                    style={{ cursor: "pointer", transition: "all 0.2s" }}
                  >
                    <title>{`${d.emoji} ${d.name}`}</title>
                  </circle>
                  {isActive && (
                    <g aria-hidden="true" pointerEvents="none">
                      <rect
                        x={8}
                        y={-22}
                        width={Math.max(70, d.name.length * 6.5 + 24)}
                        height={18}
                        rx={3}
                        ry={3}
                        fill="#111827"
                        stroke="#fbbf24"
                        strokeWidth={1}
                      />
                      <text
                        x={14}
                        y={-9}
                        fill="#fef3c7"
                        fontSize={10}
                        fontFamily="ui-sans-serif, system-ui, sans-serif"
                      >
                        {d.emoji} {d.name}
                      </text>
                    </g>
                  )}
                </a>
              </Marker>
            );
          })}
        </ComposableMap>
      </div>

      {/* Leyenda accesible — útil para screen readers + SEO */}
      <ul className="mt-4 flex flex-wrap gap-2 list-none p-0 m-0" aria-label="Listado de destinos del mapa">
        {destinations.map((d) => (
          <li key={d.slug}>
            <a
              href={`/destinos/${d.slug}`}
              className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-slate-900/60 px-3 py-1 text-xs text-gray-200 hover:border-amber-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <span aria-hidden="true">{d.emoji}</span>
              <span>{d.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
