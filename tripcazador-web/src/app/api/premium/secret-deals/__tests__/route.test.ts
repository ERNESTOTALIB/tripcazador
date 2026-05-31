/**
 * /api/premium/secret-deals route.test.ts — SSS318 + REFACTOR 31 may 2026
 *
 * Post-refactor: el endpoint lee public/deals-latest.json con fs.readFile
 * en lugar de fetch al backend VPS. Mockeamos node:fs/promises antes de
 * importar el route (mismo patrón que /api/search test).
 */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const NOW = Date.now();
function isoMinusH(h: number): string {
  return new Date(NOW - h * 3_600_000).toISOString();
}

// Mock fs.readFile y resetear el module cache para forzar re-evaluación
// del cache module-level del route handler entre tests.
const fsMock = vi.hoisted(() => ({
  readFile: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  default: fsMock,
  readFile: fsMock.readFile,
}));

function setDeals(deals: Array<Record<string, unknown>>): void {
  // Cache TTL del route es 60s. Invalidar el módulo entre cada llamada
  // requiere reset module — alternativa: cada test usa customer_id distinto
  // y el mock devuelve el payload deseado en orden.
  fsMock.readFile.mockResolvedValue(JSON.stringify({ deals }));
}

function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/secret-deals${qs}`);
}

describe("GET /api/premium/secret-deals SSS318", () => {
  it("400 customer_id inválido", async () => {
    vi.resetModules();
    setDeals([]);
    const { GET } = await import("../route");
    const res = await GET(getReq("?customer_id=junk"));
    expect(res.status).toBe(400);
  });

  it("400 sin customer_id", async () => {
    vi.resetModules();
    setDeals([]);
    const { GET } = await import("../route");
    const res = await GET(getReq());
    expect(res.status).toBe(400);
  });

  it("200 devuelve solo deals CRÍTICO/ERROR < 24h ago", async () => {
    vi.resetModules();
    setDeals([
      { id: "a", classification: "CRÍTICO", found_at: isoMinusH(2), price_eur: 150 },
      { id: "b", classification: "OFERTA", found_at: isoMinusH(1), price_eur: 100 },
      { id: "c", classification: "ERROR", found_at: isoMinusH(12), price_eur: 200 },
      { id: "d", classification: "CRÍTICO", found_at: isoMinusH(30), price_eur: 80 },
    ]);
    const { GET } = await import("../route");
    const res = await GET(getReq("?customer_id=cs_live_secret001"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.total).toBe(2);
    expect(data.deals.map((d: { id: string }) => d.id).sort()).toEqual(["a", "c"]);
  });

  it("incluye ttl_ms para cada deal devuelto", async () => {
    vi.resetModules();
    setDeals([
      { id: "a", classification: "CRÍTICO", found_at: isoMinusH(1), price_eur: 150 },
    ]);
    const { GET } = await import("../route");
    const res = await GET(getReq("?customer_id=cs_live_secret002"));
    const data = await res.json();
    expect(data.deals[0].ttl_ms).toBeGreaterThan(22 * 3_600_000);
  });

  it("orden por found_at descendente (más reciente primero)", async () => {
    vi.resetModules();
    setDeals([
      { id: "old", classification: "CRÍTICO", found_at: isoMinusH(20), price_eur: 200 },
      { id: "new", classification: "CRÍTICO", found_at: isoMinusH(1), price_eur: 100 },
      { id: "mid", classification: "CRÍTICO", found_at: isoMinusH(10), price_eur: 150 },
    ]);
    const { GET } = await import("../route");
    const res = await GET(getReq("?customer_id=cs_live_secret003"));
    const data = await res.json();
    expect(data.deals.map((d: { id: string }) => d.id)).toEqual(["new", "mid", "old"]);
  });

  it("200 con 0 deals si dataset vacío", async () => {
    vi.resetModules();
    setDeals([]);
    const { GET } = await import("../route");
    const res = await GET(getReq("?customer_id=cs_live_secret004"));
    const data = await res.json();
    expect(data.total).toBe(0);
    expect(data.deals).toEqual([]);
  });
});
