"use client";

/**
 * HuntersDashboard — fase qqq4
 *
 * Client component que polling /api/admin/hunters-health cada 30s
 * y renderiza KPIs + alertas + distribuciones.
 */

import { useEffect, useState } from "react";

interface HuntersHealth {
  generated_at: string;
  templates: {
    total: number;
    by_region: Record<string, number>;
    by_month: Record<string, number>;
    by_classification: Record<string, number>;
    by_origin: Record<string, number>;
  };
  worker: {
    last_run_iso: string | null;
    last_run_status: string;
    deals_total: number;
    quota_estimates: {
      rapidapi_calls_today: number;
      serpapi_calls_today: number;
      aviationstack_calls_today: number;
    };
  };
  alerts: Array<{ severity: "info" | "warning" | "error"; message: string }>;
}

export default function HuntersDashboard() {
  const [data, setData] = useState<HuntersHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchHealth() {
      try {
        const r = await fetch("/api/admin/hunters-health", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        if (!cancelled) {
          setData(json);
          setLastFetch(new Date());
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "fetch failed");
      }
    }
    fetchHealth();
    const id = setInterval(fetchHealth, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (error && !data) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
        Error cargando datos: {error}
      </div>
    );
  }
  if (!data) {
    return <div className="text-neutral-500">Cargando…</div>;
  }

  const lastRun = data.worker.last_run_iso ? new Date(data.worker.last_run_iso) : null;
  const lastRunHoursAgo = lastRun ? Math.round((Date.now() - lastRun.getTime()) / 3600000) : null;
  const statusColor =
    data.worker.last_run_status === "ok"
      ? "bg-green-100 text-green-800 border-green-300"
      : data.worker.last_run_status === "no-deals"
        ? "bg-amber-100 text-amber-800 border-amber-300"
        : "bg-red-100 text-red-800 border-red-300";

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {data.alerts.length > 0 && (
        <section className="space-y-2">
          {data.alerts.map((a, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 text-sm ${
                a.severity === "error"
                  ? "border-red-300 bg-red-50 text-red-800"
                  : a.severity === "warning"
                    ? "border-amber-300 bg-amber-50 text-amber-800"
                    : "border-sky-300 bg-sky-50 text-sky-800"
              }`}
            >
              <strong className="uppercase tracking-wide">{a.severity}:</strong> {a.message}
            </div>
          ))}
        </section>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card label="Templates seed" value={String(data.templates.total)} hint="Catálogo sintético" />
        <Card
          label="Worker status"
          value={data.worker.last_run_status.toUpperCase()}
          hint={lastRunHoursAgo !== null ? `Hace ${lastRunHoursAgo}h` : "Sin datos"}
          badgeClass={statusColor}
        />
        <Card label="Deals reales" value={String(data.worker.deals_total)} hint="Backend FastAPI" />
        <Card
          label="Última actualización"
          value={lastFetch ? lastFetch.toLocaleTimeString("es-ES") : "—"}
          hint="Auto-refresh 30s"
        />
      </section>

      {/* Trigger hunt */}
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Trigger hunt manual</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Ejecutar el workflow GitHub Actions <code className="rounded bg-neutral-100 px-1">worker.yml</code> on-demand.
        </p>
        <a
          href="https://github.com/ERNESTOTALIB/tripcazador/actions/workflows/worker.yml"
          target="_blank"
          rel="noopener"
          className="mt-3 inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Abrir GitHub Actions →
        </a>
      </section>

      {/* Distribuciones */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Distribution title="Por región" data={data.templates.by_region} />
        <Distribution title="Por origen" data={data.templates.by_origin} top={10} />
        <Distribution title="Por clasificación" data={data.templates.by_classification} />
        <Distribution title="Por mes (próximos 12)" data={data.templates.by_month} top={12} />
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  hint,
  badgeClass,
}: {
  label: string;
  value: string;
  hint?: string;
  badgeClass?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${badgeClass ? `inline-block rounded px-2 py-0.5 text-base border ${badgeClass}` : ""}`}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-neutral-400">{hint}</div>}
    </div>
  );
}

function Distribution({
  title,
  data,
  top = 999,
}: {
  title: string;
  data: Record<string, number>;
  top?: number;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, top);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {entries.map(([k, v]) => (
          <li key={k} className="text-sm">
            <div className="flex justify-between font-medium">
              <span className="truncate">{k}</span>
              <span className="text-neutral-500">{v}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-neutral-100">
              <div
                className="h-1.5 rounded-full bg-amber-500"
                style={{ width: `${(v / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
