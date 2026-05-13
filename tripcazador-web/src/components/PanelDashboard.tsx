"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminWorkerTrigger } from "./AdminWorkerTrigger";

/**
 * PanelDashboard — fase yyy (Real Visitor Truth + Revenue + Subs unified)
 *
 * Cambios vs versión anterior:
 *  - Cloudflare ground-truth: nueva sección con los visitantes/page-views
 *    REALES medidos por Cloudflare a nivel edge. Soluciona "panel marca 5
 *    pero CF dice otra cosa" — el tracker interno solo cuenta visitas que
 *    aceptan cookies/JS, CF cuenta TODO el tráfico HTTP.
 *  - Banner de discrepancia: muestra qué % del tráfico real está siendo
 *    capturado por el tracker interno (típicamente 30–60% por ad-blockers
 *    + consent gate).
 *  - Selector de ventana 24h / 7d / 30d para todos los KPIs.
 *  - Subscribers inline (antes vivía en /admin con admin-token aparte).
 *  - Revenue real desde Travelpayouts API + manual overrides para resto
 *    de partners.
 */

type WindowKey = "h24" | "d7" | "d30";

interface Analytics {
  totals: {
    page_views_24h: number;
    deal_clicks_24h: number;
    searches_24h: number;
    booking_redirects_24h: number;
    unique_visitors_24h: number;
  };
  conversion: {
    click_through_rate: number;
    booking_rate: number;
    estimated_commission_eur: number;
  };
  top_routes: Array<{ route: string; clicks: number }>;
  top_airlines: Array<{ airline: string; clicks: number }>;
  top_paths?: Array<{ path: string; views: number }>;
  top_calcs?: Array<{ calc: string; uses: number }>;
  recent_events: Array<{ ts: string; type: string; meta: string }>;
  hunter: {
    last_run_at: string | null;
    last_run_status: string;
    deals_total: number;
    age_minutes: number;
  };
  source?: string;
}

interface CFTotals {
  requests: number;
  page_views: number;
  unique_visitors: number;
  bandwidth_bytes: number;
  threats_blocked: number;
  cached_requests: number;
}

interface CFData {
  configured: boolean;
  error?: string;
  zone_id?: string;
  windows: { h24: CFTotals; d7: CFTotals; d30: CFTotals };
  timeseries_30d: Array<{ date: string; visitors: number; page_views: number }>;
  top_countries_7d: Array<{ country: string; requests: number }>;
  top_paths_7d: Array<{ path: string; requests: number }>;
  fetched_at: string;
}

interface Health {
  status: string;
  uptime_seconds?: number;
  deals_total?: number;
  price_min?: number;
  last_hunt_minutes_ago?: number;
  version?: string;
}

interface RevenueSource {
  name: string;
  configured: boolean;
  last_24h_eur: number;
  last_7d_eur: number;
  last_30d_eur: number;
  source_type: "api" | "manual_env" | "internal";
  note?: string;
  link?: string;
}

interface RevenueData {
  sources: RevenueSource[];
  totals: { last_24h_eur: number; last_7d_eur: number; last_30d_eur: number };
  fetched_at: string;
}

interface SubsData {
  configured: boolean;
  total: number;
  by_source: Record<string, number>;
  by_day_last_30: Record<string, number>;
  last_subscribed_at: string | null;
  error?: string;
}

const WINDOW_LABEL: Record<WindowKey, string> = {
  h24: "24h",
  d7: "7 días",
  d30: "30 días",
};

function fmtNum(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-ES");
}

