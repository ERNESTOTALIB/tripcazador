/**
 * /api/premium/roi — SSS315 (19 may 2026)
 *
 * Devuelve el resumen de ahorros (€) que Premium ha generado para
 * un customer concreto. Se alimenta de savings_log_store que escriben
 * los crons cuando disparan emails (alert match o watchlist trigger).
 *
 * GET ?customer_id=cus_xxx → 200 { ok, summary: SavingsSummary, recent: [latest 10] }
 *
 * AUTH: posesión del customerId (mismo patrón que el resto de
 * endpoints Premium). No exfiltra savings de otros customers.
 */

import { NextRequest, NextResponse } from "next/server";
import { isValidStripeOwnerId } from "@/lib/stripe_id";
import { listSavingsByCustomer, summarize } from "@/lib/savings_log_store";

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
  const entries = await listSavingsByCustomer(customerId);
  entries.sort((a, b) => b.ts - a.ts);
  const summary = summarize(entries);
  const recent = entries.slice(0, 10).map((e) => ({
    id: e.id,
    deal_id: e.deal_id,
    origin: e.origin,
    destination: e.destination,
    savings_eur: e.savings_eur,
    source: e.source,
    ts: e.ts,
  }));
  return NextResponse.json({ ok: true, summary, recent });
}
