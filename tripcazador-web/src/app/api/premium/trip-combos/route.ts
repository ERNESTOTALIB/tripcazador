/**
 * /api/premium/trip-combos — SSS325 (19 may 2026)
 *
 * Trip planner combo vuelo + hotel Premium. User dice destino + mes +
 * nights → devolvemos top 3 combos sorted por coste total.
 *
 * GET ?customer_id=cus_xxx&destination=BCN&month=2026-09&nights=5
 *   → 200 { ok, combos: TripCombo[], destination, month, nights }
 */

import { NextRequest, NextResponse } from "next/server";
import { isValidStripeOwnerId } from "@/lib/stripe_id";
import { planTripCombos, type PlannerFlightDeal } from "@/lib/trip_combos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = "https://tripcazador.com";

async function fetchDeals(destination: string): Promise<PlannerFlightDeal[]> {
  try {
    // Pedimos amplio para que la filter del lib tenga material
    const res = await fetch(`${SITE_URL}/api/deals?limit=200`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const arr: PlannerFlightDeal[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.deals)
        ? data.deals
        : [];
    return arr.filter((d) => d.destination === destination);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const customerId = req.nextUrl.searchParams.get("customer_id") || "";
  if (!isValidStripeOwnerId(customerId)) {
    return NextResponse.json(
      { ok: false, error: "customer_id_invalid" },
      { status: 400 },
    );
  }

  const destination = (
    req.nextUrl.searchParams.get("destination") || ""
  ).toUpperCase();
  if (!/^[A-Z]{3}$/.test(destination)) {
    return NextResponse.json(
      { ok: false, error: "destination_invalid" },
      { status: 400 },
    );
  }

  const month = req.nextUrl.searchParams.get("month") || "";
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { ok: false, error: "month_invalid" },
      { status: 400 },
    );
  }

  const nightsRaw = Number(req.nextUrl.searchParams.get("nights") || "5");
  if (!Number.isFinite(nightsRaw) || nightsRaw < 1 || nightsRaw > 60) {
    return NextResponse.json(
      { ok: false, error: "nights_invalid" },
      { status: 400 },
    );
  }

  const deals = await fetchDeals(destination);
  const combos = planTripCombos({
    destinationIata: destination,
    monthYYYYMM: month,
    nights: nightsRaw,
    deals,
    limit: 3,
  });

  return NextResponse.json({
    ok: true,
    destination,
    month,
    nights: nightsRaw,
    deals_considered: deals.length,
    combos,
  });
}
