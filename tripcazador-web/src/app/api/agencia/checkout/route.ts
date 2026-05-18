/**
 * /api/agencia/checkout — SSS305 (18 may 2026)
 *
 * Crea Stripe Checkout Session one-shot para:
 *  - Vuelo solo €9.99 (price_id env STRIPE_AGENCIA_VUELO_PRICE_ID)
 *  - Vuelo+Hotel €19.99 (env STRIPE_AGENCIA_VUELO_HOTEL_PRICE_ID)
 *
 * El ticket NO se crea aquí — solo la sesión Stripe. Cuando el cliente
 * paga, el webhook /api/agencia/webhook crea el ticket con la metadata
 * de la session.
 *
 * POST { tipo, email, request: {origin?, destination?, date_out?, ...} }
 *   → 200 { url } redirect cliente a Stripe Checkout
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { AGENCIA_PRICES, type AgenciaTipo } from "@/lib/agencia_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUCCESS_URL =
  "https://tripcazador.com/agencia/gracias?session_id={CHECKOUT_SESSION_ID}";
const CANCEL_URL = "https://tripcazador.com/agencia?cancelled=1";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 254;
}

function isValidTipo(s: unknown): s is AgenciaTipo {
  return s === "vuelo" || s === "vuelo_hotel";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const tipo = body.tipo;
  if (!isValidTipo(tipo)) {
    return NextResponse.json(
      { ok: false, error: "tipo_invalid", hint: "vuelo | vuelo_hotel" },
      { status: 400 },
    );
  }

  const email = String(body.email || "").trim();
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
  }

  const request = (body.request || {}) as Record<string, unknown>;
  const origin = request.origin ? String(request.origin).toUpperCase().slice(0, 3) : undefined;
  const destination = request.destination
    ? String(request.destination).toUpperCase().slice(0, 3)
    : undefined;
  const dateOut = request.date_out ? String(request.date_out).slice(0, 10) : undefined;
  const dateRet = request.date_ret ? String(request.date_ret).slice(0, 10) : undefined;
  const pasajeros = Number(request.pasajeros);
  const presupuesto = Number(request.presupuesto);
  const notas = request.notas ? String(request.notas).slice(0, 500) : undefined;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  }

  // Price IDs por tipo
  const priceId =
    tipo === "vuelo"
      ? process.env.STRIPE_AGENCIA_VUELO_PRICE_ID
      : process.env.STRIPE_AGENCIA_VUELO_HOTEL_PRICE_ID;

  if (!priceId) {
    return NextResponse.json(
      {
        ok: false,
        error: "price_not_configured",
        hint: `Faltan envs STRIPE_AGENCIA_${tipo === "vuelo" ? "VUELO" : "VUELO_HOTEL"}_PRICE_ID`,
      },
      { status: 503 },
    );
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: {
        tipo,
        origin: origin || "",
        destination: destination || "",
        date_out: dateOut || "",
        date_ret: dateRet || "",
        pasajeros: Number.isFinite(pasajeros) ? String(pasajeros) : "",
        presupuesto: Number.isFinite(presupuesto) ? String(presupuesto) : "",
        notas: notas || "",
        amount_eur: String(AGENCIA_PRICES[tipo]),
      },
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "stripe_error";
    return NextResponse.json(
      { ok: false, error: "stripe_checkout_failed", detail: msg.slice(0, 200) },
      { status: 500 },
    );
  }
}
