"use client";

/**
 * PremiumSecretDealsClient — SSS318 (19 may 2026)
 *
 * Panel /panel/premium/secret. Muestra los error fares y deals
 * CRÍTICO que aparecieron en las últimas 24h — solo Premium.
 *
 * Cada card tiene countdown del tiempo restante antes de salir a
 * /deals público. El user siente la urgencia y la exclusividad.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPremiumStatus } from "@/lib/premium";

interface SecretDeal {
  id?: string;
  classification?: string;
  origin?: string;
  destination?: string;
  city_from?: string;
  city_to?: string;
  airline_name?: string;
  price_eur?: number;
  date_out?: string;
  date_ret?: string;
  headline?: string;
  savings_pct?: number;
  found_at?: string;
  ttl_ms: number;
}

export function PremiumSecretDealsClient() {
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [deals, setDeals] = useState<SecretDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // tick para refrescar countdowns sin volver a fetch
  const [tickMs, setTickMs] = useState(0);

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
    fetch(`/api/premium/secret-deals?customer_id=${encodeURIComponent(customerId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ok: boolean; deals?: SecretDeal[] } | null) => {
        if (cancelled) return;
        if (!d || !d.ok) {
          setError("network_error");
          return;
        }
        setDeals(d.deals || []);
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

  // Refresh countdown cada 30s (no necesitamos precisión a segundos)
  useEffect(() => {
    if (deals.length === 0) return;
    const id = setInterval(() => setTickMs((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [deals.length]);

  if (!mounted) return null;

  if (!isPremium) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-gray-900 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Secret deals — Premium
        </h1>
        <p className="text-sm text-gray-400">
          Cuando encontramos un error fare o un deal CRÍTICO, los Premium
          lo ven AQUÍ durante las primeras 24h antes de salir al listado
          público. Solo Premium.{" "}
          <Link
            href="/premium?utm_source=secret_deals_panel"
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

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-gray-900 p-6">
        <div className="text-xs uppercase tracking-wider text-rose-300 font-bold">
          🔥 Premium exclusive · 24h ventana
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">
          Secret deals — error fares y CRÍTICOS
        </h1>
        <p className="text-sm text-gray-300 mt-2">
          Cuando nuestro hunter detecta un error fare o un deal CRÍTICO,
          aparece aquí <strong className="text-rose-300">primero</strong>{" "}
          durante 24h. Después pasa a {" "}
          <Link href="/deals" className="text-amber-400 hover:underline">
            /deals
          </Link>{" "}
          público. <strong className="text-white">Reserva rápido</strong>{" "}
          — estos chollos se agotan en horas.
        </p>
      </header>

      {loading && (
        <div className="text-sm text-gray-500">Cargando secret deals…</div>
      )}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
          Error cargando los deals. Intenta de nuevo.
        </div>
      )}

      {!loading && deals.length === 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-sm text-gray-300">
            🔍 Ahora mismo no hay error fares secretos. Volverá a poblarse
            cuando el hunter encuentre nuevos chollos críticos.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Mientras tanto puedes ver los CRÍTICOS públicos en{" "}
            <Link href="/deals?classification=CRÍTICO" className="text-amber-400 hover:underline">
              /deals?classification=CRÍTICO
            </Link>
            .
          </p>
        </div>
      )}

      {deals.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map((d, idx) => (
            <SecretDealCard key={d.id || `secret-${idx}`} deal={d} _tick={tickMs} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SecretDealCard({ deal: d, _tick }: { deal: SecretDeal; _tick: number }) {
  // _tick es solo para forzar re-render del countdown
  void _tick;
  const ttlMs = d.ttl_ms;
  const hours = Math.floor(ttlMs / 3_600_000);
  const minutes = Math.floor((ttlMs % 3_600_000) / 60_000);
  const ttlLabel =
    ttlMs <= 0
      ? "Sale a público ahora"
      : hours > 0
        ? `${hours}h ${minutes}min restantes`
        : `${minutes} min restantes`;
  const urgent = ttlMs < 3 * 3_600_000; // <3h

  return (
    <li className="rounded-xl border border-rose-500/40 bg-gray-900 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-rose-300">
          {d.classification === "CRÍTICO" ? "🔥 Error fare" : "⚡ Posible error"}
        </span>
        <span
          className={`text-[10px] uppercase tracking-wider font-bold ${urgent ? "text-rose-400" : "text-amber-400"}`}
        >
          ⏱ {ttlLabel}
        </span>
      </div>
      <div className="text-white font-bold">
        {d.city_from || d.origin} → {d.city_to || d.destination}
      </div>
      {d.airline_name && (
        <div className="text-xs text-gray-400 mt-0.5">{d.airline_name}</div>
      )}
      {d.headline && (
        <div className="text-xs text-gray-300 mt-2 line-clamp-2">{d.headline}</div>
      )}
      <div className="mt-3 flex items-end gap-3 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500">Precio</div>
          <div className="text-2xl font-bold text-amber-300">
            {d.price_eur ? `${Math.round(d.price_eur)}€` : "—"}
          </div>
        </div>
        {typeof d.savings_pct === "number" && d.savings_pct > 0 && (
          <div className="text-emerald-400 font-semibold pb-1">
            -{Math.round(d.savings_pct)}%
          </div>
        )}
      </div>
      {d.date_out && (
        <div className="text-xs text-gray-400 mt-2">
          ✈ {d.date_out}
          {d.date_ret && ` → ${d.date_ret}`}
        </div>
      )}
      {d.id && (
        <Link
          href={`/deals/${d.id}`}
          className="mt-3 inline-block w-full text-center px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-semibold text-sm"
        >
          Ver y reservar →
        </Link>
      )}
    </li>
  );
}
