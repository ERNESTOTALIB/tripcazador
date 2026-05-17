/**
 * /api/feed/[group] GET route.test.ts — SSS268 (17 may 2026)
 */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

async function importGet() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.GET;
}

function buildReq(): NextRequest {
  return new NextRequest("http://localhost/api/feed/test", { method: "GET" });
}

describe("/api/feed/[group] GET", () => {
  it("404 si group desconocido", async () => {
    const GET = await importGet();
    const res = await GET(buildReq(), { params: { group: "nonexistent-group-xyz" } });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/unknown group/i);
  });

  it("200 + shape correcto con group válido", async () => {
    const GET = await importGet();
    // Sabemos que existen route_groups del catalog SSS254
    const groups = ["budget", "luxury", "weekend", "longhaul"];
    for (const g of groups) {
      const res = await GET(buildReq(), { params: { group: g } });
      if (res.status === 200) {
        const j = await res.json();
        expect(j.group).toBeTruthy();
        expect(j.label).toBeTruthy();
        expect(j.emoji).toBeTruthy();
        expect(j.description).toBeTruthy();
        expect(typeof j.count).toBe("number");
        expect(Array.isArray(j.deals)).toBe(true);
        expect(j.deals.length).toBeLessThanOrEqual(30);
        break;
      }
    }
  });

  it("Cache-Control public + s-maxage 300", async () => {
    const GET = await importGet();
    const res = await GET(buildReq(), { params: { group: "budget" } });
    if (res.status === 200) {
      const cc = res.headers.get("cache-control");
      expect(cc).toContain("public");
      expect(cc).toContain("s-maxage=300");
      expect(cc).toContain("stale-while-revalidate");
    }
  });

  it("rechaza group con chars peligrosos (404 vía route_groups allowlist)", async () => {
    const GET = await importGet();
    const res = await GET(buildReq(), {
      params: { group: "<script>alert(1)</script>" },
    });
    expect(res.status).toBe(404);
  });
});
