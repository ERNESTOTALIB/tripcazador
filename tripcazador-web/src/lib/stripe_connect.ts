/**
 * stripe_connect.ts — SSS406 (21 may 2026)
 *
 * Skeleton helpers para Stripe Connect Express onboarding. Permite que
 * partners B2B (agencias) reciban payouts automáticos sin que el operator
 * tenga que hacer SEPA manual cada mes.
 *
 * Flow esperado:
 *  1. Partner aprobado → opera /panel/partner/[ref_code] muestra CTA
 *     "Activar payouts automáticos".
 *  2. POST /api/partner-payouts/onboard → stripe.accounts.create(Express)
 *     + accountLinks.create con refresh_url + return_url.
 *  3. Partner completa onboarding Stripe (KYC + bank account).
 *  4. Vercel webhook account.updated detecta charges_enabled=true →
 *     marca partner.payout_active=true.
 *  5. Cron monthly transfer: para cada partner active con
 *     total_payout_eur >= €25, stripe.transfers.create(amount, destination).
 *     Resetea contador.
 *
 * SIN env vars `STRIPE_SECRET_KEY` (LIVE) este module está dormido.
 * El user/operator activa el flow cuando esté listo financieramente.
 *
 * Pure helpers (no llamada real Stripe). Wire en /api/partner-payouts/*
 * cuando necesario.
 */

import type { AgencyPartner } from "./agency_partner";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";

export interface ConnectAccountSpec {
  /** Email del partner (KYC) */
  email: string;
  /** País del partner (ISO-2). Default ES. */
  country?: string;
  /** business_type según Stripe: individual | company */
  business_type?: "individual" | "company";
  /** Reference back to internal partner */
  ref_code: string;
}

export interface OnboardLinkResult {
  ok: boolean;
  url?: string;
  account_id?: string;
  expires_at?: number;
  reason?: string;
}

/**
 * Crea Express account + onboarding link. Stub que devuelve canned cuando
 * STRIPE_SECRET_KEY no configurado.
 */
export async function createOnboardingLink(
  spec: ConnectAccountSpec,
  baseUrl: string = "https://tripcazador.com",
): Promise<OnboardLinkResult> {
  if (!STRIPE_SECRET) {
    return {
      ok: false,
      reason: "stripe_not_configured",
    };
  }

  try {
    // Lazy import para no bundlear stripe en builds que no lo usan
    const StripeMod = await import("stripe");
    const Stripe = StripeMod.default;
    // apiVersion omitido — usa el del package instalado para evitar TS mismatch
    const stripe = new Stripe(STRIPE_SECRET);

    // 1) Crear Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: spec.country || "ES",
      email: spec.email,
      business_type: spec.business_type || "individual",
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        ref_code: spec.ref_code,
        source: "tripcazador_partners_b2b",
      },
    });

    // 2) Crear onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/panel/partner/${spec.ref_code}?onboard=retry`,
      return_url: `${baseUrl}/panel/partner/${spec.ref_code}?onboard=done`,
      type: "account_onboarding",
    });

    return {
      ok: true,
      url: accountLink.url,
      account_id: account.id,
      expires_at: accountLink.expires_at * 1000,
    };
  } catch (e) {
    return {
      ok: false,
      reason: `stripe_error_${String(e).slice(0, 40)}`,
    };
  }
}

/**
 * Calcula el payout pendiente que es elegible para transferir. Reglas:
 *  - partner.status === "active"
 *  - partner.total_payout_eur >= €25 (minimum payout)
 *  - partner debe tener stripe_account_id (post-onboarding)
 *  - moneda EUR
 */
export function isPayoutEligible(
  partner: AgencyPartner & { stripe_account_id?: string; payout_active?: boolean },
): { eligible: boolean; amount_eur: number; reason?: string } {
  if (partner.status !== "active") {
    return { eligible: false, amount_eur: 0, reason: "partner_not_active" };
  }
  if (!partner.stripe_account_id) {
    return { eligible: false, amount_eur: 0, reason: "no_stripe_account" };
  }
  if (!partner.payout_active) {
    return { eligible: false, amount_eur: 0, reason: "onboarding_incomplete" };
  }
  if (partner.total_payout_eur < 25) {
    return {
      eligible: false,
      amount_eur: partner.total_payout_eur,
      reason: "below_minimum_25",
    };
  }
  return {
    eligible: true,
    amount_eur: Math.round(partner.total_payout_eur * 100) / 100,
  };
}

/**
 * Helper para Stripe webhook handler — detecta cuándo account.updated
 * indica que onboarding está completo (charges_enabled true + payouts
 * enabled true).
 */
export function isOnboardingComplete(
  stripeAccount: { charges_enabled?: boolean; payouts_enabled?: boolean; details_submitted?: boolean },
): boolean {
  return !!(
    stripeAccount.charges_enabled &&
    stripeAccount.payouts_enabled &&
    stripeAccount.details_submitted
  );
}

export const __test__ = {
  isOnboardingComplete,
  isPayoutEligible,
  STRIPE_CONFIGURED: !!STRIPE_SECRET,
};
