/**
 * stripe_coupon_applier.test.ts — SSS324
 *
 * Tests del Stripe coupon applier. No llamamos a Stripe real — mockeamos
 * el módulo entero. El foco está en defensive defaults (sin env vars),
 * skip de inputs inválidos, propagación de errores como skipped.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockList = vi.fn();
const mockUpdate = vi.fn();
// SSS329 M1: coupons.retrieve mock para validación shape
const mockCouponRetrieve = vi.fn();

vi.mock("stripe", () => {
  return {
    default: class MockStripe {
      subscriptions = {
        list: mockList,
        update: mockUpdate,
      };
      coupons = {
        retrieve: mockCouponRetrieve,
      };
      constructor(_secret: string, _opts: unknown) {
        void _secret;
        void _opts;
      }
    },
  };
});

import { tryApplyReferralCoupon } from "../stripe_coupon_applier";

describe("tryApplyReferralCoupon SSS324", () => {
  const ORIG_SECRET = process.env.STRIPE_SECRET_KEY;
  const ORIG_COUPON = process.env.STRIPE_REFERRAL_COUPON_ID;

  beforeEach(() => {
    mockList.mockReset();
    mockUpdate.mockReset();
    mockCouponRetrieve.mockReset();
    // Default coupon shape: valid, once, 100% off (lo que usaríamos en PROD)
    mockCouponRetrieve.mockResolvedValue({
      id: "cpn_REF30D",
      duration: "once",
      percent_off: 100,
      amount_off: null,
      valid: true,
    });
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_REFERRAL_COUPON_ID = "cpn_REF30D";
  });
  afterEach(() => {
    if (ORIG_SECRET === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = ORIG_SECRET;
    if (ORIG_COUPON === undefined) delete process.env.STRIPE_REFERRAL_COUPON_ID;
    else process.env.STRIPE_REFERRAL_COUPON_ID = ORIG_COUPON;
  });

  it("attempted=false si STRIPE_SECRET_KEY no set", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const r = await tryApplyReferralCoupon({ customerIds: ["cus_A", "cus_B"] });
    expect(r.attempted).toBe(false);
    expect(mockList).not.toHaveBeenCalled();
  });

  it("attempted=false si STRIPE_REFERRAL_COUPON_ID no set", async () => {
    delete process.env.STRIPE_REFERRAL_COUPON_ID;
    const r = await tryApplyReferralCoupon({ customerIds: ["cus_A"] });
    expect(r.attempted).toBe(false);
  });

  it("aplica coupon a ambas subs (felices)", async () => {
    mockList.mockResolvedValue({ data: [{ id: "sub_001" }] });
    mockUpdate.mockResolvedValue({});

    const r = await tryApplyReferralCoupon({
      customerIds: ["cus_AAAAAAAA01", "cus_BBBBBBBB01"],
    });
    expect(r.attempted).toBe(true);
    expect(r.applied).toBe(2);
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledWith("sub_001", {
      discounts: [{ coupon: "cpn_REF30D" }],
    });
  });

  it("skip si customerId no empieza por cus_", async () => {
    const r = await tryApplyReferralCoupon({
      customerIds: ["cus_AAAAAAAA01", "cs_test_BAD000001"],
    });
    expect(r.applied + r.skipped).toBe(2);
    // Solo se intenta el primero
    expect(mockList).toHaveBeenCalledTimes(1);
  });

  it("skip si customer no tiene subs activas", async () => {
    mockList.mockResolvedValue({ data: [] });
    const r = await tryApplyReferralCoupon({ customerIds: ["cus_AAAAAAAA01"] });
    expect(r.applied).toBe(0);
    expect(r.skipped).toBe(1);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("error en uno NO aborta el otro", async () => {
    mockList
      .mockResolvedValueOnce({ data: [{ id: "sub_ok" }] })
      .mockResolvedValueOnce({ data: [{ id: "sub_bad" }] });
    mockUpdate
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("stripe transient"));

    const r = await tryApplyReferralCoupon({
      customerIds: ["cus_AAAAAAAA01", "cus_BBBBBBBB01"],
    });
    expect(r.applied).toBe(1);
    expect(r.skipped).toBe(1);
    expect(r.errors.length).toBe(1);
  });

  it("array vacío → 0 applied", async () => {
    const r = await tryApplyReferralCoupon({ customerIds: [] });
    expect(r.applied).toBe(0);
    expect(r.skipped).toBe(0);
  });

  // ─────────── SSS329 M1: coupon shape validation ───────────

  it("rechaza coupon con duration=forever (riesgo catastrófico)", async () => {
    mockCouponRetrieve.mockResolvedValue({
      id: "cpn_BAD",
      duration: "forever",
      percent_off: 100,
      valid: true,
    });
    const r = await tryApplyReferralCoupon({ customerIds: ["cus_AAAAAAAA01"] });
    expect(r.applied).toBe(0);
    expect(r.errors).toContain("coupon_duration_forever_rejected");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rechaza coupon repeating > 3 meses", async () => {
    mockCouponRetrieve.mockResolvedValue({
      id: "cpn_LONG",
      duration: "repeating",
      duration_in_months: 12,
      percent_off: 100,
      valid: true,
    });
    const r = await tryApplyReferralCoupon({ customerIds: ["cus_AAAAAAAA01"] });
    expect(r.applied).toBe(0);
    expect(r.errors).toContain("coupon_duration_too_long_rejected");
  });

  it("acepta coupon repeating ≤ 3 meses", async () => {
    mockCouponRetrieve.mockResolvedValue({
      id: "cpn_OK",
      duration: "repeating",
      duration_in_months: 1,
      percent_off: 100,
      valid: true,
    });
    mockList.mockResolvedValue({ data: [{ id: "sub_001" }] });
    mockUpdate.mockResolvedValue({});
    const r = await tryApplyReferralCoupon({ customerIds: ["cus_AAAAAAAA01"] });
    expect(r.applied).toBe(1);
  });

  it("rechaza coupon con amount_off > 50€", async () => {
    mockCouponRetrieve.mockResolvedValue({
      id: "cpn_BIG",
      duration: "once",
      amount_off: 10000, // 100€
      valid: true,
    });
    const r = await tryApplyReferralCoupon({ customerIds: ["cus_AAAAAAAA01"] });
    expect(r.applied).toBe(0);
    expect(r.errors).toContain("coupon_amount_off_too_high_rejected");
  });

  it("rechaza coupon !valid", async () => {
    mockCouponRetrieve.mockResolvedValue({
      id: "cpn_EXPIRED",
      duration: "once",
      percent_off: 100,
      valid: false,
    });
    const r = await tryApplyReferralCoupon({ customerIds: ["cus_AAAAAAAA01"] });
    expect(r.applied).toBe(0);
    expect(r.errors).toContain("coupon_not_valid");
  });

  it("rechaza si retrieve falla (Stripe API down)", async () => {
    mockCouponRetrieve.mockRejectedValue(new Error("network"));
    const r = await tryApplyReferralCoupon({ customerIds: ["cus_AAAAAAAA01"] });
    expect(r.applied).toBe(0);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.errors[0]).toContain("retrieve_failed");
  });
});
