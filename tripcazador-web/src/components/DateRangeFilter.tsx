"use client";

/**
 * DateRangeFilter — fase hhh H2 (Apr 2026)
 *
 * Pequeño rango de fechas para /deals. Sincroniza con searchParams (date_from,
 * date_to). Min = hoy. Si solo se pone "from", filtra desde esa fecha. Si solo
 * "to", filtra hasta. Si ambas, filtra entre.
 *
 * UX: dos inputs date side-by-side + botón "Limpiar" cuando hay valor activo.
 */
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function DateRangeFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    setFrom(params.get("date_from") || "");
    setTo(params.get("date_to") || "");
  }, [params]);

  function pushParams(nextFrom: string, nextTo: string) {
    const sp = new URLSearchParams(params.toString());
    if (nextFrom) sp.set("date_from", nextFrom);
    else sp.delete("date_from");
    if (nextTo) sp.set("date_to", nextTo);
    else sp.delete("date_to");
    // Mantener "date" legacy si existía pero limpiar al cambiar rango
    sp.delete("date");
    router.replace(`/deals?${sp.toString()}`, { scroll: false });
  }

  function handleFrom(v: string) {
    setFrom(v);
    pushParams(v, to);
  }
  function handleTo(v: string) {
    setTo(v);
    pushParams(from, v);
  }
  function clear() {
    setFrom("");
    setTo("");
    pushParams("", "");
  }

  // YYYY-MM-DD para el "min" de los inputs (no permitir fechas pasadas)
  const today = new Date().toISOString().slice(0, 10);
  const hasValue = !!(from || to);

  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="deals-date-filter">
      <span className="text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">
        Fechas viaje:
      </span>
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <span className="text-xs text-gray-400">Desde</span>
        <input
          type="date"
          value={from}
          min={today}
          onChange={(e) => handleFrom(e.target.value)}
          className="bg-gray-950 border border-gray-700 rounded-md px-2 py-1 text-sm focus:border-amber-400 focus:outline-none min-h-[36px]"
          aria-label="Fecha de salida desde"
          data-testid="deals-date-from"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <span className="text-xs text-gray-400">Hasta</span>
        <input
          type="date"
          value={to}
          min={from || today}
          onChange={(e) => handleTo(e.target.value)}
          className="bg-gray-950 border border-gray-700 rounded-md px-2 py-1 text-sm focus:border-amber-400 focus:outline-none min-h-[36px]"
          aria-label="Fecha de salida hasta"
          data-testid="deals-date-to"
        />
      </label>
      {hasValue && (
        <button
          type="button"
          onClick={clear}
          className="text-xs text-amber-300 hover:text-amber-200 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-amber-300 px-2 py-1"
          data-testid="deals-date-clear"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
