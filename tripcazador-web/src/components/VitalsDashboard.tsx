"use client";

/**
 * VitalsDashboard — SSS257 (16 may 2026)
 *
 * Client-side fetch from /api/admin/vitals (auth cookie).
 *
 * Renders:
 *  - Overall p75 cards (LCP/CLS/INP/FCP/TTFB) with rating color
 *  - By-page table sorted by sample count desc (top 30)
 *  - Sample count + generated_at timestamp
 *  - Refresh button manual
 */
import { useEffect, useState, useCallback } from "react";

type Rating = "good" | "needs-improvement" | "poor" | "no-data";

interface Thresholds {
  good: number;
  needs: number;
  unit: string;
}

interface PageRow {
  path: string;
  samples: number;
  p75: Record<string, number | null>;
}

interface VitalsApiResponse {
  by_page: PageRow[];
  overall: Record<string, number | null>;
  thresholds: Record<string, Thresholds>;
  sample_count: number;
  generated_at: string;
  note?: string;
}

const METRIC_ORDER = ["LCP", "INP", "CLS", "FCP", "TTFB"] as const;

function classify(metric: string, value: number | null, t?: Thresholds): Rating {
  if (value === null || value === undefined || !t) return "no-data";
  if (value <= t.good) return "good";
  if (value <= t.needs) return "needs-improvement";
  return "poor";
}

function formatValue(name: string, v: number | null, t?: Thresholds): string {
  if (v === null || v === undefined) return "—";
  if (!t) return String(v);
  if (t.unit === "ms") return `${Math.round(v)}ms`;
  if (t.unit === "score") return v.toFixed(3);
  return String(v);
}

const RATING_COLOR: Record<Rating, string> = {
  good: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  "needs-improvement": "bg-amber-500/10 text-amber-300 border-amber-500/30",
  poor: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  "no-data": "bg-gray-700/30 text-gray-500 border-gray-700",
};

export default function VitalsDashboard() {
  const [data, setData] = useState<VitalsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/vitals", { cache: "no-store" });
      if (!r.ok) {
        if (r.status === 401) throw new Error("No autorizado — re-login.");
        throw new Error(`HTTP ${r.status}`);
      }
      const j = (await r.json()) as VitalsApiResponse;
      setData(j);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return <div className="text-sm text-gray-400">Cargando…</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
        {error}
        <button
          onClick={load}
          className="ml-3 underline hover:text-rose-100"
        >
          reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { overall, by_page, thresholds, sample_count, generated_at, note } = data;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-400">
          {sample_count.toLocaleString()} samples · generado{" "}
          {new Date(generated_at).toLocaleString("es-ES")}
        </div>
        <button
          onClick={load}
          className="rounded-md border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/10"
        >
          ↻ Refrescar
        </button>
      </div>

      {note && (
        <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-4 text-sm text-gray-400">
          {note}
        </div>
      )}

      {/* Overall p75 cards */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Overall p75 (todas las páginas)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {METRIC_ORDER.map((m) => {
            const v = overall[m] ?? null;
            const t = thresholds[m];
            const rating = classify(m, v, t);
            return (
              <div
                key={m}
                className={`rounded-xl border px-4 py-3 ${RATING_COLOR[rating]}`}
              >
                <div className="text-[11px] uppercase tracking-wider opacity-70">{m}</div>
                <div className="mt-1 text-2xl font-bold">{formatValue(m, v, t)}</div>
                {t && (
                  <div className="mt-1 text-[10px] opacity-60">
                    good ≤ {t.unit === "score" ? t.good : `${t.good}${t.unit}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Per-page table */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">
          Por página (top {by_page.length})
        </h2>
        {by_page.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-center text-sm text-gray-400">
            Aún no hay samples. Web Vitals tardan unos minutos en empezar a llegar
            después de tráfico real.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Página</th>
                  <th className="px-3 py-2 text-right">Samples</th>
                  {METRIC_ORDER.map((m) => (
                    <th key={m} className="px-3 py-2 text-right">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {by_page.map((row) => (
                  <tr key={row.path} className="hover:bg-gray-900/40">
                    <td className="px-3 py-2 font-mono text-xs text-gray-300 break-all">
                      {row.path}
                    </td>
                    <td className="px-3 py-2 text-right text-amber-300 font-semibold">
                      {row.samples}
                    </td>
                    {METRIC_ORDER.map((m) => {
                      const v = row.p75[m] ?? null;
                      const t = thresholds[m];
                      const rating = classify(m, v, t);
                      return (
                        <td
                          key={m}
                          className={`px-3 py-2 text-right text-xs ${
                            rating === "good"
                              ? "text-emerald-300"
                              : rating === "needs-improvement"
                                ? "text-amber-300"
                                : rating === "poor"
                                  ? "text-rose-300"
                                  : "text-gray-500"
                          }`}
                        >
                          {formatValue(m, v, t)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
