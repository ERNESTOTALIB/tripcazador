"use client";

/**
 * DealsViewToggle — fase jjj JJJ1 (May 2026)
 *
 * Toggle entre vista lista (DealRow) y vista grid (DealCard) en /deals.
 * Persiste preferencia en localStorage. Por defecto = "list" (denser, más opciones).
 *
 * Por qué: distintos usuarios tienen distinta querencia. Power users prefieren
 * lista (más data por scroll), casual prefieren cards con foto. Persistir mejora
 * UX en visitas recurrentes.
 *
 * Implementación: dispatcha CustomEvent("tc-deals-view") que DealsListClient
 * (o el wrapper en page.tsx) escucha. El render se hace en client porque el
 * page.tsx server component renderiza ambos y CSS oculta el otro.
 */
import { useEffect, useState } from "react";
import { Grid3x3, List } from "lucide-react";

const STORAGE_KEY = "tc_deals_view";
type ViewMode = "list" | "grid";

export function DealsViewToggle() {
  const [view, setView] = useState<ViewMode>("list");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
      const initial: ViewMode = saved === "grid" ? "grid" : "list";
      setView(initial);
      applyDom(initial);
    } catch {
      /* no-op */
    }
    setHydrated(true);
  }, []);

  function changeView(next: ViewMode) {
    setView(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* no-op */
    }
    applyDom(next);
    if (typeof window !== "undefined" && (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...a: unknown[]) => void }).gtag("event", "deals_view_change", {
        view: next,
      });
    }
  }

  return (
    <div
      role="group"
      aria-label="Vista de chollos"
      className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-gray-800 border border-gray-700"
    >
      <button
        type="button"
        onClick={() => changeView("list")}
        aria-pressed={hydrated && view === "list"}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors min-h-[32px] ${
          hydrated && view === "list"
            ? "bg-amber-500 text-black"
            : "text-gray-400 hover:text-white"
        }`}
      >
        <List size={14} />
        <span className="hidden sm:inline">Lista</span>
      </button>
      <button
        type="button"
        onClick={() => changeView("grid")}
        aria-pressed={hydrated && view === "grid"}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors min-h-[32px] ${
          hydrated && view === "grid"
            ? "bg-amber-500 text-black"
            : "text-gray-400 hover:text-white"
        }`}
      >
        <Grid3x3 size={14} />
        <span className="hidden sm:inline">Grid</span>
      </button>
    </div>
  );
}

/**
 * Aplica un atributo data en el container [data-deals-view] que CSS usa para
 * ocultar el modo opuesto. Server renderiza AMBOS (list + grid) — el toggle
 * solo cambia visibilidad, no re-renderiza data fetching.
 */
function applyDom(mode: ViewMode): void {
  if (typeof document === "undefined") return;
  const root = document.querySelector<HTMLElement>("[data-deals-view-root]");
  if (root) root.setAttribute("data-deals-view", mode);
}
