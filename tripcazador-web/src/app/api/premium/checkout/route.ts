import { NextResponse } from "next/server";

/**
 * /api/premium/checkout — fase ww WW8
 *
 * Stub Stripe Checkout. Cuando STRIPE_SECRET_KEY + STRIPE_PRICE_PREMIUM_MONTHLY
 * estén configurados en Vercel env, este endpoint creará una sesión de Stripe
 * Checkout y devolverá la URL de redirect.
 *
 * Mientras tanto: devuelve 503 para que el cliente haga fallback al trial
 * client-side (activateTrial en localStorage).
 *
 * Cuando se enchufe Stripe (5 min de trabajo):
 *   1. npm i stripe
 *   2. import Stripe from 'stripe'
 *   3. const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
 *   4. const session = await stripe.checkout.sessions.create({
 *        mode: 'subscription',
 *        line_items: [{ price: process.env.STRIPE_PRICE_PREMIUM_MONTHLY, quantity: 1 }],
 *        success_url: 'https://tripcazador.com/premium?status=success',
 *        cancel_url: 'https://tripcazador.com/premium?status=cancel',
 *        subscription_data: { trial_period_days: 7 },
 *      })
 *   5. return { url: session.url }
 */
export async function POST() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY;

  if (!stripeKey || !priceId) {
    return NextResponse.json(
      {
        error: "stripe_not_configured",
        hint: "Configura STRIPE_SECRET_KEY y STRIPE_PRICE_PREMIUM_MONTHLY en Vercel env",
      },
      { status: 503 },
    );
  }

  // TODO: enchufar Stripe SDK cuando keys estén configuradas
  return NextResponse.json(
    { error: "stripe_pending_implementation" },
    { status: 501 },
  );
}
