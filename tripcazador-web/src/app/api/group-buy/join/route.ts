/**
 * /api/group-buy/join — SSS370 (21 may 2026)
 *
 * POST { deal_id, customer_id, email?, travelers? }
 * → { joined, snapshot }
 *
 * Rate limit: 5 joins / 5 min / customer (anti-abuse).
 */

import { NextRequest, NextResponse } from "next/server";
import { joinGroupBuy, getSnapshot } from "@/lib/group_buy_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateMap: Map<string, number[]> = (
  globalThis as unknown as { __tc_gb_rate?: Map<string, number[]> }
).__tc_gb_rate ?? new Map();
(globalThis as unknown as { __tc_gb_rate: Map<string, number[]> }).__tc_gb_rate = rateMap;

function isRateLimited(customerId: string): boolean {
  const now = Date.now();
  const window = 5 * 60_000;
  const hits = (rateMap.get(customerId) || []).filter((t) => now - t < window);
  hits.push(now);
  rateMap.set(customerId, hits);
  return hits.length > 5;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const dealId = url.searchParams.get("deal_id");
  if (!dealId) {
    return NextResponse.json({ ok: false, error: "missing_deal_id" }, { status: 400 });
  }
  const snapshot = getSnapshot(dealId);
  return NextResponse.json({ ok: true, snapshot });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const dealId = String(body.deal_id || "").trim();
  const customerId = String(body.customer_id || "").trim();
  const email = body.email ? String(body.email).trim().toLowerCase() : undefined;
  const travelers = Number(body.travelers) || 1;

  if (!dealId || !customerId) {
    return NextResponse.json(
      { ok: false, error: "missing_fields", required: ["deal_id", "customer_id"] },
      { status: 400 },
    );
  }
  if (travelers < 1 || travelers > 10) {
    return NextResponse.json({ ok: false, error: "invalid_travelers" }, { status: 400 });
  }
  if (isRateLimited(customerId)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const result = joinGroupBuy({
    customer_id: customerId,
    deal_id: dealId,
    email,
    travelers,
  });

  return NextResponse.json({
    ok: true,
    joined: result.joined,
    snapshot: result.snapshot,
  });
}
