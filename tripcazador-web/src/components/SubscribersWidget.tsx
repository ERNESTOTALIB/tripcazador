"use client";

import { useState, useEffect } from "react";

/**
 * SubscribersWidget — abr-2026w. Widget admin que muestra estadísticas
 * agregadas de la newsletter sin exponer PII (emails). Lo monta /admin
 * junto con HunterHealthWidget + ManualHuntButton.
 *
 * Backend: GET /api/admin/subscribers (requiere X-Admin-Token).
 *
 * Reusa el token guardado por ManualHuntButton (`tc_admin_token_v1`) para
 * evitar pedirlo dos veces en la misma sesión. Si no hay token guardado el
 * widget se queda en estado "introduce token" para no leakear el endpoint.
 *
 * Refresh: polling cada 60s (admin-only, bajo coste; no inunda backend).
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.origin) ||
  "";

const TOKEN_STORAGE_KEY = "tc_admin_token_v1";

interface SubscribersStats {
  total: number;
  by_source: Record<string, number>;
  by_day_last_30: Record<string, number>;
  last_subscribed_at: string | null;
}

export function SubscribersWidget() {
  const [token, setToken] = useState<string>("");
  const [stats, setStats] = useState<SubscribersStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) setToken(saved);
  }, []);

  // Auto-fetch cuando el token llega
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/admin/subscribers?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          if (res.status === 401) {
            setError("Token inválido");
          } else {
            setError(`HTTP ${res.status}`);
          }
          return;
        }
        const json = (await res.json()) as SubscribersStats;
        if (!cancelled) setStats(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const i = window.setInterval(load, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(i);
    };
  }, [token]);

  // Cuando no hay token: mostrar input mínimo para introducirlo (reutiliza
  // localStorage de ManualHuntButton)
  if (!token) {
    return (
      <section
        role="region"
        aria-labelledby="subs-title"
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3"
      >
        <h2 id="subs-title" className="text-lg font-bold text-white">
          📬 Suscriptores newsletter
        </h2>
        <p className="text-sm text-gray-400">
          Introduce el admin token (se guarda en localStorage tras éxito).
        </p>
        <input
          type="password"
          placeholder="ADMIN_TOKEN"
          onChange={(e) => setToken(e.target.value)}
          className="w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          aria-label="Admin token para subscribers"
          autoComplete="current-password"
        />
      </section>
    );
  }

  // Top 5 sources por count (descendente)
  const topSources = stats
    ? Object.entries(stats.by_source).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];

  // Total últimos 7d (suma de by_day_last_30 últimos 7)
  const last7Days = stats
    ? Object.entries(stats.by_day_last_30)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-7)
    : [];
  const total7d = last7Days.reduce((acc, [, v]) => acc + v, 0);

  return (
    <section
      role="region"
      aria-labelledby="subs-title"
      className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2
          id="subs-title"
          className="text-lg font-bold text-white flex items-center gap-2"
        >
          <span aria-hidden="true">📬</span> Suscriptores newsletter
        </h2>
        {loading && (
          <span className="text-xs text-gray-500" aria-live="polite">
            Refrescando…
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {stats && !error && (
        <>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">
                Total
              </dt>
              <dd className="text-3xl font-bold text-amber-300 font-mono">
                {stats.total}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">
                Últimos 7d
              </dt>
              <dd
                className={
                  "text-3xl font-bold font-mono " +
                  (total7d > 0 ? "text-emerald-400" : "text-gray-500")
                }
              >
                +{total7d}
              </dd>
            </div>
            <div className="col-span-2 md:col-span-1">
              <dt className="text-xs text-gray-500 uppercase tracking-wide">
                Último alta
              </dt>
              <dd className="text-sm text-gray-300 font-mono">
                {stats.last_subscribed_at
                  ? new Date(stats.last_subscribed_at).toLocaleString("es-ES")
                  : "—"}
              </dd>
            </div>
          </dl>

          {topSources.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Top sources (formularios)
              </p>
              <ul className="space-y-1">
                {topSources.map(([src, n]) => {
                  const pct = stats.total > 0
                    ? Math.round((n / stats.total) * 100)
                    : 0;
                  return (
                    <li
                      key={src}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-300 truncate font-mono text-xs">
                        {src}
                      </span>
                      <span className="text-gray-500 ml-3 shrink-0">
                        {n} <span className="text-gray-600">({pct}%)</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {last7Days.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Últimos 7 días
              </p>
              <div className="flex items-end gap-1 h-12">
                {last7Days.map(([day, n]) => {
                  const max = Math.max(1, ...last7Days.map((x) => x[1]));
                  const h = Math.max(4, Math.round((n / max) * 48));
                  return (
                    <div
                      key={day}
                      className="flex-1 bg-amber-500/30 hover:bg-amber-400/60 transition-colors rounded-t relative group"
                      style={{ height: `${h}px` }}
                      title={`${day}: ${n}`}
                      aria-label={`${day}: ${n} suscriptores`}
                    >
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {n}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default SubscribersWidget;
