/**
 * /api/premium/activate — SSS301 (18 may 2026)
 *
 * Endpoint que valida un Stripe Checkout Session ID y devuelve el status
 * Premium para que el cliente lo persista en localStorage. Resuelve el
 * BUG SALEH (SSS297-300): si el usuario cierra la pestaña tras Stripe
 * Checkout antes de volver al sitio, Premium no se activa en localStorage.
 *
 * Flujo correcto post-checkout:
 *   1. Stripe webhook crea la subscription en backend (ya funciona)
 *   2. Stripe redirige a /premium/success?session_id=cs_live_xxx
 *   3. /premium/success llama POST /api/premium/activate { session_id }
 *   4. Esta route valida con Stripe API que session existe + status complete
 *   5. Devuelve { active:true, tier, expiresAt, customerId } al cliente
 *   6. Cliente persiste en localStorage vía setPremiumStatus()
 *
 * SI el usuario nunca llega al success URL (cerró pestaña), también
 * sirve como fallback: pasa el cs_live_... del email recibo Stripe.
 *
 * Seguridad:
 *  - GET con ?session_id=cs_xxx → 200 con status si válido
 *  - 400 si session_id missing o malformado
 *  - 404 si Stripe API no encuentra la session
 *  - 402 si session.payment_status != "paid"
 *
 * NO requiere auth — la posesión del session_id ya es prueba (solo
 * accesible vía email del cliente o redirect del Checkout).
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id") || "";

  // Validate session_id format (Stripe cs_test_xxx or cs_live_xxx)
  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]{20,}$/.test(sessionId)) {
    return NextResponse.json(
      { error: "invalid_session_id", hint: "format cs_(test|live)_<id>" },
      { status: 400 },
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 503 },
    );
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (!session) {
      return NextResponse.json({ error: "session_not_found" }, { status: 404 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        {
          error: "payment_not_complete",
          payment_status: session.payment_status,
        },
        { status: 402 },
      );
    }

    // Extract subscription expiry
    let expiresAt: string | null = null;
    let tier: "premium" | "pro" = "premium";

    if (session.subscription && typeof session.subscription !== "string") {
      const sub = session.subscription as Stripe.Subscription;
      if (sub.current_period_end) {
        expiresAt = new Date(sub.current_period_end * 1000).toISOString();
      }
      // Future: distinguish tier from price_id if there's a "pro" tier
    }

    // Fallback: si no hay subscription pero pagó (one-time?), dar 30 días
    if (!expiresAt) {
      expiresAt = new Date(Date.now() + 30 * 86400_000).toISOString();
    }

    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;

    return NextResponse.json({
      active: true,
      tier,
      expiresAt,
      source: "stripe",
      customerId: customerId || undefined,
      // Echo email para que el cliente pueda confirmar
      email: session.customer_details?.email || null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "stripe_error";
    return NextResponse.json(
      { error: "stripe_lookup_failed", detail: msg.slice(0, 200) },
      { status: 500 },
    );
  }
}
