/**
 * stripe_coupon_applier.ts — SSS324 (19 may 2026)
 *
 * Helper para aplicar un coupon Stripe a la subscription activa de un
 * customer. Usado en /api/premium/referral/redeem para automatizar el
 * "1 mes gratis" cuando se redime un referral, en lugar de aplicar el
 * coupon manualmente desde el dashboard.
 *
 * Es defensivo:
 *  - Si STRIPE_SECRET_KEY o STRIPE_REFERRAL_COUPON_ID no están seteados →
 *    devuelve {attempted:false} (no afecta el redeem).
 *  - Si Stripe API falla en uno de los dos customers, no aborta el resto.
 *  - Errores se loguean pero no se exponen al cliente.
 *
 * El coupon debe existir en Stripe Dashboard (operacional). Sugerencia:
 *  - Duration: "once" + amount_off: 999 (€9.99) → 1 mes gratis
 *  - O duration: "repeating" + duration_in_months: 1 + percent_off: 100
 *
 * Pure function shape — fácil de stubear en tests via vi.mock.
 */

import Stripe from "stripe";

export interface CouponApplyResult {
  attempted: boolean;
  applied: number;
  skipped: number;
  errors: string[];
}

export interface CouponApplyInput {
  customerIds: string[]; // customer IDs Stripe (cus_xxx)
}

export async function tryApplyReferralCoupon(
  input: CouponApplyInput,
): Promise<CouponApplyResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  const couponId = process.env.STRIPE_REFERRAL_COUPON_ID || "";

  // Defensive defaults — nunca rompemos el redeem si Stripe no está listo
  if (!secretKey || !couponId) {
    return { attempted: false, applied: 0, skipped: input.customerIds.length, errors: [] };
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
  let applied = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const customerId of input.customerIds) {
    if (!customerId || !customerId.startsWith("cus_")) {
      skipped += 1;
      continue;
    }
    try {
      // Listar subs activas del customer (típicamente 1 Premium activa)
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      const sub = subs.data[0];
      if (!sub) {
        skipped += 1;
        continue;
      }
      // Aplicar coupon (replazará cualquier discount existente)
      await stripe.subscriptions.update(sub.id, {
        discounts: [{ coupon: couponId }],
      });
      applied += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${customerId}: ${msg.slice(0, 120)}`);
      skipped += 1;
    }
  }

  return { attempted: true, applied, skipped, errors };
}
