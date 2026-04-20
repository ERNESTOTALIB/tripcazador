/**
 * TripCazador — DestinosMap helpers (puros, sin Leaflet)
 *
 * Extraídos a este módulo aparte para poder testearlos con vitest
 * `environment: "node"` — importar DestinosMap.tsx transitivamente carga
 * leaflet/dist/leaflet-src.js que toca `window` al parsear, y revienta el
 * import antes de que corran los tests.
 */

import type { Deal } from "@/lib/api";

export interface Cluster {
  key: string;
  lat: number;
  lon: number;
  city: string;
  country: string;
  minPrice: number;
  count: number;
}

/** Agrupa deals por código de destino y conserva el precio más bajo. */
export function clusterByDestination(deals: Deal[]): Cluster[] {
  const map = new Map<string, Cluster>();
  for (const d of deals) {
    if (typeof d.lat !== "number" || typeof d.lon !== "number") continue;
    const key = d.destination || `${d.lat.toFixed(2)},${d.lon.toFixed(2)}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        lat: d.lat,
        lon: d.lon,
        city: d.city_to || d.destination,
        country: d.country_to || "",
        minPrice: d.price_eur,
        count: 1,
      });
    } else {
      existing.count += 1;
      if (d.price_eur < existing.minPrice) existing.minPrice = d.price_eur;
    }
  }
  return Array.from(map.values()).sort((a, b) => a.minPrice - b.minPrice);
}

/** Color del marker según precio relativo a p33 / p66 de la distribución. */
export function priceColor(price: number, p33: number, p66: number): string {
  if (price <= p33) return "#10b981"; // emerald-500
  if (price <= p66) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}
