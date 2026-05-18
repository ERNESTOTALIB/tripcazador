/**
 * /api/premium/portal route.test.ts — SSS303 / SSS304 bug fix
 *
 * Solo testeamos paths de validación (no mockeamos Stripe SDK).
 * SSS304: el endpoint ahora acepta customer_id (cus_xxx) además de
 * session_id (cs_*). El path session_id requería ya Stripe API.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

function getReq(qs: string): NextRequest {
  return new NextRequest(`http://localhost/api/premium/portal${qs}`);
}

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/premium/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/premium/portal", () => {
  it("400 owner_id missing", async () => {
    const res = await GET(getReq(""));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("owner_id_required");
  });

  it("503 si STRIPE_SECRET_KEY no configurada (con customer_id válido)", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await GET(getReq("?customer_id=cus_OdLMNOPQrst"));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe("stripe_not_configured");
  });

  it("503 si STRIPE_SECRET_KEY no configurada (con session_id válido)", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await GET(getReq("?session_id=cs_live_abcd12345"));
    expect(res.status).toBe(503);
  });
});

describe("POST /api/premium/portal", () => {
  it("400 invalid_json", async () => {
    const req = new NextRequest("http://localhost/api/premium/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 owner missing en body", async () => {
    const res = await POST(postReq({}));
    expect(res.status).toBe(400);
  });

  it("acepta body con customer_id", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await POST(postReq({ customer_id: "cus_validOwner12345" }));
    // Sin Stripe key llega a 503 — confirma que pasó validación de format
    expect(res.status).toBe(503);
  });

  it("acepta body con session_id (legacy)", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await POST(postReq({ session_id: "cs_test_abcdef12345" }));
    expect(res.status).toBe(503);
  });
});
