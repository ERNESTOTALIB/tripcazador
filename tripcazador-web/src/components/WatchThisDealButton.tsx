"use client";

/**
 * WatchThisDealButton — SSS314 (19 may 2026)
 *
 * Botón Premium en `/deals/[id]`. Permite al user añadir el deal a su
 * watchlist con un threshold (default 10%). Un cron diario checkeará
 * el precio y avisará si baja >= threshold.
 *
 * Estados UI:
 *  - Free → teaser locked → link /premium
 *  - Premium sin watch para este deal → formulario inline (email + %)
 *  - Premium con watch ya creado → confirmación "Vigilando · -X%"
 *  - Submitting/Error/Success → feedback in-place
 *
 * Email se cachea en localStorage (tc_watch_email) para reuso.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPremiumStatus } from "@/lib/premium";

interface Props {
  dealId: string;
  origin: string;
  destination: string;
  priceEur: number;
  headline?: string;
  airlineName?: string;
  dateOut?: string | null;
  dateRet?: string | null;
}

interface WatchEntry {
  id: string;
  deal_id: string;
  price_when_added: number;
  target_drop_pct: number;
  active: boolean;
  triggered_at: number | null;
}

const EMAIL_LS_KEY = "tc_watch_email";

export function WatchThisDealButton({
  dealId,
  origin,
  destination,
  priceEur,
  headline,
  airlineName,
  dateOut,
  dateRet,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [existingWatch, setExistingWatch] = useState<WatchEntry | null>(null);
  const [email, setEmail] = useState("");
  const [targetDrop, setTargetDrop] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const status = getPremiumStatus();
    setIsPremium(status.active);
    setCustomerId(status.customerId || null);
    setMounted(true);
    try {
      const saved = localStorage.getItem(EMAIL_LS_KEY);
      if (saved) setEmail(saved);
    } catch {
      /* localStorage off */
    }
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        active: boolean;
        customerId?: string;
      };
      setIsPremium(detail.active);
      setCustomerId(detail.customerId || null);
    };
    window.addEventListener("tc:premium-changed", onChange);
    return () => window.removeEventListener("tc:premium-changed", onChange);
  }, []);

  // Buscar watch existente para este deal
  useEffect(() => {
    if (!mounted || !isPremium || !customerId) return;
    let cancelled = false;
    fetch(`/api/premium/watchlist?customer_id=${encodeURIComponent(customerId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ok: boolean; watches?: WatchEntry[] } | null) => {
        if (cancelled || !d || !d.ok) return;
        const w = (d.watches || []).find(
          (x) => x.deal_id === dealId && x.active && !x.triggered_at,
        );
        if (w) setExistingWatch(w);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mounted, isPremium, customerId, dealId]);

  if (!mounted) return null;

  if (!isPremium) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-gray-900 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">👀</span>
          <div className="flex-1">
            <div className="font-semibold text-white text-sm">
              Vigilar este deal
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Te avisamos por email si el precio baja un % que tú elijas.
              Disponible con{" "}
              <Link
                href="/premium?utm_source=watch_deal_teaser"
                className="text-amber-400 font-semibold hover:underline"
              >
                Premium
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (existingWatch) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">✅</span>
          <div className="flex-1">
            <div className="font-semibold text-white text-sm">
              Vigilando este deal · alerta a -{existingWatch.target_drop_pct}%
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Precio observado:{" "}
              <span className="font-semibold text-amber-300">
                {existingWatch.price_when_added}€
              </span>
              . Te avisaremos por email si baja al menos un{" "}
              {existingWatch.target_drop_pct}%.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">🎯</span>
          <div className="flex-1">
            <div className="font-semibold text-white text-sm">
              Watch activado — vigilando el precio.
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Cuando el precio baje ≥ {targetDrop}% te avisamos a{" "}
              <span className="text-amber-300">{email}</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError(
        "No encontramos tu customerId Stripe. Reactiva Premium desde /panel/premium.",
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/premium/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          email: email.trim().toLowerCase(),
          deal_id: dealId,
          origin,
          destination,
          price_when_added: priceEur,
          target_drop_pct: targetDrop,
          headline,
          airline_name: airlineName,
          date_out: dateOut || undefined,
          date_ret: dateRet || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || `error_${res.status}`);
        return;
      }
      try {
        localStorage.setItem(EMAIL_LS_KEY, email.trim().toLowerCase());
      } catch {
        /* off */
      }
      setSuccess(true);
    } catch {
      setError("network_error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto px-5 py-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300 font-semibold text-sm transition"
      >
        👀 Vigilar este deal (Premium) — avísame si baja
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-emerald-500/40 bg-gray-900 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">👀</span>
        <h4 className="font-semibold text-white text-sm">Vigilar este deal</h4>
      </div>
      <p className="text-xs text-gray-400">
        Precio actual:{" "}
        <span className="font-semibold text-amber-300">{Math.round(priceEur)}€</span>
        . Te avisamos cuando baje al menos:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-gray-400 block">
          <span className="block mb-1">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white"
          />
        </label>
        <label className="text-xs text-gray-400 block">
          <span className="block mb-1">Bajada mínima (%)</span>
          <select
            value={targetDrop}
            onChange={(e) => setTargetDrop(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white"
          >
            <option value={5}>5% (sensible)</option>
            <option value={10}>10% (recomendado)</option>
            <option value={15}>15%</option>
            <option value={20}>20%</option>
            <option value={30}>30% (solo grandes drops)</option>
          </select>
        </label>
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/10 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-sm"
        >
          {submitting ? "Activando…" : "Activar watch"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
