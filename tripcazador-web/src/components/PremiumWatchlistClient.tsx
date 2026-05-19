"use client";

/**
 * PremiumWatchlistClient — SSS314 (19 may 2026)
 *
 * Panel /panel/premium/watchlist. Lista los watches activos del user
 * Premium con stats (precio actual visto vs precio inicial, target%,
 * estado triggered/active) y botón eliminar.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPremiumStatus } from "@/lib/premium";

interface WatchEntry {
  id: string;
  deal_id: string;
  origin: string;
  destination: string;
  price_when_added: number;
  target_drop_pct: number;
  headline?: string;
  airline_name?: string;
  date_out?: string;
  date_ret?: string;
  created_at: number;
  last_checked_at: number | null;
  last_seen_price: number | null;
  triggered_at: number | null;
  triggered_price?: number;
  active: boolean;
}

export function PremiumWatchlistClient() {
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [watches, setWatches] = useState<WatchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    fetch(`/api/premium/watchlist?customer_id=${encodeURIComponent(customerId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ok: boolean; watches?: WatchEntry[] } | null) => {
        if (cancelled || !d || !d.ok) return;
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
    if (!confirm("¿Eliminar este watch?")) return;
    const res = await fetch(
      `/api/premium/watchlist?id=${encodeURIComponent(id)}&customer_id=${encodeURIComponent(customerId)}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setWatches((prev) => prev.filter((w) => w.id !== id));
    } else {
      setError(`delete_failed_${res.status}`);
    }
  }

  if (!mounted) return null;

  if (!isPremium) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-gray-900 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Watch deals — Premium
        </h1>
        <p className="text-sm text-gray-400">
          Esta sección es solo para suscriptores Premium. Vigila deals
          específicos y recibe email cuando bajen.{" "}
          <Link
            href="/premium?utm_source=watchlist_panel"
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
        No encontramos tu customerId Stripe en este dispositivo. Reactiva
        Premium desde{" "}
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
        <h1 className="text-2xl font-bold text-white">Watch deals</h1>
        <p className="text-sm text-gray-400 mt-1">
          Estás vigilando {active.length} deals. Te avisamos por email cuando
          alguno baje de precio.
        </p>
      </header>

      {loading && (
        <div className="text-sm text-gray-500">Cargando watchlist…</div>
      )}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {!loading && watches.length === 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm text-gray-400">
            No tienes watches todavía. Ve a cualquier{" "}
            <Link href="/deals" className="text-amber-400 hover:underline">
              deal
            </Link>{" "}
            y pulsa &quot;👀 Vigilar este deal&quot; para empezar.
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
              <WatchCard key={w.id} watch={w} onDelete={() => onDelete(w.id)} />
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
              <WatchCard
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

function WatchCard({
  watch: w,
  onDelete,
  showTriggered,
}: {
  watch: WatchEntry;
  onDelete: () => void;
  showTriggered?: boolean;
}) {
  const lastSeen = w.last_seen_price;
  const movePct =
    lastSeen !== null && w.price_when_added > 0
      ? Math.round(
          ((w.price_when_added - lastSeen) / w.price_when_added) * 100,
        )
      : null;
  const moveLabel =
    movePct === null
      ? "—"
      : movePct > 0
        ? `-${movePct}%`
        : movePct < 0
          ? `+${Math.abs(movePct)}%`
          : "0%";
  const moveColor =
    movePct === null
      ? "text-gray-500"
      : movePct > 0
        ? "text-emerald-400"
        : movePct < 0
          ? "text-rose-400"
          : "text-amber-400";

  return (
    <li className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold">
            {w.origin} → {w.destination}
            {w.airline_name && (
              <span className="text-gray-500 font-normal text-sm ml-2">
                · {w.airline_name}
              </span>
            )}
          </div>
          {w.headline && (
            <div className="text-xs text-gray-400 mt-1 truncate">
              {w.headline}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <span className="text-gray-400">
              Inicial:{" "}
              <span className="text-amber-300 font-semibold">
                {w.price_when_added}€
              </span>
            </span>
            <span className="text-gray-400">
              Último visto:{" "}
              {lastSeen !== null ? (
                <span className="text-white font-semibold">{lastSeen}€</span>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </span>
            <span className={`font-semibold ${moveColor}`}>{moveLabel}</span>
            <span className="text-gray-500">
              objetivo ≥ -{w.target_drop_pct}%
            </span>
          </div>
          {showTriggered && w.triggered_price !== undefined && (
            <div className="mt-2 text-xs text-emerald-300">
              🎯 Disparado a {w.triggered_price}€ (
              {new Date(w.triggered_at as number).toLocaleDateString("es-ES")})
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link
            href={`/deals/${w.deal_id}`}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-center"
          >
            Ver deal
          </Link>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 text-gray-400"
          >
            Eliminar
          </button>
        </div>
      </div>
    </li>
  );
}
