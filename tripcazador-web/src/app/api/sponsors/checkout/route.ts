/**
 * /api/sponsors/checkout — SUPER-SPONSORS (25 may 2026)
 *
 * Crea una sesión Stripe Checkout one-shot para que una marca pague un
 * slot de sponsorship sin contacto humano previo. Reemplaza el flow
 * mailto en /patrocinadores.
 *
 * Body POST { tier, brand, url, contact_email, tagline? }
 *
 * Si STRIPE_PRICE_SPONSOR_* no están configurados, responde 503 y el
 * front degrada a mailto link como fallback.
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSponsorTier, SPONSOR_TIER_SLUGS } from "@/lib/sponsors_catalog";
import { captureRevenueError } from "@/lib/sentry_helper";

export const runtime = "nodejs";

interface SponsorCheckoutBody {
  tier?: string;
  brand?: string;
  url?: string;
  contact_email?: string;
  tagline?: string;
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

  if (!stripeKey) {
    return NextResponse.json(
      { error: "stripe_not_configured", hint: "Falta STRIPE_SECRET_KEY" },
      { status: 503 },
    );
  }

  let body: SponsorCheckoutBody = {};
  try {
    body = (await req.json()) as SponsorCheckoutBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { tier, brand, url, contact_email, tagline } = body;

  if (!tier || !SPONSOR_TIER_SLUGS.includes(tier as never)) {
    return NextResponse.json(
      { error: "invalid_tier", valid: SPONSOR_TIER_SLUGS },
      { status: 400 },
    );
  }
  if (!brand || typeof brand !== "string" || brand.length < 2 || brand.length > 80) {
    return NextResponse.json({ error: "invalid_brand" }, { status: 400 });
  }
  if (!url || typeof url !== "string" || !isValidUrl(url)) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }
  if (
    !contact_email ||
    typeof contact_email !== "string" ||
    !contact_email.includes("@")
  ) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const t = getSponsorTier(tier);
  if (!t) {
    return NextResponse.json({ error: "tier_not_found" }, { status: 400 });
  }

  const priceId = process.env[t.envPriceId];
  if (!priceId) {
    return NextResponse.json(
      {
        error: "sponsor_price_not_configured",
        hint: `Falta ${t.envPriceId} en Vercel env`,
        contact: "partners@tripcazador.com",
      },
      { status: 503 },
    );
  }

  const stripe = new Stripe(stripeKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/patrocinadores?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/patrocinadores?status=cancel`,
      customer_email: contact_email,
      allow_promotion_codes: false,
      billing_address_collection: "required",
      metadata: {
        source: "sponsor_checkout",
        tier: t.slug,
        brand: brand.slice(0, 80),
        url: url.slice(0, 200),
        tagline: (tagline || "").slice(0, 140),
        contact_email,
      },
    });

    return NextResponse.json({
      url: session.url,
      id: session.id,
      tier: t.slug,
      price_eur: t.priceEur,
      duration_days: t.durationDays,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "stripe_error";
    captureRevenueError(e, {
      module: "sponsor_checkout",
      code: "stripe_session_failed",
      extra: { tier: t.slug, brand },
    });
    return NextResponse.json(
      { error: "stripe_session_failed", message: msg },
      { status: 500 },
    );
  }
}
