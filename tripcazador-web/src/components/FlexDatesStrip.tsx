"use client";

/**
 * TripCazador — FlexDatesStrip
 *
 * Tira de 7 chips (día actual ± 3) al estilo Google Flights. Permite al
 * usuario saltar de un día al adyacente con un click sin volver a abrir
 * el date-picker.
 *
 * No pre-consultamos precios por día porque cada día implicaría una
 * llamada en vivo — muy caro. En lugar de eso:
 *   · Mostramos el precio mínimo conocido para esa ruta en esa fecha
 *     si existe en el set de resultados actual (hint).
 *   · Si no hay dato, mostramos "—" (pero el chip sigue clickable).
 *
 * El padre controla el estado de `dateFrom` y re-lanza la búsqueda al
 * seleccionar un día.
 */

import { useMemo } from "react";
import type { Deal } from "@/lib/api";
import { parseLocalISO, shiftLocalISO } from "@/lib/date-utils";

interface FlexDatesStripProps {
  /** Fecha base ISO (YYYY-MM-DD) seleccionada por el usuario. */
  dateFrom: string;
  /** Deals del resultado actual, para extraer hints de precio por día. */
  results: Deal[];
  /** Callback al seleccionar un día — el padre re-ejecuta handleSubmit(). */
  onSelect: (iso: string) => void;
}

/** "lun 14" — abreviatura ES, sin punto. */
function formatShort(iso: string): { dow: string; day: string } {
  const date = parseLocalISO(iso);
  if (!date) return { dow: "—", day: "—" };
  const dow = date.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
  const day = date.toLocaleDateString("es-ES", { day: "numeric" });
  return { dow, day };
}

export function FlexDatesStrip({ dateFrom, results, onSelect }: FlexDatesStripProps) {
  const days = useMemo(() => {
    return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
      const iso = shiftLocalISO(dateFrom, offset);
      const sameDay = results.filter((d) => d.date_out === iso);
      const hintPrice = sameDay.length
        ? Math.min(...sameDay.map((d) => d.price_eur))
        : null;
      return { iso, offset, hintPrice };
    });
  }, [dateFrom, results]);

  if (!dateFrom) return null;

  return (
    <div
      className="flex items-stretch gap-1 overflow-x-auto pb-2"
      role="group"
      aria-label="Fechas cercanas (±3 días)"
    >
      {days.map(({ iso, offset, hintPrice }) => {
        const isActive = offset === 0;
        const { dow, day } = formatShort(iso);
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelect(iso)}
            aria-pressed={isActive}
            aria-label={`${dow} ${day}${hintPrice ? `, desde ${hintPrice} euros` : ""}`}
            className={`min-w-[72px] flex flex-col items-center justify-center px-2 py-2 rounded-lg text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              isActive
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : "bg-slate-900/70 text-slate-300 hover:bg-slate-800 hover:text-white ring-1 ring-slate-700/50"
            }`}
          >
            <span className={`text-[10px] uppercase tracking-wider ${isActive ? "text-black/70" : "text-slate-500"}`}>
              {dow}
            </span>
            <span className="text-sm font-semibold leading-tight">{day}</span>
            <span
              className={`text-[10px] leading-tight ${
                isActive ? "text-black/80" : hintPrice ? "text-amber-300" : "text-slate-600"
              }`}
            >
              {hintPrice ? `${hintPrice} €` : "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default FlexDatesStrip;
