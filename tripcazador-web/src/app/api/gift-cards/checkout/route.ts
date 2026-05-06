import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isValidGiftAmount, STRIPE_PRICE_BY_AMOUNT, type GiftAmount } from "@/lib/gift_cards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { amount?: number; recipient_email?: string; recipient_name?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!isValidGiftAmount(amount)) {
    return NextResponse.json({ error: "Importe inválido (25/50/100/200)" }, { status: 400 });
  }
  const recipientEmail = (body.recipient_email || "").trim().slice(0, 200);
  const recipientName = (body.recipient_name || "").trim().slice(0, 80);
  const message = (body.message || "").trim().slice(0, 200);

  if (recipientEmail && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(recipientEmail)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe no configurado (STRIPE_SECRET_KEY missing)" },
      { status: 503 },
    );
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
    const priceId = STRIPE_PRICE_BY_AMOUNT[amount as GiftAmount];
    const origin = req.headers.get("origin") || "https://tripcazador.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/regalo/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/regalo`,
      metadata: {
        kind: "gift_card",
        amount: String(amount),
        recipient_email: recipientEmail || "",
        recipient_name: recipientName || "",
        message: message || "",
      },
      payment_intent_data: {
        metadata: {
          kind: "gift_card",
          amount: String(amount),
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "checkout failed";
    console.error("[/api/gift-cards/checkout] error", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
