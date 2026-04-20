"use client";

/**
 * TripCazador — DestinosMap
 *
 * Mapa interactivo de precios por destino usando react-leaflet. Se muestra
 * al final de /destinos para dar una vista "qué vuelos baratos hay ahora
 * mismo en el mundo" y completar la experiencia estilo Skyscanner Map.
 *
 * Diseño:
 *   · Client-only (Leaflet toca `window` en import → se carga con next/dynamic
 *     desde el server component /destinos; aquí asumimos que ya estamos en el
 *     cliente).
 *   · Agrupamos deals por `destination` (IATA) para no acumular 200 markers
 *     en la misma coord; muestra el precio mínimo de la ciudad.
 *   · Fondo OpenStreetMap (tiles ya permitidas en CSP).
 *   · Sin tracking, sin API key, sin CLS (altura fija con skeleton).
 *
 * Nota técnica importante: next/dynamic con `ssr: false` es la única forma
 * estable de cargar Leaflet en Next.js 14. Las *.css de Leaflet se importan
 * aquí y las inyecta webpack; tailwind no las toca.
 */

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Deal } from "@/lib/api";
import { clusterByDestination, priceColor } from "./DestinosMap.helpers";

// Re-export los helpers puros (desde .helpers) para preservar el API público
// histórico por si otros módulos los importan desde aquí.
export { clusterByDestination, priceColor } from "./DestinosMap.helpers";
export type { Cluster } from "./DestinosMap.helpers";

interface DestinosMapProps {
  /** Lista de deals a plotear — recibida del server component /destinos. */
  deals: Deal[];
}

export default function DestinosMap({ deals }: DestinosMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const clusters = useMemo(() => clusterByDestination(deals), [deals]);
  const { p33, p66 } = useMemo(() => {
    const prices = clusters.map((c) => c.minPrice).sort((a, b) => a - b);
    if (prices.length === 0) return { p33: 0, p66: 0 };
    const idx33 = Math.floor(prices.length * 0.33);
    const idx66 = Math.floor(prices.length * 0.66);
    return { p33: prices[idx33] ?? prices[0], p66: prices[idx66] ?? prices[prices.length - 1] };
  }, [clusters]);

  if (!mounted) {
    return (
      <div className="h-[420px] w-full rounded-2xl border border-gray-800 bg-gray-900/40 flex items-center justify-center text-gray-500 text-sm">
        Cargando mapa…
      </div>
    );
  }
  if (clusters.length === 0) {
    return (
      <div className="h-[420px] w-full rounded-2xl border border-gray-800 bg-gray-900/40 flex items-center justify-center text-gray-500 text-sm">
        No hay deals con coordenadas para plotear.
      </div>
    );
  }

  return (
    <div className="relative h-[420px] w-full rounded-2xl overflow-hidden border border-gray-800">
      <MapContainer
        center={[20, 10] as [number, number]}
        zoom={2}
        scrollWheelZoom={false}
        worldCopyJump
        style={{ height: "100%", width: "100%", background: "#0b1220" }}
        aria-label="Mapa de destinos con precios"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {clusters.map((c) => (
          <CircleMarker
            key={c.key}
            center={[c.lat, c.lon] as [number, number]}
            radius={6 + Math.min(8, c.count)}
            pathOptions={{
              color: priceColor(c.minPrice, p33, p66),
              fillColor: priceColor(c.minPrice, p33, p66),
              fillOpacity: 0.6,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ fontFamily: "system-ui, sans-serif" }}>
                <strong>
                  {c.city}
                  {c.country && `, ${c.country}`}
                </strong>
                <br />
                Desde <strong>{Math.round(c.minPrice)} €</strong>
                {c.count > 1 && <> · {c.count} ofertas</>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[400] bg-gray-900/80 backdrop-blur rounded-lg px-3 py-2 text-xs text-gray-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Barato
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-2" />
          Medio
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 ml-2" />
          Caro
        </div>
      </div>
    </div>
  );
}
