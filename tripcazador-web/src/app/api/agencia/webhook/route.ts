/**
 * /api/agencia/webhook — SSS305 (18 may 2026)
 *
 * Stripe webhook que se dispara cuando una sesión Checkout de Agencia se
 * completa. Crea el ticket en agencia_store + notifica Ernesto vía email
 * y Telegram.
 *
 * Eventos manejados:
 *  - checkout.session.completed (sesión pagada)
 *
 * Verificación HMAC con STRIPE_AGENCIA_WEBHOOK_SECRET.
 *
 * El cliente recibe email de Stripe con recibo. Ernesto recibe Telegram
 * con los detalles + email Resend para procesar la request.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createTicket, type AgenciaTipo } from "@/lib/agencia_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_AGENCIA_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { ok: false, error: "stripe_not_configured" },
      { status: 503 },
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "verify_failed";
    return NextResponse.json(
      { ok: false, error: "signature_verify_failed", detail: msg.slice(0, 200) },
      { status: 400 },
    );
  }

  if (event.type !== "checkout.session.completed") {
    // ignore otros eventos
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata || {};
  const tipo = metadata.tipo as AgenciaTipo;
  if (tipo !== "vuelo" && tipo !== "vuelo_hotel") {
    return NextResponse.json({ ok: false, error: "tipo_invalid_in_metadata" }, { status: 400 });
  }

  const email =
    session.customer_details?.email ||
    session.customer_email ||
    "";
  if (!email) {
    return NextResponse.json({ ok: false, error: "email_missing" }, { status: 400 });
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

  // Notify Telegram (best-effort)
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    const msg =
      `🎟️ NUEVO TICKET AGENCIA\n` +
      `id: ${ticket.id}\n` +
      `tipo: ${tipo} · €${ticket.amount_eur}\n` +
      `email: ${email}\n` +
      `ruta: ${ticket.request.origin || "?"} → ${ticket.request.destination || "?"}\n` +
      `fechas: ${ticket.request.date_out || "?"} → ${ticket.request.date_ret || "?"}\n` +
      `pax: ${ticket.request.pasajeros || "?"} · presupuesto: €${ticket.request.presupuesto || "?"}\n` +
      `notas: ${ticket.request.notas || "(sin notas)"}\n\n` +
      `Procesa <24h. Garantía 7d.`;
    fetch(
      `https://api.telegram.org/bot${tgToken}/sendMessage?chat_id=${tgChat}&text=${encodeURIComponent(msg)}`,
    ).catch(() => {});
  }

  // Notify cliente vía Resend (best-effort)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Agencia TripCazador <agencia@tripcazador.com>",
        to: [email],
        subject: `Hemos recibido tu petición — ticket ${ticket.id}`,
        html:
          `<p>Hola,</p>` +
          `<p>Hemos recibido tu petición de <strong>${tipo === "vuelo" ? "Vuelo solo" : "Vuelo + Hotel"}</strong> (€${ticket.amount_eur}).</p>` +
          `<p><strong>Ticket:</strong> ${ticket.id}<br>` +
          `<strong>Garantía:</strong> mejor precio durante 7 días. Si encuentras lo mismo más barato, te devolvemos pago + 1 mes Premium gratis.</p>` +
          `<p>Te enviaremos las 3 mejores opciones en menos de 24h.</p>` +
          `<p>— Equipo TripCazador</p>`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, ticket_id: ticket.id });
}
