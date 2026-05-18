/**
 * /api/agencia/activate — SSS309 (19 may 2026)
 *
 * Crea el ticket Agencia consultando Stripe directamente por session_id,
 * para flujos donde el webhook NO se haya disparado todavía (o no esté
 * configurado). Idéntico patrón a /api/premium/activate (SSS301).
 *
 * Se llama desde /agencia/gracias al volver del Stripe Checkout success.
 *
 * Idempotente: si ya existe ticket con ese stripe_session_id, lo retorna
 * sin duplicar.
 *
 * GET ?session_id=cs_live_xxx
 *   → 200 { ok:true, ticket } si OK
 *   → 400 session_id formato inválido
 *   → 402 payment_not_complete
 *   → 404 stripe session_not_found
 *   → 503 STRIPE_SECRET_KEY no set
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createTicket,
  listTicketsByEmail,
  type AgenciaTipo,
} from "@/lib/agencia_store";
import { isValidStripeSessionId } from "@/lib/stripe_id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id") || "";

  if (!isValidStripeSessionId(sessionId)) {
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

    const metadata = session.metadata || {};
    const tipo = metadata.tipo as AgenciaTipo;
    if (tipo !== "vuelo" && tipo !== "vuelo_hotel") {
      return NextResponse.json(
        { ok: false, error: "tipo_invalid_in_metadata", got: tipo || null },
        { status: 422 },
      );
    }

    const email =
      session.customer_details?.email || session.customer_email || "";
    if (!email) {
      return NextResponse.json({ ok: false, error: "email_missing" }, { status: 422 });
    }

    // Idempotencia: si ya hay un ticket con este session_id, no duplicar
    const existing = await listTicketsByEmail(email);
    const already = existing.find((t) => t.stripe_session_id === session.id);
    if (already) {
      return NextResponse.json({ ok: true, ticket: already, duplicate: true });
    }

    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;

    const ticket = await createTicket({
      tipo,
      email,
      customer_id: customerId,
      stripe_session_id: session.id,
      request: {
        origin: metadata.origin || undefined,
        destination: metadata.destination || undefined,
        date_out: metadata.date_out || undefined,
        date_ret: metadata.date_ret || undefined,
        pasajeros: metadata.pasajeros ? Number(metadata.pasajeros) : undefined,
        presupuesto: metadata.presupuesto ? Number(metadata.presupuesto) : undefined,
        notas: metadata.notas || undefined,
      },
    });

    return NextResponse.json({ ok: true, ticket });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "stripe_error";
    return NextResponse.json(
      { ok: false, error: "stripe_lookup_failed", detail: msg.slice(0, 200) },
      { status: 500 },
    );
  }
}
