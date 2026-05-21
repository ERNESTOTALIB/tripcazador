/**
 * agency_partner.test.ts — SSS375
 *
 * Tests cubren:
 *  - register + slug colisión
 *  - calculatePayout por producto
 *  - recordReferralConversion sólo active
 *  - approve/reject
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  registerPartner,
  approvePartner,
  rejectPartner,
  recordReferralConversion,
  getPartnerByCode,
  getPartnerBySlug,
  calculatePayout,
  listPartners,
  __resetForTests,
} from "../agency_partner";

beforeEach(() => __resetForTests());

describe("registerPartner", () => {
  it("crea partner pending con slug normalizado", () => {
    const p = registerPartner({
      company_name: "Viajes Marísol & Co",
      contact_email: "info@viajesmarisol.es",
    });
    expect(p.status).toBe("pending");
    expect(p.slug).toMatch(/^viajes-marisol/);
    expect(p.ref_code).toMatch(/^TC-AGY-/);
  });

  it("desambigua slug duplicado con -2, -3, …", () => {
    const a = registerPartner({ company_name: "Viajes Mar", contact_email: "a@x.com" });
    const b = registerPartner({ company_name: "Viajes Mar", contact_email: "b@x.com" });
    const c = registerPartner({ company_name: "Viajes Mar", contact_email: "c@x.com" });
    expect(a.slug).toBe("viajes-mar");
    expect(b.slug).toBe("viajes-mar-2");
    expect(c.slug).toBe("viajes-mar-3");
  });

  it("fallback timestamp slug si nombre es vacío después de slugify", () => {
    const p = registerPartner({ company_name: "!!!", contact_email: "x@y.com" });
    expect(p.slug).toMatch(/^agency-/);
  });
});

describe("calculatePayout", () => {
  it("premium monthly 20%", () => {
    expect(calculatePayout({ product: "premium_monthly", amount_eur: 9.99 })).toBe(2);
  });

  it("premium annual 25%", () => {
    expect(calculatePayout({ product: "premium_annual", amount_eur: 99 })).toBe(24.75);
  });

  it("concierge 15%", () => {
    expect(calculatePayout({ product: "concierge", amount_eur: 99 })).toBe(14.85);
  });

  it("premium gift 20%", () => {
    expect(calculatePayout({ product: "premium_gift", amount_eur: 9.99 })).toBe(2);
  });
});

describe("recordReferralConversion", () => {
  it("rechaza partner desconocido", () => {
    const r = recordReferralConversion("TC-AGY-XXXX", {
      product: "premium_monthly",
      amount_eur: 9.99,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("unknown_partner");
  });

  it("rechaza partner pending (no active)", () => {
    const p = registerPartner({ company_name: "X", contact_email: "x@x.com" });
    const r = recordReferralConversion(p.ref_code, {
      product: "premium_monthly",
      amount_eur: 9.99,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("not_active");
  });

  it("acumula referrals y payout cuando active", () => {
    const p = registerPartner({ company_name: "X", contact_email: "x@x.com" });
    approvePartner(p.ref_code);
    recordReferralConversion(p.ref_code, { product: "premium_monthly", amount_eur: 9.99 });
    recordReferralConversion(p.ref_code, { product: "premium_annual", amount_eur: 99 });
    recordReferralConversion(p.ref_code, { product: "concierge", amount_eur: 49 });

    const after = getPartnerByCode(p.ref_code)!;
    expect(after.total_referrals).toBe(3);
    expect(after.total_revenue_eur).toBeCloseTo(157.98, 1);
    expect(after.total_payout_eur).toBeCloseTo(2 + 24.75 + 7.35, 1);
  });
});

describe("approve/reject", () => {
  it("approve marca active + approved_at", () => {
    const p = registerPartner({ company_name: "X", contact_email: "x@x.com" });
    expect(approvePartner(p.ref_code)).toBe(true);
    const after = getPartnerByCode(p.ref_code)!;
    expect(after.status).toBe("active");
    expect(after.approved_at).toBeTruthy();
  });

  it("reject marca rejected", () => {
    const p = registerPartner({ company_name: "X", contact_email: "x@x.com" });
    expect(rejectPartner(p.ref_code)).toBe(true);
    expect(getPartnerByCode(p.ref_code)!.status).toBe("rejected");
  });

  it("approve/reject de código inexistente devuelve false", () => {
    expect(approvePartner("BOGUS")).toBe(false);
    expect(rejectPartner("BOGUS")).toBe(false);
  });
});

describe("listPartners + getPartnerBySlug", () => {
  it("filtra por status", () => {
    const a = registerPartner({ company_name: "A", contact_email: "a@x.com" });
    registerPartner({ company_name: "B", contact_email: "b@x.com" });
    approvePartner(a.ref_code);
    expect(listPartners({ status: "active" }).length).toBe(1);
    expect(listPartners({ status: "pending" }).length).toBe(1);
    expect(listPartners().length).toBe(2);
  });

  it("getPartnerBySlug funciona", () => {
    const p = registerPartner({ company_name: "Viajes Sol", contact_email: "s@x.com" });
    expect(getPartnerBySlug(p.slug)?.ref_code).toBe(p.ref_code);
    expect(getPartnerBySlug("bogus")).toBeUndefined();
  });
});
