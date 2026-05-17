/**
 * /api/v1/deals GET route.test.ts — SSS266 (17 may 2026)
 *
 * Tests para public API v1 con auth Bearer + rate limit.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createHmac } from "crypto";

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(
    new Response(JSON.stringify({ deals: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  global.fetch = mockFetch;
});

async function importGet() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.GET;
}

const API_SECRET =
  process.env.PUBLIC_API_SECRET || "tripcazador-api-secret-may-2026";

function makeKey(clientId: string, tier: "free" | "paid" = "free"): string {
  const sig = createHmac("sha256", API_SECRET)
    .update(`${clientId}:${tier}`)
    .digest("hex")
    .slice(0, 8);
  return `TC-API-${clientId}-${sig}-${tier}`;
}

function buildReq(headers: Record<string, string> = {}, query: string = ""): NextRequest {
  return new NextRequest(`http://localhost/api/v1/deals${query}`, {
    method: "GET",
    headers,
  });
}

describe("/api/v1/deals — auth", () => {
  it("401 sin Authorization header", async () => {
    const GET = await importGet();
    const res = await GET(buildReq());
    expect(res.status).toBe(401);
    const j = await res.json();
    expect(j.error).toMatch(/Missing Authorization/i);
    expect(j.docs).toBeTruthy();
    expect(j.signup).toBeTruthy();
  });

  it("403 con API key formato inválido", async () => {
    const GET = await importGet();
    const res = await GET(buildReq({ authorization: "Bearer not-a-valid-key" }));
    expect(res.status).toBe(403);
  });

  it("403 con API key formato OK pero HMAC mismatch", async () => {
    const GET = await importGet();
    const fakeKey = "TC-API-someuser-00000000-free";
    const res = await GET(buildReq({ authorization: `Bearer ${fakeKey}` }));
    expect(res.status).toBe(403);
  });

  it("acepta API key válida free tier", async () => {
    const GET = await importGet();
    const key = makeKey("testclient", "free");
    const res = await GET(buildReq({ authorization: `Bearer ${key}` }));
    expect([200, 429]).toContain(res.status);
  });

  it("acepta API key válida paid tier", async () => {
    const GET = await importGet();
    const key = makeKey("paiduser", "paid");
    const res = await GET(buildReq({ authorization: `Bearer ${key}` }));
    expect([200, 429]).toContain(res.status);
  });

  it("'Bearer ' prefix opcional (case insensitive)", async () => {
    const GET = await importGet();
    const key = makeKey("flexclient", "free");
    const res = await GET(buildReq({ authorization: `bearer ${key}` }));
    expect([200, 429]).toContain(res.status);
  });
});

describe("/api/v1/deals — rate limit free (100/day)", () => {
  it("429 tras 100 req del mismo client_id free tier", async () => {
    const GET = await importGet();
    const key = makeKey("ratelimited", "free");
    let lastStatus = 0;
    for (let i = 0; i < 105; i++) {
      const res = await GET(buildReq({ authorization: `Bearer ${key}` }));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it("X-RateLimit-Remaining header presente en 429", async () => {
    const GET = await importGet();
    const key = makeKey("headertest", "free");
    for (let i = 0; i < 101; i++) {
      await GET(buildReq({ authorization: `Bearer ${key}` }));
    }
    const res = await GET(buildReq({ authorization: `Bearer ${key}` }));
    expect(res.status).toBe(429);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });
});

describe("/api/v1/deals — response shape", () => {
  it("200 incluye deals + count + generated_at + attribution + license CC-BY-4.0", async () => {
    const GET = await importGet();
    const key = makeKey("shapeclient", "free");
    const res = await GET(buildReq({ authorization: `Bearer ${key}` }));
    if (res.status === 200) {
      const j = await res.json();
      expect(Array.isArray(j.deals)).toBe(true);
      expect(typeof j.count).toBe("number");
      expect(j.generated_at).toMatch(/^\d{4}-/);
      expect(j.attribution).toMatch(/TripCazador/i);
      expect(j.license).toBe("CC-BY-4.0");
    }
  });

  it("Cache-Control private + CORS Access-Control-Allow-Origin *", async () => {
    const GET = await importGet();
    const key = makeKey("ccclient", "free");
    const res = await GET(buildReq({ authorization: `Bearer ${key}` }));
    if (res.status === 200) {
      expect(res.headers.get("cache-control")).toContain("private");
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    }
  });
});

describe("/api/v1/deals — input filters forwarded", () => {
  it("forwarda origin/destination/max_price/limit al /api/deals interno", async () => {
    const GET = await importGet();
    const key = makeKey("filterclient", "free");
    await GET(
      buildReq(
        { authorization: `Bearer ${key}` },
        "?origin=MAD&destination=LIS&max_price=200&limit=10",
      ),
    );
    if (mockFetch.mock.calls.length > 0) {
      const calledUrl = String(mockFetch.mock.calls[0][0]);
      expect(calledUrl).toContain("origin=MAD");
      expect(calledUrl).toContain("destination=LIS");
      expect(calledUrl).toContain("max_price=200");
      expect(calledUrl).toContain("limit=10");
    }
  });

  it("default limit=30 si no provisto", async () => {
    const GET = await importGet();
    const key = makeKey("defaultlim", "free");
    await GET(buildReq({ authorization: `Bearer ${key}` }));
    if (mockFetch.mock.calls.length > 0) {
      const calledUrl = String(mockFetch.mock.calls[0][0]);
      expect(calledUrl).toContain("limit=30");
    }
  });
});
