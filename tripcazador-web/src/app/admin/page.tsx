"use client";

import { useState } from "react";
import { HunterHealthWidget } from "@/components/HunterHealthWidget";
import { ManualHuntButton } from "@/components/ManualHuntButton";
import { SubscribersWidget } from "@/components/SubscribersWidget";
import { GitHubHuntDispatcher } from "@/components/GitHubHuntDispatcher";

// Base de la API (misma lógica que lib/api)
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.origin) ||
  "";

interface Overview {
  timestamp: string;
  deals: {
    total?: number;
    generated_at?: string;
    stats?: {
      total?: number;
      flights?: number;
      hotels?: number;
      by_classification?: Record<string, number>;
      by_region?: Record<string, number>;
      by_cabin?: Record<string, number>;
      price_min?: number;
      price_max?: number;
      price_avg?: number;
      verified_count?: number;
    };
    error?: string;
  };
  engine_flights: {
    exists: boolean;
    rows?: number;
    last_scrape?: string;
    top_routes?: Array<{ route: string; count: number }>;
    error?: string;
  };
  engine_hotels: {
    exists: boolean;
    rows?: number;
    last_scrape?: string;
    top_destinations?: Array<{ destination: string; count: number }>;
    error?: string;
  };
  breakers: Record<string, unknown>;
}

/**
 * Panel admin. No se indexa (robots noindex vía metadata de ruta),
 * pide el token al usuario en el cliente y lo guarda en sessionStorage.
 * Nunca persiste el token en localStorage ni en query string.
 */
