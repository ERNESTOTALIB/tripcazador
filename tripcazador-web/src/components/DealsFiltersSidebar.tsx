"use client";

/**
 * TripCazador — DealsFiltersSidebar
 *
 * Filtros avanzados client-side para /deals, inspirados en Google Flights
 * y Kayak. Los filtros server-side (tipo / cabina / región) reducen el set
 * a ~200 deals; a partir de ahí afinamos sin tocar el backend:
 *
 *   · Precio máximo       — slider [min, max] del dataset actual
 *   · Duración máxima     — chips (3h, 6h, 12h, 24h, cualquier)
 *   · Aerolíneas          — multi-select con conteo en vivo
 *
 * El sidebar es sticky en desktop (≥ lg) y colapsable en mobile (detalles
 * nativo <details>). No añadimos librerías — el slider es un <input
 * type="range"> estilado con Tailwind para no inflar el bundle.
 */

import { useMemo } from "react";
import type { Deal } from "@/lib/api";

export interface DealFilters {
  maxPrice: number | null;
  maxDurationMin: number | null; // null = sin límite
  airlines: string[]; // códigos IATA; vacío = todas
}

export const EMPTY_FILTERS: DealFilters = {
  maxPrice: null,
  maxDurationMin: null,
  airlines: [],
};

const DURATION_CHIPS: { label: string; value: number | null }[] = [
  { label: "Cualquiera", value: null },
  { label: "≤ 3 h", value: 180 },
  { label: "≤ 6 h", value: 360 },
  { label: "≤ 12 h", value: 720 },
  { label: "≤ 24 h", value: 1440 },
];

/** Aplica los filtros del sidebar a un listado de deals. */
export function applySidebarFilters(deals: Deal[], f: DealFilters): Deal[] {
  return deals.filter((d) => {
    if (f.maxPrice != null && d.price_eur > f.maxPrice) return false;
    if (f.maxDurationMin != null && d.duration_min > 0 && d.duration_min > f.maxDurationMin) return false;
    if (f.airlines.length > 0 && !f.airlines.includes(d.airline)) return false;
    return true;
  });
}

interface SidebarProps {
  deals: Deal[]; // dataset pre-filtros (para calcular min/max/counts)
  filters: DealFilters;
  onChange: (next: DealFilters) => void;
}

export function DealsFiltersSidebar({ deals, filters, onChange }: SidebarProps) {
  // Rango de precios del dataset actual — evita que el usuario mueva el
  // slider hasta valores sin resultados.
  const { priceMin, priceMax } = useMemo(() => {
    if (deals.length === 0) return { priceMin: 0, priceMax: 2000 };
    let min = Infinity;
    let max = 0;
    for (const d of deals) {
      if (d.price_eur < min) min = d.price_eur;
      if (d.price_eur > max) max = d.price_eur;
    }
    return { priceMin: Math.floor(min), priceMax: Math.ceil(max) };
  }, [deals]);

  // Aerolíneas del dataset con su conteo — ordenadas por frecuencia.
  const airlineOptions = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    for (const d of deals) {
      const existing = counts.get(d.airline);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(d.airline, { name: d.airline_name || d.airline, count: 1 });
      }
    }
    return Array.from(counts.entries())
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [deals]);

  const currentMax = filters.maxPrice ?? priceMax;
  const hasFilters =
    filters.maxPrice != null ||
    filters.maxDurationMin != null ||
    filters.airlines.length > 0;

  function toggleAirline(code: string) {
    const next = filters.airlines.includes(code)
      ? filters.airlines.filter((c) => c !== code)
      : [...filters.airlines, code];
    onChange({ ...filters, airlines: next });
  }

  const body = (
    <div className="space-y-6">
      {/* Precio máximo */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="filter-max-price" className="text-xs text-gray-400 uppercase tracking-wider">
            Precio máximo
          </label>
          <span className="text-sm font-semibold text-amber-300">
            {currentMax} €
          </span>
        </div>
        <input
          id="filter-max-price"
          type="range"
          min={priceMin}
          max={priceMax}
          step={10}
          value={currentMax}
          onChange={(e) =>
            onChange({ ...filters, maxPrice: parseInt(e.target.value, 10) })
          }
          className="w-full accent-amber-500 cursor-pointer"
          aria-label={`Precio máximo ${currentMax} euros`}
        />
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>{priceMin} €</span>
          <span>{priceMax} €</span>
        </div>
      </div>

      {/* Duración máxima */}
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
          Duración del vuelo
        </div>
        <div className="flex flex-wrap gap-2">
          {DURATION_CHIPS.map((chip) => {
            const isActive = filters.maxDurationMin === chip.value;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => onChange({ ...filters, maxDurationMin: chip.value })}
                className={`px-3 py-1 rounded-full text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isActive
                    ? "bg-amber-500 text-black font-semibold"
                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Aerolíneas */}
      {airlineOptions.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
            Aerolíneas
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {airlineOptions.map((opt) => {
              const checked = filters.airlines.includes(opt.code);
              return (
                <label
                  key={opt.code}
                  className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-gray-800/60 cursor-pointer text-sm"
                >
                  <span className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAirline(opt.code)}
                      className="accent-amber-500"
                    />
                    <span className="truncate">{opt.name}</span>
                  </span>
                  <span className="text-xs text-gray-500 tabular-nums shrink-0">
                    {opt.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="w-full text-xs text-gray-400 hover:text-amber-300 underline underline-offset-2 py-1"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block sticky top-6 self-start w-64 shrink-0 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-white mb-4">Filtrar</h2>
        {body}
      </aside>

      {/* Mobile: collapsible */}
      <details className="lg:hidden bg-gray-900 border border-gray-800 rounded-xl group">
        <summary className="p-3 cursor-pointer flex items-center justify-between text-sm font-semibold text-white">
          <span>
            Filtros
            {hasFilters && (
              <span className="ml-2 text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full">
                activos
              </span>
            )}
          </span>
          <span className="text-amber-400 group-open:rotate-180 transition-transform" aria-hidden="true">▾</span>
        </summary>
        <div className="p-4 pt-0">{body}</div>
      </details>
    </>
  );
}

export default DealsFiltersSidebar;
