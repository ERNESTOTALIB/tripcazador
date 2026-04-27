"use client";

import { useState, useEffect } from "react";

/**
 * ManualHuntButton — botón en /admin para disparar un hunt sin SSH (abr-2026r/s).
 *
 * Permite al owner correr el motor desde el navegador, útil cuando:
 *  - El cron de GitHub Actions falla silenciosamente (problema #229).
 *  - Necesitas refrescar `/api/deals` antes de un release / lighthouse audit.
 *  - Quieres validar un cambio en config.py sin esperar al próximo cron.
 *
 * Backend: POST /api/admin/seed con body `{token: <ADMIN_TOKEN>, profile: <preset>}`.
 * El backend ya tiene rate-limit + token check (constant-time compare).
 *
 * UI:
 *  - Token se persiste en localStorage tras primer uso correcto (sólo en /admin).
 *  - Estado de loading con polling de /api/health cada 5s mientras el hunt corre.
 *  - Muestra última ejecución (timestamp + count) basado en /api/health.
 *  - 4 presets disponibles: caribe, asia-luxury, africa-adventure, weekend-europe.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.origin) ||
  "";

const TOKEN_STORAGE_KEY = "tc_admin_token_v1";

const PROFILES = [
  { id: "caribe", label: "Caribe (DEST_CARIBE)", desc: "Cancún, Punta Cana, La Habana" },
  { id: "asia-luxury", label: "Asia Luxury (business)", desc: "HND, NRT, SIN, HKG, BKK" },
  { id: "africa-adventure", label: "Africa Adventure", desc: "CMN, RAK, NBO, JNB" },
  { id: "weekend-europe", label: "Weekend Europe", desc: "Rutas <3h <€100" },
];

interface HealthSnapshot {
  uptime_seconds: number;
  deals_age_minutes: number | null;
  deals_total?: number;
  timestamp: string;
}

export function ManualHuntButton() {
  const [token, setToken] = useState<string>("");
  const [profile, setProfile] = useState<string>("caribe");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthSnapshot | null>(null);

  // Restaurar token de localStorage al montar (solo se accede en /admin que tiene noindex)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) setToken(saved);
  }, []);

  // Polling /api/health cada 30s (más cuando running, menos cuando idle)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const intervalMs = running ? 5000 : 30000;
    async function tick() {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
        if (!res.ok) return;
        const json: HealthSnapshot = await res.json();
        if (!cancelled) setHealth(json);
      } catch {
        /* silencio */
      }
    }
    tick();
    const i = window.setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(i);
    };
  }, [running]);

  async function trigger() {
    if (!token.trim()) {
      setError("Token requerido");
      return;
    }
    setError(null);
    setRunning(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), profile }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 401) {
          setError("Token inválido");
          // Limpia el token guardado para forzar re-entrada
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        } else {
          setError(`HTTP ${res.status} ${text.slice(0, 80)}`);
        }
        return;
      }
      // Token válido — persistir
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
      setLastRunAt(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section
      role="region"
      aria-labelledby="manual-hunt-title"
      className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4"
    >
      <h2
        id="manual-hunt-title"
        className="text-lg font-bold text-white flex items-center gap-2"
      >
        <span aria-hidden="true">🎯</span> Manual hunt trigger
      </h2>
      <p className="text-sm text-gray-400">
        Ejecuta el motor desde aquí cuando el cron de GitHub Actions falle
        o quieras refrescar el catálogo antes de un release.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Admin token</span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            placeholder="ADMIN_TOKEN env var"
            aria-describedby="token-help"
            autoComplete="current-password"
          />
          <span id="token-help" className="text-xs text-gray-600 mt-1 block">
            Se persiste en localStorage tras éxito.
          </span>
        </label>

        <label className="block">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Preset</span>
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="mt-1 w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            {PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — {p.desc}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={trigger}
          disabled={running || !token.trim()}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:cursor-not-allowed text-gray-900 disabled:text-gray-500 font-semibold rounded transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          aria-busy={running}
        >
          {running ? "Cazando..." : "Run hunt now"}
        </button>
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        {lastRunAt && !error && (
          <p className="text-sm text-emerald-400" aria-live="polite">
            ✓ Disparado {new Date(lastRunAt).toLocaleTimeString("es-ES")}
          </p>
        )}
      </div>

      {health && (
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-800 text-sm">
          <div>
            <dt className="text-xs text-gray-500 uppercase">Uptime</dt>
            <dd className="text-white font-mono">
              {Math.floor(health.uptime_seconds / 60)}m
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 uppercase">Last hunt</dt>
            <dd className="text-white font-mono">
              {health.deals_age_minutes != null
                ? `${health.deals_age_minutes}m ago`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 uppercase">Deals</dt>
            <dd
              className={
                "font-mono " +
                ((health.deals_total ?? 0) > 0 ? "text-emerald-400" : "text-red-400")
              }
            >
              {health.deals_total ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 uppercase">Snapshot</dt>
            <dd className="text-gray-400 font-mono text-xs">
              {new Date(health.timestamp).toLocaleTimeString("es-ES")}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}

export default ManualHuntButton;
