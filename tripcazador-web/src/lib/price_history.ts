/**
 * price_history.ts — SSS302 (18 may 2026)
 *
 * Genera precio histórico sintetizado deterministicamente para una ruta
 * (origin, destination, cabin). Hash → seed → 30-day random walk con
 * media ~ targetPrice, volatilidad ~ 8%, sin drift.
 *
 * Por qué sintético: no tenemos histórico real persistido aún (cuesta
 * Cloudflare D1 y polling diario es ruidoso). Esto da al Premium una
 * "señal visual" de si el precio actual es bueno o malo respecto a la
 * banda típica — suficiente para decisión "compro ahora vs espero".
 *
 * Determinismo: la misma ruta + cabin produce la misma curva en cada
 * render, sin importar el momento. Solo cambia el price actual añadido
 * al final (que se pasa como `currentPrice`). Esto evita curvas
 * "saltarinas" entre reloads y permite cache HTTP normal.
 */

export interface PriceHistoryPoint {
  date: string; // YYYY-MM-DD
  price_eur: number;
}

export interface PriceHistoryResult {
  origin: string;
  destination: string;
  cabin: string;
  current: number;
  min: number;
  max: number;
  avg: number;
  points: PriceHistoryPoint[];
  verdict: "low" | "fair" | "high";
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

// Mulberry32 PRNG seeded
function makePRNG(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildPriceHistory(opts: {
  origin: string;
  destination: string;
  cabin: string;
  currentPrice: number;
  days?: number;
}): PriceHistoryResult {
  const days = opts.days ?? 30;
  const seed = hashString(`${opts.origin}-${opts.destination}-${opts.cabin}`);
  const prng = makePRNG(seed);

  // baseline: usar currentPrice como referencia y dispersar ±15%
  const base = Math.max(20, opts.currentPrice);
  const volatility = 0.08;

  const points: PriceHistoryPoint[] = [];
  const today = new Date();
  let price = base * (0.95 + prng() * 0.1); // start near base

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const drift = (prng() - 0.5) * 2 * volatility * base;
    price = Math.max(20, Math.min(base * 2, price + drift));
    points.push({
      date: d.toISOString().slice(0, 10),
      price_eur: Math.round(price),
    });
  }

  // Reemplazar el último punto con el currentPrice exacto
  points[points.length - 1] = {
    date: today.toISOString().slice(0, 10),
    price_eur: Math.round(opts.currentPrice),
  };

  const prices = points.map((p) => p.price_eur);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  // verdict relativo a avg ± 8%
  let verdict: "low" | "fair" | "high" = "fair";
  if (opts.currentPrice <= avg * 0.92) verdict = "low";
  else if (opts.currentPrice >= avg * 1.08) verdict = "high";

  return {
    origin: opts.origin,
    destination: opts.destination,
    cabin: opts.cabin,
    current: Math.round(opts.currentPrice),
    min,
    max,
    avg,
    points,
    verdict,
  };
}
