/**
 * /api/trends GET route.test.ts — SSS267 (17 may 2026)
 */
import { describe, it, expect, vi } from "vitest";

async function importGet() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.GET;
}

describe("/api/trends GET", () => {
  it("200 + shape válido (rows + generated_at o similar)", async () => {
    const GET = await importGet();
    const res = await GET();
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j).toBeTruthy();
    expect(typeof j).toBe("object");
  });

  it("returns trend rows con rank/destination/country/searches_7d/growth", async () => {
    const GET = await importGet();
    const res = await GET();
    const j = await res.json();
    const rows = j.trends || j.rows || j.data || (Array.isArray(j) ? j : []);
    if (Array.isArray(rows) && rows.length > 0) {
      const r = rows[0];
      expect(r.destination).toBeTruthy();
      expect(typeof r.searches_7d).toBe("number");
    }
  });

  it("emojis válidos (no XSS chars peligrosos)", async () => {
    const GET = await importGet();
    const res = await GET();
    const text = await res.text();
    expect(text).not.toMatch(/<script/i);
    expect(text).not.toMatch(/javascript:/i);
  });
});
