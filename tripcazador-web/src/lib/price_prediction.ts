/**
 * price_prediction.ts — F2 (May 2026)
 *
 * Heurística simple (sin ML) para predecir si un deal es probable que baje:
 *   1. Compara precio actual con la media histórica de la ruta+mes en deals.json
 *   2. Detecta proximidad a vacaciones / días pico (precio sube)
 *   3. Detecta días flexibles (martes/miércoles típicamente bajan)
 *   4. Detecta tiempo restante hasta la fecha (curva U: muy lejos o muy cerca = caro)
 *
 * Devuelve: { likelihood: 0-100, recommendation: "espera"|"compra"|"compra_ya", reason: string }
 */

export type PricePrediction = {
  likelihood_drop_pct: number; // 0-100
  recommendation: "espera" | "compra" | "compra_ya";
  reason: string;
  confidence: "baja" | "media" | "alta";
};

type DealLike = {
  price?: number | null;
  price_eur?: number | null;
  date_out?: string | null;
  origin?: string | null;
  destination?: string | null;
  cabin?: string | null;
};

// Holiday windows EU/ES — añadir/quitar según calendario real
const HOLIDAY_WINDOWS_2026: { start: string; end: string; label: string }[] = [
  { start: "2026-07-01", end: "2026-08-31", label: "verano" },
  { start: "2026-12-20", end: "2027-01-08", label: "navidad" },
  { start: "2026-03-26", end: "2026-04-06", label: "semana_santa" },
  { start: "2026-10-31", end: "2026-11-02", label: "halloween_dia_muertos" },
];

function isInHolidayWindow(dateStr: string): { in: boolean; label?: string } {
  const d = dateStr.slice(0, 10);
  for (const w of HOLIDAY_WINDOWS_2026) {
    if (d >= w.start && d <= w.end) return { in: true, label: w.label };
  }
  return { in: false };
}

function dayOfWeek(dateStr: string): number {
  return new Date(dateStr).getUTCDay(); // 0=Sun
}

export function predictPrice(deal: DealLike, ctx?: { historicalAvg?: number; sampleSize?: number }): PricePrediction {
  const price = Number(deal.price ?? deal.price_eur ?? 0);
  const dateOut = (deal.date_out || "").slice(0, 10);

  // Sin datos suficientes → conservador
  if (!price || price <= 0 || !dateOut) {
    return {
      likelihood_drop_pct: 40,
      recommendation: "espera",
      reason: "Sin datos suficientes para evaluar",
      confidence: "baja",
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const daysToFlight = Math.floor(
    (new Date(dateOut).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24),
  );

  let likelihoodDrop = 50; // base
  const reasons: string[] = [];
  let confidence: "baja" | "media" | "alta" = "media";

  // 1. Distance from departure date (curva U)
  if (daysToFlight < 7) {
    likelihoodDrop -= 25;
    reasons.push("vuelo muy próximo (≤7d), los precios típicamente suben");
  } else if (daysToFlight < 21) {
    likelihoodDrop -= 10;
    reasons.push("ventana de 1-3 semanas: poca probabilidad de baja");
  } else if (daysToFlight < 60) {
    likelihoodDrop += 10;
    reasons.push("buena ventana (3-8 semanas) para esperar bajas");
  } else if (daysToFlight < 120) {
    likelihoodDrop += 5;
    reasons.push("ventana amplia, espacio para encontrar mejor precio");
  } else {
    likelihoodDrop -= 5;
    reasons.push("vuelo a >4 meses, precios suelen subir antes de bajar");
  }

  // 2. Holiday window
  const hw = isInHolidayWindow(dateOut);
  if (hw.in) {
    likelihoodDrop -= 15;
    reasons.push(`fecha en ventana de pico (${hw.label})`);
  }

  // 3. Day of week (Mon=1, Tue=2, Wed=3 baratos; Fri=5, Sun=0 caros)
  const dow = dayOfWeek(dateOut);
  if (dow === 2 || dow === 3) {
    likelihoodDrop -= 8;
    reasons.push("ya volando en día barato (martes/miércoles)");
  } else if (dow === 5 || dow === 0) {
    likelihoodDrop += 5;
    reasons.push("vuelo en día caro (viernes/domingo) — flexibilizar puede ahorrar");
  }

  // 4. vs historical avg
  if (ctx?.historicalAvg && ctx.sampleSize && ctx.sampleSize >= 3) {
    const ratio = price / ctx.historicalAvg;
    if (ratio < 0.7) {
      likelihoodDrop -= 30;
      reasons.push(`precio ya 30%+ por debajo de la media histórica`);
      confidence = "alta";
    } else if (ratio < 0.85) {
      likelihoodDrop -= 10;
      reasons.push(`precio bajo vs histórico (${Math.round((1 - ratio) * 100)}% menos)`);
      confidence = ctx.sampleSize >= 10 ? "alta" : "media";
    } else if (ratio > 1.15) {
      likelihoodDrop += 15;
      reasons.push(`precio actual por encima de la media histórica`);
      confidence = "alta";
    }
  } else {
    confidence = "baja";
  }

  // Cabin business: rarely drops, ride-the-fare
  if (deal.cabin === "business" || deal.cabin === "first") {
    likelihoodDrop -= 10;
    reasons.push("clase business: precios menos volátiles");
  }

  likelihoodDrop = Math.max(5, Math.min(95, Math.round(likelihoodDrop)));

  let rec: PricePrediction["recommendation"];
  if (likelihoodDrop < 30) {
    rec = "compra_ya";
  } else if (likelihoodDrop < 55) {
    rec = "compra";
  } else {
    rec = "espera";
  }

  return {
    likelihood_drop_pct: likelihoodDrop,
    recommendation: rec,
    reason: reasons.slice(0, 2).join("; "),
    confidence,
  };
}

/** Compute historical avg of a route+month from a list of deals (server-side helper). */
export function computeHistoricalAvg(
  allDeals: DealLike[],
  origin: string,
  destination: string,
  month: string, // "YYYY-MM"
): { avg: number; n: number } {
  const matches = allDeals.filter((d) => {
    if ((d.origin || "").toUpperCase() !== origin.toUpperCase()) return false;
    if ((d.destination || "").toUpperCase() !== destination.toUpperCase()) return false;
    if (!d.date_out || !d.date_out.startsWith(month)) return false;
    const p = Number(d.price ?? d.price_eur ?? 0);
    return p > 0;
  });
  if (matches.length === 0) return { avg: 0, n: 0 };
  const avg =
    matches.reduce((sum, d) => sum + Number(d.price ?? d.price_eur ?? 0), 0) / matches.length;
  return { avg, n: matches.length };
}
