/**
 * /api/premium/portal route.test.ts — SSS303
 *
 * Solo testeamos paths de validación (no mockeamos Stripe SDK).
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

describe("GET /api/premium/portal SSS303", () => {
  it("400 session_id missing", async () => {
    const res = await GET(getReq(""));
    expect(res.status).toBe(400);
  });

  it("400 session_id formato inválido", async () => {
    const res = await GET(getReq("?session_id=not_stripe"));
    expect(res.status).toBe(400);
  });

  it("503 si STRIPE_SECRET_KEY no configurada", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await GET(getReq("?session_id=cs_live_abcd12345"));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe("stripe_not_configured");
  });
});

describe("POST /api/premium/portal SSS303", () => {
  it("400 invalid_json", async () => {
    const req = new NextRequest("http://localhost/api/premium/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 session_id missing en body", async () => {
    const res = await POST(postReq({}));
    expect(res.status).toBe(400);
  });

  it("400 session_id formato inválido", async () => {
    const res = await POST(postReq({ session_id: "garbage" }));
    expect(res.status).toBe(400);
  });
});
