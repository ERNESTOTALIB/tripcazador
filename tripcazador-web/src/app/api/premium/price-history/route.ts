/**
 * /api/premium/price-history — SSS302 (18 may 2026)
 *
 * Devuelve histórico sintetizado 30 días para (origin, destination, cabin,
 * currentPrice). Útil para Premium price-history chart en /deals/[id].
 *
 * GET ?origin=BCN&destination=BIO&cabin=economy&current=89
 * → 200 { current, min, max, avg, verdict, points: [{date, price_eur}] }
 *
 * Cache: max-age 3600s edge (sintético determinista). Privado al cliente
 * para mostrar solo en cards de Premium.
 *
 * Por qué no protege con customer_id: el cálculo es público y reproducible;
 * el gating es UX (componente solo se monta para Premium). Si el cliente
 * adivina la URL aún así no obtiene más que un random walk.
 */

import { NextRequest, NextResponse } from "next/server";
import { buildPriceHistory } from "@/lib/price_history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isIATA(s: string): boolean {
  return /^[A-Z]{3}$/.test(s);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const origin = (searchParams.get("origin") || "").toUpperCase();
  const destination = (searchParams.get("destination") || "").toUpperCase();
  const cabin = (searchParams.get("cabin") || "economy").toLowerCase();
  const currentRaw = searchParams.get("current") || "";
  const current = Number(currentRaw);

  if (!isIATA(origin)) {
    return NextResponse.json({ ok: false, error: "origin_invalid" }, { status: 400 });
  }
  if (!isIATA(destination)) {
    return NextResponse.json({ ok: false, error: "destination_invalid" }, { status: 400 });
  }
  if (!["economy", "premium_economy", "business", "first"].includes(cabin)) {
    return NextResponse.json({ ok: false, error: "cabin_invalid" }, { status: 400 });
  }
  if (!Number.isFinite(current) || current <= 0 || current > 50000) {
    return NextResponse.json({ ok: false, error: "current_invalid" }, { status: 400 });
  }

  const data = buildPriceHistory({
    origin,
    destination,
    cabin,
    currentPrice: current,
  });

  return NextResponse.json(
    { ok: true, ...data },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
}
