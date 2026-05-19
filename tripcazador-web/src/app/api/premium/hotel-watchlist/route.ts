/**
 * /api/premium/hotel-watchlist — SSS323 (19 may 2026)
 *
 * Premium CRUD para Hotel Watch.
 *  - POST { customer_id, email, city, date_in, date_out, price_per_night_baseline, target_drop_pct?, city_name? } → 201
 *  - GET ?customer_id=cus_xxx → 200 { watches[] }
 *  - DELETE ?id=hw_xxx&customer_id=cus_xxx → 200
 *
 * AUTH: posesión customerId Stripe.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createHotelWatch,
  listHotelWatchesByCustomer,
  deleteHotelWatch,
  HotelWatchQuotaError,
  HOTEL_WATCH_QUOTA,
  HOTEL_MIN_DROP_PCT,
  HOTEL_MAX_DROP_PCT,
  HOTEL_DEFAULT_DROP_PCT,
} from "@/lib/hotel_watchlist_store";
import { isValidStripeOwnerId } from "@/lib/stripe_id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CITY_RE = /^[A-Z]{3,4}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const customerId = String(body.customer_id || "");
  if (!isValidStripeOwnerId(customerId)) {
    return NextResponse.json({ ok: false, error: "customer_id_invalid" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
  }

  const city = String(body.city || "").toUpperCase();
  if (!CITY_RE.test(city)) {
    return NextResponse.json({ ok: false, error: "city_invalid" }, { status: 400 });
  }

  const date_in = String(body.date_in || "");
  const date_out = String(body.date_out || "");
  if (!DATE_RE.test(date_in) || !DATE_RE.test(date_out)) {
    return NextResponse.json({ ok: false, error: "date_invalid" }, { status: 400 });
  }
  if (date_in >= date_out) {
    return NextResponse.json({ ok: false, error: "date_range_invalid" }, { status: 400 });
  }

  const ppn = Number(body.price_per_night_baseline);
  if (!Number.isFinite(ppn) || ppn <= 0 || ppn > 5000) {
    return NextResponse.json({ ok: false, error: "price_invalid" }, { status: 400 });
  }

  let target = HOTEL_DEFAULT_DROP_PCT;
  if (typeof body.target_drop_pct === "number" && Number.isFinite(body.target_drop_pct)) {
    if (body.target_drop_pct < HOTEL_MIN_DROP_PCT || body.target_drop_pct > HOTEL_MAX_DROP_PCT) {
      return NextResponse.json(
        { ok: false, error: "target_drop_pct_invalid", min: HOTEL_MIN_DROP_PCT, max: HOTEL_MAX_DROP_PCT },
        { status: 400 },
      );
    }
    target = body.target_drop_pct as number;
  }

  try {
    const entry = await createHotelWatch({
      customerId,
      email,
      city,
      date_in,
      date_out,
      price_per_night_baseline: ppn,
      target_drop_pct: target,
      city_name: typeof body.city_name === "string" ? body.city_name : undefined,
    });
    return NextResponse.json({ ok: true, watch: entry }, { status: 201 });
  } catch (e) {
    if (e instanceof HotelWatchQuotaError) {
      return NextResponse.json(
        { ok: false, error: "quota_exceeded", limit: HOTEL_WATCH_QUOTA, current: e.currentCount },
        { status: 429 },
      );
    }
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const customerId = req.nextUrl.searchParams.get("customer_id") || "";
  if (!isValidStripeOwnerId(customerId)) {
    return NextResponse.json({ ok: false, error: "customer_id_invalid" }, { status: 400 });
  }
  const watches = await listHotelWatchesByCustomer(customerId);
  watches.sort((a, b) => b.created_at - a.created_at);
  return NextResponse.json({ ok: true, watches });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get("id") || "";
  const customerId = req.nextUrl.searchParams.get("customer_id") || "";
  if (!isValidStripeOwnerId(customerId)) {
    return NextResponse.json({ ok: false, error: "customer_id_invalid" }, { status: 400 });
  }
  if (!/^hw_[A-Za-z0-9]+$/.test(id)) {
    return NextResponse.json({ ok: false, error: "id_invalid" }, { status: 400 });
  }
  const ok = await deleteHotelWatch(id, customerId);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "not_found_or_forbidden" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
