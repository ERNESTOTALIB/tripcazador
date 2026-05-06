/**
 * gift_cards.ts — F4 (May 2026)
 *
 * Genera codes únicos para gift cards. Persistencia: GH JSONL via /api/track,
 * o en cualquier KV (Vercel KV / Upstash) en futuro. Por ahora in-memory + email.
 *
 * Flow:
 *   1. /regalo → Stripe Checkout (€25/€50/€100 fixed price IDs)
 *   2. Webhook stripe → /api/stripe/webhook detecta giftcard metadata, llama a
 *      issueGiftCard() → genera code TC-XXXX-XXXX → email a comprador con código
 *   3. Receptor entra /regalo/canjear → introduce code → genera link afiliado
 *      con marker especial para tracking de comisión.
 */

import { randomBytes, createHmac } from "crypto";

export type GiftCard = {
  code: string;
  amount_eur: number;
  buyer_email: string;
  recipient_email?: string;
  message?: string;
  created_at: string;
  used: boolean;
  used_at?: string;
};

const VALID_AMOUNTS = [25, 50, 100, 200] as const;
export type GiftAmount = (typeof VALID_AMOUNTS)[number];

export function isValidGiftAmount(n: number): n is GiftAmount {
  return (VALID_AMOUNTS as readonly number[]).includes(n);
}

export const STRIPE_PRICE_BY_AMOUNT: Record<GiftAmount, string> = {
  25: process.env.STRIPE_PRICE_GIFT_25 || "price_gift_25_placeholder",
  50: process.env.STRIPE_PRICE_GIFT_50 || "price_gift_50_placeholder",
  100: process.env.STRIPE_PRICE_GIFT_100 || "price_gift_100_placeholder",
  200: process.env.STRIPE_PRICE_GIFT_200 || "price_gift_200_placeholder",
};

/**
 * Genera código en formato TC-XXXX-XXXX-NN donde NN es checksum HMAC-truncated.
 * Permite verificación offline sin DB.
 */
export function generateGiftCode(): string {
  const secret = process.env.GIFT_CARD_SECRET || "tripcazador-gift-fallback-may-2026";
  const raw = randomBytes(4).toString("hex").toUpperCase(); // 8 hex chars
  const a = raw.slice(0, 4);
  const b = raw.slice(4, 8);
  const body = `TC-${a}-${b}`;
  const sig = createHmac("sha256", secret).update(body).digest("hex").slice(0, 2).toUpperCase();
  return `${body}-${sig}`;
}

export function verifyGiftCode(code: string): boolean {
  const m = code.toUpperCase().match(/^TC-([0-9A-F]{4})-([0-9A-F]{4})-([0-9A-F]{2})$/);
  if (!m) return false;
  const secret = process.env.GIFT_CARD_SECRET || "tripcazador-gift-fallback-may-2026";
  const body = `TC-${m[1]}-${m[2]}`;
  const expected = createHmac("sha256", secret).update(body).digest("hex").slice(0, 2).toUpperCase();
  return expected === m[3];
}
