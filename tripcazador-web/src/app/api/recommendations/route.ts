import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/recommendations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/recommendations?seeds=BKK,DPS&limit=6 — fase SSS64
 *
 * Devuelve recomendaciones de destinos similares a partir de favoritos.
 * Endpoint público — los seeds se envían desde cliente que lee
 * localStorage de favoritos.
 *
 * Cache: 1h (recomendaciones son determinísticas para mismo input).
 */

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const seedsParam = sp.get("seeds") || "";
  const limit = Math.max(1, Math.min(12, parseInt(sp.get("limit") || "6", 10)));
  const seeds = seedsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{3}$/.test(s));

  if (seeds.length === 0) {
    return NextResponse.json(
      { recommendations: [], note: "Provide ?seeds=IATA1,IATA2 (3-letter codes)" },
      {
        status: 200,
        headers: { "cache-control": "public, max-age=3600, s-maxage=3600" },
      },
    );
  }

  const recs = getRecommendations({ favoriteIatas: seeds, limit });
  return NextResponse.json(
    {
      seeds,
      recommendations: recs,
      generated_at: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "cache-control": "public, max-age=3600, s-maxage=3600" },
    },
  );
}
