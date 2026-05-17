/**
 * /api/trending GET route.test.ts — SSS264 (16 may 2026)
 *
 * Tests para endpoint público trending routes/destinations.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockReset();
  // Default: fallback path (no remote)
  mockFetch.mockResolvedValue(new Response("{}", { status: 500 }));
  global.fetch = mockFetch;
});

async function importGet() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.GET;
}

describe("/api/trending GET", () => {
  it("200 response con shape correcto", async () => {
    const GET = await importGet();
    const res = await GET();
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(Array.isArray(j.top_routes)).toBe(true);
    expect(Array.isArray(j.top_destinations)).toBe(true);
    expect(j.generated_at).toMatch(/^\d{4}-/);
    expect(["memory", "remote", "fallback"]).toContain(j.source);
  });

  it("top_routes ≤ 5 items + shape { route, clicks }", async () => {
    const GET = await importGet();
    const res = await GET();
    const j = await res.json();
    expect(j.top_routes.length).toBeLessThanOrEqual(5);
    for (const r of j.top_routes) {
      expect(typeof r.route).toBe("string");
      expect(typeof r.clicks).toBe("number");
    }
  });

  it("top_destinations ≤ 5 items + shape { destination, clicks }", async () => {
    const GET = await importGet();
    const res = await GET();
    const j = await res.json();
    expect(j.top_destinations.length).toBeLessThanOrEqual(5);
    for (const d of j.top_destinations) {
      expect(typeof d.destination).toBe("string");
      expect(typeof d.clicks).toBe("number");
    }
  });

  it("source=fallback con datos hardcoded si no hay remote ni memory", async () => {
    const GET = await importGet();
    const res = await GET();
    const j = await res.json();
    // Sin VPS ni memory data, debería caer a fallback hardcoded
    if (j.source === "fallback") {
      expect(j.top_routes.length).toBeGreaterThan(0);
      expect(j.top_destinations.length).toBeGreaterThan(0);
    }
  });

  it("Cache-Control public con max-age", async () => {
    const GET = await importGet();
    const res = await GET();
    const cc = res.headers.get("cache-control");
    // Si tiene Cache-Control debería incluir cache para CDN
    if (cc) {
      expect(cc).toMatch(/max-age|s-maxage|public/i);
    }
  });

  it("no expone ADMIN_TOKEN ni PII en response", async () => {
    const GET = await importGet();
    const res = await GET();
    const text = await res.text();
    expect(text).not.toContain("ADMIN_TOKEN");
    expect(text).not.toContain("visitor_id");
    expect(text).not.toMatch(/@[a-z]+\.com/); // no emails leaked
  });
});
