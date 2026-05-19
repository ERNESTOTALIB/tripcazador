/**
 * /api/premium/trip-combos route.test.ts — SSS325
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/trip-combos${qs}`);
}

describe("GET /api/premium/trip-combos SSS325", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => vi.restoreAllMocks());

  it("400 customer_id inválido", async () => {
    const res = await GET(getReq("?customer_id=junk&destination=JFK&month=2026-09&nights=5"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("customer_id_invalid");
  });

  it("400 destination no IATA", async () => {
    const res = await GET(
      getReq("?customer_id=cs_live_user325AAA&destination=xx&month=2026-09&nights=5"),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("destination_invalid");
  });

  it("400 month mal formado", async () => {
    const res = await GET(
      getReq("?customer_id=cs_live_user325AAA&destination=JFK&month=09-2026&nights=5"),
    );
    expect(res.status).toBe(400);
  });

  it("400 nights fuera de rango", async () => {
    const res = await GET(
      getReq("?customer_id=cs_live_user325AAA&destination=JFK&month=2026-09&nights=99999"),
    );
    expect(res.status).toBe(400);
  });

  it("200 vacío si no hay deals match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ deals: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const res = await GET(
      getReq("?customer_id=cs_live_user325AAA&destination=JFK&month=2026-09&nights=5"),
    );
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.combos).toEqual([]);
  });

  it("200 con combos para deals match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            deals: [
              {
                id: "deal_a",
                origin: "BCN",
                destination: "JFK",
                price_eur: 400,
                date_out: "2026-09-10",
                airline_name: "Iberia",
              },
              {
                id: "deal_b",
                origin: "MAD",
                destination: "JFK",
                price_eur: 350,
                date_out: "2026-09-12",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const res = await GET(
      getReq("?customer_id=cs_live_user325AAA&destination=JFK&month=2026-09&nights=5"),
    );
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.combos.length).toBeGreaterThan(0);
    // Cheapest combo first
    expect(d.combos[0].flight.id).toBeDefined();
    expect(d.combos[0].total_eur).toBeGreaterThan(0);
  });
});
