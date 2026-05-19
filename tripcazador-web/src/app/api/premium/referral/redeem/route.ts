/**
 * /api/premium/referral/redeem — SSS320 (19 may 2026)
 *
 * Llamado desde la landing /premium cuando un nuevo Premium se activa
 * con un ?ref=CODE en la URL. Crea el registro de referral (referrer
 * + referred + code) tras validar:
 *  - Ambos customer_ids son válidos Stripe IDs
 *  - El code matchea el deriveCodeFromCustomer(referrer)
 *  - El referred no se está auto-refiriendo
 *  - El referred no ha sido referido antes (1x per customer)
 *  - El referrer no superó el cap
 *
 * POST { referrer_customer_id, referred_customer_id, code }
 *   → 201 { ok, referral }
 *   → 4xx con error específico
 *
 * Nota: este endpoint NO modifica Stripe — solo registra la pareja.
 * El proceso de extender ambas suscripciones 30d es operacional
 * (admin reviews + applies coupon en Stripe Dashboard). Cuando se
 * hace, marcamos rewarded_at via un endpoint admin separado.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  redeemReferral,
  markReferralRewarded,
  ReferralError,
} from "@/lib/referral_store";
import { tryApplyReferralCoupon } from "@/lib/stripe_coupon_applier";

// SSS329 H2: freshness check para evitar que un atacante pre-emption
// un referral usando arbitrary customerIds estables. Solo aceptamos
// referred_customer_id si el customer fue creado en Stripe en los
// últimos N minutos (= viene de un checkout reciente).
const FRESH_CUSTOMER_WINDOW_SEC = 30 * 60; // 30 min

async function isFreshStripeCustomer(customerId: string): Promise<boolean> {
  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  // Si no hay Stripe key, no podemos verificar — bypass por backwards
  // compat (los tests + dev sin Stripe siguen funcionando). En PROD
  // siempre estará seteado.
  if (!secretKey) return true;
  if (!/^cus_[A-Za-z0-9]{8,}$/.test(customerId)) return false;
  try {
    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
    const customer = await stripe.customers.retrieve(customerId);
    if (typeof customer === "string") return false;
    // Stripe type narrowing: Customer | DeletedCustomer. DeletedCustomer
    // tiene { id, object: 'customer', deleted: true } sin created.
    if ("deleted" in customer && customer.deleted) return false;
    const createdSec = (customer as Stripe.Customer).created;
    if (typeof createdSec !== "number") return false;
    const ageSec = Math.floor(Date.now() / 1000) - createdSec;
    return ageSec >= 0 && ageSec <= FRESH_CUSTOMER_WINDOW_SEC;
  } catch {
    // Si Stripe falla, fail-closed (rechazar) para no permitir abuso
    return false;
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const referrer = String(body.referrer_customer_id || "");
  const referred = String(body.referred_customer_id || "");
  const code = String(body.code || "");

  // SSS329 H2: validar que referred es un customer FRESH (creado <30min)
  // antes de redimir. Esto evita que un atacante pre-emption arbitrary
  // customerIds estables (cus_xxx no es completamente opaco —
  // expuesto en cookie tc_premium SSS305, en logs/analytics, etc).
  // Solo skip si referred no parece Stripe customer (cs_test_xxx legacy).
  if (referred.startsWith("cus_")) {
    const fresh = await isFreshStripeCustomer(referred);
    if (!fresh) {
      return NextResponse.json(
        { ok: false, error: "referred_not_fresh" },
        { status: 403 },
      );
    }
  }

  try {
    const entry = await redeemReferral({
      referrer_customer_id: referrer,
      referred_customer_id: referred,
      code,
    });

    // SSS324: tras registrar la pareja, intentar aplicar coupon Stripe a
    // ambas subs. Si funciona, marcar rewarded_at automáticamente.
    // No bloquea el redeem si Stripe falla — el redeem ya se hizo,
    // ops puede aplicar el coupon manual via mark-rewarded admin.
    let coupon: Awaited<ReturnType<typeof tryApplyReferralCoupon>> | null = null;
    try {
      coupon = await tryApplyReferralCoupon({
        customerIds: [referrer, referred],
      });
      if (coupon.attempted && coupon.applied > 0) {
        await markReferralRewarded(entry.id);
      }
    } catch (couponErr) {
      console.error("[referral/redeem] coupon apply error:", couponErr);
    }

    return NextResponse.json(
      {
        ok: true,
        referral: entry,
        coupon: coupon
          ? {
              attempted: coupon.attempted,
              applied: coupon.applied,
              skipped: coupon.skipped,
              // errors NO expuestos al cliente (pueden incluir info Stripe sensible)
            }
          : { attempted: false, applied: 0, skipped: 0 },
      },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof ReferralError) {
      // 409 para conflictos lógicos (ya usado, self, cap), 400 para invalidación
      const conflict = [
        "referred_already_used",
        "referrer_cap_reached",
        "self_referral_forbidden",
      ].includes(e.reason);
      return NextResponse.json(
        { ok: false, error: e.reason },
        { status: conflict ? 409 : 400 },
      );
    }
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
