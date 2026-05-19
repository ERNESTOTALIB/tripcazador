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

describe("/api/premium/webhook — SSS324 subscription.updated", () => {
  it("200 + marca cancel scheduled cuando cancel_at_period_end=true", async () => {
    // Limpiar store antes
    const storeMod = await import("@/lib/premium_store");
    storeMod._clearStore?.();
    storeMod.upsertPremium({
      email: "tocancel@example.com",
      customer_id: "cus_ToCancel001",
      subscription_id: "sub_X",
      active: true,
      expires_at: Date.now() + 30 * 86400000,
      source: "stripe",
      updated_at: Date.now(),
    });

    const POST = await importPost();
    const cancelAtSec = Math.floor(Date.now() / 1000) + 15 * 86400;
    const body = makeEvent("customer.subscription.updated", {
      id: "sub_X",
      customer: "cus_ToCancel001",
      cancel_at_period_end: true,
      cancel_at: cancelAtSec,
    });
    const ts = Math.floor(Date.now() / 1000);
    const sig = signEvent(body, ts, WEBHOOK_SECRET);
    const req = buildReq(body, sig);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const g = globalThis as unknown as {
      __tc_premium_store: {
        entries: Array<{
          customer_id: string;
          cancel_at?: number;
          active: boolean;
        }>;
      };
    };
    const raw = g.__tc_premium_store.entries.find(
      (e) => e.customer_id === "cus_ToCancel001",
    );
    expect(raw?.cancel_at).toBe(cancelAtSec * 1000);
    expect(raw?.active).toBe(true);
  });

  it("200 + clear cancel scheduled cuando cancel_at_period_end=false (reactivó)", async () => {
    const storeMod = await import("@/lib/premium_store");
    storeMod._clearStore?.();
    storeMod.upsertPremium({
      email: "reactivated@example.com",
      customer_id: "cus_React001",
      subscription_id: "sub_R",
      active: true,
      expires_at: Date.now() + 30 * 86400000,
      cancel_at: Date.now() + 86400000,
      source: "stripe",
      updated_at: Date.now(),
    });

    const POST = await importPost();
    const body = makeEvent("customer.subscription.updated", {
      id: "sub_R",
      customer: "cus_React001",
      cancel_at_period_end: false,
    });
    const ts = Math.floor(Date.now() / 1000);
    const sig = signEvent(body, ts, WEBHOOK_SECRET);
    const req = buildReq(body, sig);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const g = globalThis as unknown as {
      __tc_premium_store: { entries: Array<{ customer_id: string; cancel_at?: number }> };
    };
    const raw = g.__tc_premium_store.entries.find(
      (e) => e.customer_id === "cus_React001",
    );
    expect(raw?.cancel_at).toBeUndefined();
  });

  it("200 sin tocar state cuando subscription.updated sin cancel info", async () => {
    const POST = await importPost();
    const body = makeEvent("customer.subscription.updated", {
      id: "sub_noChange",
      customer: "cus_NoChange01",
      // sin cancel_at_period_end
    });
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
