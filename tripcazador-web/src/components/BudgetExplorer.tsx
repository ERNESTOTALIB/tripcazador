"use client";
/**
 * BudgetExplorer — A3 (May 2026)
 *
 * Slider €100-€2000 + lista de destinos que caben en ese presupuesto.
 * Lee /api/deals con max_price y muestra los destinos disponibles agrupados.
 */
import { useEffect, useState } from "react";

type Deal = {
  id?: string;
  destination?: string;
  city_to?: string;
  origin?: string;
  price?: number;
  price_eur?: number;
  date_out?: string;
  airline?: string;
  booking_url?: string;
};

const PRESETS = [200, 350, 500, 800, 1200, 2000];

export function BudgetExplorer() {
  const [budget, setBudget] = useState(500);
  const [origin, setOrigin] = useState("MAD");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const params = new URLSearchParams({
      max_price: String(budget),
      origin,
      limit: "60",
    });
    fetch(`/api/deals?${params}`)
      .then((r) => (r.ok ? r.json() : { deals: [] }))
      .then((data) => {
        if (!mounted) return;
        setDeals(Array.isArray(data?.deals) ? data.deals : []);
      })
      .catch(() => mounted && setDeals([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [budget, origin]);

  // Group by destination, take cheapest
  const byDest = new Map<string, Deal>();
  for (const d of deals) {
    const dest = d.city_to || d.destination || "?";
    const price = Number(d.price ?? d.price_eur ?? 0);
    const cur = byDest.get(dest);
    const curPrice = Number(cur?.price ?? cur?.price_eur ?? Infinity);
    if (!cur || price < curPrice) byDest.set(dest, d);
  }
  const grouped = Array.from(byDest.values())
    .filter((d) => Number(d.price ?? d.price_eur ?? 0) <= budget)
    .sort((a, b) => Number(a.price ?? a.price_eur ?? 0) - Number(b.price ?? b.price_eur ?? 0));

  return (
    <div className="space-y-6">
      <div className="panel">
        <label className="block text-xs uppercase tracking-wide text-gray-300 mb-2">
          Origen
        </label>
        <div className="flex gap-2 flex-wrap">
          {["MAD", "BCN", "VLC", "BIO", "AGP", "SVQ", "PMI"].map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOrigin(o)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                origin === o
                  ? "bg-amber-400 text-slate-900 border-amber-400"
                  : "bg-slate-800 text-gray-300 border-slate-700 hover:border-amber-400/40"
              }`}
            >
              {o}
            </button>
          ))}
        </div>

        <label className="block text-xs uppercase tracking-wide text-gray-300 mt-6 mb-2">
          Tu presupuesto: <span className="text-amber-400 text-lg font-bold tabular-nums">{budget}€</span>
        </label>
        <input
          type="range"
          min={100}
          max={2000}
          step={50}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full accent-amber-400"
        />
        <div className="flex gap-2 mt-3 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setBudget(p)}
              className={`px-3 py-1 rounded-full text-xs border transition ${
                budget === p
                  ? "bg-amber-400 text-slate-900 border-amber-400"
                  : "bg-slate-800 text-gray-300 border-slate-700 hover:border-amber-400/40"
              }`}
            >
              {p}€
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-amber-400 mb-3">
          {loading ? "Buscando…" : `${grouped.length} destinos caben en ${budget}€`}
        </h2>
        {!loading && grouped.length === 0 && (
          <div className="panel text-center py-10">
            <p className="text-gray-300">No tenemos chollos hasta {budget}€ desde {origin} hoy mismo.</p>
            <p className="text-sm text-gray-400 mt-2">Sube el slider o cambia origen.</p>
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {grouped.slice(0, 24).map((d, i) => {
            const dest = d.city_to || d.destination || "?";
            const price = Number(d.price ?? d.price_eur ?? 0);
            return (
              <a
                key={d.id || i}
                href={d.booking_url || `/deals?destination=${encodeURIComponent(dest)}`}
                target={d.booking_url ? "_blank" : undefined}
                rel={d.booking_url ? "noopener sponsored" : undefined}
                className="panel hover:border-amber-400 transition group"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-bold text-white group-hover:text-amber-400 transition">{dest}</h3>
                  <span className="text-xl font-bold text-amber-400 tabular-nums">{price}€</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {origin} → {dest} {d.airline ? `· ${d.airline}` : ""}
                </p>
                {d.date_out && (
                  <p className="text-xs text-gray-500 mt-1">Salida {d.date_out.slice(0, 10)}</p>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
