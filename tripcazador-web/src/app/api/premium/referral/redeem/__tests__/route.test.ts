/**
 * /api/premium/referral/redeem route.test.ts — SSS320
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { deriveCodeFromCustomer, _clearStore } from "@/lib/referral_store";

const REFERRER = "cus_ALICE0000001";
const REFERRED = "cus_BOB000000001";

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/premium/referral/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/premium/referral/redeem SSS320", () => {
  beforeEach(() => _clearStore());

  it("201 incluye campo coupon SSS324", async () => {
    const code = deriveCodeFromCustomer(REFERRER);
    const res = await POST(
      postReq({
        referrer_customer_id: REFERRER,
        referred_customer_id: REFERRED,
        code,
      }),
    );
    expect(res.status).toBe(201);
    const d = await res.json();
    expect(d.coupon).toBeDefined();
    expect(d.coupon.attempted).toBe(false); // sin envs Stripe → no se intentó
  });

  it("201 crea referral con datos válidos", async () => {
    const code = deriveCodeFromCustomer(REFERRER);
    const res = await POST(
      postReq({
        referrer_customer_id: REFERRER,
        referred_customer_id: REFERRED,
        code,
      }),
    );
    expect(res.status).toBe(201);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.referral.referrer_customer_id).toBe(REFERRER);
    expect(d.referral.referred_customer_id).toBe(REFERRED);
  });

  it("400 customer ids inválidos", async () => {
    const res = await POST(
      postReq({
        referrer_customer_id: "junk",
        referred_customer_id: REFERRED,
        code: "TC-ABCD1234",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("400 code no matchea referrer", async () => {
    const wrongCode = deriveCodeFromCustomer(REFERRED);
    const res = await POST(
      postReq({
        referrer_customer_id: REFERRER,
        referred_customer_id: REFERRED,
        code: wrongCode,
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("code_mismatch");
  });

  it("409 self-referral", async () => {
    const code = deriveCodeFromCustomer(REFERRER);
    const res = await POST(
      postReq({
        referrer_customer_id: REFERRER,
        referred_customer_id: REFERRER,
        code,
      }),
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("self_referral_forbidden");
  });

  it("409 referred ya usado", async () => {
    const code = deriveCodeFromCustomer(REFERRER);
    await POST(
      postReq({
        referrer_customer_id: REFERRER,
        referred_customer_id: REFERRED,
        code,
      }),
    );
    const res = await POST(
      postReq({
        referrer_customer_id: REFERRER,
        referred_customer_id: REFERRED,
        code,
      }),
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("referred_already_used");
  });

  it("400 body no-JSON", async () => {
    const req = new NextRequest(
      "http://localhost/api/premium/referral/redeem",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "garbage",
      },
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
