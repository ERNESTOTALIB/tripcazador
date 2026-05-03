"use client";

import { useState } from "react";

interface DeepSearchOption {
  from: string;
  to: string;
  city_from: string;
  city_to: string;
  date_out: string;
  date_ret?: string;
  price_eur: number;
  baseline_eur: number;
  savings_eur: number;
  savings_pct: number;
  airline: string;
  stops: number;
  score: number;
  reason: string;
  deal_id?: string;
}

interface DeepSearchResponse {
  query: {
    origin: { city: string; codes: string[] };
    destination: { city: string; codes: string[] };
    date_from: string;
    date_to: string;
    flex_days: number;
  };
  baseline_typical_eur: number;
  options: DeepSearchOption[];
  total_combinations_explored: number;
  total_matched: number;
  cluster_expansion: { origin: string[]; destination: string[] };
  notes: string;
}

const POPULAR_PAIRS: Array<{ from: string; to: string; label: string }> = [
  { from: "Madrid", to: "Bali", label: "Madrid → Bali" },
  { from: "Barcelona", to: "Tokio", label: "Barcelona → Tokio" },
  { from: "Madrid", to: "Nueva York", label: "Madrid → Nueva York" },
  { from: "Madrid", to: "Maldivas", label: "Madrid → Maldivas" },
  { from: "Barcelona", to: "Buenos Aires", label: "Barcelona → Buenos Aires" },
];

const today = new Date();
const defaultFrom = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
  .toISOString().slice(0, 10);
const defaultTo = new Date(today.getTime() + 75 * 24 * 60 * 60 * 1000)
  .toISOString().slice(0, 10);

export default function DeepSearchClient() {
  const [origin, setOrigin] = useState("Madrid");
  const [destination, setDestination] = useState("Bali");
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [flexDays, setFlexDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DeepSearchResponse | null>(null);

  async function runSearch() {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/premium/deep-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          date_from: dateFrom,
          date_to: dateTo,
          flex_days: flexDays,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "search_failed");
        return;
      }
      const data: DeepSearchResponse = await res.json();
      setResults(data);
      // GA4 tracking
      if (typeof window !== "undefined" && (window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
        const w = window as Window & { gtag?: (...args: unknown[]) => void };
        w.gtag?.("event", "deep_search_run", {
          origin,
          destination,
          flex_days: flexDays,
          options_found: data.total_matched,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown_error");
    } finally {
      setLoading(false);
    }
  }

  function pickPopular(p: { from: string; to: string }) {
    setOrigin(p.from);
    setDestination(p.to);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-bold tracking-widest text-slate-600 uppercase mb-1">
              Origen
            </span>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Madrid"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
              required
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-bold tracking-widest text-slate-600 uppercase mb-1">
              Destino
            </span>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Bali"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
              required
              autoComplete="off"
            />
          </label>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="block text-xs font-bold tracking-widest text-slate-600 uppercase mb-1">
              Salida
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base"
              required
            />
          </label>
          <label className="block">
            <span className="block text-xs font-bold tracking-widest text-slate-600 uppercase mb-1">
              Vuelta
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base"
              required
            />
          </label>
          <label className="block">
            <span className="block text-xs font-bold tracking-widest text-slate-600 uppercase mb-1">
              Flex ±días
            </span>
            <select
              value={flexDays}
              onChange={(e) => setFlexDays(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base bg-white"
            >
              <option value={0}>Sin flex (fechas exactas)</option>
              <option value={1}>±1 día</option>
              <option value={3}>±3 días (recomendado)</option>
              <option value={5}>±5 días</option>
              <option value={7}>±7 días (máximo)</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-extrabold py-4 rounded-xl text-base tracking-widest transition disabled:opacity-50"
        >
          {loading ? "CAZANDO..." : "EJECUTAR DEEP SEARCH →"}
        </button>

        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs text-slate-500 self-center mr-1">Populares:</span>
          {POPULAR_PAIRS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => pickPopular(p)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
          <strong>Error:</strong> {error}. Comprueba que origen y destino sean ciudades reconocibles.
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-amber-400 font-bold tracking-widest">
                  RESULTADO DEEP SEARCH
                </div>
                <div className="text-xl font-extrabold mt-1">
                  {results.query.origin.city} → {results.query.destination.city}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-amber-400">
                  {results.total_matched}
                </div>
                <div className="text-xs text-slate-400">opciones halladas</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs pt-3 border-t border-white/10">
              <div>
                <div className="font-bold text-amber-400">
                  {results.total_combinations_explored}
                </div>
                <div className="text-slate-400">combinaciones</div>
              </div>
              <div>
                <div className="font-bold text-amber-400">
                  {results.cluster_expansion.origin.length +
                    results.cluster_expansion.destination.length}
                </div>
                <div className="text-slate-400">aeropuertos</div>
              </div>
              <div>
                <div className="font-bold text-emerald-400">
                  {results.baseline_typical_eur}€
                </div>
                <div className="text-slate-400">precio típico</div>
              </div>
            </div>
          </div>

          {results.options.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-5 text-sm">
              <strong>Sin matches en esta ventana.</strong> {results.notes}
            </div>
          ) : (
            <ol className="space-y-3">
              {results.options.map((opt, i) => (
                <li
                  key={`${opt.from}-${opt.to}-${opt.date_out}-${i}`}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:border-amber-300 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          #{i + 1}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {opt.from} → {opt.to}
                        </span>
                        <span className="text-xs text-slate-500">
                          {opt.airline}
                          {opt.stops > 0 ? ` · ${opt.stops} esc` : " · directo"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mb-2">
                        {opt.date_out}
                        {opt.date_ret ? ` → ${opt.date_ret}` : ""}
                      </div>
                      <div className="text-xs text-slate-500 italic">
                        {opt.reason}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-extrabold text-slate-900">
                        {opt.price_eur}€
                      </div>
                      <div className="text-xs text-emerald-600 font-bold">
                        −{opt.savings_pct}% · ahorras {opt.savings_eur}€
                      </div>
                      {opt.deal_id && (
                        <a
                          href={`/deals/${opt.deal_id}`}
                          className="inline-block mt-2 text-xs bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-3 py-1 rounded transition"
                        >
                          VER →
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <p className="text-xs text-slate-500 text-center pt-2">
            Cluster origen: {results.cluster_expansion.origin.join(", ")} · Cluster destino:{" "}
            {results.cluster_expansion.destination.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
