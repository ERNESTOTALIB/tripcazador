"use client";

/**
 * PremiumROIWidget — SSS315 (19 may 2026)
 *
 * Widget grande "Has ahorrado X€ con Premium" en /panel/premium.
 * Hace fetch a /api/premium/roi con el customerId del user y muestra:
 *  - Total ahorrado € (number HUGE)
 *  - Breakdown 30d / 90d / total
 *  - "Tu mayor chollo" (biggest_savings_eur)
 *  - "X triggers desde Y" (storytelling)
 *
 * Esta es la pieza CLAVE de retención. Sin esto el user paga Premium
 * y no sabe si vale la pena. Con esto ve concretamente: "419€
 * recuperados en 3 meses → mi Premium €30 sale rentable 14x".
 */

import { useEffect, useState } from "react";
import { getPremiumStatus } from "@/lib/premium";

interface SavingsSummary {
  total_eur: number;
  count: number;
  last_30d_eur: number;
  last_30d_count: number;
  last_90d_eur: number;
  last_90d_count: number;
  by_source: { alert: number; watch: number };
  avg_per_trigger_eur: number;
  biggest_savings_eur: number;
  first_trigger_at: number | null;
}

interface RecentEntry {
  id: string;
  deal_id: string;
  origin?: string;
  destination?: string;
  savings_eur: number;
  source: "alert" | "watch";
  ts: number;
}

interface Percentile {
  ok: boolean;
  percentile: number;
  total_customers: number;
  label: string;
}

export function PremiumROIWidget() {
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [percentile, setPercentile] = useState<Percentile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const status = getPremiumStatus();
    setIsPremium(status.active);
    setCustomerId(status.customerId || null);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isPremium || !customerId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/premium/roi?customer_id=${encodeURIComponent(customerId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          d:
            | { ok: boolean; summary: SavingsSummary; recent: RecentEntry[] }
            | null,
        ) => {
          if (cancelled || !d || !d.ok) return;
          setSummary(d.summary);
          setRecent(d.recent);
        },
      )
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // SSS326: percentile social proof — fetch en paralelo (no bloquea ROI)
    fetch(`/api/premium/percentile?customer_id=${encodeURIComponent(customerId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Percentile | null) => {
        if (cancelled || !d || !d.ok) return;
        setPercentile(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mounted, isPremium, customerId]);

  if (!mounted || !isPremium) return null;

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 text-sm text-gray-500">
        Calculando tu ahorro Premium…
      </div>
    );
  }

  if (!summary) return null;

  const hasData = summary.count > 0;
  const monthsSince =
    summary.first_trigger_at !== null
      ? Math.max(
          1,
          Math.round((Date.now() - summary.first_trigger_at) / (30 * 86_400_000)),
        )
      : 0;

  // Caso sin data: el user es Premium pero no ha recibido triggers todavía.
  if (!hasData) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-gray-900 p-6">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">
          Tu ROI Premium
        </h2>
        <p className="text-2xl font-bold text-white">
          Aún no has recibido alertas que cuenten ahorros.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Cuando una de tus{" "}
          <a href="/panel/premium/alertas" className="text-amber-400 underline">
            alertas
          </a>{" "}
          o un{" "}
          <a href="/panel/premium/watchlist" className="text-amber-400 underline">
            deal vigilado
          </a>{" "}
          dispare, calcularemos tu ahorro aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-gray-900 p-6 md:p-8">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <h2 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider">
          Has ahorrado con Premium
        </h2>
        {monthsSince > 0 && (
          <span className="text-xs text-gray-500">
            desde hace {monthsSince}{" "}
            {monthsSince === 1 ? "mes" : "meses"}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-5xl md:text-7xl font-bold text-emerald-300">
          {summary.total_eur.toLocaleString("es-ES")}€
        </span>
        <span className="text-lg text-gray-400">total</span>
      </div>
      <div className="mt-1 text-sm text-gray-400">
        {summary.count} {summary.count === 1 ? "alerta disparada" : "alertas disparadas"}{" "}
        · promedio {summary.avg_per_trigger_eur}€ por trigger
      </div>

      {/* SSS326: percentile social proof badge */}
      {percentile && percentile.total_customers >= 5 && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-200">
          <span>{percentile.label}</span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Últimos 30 días" value={`${summary.last_30d_eur}€`} sub={`${summary.last_30d_count} triggers`} />
        <Stat label="Últimos 90 días" value={`${summary.last_90d_eur}€`} sub={`${summary.last_90d_count} triggers`} />
        <Stat
          label="Tu mayor chollo"
          value={`${summary.biggest_savings_eur}€`}
          sub="single trigger"
        />
      </div>

      {summary.by_source.alert > 0 && summary.by_source.watch > 0 && (
        <div className="mt-4 text-xs text-gray-500 flex flex-wrap gap-3">
          <span>
            Via alertas:{" "}
            <span className="text-emerald-300 font-semibold">
              {summary.by_source.alert}€
            </span>
          </span>
          <span>
            Via watchlist:{" "}
            <span className="text-emerald-300 font-semibold">
              {summary.by_source.watch}€
            </span>
          </span>
        </div>
      )}

      {recent.length > 0 && (
        <details className="mt-5">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-amber-400">
            Ver los últimos {recent.length} triggers
          </summary>
          <ul className="mt-3 space-y-2">
            {recent.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 text-xs bg-black/30 rounded-lg px-3 py-2"
              >
                <span className="text-gray-300">
                  {r.origin && r.destination
                    ? `${r.origin} → ${r.destination}`
                    : r.deal_id}{" "}
                  <span className="text-gray-500">
                    · {r.source === "alert" ? "alerta" : "watch"}
                  </span>
                </span>
                <span className="text-emerald-300 font-semibold">
                  +{r.savings_eur}€
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-black/30 border border-emerald-500/20 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className="text-xl font-bold text-white mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}
