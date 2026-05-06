/**
 * PricePredictionBadge — F2 (May 2026)
 *
 * Pequeño badge en DealCard que muestra la predicción de baja:
 *   🔮 62% probabilidad de baja  |  💎 Compra ya
 *
 * Server-component compatible (no "use client").
 */
import { predictPrice } from "@/lib/price_prediction";

interface PricePredictionBadgeProps {
  deal: {
    price?: number | null;
    price_eur?: number | null;
    date_out?: string | null;
    origin?: string | null;
    destination?: string | null;
    cabin?: string | null;
  };
  historicalAvg?: number;
  historicalSampleSize?: number;
  variant?: "compact" | "full";
}

export function PricePredictionBadge({
  deal,
  historicalAvg,
  historicalSampleSize,
  variant = "compact",
}: PricePredictionBadgeProps) {
  const pred = predictPrice(deal, {
    historicalAvg,
    sampleSize: historicalSampleSize,
  });

  const colorClass =
    pred.recommendation === "compra_ya"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
      : pred.recommendation === "compra"
        ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
        : "bg-slate-500/15 text-slate-300 border-slate-500/40";

  const icon =
    pred.recommendation === "compra_ya"
      ? "💎"
      : pred.recommendation === "compra"
        ? "✓"
        : "🔮";

  const label =
    pred.recommendation === "compra_ya"
      ? "Compra ya"
      : pred.recommendation === "compra"
        ? "Buen precio"
        : `${pred.likelihood_drop_pct}% baja probable`;

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold border px-2 py-0.5 rounded-full ${colorClass}`}
        title={pred.reason}
      >
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </span>
    );
  }

  return (
    <div className={`border rounded-lg p-3 ${colorClass}`}>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl" aria-hidden="true">{icon}</span>
        <div>
          <div className="font-bold text-base">{label}</div>
          <div className="text-xs opacity-80 mt-0.5">{pred.reason}</div>
          <div className="text-[10px] uppercase tracking-wide opacity-60 mt-1">
            Confianza: {pred.confidence}
            {historicalSampleSize ? ` · ${historicalSampleSize} datapoints` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
