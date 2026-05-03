import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * /api/premium/checkout — fase SSS9 LIVE
 *
 * Crea una sesión Stripe Checkout para suscribir al usuario al plan
 * TripCazador Premium €2.99/mes recurrente.
 *
 * Vars de entorno necesarias:
 *   - STRIPE_SECRET_KEY        (sk_live_...)
 *   - STRIPE_PRICE_PREMIUM     (price_...)
 *   - NEXT_PUBLIC_SITE_URL     (https://tripcazador.com)
 */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_PREMIUM;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

  if (!stripeKey || !priceId) {
    return NextResponse.json(
      {
        error: "stripe_not_configured",
        hint: "Falta STRIPE_SECRET_KEY o STRIPE_PRICE_PREMIUM en Vercel env",
      },
      { status: 503 },
    );
  }

  const stripe = new Stripe(stripeKey);

  // Email opcional (si user logueado / form lo provee)
  let customerEmail: string | undefined;
  try {
    const body = await req.json();
    if (body && typeof body.email === "string" && body.email.includes("@")) {
      customerEmail = body.email;
    }
  } catch {
    // POST sin body es válido — Stripe lo gestiona en checkout
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/premium?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/premium?status=cancel`,
      customer_email: customerEmail,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      // RGPD: Stripe envía recibo automático al email del comprador
      // y muestra términos de TripCazador en el checkout.
      subscription_data: {
        metadata: {
          source: "tripcazador.com",
          plan: "premium-monthly",
        },
      },
      metadata: {
        source: "premium_checkout_page",
      },
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "stripe_error";
    return NextResponse.json(
      { error: "stripe_session_failed", message: msg },
      { status: 500 },
    );
  }
}
