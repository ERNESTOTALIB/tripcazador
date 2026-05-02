import { NextResponse } from "next/server";
import { generateOrderId, type ConciergeOrder } from "@/lib/concierge_store";

/**
 * /api/concierge/checkout — fase ppp PPP1 (May 2026)
 *
 * Recibe POST del ConciergeForm con los datos del viaje. Comportamiento:
 *   - Si STRIPE_SECRET_KEY + STRIPE_PRICE_CONCIERGE están en env →
 *       crea Stripe Checkout Session (mode "payment") con metadata del pedido
 *       y devuelve { url } para redirect.
 *   - Si no →
 *       guarda el pedido en backend FastAPI (best-effort) y devuelve
 *       503 { error: "stripe_not_configured" } para que el form muestre
 *       "Pago aún no operativo". El pedido queda registrado para que cuando
 *       se enchufe Stripe se pueda contactar al usuario.
 *
 * IMPORTANTE: nunca lanza 500 hacia el cliente — siempre devuelve JSON
 * estructurado con `error` o `url`/`status`.
 *
 * Cuando se enchufe Stripe (5 min):
 *   1. npm i stripe
 *   2. uncomment dynamic import de stripe abajo
 *   3. setear STRIPE_SECRET_KEY (sk_test_...) + STRIPE_PRICE_CONCIERGE (price_...)
 *      en Vercel env (Production + Preview)
 *   4. configurar webhook /api/concierge/webhook con STRIPE_WEBHOOK_SECRET
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckoutInput {
  email?: string;
  origin?: string;
  destination?: string;
  date_from?: string;
  date_to?: string;
  flex_days?: number;
  budget?: number;
  travelers?: number;
  hotel_stars?: number;
  notes?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

function buildOrder(input: CheckoutInput): ConciergeOrder | null {
  if (!input.email || !EMAIL_RE.test(input.email)) return null;
  if (!input.origin || !input.destination || !input.date_from) return null;

  return {
    id: generateOrderId(),
    email: input.email.trim().toLowerCase(),
    status: "pending",
    createdAt: new Date().toISOString(),
    origin: input.origin.trim().toUpperCase().slice(0, 64),
    destination: input.destination.trim().slice(0, 128),
    date_from: input.date_from,
    date_to: input.date_to || "",
    flex_days: clampInt(input.flex_days, 0, 14, 3),
    budget: clampInt(input.budget, 200, 20000, 1500),
    travelers: clampInt(input.travelers, 1, 10, 2),
    hotel_stars: clampInt(input.hotel_stars, 3, 5, 4),
    notes: (input.notes || "").slice(0, 1000),
    amount_paid_eur: 19,
  };
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Best-effort: enviar al backend FastAPI VPS para que persista el pedido
 * en su DB (sobrevive cold-starts de lambda). Falla silenciosa.
 */
async function persistToBackend(order: ConciergeOrder): Promise<void> {
  if (!BACKEND_URL || !ADMIN_TOKEN) return;
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 3000);
    await fetch(`${BACKEND_URL}/api/admin/concierge/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify(order),
      signal: ctrl.signal,
    });
    clearTimeout(timeout);
  } catch {
    /* no-op: persistencia best-effort */
  }
}

export async function POST(req: Request) {
  let body: CheckoutInput = {};
  try {
    body = (await req.json()) as CheckoutInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const order = buildOrder(body);
  if (!order) {
    return NextResponse.json(
      { error: "invalid_input", hint: "email + origin + destination + date_from son obligatorios" },
      { status: 400 },
    );
  }

  // Best-effort persistencia (no bloquea la respuesta)
  void persistToBackend(order);

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_CONCIERGE;

  // Sin Stripe → modo "lista de espera": pedido guardado, pago próximamente.
  // Devolvemos 200 con status="pending_setup" para que el cliente lo guarde
  // local (en lugar de tratar como error). El form ya maneja este caso.
  if (!stripeKey || !priceId) {
    return NextResponse.json({
      status: "pending_setup",
      order_id: order.id,
      message:
        "Pedido recibido. El pago aún no está activo — te contactaremos por email cuando se active.",
      order: {
        id: order.id,
        email: order.email,
        origin: order.origin,
        destination: order.destination,
        date_from: order.date_from,
        date_to: order.date_to,
        flex_days: order.flex_days,
        budget: order.budget,
        travelers: order.travelers,
        hotel_stars: order.hotel_stars,
        notes: order.notes,
        amount_paid_eur: order.amount_paid_eur,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  }

  // Stripe está configurado: crear Checkout Session
  try {
    // Dynamic import: si stripe no está instalado, fallback a 503
    // ts-bypass: stripe es peer dep opcional, se instala con `npm i stripe` cuando se enchufan keys
    const stripeModule = (await import(
      /* webpackIgnore: true */ "stripe" as string
    ).catch(() => null)) as
      | { default: new (key: string, opts?: unknown) => StripeClient }
      | null;

    if (!stripeModule) {
      return NextResponse.json(
        {
          error: "stripe_sdk_missing",
          order_id: order.id,
          hint: "npm i stripe en tripcazador-web/",
        },
        { status: 503 },
      );
    }

    const stripe = new stripeModule.default(stripeKey, { apiVersion: "2024-12-18.acacia" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: order.email,
      success_url: `${SITE_URL}/concierge/success?order_id=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/concierge?status=cancel`,
      metadata: {
        order_id: order.id,
        email: order.email,
        origin: order.origin,
        destination: order.destination,
        date_from: order.date_from,
        date_to: order.date_to,
        flex_days: String(order.flex_days),
        travelers: String(order.travelers),
        hotel_stars: String(order.hotel_stars),
        budget: String(order.budget),
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "stripe_no_url", order_id: order.id },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url, order_id: order.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "stripe_session_failed", detail: msg, order_id: order.id },
      { status: 502 },
    );
  }
}

// Tipo mínimo para evitar dep dura del SDK cuando aún no está instalado.
interface StripeClient {
  checkout: {
    sessions: {
      create: (params: Record<string, unknown>) => Promise<{ url: string | null; id: string }>;
    };
  };
}
