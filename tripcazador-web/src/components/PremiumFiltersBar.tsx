"use client";

/**
 * PremiumFiltersBar — SSS301 (18 may 2026)
 *
 * Implementación real de la feature "Filtros pro" prometida en Premium €2.99/mes.
 * Antes era promesa marketing sin entrega — ahora componente funcional gated.
 *
 * Si user es Premium:
 *  - Muestra 4 filtros adicionales sobre /deals listing
 *  - URL state via search params (compartible)
 *  - Multiselect aerolíneas (chips toggleable)
 *  - Clase exacta (radio economy/premium/business/first/any)
 *  - Escalas exactas (0/1/2+/any)
 *  - Banda horaria salida (madrugada/mañana/tarde/noche/any)
 *
 * Si user es free:
 *  - Locked card con preview + CTA upgrade
 *  - Click → /premium con utm_source=filters-locked
 *
 * El filtering real lo hace el padre via `onFiltersChange` callback con shape:
 *   { airlines: string[], cabin: string, stops: string, timeBand: string }
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getPremiumStatus } from "@/lib/premium";
import { tcTrack, tcTrackOnce } from "@/lib/track_client";

export interface PremiumFiltersState {
  airlines: string[]; // IATA codes ["FR","U2"]
  cabin: "any" | "economy" | "premium_economy" | "business" | "first";
  stops: "any" | "0" | "1" | "2plus";
  timeBand: "any" | "early" | "morning" | "afternoon" | "evening";
}

const DEFAULT_FILTERS: PremiumFiltersState = {
  airlines: [],
  cabin: "any",
  stops: "any",
  timeBand: "any",
};

interface Props {
  /** Lista de aerolíneas seleccionables (de los deals visibles). */
  availableAirlines: Array<{ code: string; name: string }>;
  /** Callback cuando el user aplica/cambia filtros (Premium). */
  onFiltersChange?: (state: PremiumFiltersState) => void;
}

const CABIN_OPTIONS = [
  { value: "any", label: "Cualquiera" },
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
] as const;

const STOPS_OPTIONS = [
  { value: "any", label: "Cualquiera" },
  { value: "0", label: "Directo (0 escalas)" },
  { value: "1", label: "1 escala" },
  { value: "2plus", label: "2+ escalas" },
] as const;

const TIME_BANDS = [
  { value: "any", label: "Cualquiera" },
  { value: "early", label: "Madrugada 00–06h" },
  { value: "morning", label: "Mañana 06–12h" },
  { value: "afternoon", label: "Tarde 12–18h" },
  { value: "evening", label: "Noche 18–24h" },
] as const;

