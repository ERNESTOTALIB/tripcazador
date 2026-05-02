"use client";

/**
 * HotelMap — fase BBB2
 *
 * Mapa SVG estático para mostrar la ubicación aproximada de un hotel.
 *
 * Decisión: usamos SVG en vez de Leaflet/Mapbox para evitar dependencias
 * adicionales y porque no necesitamos zoom/pan reales — el objetivo es dar
 * contexto visual de "está en este país/región" + linkar al mapa real de
 * Google/OSM para el usuario que quiera explorar.
 *
 * Si en el futuro se quiere mapa interactivo: extender a leaflet con dynamic
 * import y `ssr: false`.
 */
import Link from "next/link";

interface HotelMapProps {
  hotelName: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  className?: string;
}

export function HotelMap({ hotelName, city, country, lat, lng, className = "" }: HotelMapProps) {
  // Genera un mini-mapa SVG con un pin centrado.
  // Las coords se proyectan a un canvas 400x240 con offsets razonables.
  const W = 400;
  const H = 240;
  const cx = W / 2;
  const cy = H / 2;

  // OSM URL para "ver en mapa real"
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=14`;
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${hotelName} ${city} ${country}`,
  )}`;

  return (
    <div
      className={`rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden ${className}`}
      data-testid="hotel-map"
    >
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          📍 Ubicación
        </h3>
        <span className="text-xs text-gray-500">
          {lat.toFixed(2)}°, {lng.toFixed(2)}°
        </span>
      </div>
      <div className="relative w-full bg-gradient-to-br from-blue-900/40 via-gray-900 to-amber-900/30">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" role="img" aria-label={`Ubicación aproximada de ${hotelName}`}>
          {/* Grid lines decorativas (latitud/longitud abstractas) */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`h-${i}`}
              x1={0}
              x2={W}
              y1={(H / 4) * i}
              y2={(H / 4) * i}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line
              key={`v-${i}`}
              x1={(W / 6) * i}
              x2={(W / 6) * i}
              y1={0}
              y2={H}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          ))}
          {/* "Continente" abstracto detrás del pin */}
          <circle cx={cx} cy={cy} r={70} fill="rgba(251,191,36,0.08)" />
          <circle cx={cx} cy={cy} r={45} fill="rgba(251,191,36,0.12)" />
          {/* Pin */}
          <g transform={`translate(${cx},${cy - 12})`}>
            <circle cx={0} cy={28} r={4} fill="rgba(0,0,0,0.4)" />
            <path
              d="M0 -22 C-12 -22 -18 -12 -18 -2 C-18 8 0 22 0 22 C0 22 18 8 18 -2 C18 -12 12 -22 0 -22 Z"
              fill="#fbbf24"
              stroke="#000"
              strokeWidth={1}
            />
            <circle cx={0} cy={-6} r={5} fill="#000" />
          </g>
          {/* Etiqueta ciudad */}
          <text
            x={cx}
            y={cy + 50}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fill="#fff"
            style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.6)", strokeWidth: 2 }}
          >
            {city}
          </text>
          <text x={cx} y={cy + 68} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.7)">
            {country}
          </text>
        </svg>
      </div>
      <div className="p-4 grid grid-cols-2 gap-2">
        <Link
          href={osmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-sm text-amber-300 hover:text-amber-200 underline underline-offset-4"
          data-testid="hotel-map-osm-link"
        >
          Ver en OpenStreetMap →
        </Link>
        <Link
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-sm text-amber-300 hover:text-amber-200 underline underline-offset-4"
          data-testid="hotel-map-gmaps-link"
        >
          Ver en Google Maps →
        </Link>
      </div>
    </div>
  );
}
