"use client";

import { useEffect, useState } from "react";

/**
 * HunterHealthWidget — abr-2026m
 *
 * Widget de auto-refresh para /admin que polea `/api/health` cada 30s y
 * muestra:
 *   - Semáforo verde/ámbar/rojo según `deals_age_minutes`
 *   - Tabla de circuit breakers abiertos
 *   - SHA + version del backend (anclados al footer del widget)
 *
 * Diseño: completamente client-side; no rompe el SSR de /admin (los datos
 * llegan via fetch desde el browser ya autenticado por cookie/token). Si
 * el endpoint falla, mostramos error inline sin tirar el resto del admin.
 *
 * a11y: `role="status"` + `aria-live="polite"` sobre el badge para que
 * lectores anuncien cambios de estado (verde→ámbar) sin interrumpir.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

type HealthLabel = "fresh" | "healthy" | "stale" | "degraded" | "down" | "unknown";

interface HealthPayload {
  status?: string;
  version?: string;
  git_sha?: string;
  uptime_seconds?: number;
  deals_age_minutes?: number | null;
  deals_exists?: boolean;
  breakers?: Record<string, unknown>;
  timestamp?: string;
}

function classify(deals_age_minutes: number | null | undefined): HealthLabel {
  if (deals_age_minutes == null) return "unknown";
  if (deals_age_minutes < 60) return "fresh";
  if (deals_age_minutes < 6 * 60) return "healthy";
  if (deals_age_minutes < 14 * 60) return "stale";
  return "degraded";
}

function badgeColor(label: HealthLabel): string {
  switch (label) {
    case "fresh":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    case "healthy":
      return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
    case "stale":
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    case "degraded":
      return "bg-red-500/20 text-red-300 border-red-500/40";
    case "down":
      return "bg-red-500/30 text-red-200 border-red-500/50";
    default:
      return "bg-gray-700/40 text-gray-300 border-gray-700";
  }
}

function formatAge(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 60 * 24) return `${(minutes / 60).toFixed(1)} h`;
  return `${(minutes / (60 * 24)).toFixed(1)} d`;
}

export function HunterHealthWidget({
  refreshSeconds = 30,
}: {
  refreshSeconds?: number;
}) {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: HealthPayload = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOnce();
    const id = setInterval(fetchOnce, Math.max(5, refreshSeconds) * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refreshSeconds]);

  const label: HealthLabel = error
    ? "down"
    : classify(data?.deals_age_minutes);
  const ageHuman = formatAge(data?.deals_age_minutes);
  const breakers = data?.breakers || {};
  const openBreakers = Object.entries(breakers).filter(
    ([, v]) => typeof v === "object" && (v as { state?: string })?.state === "open",
  );

  return (
    <section
      className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4"
      aria-label="Hunter health monitor"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Hunter health</h2>
        <span
          role="status"
          aria-live="polite"
          aria-label={`Estado del motor: ${label}, datos hace ${ageHuman}`}
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${badgeColor(
            label,
          )}`}
        >
          <span
            aria-hidden="true"
            className={`inline-block w-2 h-2 rounded-full ${
              label === "fresh" || label === "healthy"
                ? "bg-emerald-400"
                : label === "stale"
                ? "bg-amber-400"
                : "bg-red-400"
            }`}
          />
          {label}
        </span>
      </header>

      {loading && !data && (
        <p className="text-sm text-gray-300">Cargando estado…</p>
      )}

      {error && (
        <p
          role="alert"
          className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded px-3 py-2"
        >
          No se pudo contactar /api/health: {error}
        </p>
      )}

      {data && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <dt className="text-gray-300">Última caza</dt>
            <dd className="font-bold text-white tabular-nums">{ageHuman}</dd>
          </div>
          <div>
            <dt className="text-gray-300">Uptime</dt>
            <dd className="font-bold text-white tabular-nums">
              {data.uptime_seconds != null
                ? formatAge(data.uptime_seconds / 60)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-300">Versión</dt>
            <dd className="font-mono text-xs text-amber-300">
              {data.version || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-300">SHA</dt>
            <dd className="font-mono text-xs text-amber-300">
              {data.git_sha || "—"}
            </dd>
          </div>
        </dl>
      )}

      {openBreakers.length > 0 && (
        <div className="border-t border-gray-800 pt-3">
          <h3 className="text-sm font-semibold text-amber-300 mb-2">
            Circuit breakers abiertos ({openBreakers.length})
          </h3>
          <ul className="text-xs text-gray-300 space-y-1">
            {openBreakers.map(([name]) => (
              <li key={name} className="font-mono">
                · {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="text-xs text-gray-300 pt-2 border-t border-gray-800">
        Auto-refresh cada {refreshSeconds}s · datos vía{" "}
        <code className="text-amber-300">/api/health</code>
      </footer>
    </section>
  );
}
