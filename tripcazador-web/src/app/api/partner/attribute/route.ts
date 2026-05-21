/**
 * /api/partner/attribute — SSS377 (21 may 2026)
 *
 * Cliente lo llama cuando detecta `?ref=TC-AGY-XXXX` en URL.
 * Validamos formato + que partner existe + active.
 * Set-Cookie 30d con ref_code.
 *
 * Si más tarde el user compra Premium/Concierge, el checkout puede leer
 * ref del cookie y pasarlo en metadata.ref_code de la session Stripe.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  ATTRIBUTION_COOKIE,
  buildCookieSetHeader,
  isValidRefCode,
} from "@/lib/partner_attribution";
import { getPartnerByCode, hydratePartnersFromKV } from "@/lib/agency_partner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const ref = String(body.ref || "").trim().toUpperCase();
  if (!isValidRefCode(ref)) {
    return NextResponse.json({ ok: false, error: "invalid_format" }, { status: 400 });
  }
  await hydratePartnersFromKV();
  const partner = getPartnerByCode(ref);
  if (!partner) {
    return NextResponse.json({ ok: false, error: "unknown" }, { status: 404 });
  }
  if (partner.status !== "active") {
    return NextResponse.json(
      { ok: false, error: `not_active_${partner.status}` },
      { status: 409 },
    );
  }

  const resp = NextResponse.json({
    ok: true,
    cookie: ATTRIBUTION_COOKIE,
    ttl_days: 30,
  });
  resp.headers.set("Set-Cookie", buildCookieSetHeader(ref));
  return resp;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Util para checkout: lee cookie + devuelve ref si válido.
  const cookieHeader = req.headers.get("cookie") || "";
  const m = cookieHeader.match(new RegExp(`${ATTRIBUTION_COOKIE}=([^;]+)`));
  const ref = m ? decodeURIComponent(m[1]) : null;
  if (!ref || !isValidRefCode(ref)) {
    return NextResponse.json({ ok: true, ref: null });
  }
  await hydratePartnersFromKV();
  const partner = getPartnerByCode(ref);
  if (!partner || partner.status !== "active") {
    return NextResponse.json({ ok: true, ref: null });
  }
  return NextResponse.json({ ok: true, ref, partner_slug: partner.slug });
}
