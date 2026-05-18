/**
 * /api/agencia/checkout route.test.ts — SSS305
 */
import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

const ORIGINAL_ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/agencia/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/agencia/checkout SSS305", () => {
  it("400 tipo inválido", async () => {
    const res = await POST(postReq({ tipo: "garbage", email: "x@y.com" }));
    expect(res.status).toBe(400);
  });

  it("400 email inválido", async () => {
    const res = await POST(postReq({ tipo: "vuelo", email: "not-email" }));
    expect(res.status).toBe(400);
  });

  it("400 invalid_json", async () => {
    const req = new NextRequest("http://localhost/api/agencia/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("503 si STRIPE_SECRET_KEY no set", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await POST(postReq({ tipo: "vuelo", email: "x@y.com" }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe("stripe_not_configured");
  });

  it("503 si price_id no configurado", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    delete process.env.STRIPE_AGENCIA_VUELO_PRICE_ID;
    const res = await POST(postReq({ tipo: "vuelo", email: "x@y.com" }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe("price_not_configured");
  });

  it("acepta tipo vuelo_hotel", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await POST(postReq({ tipo: "vuelo_hotel", email: "x@y.com" }));
    // Llegará a 503 → confirma que validation pasó
    expect(res.status).toBe(503);
  });
});
