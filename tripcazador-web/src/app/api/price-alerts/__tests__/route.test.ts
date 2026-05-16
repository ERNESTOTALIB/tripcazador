/**
 * /api/price-alerts POST route.test.ts — SSS261 (16 may 2026)
 *
 * Tests para crear alertas de precio. CRUD + validation + rate limit.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { _clearStore } from "@/lib/price_alerts_store";

beforeEach(() => {
  _clearStore();
  // Reset rate limit global state
  const g = globalThis as unknown as { __pa_rate?: Map<string, unknown> };
  if (g.__pa_rate) g.__pa_rate.clear();
});

async function importPost() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.POST;
}

function buildReq(body: unknown, ip: string = "1.1.1.1"): NextRequest {
  return new NextRequest("http://localhost/api/price-alerts", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
  });
}

describe("/api/price-alerts POST — payload validation", () => {
  it("400 si JSON inválido", async () => {
    const POST = await importPost();
    const req = new NextRequest("http://localhost/api/price-alerts", {
      method: "POST",
      body: "{broken",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si email inválido", async () => {
    const POST = await importPost();
    const req = buildReq({ email: "bad", max_price: 100 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("email_invalid");
  });

  it("400 si max_price ≤ 0 o > 50000", async () => {
    const POST = await importPost();
    let res = await POST(
      buildReq({ email: "test@example.com", max_price: 0 }),
    );
    expect(res.status).toBe(400);

    res = await POST(
      buildReq({ email: "test@example.com", max_price: -100 }),
    );
    expect(res.status).toBe(400);

    res = await POST(
      buildReq({ email: "test@example.com", max_price: 99999 }),
    );
    expect(res.status).toBe(400);
  });

  it("400 si max_price NaN", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({ email: "test@example.com", max_price: "not-a-number" }),
    );
    expect(res.status).toBe(400);
  });

  it("400 si origin no es IATA 3-letter", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({ email: "test@example.com", max_price: 100, origin: "INVALID" }),
    );
    expect(res.status).toBe(400);
  });

  it("400 si destination no es IATA 3-letter", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({
        email: "test@example.com",
        max_price: 100,
        destination: "ZZ",
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("/api/price-alerts POST — honeypot defense", () => {
  it("acepta 201 silenciosamente con honeypot rellenado", async () => {
    const POST = await importPost();
    const req = buildReq({
      email: "bot@evil.com",
      max_price: 100,
      hp: "bot-filled",
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.id).toBe("ignored");
  });
});

describe("/api/price-alerts POST — happy path", () => {
  it("201 + alert id para input válido mínimo", async () => {
    const POST = await importPost();
    const req = buildReq({ email: "user@example.com", max_price: 150 });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.id).toMatch(/^pa_/);
  });

  it("acepta origin + destination + cabin + dates opcionales", async () => {
    const POST = await importPost();
    const req = buildReq({
      email: "full@example.com",
      max_price: 200,
      origin: "MAD",
      destination: "LIS",
      cabin: "economy",
      date_min: "2026-06-01",
      date_max: "2026-08-31",
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("acepta cabin válida (economy/business/first)", async () => {
    const POST = await importPost();
    for (const cabin of ["economy", "business", "first"]) {
      const req = buildReq({
        email: `cabin-${cabin}@example.com`,
        max_price: 500,
        cabin,
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }
  });

  it("ignora cabin inválido sin fallar", async () => {
    const POST = await importPost();
    const req = buildReq({
      email: "test@example.com",
      max_price: 100,
      cabin: "luxury", // no válido — debería ignorar, no fallar
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

describe("/api/price-alerts POST — rate limit (10/h/IP)", () => {
  it("429 tras 10 alerts del mismo IP en 1h", async () => {
    const POST = await importPost();
    let lastStatus = 0;
    for (let i = 0; i < 12; i++) {
      const res = await POST(
        buildReq({ email: `t${i}@x.com`, max_price: 100 }, "9.9.9.9"),
      );
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it("rate limit aislado por IP", async () => {
    const POST = await importPost();
    const r1 = await POST(
      buildReq({ email: "t1@x.com", max_price: 100 }, "5.5.5.5"),
    );
    const r2 = await POST(
      buildReq({ email: "t2@x.com", max_price: 100 }, "6.6.6.6"),
    );
    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
  });

  it("Retry-After header presente en 429", async () => {
    const POST = await importPost();
    for (let i = 0; i < 11; i++) {
      await POST(buildReq({ email: `t${i}@x.com`, max_price: 100 }, "1.2.3.4"));
    }
    const res = await POST(
      buildReq({ email: "trigger@x.com", max_price: 100 }, "1.2.3.4"),
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("3600");
  });
});
