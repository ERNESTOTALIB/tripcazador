"use client";

/**
 * TripCazador — DealsListClient
 *
 * Lista client-side de deals con:
 *   · Sidebar de filtros avanzados (precio, duración, aerolíneas)
 *   · Tabs de ordenación (Mejores / Baratos / Rápidos / Directos)
 *
 * Inspirado en la UX de Google Flights / Skyscanner / Kayak. Los filtros
 * del sidebar son client-side porque actuamos sobre los ~200 deals ya
 * cargados por el server component; re-filtrar es instantáneo y evita
 * round-trips al backend. Los filtros base (tipo / cabina / región) siguen
 * siendo server-side vía `searchParams` para mantener SSR + ISR.
 *
 * Persistimos el tab activo en el hash (#orden=baratos) para permitir
 * enlaces compartibles con el orden elegido.
 */

import { useEffect, useMemo, useState } from "react";
import { DealRow } from "@/components/DealCard";
import {
  DealsFiltersSidebar,
  EMPTY_FILTERS,
  applySidebarFilters,
  type DealFilters,
} from "@/components/DealsFiltersSidebar";
import { PriceCalendar } from "@/components/PriceCalendar";
import type { Deal } from "@/lib/api";

type SortKey = "best" | "cheap" | "fast" | "direct";

interface TabDef {
  key: SortKey;
  label: string;
  icon: string;
  hint: string;
}

const TABS: TabDef[] = [
  { key: "best", label: "Mejores", icon: "★", hint: "Balance precio / ahorro / cabina" },
  { key: "cheap", label: "Más baratos", icon: "€", hint: "Menor precio primero" },
  { key: "fast", label: "Más rápidos", icon: "⚡", hint: "Menor duración de vuelo" },
  { key: "direct", label: "Directos", icon: "→", hint: "Solo vuelos sin escalas" },
];

/** Lee el hash inicial solo una vez en cliente; SSR devuelve "best". */
function readHash(): SortKey {
  if (typeof window === "undefined") return "best";
  const raw = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(raw);
  const value = params.get("orden");
  if (value === "baratos") return "cheap";
  if (value === "rapidos") return "fast";
  if (value === "directos") return "direct";
  return "best";
}

function writeHash(key: SortKey) {
  if (typeof window === "undefined") return;
  if (key === "best") {
    history.replaceState(null, "", window.location.pathname + window.location.search);
    return;
  }
  const mapping: Record<Exclude<SortKey, "best">, string> = {
    cheap: "baratos",
    fast: "rapidos",
    direct: "directos",
  };
  history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}#orden=${mapping[key]}`,
  );
}

export function DealsListClient({ deals }: { deals: Deal[] }) {
  const [active, setActive] = useState<SortKey>("best");
  const [filters, setFilters] = useState<DealFilters>(EMPTY_FILTERS);
  // Filtro "solo deals con esta date_out" — accionable desde el calendario.
  const [dateFilter, setDateFilter] = useState<string | null>(null);

  useEffect(() => {
    setActive(readHash());
  }, []);

  useEffect(() => {
    writeHash(active);
  }, [active]);

  // Aplica filtros del sidebar antes de ordenar/contar.
  const filteredDeals = useMemo(() => {
    let out = applySidebarFilters(deals, filters);
    if (dateFilter) out = out.filter((d) => d.date_out === dateFilter);
    return out;
  }, [deals, filters, dateFilter]);

  const directCount = useMemo(
    () => filteredDeals.filter((d) => d.stops === 0).length,
    [filteredDeals],
  );

  const sorted = useMemo(() => {
    const copy = [...filteredDeals];
    switch (active) {
      case "cheap":
        return copy.sort((a, b) => a.price_eur - b.price_eur);
      case "fast":
        return copy.sort((a, b) => {
          const da = a.duration_min || Number.MAX_SAFE_INTEGER;
          const db = b.duration_min || Number.MAX_SAFE_INTEGER;
          return da - db;
        });
      case "direct":
        return copy
          .filter((d) => d.stops === 0)
          .sort((a, b) => a.price_eur - b.price_eur);
      case "best":
      default:
        return copy.sort((a, b) => b.score - a.score);
    }
  }, [filteredDeals, active]);

  if (deals.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg">Sin resultados — no hay ofertas con estos filtros</p>
        <a href="/deals" className="text-amber-400 hover:underline mt-2 block">
          Ver todos los deals →
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Sidebar de filtros avanzados */}
      <DealsFiltersSidebar
        deals={deals}
        filters={filters}
        onChange={setFilters}
      />

      {/* Contenido principal: calendario + tabs + lista */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Calendario de precios (colapsado por defecto) */}
        <PriceCalendar
          deals={applySidebarFilters(deals, filters)}
          onSelect={(iso) => setDateFilter((prev) => (prev === iso ? null : iso))}
          selectedDate={dateFilter}
        />

        {dateFilter && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-sm">
            <span className="text-amber-300">
              Filtrando por fecha: <strong>{dateFilter}</strong>
            </span>
            <button
              type="button"
              onClick={() => setDateFilter(null)}
              className="ml-auto text-xs text-amber-300 hover:text-white underline underline-offset-2"
            >
              Quitar filtro
            </button>
          </div>
        )}

        <div
          role="tablist"
          aria-label="Ordenar deals"
          className="flex flex-wrap gap-2 border-b border-gray-800 pb-1"
        >
          {TABS.map((tab) => {
            const isActive = tab.key === active;
            const count = tab.key === "direct" ? directCount : null;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                aria-controls="deals-panel"
                title={tab.hint}
                onClick={() => setActive(tab.key)}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isActive
                    ? "bg-amber-500 text-black font-semibold"
                    : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
                {count !== null && (
                  <span
                    className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${
                      isActive ? "bg-black/20 text-black" : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          id="deals-panel"
          role="tabpanel"
          aria-live="polite"
          className="space-y-3"
        >
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Sin resultados — prueba a relajar los filtros del lateral.</p>
              <button
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  setActive("best");
                }}
                className="text-amber-400 hover:underline mt-2"
              >
                Limpiar filtros y orden →
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500">
                {sorted.length} {sorted.length === 1 ? "deal" : "deals"}
                {filteredDeals.length !== deals.length && (
                  <span className="ml-1">(de {deals.length} tras filtros)</span>
                )}
              </p>
              {sorted.map((deal) => (
                <DealRow key={deal.id} deal={deal} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DealsListClient;
