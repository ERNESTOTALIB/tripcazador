/**
 * /api/stripe/webhook POST route.test.ts — SSS262 (16 may 2026)
 *
 * Tests para Stripe master webhook (subscription + invoice events).
 * Cobertura limitada a config + early validation (constructEvent + Stripe
 * SDK side effects requieren mocking complejo).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

beforeEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  vi.resetModules();
});

async function importPost() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.POST;
}

function buildReq(body: string, sigHeader?: string): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (sigHeader) headers["stripe-signature"] = sigHeader;
  return new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    body,
    headers,
  });
}

describe("/api/stripe/webhook — config gates", () => {
  it("503 si STRIPE_SECRET_KEY missing", async () => {
    const POST = await importPost();
    const res = await POST(buildReq("{}", "t=1,v1=fake"));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("not_configured");
  });

  it("503 si STRIPE_WEBHOOK_SECRET missing", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    const POST = await importPost();
    const res = await POST(buildReq("{}", "t=1,v1=fake"));
    expect(res.status).toBe(503);
  });

  it("400 missing_signature si stripe-signature header missing", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const POST = await importPost();
    const res = await POST(buildReq("{}")); // no sig
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("missing_signature");
  });

  it("400 invalid_signature con sig fake (HMAC mismatch)", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const POST = await importPost();
    const ts = Math.floor(Date.now() / 1000);
    const res = await POST(buildReq("{}", `t=${ts},v1=00000000`));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe("invalid_signature");
  });
});
