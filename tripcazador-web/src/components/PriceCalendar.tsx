"use client";

/**
 * TripCazador — PriceCalendar
 *
 * Calendario de 30 días con color-coding por percentil, al estilo
 * Google Flights / Skyscanner. Agrupa los deals ya cargados por su
 * `date_out` y muestra el precio mínimo por día. Los colores son
 * tri-banda:
 *   · verde  — p ≤ 33 (barato relativo al dataset)
 *   · ámbar  — 33 < p ≤ 66
 *   · rojo   — p > 66 (caro)
 *   · gris   — sin deals ese día
 *
 * No hacemos llamadas adicionales al backend — esto es una lectura
 * derivada del set que ya está en memoria. Sirve como "mapa de calor"
 * rápido para que el usuario elija el día más barato.
 */

import { useMemo, useState } from "react";
import type { Deal } from "@/lib/api";
import { toLocalISO, percentileSorted } from "@/lib/date-utils";

interface PriceCalendarProps {
  deals: Deal[];
  /** Cuándo el usuario hace click en un día con deals (YYYY-MM-DD). */
  onSelect?: (iso: string) => void;
  /** Día actualmente filtrado (si lo hay). */
  selectedDate?: string | null;
}

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"]; // es-ES, lunes inicio

export function PriceCalendar({ deals, onSelect, selectedDate }: PriceCalendarProps) {
  const [open, setOpen] = useState(false);

  // Mapa: ISO → precio mínimo
  const priceByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of deals) {
      if (!d.date_out) continue;
      const prev = map.get(d.date_out);
      if (prev == null || d.price_eur < prev) {
        map.set(d.date_out, d.price_eur);
      }
    }
    return map;
  }, [deals]);

  const prices = useMemo(
    () => [...priceByDay.values()].sort((a, b) => a - b),
    [priceByDay],
  );

  const p33 = useMemo(() => percentileSorted(prices, 33), [prices]);
  const p66 = useMemo(() => percentileSorted(prices, 66), [prices]);

  // Genera 30 días a partir de hoy (incluye hoy)
  const days = useMemo(() => {
    const out: { iso: string; day: number; weekday: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      // Weekday en formato L=0 ... D=6 (Spain)
      const wd = (d.getDay() + 6) % 7;
      out.push({ iso: toLocalISO(d), day: d.getDate(), weekday: wd });
    }
    return out;
  }, []);

  // Padding al inicio para alinear la primera fila con el día de la semana
  const leadingBlanks = days.length > 0 ? days[0].weekday : 0;

  function colorFor(price: number | undefined): string {
    if (price == null) return "bg-gray-900 text-gray-600";
    if (price <= p33) return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40 hover:bg-emerald-500/25";
    if (price <= p66) return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40 hover:bg-amber-500/25";
    return "bg-red-500/15 text-red-300 ring-1 ring-red-500/40 hover:bg-red-500/25";
  }

  const withPrices = priceByDay.size;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-gray-800/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <span aria-hidden="true">📅</span>
          Calendario de precios
          <span className="text-xs font-normal text-gray-500">
            ({withPrices} {withPrices === 1 ? "día con datos" : "días con datos"})
          </span>
        </span>
        <span className={`text-amber-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          {/* Leyenda */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/30 ring-1 ring-emerald-500/50" aria-hidden="true" />
              Barato (≤ {Math.round(p33)} €)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/30 ring-1 ring-amber-500/50" aria-hidden="true" />
              Medio
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500/30 ring-1 ring-red-500/50" aria-hidden="true" />
              Caro (&gt; {Math.round(p66)} €)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-800 ring-1 ring-gray-700" aria-hidden="true" />
              Sin datos
            </span>
          </div>

          {/* Encabezados de día */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-gray-500">
            {WEEKDAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Cuadrícula */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {days.map(({ iso, day }) => {
              const price = priceByDay.get(iso);
              const hasPrice = price != null;
              const isSelected = selectedDate === iso;
              const clickable = hasPrice && onSelect;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onSelect?.(iso)}
                  title={hasPrice ? `Desde ${price} €` : "Sin ofertas ese día"}
                  aria-label={
                    hasPrice
                      ? `Día ${day}: desde ${price} euros`
                      : `Día ${day}: sin datos`
                  }
                  className={`aspect-square flex flex-col items-center justify-center rounded text-[11px] transition-colors ${colorFor(price)} ${clickable ? "cursor-pointer" : "cursor-default"} ${isSelected ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-gray-900" : ""}`}
                >
                  <span className="font-semibold leading-none">{day}</span>
                  {hasPrice && (
                    <span className="text-[9px] leading-none mt-0.5 tabular-nums">
                      {price} €
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {withPrices === 0 && (
            <p className="text-xs text-gray-500 text-center">
              Todavía no hay datos de precios para los próximos 30 días con los filtros actuales.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PriceCalendar;
