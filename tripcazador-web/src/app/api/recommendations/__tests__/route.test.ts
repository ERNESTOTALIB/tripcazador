/**
 * /api/recommendations GET route.test.ts — SSS262 (16 may 2026)
 *
 * Tests para endpoint público de recomendaciones por seeds.
 */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

async function importGet() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.GET;
}

function buildReq(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/recommendations${query}`, {
    method: "GET",
  });
}

describe("/api/recommendations GET", () => {
  it("200 con note si seeds vacíos", async () => {
    const GET = await importGet();
    const req = buildReq("");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.recommendations).toEqual([]);
    expect(j.note).toMatch(/seeds=IATA/);
  });

  it("200 + recommendations para seed válido (BKK)", async () => {
    const GET = await importGet();
    const req = buildReq("?seeds=BKK&limit=5");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.seeds).toEqual(["BKK"]);
    expect(Array.isArray(j.recommendations)).toBe(true);
    expect(j.recommendations.length).toBeLessThanOrEqual(5);
    expect(j.generated_at).toMatch(/^\d{4}-/);
  });

  it("acepta múltiples seeds CSV", async () => {
    const GET = await importGet();
    const req = buildReq("?seeds=BKK,DPS,FCO&limit=10");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.seeds).toEqual(["BKK", "DPS", "FCO"]);
  });

  it("filtra seeds inválidos (no 3-letter IATA)", async () => {
    const GET = await importGet();
    // INVALID(7), 12(num), <>(symbols) → todos rechazados
    const req = buildReq("?seeds=BKK,INVALID,FCO,12,DPS");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.seeds).toEqual(["BKK", "FCO", "DPS"]);
  });

  it("case-insensitive — uppercases seeds", async () => {
    const GET = await importGet();
    const req = buildReq("?seeds=bkk,dps");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect((await res.json()).seeds).toEqual(["BKK", "DPS"]);
  });

  it("clampea limit 1-12", async () => {
    const GET = await importGet();
    let res = await GET(buildReq("?seeds=BKK&limit=0"));
    expect(res.status).toBe(200);
    let j = await res.json();
    expect(j.recommendations.length).toBeLessThanOrEqual(12);

    res = await GET(buildReq("?seeds=BKK&limit=100"));
    j = await res.json();
    expect(j.recommendations.length).toBeLessThanOrEqual(12);
  });

  it("limit no numérico → default 6", async () => {
    const GET = await importGet();
    const req = buildReq("?seeds=BKK&limit=abc");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.recommendations.length).toBeLessThanOrEqual(6);
  });

  it("Cache-Control public 1h", async () => {
    const GET = await importGet();
    const req = buildReq("?seeds=BKK");
    const res = await GET(req);
    const cc = res.headers.get("cache-control");
    expect(cc).toContain("max-age=3600");
  });

  it("XSS defense en seeds (regex IATA strict)", async () => {
    const GET = await importGet();
    const req = buildReq("?seeds=<script>alert(1)</script>");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const j = await res.json();
    // El regex /^[A-Z]{3}$/ rechaza todo lo que no sea 3 letras
    expect(j.recommendations).toEqual([]);
  });
});
