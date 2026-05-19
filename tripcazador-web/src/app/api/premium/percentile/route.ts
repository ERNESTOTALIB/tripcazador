/**
 * /api/premium/percentile — SSS326 (19 may 2026)
 *
 * Social proof: devuelve el percentile del user dentro del distribución
 * de ahorros Premium. "Has ahorrado más que el X% de Premium".
 *
 * GET ?customer_id=cus_xxx → 200 { ok, percentile, my_total_eur, total_customers, label }
 *
 * Privacy: no exponemos customer IDs ni totales individuales — solo
 * agregados anonimizados (la lista ordenada de totales sin keys).
 */

import { NextRequest, NextResponse } from "next/server";
import { isValidStripeOwnerId } from "@/lib/stripe_id";
import {
  listSavingsByCustomer,
  aggregateTotalsAcrossCustomers,
  summarize,
} from "@/lib/savings_log_store";
import { calculatePercentile } from "@/lib/percentile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const customerId = req.nextUrl.searchParams.get("customer_id") || "";
  if (!isValidStripeOwnerId(customerId)) {
    return NextResponse.json(
      { ok: false, error: "customer_id_invalid" },
      { status: 400 },
    );
  }

  const [mySavings, allTotals] = await Promise.all([
    listSavingsByCustomer(customerId),
    aggregateTotalsAcrossCustomers(),
  ]);

  const myTotal = summarize(mySavings).total_eur;
  const result = calculatePercentile(myTotal, allTotals);

  return NextResponse.json({
    ok: true,
    percentile: result.percentile,
    my_total_eur: result.my_total_eur,
    total_customers: result.total_customers,
    label: result.label,
  });
}
