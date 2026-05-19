/**
 * /api/premium/secret-deals route.test.ts — SSS318
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/secret-deals${qs}`);
}

const NOW = Date.now();
function isoMinusH(h: number): string {
  return new Date(NOW - h * 3_600_000).toISOString();
}

describe("GET /api/premium/secret-deals SSS318", () => {
  afterEach(() => vi.restoreAllMocks());
  beforeEach(() => vi.restoreAllMocks());

  it("400 customer_id inválido", async () => {
    const res = await GET(getReq("?customer_id=junk"));
    expect(res.status).toBe(400);
  });

  it("400 sin customer_id", async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(400);
  });

  it("200 devuelve solo deals CRÍTICO/ERROR < 24h ago", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            deals: [
              { id: "a", classification: "CRÍTICO", found_at: isoMinusH(2), price_eur: 150 },
              { id: "b", classification: "OFERTA", found_at: isoMinusH(1), price_eur: 100 }, // skip
              { id: "c", classification: "ERROR", found_at: isoMinusH(12), price_eur: 200 },
              { id: "d", classification: "CRÍTICO", found_at: isoMinusH(30), price_eur: 80 }, // skip viejo
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    const res = await GET(getReq("?customer_id=cs_live_secret001"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.total).toBe(2);
    expect(data.deals.map((d: { id: string }) => d.id).sort()).toEqual(["a", "c"]);
  });

  it("incluye ttl_ms para cada deal devuelto", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            deals: [
              { id: "a", classification: "CRÍTICO", found_at: isoMinusH(1), price_eur: 150 },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const res = await GET(getReq("?customer_id=cs_live_secret002"));
    const data = await res.json();
    expect(data.deals[0].ttl_ms).toBeGreaterThan(22 * 3_600_000);
  });

  it("orden por found_at descendente (más reciente primero)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            deals: [
              { id: "old", classification: "CRÍTICO", found_at: isoMinusH(20), price_eur: 200 },
              { id: "new", classification: "CRÍTICO", found_at: isoMinusH(1), price_eur: 100 },
              { id: "mid", classification: "CRÍTICO", found_at: isoMinusH(10), price_eur: 150 },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const res = await GET(getReq("?customer_id=cs_live_secret003"));
    const data = await res.json();
    expect(data.deals.map((d: { id: string }) => d.id)).toEqual(["new", "mid", "old"]);
  });

  it("200 con 0 deals si fetch devuelve nada", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("[]", { status: 200 })),
    );
    const res = await GET(getReq("?customer_id=cs_live_secret004"));
    const data = await res.json();
    expect(data.total).toBe(0);
    expect(data.deals).toEqual([]);
  });
});
