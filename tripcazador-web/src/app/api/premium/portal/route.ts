/**
 * /api/premium/portal — SSS303 / fix SSS304 (18 may 2026)
 *
 * Crea una Stripe billing_portal_session para que el suscriptor Premium
 * gestione SU PROPIA suscripción (cancelar, actualizar tarjeta, ver
 * recibos) sin tocar contacto@tripcazador.com.
 *
 * BUG FIX SSS304: SSS303 SOLO aceptaba session_id (cs_test/cs_live) y
 * resolvía customer via stripe.checkout.sessions.retrieve. Pero el
 * frontend guarda en localStorage el customer_id (cus_xxx) que devuelve
 * /api/premium/activate (SSS301). Resultado: portal SIEMPRE devolvía 400.
 *
 * Ahora acepta:
 *  - customer_id=cus_xxx → directo a billingPortal.sessions.create
 *  - session_id=cs_xxx   → retrieve session → extrae customer → portal
 *
 * Request:
 *   GET /api/premium/portal?customer_id=cus_xxx
 *   GET /api/premium/portal?session_id=cs_xxx
 *   POST /api/premium/portal { customer_id } o { session_id }
 *
 * Responses:
 *  200 { ok:true, url } → cliente redirige
 *  400 owner ID formato inválido
 *  402 si session no está paid (solo path session_id)
 *  503 si STRIPE_SECRET_KEY no configurada
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  isValidStripeCustomerId,
  isValidStripeSessionId,
} from "@/lib/stripe_id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RETURN_URL = "https://tripcazador.com/panel/premium";

async function resolveCustomer(
  stripe: Stripe,
  ownerId: string,
): Promise<{ customerId?: string; error?: string; status?: number }> {
  if (isValidStripeCustomerId(ownerId)) {
    return { customerId: ownerId };
  }
  if (isValidStripeSessionId(ownerId)) {
    try {
      const session = await stripe.checkout.sessions.retrieve(ownerId);
      if (!session) return { error: "session_not_found", status: 404 };
      if (session.payment_status !== "paid") {
        return { error: "payment_not_complete", status: 402 };
      }
      const cId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      if (!cId) return { error: "no_customer_on_session", status: 422 };
      return { customerId: cId };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "stripe_error";
      return { error: msg.slice(0, 200), status: 500 };
    }
  }
  return { error: "owner_id_invalid", status: 400 };
}

async function handle(ownerId: string): Promise<NextResponse> {
  if (!ownerId) {
    return NextResponse.json(
      { ok: false, error: "owner_id_required", hint: "pass customer_id or session_id" },
      { status: 400 },
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
    const resolved = await resolveCustomer(stripe, ownerId);
    if (!resolved.customerId || resolved.error) {
      return NextResponse.json(
        { ok: false, error: resolved.error || "resolve_failed" },
        { status: resolved.status || 400 },
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: resolved.customerId,
      return_url: RETURN_URL,
    });

    return NextResponse.json({ ok: true, url: portal.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "stripe_error";
    return NextResponse.json(
      { ok: false, error: "stripe_portal_failed", detail: msg.slice(0, 200) },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  // Acepta cualquiera de los dos params; prefiere customer_id si están ambos
  const owner =
    searchParams.get("customer_id") || searchParams.get("session_id") || "";
  return handle(owner);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const owner = String(body.customer_id || body.session_id || "");
  return handle(owner);
}
