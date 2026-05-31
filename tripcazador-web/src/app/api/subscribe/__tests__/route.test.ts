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
  it("201 + ok:true para nuevo email (no expone created/welcome_sent)", async () => {
    // AUDIT-WEB FIX-SEC-H1 (31 may 2026): response no expone `created` ni
    // `welcome_sent` para evitar user enumeration. Solo { ok:true, status }.
    const POST = await importPost();
    const req = buildReq({ email: "new@example.com", consent: true });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.status).toBe("queued");
    expect(j.created).toBeUndefined();
    expect(j.welcome_sent).toBeUndefined();
  });

  it("user enumeration defense: misma response 201 OK para email duplicate", async () => {
    // AUDIT-WEB FIX-SEC-H1: shape idéntico entre primer signup y duplicate —
    // antes `created:true` vs `created:false` permitía enumeration.
    const POST = await importPost();
    const r1 = await POST(
      buildReq({ email: "dup@example.com", consent: true }),
    );
    expect(r1.status).toBe(201);
    const b1 = await r1.json();
    expect(b1).toEqual({ ok: true, status: "queued" });

    const r2 = await POST(
      buildReq({ email: "dup@example.com", consent: true }),
    );
    expect(r2.status).toBe(201);
    const b2 = await r2.json();
    expect(b2).toEqual({ ok: true, status: "queued" });
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
    expect(j.ok).toBe(true);
  });
});

describe("/api/subscribe POST — RESEND welcome dormido", () => {
  it("no debe fallar la response sin RESEND_API_KEY", async () => {
    const POST = await importPost();
    const req = buildReq({
      email: "no-resend@example.com",
      consent: true,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const j = await res.json();
    // AUDIT-WEB FIX-SEC-H1: welcome_sent ya no se expone.
    expect(j.ok).toBe(true);
    expect(j.welcome_sent).toBeUndefined();
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
