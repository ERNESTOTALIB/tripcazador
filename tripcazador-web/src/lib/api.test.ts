/**
 * Regresión: getDeals() debe caer al fallback estático cuando el backend
 * responde 200 OK con un array vacío (cold-start o worker cron caído).
 *
 * Bug histórico (auditoría abr-2026): backend en prod devolvía `[]` y el
 * UI quedaba sin contenido durante semanas porque el fallback sólo
 * disparaba en `!res.ok`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDeals } from "./api";

// Stub del fetch para simular distintos escenarios backend/fallback.
const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

function mockFetch(
  mapping: Record<string, { ok: boolean; status?: number; body: unknown }>,
) {
  return vi.fn(async (urlOrRequest: unknown) => {
    const url =
      typeof urlOrRequest === "string"
        ? urlOrRequest
        : (urlOrRequest as URL | Request).toString();
    // Localiza el mejor match por sufijo de path
    const matchKey = Object.keys(mapping).find((k) => url.includes(k));
    if (!matchKey) {
      throw new Error(`fetch mock: URL no mapeada: ${url}`);
    }
    const { ok, status = 200, body } = mapping[matchKey];
    return {
      ok,
      status,
      json: async () => body,
    } as Response;
  });
}

describe("getDeals — fallback a static cuando backend stale/vacío", () => {
  it("backend 200 con [] → cae a /deals.json", async () => {
    const staticPayload = {
      schema_version: "4.1",
      generated_at: "2026-04-01T00:00:00Z",
      total_deals: 2,
      stats: {
        total: 2,
        flights: 2,
        hotels: 0,
        by_classification: {},
        by_region: {},
        by_cabin: {},
        price_min: 20,
        price_max: 40,
        price_avg: 30,
        verified_count: 2,
      },
      deals: [
        { id: "static-1", type: "flight" },
        { id: "static-2", type: "flight" },
      ],
    };
    global.fetch = mockFetch({
      "/api/deals": { ok: true, body: [] }, // ← backend devuelve [] con 200
      "/api/stats": { ok: true, body: { total: 0 } },
      "/deals.json": { ok: true, body: staticPayload },
    }) as unknown as typeof fetch;

    const res = await getDeals();
    expect(res.deals.length).toBe(2);
    expect(res.deals[0].id).toBe("static-1");
  });

  it("backend 200 con deals reales → usa backend (no fallback)", async () => {
    global.fetch = mockFetch({
      "/api/deals": { ok: true, body: [{ id: "real-1", type: "flight" }] },
      "/api/stats": { ok: true, body: { total: 1 } },
    }) as unknown as typeof fetch;

    const res = await getDeals();
    expect(res.deals.length).toBe(1);
    expect(res.deals[0].id).toBe("real-1");
  });

  it("backend 500 → cae a static (comportamiento previo conservado)", async () => {
    global.fetch = mockFetch({
      "/api/deals": { ok: false, status: 500, body: null },
      "/api/stats": { ok: true, body: { total: 0 } },
      "/deals.json": {
        ok: true,
        body: { deals: [{ id: "static-from-500", type: "flight" }] },
      },
    }) as unknown as typeof fetch;

    const res = await getDeals();
    expect(res.deals[0].id).toBe("static-from-500");
  });

  it("backend 200 [] y /deals.json también vacío → empty response bien formada", async () => {
    global.fetch = mockFetch({
      "/api/deals": { ok: true, body: [] },
      "/api/stats": { ok: true, body: { total: 0 } },
      "/deals.json": { ok: false, status: 404, body: null },
    }) as unknown as typeof fetch;

    const res = await getDeals();
    expect(res.deals).toEqual([]);
    expect(res.stats.total).toBe(0);
    // Debe seguir siendo un DealsResponse válido, no undefined.
    expect(res.schema_version).toBeDefined();
  });
});
