/**
 * /api/widgets/deals — SSS437 tests
 *
 * Cubre: shape compacto, CORS headers, limit clamp, ref propagation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api", () => ({
  getDeals: vi.fn(),
}));

import { GET, OPTIONS } from "../route";
import { getDeals } from "@/lib/api";

const MOCK_DEAL = {
  id: "abc123",
  origin: "MAD",
  destination: "LIS",
  city_to: "Lisboa",
  country_to: "Portugal",
  price_eur: 49.5,
  savings_pct: 32.4,
  date_out: "2026-06-15",
  date_ret: "2026-06-22",
  airline_name: "TAP Portugal",
  booking_url: "https://www.tap.pt/flights/MAD-LIS?date=2026-06-15",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/api/widgets/deals", () => {
  it("devuelve shape compacto con CORS y attribution", async () => {
    (getDeals as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      deals: [MOCK_DEAL],
    });
    const req = new NextRequest("http://localhost/api/widgets/deals?limit=5");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
    const j = (await res.json()) as {
      deals: Array<{ id: string; price_eur: number; tc_url: string; booking_url: string }>;
      attribution: string;
    };
    expect(j.deals).toHaveLength(1);
    expect(j.deals[0].id).toBe("abc123");
    expect(j.deals[0].price_eur).toBe(50); // rounded
    expect(j.deals[0].tc_url).toMatch(/\/deals\/abc123$/);
    expect(j.attribution).toContain("tripcazador.com");
  });

  it("clampa limit > 30 a 30", async () => {
    (getDeals as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      deals: Array.from({ length: 50 }, (_, i) => ({ ...MOCK_DEAL, id: `id${i}` })),
    });
    const req = new NextRequest("http://localhost/api/widgets/deals?limit=999");
    const res = await GET(req);
    const j = (await res.json()) as { deals: unknown[] };
    expect(j.deals.length).toBeLessThanOrEqual(30);
    // getDeals should have been called with limit=30
    expect(getDeals).toHaveBeenCalledWith({ limit: 30 });
  });

  it("inyecta utm_campaign con ref param en booking_url", async () => {
    (getDeals as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      deals: [MOCK_DEAL],
    });
    const req = new NextRequest("http://localhost/api/widgets/deals?ref=myblog");
    const res = await GET(req);
    const j = (await res.json()) as { deals: Array<{ booking_url: string }> };
    expect(j.deals[0].booking_url).toContain("utm_source=tripcazador_widget");
    expect(j.deals[0].booking_url).toContain("utm_campaign=partner_myblog");
  });

  it("OPTIONS preflight devuelve 204 con CORS", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });

  it("error backend devuelve 500 con CORS preservado", async () => {
    (getDeals as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("backend down"));
    const req = new NextRequest("http://localhost/api/widgets/deals");
    const res = await GET(req);
    expect(res.status).toBe(500);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    const j = (await res.json()) as { error: string; deals: unknown[] };
    expect(j.deals).toEqual([]);
    expect(j.error).toBe("internal");
  });
});
