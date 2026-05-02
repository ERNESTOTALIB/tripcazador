"use client";

/**
 * RecentSearchesStrip — fase iii III4 (May 2026)
 *
 * Tira horizontal de chips con las últimas 5 búsquedas. Solo se renderiza si
 * el usuario ha aceptado consent funcional Y tiene historial. Si no, devuelve
 * null silenciosamente (no ocupa espacio en home).
 *
 * Click en chip → navega a /deals con origin/destination prepoblados
 * (ya soportado por DealsPage filter logic VV7).
 *
 * Por qué esto importa: para usuarios recurrentes acelera el "vuelvo a ver
 * cómo está MAD-NRT", aumenta engagement y normaliza patrón de visita
 * "abre TripCazador → check rutas guardadas → ¿bajó?".
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, X } from "lucide-react";
import {
  getRecentSearches,
  removeSearch,
  type SearchEntry,
} from "@/lib/searchHistory";
import { getAirportByIata } from "@/lib/airports_catalog";

export function RecentSearchesStrip() {
  const [items, setItems] = useState<SearchEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(getRecentSearches());
    setHydrated(true);
    // No hay un emitter formal: re-leemos al focusear ventana
    const onFocus = () => setItems(getRecentSearches());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!hydrated || items.length === 0) return null;

  return (
    <section
      aria-labelledby="recent-searches-heading"
      className="py-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <Clock size={14} className="text-gray-400" />
        <h2
          id="recent-searches-heading"
          className="text-xs uppercase tracking-wider text-gray-400 font-semibold"
        >
          Tus últimas búsquedas
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((s) => {
          const dest = getAirportByIata(s.destination);
          const labelDest = dest?.city || s.destination;
          const href = `/deals?origin=${encodeURIComponent(s.origin)}&destination=${encodeURIComponent(s.destination)}${s.date ? `&date=${encodeURIComponent(s.date)}` : ""}`;
          return (
            <div
              key={`${s.origin}-${s.destination}-${s.ts}`}
              className="group inline-flex items-center gap-2 pl-3 pr-1 py-1.5 rounded-full bg-gray-800/80 hover:bg-gray-700 border border-gray-700/60 transition-colors"
            >
              <Link
                href={href}
                className="inline-flex items-center gap-2 text-sm font-medium text-white"
              >
                <span className="font-mono text-amber-400">{s.origin}</span>
                <span className="text-gray-500">→</span>
                <span className="font-mono">{s.destination}</span>
                <span className="text-gray-400 hidden sm:inline">· {labelDest}</span>
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  removeSearch(s.origin, s.destination);
                  setItems(getRecentSearches());
                }}
                aria-label={`Quitar ${s.origin} ${s.destination} del historial`}
                className="ml-1 w-7 h-7 rounded-full inline-flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
