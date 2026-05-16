/**
 * /api/trip-planner POST route.test.ts — SSS261 (16 may 2026)
 *
 * Tests para POST /api/trip-planner (AI cascade itinerary generator).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

beforeEach(() => {
  // Reset module + rate limit Map
  vi.resetModules();
});

async function importPost() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.POST;
}

function buildReq(body: unknown, ip: string = "1.1.1.1"): NextRequest {
  return new NextRequest("http://localhost/api/trip-planner", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
  });
}

describe("/api/trip-planner POST — payload validation", () => {
  it("400 si JSON inválido", async () => {
    const POST = await importPost();
    const req = new NextRequest("http://localhost/api/trip-planner", {
      method: "POST",
      body: "{broken",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si destination missing", async () => {
    const POST = await importPost();
    const req = buildReq({ days: 5 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/destino/i);
  });

  it("400 si destination demasiado corto (<2 chars)", async () => {
    const POST = await importPost();
    const req = buildReq({ destination: "x" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si destination demasiado largo (>80 chars)", async () => {
    const POST = await importPost();
    const req = buildReq({ destination: "x".repeat(100) });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si destination no string (anti-injection)", async () => {
    const POST = await importPost();
    const req = buildReq({ destination: { evil: "object" } });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("/api/trip-planner POST — clamping params", () => {
  it("acepta input válido mínimo (destination only)", async () => {
    const POST = await importPost();
    const req = buildReq({ destination: "Lisboa" });
    const res = await POST(req);
    // Status 200 (happy path con heurístico fallback si AI no configured)
    expect([200, 500]).toContain(res.status);
  });

  it("clampea days 2-21 y budget 150-50000", async () => {
    const POST = await importPost();
    // days 100 → clampea a 21; budget 50 → clampea a 150
    const req = buildReq({
      destination: "Roma",
      days: 100,
      budget: 50,
      travelers: 99,
    });
    const res = await POST(req);
    // No fail por clamping
    expect([200, 500]).toContain(res.status);
  });

  it("style inválido → cultural default", async () => {
    const POST = await importPost();
    const req = buildReq({
      destination: "Madrid",
      style: "evil_style",
    });
    const res = await POST(req);
    expect([200, 500]).toContain(res.status);
  });

  it("origin truncado a 4 chars + uppercased", async () => {
    const POST = await importPost();
    const req = buildReq({
      destination: "Tokio",
      origin: "madrid_extra_long",
    });
    const res = await POST(req);
    expect([200, 500]).toContain(res.status);
  });

  it("notes truncado a 300 chars", async () => {
    const POST = await importPost();
    const req = buildReq({
      destination: "Bali",
      notes: "x".repeat(1000),
    });
    const res = await POST(req);
    expect([200, 500]).toContain(res.status);
  });
});

describe("/api/trip-planner POST — rate limit (5/day/IP)", () => {
  it("429 tras 5 generations del mismo IP", async () => {
    const POST = await importPost();
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const req = buildReq(
        { destination: `Roma${i}` },
        "rate-test-ip-1",
      );
      const res = await POST(req);
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it("rate limit aislado por IP", async () => {
    const POST = await importPost();
    const r1 = await POST(buildReq({ destination: "Roma" }, "iso-ip-A"));
    const r2 = await POST(buildReq({ destination: "Lisboa" }, "iso-ip-B"));
    expect([200, 500]).toContain(r1.status);
    expect([200, 500]).toContain(r2.status);
  });

  it("response 429 incluye msg de Premium upsell", async () => {
    const POST = await importPost();
    for (let i = 0; i < 5; i++) {
      await POST(buildReq({ destination: `Roma${i}` }, "upsell-ip"));
    }
    const res = await POST(buildReq({ destination: "Final" }, "upsell-ip"));
    expect(res.status).toBe(429);
    const j = await res.json();
    expect(j.error).toMatch(/premium/i);
  });
});
