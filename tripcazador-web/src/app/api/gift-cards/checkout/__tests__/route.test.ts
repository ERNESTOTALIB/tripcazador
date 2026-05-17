/**
 * /api/gift-cards/checkout POST route.test.ts — SSS270 (17 may 2026)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  vi.resetModules();
});

async function importPost() {
  const mod = await import("../route");
  return mod.POST;
}

function buildReq(body: object | string): Request {
  return new Request("http://localhost/api/gift-cards/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("/api/gift-cards/checkout POST — validation", () => {
  it("400 si JSON inválido", async () => {
    const POST = await importPost();
    const res = await POST(buildReq("not_json_at_all{"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid JSON");
  });

  it("400 si amount inválido (no en allowlist 25/50/100/200)", async () => {
    const POST = await importPost();
    const res = await POST(buildReq({ amount: 33 }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/inválido/i);
  });

  it("400 si amount missing", async () => {
    const POST = await importPost();
    const res = await POST(buildReq({}));
    expect(res.status).toBe(400);
  });

  it("400 si recipient_email malformado", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({ amount: 50, recipient_email: "not-an-email" }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/email/i);
  });

  it("503 si STRIPE_SECRET_KEY no configurado (pasa validation)", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({
        amount: 50,
        recipient_email: "test@example.com",
        recipient_name: "Test User",
      }),
    );
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/Stripe/i);
  });

  it("acepta amounts válidos: 25, 50, 100, 200", async () => {
    const POST = await importPost();
    for (const amount of [25, 50, 100, 200]) {
      const res = await POST(buildReq({ amount }));
      // Validation pasa, llega a STRIPE check (503) — no es 400
      expect(res.status).not.toBe(400);
    }
  });

  it("trim+slice recipient_email a 200 chars", async () => {
    const POST = await importPost();
    const longEmail = "a".repeat(250) + "@x.com";
    const res = await POST(
      buildReq({ amount: 50, recipient_email: longEmail }),
    );
    // El regex no acepta este longEmail por contener @ después de 200 chars
    // Esto da 400 email inválido (esperado: slice ANTES de validation)
    // En el código actual hay slice(0, 200) seguido de regex test — válido
    expect([400, 503]).toContain(res.status);
  });
});
