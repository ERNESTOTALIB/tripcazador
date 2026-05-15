import { NextResponse } from "next/server";
import { generateOrderId, type ConciergeOrder } from "@/lib/concierge_store";
import {
  CONCIERGE_TIERS,
  DEFAULT_TIER,
  getTier,
  isValidTier,
  resolvePriceIdForTier,
  type ConciergeTier,
} from "@/lib/concierge_tiers";
import { captureRevenueError } from "@/lib/sentry_helper";

/**
 * /api/concierge/checkout — fase sss SSS10 (May 2026, tiered)
 *
 * Recibe POST del ConciergeForm con los datos del viaje + `tier`. Comportamiento:
 *   - `tier` ∈ {express, standard, premium, pro} (allowlist anti-injection).
 *     Si falta o es inválido → fallback a "standard".
 *   - Si STRIPE_SECRET_KEY + STRIPE_PRICE_CONCIERGE_<TIER> están en env →
 *       crea Stripe Checkout Session (mode "payment", one-time NO suscripción)
 *       con metadata.tier para que el webhook sepa qué se pagó.
 *   - Si no →
 *       guarda el pedido en backend FastAPI (best-effort) y devuelve
 *       200 { status: "pending_setup", order } para que el form muestre
 *       "lista de espera". El pedido queda registrado para que cuando se
 *       enchufe Stripe se pueda contactar al usuario.
 *
 * Retro-compat:
 *   - Soporta env legacy `STRIPE_PRICE_CONCIERGE` para tier "standard"
 *     (si STRIPE_PRICE_CONCIERGE_STANDARD no está seteado).
 *
 * IMPORTANTE: nunca lanza 500 hacia el cliente — siempre devuelve JSON
 * estructurado con `error` o `url`/`status`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckoutInput {
  tier?: string;
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

function buildOrder(input: CheckoutInput, tier: ConciergeTier): ConciergeOrder | null {
  if (!input.email || !EMAIL_RE.test(input.email)) return null;
  if (!input.origin || !input.destination || !input.date_from) return null;

  const tierDef = CONCIERGE_TIERS[tier];

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
    amount_paid_eur: tierDef.amount_eur,
    tier,
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

/**
 * Resuelve el price ID respetando legacy: si tier = standard y solo está
 * seteada la env legacy `STRIPE_PRICE_CONCIERGE`, usar esa.
 */
function resolvePriceIdWithLegacy(tier: ConciergeTier): string | null {
  const fresh = resolvePriceIdForTier(tier);
  if (fresh) return fresh;
  if (tier === "standard") {
    const legacy = process.env.STRIPE_PRICE_CONCIERGE;
    if (legacy && legacy.startsWith("price_")) return legacy;
  }
  return null;
}

export async function POST(req: Request) {
  let body: CheckoutInput = {};
  try {
    body = (await req.json()) as CheckoutInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Validación tier — allowlist (anti-injection)
  const tier: ConciergeTier = isValidTier(body.tier) ? body.tier : DEFAULT_TIER;
  const tierDef = getTier(tier);
  if (!tierDef) {
    return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
  }

  const order = buildOrder(body, tier);
  if (!order) {
    return NextResponse.json(
      { error: "invalid_input", hint: "email + origin + destination + date_from son obligatorios" },
      { status: 400 },
    );
  }

  // SSS180 (May 2026): antes era `void persistToBackend(order)` fire-and-forget
  // → Vercel Node runtime no garantiza ejecución de async callbacks tras
  // response. En modo "pending_setup" (sin Stripe) el pedido SOLO existe en
  // este backend call → si lambda muere antes del fetch, el cliente recibe
  // "pedido recibido" pero NO hay registro. Pérdida silenciosa de leads.
  //
  // Fix: awaitamos sync. persistToBackend ya tiene timeout 3s interno + try/catch,
  // así que en peor caso añade ~3s de latencia (aceptable: el user está
  // esperando a Stripe checkout de todos modos).
  await persistToBackend(order);

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = resolvePriceIdWithLegacy(tier);

  // Sin Stripe → modo "lista de espera": pedido guardado, pago próximamente.
  if (!stripeKey || !priceId) {
    return NextResponse.json({
      status: "pending_setup",
      order_id: order.id,
      tier,
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
        tier: order.tier,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  }

  // Stripe está configurado: crear Checkout Session (mode "payment" — one-time)
  try {
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
      mode: "payment", // one-time, NUNCA subscription
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: order.email,
      success_url: `${SITE_URL}/concierge/success?order_id=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/concierge?status=cancel&tier=${encodeURIComponent(tier)}`,
      metadata: {
        order_id: order.id,
        tier, // ← clave para que webhook sepa qué se pagó
        tier_name: tierDef.name,
        amount_eur: String(tierDef.amount_eur),
        delivery_hours: String(tierDef.delivery_hours),
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

    return NextResponse.json({ url: session.url, order_id: order.id, tier });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    // SSS181 (May 2026): antes solo devolvíamos error JSON sin tag a Sentry.
    // Failures de Stripe Checkout son revenue-critical: bug invisible durante
    // semanas porque /panel no las cuenta (event_store solo registra success).
    // Now: capture a Sentry vía helper común (con tags module+code estructurados).
    captureRevenueError(err, {
      module: "concierge_checkout",
      code: "stripe_session_failed",
      extra: { order_id: order.id, tier, email_hash: order.email.slice(0, 3) + "***" },
    });
    return NextResponse.json(
      { error: "stripe_session_failed", detail: msg, order_id: order.id, tier },
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