export default function AdminPage() {
  const [token, setToken] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem("tc_admin_token") || "";
  });
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API_BASE}/api/admin/overview`, {
        headers: { "X-Admin-Token": token },
        cache: "no-store",
      });
      if (r.status === 401) {
        setError("Token inválido o no autorizado");
        setData(null);
        return;
      }
      if (r.status === 503) {
        // Legacy: versiones antiguas del backend devolvían 503 por ADMIN_TOKEN sin configurar.
        // Ahora se uniforma a 401 para no filtrar estado de config.
        setError("Token inválido o no autorizado");
        setData(null);
        return;
      }
      if (!r.ok) {
        setError(`Error ${r.status}`);
        setData(null);
        return;
      }
      const json = (await r.json()) as Overview;
      setData(json);
      window.sessionStorage.setItem("tc_admin_token", token);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-white">Admin · TripCazador</h1>
        <p className="text-xs text-gray-500 mt-1">
          Este panel no se indexa. El token no se guarda en localStorage.
        </p>
      </header>

      {/* Auth */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="flex gap-2 items-end"
      >
        <div className="flex-1">
          <label
            htmlFor="admin-token"
            className="block text-xs text-gray-400 mb-1"
          >
            ADMIN_TOKEN
          </label>
          <input
            id="admin-token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={!token || loading}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold rounded-lg transition-colors"
        >
          {loading ? "Cargando…" : "Cargar overview"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {/* abr-2026m: Hunter health en vivo (auto-refresh cada 30s).
              Va arriba del overview para que sea lo primero que vea ops. */}
          <HunterHealthWidget refreshSeconds={30} />
          {/* abr-2026r/s: trigger manual del motor sin SSH.
              Útil cuando deals_total=0 y el cron de GitHub Actions está roto. */}
          <ManualHuntButton />
          {/* abr-2026/B4: GitHubHuntDispatcher — dispara el workflow real
              hunter-cron.yml (RapidAPI/SerpAPI) vía GitHub REST. */}
          <GitHubHuntDispatcher />
          {/* abr-2026w: SubscribersWidget — agregados de newsletter sin PII.
              Reusa el token guardado por ManualHuntButton (tc_admin_token_v1). */}
          <SubscribersWidget />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Snapshot: {new Date(data.timestamp).toLocaleString("es-ES")}
            </p>
            <button
              type="button"
              onClick={async () => {
                // Abre el digest en nueva pestaña usando fetch con cabecera X-Admin-Token
                // (evita filtrar el token por query string → Referer/historial/logs).
                try {
                  const r = await fetch(
                    `${API_BASE}/api/admin/digest?format=html&limit=6`,
                    { headers: { "X-Admin-Token": token }, cache: "no-store" },
                  );
                  if (!r.ok) {
                    setError(`Digest: error ${r.status}`);
                    return;
                  }
                  const blob = await r.blob();
                  const url = URL.createObjectURL(blob);
                  const win = window.open(url, "_blank", "noopener,noreferrer");
                  if (!win) setError("Popup bloqueado — permite ventanas");
                  // liberar el blob tras 60s (suficiente para abrir)
                  setTimeout(() => URL.revokeObjectURL(url), 60_000);
                } catch (e) {
                  setError(String(e));
                }
              }}
              className="text-xs text-amber-400 hover:text-amber-300 underline"
            >
              Preview digest semanal ↗
            </button>
          </div>

          {/* KPI cards */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI label="Deals activos" value={data.deals.total ?? 0} />
            <KPI
              label="Vuelos scrapeados"
              value={data.engine_flights.rows ?? 0}
              hint={
                data.engine_flights.last_scrape
                  ? "Último: " +
                    new Date(data.engine_flights.last_scrape).toLocaleDateString(
                      "es-ES",
                    )
                  : ""
              }
            />
            <KPI
              label="Hoteles scrapeados"
              value={data.engine_hotels.rows ?? 0}
              hint={
                data.engine_hotels.last_scrape
                  ? "Último: " +
                    new Date(data.engine_hotels.last_scrape).toLocaleDateString(
                      "es-ES",
                    )
                  : ""
              }
            />
            <KPI
              label="Verified deals"
              value={data.deals.stats?.verified_count ?? 0}
            />
          </section>

          {/* Deal breakdown */}
          {data.deals.stats && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Deals por clasificación">
                <Barlist items={data.deals.stats.by_classification ?? {}} />
              </Card>
              <Card title="Deals por región">
                <Barlist items={data.deals.stats.by_region ?? {}} />
              </Card>
            </section>
          )}

          {/* Top routes / destinos */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Top rutas (vuelos)">
              <ul className="text-sm space-y-1">
                {(data.engine_flights.top_routes ?? []).map((r) => (
                  <li key={r.route} className="flex justify-between">
                    <span className="font-mono text-amber-400">{r.route}</span>
                    <span className="text-gray-400">{r.count}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Top destinos (hoteles)">
              <ul className="text-sm space-y-1">
                {(data.engine_hotels.top_destinations ?? []).map((d) => (
                  <li key={d.destination} className="flex justify-between">
                    <span className="text-white">{d.destination}</span>
                    <span className="text-gray-400">{d.count}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* Circuit breakers */}
          {Object.keys(data.breakers ?? {}).length > 0 && (
            <Card title="Circuit breakers">
              <pre className="text-xs text-gray-300 overflow-x-auto">
                {JSON.stringify(data.breakers, null, 2)}
              </pre>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function KPI({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className="text-2xl font-bold text-white mt-1">
        {typeof value === "number" ? value.toLocaleString("es-ES") : value}
      </div>
      {hint && <div className="text-[11px] text-gray-500 mt-1">{hint}</div>}
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
      <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Barlist({ items }: { items: Record<string, number> }) {
  const entries = Object.entries(items).sort(([, a], [, b]) => b - a);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <ul className="space-y-2 text-sm">
      {entries.map(([k, v]) => (
        <li key={k}>
          <div className="flex justify-between text-xs">
            <span className="text-gray-300">{k}</span>
            <span className="text-gray-500">{v}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-800 mt-1 overflow-hidden">
            <div
              className="h-full bg-amber-500"
              style={{ width: `${(v / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
