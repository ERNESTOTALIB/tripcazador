"use client";

/**
 * PremiumTripPlannerClient — SSS325 (19 may 2026)
 *
 * UI Premium en /panel/premium/trip-planner. User elige destino IATA +
 * mes + nights → llamamos /api/premium/trip-combos → renderiza top 3
 * combos vuelo+hotel ordenados por coste total.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPremiumStatus } from "@/lib/premium";

interface TripCombo {
  flight: {
    id?: string;
    origin?: string;
    destination?: string;
    price_eur?: number;
    date_out?: string;
    date_ret?: string;
    airline_name?: string;
    savings_pct?: number;
  };
  hotel: {
    city: string;
    ppn: number;
    nights: number;
    total_eur: number;
  };
  total_eur: number;
}

interface PlanResponse {
  ok: boolean;
  destination: string;
  month: string;
  nights: number;
  deals_considered: number;
  combos: TripCombo[];
}

export function PremiumTripPlannerClient() {
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [destination, setDestination] = useState("");
  const [month, setMonth] = useState("");
  const [nights, setNights] = useState(5);
  const [data, setData] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getPremiumStatus();
    setIsPremium(s.active);
    setCustomerId(s.customerId || null);
    setMounted(true);
    // Default a mes que viene (siempre futuro)
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    setMonth(next.toISOString().slice(0, 7));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setData(null);
    if (!customerId) {
      setError("Reactiva Premium en /panel/premium.");
      return;
    }
    if (!/^[A-Z]{3}$/.test(destination)) {
      setError("Destino debe ser código IATA de 3 letras (BCN, JFK, TYO…).");
      return;
    }
    setLoading(true);
    try {
      const url = `/api/premium/trip-combos?customer_id=${encodeURIComponent(customerId)}&destination=${encodeURIComponent(destination)}&month=${encodeURIComponent(month)}&nights=${nights}`;
      const res = await fetch(url);
      const d = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      } & Partial<PlanResponse>;
      if (!res.ok || !d.ok) {
        setError(d.error || `error_${res.status}`);
        return;
      }
      setData(d as PlanResponse);
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  if (!isPremium) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-gray-900 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Trip planner combo — Premium
        </h1>
        <p className="text-sm text-gray-400">
          Combinamos los mejores vuelos a un destino con un hotel mid-tier
          para que veas el coste total con un golpe de vista. Sólo Premium.{" "}
          <Link
            href="/premium?utm_source=trip_planner_panel"
            className="text-amber-400 font-semibold hover:underline"
          >
            Activar Premium
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">
          ✈️🏨 Trip planner combo
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Indica destino + mes + noches y combinamos los mejores vuelos con
          el €/noche mid-tier del hotel para que veas el coste total.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-500/10 via-fuchsia-500/5 to-gray-900 p-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-xs text-gray-400 block">
            <span className="block mb-1">Destino (IATA)</span>
            <input
              type="text"
              required
              maxLength={3}
              value={destination}
              onChange={(e) => setDestination(e.target.value.toUpperCase())}
              placeholder="BCN, JFK, TYO…"
              className="w-full px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white uppercase"
            />
          </label>
          <label className="text-xs text-gray-400 block">
            <span className="block mb-1">Mes (YYYY-MM)</span>
            <input
              type="month"
              required
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
            />
          </label>
          <label className="text-xs text-gray-400 block">
            <span className="block mb-1">Noches</span>
            <input
              type="number"
              required
              min={1}
              max={60}
              value={nights}
              onChange={(e) => setNights(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 px-5 py-2 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 disabled:opacity-50 text-white font-semibold text-sm"
        >
          {loading ? "Calculando…" : "✨ Planear viaje"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
          {humanizeError(error)}
        </div>
      )}

      {data && data.combos.length === 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-300">
          No encontramos vuelos a <strong>{data.destination}</strong> en{" "}
          {data.month} entre los {data.deals_considered} deals actuales.
          Prueba otro mes o destino.
        </div>
      )}

      {data && data.combos.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fuchsia-300 mb-3">
            Top {data.combos.length} combos · {data.destination} ·{" "}
            {data.month} · {data.nights} noches
          </h2>
          <ol className="space-y-3">
            {data.combos.map((c, idx) => (
              <ComboCard key={idx} combo={c} idx={idx} />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function humanizeError(e: string): string {
  if (e === "destination_invalid")
    return "Destino debe ser IATA de 3 letras (BCN, JFK, TYO…).";
  if (e === "month_invalid")
    return "Formato de mes inválido. Usa YYYY-MM (ej 2026-09).";
  if (e === "nights_invalid") return "Noches debe estar entre 1 y 60.";
  if (e === "customer_id_invalid")
    return "Tu customerId Stripe no es válido. Reactiva Premium.";
  if (e === "network_error") return "Error de red. Reintenta.";
  return `Error: ${e}`;
}

function ComboCard({ combo: c, idx }: { combo: TripCombo; idx: number }) {
  return (
    <li className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl font-bold text-fuchsia-300 shrink-0">
          #{idx + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold">
            ✈️ {c.flight.origin} → {c.flight.destination}
            {c.flight.airline_name && (
              <span className="text-gray-500 font-normal text-sm ml-2">
                · {c.flight.airline_name}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {c.flight.date_out}
            {c.flight.date_ret && ` → ${c.flight.date_ret}`}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <Cell label="Vuelo" value={`${Math.round(c.flight.price_eur || 0)}€`} />
            <Cell
              label={`Hotel ${c.hotel.nights}n`}
              value={`${c.hotel.total_eur}€`}
              sub={`${c.hotel.ppn}€/n`}
            />
            <Cell
              label="Total combo"
              value={`${c.total_eur}€`}
              accent="text-fuchsia-300"
            />
          </div>
          {c.flight.id && (
            <Link
              href={`/deals/${c.flight.id}`}
              className="mt-3 inline-block text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            >
              Ver vuelo
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

function Cell({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg bg-black/40 border border-gray-800 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className={`text-base font-bold ${accent || "text-white"} mt-0.5`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}
