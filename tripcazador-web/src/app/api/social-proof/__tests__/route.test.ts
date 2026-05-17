/**
 * /api/social-proof GET route.test.ts — SSS267 (17 may 2026)
 */
import { describe, it, expect, vi } from "vitest";

async function importGet() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.GET;
}

describe("/api/social-proof GET", () => {
  it("200 + shape { events, generated_at }", async () => {
    const GET = await importGet();
    const res = await GET();
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(Array.isArray(j.events)).toBe(true);
    expect(j.generated_at).toMatch(/^\d{4}-/);
  });

  it("events shape correcto (city/country/destination/price/ago_min)", async () => {
    const GET = await importGet();
    const res = await GET();
    const j = await res.json();
    for (const e of j.events) {
      expect(e.city).toBeTruthy();
      expect(e.country).toMatch(/^[A-Z]{2}$/);
      expect(e.destination).toBeTruthy();
      expect(typeof e.price).toBe("number");
      expect(typeof e.ago_min).toBe("number");
      expect(e.ago_min).toBeGreaterThanOrEqual(2);
      expect(e.ago_min).toBeLessThanOrEqual(35);
    }
  });

  it("Cache-Control con s-maxage=60 + stale-while-revalidate", async () => {
    const GET = await importGet();
    const res = await GET();
    const cc = res.headers.get("cache-control");
    expect(cc).toContain("s-maxage=60");
    expect(cc).toContain("stale-while-revalidate");
  });

  it("eventos NO incluyen PII (visitor_id, email, IP)", async () => {
    const GET = await importGet();
    const res = await GET();
    const j = await res.json();
    const text = JSON.stringify(j);
    expect(text).not.toMatch(/visitor_id/);
    expect(text).not.toMatch(/@[a-z]+\.com/);
    expect(text).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
  });

  it("dedup interno (no eventos duplicados same city-destination)", async () => {
    const GET = await importGet();
    const res = await GET();
    const j = await res.json();
    const keys = new Set();
    for (const e of j.events) {
      const k = `${e.city}-${e.destination}`;
      keys.add(k);
    }
    expect(keys.size).toBe(j.events.length);
  });
});
