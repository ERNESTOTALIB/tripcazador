/**
 * partner_attribution.test.ts — SSS377
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  extractAttributionFromSession,
  isValidRefCode,
  parseRefCookieFromHeader,
  buildCookieSetHeader,
  ATTRIBUTION_COOKIE,
} from "../partner_attribution";
import {
  registerPartner,
  approvePartner,
  getPartnerByCode,
  __resetForTests as resetPartners,
} from "../agency_partner";

beforeEach(() => resetPartners());

describe("isValidRefCode", () => {
  it("acepta TC-AGY-ABCD", () => {
    expect(isValidRefCode("TC-AGY-ABCD")).toBe(true);
  });
  it("acepta TC-AGY-12345678", () => {
    expect(isValidRefCode("TC-AGY-12345678")).toBe(true);
  });
  it("rechaza prefijo incorrecto", () => {
    expect(isValidRefCode("XX-AGY-ABCD")).toBe(false);
  });
  it("rechaza lowercase", () => {
    expect(isValidRefCode("TC-AGY-abcd")).toBe(false);
  });
  it("rechaza chars especiales", () => {
    expect(isValidRefCode("TC-AGY-AB!D")).toBe(false);
  });
});

describe("parseRefCookieFromHeader", () => {
  it("extrae ref de cookie header", () => {
    expect(parseRefCookieFromHeader(`${ATTRIBUTION_COOKIE}=TC-AGY-ABCD; otra=x`)).toBe(
      "TC-AGY-ABCD",
    );
  });
  it("null si no presente", () => {
    expect(parseRefCookieFromHeader("foo=bar")).toBeNull();
  });
  it("null si header vacío", () => {
    expect(parseRefCookieFromHeader(null)).toBeNull();
    expect(parseRefCookieFromHeader("")).toBeNull();
  });
});

describe("buildCookieSetHeader", () => {
  it("incluye Max-Age + SameSite + Path", () => {
    const h = buildCookieSetHeader("TC-AGY-ABCD");
    expect(h).toContain("TC-AGY-ABCD");
    expect(h).toContain("Max-Age=2592000"); // 30d
    expect(h).toContain("SameSite=Lax");
    expect(h).toContain("Path=/");
  });
});

describe("extractAttributionFromSession", () => {
  it("rechaza sin ref_code", () => {
    const r = extractAttributionFromSession({ amount_total: 999 });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("no_ref_code");
  });

  it("rechaza partner desconocido", () => {
    const r = extractAttributionFromSession({
      amount_total: 999,
      metadata: { ref_code: "TC-AGY-NOPE" },
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("partner_not_found");
  });

  it("rechaza partner pending", () => {
    const p = registerPartner({ company_name: "x", contact_email: "x@x.com" });
    const r = extractAttributionFromSession({
      amount_total: 999,
      metadata: { ref_code: p.ref_code },
      mode: "subscription",
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("partner_status_pending");
  });

  it("registra premium monthly (subscription €9.99 inferred)", () => {
    const p = registerPartner({ company_name: "x", contact_email: "x@x.com" });
    approvePartner(p.ref_code);
    const r = extractAttributionFromSession({
      amount_total: 999,
      metadata: { ref_code: p.ref_code },
      mode: "subscription",
    });
    expect(r.ok).toBe(true);
    expect(r.product).toBe("premium_monthly");
    expect(r.amount_eur).toBe(9.99);
    expect(r.payout_eur).toBe(2);

    const after = getPartnerByCode(p.ref_code)!;
    expect(after.total_referrals).toBe(1);
  });

  it("registra premium annual inferred", () => {
    const p = registerPartner({ company_name: "x", contact_email: "x@x.com" });
    approvePartner(p.ref_code);
    const r = extractAttributionFromSession({
      amount_total: 9900,
      metadata: { ref_code: p.ref_code },
      mode: "subscription",
    });
    expect(r.ok).toBe(true);
    expect(r.product).toBe("premium_annual");
    expect(r.payout_eur).toBe(24.75);
  });

  it("registra concierge inferred (€49)", () => {
    const p = registerPartner({ company_name: "x", contact_email: "x@x.com" });
    approvePartner(p.ref_code);
    const r = extractAttributionFromSession({
      amount_total: 4900,
      metadata: { ref_code: p.ref_code },
      mode: "payment",
    });
    expect(r.ok).toBe(true);
    expect(r.product).toBe("concierge");
    expect(r.payout_eur).toBe(7.35);
  });

  it("usa metadata.product cuando presente (override heuristic)", () => {
    const p = registerPartner({ company_name: "x", contact_email: "x@x.com" });
    approvePartner(p.ref_code);
    const r = extractAttributionFromSession({
      amount_total: 5000,
      metadata: { ref_code: p.ref_code, product: "concierge" },
      mode: "payment",
    });
    expect(r.ok).toBe(true);
    expect(r.product).toBe("concierge");
    expect(r.amount_eur).toBe(50);
    expect(r.payout_eur).toBe(7.5);
  });

  it("rechaza monto 0", () => {
    const p = registerPartner({ company_name: "x", contact_email: "x@x.com" });
    approvePartner(p.ref_code);
    const r = extractAttributionFromSession({
      amount_total: 0,
      metadata: { ref_code: p.ref_code, product: "concierge" },
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("no_amount");
  });

  it("rechaza producto desconocido (no metadata + amount no estándar)", () => {
    const p = registerPartner({ company_name: "x", contact_email: "x@x.com" });
    approvePartner(p.ref_code);
    const r = extractAttributionFromSession({
      amount_total: 1234,
      metadata: { ref_code: p.ref_code },
      mode: "payment",
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("unknown_product");
  });
});
