"use client";

/**
 * PremiumPricePredictorCard — SSS313 (19 may 2026)
 *
 * Componente Premium-only en /deals/[id]: predice "compra ahora vs espera"
 * usando lib/price_predictor.ts (pure function, sin ML).
 *
 * Para users free → teaser locked con link a /premium.
 * Para Premium activos → fetch a /api/premium/price-history para avg,
 *   ejecuta predictPrice() y renderiza verdict + confidence + reasons +
 *   expected_change_pct.
 *
 * Por qué client-side: la decisión depende de "hoy" y queremos
 * deterministic per-user sin volver a ISR la página entera.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPremiumStatus } from "@/lib/premium";
import {
  predictPrice,
  verdictLabel,
  verdictColor,
  type PricePrediction,
} from "@/lib/price_predictor";

interface Props {
  origin: string;
  destination: string;
  cabin?: string;
  currentPrice: number;
  dateOut?: string | null;
}

interface PriceHistoryResp {
  ok: boolean;
  current: number;
  min: number;
  max: number;
  avg: number;
}

export function PremiumPricePredictorCard({
  origin,
  destination,
  cabin = "economy",
  currentPrice,
  dateOut,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [avgPrice, setAvgPrice] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const status = getPremiumStatus();
    setIsPremium(status.active);
    setMounted(true);
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { active: boolean };
      setIsPremium(detail.active);
    };
    window.addEventListener("tc:premium-changed", onChange);
    return () => window.removeEventListener("tc:premium-changed", onChange);
  }, []);

  useEffect(() => {
    if (!mounted || !isPremium) return;
    let cancelled = false;
    setLoading(true);
    const url = `/api/premium/price-history?origin=${encodeURIComponent(
      origin,
    )}&destination=${encodeURIComponent(destination)}&cabin=${encodeURIComponent(
      cabin,
    )}&current=${currentPrice}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: PriceHistoryResp | null) => {
        if (cancelled || !d || !d.ok) return;
        setAvgPrice(d.avg);
        const pred = predictPrice({
          current_price: currentPrice,
          avg_price: d.avg,
          date_out: dateOut || undefined,
        });
        setPrediction(pred);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mounted, isPremium, origin, destination, cabin, currentPrice, dateOut]);

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-500">
        Cargando predictor…
      </div>
    );
  }

  // ─────────── FREE: teaser locked ───────────
  if (!isPremium) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-gray-900 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔮</span>
          <div className="flex-1">
            <h3 className="font-bold text-white text-sm">
              ¿Compro ahora o espero 7 días?
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Nuestro predictor te dice si el precio probablemente subirá o
              bajará antes de tu vuelo. Disponible con{" "}
              <Link
                href="/premium?utm_source=price_predictor_teaser"
                className="text-amber-400 font-semibold hover:underline"
              >
                Premium 9,99 €/mes
              </Link>
              .
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500">
              <span className="px-2 py-1 bg-gray-800 rounded">
                🔥 Compra YA / ⏳ Espera / ≈ Normal
              </span>
              <span className="px-2 py-1 bg-gray-800 rounded">
                Confianza alta / media / baja
              </span>
              <span className="px-2 py-1 bg-gray-800 rounded">
                Cambio esperado %
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────── PREMIUM: loading ───────────
  if (loading || !prediction || avgPrice === null) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-gray-900 p-4 text-sm text-gray-400">
        Calculando predicción Premium…
      </div>
    );
  }

  // ─────────── PREMIUM: prediction ───────────
  const colorClass = verdictColor(prediction.verdict);
  const label = verdictLabel(prediction.verdict);
  const isBuy = prediction.verdict === "compra_ya";
  const isWait = prediction.verdict === "espera";
  const borderClass = isBuy
    ? "border-rose-500/40 bg-rose-500/5"
    : isWait
      ? "border-emerald-500/40 bg-emerald-500/5"
      : "border-amber-500/40 bg-amber-500/5";

  const changeSign = prediction.expected_change_pct >= 0 ? "+" : "";

  return (
    <div className={`rounded-2xl border ${borderClass} p-5`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔮</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-sm">
              Predictor de precio — Premium
            </h3>
            <span className={`text-sm font-bold ${colorClass}`}>{label}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-gray-500 uppercase tracking-wider text-[10px]">
                Confianza
              </div>
              <div className="font-semibold text-white capitalize">
                {prediction.confidence}
              </div>
            </div>
            <div>
              <div className="text-gray-500 uppercase tracking-wider text-[10px]">
                Cambio esperado 7d
              </div>
              <div className={`font-semibold ${colorClass}`}>
                {changeSign}
                {prediction.expected_change_pct}%
              </div>
            </div>
            <div>
              <div className="text-gray-500 uppercase tracking-wider text-[10px]">
                Días al vuelo
              </div>
              <div className="font-semibold text-white">
                {prediction.days_to_flight}d
              </div>
            </div>
          </div>

          {prediction.reasons.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-gray-300">
              {prediction.reasons.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gray-500">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="text-[11px] text-gray-500 mt-3">
            Heurística determinista basada en histórico sintético + días al
            vuelo + día de la semana. Sirve como referencia, no garantía.
          </div>
        </div>
      </div>
    </div>
  );
}
