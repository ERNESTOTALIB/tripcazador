/**
 * /api/premium/portal — SSS303 (18 may 2026)
 *
 * Crea una Stripe billing_portal_session para que el suscriptor Premium
 * gestione SU PROPIA suscripción (cancelar, actualizar tarjeta, ver
 * recibos) sin tocar contacto@tripcazador.com.
 *
 * Esto elimina la fricción de "cómo cancelo" que es el #1 dolor de
 * usuarios SaaS. Resuelve también el riesgo legal de no facilitar
 * cancelación visible (FTC click-to-cancel rule 2024).
 *
 * Request:
 *   GET /api/premium/portal?session_id=cs_xxx
 *   POST /api/premium/portal { session_id }
 *
 * Tanto GET como POST aceptados — GET para link directo, POST para form.
 *
 * Flow:
 *  1. Recibe session_id de Checkout (la única "credencial" que tiene
 *     el cliente, igual que activate endpoint).
 *  2. Recupera session via Stripe API → extrae customer ID.
 *  3. Crea billing_portal.sessions.create({customer, return_url}).
 *  4. Devuelve { url } → frontend hace window.location = url.
 *
 * Responses:
 *  200 { ok:true, url } → redirige a Stripe billing portal
 *  400 session_id formato inválido
 *  402 si el session no está paid
 *  404 si Stripe no encuentra
 *  503 si STRIPE_SECRET_KEY no configurada
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{8,}$/;
const RETURN_URL = "https://tripcazador.com/panel/premium";

async function handle(sessionId: string): Promise<NextResponse> {
  if (!sessionId || !SESSION_ID_RE.test(sessionId)) {
    return NextResponse.json(
      { ok: false, error: "session_id_invalid", hint: "format cs_(test|live)_<id>" },
      { status: 400 },
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return NextResponse.json({ ok: false, error: "session_not_found" }, { status: 404 });
    }
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { ok: false, error: "payment_not_complete", payment_status: session.payment_status },
        { status: 402 },
      );
    }
    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (!customerId) {
      return NextResponse.json(
        { ok: false, error: "no_customer_on_session" },
        { status: 422 },
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
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
  return handle(searchParams.get("session_id") || "");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  return handle(String(body.session_id || ""));
}
