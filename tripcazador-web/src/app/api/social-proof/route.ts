import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 60;

// Anonymized proof events. In future will read from /api/track JSONL aggregated.
// For now, generate plausible events from a static pool seeded with destinations
// from your real catalog rotated by hour-of-day.
const ORIGINS_ES = [
  { city: "Madrid", country: "ES" },
  { city: "Barcelona", country: "ES" },
  { city: "Valencia", country: "ES" },
  { city: "Sevilla", country: "ES" },
  { city: "Bilbao", country: "ES" },
  { city: "Málaga", country: "ES" },
  { city: "Zaragoza", country: "ES" },
  { city: "Palma", country: "ES" },
  { city: "Alicante", country: "ES" },
  { city: "Granada", country: "ES" },
];

const ORIGINS_LATAM = [
  { city: "Buenos Aires", country: "AR" },
  { city: "Ciudad de México", country: "MX" },
  { city: "Bogotá", country: "CO" },
  { city: "Lima", country: "PE" },
  { city: "Santiago", country: "CL" },
];

const DEALS_POOL: Array<{ destination: string; price: number; origin?: string }> = [
  { destination: "Tokio", price: 528, origin: "MAD" },
  { destination: "Bali", price: 612, origin: "BCN" },
  { destination: "Lisboa", price: 79, origin: "MAD" },
  { destination: "Bangkok", price: 489, origin: "MAD" },
  { destination: "Estambul", price: 145, origin: "BCN" },
  { destination: "Marrakech", price: 89, origin: "MAD" },
  { destination: "Roma", price: 49, origin: "MAD" },
  { destination: "París", price: 68, origin: "BCN" },
  { destination: "Nueva York", price: 318, origin: "MAD" },
  { destination: "Dubái", price: 339, origin: "MAD" },
  { destination: "Cancún", price: 412, origin: "MAD" },
  { destination: "Reikiavik", price: 165, origin: "BCN" },
  { destination: "Tel Aviv", price: 178, origin: "MAD" },
  { destination: "Tirana", price: 39, origin: "BGY" },
  { destination: "Atenas", price: 89, origin: "MAD" },
  { destination: "Praga", price: 78, origin: "BCN" },
  { destination: "Berlín", price: 65, origin: "MAD" },
  { destination: "Budapest", price: 72, origin: "MAD" },
  { destination: "Mallorca", price: 35, origin: "MAD" },
  { destination: "Tenerife", price: 55, origin: "BCN" },
];

function pseudoRandomBucket(): number {
  // Slightly time-varying, deterministic per minute, so different visitors see different events
  return Math.floor((Date.now() / 60000) % 10000);
}

export async function GET() {
  const now = Date.now();
  const seed = pseudoRandomBucket();
  const allOrigins = [...ORIGINS_ES, ...ORIGINS_ES, ...ORIGINS_LATAM]; // ES weighted 2x
  const events = [];
  const used = new Set<string>();
  for (let i = 0; i < 8; i++) {
    const oi = (seed + i * 17) % allOrigins.length;
    const di = (seed + i * 7 + 3) % DEALS_POOL.length;
    const o = allOrigins[oi];
    const d = DEALS_POOL[di];
    const key = `${o.city}-${d.destination}`;
    if (used.has(key)) continue;
    used.add(key);
    // ago_min: between 2 and 35 minutes
    const ago = ((seed + i * 5) % 33) + 2;
    events.push({
      city: o.city,
      country: o.country,
      destination: d.destination,
      price: d.price,
      origin: d.origin,
      ago_min: ago,
    });
  }

  return NextResponse.json(
    { events, generated_at: new Date(now).toISOString() },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } },
  );
}
