/**
 * /api/p alias route.test.ts — SSS259 (16 may 2026)
 *
 * /api/p es alias de /api/track (SSS175) para bypass AdBlockers.
 * Verificamos que el re-export funciona y POST se comporta igual.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
beforeEach(() => {
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
  return new NextRequest("http://localhost/api/p", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "user-agent": "test-agent",
      "x-forwarded-for": "10.0.0.1",
    },
  });
}

describe("/api/p alias", () => {
  it("re-exporta POST handler de /api/track", async () => {
    const POST = await importPost();
    expect(typeof POST).toBe("function");
  });

  it("re-exporta runtime + dynamic config", async () => {
    vi.resetModules();
    const mod = await import("../route");
    expect(mod.runtime).toBe("nodejs");
    expect(mod.dynamic).toBe("force-dynamic");
  });

  it("acepta payload válido igual que /api/track", async () => {
    const POST = await importPost();
    const req = buildReq({ type: "page_view" });
    const res = await POST(req);
    expect(res.status).toBe(202);
  });

  it("rechaza type inválido igual que /api/track", async () => {
    const POST = await importPost();
    const req = buildReq({ type: "evil_xss" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rechaza JSON inválido igual que /api/track", async () => {
    vi.resetModules();
    const mod = await import("../route");
    const req = new NextRequest("http://localhost/api/p", {
      method: "POST",
      body: "{broken",
      headers: { "content-type": "application/json" },
    });
    const res = await mod.POST(req);
    expect(res.status).toBe(400);
  });

  it("revenue event (deal_click) flush sync", async () => {
    const POST = await importPost();
    const req = buildReq({
      type: "deal_click",
      meta: { deal_id: "test_xyz" },
    });
    const res = await POST(req);
    expect(res.status).toBe(202);
  });
});
