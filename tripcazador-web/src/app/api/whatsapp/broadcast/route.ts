/**
 * /api/whatsapp/broadcast — SSS362
 *
 * Manda un chollo a TODA la lista de suscriptores activos. Admin-only.
 *
 * POST body:
 *   { origin, destination, price_eur, booking_url, image_url?,
 *     only_premium?: boolean, dry?: boolean }
 *
 * Auth: Bearer ADMIN_TOKEN (mismo que otros endpoints admin).
 *
 * Devuelve summary {sent, failed, skipped, total_subs, errors}.
 */

import { NextRequest, NextResponse } from "next/server";
import { broadcastDeal } from "@/lib/whatsapp_broadcaster";
import {
  listActiveSubscribers,
  incrementMessageCount,
  statsSubscribers,
} from "@/lib/whatsapp_subscribers_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let m = 0;
  for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Stats endpoint (auth required)
  const auth = req.headers.get("authorization") || "";
  const expected = process.env.ADMIN_TOKEN || "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...statsSubscribers() });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("authorization") || "";
  const expected = process.env.ADMIN_TOKEN || "";
  if (!expected) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  if (!auth.startsWith("Bearer ") || !constantTimeEq(auth.slice(7), expected)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const origin = String(body.origin || "");
  const destination = String(body.destination || "");
  const priceEur = Number(body.price_eur);
  const bookingUrl = String(body.booking_url || "");
  const imageUrl = body.image_url ? String(body.image_url) : undefined;
  const onlyPremium = body.only_premium === true;
  const dry = body.dry === true;

  if (!origin || !destination || !Number.isFinite(priceEur) || !bookingUrl) {
    return NextResponse.json(
      { ok: false, error: "missing_fields", required: ["origin", "destination", "price_eur", "booking_url"] },
      { status: 400 },
    );
  }

  const subs = listActiveSubscribers({ onlyPremium });
  if (subs.length === 0) {
    return NextResponse.json({ ok: true, dry, sent: 0, failed: 0, skipped: 0, total_subs: 0, errors: [] });
  }

  if (dry) {
    return NextResponse.json({
      ok: true,
      dry: true,
      would_send_to: subs.length,
      sample_recipients: subs.slice(0, 3).map((s) => s.phone.slice(0, 4) + "..." + s.phone.slice(-3)),
    });
  }

  const result = await broadcastDeal(
    subs.map((s) => s.phone),
    { origin, destination, priceEur, bookingUrl, imageUrl },
  );

  // Increment counts for sent
  if (result.sent > 0) {
    for (const sub of subs.slice(0, result.sent)) {
      incrementMessageCount(sub.phone);
    }
  }

  return NextResponse.json({
    ok: true,
    total_subs: subs.length,
    ...result,
  });
}
