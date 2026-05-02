import { NextResponse } from "next/server";

/**
 * /api/concierge/webhook — fase ppp PPP1 (May 2026)
 *
 * Stripe webhook para `checkout.session.completed` del flujo /concierge €19.
 *
 * Comportamiento:
 *   1. Verifica firma Stripe con STRIPE_WEBHOOK_SECRET (si no está → 503)
 *   2. Si event.type === "checkout.session.completed":
 *        - Forwardea metadata del pedido al backend FastAPI VPS para
 *          marcarlo paid + disparar email de confirmación al cliente.
 *        - Notifica a Telegram (canal owner) si TELEGRAM_BOT_TOKEN/CHAT_ID
 *          están configurados, para que Ernesto lo vea en tiempo real.
 *   3. Devuelve { received: true } para todos los eventos válidos.
 *
 * IMPORTANTE: Stripe requiere raw body para verificar firma. Por eso usamos
 * `await req.text()` y parseamos manualmente. NO usar req.json().
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID || "";

interface StripeEventLite {
  id: string;
  type: string;
  data: {
    object: {
      id?: string;
      customer_email?: string;
      amount_total?: number;
      currency?: string;
      metadata?: Record<string, string>;
      payment_status?: string;
    };
  };
}

interface StripeClientLite {
  webhooks: {
    constructEvent: (payload: string, sig: string, secret: string) => StripeEventLite;
  };
}

async function notifyBackend(payload: Record<string, unknown>): Promise<void> {
  if (!BACKEND_URL || !ADMIN_TOKEN) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    await fetch(`${BACKEND_URL}/api/admin/concierge/orders/paid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(t);
  } catch {
    /* no-op */
  }
}

async function notifyTelegram(text: string): Promise<void> {
  if (!TELEGRAM_TOKEN || !TELEGRAM_OWNER_CHAT_ID) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_OWNER_CHAT_ID,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
  } catch {
    /* no-op */
  }
}

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json(
      {
        error: "stripe_webhook_not_configured",
        hint: "Configura STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET en Vercel env",
      },
      { status: 503 },
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // Dynamic import: si stripe no está instalado todavía, devuelve 503
  const stripeModule = (await import(
    /* webpackIgnore: true */ "stripe" as string
  ).catch(() => null)) as
    | { default: new (key: string, opts?: unknown) => StripeClientLite }
    | null;

  if (!stripeModule) {
    return NextResponse.json(
      { error: "stripe_sdk_missing", hint: "npm i stripe" },
      { status: 503 },
    );
  }

  const stripe = new stripeModule.default(stripeKey, { apiVersion: "2024-12-18.acacia" });

  let event: StripeEventLite;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "signature_verification_failed", detail: msg },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const obj = event.data.object;
    const meta = obj.metadata || {};
    const paymentStatus = obj.payment_status || "unknown";

    if (paymentStatus === "paid" || paymentStatus === "no_payment_required") {
      const orderPayload = {
        order_id: meta.order_id || "",
        stripe_session_id: obj.id || "",
        email: obj.customer_email || meta.email || "",
        amount_total: typeof obj.amount_total === "number" ? obj.amount_total / 100 : 19,
        currency: (obj.currency || "eur").toUpperCase(),
        origin: meta.origin || "",
        destination: meta.destination || "",
        date_from: meta.date_from || "",
        date_to: meta.date_to || "",
        flex_days: parseInt(meta.flex_days || "3", 10),
        travelers: parseInt(meta.travelers || "2", 10),
        hotel_stars: parseInt(meta.hotel_stars || "4", 10),
        budget: parseInt(meta.budget || "1500", 10),
        paid_at: new Date().toISOString(),
      };

      await notifyBackend(orderPayload);

      const tgMsg =
        `🛎️ *Nuevo pedido Concierge €19*\n\n` +
        `📧 ${orderPayload.email}\n` +
        `✈️ ${orderPayload.origin} → ${orderPayload.destination}\n` +
        `📅 ${orderPayload.date_from}${orderPayload.date_to ? ` → ${orderPayload.date_to}` : ""} (±${orderPayload.flex_days}d)\n` +
        `👥 ${orderPayload.travelers} pax · ${orderPayload.hotel_stars}★\n` +
        `💰 Presupuesto: ${orderPayload.budget}€\n` +
        `🆔 ${orderPayload.order_id}`;
      await notifyTelegram(tgMsg);
    }
  }

  return NextResponse.json({ received: true, type: event.type });
}
