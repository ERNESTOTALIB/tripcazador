import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * /api/stripe/webhook — fase SSS9 LIVE
 *
 * Recibe eventos de Stripe (checkout.session.completed, subscription.*,
 * invoice.payment_succeeded/failed) y los procesa:
 *   1. Verifica la firma HMAC contra STRIPE_WEBHOOK_SECRET
 *   2. Loguea el evento (puede persistirse en VPS posterior)
 *   3. Notifica via Telegram al admin sobre cada nueva suscripción / cancelación
 *
 * Vars necesarias:
 *   - STRIPE_SECRET_KEY
 *   - STRIPE_WEBHOOK_SECRET
 *   - TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (opcional para notificaciones admin)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RELEVANT_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
]);

async function notifyAdmin(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // Silencioso — no bloqueamos el webhook si Telegram falla
  }
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    console.error("[stripe-webhook] missing env vars");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  // Stripe requiere el body raw para verificar firma
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "invalid_signature";
    console.error("[stripe-webhook] signature verification failed:", msg);
    return NextResponse.json({ error: "invalid_signature", message: msg }, { status: 400 });
  }

  // Solo procesamos eventos relevantes (filtramos ruido)
  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, type: event.type, skipped: true });
  }

  // Procesar evento + notificar admin
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const email = s.customer_details?.email || s.customer_email || "?";
        const amount = s.amount_total ? (s.amount_total / 100).toFixed(2) : "?";
        await notifyAdmin(
          `🎉 <b>Nueva suscripción Premium</b>\n` +
            `Email: ${email}\n` +
            `Importe: ${amount} €\n` +
            `Sesión: ${s.id}`,
        );
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await notifyAdmin(
          `📅 <b>Suscripción ${event.type.split(".").pop()}</b>\n` +
            `ID: ${sub.id}\n` +
            `Status: ${sub.status}\n` +
            `Customer: ${sub.customer}`,
        );
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await notifyAdmin(
          `❌ <b>Suscripción cancelada</b>\n` +
            `ID: ${sub.id}\n` +
            `Customer: ${sub.customer}`,
        );
        break;
      }
      case "invoice.payment_succeeded": {
        const inv = event.data.object as Stripe.Invoice;
        const amount = inv.amount_paid ? (inv.amount_paid / 100).toFixed(2) : "?";
        await notifyAdmin(
          `💰 <b>Pago recibido</b>\n` +
            `Importe: ${amount} €\n` +
            `Customer: ${inv.customer}`,
        );
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        await notifyAdmin(
          `⚠️ <b>Pago FALLIDO</b>\n` +
            `Customer: ${inv.customer}\n` +
            `Reintento próximo: ${inv.next_payment_attempt ? new Date(inv.next_payment_attempt * 1000).toISOString() : "—"}`,
        );
        break;
      }
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "handler_error";
    console.error("[stripe-webhook] handler error:", msg);
    // 200 igual para que Stripe no reintente; loggeamos en server.
    return NextResponse.json({ received: true, error: msg });
  }
}
