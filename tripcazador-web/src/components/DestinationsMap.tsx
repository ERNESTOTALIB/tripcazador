"use client";

/**
 * DestinationsMap — Mapa mundial SVG con pins clicables para cada destino.
 *
 * Diseño:
 *   - SVG en projección equirectangular simplificada (continentes como paths).
 *   - Sin dependencias externas (no Leaflet/Mapbox): bundle ligero y server-safe.
 *   - Pins con tooltip accesible (aria-describedby) + enlace a /destinos/[slug].
 *   - Keyboard navigable (<a> nativos con focus visible).
 *
 * Coordenadas de los pins:
 *   Mantenidas en un objeto (lat, lon) → viewBox [0..1000] x [0..500]
 *   usando projección equirectangular: x = (lon + 180) * 1000/360,
 *   y = (90 - lat) * 500/180.
 */
import { useState } from "react";

export interface DestinationPin {
  slug: string;
  name: string;
  emoji: string;
  lat: number;
  lon: number;
}

const VIEW_W = 1000;
const VIEW_H = 500;

function project(lat: number, lon: number): { cx: number; cy: number } {
  const cx = ((lon + 180) / 360) * VIEW_W;
  const cy = ((90 - lat) / 180) * VIEW_H;
  return { cx, cy };
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
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="img"
          aria-label="Mapa mundial con destinos de TripCazador"
          className="w-full h-auto"
        >
          {/* Fondo océano — gradiente sutil */}
          <defs>
            <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width={VIEW_W} height={VIEW_H} fill="url(#ocean)" />

          {/* Continentes (paths muy simplificados, aspecto decorativo).
              Coordenadas derivadas manualmente — no son geografías precisas,
              pero sí reconocibles como continentes a primera vista. */}
          <g fill="#1e293b" stroke="#334155" strokeWidth="1" aria-hidden="true">
            {/* América Norte */}
            <path d="M 130 80 L 240 70 L 290 110 L 300 180 L 260 230 L 200 260 L 150 230 L 140 160 Z" />
            {/* América Central y Sur */}
            <path d="M 250 270 L 290 280 L 310 340 L 305 420 L 280 470 L 250 450 L 240 380 L 245 310 Z" />
            {/* Europa */}
            <path d="M 460 100 L 540 95 L 560 130 L 545 165 L 510 175 L 470 160 L 455 130 Z" />
            {/* África */}
            <path d="M 470 180 L 560 180 L 580 250 L 560 330 L 520 380 L 485 360 L 465 290 L 462 220 Z" />
            {/* Asia (bloque principal) */}
            <path d="M 565 95 L 780 85 L 830 140 L 850 220 L 790 260 L 720 245 L 640 215 L 585 165 Z" />
            {/* Península arábiga */}
            <path d="M 575 195 L 620 195 L 635 235 L 615 265 L 580 250 Z" />
            {/* Subcontinente indio */}
            <path d="M 665 225 L 710 225 L 720 280 L 685 295 L 670 265 Z" />
            {/* Sudeste asiático */}
            <path d="M 745 250 L 810 255 L 830 300 L 790 320 L 755 295 Z" />
            {/* Australia */}
            <path d="M 800 340 L 890 345 L 910 390 L 875 415 L 820 400 L 805 370 Z" />
            {/* Islandia (isla pequeña, ayuda a orientar) */}
            <circle cx="470" cy="80" r="8" />
          </g>

          {/* Glow sutil bajo los pins */}
          {destinations.map((d) => {
            const { cx, cy } = project(d.lat, d.lon);
            return (
              <circle
                key={`glow-${d.slug}`}
                cx={cx}
                cy={cy}
                r={14}
                fill="url(#pinGlow)"
                aria-hidden="true"
              />
            );
          })}

          {/* Pins clicables */}
          {destinations.map((d) => {
            const { cx, cy } = project(d.lat, d.lon);
            const isActive = active === d.slug;
            return (
              <g key={d.slug}>
                <a
                  href={`/destinos/${d.slug}`}
                  aria-label={`Ver guía de ${d.name}`}
                  onMouseEnter={() => setActive(d.slug)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(d.slug)}
                  onBlur={() => setActive(null)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isActive ? 8 : 6}
                    fill="#f59e0b"
                    stroke="#0b1120"
                    strokeWidth={2}
                    className="cursor-pointer transition-all"
                  >
                    <title>{`${d.emoji} ${d.name}`}</title>
                  </circle>
                </a>
                {isActive && (
                  <g aria-hidden="true" pointerEvents="none">
                    <rect
                      x={cx + 10}
                      y={cy - 24}
                      width={Math.max(90, d.name.length * 8 + 28)}
                      height={22}
                      rx={4}
                      ry={4}
                      fill="#111827"
                      stroke="#fbbf24"
                      strokeWidth={1}
                    />
                    <text
                      x={cx + 18}
                      y={cy - 9}
                      fill="#fef3c7"
                      fontSize={12}
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                    >
                      {d.emoji} {d.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Leyenda accesible también en texto — útil para screen readers y SEO */}
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
