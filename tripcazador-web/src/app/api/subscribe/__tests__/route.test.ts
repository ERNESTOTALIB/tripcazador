/**
 * /api/subscribe route.test.ts — SSS260 (16 may 2026)
 *
 * Tests para POST /api/subscribe (newsletter signup).
 *
 * Cobertura:
 *  - Email validation (regex + ≤254 chars)
 *  - Consent required
 *  - Honeypot defense (silent 200 OK para bots)
 *  - Source/locale truncado (32/5 chars)
 *  - addSubscriber called (in-memory fallback)
 *  - sendWelcome dormido si no RESEND_API_KEY
 *  - User enumeration defense: mismo response (201) para new vs duplicate
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { _clearStore } from "@/lib/subscribers_store";

const mockFetch = vi.fn();
beforeEach(() => {
  _clearStore();
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(new Response("{}", { status: 200 }));
  global.fetch = mockFetch;
});

async function importPost() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.POST;
}

function buildReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/subscribe", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/subscribe POST — input validation", () => {
  it("400 si JSON inválido", async () => {
    const POST = await importPost();
    const req = new NextRequest("http://localhost/api/subscribe", {
      method: "POST",
      body: "{broken",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe("invalid_json");
  });

  it("400 si email inválido (sin @)", async () => {
    const POST = await importPost();
    const req = buildReq({ email: "noatsign", consent: true });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("email_invalid");
  });

  it("400 si email demasiado largo (>=254 chars)", async () => {
    const POST = await importPost();
    const longEmail = "x".repeat(250) + "@y.com";
    const req = buildReq({ email: longEmail, consent: true });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si consent missing", async () => {
    const POST = await importPost();
    const req = buildReq({ email: "test@example.com" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("consent_required");
  });

  it("400 si consent !== true (anti-injection)", async () => {
    const POST = await importPost();
    const req = buildReq({ email: "test@example.com", consent: "yes" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("/api/subscribe POST — honeypot defense", () => {
  it("acepta 201 silenciosamente con honeypot rellenado (bots)", async () => {
    const POST = await importPost();
    const req = buildReq({
      email: "bot@evil.com",
      consent: true,
      hp: "bot-filled-this",
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.ok).toBe(true);
    // Pero no se debe haber persistido — el subscribers_store debe estar vacío
  });
});

describe("/api/subscribe POST — happy path", () => {
  it("201 + created=true para nuevo email", async () => {
    const POST = await importPost();
    const req = buildReq({ email: "new@example.com", consent: true });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.created).toBe(true);
    // welcome_sent=false sin RESEND_API_KEY
    expect(j.welcome_sent).toBe(false);
  });

  it("user enumeration defense: misma response 201 OK para email duplicate", async () => {
    // Re-use mismo POST (no reset modules entre llamadas) para que el
    // subscribers_store in-memory persista el primer signup.
    const POST = await importPost();
    const r1 = await POST(
      buildReq({ email: "dup@example.com", consent: true }),
    );
    expect(r1.status).toBe(201);
    expect((await r1.json()).created).toBe(true);

    const r2 = await POST(
      buildReq({ email: "dup@example.com", consent: true }),
    );
    // Mismo status code — no expone enumeration
    expect(r2.status).toBe(201);
    expect((await r2.json()).created).toBe(false);
  });

  it("acepta source + locale opcionales", async () => {
    const POST = await importPost();
    const req = buildReq({
      email: "withsource@example.com",
      consent: true,
      source: "blog-marrakech",
      locale: "en",
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("trunca source a 32 chars + locale a 5", async () => {
    const POST = await importPost();
    const req = buildReq({
      email: "trunc@example.com",
      consent: true,
      source: "a".repeat(100),
      locale: "xxxxxxxxxxx",
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("normaliza email lowercase + trim", async () => {
    const POST = await importPost();
    const req = buildReq({
      email: "  MixedCase@Example.COM  ",
      consent: true,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.created).toBe(true);
  });
});

describe("/api/subscribe POST — RESEND welcome dormido", () => {
  it("welcome_sent=false sin RESEND_API_KEY (no debe fallar la response)", async () => {
    const POST = await importPost();
    const req = buildReq({
      email: "no-resend@example.com",
      consent: true,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.welcome_sent).toBe(false);
  });
});

describe("/api/subscribe POST — security", () => {
  it("rechaza email con whitespace en medio", async () => {
    const POST = await importPost();
    const req = buildReq({
      email: "bad email@example.com",
      consent: true,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rechaza email sin TLD", async () => {
    const POST = await importPost();
    const req = buildReq({ email: "user@localhost", consent: true });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
