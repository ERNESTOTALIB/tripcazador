"use client";

import { useMemo } from "react";

/**
 * PriceCalendarHeatmap — fase kk K3
 *
 * Calendario tipo Google Flights: muestra 30 días con color heatmap por
 * precio mín estimado.
 *
 * Heurística (sin datos reales):
 *   - Lunes/Martes/Miércoles: 0.85x base
 *   - Jueves: 1.0x base
 *   - Viernes/Domingo: 1.25x base
 *   - Sábado: 1.10x base
 *   - Festivos importantes: +20%
 *   - Día actual + 30 días lookahead
 *
 * Cuando el motor real esté operativo, este componente leerá precios
 * desde /api/price-calendar?from=X&to=Y. Hasta entonces, heurística da
 * orientación visual razonable.
 */

interface Props {
  origin: string;
  destination: string;
  /** YYYY-MM-DD día seleccionado actualmente */
  startDate: string;
  onPickDay: (date: string) => void;
}

const DAYS_LOOKAHEAD = 60; // 2 meses
const HOLIDAY_DATES = new Set([
  "2026-12-24", "2026-12-25", "2026-12-31",
  "2027-01-01", "2027-01-06",
  "2027-03-29", "2027-03-30", "2027-04-02", "2027-04-05",
]);

function pad(n: number): string { return String(n).padStart(2, "0"); }

function dateAt(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isoToObj(iso: string): { y: number; m: number; d: number; weekday: number } {
  const dt = new Date(iso + "T00:00:00");
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate(), weekday: dt.getDay() };
}

function pricesFor(_origin: string, _destination: string): Map<string, number> {
  // Mismo "base price" para todos los días, modulado por día semana + holidays
  const base = 100; // unidades arbitrarias relativas
  const out = new Map<string, number>();
  for (let i = 0; i < DAYS_LOOKAHEAD; i++) {
    const iso = dateAt(i);
    const { weekday } = isoToObj(iso);
    let mult = 1.0;
    if (weekday === 1 || weekday === 2 || weekday === 3) mult = 0.85; // L M X
    else if (weekday === 4) mult = 1.0; // J
    else if (weekday === 6) mult = 1.10; // S
    else if (weekday === 5 || weekday === 0) mult = 1.25; // V D
    if (HOLIDAY_DATES.has(iso)) mult *= 1.2;
    out.set(iso, Math.round(base * mult));
  }
  return out;
}

export function PriceCalendarHeatmap({ origin, destination, startDate, onPickDay }: Props) {
  const prices = useMemo(() => pricesFor(origin, destination), [origin, destination]);
  const values = useMemo(() => Array.from(prices.values()), [prices]);

  // Quintiles para colorear: bottom 20% verde, 20-40% amber-light, 40-60% amber,
  // 60-80% orange, top 20% rojo
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.2)] ?? 0;
  const q2 = sorted[Math.floor(sorted.length * 0.4)] ?? 0;
  const q3 = sorted[Math.floor(sorted.length * 0.6)] ?? 0;
  const q4 = sorted[Math.floor(sorted.length * 0.8)] ?? 0;

  function colorFor(p: number): string {
    if (p <= q1) return "bg-green-500/30 border-green-500/60 text-green-200 hover:bg-green-500/50";
    if (p <= q2) return "bg-lime-500/20 border-lime-500/50 text-lime-200 hover:bg-lime-500/40";
    if (p <= q3) return "bg-amber-500/20 border-amber-500/50 text-amber-200 hover:bg-amber-500/40";
    if (p <= q4) return "bg-orange-500/25 border-orange-500/50 text-orange-200 hover:bg-orange-500/40";
    return "bg-red-500/25 border-red-500/50 text-red-200 hover:bg-red-500/40";
  }

  // Group por mes para sectional render
  const days = Array.from(prices.entries()).map(([iso, p]) => ({
    iso, price: p, ...isoToObj(iso),
  }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 sm:grid-cols-10 lg:grid-cols-15 gap-1.5">
        {days.map((d) => {
          const isSelected = d.iso === startDate;
          const monthShort = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][d.m];
          const isFirstOfMonth = d.d === 1 || days[0].iso === d.iso;
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => onPickDay(d.iso)}
              aria-label={`${d.d} ${monthShort} — ${d.price}€ orientativo`}
              aria-pressed={isSelected}
              className={`
                relative aspect-square rounded-md border text-xs flex flex-col items-center justify-center
                transition-colors
                ${colorFor(d.price)}
                ${isSelected ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-gray-900" : ""}
              `}
            >
              {isFirstOfMonth && (
                <span className="absolute -top-4 left-0 text-[10px] text-gray-500 font-semibold">
                  {monthShort}
                </span>
              )}
              <span className="font-mono font-semibold leading-none">{d.d}</span>
              <span className="text-[9px] opacity-80 mt-0.5 leading-none">{d.price}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-xs flex-wrap">
        <span className="text-gray-500">Leyenda:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-500/30 border border-green-500/60" />
          <span className="text-green-300">Más barato</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/50" />
          <span className="text-amber-300">Medio</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500/25 border border-red-500/50" />
          <span className="text-red-300">Más caro</span>
        </span>
      </div>
    </div>
  );
}
