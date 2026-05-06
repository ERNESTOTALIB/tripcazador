import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 1800;

/**
 * /api/trends — F8 (May 2026)
 *
 * Devuelve top destinos buscados últimos 7d, growth %, sparkline.
 * Por ahora datos seeded plausibles + rotación deterministic. En producción
 * leer de /api/track JSONL agregado.
 */

type TrendRow = {
  rank: number;
  destination: string;
  country: string;
  emoji: string;
  searches_7d: number;
  growth_pct: number;
  sparkline: number[]; // 7 datapoints
  avg_price: number;
  best_origin: string;
};

const SEED_TRENDS: Omit<TrendRow, "rank" | "growth_pct" | "sparkline" | "searches_7d">[] = [
  { destination: "Tokio", country: "Japón", emoji: "🗼", avg_price: 528, best_origin: "MAD" },
  { destination: "Bali", country: "Indonesia", emoji: "🏝️", avg_price: 612, best_origin: "BCN" },
  { destination: "Lisboa", country: "Portugal", emoji: "🚋", avg_price: 79, best_origin: "MAD" },
  { destination: "Bangkok", country: "Tailandia", emoji: "🛕", avg_price: 489, best_origin: "MAD" },
  { destination: "Estambul", country: "Turquía", emoji: "🕌", avg_price: 145, best_origin: "BCN" },
  { destination: "Marrakech", country: "Marruecos", emoji: "🌶️", avg_price: 89, best_origin: "MAD" },
  { destination: "Roma", country: "Italia", emoji: "🏛️", avg_price: 49, best_origin: "MAD" },
  { destination: "París", country: "Francia", emoji: "🗼", avg_price: 68, best_origin: "BCN" },
  { destination: "Nueva York", country: "USA", emoji: "🗽", avg_price: 318, best_origin: "MAD" },
  { destination: "Dubái", country: "UAE", emoji: "🏙️", avg_price: 339, best_origin: "MAD" },
  { destination: "Reikiavik", country: "Islandia", emoji: "❄️", avg_price: 165, best_origin: "BCN" },
  { destination: "Tirana", country: "Albania", emoji: "🏔️", avg_price: 39, best_origin: "BGY" },
];

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 0x100000000;
    return state / 0x100000000;
  };
}

export async function GET() {
  // Use day-of-year as seed to keep stable per day
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const rng = seededRandom(dayOfYear);

  const rows: TrendRow[] = SEED_TRENDS.map((d, i) => {
    const base = 800 + Math.floor(rng() * 4500);
    const sparkline: number[] = [];
    for (let j = 0; j < 7; j++) sparkline.push(Math.floor(base * (0.7 + rng() * 0.6)));
    const yesterday = sparkline.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
    const today = sparkline[6];
    const growth = yesterday > 0 ? ((today - yesterday) / yesterday) * 100 : 0;
    return {
      rank: i + 1,
      ...d,
      searches_7d: sparkline.reduce((a, b) => a + b, 0),
      growth_pct: Math.round(growth * 10) / 10,
      sparkline,
    };
  })
    .sort((a, b) => b.searches_7d - a.searches_7d)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return NextResponse.json(
    { rows, generated_at: new Date().toISOString(), period: "7d" },
    { headers: { "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600" } },
  );
}
