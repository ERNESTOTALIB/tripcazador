"use client";
/**
 * OfflineDealsList — SSS425 (23 may 2026)
 *
 * Client component que lee /deals-latest.json (precacheado por sw-pwa.js)
 * y muestra hasta 50 deals. Tolera fallo: si no hay JSON cacheado,
 * muestra mensaje "intenta reconectar".
 */
import { useEffect, useState } from "react";

interface MiniDeal {
  id?: string;
  origin?: string;
  destination?: string;
  city_to?: string;
  country_to?: string;
  price_eur?: number;
  savings_pct?: number;
  date_out?: string;
  date_ret?: string;
  airline_name?: string;
}

interface DealsLatest {
  deals?: MiniDeal[];
  generated_at?: string;
}

export function OfflineDealsList() {
  const [deals, setDeals] = useState<MiniDeal[] | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/deals-latest.json", { cache: "force-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j: DealsLatest = await res.json();
        if (cancelled) return;
        setDeals(Array.isArray(j.deals) ? j.deals.slice(0, 50) : []);
        setGeneratedAt(j.generated_at || null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 text-center text-sm text-red-300">
        No hay deals cacheados disponibles. Reintenta cuando recuperes
        conexión.
      </div>
    );
  }

  if (deals === null) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 text-center text-sm text-slate-400">
        Cargando deals cacheados…
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 text-center text-sm text-slate-400">
        No hay deals cacheados. Vuelve a la home cuando reconectes.
      </div>
    );
  }

  return (
    <section>
      {generatedAt && (
        <p className="mb-3 text-xs text-slate-500">
          Última actualización: {new Date(generatedAt).toLocaleString("es-ES")}
        </p>
      )}
      <ul className="space-y-2">
        {deals.map((d, i) => (
          <li
            key={d.id ?? i}
            className="rounded-lg border border-slate-700 bg-slate-800/40 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white">
                  {d.origin || "—"} → {d.city_to || d.destination || "—"}
                  {d.country_to ? ` (${d.country_to})` : ""}
                </div>
                <div className="mt-1 truncate text-xs text-slate-400">
                  {d.airline_name || "—"}
                  {d.date_out ? ` · ${d.date_out}` : ""}
                  {d.date_ret ? ` → ${d.date_ret}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-bold text-white">
                  {Math.round(d.price_eur ?? 0)}€
                </div>
                {typeof d.savings_pct === "number" && d.savings_pct > 0 && (
                  <div className="text-xs text-amber-400">
                    -{Math.round(d.savings_pct)}%
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default OfflineDealsList;