function fmtEur(n: number): string {
  return `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function PanelDashboard() {
  const [windowKey, setWindowKey] = useState<WindowKey>("h24");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [cf, setCf] = useState<CFData | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [subs, setSubs] = useState<SubsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [aRes, cRes, hRes, rRes, sRes] = await Promise.all([
          fetch("/api/admin/analytics", { credentials: "same-origin", cache: "no-store" }),
          fetch("/api/admin/cloudflare", { credentials: "same-origin", cache: "no-store" }),
          fetch("/api/health", { cache: "no-store" }),
          fetch("/api/admin/revenue", { credentials: "same-origin", cache: "no-store" }),
          fetch("/api/admin/subscribers", { credentials: "same-origin", cache: "no-store" }),
        ]);
        if (cancelled) return;
        if (aRes.ok) setAnalytics(await aRes.json());
        if (cRes.ok) setCf(await cRes.json());
        if (hRes.ok) setHealth(await hRes.json());
        if (rRes.ok) setRevenue(await rRes.json());
        if (sRes.ok) setSubs(await sRes.json());
        setLastUpdated(new Date());
        setError(null);
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

  const cfActive = !!(cf?.configured && !cf.error);
  const cfWin = cfActive && cf ? cf.windows[windowKey] : null;

  const discrepancy = useMemo(() => {
    if (!cfActive || !analytics || !cf) return null;
    const cfVisitors = cf.windows.h24.unique_visitors;
    const cfPageViews = cf.windows.h24.page_views;
    const internalVisitors = analytics.totals.unique_visitors_24h;
    const internalPageViews = analytics.totals.page_views_24h;
    if (cfVisitors === 0 && internalVisitors === 0) return null;
    const captureRate = cfVisitors > 0 ? internalVisitors / cfVisitors : 0;
    return { cfVisitors, cfPageViews, internalVisitors, internalPageViews, captureRate };
  }, [cf, analytics, cfActive]);

  const revWinKey: "last_24h_eur" | "last_7d_eur" | "last_30d_eur" =
    windowKey === "h24" ? "last_24h_eur" : windowKey === "d7" ? "last_7d_eur" : "last_30d_eur";

  const sparkline = cfActive && cf ? cf.timeseries_30d : [];
  const sparkMax = Math.max(1, ...sparkline.map((p) => p.visitors));

  const subsLast7d = subs ? Object.entries(subs.by_day_last_30 || {}).sort((a, b) => a[0].localeCompare(b[0])).slice(-7).reduce((a, [, v]) => a + v, 0) : 0;
  const subsLast30d = subs ? Object.values(subs.by_day_last_30 || {}).reduce((a, v) => a + v, 0) : 0;
  const subsThisWindow = windowKey === "h24"
    ? (subs ? Object.entries(subs.by_day_last_30 || {}).slice(-1).reduce((a, [, v]) => a + v, 0) : 0)
    : windowKey === "d7" ? subsLast7d : subsLast30d;

  return (
    <div className="space-y-8">
      {/* Header con selector de ventana */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-400">Dashboard owner</h1>
          <p className="text-sm text-gray-400 mt-1">
            {cfActive
              ? "Cloudflare = ground truth · tracker interno = engagement (consentido)"
              : "Tracker interno · auto-refresh 30s"}
            {lastUpdated && (
              <span className="text-gray-600 ml-2">
                · actualizado {lastUpdated.toLocaleTimeString("es-ES")}
              </span>
            )}
          </p>
        </div>
        <div role="tablist" aria-label="Ventana temporal" className="inline-flex rounded-md border border-gray-800 bg-gray-900 p-1">
          {(Object.keys(WINDOW_LABEL) as WindowKey[]).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={windowKey === k}
              onClick={() => setWindowKey(k)}
              className={
                "px-3 py-1.5 text-sm rounded transition-colors " +
                (windowKey === k
                  ? "bg-amber-500 text-gray-900 font-semibold"
                  : "text-gray-400 hover:text-gray-200")
              }
            >
              {WINDOW_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-red-900/20 border border-red-700 rounded-md p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Banner discrepancia tracker vs CF */}
      {discrepancy && discrepancy.cfVisitors > 0 && (
        <div className={
          "rounded-md p-4 border text-sm " +
          (discrepancy.captureRate < 0.3
            ? "bg-red-900/15 border-red-800 text-red-200"
            : discrepancy.captureRate < 0.7
              ? "bg-amber-900/15 border-amber-700 text-amber-200"
              : "bg-emerald-900/15 border-emerald-700 text-emerald-200")
        }>
          <strong className="font-semibold">Diagnóstico tracking 24h:</strong>
          {" "}Cloudflare midió <span className="font-mono font-bold">{fmtNum(discrepancy.cfVisitors)}</span> visitantes únicos y <span className="font-mono font-bold">{fmtNum(discrepancy.cfPageViews)}</span> páginas vistas, mientras el tracker interno capturó <span className="font-mono font-bold">{fmtNum(discrepancy.internalVisitors)}</span> visitantes y <span className="font-mono font-bold">{fmtNum(discrepancy.internalPageViews)}</span> páginas.
          {" "}Tasa de captura: <span className="font-mono font-bold">{(discrepancy.captureRate * 100).toFixed(0)}%</span>.
          {discrepancy.captureRate < 0.3 && " ⚠ Muy baja — revisa que el script /api/track esté firing y la cookie de consentimiento esté funcionando."}
          {discrepancy.captureRate >= 0.3 && discrepancy.captureRate < 0.7 && " Normal: ad-blockers + usuarios que rechazan cookies se pierden."}
          {discrepancy.captureRate >= 0.7 && " Excelente captura."}
        </div>
      )}

      {!cfActive && (
        <div className="rounded-md p-4 border border-amber-700 bg-amber-900/10 text-amber-200 text-sm">
          <strong className="font-semibold">Cloudflare Analytics no configurado.</strong>{" "}
          Sin <code className="bg-gray-900 px-1 rounded">CF_API_TOKEN</code> y <code className="bg-gray-900 px-1 rounded">CF_ZONE_ID</code> en Vercel solo verás los visitantes que aceptan cookies (subestima el tráfico real). Sigue las instrucciones en <code className="bg-gray-900 px-1 rounded">MONITORING_SETUP.md</code>.
          {cf?.error && <div className="mt-2 text-xs text-amber-300/80">Detalle: {cf.error}</div>}
        </div>
      )}

      {/* Hero KPIs — cambian según windowKey */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-label="KPIs principales">
        <KpiCard
          label={`Visitantes únicos (${WINDOW_LABEL[windowKey]})`}
          value={cfWin ? fmtNum(cfWin.unique_visitors) : (analytics ? fmtNum(analytics.totals.unique_visitors_24h) : "—")}
          tone="amber"
          subtitle={cfActive ? "Cloudflare (real)" : "tracker interno"}
        />
        <KpiCard
          label={`Páginas vistas (${WINDOW_LABEL[windowKey]})`}
          value={cfWin ? fmtNum(cfWin.page_views) : (analytics ? fmtNum(analytics.totals.page_views_24h) : "—")}
          tone="amber"
          subtitle={cfActive ? "Cloudflare (real)" : "tracker interno"}
        />
        <KpiCard
          label={`Clicks deals (${WINDOW_LABEL[windowKey]})`}
          value={analytics ? fmtNum(analytics.totals.deal_clicks_24h) : "—"}
          tone="green"
          subtitle={windowKey !== "h24" ? "solo 24h disponibles" : undefined}
        />
        <KpiCard
          label={`Revenue ${WINDOW_LABEL[windowKey]}`}
          value={revenue ? fmtEur(revenue.totals[revWinKey]) : "—"}
          tone="green"
          subtitle={revenue && revenue.totals[revWinKey] === 0 ? "sin partners conectados" : "real cobrado"}
        />
      </section>

      {/* Mini-KPIs secundarios */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <MiniStat
          label="Suscriptores totales"
          value={subs?.configured ? fmtNum(subs.total) : "—"}
          extra={subs?.configured ? `+${subsThisWindow} en ${WINDOW_LABEL[windowKey]}` : undefined}
        />
        <MiniStat
          label="CTR clicks/views"
          value={analytics ? `${(analytics.conversion.click_through_rate * 100).toFixed(2)}%` : "—"}
        />
        <MiniStat
          label="Booking rate"
          value={analytics ? `${(analytics.conversion.booking_rate * 100).toFixed(2)}%` : "—"}
          extra={analytics ? `${fmtNum(analytics.totals.booking_redirects_24h)} redirects/24h` : undefined}
        />
        <MiniStat
          label="Búsquedas (24h)"
          value={analytics ? fmtNum(analytics.totals.searches_24h) : "—"}
        />
      </section>

      {/* Sparkline 30d Cloudflare */}
      {cfActive && sparkline.length > 0 && (
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-5" aria-labelledby="spark-h">
          <div className="flex items-center justify-between mb-3">
            <h2 id="spark-h" className="text-lg font-semibold text-amber-300">
              Visitantes únicos · últimos {sparkline.length} días (Cloudflare)
            </h2>
            <span className="text-xs text-gray-500">
              Pico {fmtNum(sparkMax)} · Hoy {fmtNum(sparkline[sparkline.length - 1]?.visitors ?? 0)}
            </span>
          </div>
          <div className="flex items-end gap-1 h-32" role="img" aria-label="Gráfico de barras visitantes 30 días">
            {sparkline.map((p) => {
              const h = Math.max(2, Math.round((p.visitors / sparkMax) * 124));
              return (
                <div
                  key={p.date}
                  className="flex-1 bg-amber-500/30 hover:bg-amber-400/70 rounded-t transition-colors relative group"
                  style={{ height: `${h}px` }}
                  title={`${p.date}: ${fmtNum(p.visitors)} visitantes, ${fmtNum(p.page_views)} pageviews`}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                    {p.visitors}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-gray-600 font-mono">
            <span>{sparkline[0]?.date}</span>
            <span>{sparkline[Math.floor(sparkline.length / 2)]?.date}</span>
            <span>{sparkline[sparkline.length - 1]?.date}</span>
          </div>
        </section>
      )}

      {/* Estado motor */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-5" aria-labelledby="motor-h">
        <h2 id="motor-h" className="text-lg font-semibold text-amber-300 mb-3">Estado motor de caza</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Stat label="Status" value={health?.status || "?"} good={health?.status === "ok" || health?.status === "healthy"} />
          <Stat label="Deals activos" value={String(health?.deals_total ?? "—")} />
          <Stat
            label="Último escaneo"
            value={health?.last_hunt_minutes_ago != null ? `hace ${Math.round(health.last_hunt_minutes_ago)} min` : "—"}
            good={health?.last_hunt_minutes_ago != null && health.last_hunt_minutes_ago < 360}
          />
          <Stat label="Versión" value={health?.version || "—"} />
        </div>
      </section>

      {/* Revenue detalle por partner */}
      {revenue && (
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-5" aria-labelledby="rev-h">
          <h2 id="rev-h" className="text-lg font-semibold text-amber-300 mb-3">
            Revenue por partner · {WINDOW_LABEL[windowKey]}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left p-2">Partner</th>
                  <th className="text-right p-2">€ ventana</th>
                  <th className="text-right p-2">€ 30d</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-left p-2">Dashboard</th>
                </tr>
              </thead>
              <tbody>
                {revenue.sources.map((s) => (
                  <tr key={s.name} className="border-t border-gray-800">
                    <td className="p-2 text-gray-200">{s.name}</td>
                    <td className="p-2 text-right font-mono text-amber-300">{fmtEur(s[revWinKey])}</td>
                    <td className="p-2 text-right font-mono text-gray-400">{fmtEur(s.last_30d_eur)}</td>
                    <td className="p-2">
                      <span className={
                        "px-2 py-0.5 rounded-full text-xs " +
                        (s.configured
                          ? "bg-green-900/40 text-green-300"
                          : "bg-gray-800 text-gray-500")
                      }>
                        {s.configured ? s.source_type : "no conectado"}
                      </span>
                    </td>
                    <td className="p-2">
                      {s.link && (
                        <a
                          href={s.link}
                          target={s.link.startsWith("/") ? "_self" : "_blank"}
                          rel="noreferrer"
                          className="text-xs text-amber-400 hover:underline"
                        >
                          abrir →
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-700 font-semibold">
                  <td className="p-2 text-amber-200">TOTAL</td>
                  <td className="p-2 text-right font-mono text-amber-200">{fmtEur(revenue.totals[revWinKey])}</td>
                  <td className="p-2 text-right font-mono text-gray-300">{fmtEur(revenue.totals.last_30d_eur)}</td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Partners sin API se rellenan manualmente vía env vars (ver MONITORING_SETUP.md).
          </p>
        </section>
      )}

      {/* Suscriptores newsletter */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-5" aria-labelledby="subs-h">
        <h2 id="subs-h" className="text-lg font-semibold text-amber-300 mb-3">📬 Suscriptores newsletter</h2>
        {!subs?.configured ? (
          <p className="text-sm text-gray-400">
            Backend de suscriptores no responde.{" "}
            {subs?.error && <span className="text-gray-500">({subs.error})</span>}
          </p>
        ) : (
          <>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiInner label="Total" value={fmtNum(subs.total)} />
              <KpiInner label="Últimos 7d" value={`+${fmtNum(subsLast7d)}`} tone={subsLast7d > 0 ? "green" : "gray"} />
              <KpiInner label="Últimos 30d" value={`+${fmtNum(subsLast30d)}`} tone={subsLast30d > 0 ? "green" : "gray"} />
              <KpiInner
                label="Última alta"
                value={subs.last_subscribed_at ? new Date(subs.last_subscribed_at).toLocaleString("es-ES") : "—"}
                small
              />
            </dl>
            {Object.keys(subs.by_source).length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Top fuentes</p>
                <ul className="space-y-1 text-sm">
                  {Object.entries(subs.by_source).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([src, n]) => {
                    const pct = subs.total > 0 ? Math.round((n / subs.total) * 100) : 0;
                    return (
                      <li key={src} className="flex justify-between border-b border-gray-800 pb-1">
                        <span className="text-gray-200 font-mono text-xs">{src}</span>
                        <span className="text-amber-400 tabular-nums">{n} <span className="text-gray-500">({pct}%)</span></span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* Top countries + paths from Cloudflare */}
      {cfActive && cf && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-amber-300 mb-3">Top países (7d) · Cloudflare</h2>
            <ul className="space-y-2 text-sm">
              {(cf.top_countries_7d || []).slice(0, 10).map((c) => (
                <li key={c.country} className="flex justify-between border-b border-gray-800 pb-1">
                  <span className="text-gray-200">{c.country}</span>
                  <span className="text-amber-400 font-semibold tabular-nums">{fmtNum(c.requests)}</span>
                </li>
              ))}
              {!cf.top_countries_7d?.length && (
                <li className="text-gray-500 italic">Sin datos…</li>
              )}
            </ul>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-amber-300 mb-3">Top páginas (7d) · Cloudflare</h2>
            <ul className="space-y-2 text-sm">
              {(cf.top_paths_7d || []).slice(0, 10).map((p, i) => (
                <li key={`${p.path}-${i}`} className="flex justify-between border-b border-gray-800 pb-1 gap-2">
                  <span className="text-gray-200 font-mono text-xs truncate" title={p.path}>{p.path}</span>
                  <span className="text-amber-400 font-semibold tabular-nums shrink-0">{fmtNum(p.requests)}</span>
                </li>
              ))}
              {!cf.top_paths_7d?.length && (
                <li className="text-gray-500 italic">Sin datos…</li>
              )}
            </ul>
          </div>
        </section>
      )}

      {/* Top rutas + aerolíneas (tracker interno, comportamiento) */}
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
        <h2 className="text-lg font-semibold text-amber-300 mb-3">Eventos recientes (tracker interno)</h2>
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
                    <span className={`px-2 py-0.5 rounded-full text-xs ${eventTone(e.type)}`}>{e.type}</span>
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
        <h2 className="text-lg font-semibold text-amber-300 mb-3">Acciones rápidas</h2>
        <div className="mb-4">
          <AdminWorkerTrigger />
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/admin" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm">
            Admin clásico (hunt manual)
          </a>
          <a href="/api/health" target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm">
            /api/health JSON
          </a>
          <a href="/api/admin/cloudflare" target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm">
            CF JSON (raw)
          </a>
          <a href="/api/admin/revenue" target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm">
            Revenue JSON (raw)
          </a>
          <a href="https://dash.cloudflare.com/" target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm">
            Cloudflare Analytics ↗
          </a>
          <a href="https://app.travelpayouts.com/programs" target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm">
            Travelpayouts ↗
          </a>
          <a href="https://github.com/ernestalib/tripcazador/actions" target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm">
            GitHub Actions ↗
          </a>
        </div>
      </section>

      <p className="text-xs text-gray-600 text-center">
        Auto-refresh 30s · Solo accesible para owner · Cloudflare ground truth + tracker interno consentido
      </p>
    </div>
  );
}

function KpiCard({
  label, value, tone = "amber", subtitle,
}: { label: string; value: string | number; tone?: "amber" | "green"; subtitle?: string }) {
  const color = tone === "green" ? "text-green-400" : "text-amber-400";
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-xs uppercase text-gray-500 tracking-wider">{label}</p>
      <p className={`text-3xl font-bold tabular-nums mt-1 ${color}`}>{value}</p>
      {subtitle && <p className="text-[10px] text-gray-600 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function MiniStat({ label, value, extra }: { label: string; value: string; extra?: string }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2">
      <p className="text-[10px] uppercase text-gray-600 tracking-wider">{label}</p>
      <p className="font-mono text-amber-300 mt-0.5">{value}</p>
      {extra && <p className="text-[10px] text-gray-500 mt-0.5">{extra}</p>}
    </div>
  );
}

function KpiInner({
  label, value, tone, small,
}: { label: string; value: string; tone?: "green" | "gray"; small?: boolean }) {
  const color = tone === "green" ? "text-emerald-400" : tone === "gray" ? "text-gray-500" : "text-amber-300";
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className={`${small ? "text-sm" : "text-2xl"} font-bold ${color} font-mono mt-1`}>{value}</dd>
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
  if (type === "newsletter_signup") return "bg-emerald-900/40 text-emerald-300";
  return "bg-gray-800 text-gray-400";
}
