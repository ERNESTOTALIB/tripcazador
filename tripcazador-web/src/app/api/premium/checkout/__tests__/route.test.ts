/**
 * /api/premium/checkout POST route.test.ts — SSS261 (16 may 2026)
 *
 * Tests para Stripe premium subscription checkout (€2.99/mes).
 * Sin STRIPE_SECRET_KEY → 503 stripe_not_configured.
 */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

async function importPost() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.POST;
}

function buildReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/premium/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/premium/checkout POST — config missing", () => {
  it("503 si STRIPE_SECRET_KEY no configured", async () => {
    // En test env STRIPE_SECRET_KEY no está set
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_PREMIUM;
    const POST = await importPost();
    const req = buildReq({});
    const res = await POST(req);
    expect(res.status).toBe(503);
    const j = await res.json();
    expect(j.error).toBe("stripe_not_configured");
    expect(j.hint).toBeTruthy();
  });

  it("503 si solo falta STRIPE_PRICE_PREMIUM", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    delete process.env.STRIPE_PRICE_PREMIUM;
    const POST = await importPost();
    const req = buildReq({});
    const res = await POST(req);
    expect(res.status).toBe(503);
    delete process.env.STRIPE_SECRET_KEY;
  });
});

describe("/api/premium/checkout POST — body handling", () => {
  it("acepta POST sin body (no fails con JSON parse error)", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const POST = await importPost();
    const req = new NextRequest("http://localhost/api/premium/checkout", {
      method: "POST",
    });
    const res = await POST(req);
    // 503 sin Stripe configured, pero NO 400 (POST sin body es válido)
    expect(res.status).toBe(503);
  });

  it("acepta email opcional en body", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const POST = await importPost();
    const req = buildReq({ email: "user@example.com" });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it("ignora email sin @ (no fails — Stripe lo handles)", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const POST = await importPost();
    const req = buildReq({ email: "noatsign" });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it("acepta JSON inválido (no crashea — modo POST sin body válido)", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const POST = await importPost();
    const req = new NextRequest("http://localhost/api/premium/checkout", {
      method: "POST",
      body: "{broken",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    // 503 sin Stripe, pero el body broken se cae silenciosamente al catch
    expect(res.status).toBe(503);
  });
});
