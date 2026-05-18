/**
 * /api/premium/saved-searches — SSS303 (18 may 2026)
 *
 * Premium-only saved searches CRUD.
 *  - POST { customer_id, name, airlines, cabin, stops, timeBand, origin?, destination?, max_price? } → 201
 *  - GET ?customer_id=cs_xxx → 200 lista
 *
 * AUTH: posesión del customerId Stripe.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createSavedSearch,
  listSavedSearches,
  SavedSearchQuotaError,
  SAVED_SEARCH_QUOTA,
  SAVED_SEARCH_NAME_MAX,
} from "@/lib/saved_searches_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUSTOMER_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{8,}$/;

const CABIN_VALUES = ["any", "economy", "premium_economy", "business", "first"] as const;
const STOPS_VALUES = ["any", "0", "1", "2plus"] as const;
const TIME_VALUES = ["any", "early", "morning", "afternoon", "evening"] as const;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const customerId = String(body.customer_id || "");
  if (!CUSTOMER_ID_RE.test(customerId)) {
    return NextResponse.json({ ok: false, error: "customer_id_invalid" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
  }
  if (name.length > SAVED_SEARCH_NAME_MAX) {
    return NextResponse.json(
      { ok: false, error: "name_too_long", max: SAVED_SEARCH_NAME_MAX },
      { status: 400 },
    );
  }

  const airlinesRaw = Array.isArray(body.airlines) ? body.airlines : [];
  const airlines = airlinesRaw
    .map((a) => String(a).toUpperCase())
    .filter((a) => /^[A-Z0-9]{2,3}$/.test(a))
    .slice(0, 20);

  const cabin = (CABIN_VALUES as readonly string[]).includes(String(body.cabin))
    ? (body.cabin as (typeof CABIN_VALUES)[number])
    : "any";
  const stops = (STOPS_VALUES as readonly string[]).includes(String(body.stops))
    ? (body.stops as (typeof STOPS_VALUES)[number])
    : "any";
  const timeBand = (TIME_VALUES as readonly string[]).includes(String(body.timeBand))
    ? (body.timeBand as (typeof TIME_VALUES)[number])
    : "any";

  const origin = body.origin ? String(body.origin).toUpperCase() : undefined;
  const destination = body.destination
    ? String(body.destination).toUpperCase()
    : undefined;
  if (origin && !/^[A-Z]{3}$/.test(origin)) {
    return NextResponse.json({ ok: false, error: "origin_invalid" }, { status: 400 });
  }
  if (destination && !/^[A-Z]{3}$/.test(destination)) {
    return NextResponse.json({ ok: false, error: "destination_invalid" }, { status: 400 });
  }

  const maxPriceRaw = Number(body.max_price);
  const max_price =
    Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 && maxPriceRaw <= 50000
      ? maxPriceRaw
      : undefined;

  try {
    const search = await createSavedSearch({
      customerId,
      name,
      airlines,
      cabin,
      stops,
      timeBand,
      origin,
      destination,
      max_price,
    });
    return NextResponse.json({ ok: true, id: search.id, search }, { status: 201 });
  } catch (err) {
    if (err instanceof SavedSearchQuotaError) {
      return NextResponse.json(
        {
          ok: false,
          error: "quota_exceeded",
          limit: SAVED_SEARCH_QUOTA,
          current: err.currentCount,
          message: `Máx ${SAVED_SEARCH_QUOTA} búsquedas guardadas por cuenta.`,
        },
        { status: 402 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "create_failed", detail: err instanceof Error ? err.message : "" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id") || "";
  if (!CUSTOMER_ID_RE.test(customerId)) {
    return NextResponse.json({ ok: false, error: "customer_id_invalid" }, { status: 400 });
  }
  const searches = await listSavedSearches(customerId);
  return NextResponse.json({ ok: true, count: searches.length, searches });
}
