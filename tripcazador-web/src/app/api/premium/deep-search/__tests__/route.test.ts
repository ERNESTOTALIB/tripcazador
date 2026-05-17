/**
 * /api/premium/deep-search POST route.test.ts — SSS269 (17 may 2026)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api", () => ({
  getDeals: vi.fn(() =>
    Promise.resolve({
      deals: [
        {
          id: "deal_1",
          origin: "MAD",
          destination: "DPS",
          city_from: "Madrid",
          city_to: "Bali",
          date_out: "2026-09-18",
          price_eur: 480,
          airline_name: "Singapore Airlines",
          stops: 1,
          final_score: 85,
        },
      ],
    }),
  ),
}));

beforeEach(() => {
  vi.resetModules();
});

async function importPost() {
  const mod = await import("../route");
  return mod.POST;
}

function buildReq(body: object): NextRequest {
  return new NextRequest("http://localhost/api/premium/deep-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/premium/deep-search POST — validation", () => {
  it("400 si JSON inválido", async () => {
    const POST = await importPost();
    const req = new NextRequest("http://localhost/api/premium/deep-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_json");
  });

  it("400 si origin desconocido", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({
        origin: "PlanetXYZ",
        destination: "Madrid",
        date_from: "2026-09-15",
        date_to: "2026-09-25",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("origin_not_found");
  });

  it("400 si destination desconocido", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({
        origin: "Madrid",
        destination: "PlanetXYZ",
        date_from: "2026-09-15",
        date_to: "2026-09-25",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("destination_not_found");
  });

  it("400 si fechas missing", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({
        origin: "Madrid",
        destination: "Bali",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("dates_required");
  });
});

describe("/api/premium/deep-search POST — algorithm", () => {
  it("200 + shape correcto + matches encontrados", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({
        origin: "Madrid",
        destination: "Bali",
        date_from: "2026-09-15",
        date_to: "2026-09-25",
        flex_days: 3,
      }),
    );
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.baseline_typical_eur).toBeGreaterThan(0);
    expect(Array.isArray(j.options)).toBe(true);
    expect(typeof j.total_matched).toBe("number");
    expect(j.query.origin.city).toBeTruthy();
    expect(j.query.destination.city).toBeTruthy();
  });

  it("flex_days clampeado a [0, 7]", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({
        origin: "Madrid",
        destination: "Bali",
        date_from: "2026-09-15",
        date_to: "2026-09-25",
        flex_days: 99,
      }),
    );
    const j = await res.json();
    expect(j.query.flex_days).toBeLessThanOrEqual(7);
  });

  it("live=true marca live_mode", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({
        origin: "Madrid",
        destination: "Bali",
        date_from: "2026-09-15",
        date_to: "2026-09-25",
        live: true,
      }),
    );
    const j = await res.json();
    expect(j.live_mode).toBe(true);
    expect(j.mode).toBe("live-on-demand");
  });

  it("default mode = cache-deals", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({
        origin: "Madrid",
        destination: "Bali",
        date_from: "2026-09-15",
        date_to: "2026-09-25",
      }),
    );
    const j = await res.json();
    expect(j.live_mode).toBe(false);
    expect(j.mode).toBe("cache-deals");
  });

  it("options ≤ 10 elementos", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({
        origin: "Madrid",
        destination: "Bali",
        date_from: "2026-09-15",
        date_to: "2026-09-25",
        flex_days: 7,
      }),
    );
    const j = await res.json();
    expect(j.options.length).toBeLessThanOrEqual(10);
  });
});
