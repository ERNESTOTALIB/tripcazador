/**
 * /panel/admin/system-health — SSS420 (May 2026)
 *
 * Dashboard ops consolidado: ping a 10+ endpoints internos, status
 * del backend FastAPI, freshness de deals, deploy state.
 *
 * (E — Internal tooling) Sin esto, Ernesto necesita abrir 6 pestañas
 * para chequear el estado del sistema. Esta página unifica todo.
 *
 * Auth: panel cookie (verifyToken / COOKIE_KEY). Bloqueado por
 * robots.txt + noindex meta.
 *
 * Diseño: cards verticales con badge verde/amarillo/rojo según estado.
 * Re-renderiza cada request (force-dynamic) — los pings son live.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "System Health | TripCazador Admin",
  robots: { index: false, follow: false },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface ProbeResult {
  label: string;
  url: string;
  status: number;
  ok: boolean;
  latencyMs: number;
  bodyHint?: string;
  error?: string;
}

const PROBE_TARGETS: Array<{ label: string; path: string }> = [
  { label: "Home /", path: "/" },
  { label: "Deals listing", path: "/deals" },
  { label: "Premium", path: "/premium" },
  { label: "Blog", path: "/blog" },
  { label: "/api/og?title=test", path: "/api/og?title=test" },
  { label: "/api/calendar (404 expected)", path: "/api/calendar/nonexistent" },
  { label: "Sitemap", path: "/sitemap.xml" },
  { label: "Robots", path: "/robots.txt" },
  { label: "ads.txt", path: "/ads.txt" },
  { label: "RSS", path: "/rss.xml" },
];

async function probe(label: string, url: string): Promise<ProbeResult> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - start;
    const ok = res.status >= 200 && res.status < 400;
    return { label, url, status: res.status, ok, latencyMs };
  } catch (e) {
    const latencyMs = Date.now() - start;
    return {
      label,
      url,
      status: 0,
      ok: false,
      latencyMs,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

interface BackendHealth {
  status?: string;
  deals_exists?: boolean;
  deals_age_minutes?: number;
  uptime_seconds?: number;
  version?: string;
  reachable: boolean;
  error?: string;
}

async function backendHealth(): Promise<BackendHealth> {
  if (!BACKEND_URL) {
    return { reachable: false, error: "NEXT_PUBLIC_API_URL not set" };
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { reachable: false, error: `HTTP ${res.status}` };
    const j = await res.json();
    return {
      reachable: true,
      status: j.status,
      deals_exists: j.deals_exists,
      deals_age_minutes: j.deals_age_minutes,
      uptime_seconds: j.uptime_seconds,
      version: j.version,
    };
  } catch (e) {
    return {
      reachable: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function statusColor(ok: boolean, status: number, label: string): string {
  // /api/calendar/nonexistent debería ser 404 (eso es OK semánticamente)
  if (label.includes("404 expected") && status === 404) {
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  }
  if (ok) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (status > 0 && status < 500)
    return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  return "bg-red-500/20 text-red-300 border-red-500/40";
}

function ageBadge(ageMin: number | undefined): string {
  if (ageMin === undefined) return "bg-gray-500/20 text-gray-300";
  if (ageMin < 60 * 6) return "bg-emerald-500/20 text-emerald-300"; // <6h OK
  if (ageMin < 60 * 12) return "bg-amber-500/20 text-amber-300"; // 6-12h warning
  return "bg-red-500/20 text-red-300"; // >12h alert
}

export default async function SystemHealthPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_KEY)?.value;
  if (!token || !verifyToken(token)) {
    redirect("/panel/login?next=/panel/admin/system-health");
  }

  // Probes en paralelo (~ms cada uno)
  const probes = await Promise.all(
    PROBE_TARGETS.map((t) => probe(t.label, `${SITE_URL}${t.path}`)),
  );
  const backend = await backendHealth();

  const okCount = probes.filter((p) => p.ok || (p.label.includes("404 expected") && p.status === 404)).length;
  const totalProbes = probes.length;
  const allGreen = okCount === totalProbes && backend.reachable;

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-6 text-sm text-slate-400">
        <Link href="/panel" className="hover:text-amber-400">Panel</Link>
        <span className="mx-2">/</span>
        <span>Admin</span>
        <span className="mx-2">/</span>
        <span className="text-slate-200">System Health</span>
      </nav>

      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">🩺 System Health</h1>
          <p className="mt-1 text-sm text-slate-400">
            Estado live de PROD. Refresca esta página para re-probar (cada
            request hace pings nuevos).
          </p>
        </div>
        <div className={`rounded-xl border px-5 py-3 text-center ${allGreen ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" : "bg-amber-500/15 text-amber-300 border-amber-500/40"}`}>
          <div className="text-2xl font-bold">{okCount}/{totalProbes}</div>
          <div className="text-xs uppercase tracking-wide">endpoints OK</div>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-white">Frontend Next.js</h2>
        <div className="space-y-2">
          {probes.map((p) => (
            <div
              key={p.url}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/40 bg-slate-800/30 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">{p.label}</div>
                <div className="truncate text-xs text-slate-500">{p.url}</div>
                {p.error && (
                  <div className="text-xs text-red-400">⚠ {p.error}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{p.latencyMs}ms</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor(p.ok, p.status, p.label)}`}>
                  {p.status || "ERR"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-white">Backend FastAPI (Hetzner VPS)</h2>
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-5">
          {backend.reachable ? (
            <>
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                  REACHABLE
                </span>
                <span className="text-sm text-slate-300">{BACKEND_URL}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <div className="text-xs uppercase text-slate-500">Status</div>
                  <div className="font-mono text-sm text-white">{backend.status ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Deals file</div>
                  <div className="font-mono text-sm text-white">{backend.deals_exists ? "✓ exists" : "✗ missing"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Deals age</div>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 font-mono text-xs ${ageBadge(backend.deals_age_minutes)}`}>
                    {backend.deals_age_minutes !== undefined
                      ? `${Math.round(backend.deals_age_minutes)} min`
                      : "—"}
                  </span>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Uptime</div>
                  <div className="font-mono text-sm text-white">
                    {backend.uptime_seconds
                      ? `${Math.round(backend.uptime_seconds / 3600)}h`
                      : "—"}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <span className="rounded-full border border-red-500/40 bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300">
                UNREACHABLE
              </span>
              {backend.error && (
                <pre className="overflow-auto rounded bg-slate-900 p-3 text-xs text-red-300">
                  {backend.error}
                </pre>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-slate-700/40 bg-slate-800/30 p-5">
        <h2 className="mb-3 text-xl font-bold text-white">Quick links operations</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="https://vercel.com/ernesto-talibs-projects/tripcazador"
            target="_blank"
            rel="noopener"
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 transition-colors hover:border-amber-500/50"
          >
            <div className="text-sm font-bold text-amber-400">Vercel Dashboard</div>
            <div className="text-xs text-slate-400">Deploys + envs + logs</div>
          </a>
          <a
            href="https://github.com/ERNESTOTALIB/tripcazador/actions"
            target="_blank"
            rel="noopener"
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 transition-colors hover:border-amber-500/50"
          >
            <div className="text-sm font-bold text-amber-400">GitHub Actions</div>
            <div className="text-xs text-slate-400">Crons + workflow runs</div>
          </a>
          <a
            href="https://sentry.io"
            target="_blank"
            rel="noopener"
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 transition-colors hover:border-amber-500/50"
          >
            <div className="text-sm font-bold text-amber-400">Sentry</div>
            <div className="text-xs text-slate-400">Error budget + alerts</div>
          </a>
          <Link
            href="/panel/admin/scoring"
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 transition-colors hover:border-amber-500/50"
          >
            <div className="text-sm font-bold text-amber-400">Scoring Feedback</div>
            <div className="text-xs text-slate-400">Alimenta scoring v3 con outcomes</div>
          </Link>
          <Link
            href="/panel/admin/revenue"
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 transition-colors hover:border-amber-500/50"
          >
            <div className="text-sm font-bold text-amber-400">Revenue Dashboard</div>
            <div className="text-xs text-slate-400">Premium MRR + Concierge + partners</div>
          </Link>
          <Link
            href="/panel/concierge"
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 transition-colors hover:border-amber-500/50"
          >
            <div className="text-sm font-bold text-amber-400">Concierge Tickets</div>
            <div className="text-xs text-slate-400">Pedidos pending / in_progress / done</div>
          </Link>
        </div>
      </section>

      <footer className="text-xs text-slate-500">
        Renderizado a las {new Date().toISOString()}. Force-refresca el browser
        para re-probar (cada request hace pings nuevos en paralelo).
      </footer>
    </main>
  );
}
