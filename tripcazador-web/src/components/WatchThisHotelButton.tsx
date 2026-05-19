"use client";

/**
 * WatchThisHotelButton — SSS323 (19 may 2026)
 *
 * Hermano de WatchThisDealButton pero para hoteles. Lo embebemos en
 * HotelCrossSell o landings de hoteles para captura.
 *
 * Estados:
 *  - Free → teaser locked /premium
 *  - Premium → formulario inline (email + fechas + €/noche + threshold)
 *  - Submitting/Error/Success
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPremiumStatus } from "@/lib/premium";

interface Props {
  city: string; // IATA-like (LIS, BCN, etc)
  cityName?: string; // display ("Lisboa")
  defaultDateIn?: string;
  defaultDateOut?: string;
  defaultPpn?: number;
}

const EMAIL_LS_KEY = "tc_watch_email";

export function WatchThisHotelButton({
  city,
  cityName,
  defaultDateIn,
  defaultDateOut,
  defaultPpn = 80,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [dateIn, setDateIn] = useState(defaultDateIn || "");
  const [dateOut, setDateOut] = useState(defaultDateOut || "");
  const [ppn, setPpn] = useState(String(defaultPpn));
  const [drop, setDrop] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getPremiumStatus();
    setIsPremium(s.active);
    setCustomerId(s.customerId || null);
    setMounted(true);
    try {
      const saved = localStorage.getItem(EMAIL_LS_KEY);
      if (saved) setEmail(saved);
    } catch {
      /* off */
    }
  }, []);

  if (!mounted) return null;

  if (!isPremium) {
    return (
      <div className="mt-3 text-xs text-gray-400">
        👀 ¿Quieres que te avisemos si baja el precio en{" "}
        <strong className="text-white">{cityName || city}</strong>?{" "}
        <Link
          href="/premium?utm_source=hotel_watch_teaser"
          className="text-amber-400 hover:underline"
        >
          Hazte Premium
        </Link>
        .
      </div>
    );
  }

  if (success) {
    return (
      <div className="mt-3 text-xs text-emerald-300">
        ✅ Watch activado para {cityName || city}. Te avisaremos si baja{" "}
        {drop}%.
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Reactiva Premium en /panel/premium.");
      return;
    }
    if (dateIn >= dateOut) {
      setError("Las fechas deben estar en orden.");
      return;
    }
    const ppnNum = Number(ppn);
    if (!Number.isFinite(ppnNum) || ppnNum <= 0) {
      setError("Precio por noche inválido.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/premium/hotel-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          email: email.trim().toLowerCase(),
          city,
          city_name: cityName,
          date_in: dateIn,
          date_out: dateOut,
          price_per_night_baseline: ppnNum,
          target_drop_pct: drop,
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
        className="mt-3 text-xs px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300 font-semibold"
      >
        👀 Vigilar precio {cityName || city} (Premium)
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-3 rounded-xl border border-emerald-500/40 bg-gray-900 p-4 space-y-3"
    >
      <h4 className="font-semibold text-white text-sm">
        Vigilar precio en {cityName || city}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-gray-400 block">
          <span className="block mb-1">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
          />
        </label>
        <label className="text-xs text-gray-400 block">
          <span className="block mb-1">€/noche actual estimado</span>
          <input
            type="number"
            required
            min={1}
            max={5000}
            value={ppn}
            onChange={(e) => setPpn(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
          />
        </label>
        <label className="text-xs text-gray-400 block">
          <span className="block mb-1">Entrada</span>
          <input
            type="date"
            required
            value={dateIn}
            onChange={(e) => setDateIn(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
          />
        </label>
        <label className="text-xs text-gray-400 block">
          <span className="block mb-1">Salida</span>
          <input
            type="date"
            required
            value={dateOut}
            onChange={(e) => setDateOut(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
          />
        </label>
        <label className="text-xs text-gray-400 block sm:col-span-2">
          <span className="block mb-1">Bajada mínima (%)</span>
          <select
            value={drop}
            onChange={(e) => setDrop(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
          >
            <option value={5}>5%</option>
            <option value={10}>10% (recomendado)</option>
            <option value={15}>15%</option>
            <option value={20}>20%</option>
            <option value={30}>30%</option>
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
