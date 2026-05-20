import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { captureRevenueError } from "@/lib/sentry_helper";

/**
 * /api/premium/checkout — fase SSS9 LIVE + SSS335 (20 may 2026)
 *
 * Crea una sesión Stripe Checkout para suscribir al usuario al plan
 * TripCazador Premium €9.99/mes o €99/año.
 *
 * Body POST { email?, cycle?, gift_recipient? }
 *  - cycle: "monthly" (default) | "annual" | "gift"
 *  - gift_recipient: email del destinatario (solo si cycle=gift)
 *
 * Vars de entorno necesarias:
 *   - STRIPE_SECRET_KEY            (sk_live_...)
 *   - STRIPE_PRICE_PREMIUM         (price_... mensual recurrente)
 *   - STRIPE_PRICE_PREMIUM_ANNUAL  (price_... anual recurrente)  [SSS335]
 *   - STRIPE_PRICE_PREMIUM_GIFT    (price_... one-off €9.99)     [SSS335]
 *   - NEXT_PUBLIC_SITE_URL         (https://tripcazador.com)
 */
export const runtime = "nodejs";

type CheckoutCycle = "monthly" | "annual" | "gift";

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const monthlyPriceId = process.env.STRIPE_PRICE_PREMIUM;
  const annualPriceId = process.env.STRIPE_PRICE_PREMIUM_ANNUAL;
  const giftPriceId = process.env.STRIPE_PRICE_PREMIUM_GIFT;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

  if (!stripeKey || !monthlyPriceId) {
    return NextResponse.json(
      {
        error: "stripe_not_configured",
        hint: "Falta STRIPE_SECRET_KEY o STRIPE_PRICE_PREMIUM en Vercel env",
      },
      { status: 503 },
    );
  }

  const stripe = new Stripe(stripeKey);

  // Body opcional: email + cycle + gift_recipient
  let customerEmail: string | undefined;
  let cycle: CheckoutCycle = "monthly";
  let giftRecipientEmail: string | undefined;
  try {
    const body = await req.json();
    if (body && typeof body.email === "string" && body.email.includes("@")) {
      customerEmail = body.email;
    }
    if (
      body &&
      typeof body.cycle === "string" &&
      ["monthly", "annual", "gift"].includes(body.cycle)
    ) {
      cycle = body.cycle as CheckoutCycle;
    }
    if (
      body &&
      typeof body.gift_recipient === "string" &&
      body.gift_recipient.includes("@")
    ) {
      giftRecipientEmail = body.gift_recipient.trim().toLowerCase();
    }
  } catch {
    // POST sin body es válido — Stripe lo gestiona en checkout
  }

  // SSS335: resolver price + mode según cycle
  let priceId = monthlyPriceId;
  let mode: "subscription" | "payment" = "subscription";
  let plan = "premium-monthly";
  if (cycle === "annual") {
    if (!annualPriceId) {
      return NextResponse.json(
        { error: "annual_not_configured", hint: "Falta STRIPE_PRICE_PREMIUM_ANNUAL" },
        { status: 503 },
      );
    }
    priceId = annualPriceId;
    plan = "premium-annual";
  } else if (cycle === "gift") {
    if (!giftPriceId) {
      return NextResponse.json(
        { error: "gift_not_configured", hint: "Falta STRIPE_PRICE_PREMIUM_GIFT" },
        { status: 503 },
      );
    }
    if (!giftRecipientEmail) {
      return NextResponse.json(
        { error: "gift_recipient_required" },
        { status: 400 },
      );
    }
    priceId = giftPriceId;
    mode = "payment"; // one-off, no recurring
    plan = "premium-gift";
  }

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/premium?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/premium?status=cancel`,
      customer_email: customerEmail,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        source: "premium_checkout_page",
        cycle,
        ...(giftRecipientEmail ? { gift_recipient: giftRecipientEmail } : {}),
      },
    };
    if (mode === "subscription") {
      sessionParams.subscription_data = {
        metadata: { source: "tripcazador.com", plan, cycle },
      };
    }
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url, id: session.id, cycle });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "stripe_error";
    captureRevenueError(e, {
      module: "premium_checkout",
      code: "stripe_session_failed",
      extra: { has_email: !!customerEmail, cycle },
    });
    return NextResponse.json(
      { error: "stripe_session_failed", message: msg },
      { status: 500 },
    );
  }
}
