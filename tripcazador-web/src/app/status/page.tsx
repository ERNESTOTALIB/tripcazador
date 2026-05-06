import type { Metadata } from "next";
import { SectionHero } from "@/components/SectionHero";

export const metadata: Metadata = {
  title: "Status — TripCazador",
  description: "Estado en tiempo real de los servicios TripCazador: web, API, hunter, Instagram bot.",
  alternates: { canonical: "/status" },
};

export const dynamic = "force-dynamic";
export const revalidate = 60;

type ServiceStatus = {
  name: string;
  url?: string;
  ok: boolean;
  latency_ms?: number;
  note?: string;
};

async function probe(name: string, url: string, opts?: { matchText?: string; timeoutMs?: number }): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(opts?.timeoutMs ?? 6000),
      cache: "no-store",
      headers: { "User-Agent": "TripCazador-Status/1.0" },
    });
    const latency = Date.now() - start;
    if (!r.ok) return { name, url, ok: false, latency_ms: latency, note: `HTTP ${r.status}` };
    if (opts?.matchText) {
      const txt = await r.text();
      if (!txt.includes(opts.matchText)) return { name, url, ok: false, latency_ms: latency, note: "content mismatch" };
    }
    return { name, url, ok: true, latency_ms: latency };
  } catch (e) {
    return { name, url, ok: false, note: e instanceof Error ? e.message : "fetch failed" };
  }
}

async function getStatuses(): Promise<ServiceStatus[]> {
  const base = "https://tripcazador.com";
  const checks = await Promise.all([
    probe("Web (home)", `${base}/`, { matchText: "TripCazador" }),
    probe("API deals", `${base}/api/deals?limit=1`),
    probe("API health", `${base}/api/health`),
    probe("API trends", `${base}/api/trends`),
    probe("Sitemap", `${base}/sitemap.xml`),
    probe("Instagram cron", "https://api.github.com/repos/ERNESTOTALIB/tripcazador/actions/workflows/instagram-publish.yml/runs?per_page=1", { timeoutMs: 8000 }),
  ]);
  return checks;
}

export default async function StatusPage() {
  const services = await getStatuses();
  const allOk = services.every((s) => s.ok);
  const okCount = services.filter((s) => s.ok).length;

  return (
    <>
      <SectionHero
        title={allOk ? "🟢 Todos los sistemas operativos" : "🟡 Algunos sistemas con incidencias"}
        subtitle={`${okCount}/${services.length} servicios verde · auto-refresh cada 60s`}
        size="compact"
      />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-3">
        {services.map((s) => (
          <div
            key={s.name}
            className={`panel ${s.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"}`}
          >
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span aria-hidden="true">{s.ok ? "🟢" : "🔴"}</span>
                <span className="font-bold text-white">{s.name}</span>
              </div>
              <div className="text-xs text-gray-400 tabular-nums">
                {s.ok ? `${s.latency_ms}ms` : s.note || "down"}
              </div>
            </div>
            {s.url && <p className="text-[10px] text-gray-500 mt-1 truncate">{s.url}</p>}
          </div>
        ))}
        <div className="panel">
          <p className="text-xs text-gray-400">
            Última verificación: {new Date().toISOString()}. Para incidencias contacta{" "}
            <a className="text-amber-400 underline" href="mailto:soporte@tripcazador.com">soporte@tripcazador.com</a>.
          </p>
        </div>
      </main>
    </>
  );
}
