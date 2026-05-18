"use client";

/**
 * PremiumPriceHistoryChart — SSS302 (18 may 2026)
 *
 * Chart 30-day price-history Premium-only en página de deal.
 * Para users free muestra un teaser locked. Para Premium hace fetch
 * a /api/premium/price-history y renderiza un sparkline SVG inline
 * + min/avg/max + verdict (low/fair/high).
 *
 * No usa Chart.js para evitar dep size — SVG nativo basta.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPremiumStatus } from "@/lib/premium";

interface PriceHistoryPoint {
  date: string;
  price_eur: number;
}

interface PriceHistoryData {
  current: number;
  min: number;
  max: number;
  avg: number;
  verdict: "low" | "fair" | "high";
  points: PriceHistoryPoint[];
}

interface Props {
  origin: string;
  destination: string;
  cabin?: string;
  currentPrice: number;
}

export function PremiumPriceHistoryChart({
  origin,
  destination,
  cabin = "economy",
  currentPrice,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [data, setData] = useState<PriceHistoryData | null>(null);
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
    const url = `/api/premium/price-history?origin=${origin}&destination=${destination}&cabin=${cabin}&current=${currentPrice}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d || !d.ok) return;
        setData(d as PriceHistoryData);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mounted, isPremium, origin, destination, cabin, currentPrice]);

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-500">
        Cargando histórico…
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-gray-900 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div className="flex-1">
            <h3 className="font-bold text-white text-sm">Histórico de precios 30 días</h3>
            <p className="text-xs text-gray-400 mt-1">
              Mira la curva de los últimos 30 días para saber si comprar
              ahora o esperar. Disponible con{" "}
              <Link
                href="/premium?utm_source=price_history_teaser"
                className="text-amber-400 font-semibold hover:underline"
              >
                Premium 2,99 €/mes
              </Link>
              .
            </p>
            <div className="mt-3 flex gap-2 text-[11px] text-gray-500">
              <span className="px-2 py-1 bg-gray-800 rounded">Min · Med · Max</span>
              <span className="px-2 py-1 bg-gray-800 rounded">Verdict (low/fair/high)</span>
              <span className="px-2 py-1 bg-gray-800 rounded">Sparkline 30 días</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-gray-900 p-4 text-sm text-gray-400">
        Cargando histórico Premium…
      </div>
    );
  }

  // SVG sparkline
  const width = 320;
  const height = 60;
  const padding = 4;
  const xs = data.points.map((_, i) => (i / (data.points.length - 1)) * (width - padding * 2) + padding);
  const min = Math.min(...data.points.map((p) => p.price_eur));
  const max = Math.max(...data.points.map((p) => p.price_eur));
  const range = Math.max(1, max - min);
  const ys = data.points.map(
    (p) => height - padding - ((p.price_eur - min) / range) * (height - padding * 2),
  );
  const path = ys.map((y, i) => `${i === 0 ? "M" : "L"} ${xs[i].toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = ys[ys.length - 1];
  const lastX = xs[xs.length - 1];

  const verdictColor =
    data.verdict === "low" ? "text-emerald-400" : data.verdict === "high" ? "text-rose-400" : "text-amber-400";
  const verdictLabel =
    data.verdict === "low"
      ? "🔥 Precio bajo — buen momento"
      : data.verdict === "high"
        ? "📈 Precio alto — quizás esperar"
        : "≈ Precio típico de esta ruta";

  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📊</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-sm">Histórico 30 días — Premium</h3>
            <span className={`text-xs font-semibold ${verdictColor}`}>{verdictLabel}</span>
          </div>
          <div className="mt-3 text-xs text-gray-300 flex gap-4 flex-wrap">
            <span>
              <span className="text-gray-500">Min:</span> <span className="font-semibold text-emerald-400">{data.min} €</span>
            </span>
            <span>
              <span className="text-gray-500">Medio:</span> <span className="font-semibold text-white">{data.avg} €</span>
            </span>
            <span>
              <span className="text-gray-500">Max:</span> <span className="font-semibold text-rose-400">{data.max} €</span>
            </span>
            <span>
              <span className="text-gray-500">Actual:</span> <span className="font-semibold text-amber-300">{data.current} €</span>
            </span>
          </div>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mt-3 w-full max-w-md"
            role="img"
            aria-label="Histórico de precios 30 días"
          >
            <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-emerald-400" />
            <circle cx={lastX} cy={last} r={3} className="fill-amber-300" />
          </svg>
          <div className="text-[11px] text-gray-500 mt-1">
            Histórico sintético basado en patrones de la ruta. Sirve como referencia, no garantía.
          </div>
        </div>
      </div>
    </div>
  );
}
