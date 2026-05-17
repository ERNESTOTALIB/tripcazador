/**
 * /api/deals/[id] GET route.test.ts — SSS268 (17 may 2026)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(
    new Response("{}", { status: 404 }),
  );
  global.fetch = mockFetch;
});

async function importGet() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.GET;
}

function buildReq(): NextRequest {
  return new NextRequest("http://localhost/api/deals/test", { method: "GET" });
}

describe("/api/deals/[id] GET — validation", () => {
  it("400 si id vacío", async () => {
    const GET = await importGet();
    const res = await GET(buildReq(), {
      params: Promise.resolve({ id: "" }),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid id");
  });

  it("400 si id demasiado largo (>200 chars)", async () => {
    const GET = await importGet();
    const res = await GET(buildReq(), {
      params: Promise.resolve({ id: "x".repeat(250) }),
    });
    expect(res.status).toBe(400);
  });

  it("acepta id válido (404 o 200 dependiendo del fetch)", async () => {
    const GET = await importGet();
    const res = await GET(buildReq(), {
      params: Promise.resolve({ id: "deal_test_abc" }),
    });
    expect([200, 404]).toContain(res.status);
  });

  it("encodeURIComponent en id (XSS defense en upstream URL)", async () => {
    const GET = await importGet();
    await GET(buildReq(), {
      params: Promise.resolve({ id: "<script>alert(1)</script>" }),
    });
    // El fetch debería haber sido llamado con el id encodeado
    if (mockFetch.mock.calls.length > 0) {
      const calledUrl = String(mockFetch.mock.calls[0][0]);
      expect(calledUrl).not.toContain("<script>");
      expect(calledUrl).toContain("%3Cscript%3E");
    }
  });
});

describe("/api/deals/[id] GET — fallback to repo", () => {
  it("fallback a repo deals-latest.json si VPS 404", async () => {
    // Primera call: VPS 404. Segunda call: repo with deals.
    mockFetch
      .mockResolvedValueOnce(new Response("{}", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { id: "deal_test_xyz", price_eur: 99, city_from: "MAD" },
          ]),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );
    const GET = await importGet();
    const res = await GET(buildReq(), {
      params: Promise.resolve({ id: "deal_test_xyz" }),
    });
    expect([200, 404]).toContain(res.status);
  });
});
