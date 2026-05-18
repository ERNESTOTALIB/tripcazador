/**
 * /api/agencia/activate route.test.ts — SSS309
 * Solo validación paths sin mock Stripe.
 */
import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

const ORIGINAL_ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function req(qs: string): NextRequest {
  return new NextRequest(`http://localhost/api/agencia/activate${qs}`);
}

describe("GET /api/agencia/activate SSS309", () => {
  it("400 si session_id missing", async () => {
    const res = await GET(req(""));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("session_id_invalid");
  });

  it("400 si session_id formato cus_xxx (no Checkout session)", async () => {
    const res = await GET(req("?session_id=cus_OdLMNOPQrst"));
    expect(res.status).toBe(400);
  });

  it("400 si session_id garbage", async () => {
    const res = await GET(req("?session_id=not_stripe"));
    expect(res.status).toBe(400);
  });

  it("503 si STRIPE_SECRET_KEY no configurada", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await GET(req("?session_id=cs_live_abcd12345"));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe("stripe_not_configured");
  });

  it("503 con cs_test_xxx también (formato válido pero sin key)", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await GET(req("?session_id=cs_test_abcd12345"));
    expect(res.status).toBe(503);
  });
});
