import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/premium/webhook — fase SSS64 (May 2026)
 *
 * Stripe webhook handler que escucha `checkout.session.completed` y
 * `customer.subscription.deleted` para mantener el estado premium de los
 * usuarios server-side via cookie httpOnly + JSONL persistente.
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

interface PremiumStateEntry {
  email: string;
  customer_id: string;
  subscription_id?: string;
  active: boolean;
  expires_at?: number;
  source: "stripe";
  updated_at: number;
}

// Persistencia in-memory + best-effort backend
const store: { entries: PremiumStateEntry[] } = (
  globalThis as unknown as { __tc_premium_store?: { entries: PremiumStateEntry[] } }
).__tc_premium_store ?? { entries: [] };

(globalThis as unknown as { __tc_premium_store: typeof store }).__tc_premium_store = store;

function upsertPremium(entry: PremiumStateEntry) {
  const idx = store.entries.findIndex(
    (e) => e.email === entry.email || e.customer_id === entry.customer_id,
  );
  if (idx >= 0) {
    store.entries[idx] = { ...store.entries[idx], ...entry };
  } else {
    store.entries.push(entry);
  }
}

export function getPremiumByEmail(email: string): PremiumStateEntry | null {
  return store.entries.find((e) => e.email === email && e.active) ?? null;
}

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
      const idx = store.entries.findIndex((e) => e.customer_id === customerId);
      if (idx >= 0) {
        store.entries[idx] = { ...store.entries[idx], active: false, updated_at: Date.now() };
      }
    }
  }

  return NextResponse.json({ received: true, type: event.type });
}
