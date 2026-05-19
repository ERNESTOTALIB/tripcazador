/**
 * /api/premium/referral/me — SSS320 (19 may 2026)
 *
 * Devuelve el código de referral del Premium + sus stats:
 *  - code (TC-XXXXXXXX, derivado deterministamente del customerId)
 *  - share_url (landing /premium con ?ref=CODE)
 *  - referrals_count (cuántos amigos se han suscrito usando su code)
 *  - rewarded_count (cuántos ya tienen la extensión 30d aplicada)
 *
 * GET ?customer_id=cus_xxx → 200
 *
 * AUTH: posesión del customerId Stripe.
 */

import { NextRequest, NextResponse } from "next/server";
import { isValidStripeOwnerId } from "@/lib/stripe_id";
import {
  deriveCodeFromCustomer,
  listReferralsByReferrer,
  REFERRAL_CAP_PER_CUSTOMER,
} from "@/lib/referral_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = "https://tripcazador.com";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const customerId = req.nextUrl.searchParams.get("customer_id") || "";
  if (!isValidStripeOwnerId(customerId)) {
    return NextResponse.json(
      { ok: false, error: "customer_id_invalid" },
      { status: 400 },
    );
  }

  const code = deriveCodeFromCustomer(customerId);
  const refs = await listReferralsByReferrer(customerId);
  const rewarded = refs.filter((r) => r.rewarded_at !== null).length;

  return NextResponse.json({
    ok: true,
    code,
    // SSS321: incluir referrer customerId (r=) en el share_url para que
    // el flujo de redeem post-checkout sepa quién refirió. El customerId
    // ya es no-secret (cookie tc_premium lo expone para gating UI).
    share_url: `${SITE_URL}/premium?ref=${encodeURIComponent(code)}&r=${encodeURIComponent(customerId)}`,
    referrals_count: refs.length,
    rewarded_count: rewarded,
    cap: REFERRAL_CAP_PER_CUSTOMER,
    cap_remaining: Math.max(0, REFERRAL_CAP_PER_CUSTOMER - refs.length),
  });
}
