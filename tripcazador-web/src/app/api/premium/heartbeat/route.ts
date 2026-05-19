/**
 * /api/premium/heartbeat — SSS322 (19 may 2026)
 *
 * Llamado desde /panel/premium al mount para actualizar last_seen_at
 * del Premium. El cron anti-churn diario usa este timestamp para
 * decidir si enviar email winback.
 *
 * POST { customer_id } → 200 ok
 *
 * AUTH: posesión del customerId Stripe. No-op si auth falla (no
 * queremos romper la UI si esto falla — es fire-and-forget).
 *
 * Rate-limit conceptual: cliente solo lo llama al mount de
 * /panel/premium (no en cada acción). Si llega abuse, hardenizar
 * con throttle persistente.
 */

import { NextRequest, NextResponse } from "next/server";
import { isValidStripeOwnerId } from "@/lib/stripe_id";
import { recordLastSeen } from "@/lib/last_seen_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const customerId = String(body.customer_id || "");
  if (!isValidStripeOwnerId(customerId)) {
    return NextResponse.json(
      { ok: false, error: "customer_id_invalid" },
      { status: 400 },
    );
  }

  await recordLastSeen(customerId);
  return NextResponse.json({ ok: true });
}
