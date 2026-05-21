/**
 * stripe_connect.test.ts — SSS406
 *
 * Tests pure helpers — no llamadas Stripe (env no configurado en tests).
 */
import { describe, it, expect } from "vitest";
import {
  isPayoutEligible,
  isOnboardingComplete,
  createOnboardingLink,
} from "../stripe_connect";

describe("isPayoutEligible", () => {
  const basePartner = {
    slug: "x",
    ref_code: "TC-AGY-ABCD1234",
    company_name: "X",
    contact_email: "x@x.com",
    status: "active" as const,
    created_at: Date.now(),
    total_referrals: 5,
    total_revenue_eur: 100,
    total_payout_eur: 50,
    stripe_account_id: "acct_xxx",
    payout_active: true,
  };

  it("eligible cuando todo OK + >= €25", () => {
    const r = isPayoutEligible(basePartner);
    expect(r.eligible).toBe(true);
    expect(r.amount_eur).toBe(50);
  });

  it("rechaza partner pending", () => {
    const r = isPayoutEligible({ ...basePartner, status: "pending" });
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("partner_not_active");
  });

  it("rechaza sin stripe_account_id", () => {
    const r = isPayoutEligible({ ...basePartner, stripe_account_id: undefined });
    expect(r.reason).toBe("no_stripe_account");
  });

  it("rechaza si onboarding no completo", () => {
    const r = isPayoutEligible({ ...basePartner, payout_active: false });
    expect(r.reason).toBe("onboarding_incomplete");
  });

  it("rechaza si payout < €25", () => {
    const r = isPayoutEligible({ ...basePartner, total_payout_eur: 12.50 });
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("below_minimum_25");
    expect(r.amount_eur).toBe(12.50);
  });
});

describe("isOnboardingComplete", () => {
  it("true cuando 3 flags true", () => {
    expect(
      isOnboardingComplete({
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      }),
    ).toBe(true);
  });

  it("false si falta alguna flag", () => {
    expect(
      isOnboardingComplete({
        charges_enabled: true,
        payouts_enabled: false,
        details_submitted: true,
      }),
    ).toBe(false);
    expect(
      isOnboardingComplete({
        charges_enabled: false,
        payouts_enabled: true,
        details_submitted: true,
      }),
    ).toBe(false);
    expect(isOnboardingComplete({})).toBe(false);
  });
});

describe("createOnboardingLink sin STRIPE_SECRET", () => {
  it("retorna stripe_not_configured", async () => {
    const r = await createOnboardingLink({
      email: "x@x.com",
      ref_code: "TC-AGY-ABCD1234",
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("stripe_not_configured");
  });
});
