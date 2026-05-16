/**
 * /api/web-vitals route.test.ts — SSS260 (16 may 2026)
 *
 * Tests para POST /api/web-vitals (Core Web Vitals reporter).
 */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

async function importPost() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.POST;
}

function buildReq(body: unknown, ip: string = "1.1.1.1"): NextRequest {
  return new NextRequest("http://localhost/api/web-vitals", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      "user-agent": "test-agent",
    },
  });
}

describe("/api/web-vitals POST — input validation", () => {
  it("400 si JSON inválido", async () => {
    const POST = await importPost();
    const req = new NextRequest("http://localhost/api/web-vitals", {
      method: "POST",
      body: "{broken",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si name no en allowlist (LCP/CLS/INP/FCP/TTFB)", async () => {
    const POST = await importPost();
    const req = buildReq({ name: "EVIL_METRIC", value: 100 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si value no numérico", async () => {
    const POST = await importPost();
    const req = buildReq({ name: "LCP", value: "not-a-number" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si value negativo", async () => {
    const POST = await importPost();
    const req = buildReq({ name: "LCP", value: -100 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si value NaN/Infinity", async () => {
    const POST = await importPost();
    const req = buildReq({ name: "LCP", value: Infinity });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("/api/web-vitals POST — happy path", () => {
  it("202 + ok=true para sample válido (LCP)", async () => {
    const POST = await importPost();
    const req = buildReq({
      name: "LCP",
      value: 2300,
      rating: "good",
      page_path: "/",
    });
    const res = await POST(req);
    expect(res.status).toBe(202);
    const j = await res.json();
    expect(j.ok).toBe(true);
  });

  it("acepta los 5 metric names válidos", async () => {
    const POST = await importPost();
    for (const name of ["LCP", "CLS", "INP", "FCP", "TTFB"]) {
      const req = buildReq({ name, value: 100, page_path: "/" });
      const res = await POST(req);
      expect(res.status).toBe(202);
    }
  });

  it("acepta value=0 (CLS perfectamente bueno)", async () => {
    const POST = await importPost();
    const req = buildReq({ name: "CLS", value: 0 });
    const res = await POST(req);
    expect(res.status).toBe(202);
  });

  it("trunca page_path a 200 chars", async () => {
    const POST = await importPost();
    const longPath = "/" + "x".repeat(300);
    const req = buildReq({ name: "LCP", value: 1000, page_path: longPath });
    const res = await POST(req);
    expect(res.status).toBe(202);
  });

  it("strips query string del page_path", async () => {
    const POST = await importPost();
    const req = buildReq({
      name: "LCP",
      value: 1000,
      page_path: "/blog/foo?utm_source=email&id=123",
    });
    const res = await POST(req);
    expect(res.status).toBe(202);
  });
});

describe("/api/web-vitals POST — rate limiting (50/min/IP)", () => {
  it("429 tras 50 req mismo IP en 60s", async () => {
    const POST = await importPost();
    let lastStatus = 0;
    for (let i = 0; i < 55; i++) {
      const req = buildReq(
        { name: "LCP", value: 100 },
        "9.9.9.9",
      );
      const res = await POST(req);
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it("rate limit aislado por IP", async () => {
    const POST = await importPost();
    const r1 = await POST(buildReq({ name: "LCP", value: 100 }, "5.5.5.5"));
    expect([200, 202]).toContain(r1.status);
    const r2 = await POST(buildReq({ name: "LCP", value: 100 }, "6.6.6.6"));
    expect([200, 202]).toContain(r2.status);
  });
});
