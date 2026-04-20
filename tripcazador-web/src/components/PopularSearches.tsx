"use client";
/**
 * TripCazador — PopularSearches
 *
 * Chips clicables con rutas demo. Al clic, despacha un CustomEvent global
 * ("tripcazador:prefill-search") que el SearchBar escucha y usa para
 * prellenar el formulario + disparar la búsqueda en vivo.
 *
 * La fecha por defecto son ~60 días en el futuro (ventana con buenas tarifas
 * visibles y sin riesgo de tarifas agotadas last-minute).
 */

import { useMemo } from "react";

interface Route {
  origin: string;
  destination: string;
  label: string;
  emoji: string;
}

const ROUTES: Route[] = [
  { origin: "MAD", destination: "JFK", label: "Madrid → Nueva York", emoji: "🗽" },
  { origin: "ZRH", destination: "NRT", label: "Zúrich → Tokio", emoji: "🗼" },
  { origin: "BSL", destination: "BKK", label: "Basilea → Bangkok", emoji: "🛕" },
  { origin: "FRA", destination: "DPS", label: "Fráncfort → Bali", emoji: "🌴" },
  { origin: "BCN", destination: "MEX", label: "Barcelona → Ciudad de México", emoji: "🌮" },
  { origin: "VIE", destination: "CUN", label: "Viena → Cancún", emoji: "🏖️" },
  { origin: "MUC", destination: "DXB", label: "Múnich → Dubái", emoji: "🕌" },
  { origin: "BER", destination: "ZNZ", label: "Berlín → Zanzíbar", emoji: "🦁" },
];

export function PopularSearches() {
  // Fecha por defecto: +60 días, en formato YYYY-MM-DD.
  // useMemo para que al re-render no cambie y todas las búsquedas hablen del mismo día.
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().slice(0, 10);
  }, []);

  function trigger(route: Route) {
    const detail = {
      origin: route.origin,
      destination: route.destination,
      date_from: defaultDate,
      cabin: "economy",
    };
    window.dispatchEvent(
      new CustomEvent("tripcazador:prefill-search", { detail }),
    );
  }

  return (
    <section aria-labelledby="popular-searches-heading" className="space-y-4">
      <div className="text-center">
        <h2
          id="popular-searches-heading"
          className="text-sm font-semibold text-amber-400 uppercase tracking-wider"
        >
          Prueba una búsqueda
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Precios reales en vivo entre cientos de aerolíneas. Tarda 5-10 segundos.
        </p>
      </div>
      <div
        className="flex flex-wrap justify-center gap-2"
        role="list"
        aria-label="Rutas populares"
      >
        {ROUTES.map((r) => (
          <button
            key={`${r.origin}-${r.destination}`}
            type="button"
            role="listitem"
            onClick={() => trigger(r)}
            className="glass rounded-full px-4 py-2 text-sm text-gray-100 hover:text-white hover:border-amber-400/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label={`Buscar vuelos ${r.label} el ${defaultDate}`}
          >
            <span aria-hidden="true" className="mr-1">{r.emoji}</span>
            {r.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default PopularSearches;
