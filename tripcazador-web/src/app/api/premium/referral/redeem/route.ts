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
import {
  redeemReferral,
  ReferralError,
} from "@/lib/referral_store";

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

  try {
    const entry = await redeemReferral({
      referrer_customer_id: referrer,
      referred_customer_id: referred,
      code,
    });
    return NextResponse.json({ ok: true, referral: entry }, { status: 201 });
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