export function PremiumFiltersBar({ availableAirlines, onFiltersChange }: Props) {
  const [isPremium, setIsPremium] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from URL params (shareable filter state)
  const initialFilters = useMemo<PremiumFiltersState>(() => {
    const airlines = (searchParams.get("airlines") || "")
      .split(",")
      .filter(Boolean);
    const cabin = (searchParams.get("cabin_exact") || "any") as PremiumFiltersState["cabin"];
    const stops = (searchParams.get("stops_exact") || "any") as PremiumFiltersState["stops"];
    const timeBand = (searchParams.get("time") || "any") as PremiumFiltersState["timeBand"];
    return { airlines, cabin, stops, timeBand };
  }, [searchParams]);

  const [filters, setFilters] = useState<PremiumFiltersState>(initialFilters);

  useEffect(() => {
    setIsPremium(getPremiumStatus().active);
    const onChange = () => setIsPremium(getPremiumStatus().active);
    window.addEventListener("tc:premium-changed", onChange);
    return () => window.removeEventListener("tc:premium-changed", onChange);
  }, []);

  // Track that user saw the filters bar
  useEffect(() => {
    tcTrackOnce(
      isPremium ? "premium_filters_seen" : "premium_filters_locked_seen",
      "premium_filters_bar",
      { isPremium },
    );
  }, [isPremium]);

  // Sync URL + emit callback on filter change (Premium only)
  function applyFilters(newFilters: PremiumFiltersState) {
    setFilters(newFilters);
    onFiltersChange?.(newFilters);

    // Sync URL params for shareable state
    const params = new URLSearchParams(searchParams.toString());
    if (newFilters.airlines.length > 0) {
      params.set("airlines", newFilters.airlines.join(","));
    } else {
      params.delete("airlines");
    }
    if (newFilters.cabin !== "any") params.set("cabin_exact", newFilters.cabin);
    else params.delete("cabin_exact");
    if (newFilters.stops !== "any") params.set("stops_exact", newFilters.stops);
    else params.delete("stops_exact");
    if (newFilters.timeBand !== "any") params.set("time", newFilters.timeBand);
    else params.delete("time");

    const qs = params.toString();
    router.replace(`${pathname}${qs ? "?" + qs : ""}`, { scroll: false });

    tcTrack("premium_filters_changed", {
      airlines_n: newFilters.airlines.length,
      cabin: newFilters.cabin,
      stops: newFilters.stops,
      timeBand: newFilters.timeBand,
    });
  }

  function toggleAirline(code: string) {
    const exists = filters.airlines.includes(code);
    const next = exists
      ? filters.airlines.filter((c) => c !== code)
      : [...filters.airlines, code];
    applyFilters({ ...filters, airlines: next });
  }

  function resetAll() {
    applyFilters(DEFAULT_FILTERS);
    tcTrack("premium_filters_reset", {});
  }

  // FREE user — locked teaser
  if (!isPremium) {
    return (
      <div className="my-6 p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔒</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-amber-400 text-sm flex items-center gap-2">
              Filtros pro — solo Premium
            </div>
            <div className="text-xs text-gray-300 mt-1">
              Filtra por aerolínea concreta · clase exacta · escalas exactas · banda horaria de salida. €9.99/mes · 7 días gratis.
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full">
                ✈ Aerolínea concreta
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full">
                🎫 Economy/Business/First
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full">
                🔁 0/1/2+ escalas
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full">
                🌅 Banda horaria
              </span>
            </div>
            <a
              href="/premium?utm_source=filters_locked"
              onClick={() => tcTrack("premium_filters_locked_click", {})}
              className="mt-4 inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg"
            >
              Desbloquear con Premium →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // PREMIUM user — funcional
  const hasActive =
    filters.airlines.length > 0 ||
    filters.cabin !== "any" ||
    filters.stops !== "any" ||
    filters.timeBand !== "any";

  return (
    <div className="my-6 p-5 bg-gradient-to-br from-amber-500/8 to-amber-600/3 border border-amber-500/40 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-amber-400 text-sm flex items-center gap-2">
          ★ Filtros pro <span className="text-xs text-gray-400">Premium activo</span>
        </div>
        {hasActive && (
          <button
            onClick={resetAll}
            className="text-xs text-gray-400 hover:text-amber-300 underline"
          >
            Resetear
          </button>
        )}
      </div>

      {/* Aerolíneas multi-select chips */}
      {availableAirlines.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Aerolínea</div>
          <div className="flex gap-2 flex-wrap">
            {availableAirlines.map((a) => {
              const active = filters.airlines.includes(a.code);
              return (
                <button
                  key={a.code}
                  onClick={() => toggleAirline(a.code)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                    active
                      ? "bg-amber-500 text-black border-amber-500"
                      : "bg-gray-800 text-gray-300 border-gray-700 hover:border-amber-500/40"
                  }`}
                >
                  {a.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Clase exacta */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">Clase exacta</div>
        <div className="flex gap-2 flex-wrap">
          {CABIN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => applyFilters({ ...filters, cabin: opt.value })}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                filters.cabin === opt.value
                  ? "bg-amber-500 text-black border-amber-500"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:border-amber-500/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Escalas exactas */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">Escalas exactas</div>
        <div className="flex gap-2 flex-wrap">
          {STOPS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => applyFilters({ ...filters, stops: opt.value })}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                filters.stops === opt.value
                  ? "bg-amber-500 text-black border-amber-500"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:border-amber-500/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Banda horaria salida */}
      <div>
        <div className="text-xs text-gray-400 mb-2">Banda horaria salida</div>
        <div className="flex gap-2 flex-wrap">
          {TIME_BANDS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => applyFilters({ ...filters, timeBand: opt.value })}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                filters.timeBand === opt.value
                  ? "bg-amber-500 text-black border-amber-500"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:border-amber-500/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * filterDealsByPremiumFilters — pure function para aplicar filtros pro a un array.
 * Exportada por separado para tests + reutilización server-side si hace falta.
 */
export function filterDealsByPremiumFilters<
  T extends {
    airline?: string;
    airline_name?: string;
    cabin?: string;
    stops?: number;
    date_out?: string;
  },
>(deals: T[], filters: PremiumFiltersState): T[] {
  return deals.filter((d) => {
    // Aerolínea (any of selected, code o name match)
    if (filters.airlines.length > 0) {
      const code = (d.airline || "").toUpperCase();
      if (!filters.airlines.includes(code)) return false;
    }
    // Cabin exact
    if (filters.cabin !== "any") {
      const c = (d.cabin || "economy").toLowerCase();
      if (c !== filters.cabin) return false;
    }
    // Stops exact
    if (filters.stops !== "any") {
      const n = Number(d.stops || 0);
      if (filters.stops === "0" && n !== 0) return false;
      if (filters.stops === "1" && n !== 1) return false;
      if (filters.stops === "2plus" && n < 2) return false;
    }
    // Time band (parse date_out hour)
    if (filters.timeBand !== "any" && d.date_out) {
      const dt = new Date(d.date_out);
      if (!isNaN(dt.getTime())) {
        const h = dt.getHours();
        const band =
          h < 6 ? "early" : h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
        if (band !== filters.timeBand) return false;
      }
    }
    return true;
  });
}
