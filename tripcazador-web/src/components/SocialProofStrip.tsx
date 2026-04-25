import { getDeals } from "@/lib/api";

/**
 * SocialProofStrip — abr-2026l
 *
 * Tira ligera mostrando datos REALES del motor (no fake): nº de chollos
 * activos, precio mínimo y minutos desde el último hunt. Pensada para el
 * top de /deals y /destinos donde refuerza la confianza con un signal
 * verdadero ("estamos vivos, hace 3 min cazamos esto").
 *
 * SSR-only, sin estado client-side. ISR del wrapper page revalida al
 * mismo ritmo que el resto de stats. Si la API no responde, el componente
 * devuelve null (degrade graceful — no rompe layout).
 */

function formatRelativeMinutes(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const minutes = Math.max(1, Math.round((now - then) / 60000));
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.round(hours / 24);
    return `hace ${days} d`;
  } catch {
    return null;
  }
}

export async function SocialProofStrip() {
  let total = 0;
  let cheapest: number | null = null;
  let lastHunt: string | undefined;
  let verified = 0;
  try {
    const data = await getDeals({ limit: 1 });
    total = data.stats?.total ?? 0;
    cheapest = data.stats?.price_min && data.stats.price_min > 0 ? data.stats.price_min : null;
    lastHunt = data.generated_at;
    verified = data.stats?.verified_count ?? 0;
  } catch {
    return null;
  }

  if (total === 0) return null;

  const relative = formatRelativeMinutes(lastHunt);

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Estado en tiempo real del motor"
      className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-300 bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3"
    >
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-block w-2 h-2 rounded-full bg-emerald-400 pulse-ring"
          aria-hidden="true"
        />
        <strong className="text-white tabular-nums">{total}</strong>
        <span>chollos activos</span>
      </span>
      {cheapest !== null && (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true">💸</span>
          <span>desde</span>
          <strong className="text-amber-300 tabular-nums">€{Math.round(cheapest)}</strong>
        </span>
      )}
      {verified > 0 && (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true">✅</span>
          <strong className="text-white tabular-nums">{verified}</strong>
          <span>verificados</span>
        </span>
      )}
      {relative && (
        <span className="inline-flex items-center gap-2 text-gray-300">
          <span aria-hidden="true">🛰️</span>
          <span>última caza {relative}</span>
        </span>
      )}
    </aside>
  );
}
