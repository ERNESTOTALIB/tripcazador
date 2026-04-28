"use client";

import { useEffect, useState } from "react";

interface Analytics {
  totals: {
    page_views_24h: number;
    deal_clicks_24h: number;
    searches_24h: number;
    booking_redirects_24h: number;
    unique_visitors_24h: number;
  };
  conversion: {
    click_through_rate: number;       // clicks / page_views
    booking_rate: number;              // bookings / clicks
    estimated_commission_eur: number;  // 3% AOV €120 * bookings
  };
  top_routes: Array<{ route: string; clicks: number }>;
  top_airlines: Array<{ airline: string; clicks: number }>;
  recent_events: Array<{ ts: string; type: string; meta: string }>;
  hunter: {
    last_run_at: string | null;
    last_run_status: string;
    deals_total: number;
    age_minutes: number;
  };
}

interface Health {
  status: string;
  uptime_seconds: number;
  deals_total?: number;
  price_min?: number;
  last_hunt_minutes_ago?: number;
}

export function PanelDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [aRes, hRes] = await Promise.all([
          fetch("/api/admin/analytics", { credentials: "same-origin" }),
          fetch("/api/health"),
        ]);
        if (!cancelled) {
          if (aRes.ok) setAnalytics(await aRes.json());
          if (hRes.ok) setHealth(await hRes.json());
        }
      } catch (e) {
        if (!cancelled) setError(`Error cargando datos: ${(e as Error).message}`);
      }
    }
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-amber-400">Dashboard owner</h1>
        <p className="text-sm text-gray-400 mt-1">
          Métricas en tiempo real (auto-refresh cada 30s)
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-md p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Hero KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-label="KPIs principales">
        <KpiCard
          label="Visitantes 24h"
          value={analytics?.totals.unique_visitors_24h ?? "—"}
          tone="amber"
        />
        <KpiCard
          label="Clicks deals 24h"
          value={analytics?.totals.deal_clicks_24h ?? "—"}
          tone="green"
        />
        <KpiCard
          label="CTR clicks/visit"
          value={analytics ? `${(analytics.conversion.click_through_rate * 100).toFixed(1)}%` : "—"}
          tone="amber"
        />
        <KpiCard
          label="Comisión estimada"
          value={analytics ? `${analytics.conversion.estimated_commission_eur.toFixed(0)}€` : "—"}
          tone="green"
        />
      </section>

      {/* Estado motor */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-5" aria-labelledby="motor-h">
        <h2 id="motor-h" className="text-lg font-semibold text-amber-300 mb-3">Estado motor</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Stat label="Status" value={health?.status || "?"} good={health?.status === "ok" || health?.status === "healthy"} />
          <Stat label="Deals activos" value={String(health?.deals_total ?? "—")} />
          <Stat label="Precio mín" value={health?.price_min ? `${health.price_min}€` : "—"} />
          <Stat label="Último escaneo" value={
            health?.last_hunt_minutes_ago != null
              ? `hace ${Math.round(health.last_hunt_minutes_ago)} min`
              : "—"
          } />
        </div>
      </section>

      {/* Top rutas + aerolíneas */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-amber-300 mb-3">Rutas más clicadas (24h)</h2>
          <ul className="space-y-2 text-sm">
            {(analytics?.top_routes || []).slice(0, 8).map((r) => (
              <li key={r.route} className="flex justify-between border-b border-gray-800 pb-1">
                <span className="text-gray-200 font-mono">{r.route}</span>
                <span className="text-amber-400 font-semibold tabular-nums">{r.clicks}</span>
              </li>
            ))}
            {!analytics?.top_routes?.length && (
              <li className="text-gray-500 italic">Esperando primeros clicks…</li>
            )}
          </ul>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-amber-300 mb-3">Aerolíneas más clicadas (24h)</h2>
          <ul className="space-y-2 text-sm">
            {(analytics?.top_airlines || []).slice(0, 8).map((a) => (
              <li key={a.airline} className="flex justify-between border-b border-gray-800 pb-1">
                <span className="text-gray-200">{a.airline}</span>
                <span className="text-amber-400 font-semibold tabular-nums">{a.clicks}</span>
              </li>
            ))}
            {!analytics?.top_airlines?.length && (
              <li className="text-gray-500 italic">Esperando primeros clicks…</li>
            )}
          </ul>
        </div>
      </section>

      {/* Recent events feed */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-amber-300 mb-3">Eventos recientes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left p-2">Hora</th>
                <th className="text-left p-2">Tipo</th>
                <th className="text-left p-2">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.recent_events || []).slice(0, 20).map((e, i) => (
                <tr key={i} className="border-t border-gray-800">
                  <td className="p-2 text-gray-400 font-mono">{new Date(e.ts).toLocaleTimeString("es-ES")}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${eventTone(e.type)}`}>
                      {e.type}
                    </span>
                  </td>
                  <td className="p-2 text-gray-300 truncate max-w-md">{e.meta}</td>
                </tr>
              ))}
              {!analytics?.recent_events?.length && (
                <tr>
                  <td colSpan={3} className="p-3 text-gray-500 italic text-center">
                    Esperando eventos…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Acciones owner */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-amber-300 mb-3">Acciones</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm">
            Admin clásico (hunt manual)
          </a>
          <a href="/api/health" target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm">
            /api/health JSON
          </a>
          <a href="/api/status" target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm">
            /api/status JSON
          </a>
          <a
            href="https://github.com/ernestalib/tripcazador/actions"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm"
          >
            GitHub Actions
          </a>
        </div>
      </section>

      <p className="text-xs text-gray-600 text-center">
        Datos auto-refrescan cada 30s · TripCazador Panel · Solo accesible para owner
      </p>
    </div>
  );
}

function KpiCard({
  label, value, tone = "amber",
}: { label: string; value: string | number; tone?: "amber" | "green" }) {
  const color = tone === "green" ? "text-green-400" : "text-amber-400";
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-xs uppercase text-gray-500 tracking-wider">{label}</p>
      <p className={`text-3xl font-bold tabular-nums mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className={`mt-1 font-semibold ${good === true ? "text-green-300" : good === false ? "text-red-300" : "text-gray-200"}`}>
        {value}
      </p>
    </div>
  );
}

function eventTone(type: string): string {
  if (type === "deal_click" || type === "booking_redirect") return "bg-green-900/40 text-green-300";
  if (type === "search_submitted") return "bg-amber-900/40 text-amber-300";
  if (type === "page_view") return "bg-gray-800 text-gray-300";
  return "bg-gray-800 text-gray-400";
}
