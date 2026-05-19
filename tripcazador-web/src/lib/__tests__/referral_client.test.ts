/**
 * referral_client.test.ts — SSS321
 *
 * Tests para extractReferralFromUrl pure fn. El resto de helpers
 * dependen de localStorage / fetch — se cubren en integración.
 */
import { describe, it, expect } from "vitest";
import { extractReferralFromUrl } from "../referral_client";

describe("extractReferralFromUrl SSS321", () => {
  it("extrae code + referrer válidos", () => {
    const r = extractReferralFromUrl(
      "https://tripcazador.com/premium?ref=TC-ABCDEF12&r=cus_ALICE0000001",
    );
    expect(r).toEqual({
      code: "TC-ABCDEF12",
      referrer_customer_id: "cus_ALICE0000001",
      captured_at: expect.any(Number),
    });
  });

  it("acepta r= como cs_live_xxx también", () => {
    const r = extractReferralFromUrl(
      "https://tripcazador.com/premium?ref=TC-12345678&r=cs_live_user001AA",
    );
    expect(r?.referrer_customer_id).toBe("cs_live_user001AA");
  });

  it("null si falta ref", () => {
    expect(
      extractReferralFromUrl("https://tripcazador.com/premium?r=cus_ABC00000001"),
    ).toBeNull();
  });

  it("null si falta r", () => {
    expect(
      extractReferralFromUrl("https://tripcazador.com/premium?ref=TC-12345678"),
    ).toBeNull();
  });

  it("null con code mal formado", () => {
    expect(
      extractReferralFromUrl(
        "https://tripcazador.com/premium?ref=junk&r=cus_ABC00000001",
      ),
    ).toBeNull();
  });

  it("null con referrer mal formado", () => {
    expect(
      extractReferralFromUrl(
        "https://tripcazador.com/premium?ref=TC-12345678&r=garbage",
      ),
    ).toBeNull();
  });

  it("null con URL inválida", () => {
    expect(extractReferralFromUrl("not-a-url")).toBeNull();
  });

  it("captured_at razonable (ms epoch)", () => {
    const before = Date.now();
    const r = extractReferralFromUrl(
      "https://tripcazador.com/premium?ref=TC-ABCDEF12&r=cus_TEST00000001",
    );
    const after = Date.now();
    expect(r!.captured_at).toBeGreaterThanOrEqual(before);
    expect(r!.captured_at).toBeLessThanOrEqual(after);
  });
});
