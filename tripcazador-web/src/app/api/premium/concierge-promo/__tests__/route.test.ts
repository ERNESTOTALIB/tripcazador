/**
 * /api/premium/concierge-promo route.test.ts — SSS303
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { _clearPromoStore } from "@/lib/premium_concierge_promo";

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/premium/concierge-promo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/premium/concierge-promo SSS303", () => {
  beforeEach(() => _clearPromoStore());

  it("201 primera vez con customer válido", async () => {
    const res = await POST(postReq({ customer_id: "cs_live_first001AA" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.ticket_id).toMatch(/^cp_/);
    expect(data.next_step).toContain("contacto@tripcazador.com");
  });

  it("402 segunda vez el mismo mes", async () => {
    await POST(postReq({ customer_id: "cs_live_doublex1AA" }));
    const res = await POST(postReq({ customer_id: "cs_live_doublex1AA" }));
    expect(res.status).toBe(402);
    const data = await res.json();
    expect(data.error).toBe("promo_used_this_month");
  });

  it("400 customer_id formato inválido", async () => {
    const res = await POST(postReq({ customer_id: "garbage" }));
    expect(res.status).toBe(400);
  });

  it("400 invalid_json", async () => {
    const req = new NextRequest("http://localhost/api/premium/concierge-promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("aislamiento por customer", async () => {
    await POST(postReq({ customer_id: "cs_live_alice99AA" }));
    const res = await POST(postReq({ customer_id: "cs_live_bob9999AA" }));
    expect(res.status).toBe(201);
  });
});
