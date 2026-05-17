/**
 * /api/concierge/webhook POST route.test.ts — SSS262 (16 may 2026)
 *
 * Tests para Stripe webhook handler (concierge orders €9-99 tiered).
 *
 * Cobertura limitada a config + early validation paths (Stripe SDK
 * dynamic import + constructEvent requieren stripe module + sig
 * verification mocking que añade complejidad). Las paths críticas
 * de tier handling están testadas vía /api/concierge/checkout tests.
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
  return new NextRequest("http://localhost/api/concierge/webhook", {
    method: "POST",
    body,
    headers,
  });
}

describe("/api/concierge/webhook — config + signature gates", () => {
  it("503 si STRIPE_SECRET_KEY no configured", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const POST = await importPost();
    const req = buildReq("{}", "t=1,v1=fake");
    const res = await POST(req);
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("stripe_webhook_not_configured");
  });

  it("503 si STRIPE_WEBHOOK_SECRET no configured", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const POST = await importPost();
    const req = buildReq("{}", "t=1,v1=fake");
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it("hint message útil para operator en 503", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const POST = await importPost();
    const req = buildReq("{}");
    const res = await POST(req);
    const j = await res.json();
    expect(j.hint).toMatch(/STRIPE_SECRET_KEY/);
    expect(j.hint).toMatch(/STRIPE_WEBHOOK_SECRET/);
  });

  it("400 missing_signature si stripe-signature header missing", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const POST = await importPost();
    const req = buildReq("{}"); // no sig header
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("missing_signature");
  });
});

describe("/api/concierge/webhook — Stripe SDK + signature path", () => {
  it("503 stripe_sdk_missing o 400 sig fail si SDK válido (depende env)", async () => {
    // Caso real: stripe SDK está instalado en node_modules → SDK path.
    // constructEvent con sig=t=1,v1=fake fallará verification → 400.
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const POST = await importPost();
    const ts = Math.floor(Date.now() / 1000);
    const req = buildReq("{}", `t=${ts},v1=00000000`);
    const res = await POST(req);
    // Cualquiera de las 2 fail paths es OK (no debe ser 200)
    expect([400, 503]).toContain(res.status);
  });
});
