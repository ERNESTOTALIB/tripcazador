/**
 * /api/premium/referral/me route.test.ts — SSS320
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { redeemReferral, deriveCodeFromCustomer, _clearStore } from "@/lib/referral_store";

const CUSTOMER = "cus_TEST00000001";

function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/referral/me${qs}`);
}

describe("GET /api/premium/referral/me SSS320", () => {
  beforeEach(() => _clearStore());

  it("400 customer_id inválido", async () => {
    const res = await GET(getReq("?customer_id=junk"));
    expect(res.status).toBe(400);
  });

  it("200 devuelve code + share_url + stats vacías", async () => {
    const res = await GET(getReq(`?customer_id=${CUSTOMER}`));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.code).toMatch(/^TC-[0-9A-Z]{8}$/);
    expect(d.share_url).toContain(d.code);
    expect(d.share_url).toContain("/premium?ref=");
    expect(d.referrals_count).toBe(0);
    expect(d.rewarded_count).toBe(0);
    expect(d.cap_remaining).toBe(d.cap);
  });

  it("200 cuenta referrals existentes", async () => {
    const code = deriveCodeFromCustomer(CUSTOMER);
    await redeemReferral({
      referrer_customer_id: CUSTOMER,
      referred_customer_id: "cus_BOB000000001",
      code,
    });
    await redeemReferral({
      referrer_customer_id: CUSTOMER,
      referred_customer_id: "cus_CAR000000001",
      code,
    });
    const res = await GET(getReq(`?customer_id=${CUSTOMER}`));
    const d = await res.json();
    expect(d.referrals_count).toBe(2);
    expect(d.cap_remaining).toBe(d.cap - 2);
  });
});
