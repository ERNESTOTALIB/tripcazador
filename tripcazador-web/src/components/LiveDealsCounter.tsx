/**
 * LiveDealsCounter — SSS399 (21 may 2026)
 *
 * Banner social proof con métricas REALES (no fake) del motor:
 *  - Chollos activos ahora
 *  - Mejor descuento de la semana
 *  - Última caza (timestamp relativo)
 *
 * Server Component, sin hidratación. Recibe los datos de la API.
 * Cuando datos no disponibles, devuelve null (no rompe layout).
 */

import { getDeals } from "@/lib/api";

function formatRelative(ts: number): string {
  const now = Date.now();
  const mins = Math.max(1, Math.round((now - ts) / 60_000));
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.round(hrs / 24);
  return `hace ${days} d`;
}

interface Props {
  variant?: "banner" | "compact";
}

export async function LiveDealsCounter({ variant = "banner" }: Props) {
  let deals: Awaited<ReturnType<typeof getDeals>>["deals"] = [];
  try {
    const resp = await getDeals({ limit: 100 });
    deals = resp.deals;
  } catch {
    return null;
  }
  if (!deals.length) return null;

  const activeCount = deals.length;
  const maxSavings = Math.max(...deals.map((d) => d.savings_pct || 0));
  const sorted = [...deals].sort((a, b) => {
    const tsA = a.found_at ? new Date(a.found_at).getTime() : 0;
    const tsB = b.found_at ? new Date(b.found_at).getTime() : 0;
    return tsB - tsA;
  });
  const latest = sorted[0];
  const latestTs = latest?.found_at ? new Date(latest.found_at).getTime() : Date.now();
  const topDest = deals
    .reduce<Map<string, number>>((map, d) => {
      const k = d.destination || "—";
      map.set(k, (map.get(k) || 0) + 1);
      return map;
    }, new Map());
  const [topDestKey, topDestCount] =
    Array.from(topDest.entries()).sort((a, b) => b[1] - a[1])[0] ?? ["—", 0];

  if (variant === "compact") {
    return (
      <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <strong className="text-white">{activeCount}</strong> chollos activos
        </span>
        <span>
          Top: <strong className="text-amber-300">{topDestKey}</strong> ({topDestCount})
        </span>
        <span>
          Último <strong className="text-white">{formatRelative(latestTs)}</strong>
        </span>
      </div>
    );
  }

  return (
    <section
      aria-label="Estado del motor"
      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-300 uppercase font-bold">
              En vivo
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{activeCount}</p>
          <p className="text-[10px] text-gray-400">chollos activos</p>
        </div>
        <div>
          <p className="text-xs text-amber-300 uppercase font-bold mb-1">
            Mejor descuento
          </p>
          <p className="text-2xl font-bold text-amber-300">-{Math.round(maxSavings)}%</p>
          <p className="text-[10px] text-gray-400">esta semana</p>
        </div>
        <div>
          <p className="text-xs text-cyan-300 uppercase font-bold mb-1">
            Top destino
          </p>
          <p className="text-2xl font-bold text-cyan-300">{topDestKey}</p>
          <p className="text-[10px] text-gray-400">{topDestCount} chollos</p>
        </div>
        <div>
          <p className="text-xs text-fuchsia-300 uppercase font-bold mb-1">
            Última caza
          </p>
          <p className="text-2xl font-bold text-fuchsia-300">{formatRelative(latestTs)}</p>
          <p className="text-[10px] text-gray-400">
            {latest?.origin}→{latest?.destination}
          </p>
        </div>
      </div>
    </section>
  );
}
