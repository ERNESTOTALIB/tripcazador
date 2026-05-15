import { NextResponse } from "next/server";
import { CONCIERGE_TIERS, isValidTier, type ConciergeTier } from "@/lib/concierge_tiers";

/**
 * /api/concierge/webhook — fase sss SSS10 (May 2026, tiered)
 *
 * Stripe webhook para `checkout.session.completed` del flujo Concierge tiered.
 *
 * Comportamiento:
 *   1. Verifica firma Stripe con STRIPE_WEBHOOK_SECRET (si no está → 503)
 *   2. Si event.type === "checkout.session.completed":
 *        - Lee metadata.tier (express|standard|premium|pro). Fallback a
 *          "standard" si está ausente o inválido (retro-compat).
 *        - Forwardea metadata + tier al backend FastAPI VPS para marcarlo
 *          paid + disparar email de confirmación al cliente.
 *        - Notifica a Telegram (canal owner) con formato tier-aware:
 *            "🎯 Nuevo pedido Concierge {TIER}\n..."
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
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
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
    if (!res.ok) {
      // SSS192 (15 may 2026): antes silent — nuevo pedido Concierge VIP no
      // notificaba al admin sin saber por qué. Revenue-critical: orders
      // express €2000+ requieren respuesta humana en <24h.
      const body = await res.text().catch(() => "<unread>");
      console.error(`[concierge-webhook] notifyTelegram HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
  } catch (err) {
    console.error(
      `[concierge-webhook] notifyTelegram error: ${err instanceof Error ? err.message : String(err)}`,
    );
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
      // tier-aware con fallback retro-compat a "standard"
      const tier: ConciergeTier = isValidTier(meta.tier) ? meta.tier : "standard";
      const tierDef = CONCIERGE_TIERS[tier];

      const amountTotalEur =
        typeof obj.amount_total === "number"
          ? obj.amount_total / 100
          : tierDef.amount_eur;

      const orderPayload = {
        order_id: meta.order_id || "",
        stripe_session_id: obj.id || "",
        email: obj.customer_email || meta.email || "",
        amount_total: amountTotalEur,
        currency: (obj.currency || "eur").toUpperCase(),
        tier,
        tier_name: tierDef.name,
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
        `🎯 *Nuevo pedido Concierge ${tierDef.name.toUpperCase()}*\n\n` +
        `📧 ${orderPayload.email}\n` +
        `✈️ ${orderPayload.origin} → ${orderPayload.destination}\n` +
        `📅 ${orderPayload.date_from}${orderPayload.date_to ? ` → ${orderPayload.date_to}` : ""} (±${orderPayload.flex_days}d)\n` +
        `👥 ${orderPayload.travelers} pax · ${orderPayload.hotel_stars}★\n` +
        `💰 Presupuesto cliente: ${orderPayload.budget}€\n` +
        `💳 Pagado: *${amountTotalEur}€* (${tierDef.delivery_label})\n` +
        `🆔 ${orderPayload.order_id}`;
      await notifyTelegram(tgMsg);
    }
  }

  return NextResponse.json({ received: true, type: event.type });
}
