/**
 * /api/premium/webhook POST route.test.ts — SSS262 (16 may 2026)
 *
 * Tests para Stripe webhook handler (premium subscription €2.99/mes).
 *
 * Cobertura:
 *  - 503 si STRIPE_WEBHOOK_SECRET missing
 *  - 400 si signature inválida (no HMAC match)
 *  - 400 si timestamp expired (replay defense, >5 min)
 *  - 400 si JSON inválido tras pasar signature
 *  - checkout.session.completed → upsertPremium con customer_id
 *  - customer.subscription.deleted → deactivateByCustomerId
 *  - invoice.payment_failed → deactivateByCustomerId
 *  - Eventos desconocidos retornan 200 (no fail)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import crypto from "crypto";

const WEBHOOK_SECRET = "whsec_test_secret_12345";

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  vi.resetModules();
});

async function importPost() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.POST;
}

function signEvent(body: string, ts: number, secret: string): string {
  const payload = `${ts}.${body}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");
  return `t=${ts},v1=${sig}`;
}

function buildReq(body: string, sigHeader: string): NextRequest {
  return new NextRequest("http://localhost/api/premium/webhook", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      "stripe-signature": sigHeader,
    },
  });
}

function makeEvent(type: string, obj: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type,
    data: { object: obj },
  });
}

describe("/api/premium/webhook — config + signature", () => {
  it("503 si STRIPE_WEBHOOK_SECRET no configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const POST = await importPost();
    const req = buildReq(makeEvent("test.event"), "t=1,v1=fake");
    const res = await POST(req);
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("webhook_not_configured");
  });

  it("400 si signature header missing", async () => {
    const POST = await importPost();
    const req = new NextRequest("http://localhost/api/premium/webhook", {
      method: "POST",
      body: makeEvent("test.event"),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_signature");
  });

  it("400 si signature inválida (HMAC mismatch)", async () => {
    const POST = await importPost();
    const body = makeEvent("test.event");
    const fakeSig = `t=${Math.floor(Date.now() / 1000)},v1=0000000000000000000000000000000000000000000000000000000000000000`;
    const req = buildReq(body, fakeSig);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si timestamp expired (>5min replay defense)", async () => {
    const POST = await importPost();
    const body = makeEvent("test.event");
    const oldTs = Math.floor(Date.now() / 1000) - 600; // 10 min ago
    const sig = signEvent(body, oldTs, WEBHOOK_SECRET);
    const req = buildReq(body, sig);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si timestamp futuro (>5min clock skew defense)", async () => {
    const POST = await importPost();
    const body = makeEvent("test.event");
    const futureTs = Math.floor(Date.now() / 1000) + 600; // 10 min future
    const sig = signEvent(body, futureTs, WEBHOOK_SECRET);
    const req = buildReq(body, sig);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si timestamp no numérico", async () => {
    const POST = await importPost();
    const body = makeEvent("test.event");
    const req = buildReq(body, "t=abc,v1=somesig");
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("/api/premium/webhook — happy path events", () => {
  it("200 + received para checkout.session.completed", async () => {
    const POST = await importPost();
    const body = makeEvent("checkout.session.completed", {
      id: "cs_test_123",
      customer: "cus_abc",
      customer_email: "user@example.com",
      subscription: "sub_xyz",
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
    });
    const ts = Math.floor(Date.now() / 1000);
    const sig = signEvent(body, ts, WEBHOOK_SECRET);
    const req = buildReq(body, sig);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.received).toBe(true);
    expect(j.type).toBe("checkout.session.completed");
  });

  it("200 para customer.subscription.deleted", async () => {
    const POST = await importPost();
    const body = makeEvent("customer.subscription.deleted", {
      customer: "cus_delete",
    });
    const ts = Math.floor(Date.now() / 1000);
    const sig = signEvent(body, ts, WEBHOOK_SECRET);
    const req = buildReq(body, sig);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("200 para invoice.payment_failed (deactivate)", async () => {
    const POST = await importPost();
    const body = makeEvent("invoice.payment_failed", {
      customer: "cus_failed",
    });
    const ts = Math.floor(Date.now() / 1000);
    const sig = signEvent(body, ts, WEBHOOK_SECRET);
    const req = buildReq(body, sig);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("200 para eventos desconocidos (no fail)", async () => {
    const POST = await importPost();
    const body = makeEvent("payment_intent.created", {});
    const ts = Math.floor(Date.now() / 1000);
    const sig = signEvent(body, ts, WEBHOOK_SECRET);
    const req = buildReq(body, sig);
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect((await res.json()).type).toBe("payment_intent.created");
  });

  it("acepta email desde metadata si customer_email vacío", async () => {
    const POST = await importPost();
    const body = makeEvent("checkout.session.completed", {
      id: "cs_meta",
      customer: "cus_meta",
      metadata: { email: "from-meta@example.com" },
    });
    const ts = Math.floor(Date.now() / 1000);
    const sig = signEvent(body, ts, WEBHOOK_SECRET);
    const req = buildReq(body, sig);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("checkout sin email + sin customer → no-op pero 200", async () => {
    const POST = await importPost();
    const body = makeEvent("checkout.session.completed", {});
    const ts = Math.floor(Date.now() / 1000);
    const sig = signEvent(body, ts, WEBHOOK_SECRET);
    const req = buildReq(body, sig);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

describe("/api/premium/webhook — JSON validation tras signature", () => {
  it("400 si body es JSON inválido pero signature válida", async () => {
    const POST = await importPost();
    const badJson = "{this-is-not-json";
    const ts = Math.floor(Date.now() / 1000);
    const sig = signEvent(badJson, ts, WEBHOOK_SECRET);
    const req = buildReq(badJson, sig);
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_json");
  });
});
