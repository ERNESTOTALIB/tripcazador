"use client";

/**
 * PremiumHotelWatchlistClient — SSS323 (19 may 2026)
 *
 * Panel /panel/premium/hotel-watchlist. Lista activos + triggered con
 * comparación price_per_night_baseline vs last_seen_ppn y delete.
 *
 * Para crear nuevos hotel-watches el user usa el WatchThisHotelButton
 * que vive en /hoteles o en cualquier landing con HotelCrossSell.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPremiumStatus } from "@/lib/premium";

interface HotelWatchEntry {
  id: string;
  city: string;
  city_name?: string;
  date_in: string;
  date_out: string;
  price_per_night_baseline: number;
  target_drop_pct: number;
  created_at: number;
  last_checked_at: number | null;
  last_seen_ppn: number | null;
  triggered_at: number | null;
  triggered_ppn?: number;
  active: boolean;
}

export function PremiumHotelWatchlistClient() {
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [watches, setWatches] = useState<HotelWatchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getPremiumStatus();
    setIsPremium(s.active);
    setCustomerId(s.customerId || null);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isPremium || !customerId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/premium/hotel-watchlist?customer_id=${encodeURIComponent(customerId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ok: boolean; watches?: HotelWatchEntry[] } | null) => {
        if (cancelled) return;
        if (!d || !d.ok) {
          setError("network_error");
          return;
        }
        setWatches(d.watches || []);
      })
      .catch(() => {
        if (!cancelled) setError("network_error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mounted, isPremium, customerId]);

  async function onDelete(id: string) {
    if (!customerId) return;
    if (!confirm("¿Eliminar este hotel watch?")) return;
    const res = await fetch(
      `/api/premium/hotel-watchlist?id=${encodeURIComponent(id)}&customer_id=${encodeURIComponent(customerId)}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setWatches((p) => p.filter((w) => w.id !== id));
    } else {
      setError(`delete_failed_${res.status}`);
    }
  }

  if (!mounted) return null;

  if (!isPremium) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-gray-900 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Hotel watch — Premium
        </h1>
        <p className="text-sm text-gray-400">
          Vigila hoteles concretos y recibe email cuando el precio per
          noche baje. Solo Premium.{" "}
          <Link
            href="/premium?utm_source=hotel_watch_panel"
            className="text-amber-400 font-semibold hover:underline"
          >
            Activar Premium
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!customerId) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-gray-900 p-6 text-sm text-gray-300">
        No encontramos tu customerId Stripe. Reactiva desde{" "}
        <Link href="/panel/premium" className="text-amber-400 hover:underline">
          /panel/premium
        </Link>
        .
      </div>
    );
  }

  const triggered = watches.filter((w) => w.triggered_at);
  const active = watches.filter((w) => w.active && !w.triggered_at);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-white">🏨 Hotel watch</h1>
        <p className="text-sm text-gray-400 mt-1">
          Estás vigilando {active.length} hoteles. Te avisamos por email
          cuando el precio per noche baje.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Para añadir hoteles vigilados, busca un hotel en{" "}
          <Link href="/hoteles" className="text-amber-400 hover:underline">
            /hoteles
          </Link>{" "}
          o cualquier landing con cross-sell y pulsa &quot;👀 Vigilar
          precio&quot;.
        </p>
      </header>

      {loading && <div className="text-sm text-gray-500">Cargando…</div>}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {!loading && watches.length === 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm text-gray-400">
            Aún no vigilas ningún hotel. Empieza desde una landing de
            hotel con el botón &quot;👀 Vigilar precio&quot;.
          </p>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Activos ({active.length})
          </h2>
          <ul className="space-y-3">
            {active.map((w) => (
              <HotelWatchCard key={w.id} watch={w} onDelete={() => onDelete(w.id)} />
            ))}
          </ul>
        </section>
      )}

      {triggered.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 mb-3">
            Disparados ({triggered.length}) — bajaron de precio
          </h2>
          <ul className="space-y-3">
            {triggered.map((w) => (
              <HotelWatchCard
                key={w.id}
                watch={w}
                onDelete={() => onDelete(w.id)}
                showTriggered
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function HotelWatchCard({
  watch: w,
  onDelete,
  showTriggered,
}: {
  watch: HotelWatchEntry;
  onDelete: () => void;
  showTriggered?: boolean;
}) {
  const seen = w.last_seen_ppn;
  const move =
    seen !== null && w.price_per_night_baseline > 0
      ? Math.round(((w.price_per_night_baseline - seen) / w.price_per_night_baseline) * 100)
      : null;
  const moveLabel =
    move === null
      ? "—"
      : move > 0
        ? `-${move}%`
        : move < 0
          ? `+${Math.abs(move)}%`
          : "0%";
  const moveColor =
    move === null
      ? "text-gray-500"
      : move > 0
        ? "text-emerald-400"
        : move < 0
          ? "text-rose-400"
          : "text-amber-400";

  return (
    <li className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold">
            🏨 {w.city_name || w.city}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {w.date_in} → {w.date_out}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <span className="text-gray-400">
              Baseline:{" "}
              <span className="text-amber-300 font-semibold">
                {w.price_per_night_baseline}€/n
              </span>
            </span>
            <span className="text-gray-400">
              Visto:{" "}
              {seen !== null ? (
                <span className="text-white font-semibold">{seen}€/n</span>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </span>
            <span className={`font-semibold ${moveColor}`}>{moveLabel}</span>
            <span className="text-gray-500">objetivo ≥ -{w.target_drop_pct}%</span>
          </div>
          {showTriggered && w.triggered_ppn !== undefined && (
            <div className="mt-2 text-xs text-emerald-300">
              🎯 Disparado a {w.triggered_ppn}€/n (
              {new Date(w.triggered_at as number).toLocaleDateString("es-ES")})
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 text-gray-400 shrink-0"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}
