import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { upsertPremium, deactivateByCustomerId } from "@/lib/premium_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/premium/webhook — fase SSS64 (May 2026)
 *
 * Stripe webhook handler que escucha `checkout.session.completed` y
 * `customer.subscription.deleted` para mantener el estado premium de los
 * usuarios server-side via cookie httpOnly + JSONL persistente.
 *
 * SSS73 (May 2026): el store y getPremiumByEmail/upsertPremium se movieron
 * a `lib/premium_store.ts` porque Next.js 14 no permite exports adicionales
 * en archivos route.ts (solo HTTP verbs + segment config como `runtime`).
 *
 * Setup en Stripe dashboard:
 *   1. Developers → Webhooks → Add endpoint
 *   2. URL: https://tripcazador.com/api/premium/webhook
 *   3. Events: checkout.session.completed, customer.subscription.deleted,
 *              invoice.payment_failed
 *   4. Copy "Signing secret" (whsec_...) → STRIPE_WEBHOOK_SECRET en Vercel
 *
 * Sin STRIPE_WEBHOOK_SECRET configurado devuelve 503 (no acepta nada).
 */

/**
 * Verifica firma Stripe webhook:
 *   Stripe-Signature: t=<ts>,v1=<sig>
 *   sig = HMAC-SHA256(secret, `${ts}.${rawBody}`)
 */
function verifyStripeSignature(rawBody: string, sigHeader: string, secret: string): boolean {
  const parts = sigHeader.split(",");
  let ts = "";
  const sigs: string[] = [];
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === "t") ts = v;
    if (k === "v1") sigs.push(v);
  }
  if (!ts || sigs.length === 0) return false;
  const payload = `${ts}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");
  // Reject events older than 5 min (replay protection)
  const tsNum = parseInt(ts, 10);
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > 300) return false;
  for (const s of sigs) {
    if (s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) {
      return true;
    }
  }
  return false;
}

interface StripeEventPayload {
  type: string;
  data?: {
    object?: {
      id?: string;
      customer?: string;
      customer_email?: string;
      subscription?: string;
      current_period_end?: number;
      metadata?: Record<string, string>;
    };
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }
  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text();
  if (!verifyStripeSignature(raw, sig, secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  let event: StripeEventPayload;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const obj = event.data?.object;

  if (event.type === "checkout.session.completed") {
    const email = String(obj?.customer_email || obj?.metadata?.email || "");
    const customerId = String(obj?.customer || "");
    const subId = obj?.subscription ? String(obj.subscription) : undefined;
    if (email && customerId) {
      upsertPremium({
        email: email.toLowerCase(),
        customer_id: customerId,
        subscription_id: subId,
        active: true,
        expires_at: obj?.current_period_end ? obj.current_period_end * 1000 : Date.now() + 30 * 24 * 3600 * 1000,
        source: "stripe",
        updated_at: Date.now(),
      });
    }
  } else if (
    event.type === "customer.subscription.deleted" ||
    event.type === "invoice.payment_failed"
  ) {
    const customerId = String(obj?.customer || "");
    if (customerId) {
      deactivateByCustomerId(customerId);
    }
  }

  return NextResponse.json({ received: true, type: event.type });
}
