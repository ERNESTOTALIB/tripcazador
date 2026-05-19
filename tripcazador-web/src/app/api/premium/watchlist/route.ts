/**
 * /api/premium/watchlist — SSS314 (19 may 2026)
 *
 * Premium-only CRUD para "Watch this deal":
 *  - POST { customer_id, email, deal_id, origin, destination, price_when_added,
 *           target_drop_pct?, headline?, airline_name?, date_out?, date_ret? } → 201
 *  - GET ?customer_id=cus_xxx → 200 { watches: [...] }
 *  - DELETE ?id=wl_xxx&customer_id=cus_xxx → 200
 *
 * AUTH: posesión del customerId Stripe (mismo patrón que saved-searches).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createWatch,
  listWatchesByCustomer,
  deleteWatch,
  WatchlistQuotaError,
  WATCHLIST_QUOTA,
  MIN_DROP_PCT,
  MAX_DROP_PCT,
  DEFAULT_DROP_PCT,
} from "@/lib/watchlist_store";
import { isValidStripeOwnerId } from "@/lib/stripe_id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IATA_RE = /^[A-Z]{3}$/;
const DEAL_ID_RE = /^[A-Za-z0-9_\-]{1,80}$/;

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

  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
  }

  const dealId = String(body.deal_id || "");
  if (!DEAL_ID_RE.test(dealId)) {
    return NextResponse.json({ ok: false, error: "deal_id_invalid" }, { status: 400 });
  }

  const origin = String(body.origin || "").toUpperCase();
  const destination = String(body.destination || "").toUpperCase();
  if (!IATA_RE.test(origin) || !IATA_RE.test(destination)) {
    return NextResponse.json(
      { ok: false, error: "iata_invalid" },
      { status: 400 },
    );
  }

  const price = Number(body.price_when_added);
  if (!Number.isFinite(price) || price <= 0 || price > 50000) {
    return NextResponse.json({ ok: false, error: "price_invalid" }, { status: 400 });
  }

  const targetDropRaw = body.target_drop_pct;
  let targetDrop = DEFAULT_DROP_PCT;
  if (typeof targetDropRaw === "number" && Number.isFinite(targetDropRaw)) {
    if (targetDropRaw < MIN_DROP_PCT || targetDropRaw > MAX_DROP_PCT) {
      return NextResponse.json(
        { ok: false, error: "target_drop_pct_invalid", min: MIN_DROP_PCT, max: MAX_DROP_PCT },
        { status: 400 },
      );
    }
    targetDrop = targetDropRaw;
  }

  try {
    const entry = await createWatch({
      customerId,
      email,
      deal_id: dealId,
      origin,
      destination,
      price_when_added: price,
      target_drop_pct: targetDrop,
      headline: typeof body.headline === "string" ? body.headline : undefined,
      airline_name: typeof body.airline_name === "string" ? body.airline_name : undefined,
      date_out: typeof body.date_out === "string" ? body.date_out : undefined,
      date_ret: typeof body.date_ret === "string" ? body.date_ret : undefined,
    });
    return NextResponse.json({ ok: true, watch: entry }, { status: 201 });
  } catch (e) {
    if (e instanceof WatchlistQuotaError) {
      return NextResponse.json(
        { ok: false, error: "quota_exceeded", limit: WATCHLIST_QUOTA, current: e.currentCount },
        { status: 429 },
      );
    }
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
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
  const watches = await listWatchesByCustomer(customerId);
  // Ordenar más recientes primero
  watches.sort((a, b) => b.created_at - a.created_at);
  return NextResponse.json({ ok: true, watches });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get("id") || "";
  const customerId = req.nextUrl.searchParams.get("customer_id") || "";
  if (!isValidStripeOwnerId(customerId)) {
    return NextResponse.json(
      { ok: false, error: "customer_id_invalid" },
      { status: 400 },
    );
  }
  if (!/^wl_[A-Za-z0-9]+$/.test(id)) {
    return NextResponse.json({ ok: false, error: "id_invalid" }, { status: 400 });
  }
  const ok = await deleteWatch(id, customerId);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "not_found_or_forbidden" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
