"use client";

/**
 * DestinationsMap — Mapa mundial real con TopoJSON + react-simple-maps.
 *
 * SSS52 (May 2026): BUG FIX — el `<Geographies geography={GEO_URL}>` de
 * react-simple-maps@3.0.0 hacía un fetch interno que fallaba silenciosamente
 * en producción (los pins se renderizaban pero los países no, viéndose pins
 * sobre fondo negro). El fix: hacemos el fetch nosotros con useEffect y
 * pasamos el TopoJSON ya parseado como object al prop `geography`.
 *
 * También añadimos:
 *   - Loading state explícito (no más fondo negro vacío)
 *   - Error state con fallback a leyenda textual
 *   - Color de fondo más claro (slate-800 vs slate-950) para mejor contraste
 *
 * SSS22 (origen): rewrite total con world-atlas/countries-110m.json (107KB CC0).
 *
 * Diseño:
 *   - TopoJSON cargado lazy con useEffect (cache 1 año immutable en CDN)
 *   - Pins clicables con tooltip + animación hover
 *   - Lista textual debajo para SEO + screen readers
 *   - Responsive: el SVG escala con el contenedor
 */
import { useState, useEffect } from "react";
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

// SSS53b: react-simple-maps@3 typing del prop `geography` es restrictiva.
// Usamos `unknown` y casteamos al pasarlo (es un objeto Topology válido).
type TopoJsonData = unknown;

export function DestinationsMap({ destinations }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [topoData, setTopoData] = useState<TopoJsonData>(null);
  const [loadError, setLoadError] = useState(false);

  // SSS52: fetch manual del TopoJSON. Pasamos el objeto al prop `geography`
  // en lugar de la URL — react-simple-maps@3 a veces falla con URLs en prod.
  useEffect(() => {
    let cancelled = false;
    fetch(GEO_URL, { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: TopoJsonData) => {
        if (!cancelled) setTopoData(data);
      })
      .catch((err) => {
        console.error("[DestinationsMap] Failed to load TopoJSON:", err);
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

      <div
        className="relative w-full overflow-hidden rounded-xl bg-slate-800 border border-slate-700"
        style={{ minHeight: "320px" }}
      >
        {!topoData && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Cargando mapa…
            </div>
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-300">
            <div>
              <div className="mb-2 text-amber-400">⚠️ Mapa no disponible</div>
              <p className="text-xs text-slate-400">
                Mira la lista de destinos abajo.
              </p>
            </div>
          </div>
        )}
        {topoData && (
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 160 }}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={topoData as string}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#334155"
                  stroke="#64748b"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#475569" },
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
        )}
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
