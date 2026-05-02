"use client";

/**
 * DealsFilterDrawer — fase jjj JJJ2 (May 2026)
 *
 * Drawer mobile-first con filtros adicionales que no caben en la barra inline:
 *   - Precio máximo (slider 50€..3000€)
 *   - Escalas (directo / 1 / 2+)
 *   - Duración máxima (3h..24h)
 *
 * URL state via searchParams: max_price, max_stops, max_duration_min.
 *
 * En desktop está visible inline; en mobile se abre como bottom-sheet con
 * overlay. La barra de filtros existente mantiene chips/region/cabin para no
 * duplicar UI.
 *
 * Rationale: en mobile no hay espacio horizontal para un sidebar, y los chips
 * tampoco escalan a sliders. Bottom-sheet es el patrón nativo (Apple/Google).
 */
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

interface FilterState {
  max_price: number;
  max_stops: number;
  max_duration: number; // minutos
}

const DEFAULTS: FilterState = {
  max_price: 0, // 0 = sin límite
  max_stops: 9, // 9 = cualquiera
  max_duration: 0, // 0 = sin límite
};

const PRICE_TICKS = [0, 100, 200, 350, 500, 800, 1200, 2000, 3000];
const DURATION_TICKS_HOURS = [0, 4, 6, 9, 12, 16, 20, 24];

export function DealsFilterDrawer() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FilterState>(DEFAULTS);

  useEffect(() => {
    setState({
      max_price: parseInt(params.get("max_price") || "0") || 0,
      max_stops: parseInt(params.get("max_stops") || "9") || 9,
      max_duration: parseInt(params.get("max_duration_min") || "0") || 0,
    });
  }, [params]);

  // Cerrar con ESC + lock scroll body
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function applyAndClose() {
    const sp = new URLSearchParams(params.toString());
    if (state.max_price > 0) sp.set("max_price", String(state.max_price));
    else sp.delete("max_price");
    if (state.max_stops < 9) sp.set("max_stops", String(state.max_stops));
    else sp.delete("max_stops");
    if (state.max_duration > 0) sp.set("max_duration_min", String(state.max_duration));
    else sp.delete("max_duration_min");
    sp.delete("page"); // resetear paginación
    router.replace(`/deals?${sp.toString()}`, { scroll: false });
    setOpen(false);
  }

  function reset() {
    setState(DEFAULTS);
  }

  const activeCount =
    (state.max_price > 0 ? 1 : 0) +
    (state.max_stops < 9 ? 1 : 0) +
    (state.max_duration > 0 ? 1 : 0);

  return (
    <>
      {/* Trigger button — visible siempre, count badge si hay filtros activos */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-colors"
        aria-label={`Más filtros${activeCount > 0 ? ` (${activeCount} activos)` : ""}`}
        data-testid="deals-filter-drawer-trigger"
      >
        <SlidersHorizontal size={14} />
        Más filtros
        {activeCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar filtros"
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-drawer-title"
            className="fixed bottom-0 left-0 right-0 z-[61] bg-gray-950 border-t border-gray-800 rounded-t-2xl max-h-[85vh] overflow-y-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:rounded-2xl sm:border"
          >
            <div className="sticky top-0 bg-gray-950 border-b border-gray-800 px-5 py-4 flex items-center justify-between">
              <h2 id="filters-drawer-title" className="text-lg font-bold text-white">
                Más filtros
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 inline-flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Precio máximo */}
              <div>
                <label className="flex items-center justify-between text-sm font-semibold text-white mb-2">
                  <span>Precio máximo</span>
                  <span className="text-amber-400 font-mono">
                    {state.max_price === 0 ? "Sin límite" : `≤ ${state.max_price}€`}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRICE_TICKS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, max_price: p }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-colors ${
                        state.max_price === p
                          ? "bg-amber-500 text-black"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {p === 0 ? "Cualquiera" : `${p}€`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Escalas */}
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">
                  Escalas
                </label>
                <div className="flex gap-2">
                  {[
                    { v: 0, label: "Directo" },
                    { v: 1, label: "Máx 1 escala" },
                    { v: 2, label: "Máx 2 escalas" },
                    { v: 9, label: "Cualquiera" },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, max_stops: opt.v }))}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold min-h-[40px] transition-colors ${
                        state.max_stops === opt.v
                          ? "bg-amber-500 text-black"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duración máxima */}
              <div>
                <label className="flex items-center justify-between text-sm font-semibold text-white mb-2">
                  <span>Duración máxima</span>
                  <span className="text-amber-400 font-mono">
                    {state.max_duration === 0 ? "Sin límite" : `≤ ${Math.round(state.max_duration / 60)}h`}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_TICKS_HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, max_duration: h * 60 }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] transition-colors ${
                        Math.round(state.max_duration / 60) === h
                          ? "bg-amber-500 text-black"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {h === 0 ? "Cualquiera" : `${h}h`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-950 border-t border-gray-800 p-4 flex gap-2">
              <button
                type="button"
                onClick={reset}
                className="px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold transition-colors"
              >
                Resetear
              </button>
              <button
                type="button"
                onClick={applyAndClose}
                className="flex-1 px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
