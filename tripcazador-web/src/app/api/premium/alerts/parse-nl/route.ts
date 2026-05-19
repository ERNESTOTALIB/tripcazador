/**
 * /api/premium/alerts/parse-nl — SSS319 (19 may 2026)
 *
 * Premium-only: parsea una alerta en lenguaje natural (español) y
 * devuelve los filtros estructurados para que el cliente los muestre
 * en preview antes de crear la alerta.
 *
 * POST { customer_id, text } → 200 { parsed, warnings, confidence, matches }
 *
 * Por qué un endpoint y no client-side: queremos poder evolucionar
 * el parser (añadir LLM fallback en v2) sin invalidar el bundle
 * cliente.
 *
 * AUTH: posesión del customerId Stripe.
 */

import { NextRequest, NextResponse } from "next/server";
import { isValidStripeOwnerId } from "@/lib/stripe_id";
import { parseNLAlert } from "@/lib/nl_alert_parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT_LEN = 500;

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

  const text = String(body.text || "").trim();
  if (!text) {
    return NextResponse.json({ ok: false, error: "text_required" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LEN) {
    return NextResponse.json(
      { ok: false, error: "text_too_long", max: MAX_TEXT_LEN },
      { status: 400 },
    );
  }

  const result = parseNLAlert(text);
  return NextResponse.json({ ok: true, ...result });
}
