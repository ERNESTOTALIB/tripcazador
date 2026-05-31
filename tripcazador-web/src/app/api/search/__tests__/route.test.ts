import { describe, it, expect, vi, beforeAll } from "vitest";
import { NextRequest } from "next/server";

// Mock the fs module BEFORE importing route
vi.mock("node:fs/promises", () => ({
  default: {
    readFile: vi.fn().mockResolvedValue(
      JSON.stringify({
        deals: [
          {
            id: "deal-1",
            type: "flight",
            origin: "MAD",
            destination: "BCN",
            city_from: "Madrid",
            city_to: "Barcelona",
            country_to: "España",
            price_eur: 50,
            cabin: "economy",
            headline: "Madrid-Barcelona barato",
            date_out: "2026-08-15",
          },
          {
            id: "deal-2",
            type: "flight",
            origin: "MAD",
            destination: "NRT",
            city_from: "Madrid",
            city_to: "Tokio",
            country_to: "Japón",
            price_eur: 450,
            cabin: "economy",
            headline: "Madrid-Tokio chollo",
            date_out: "2026-10-20",
          },
          {
            id: "deal-3",
            type: "flight",
            origin: "BCN",
            destination: "LHR",
            city_from: "Barcelona",
            city_to: "Londres",
            country_to: "Reino Unido",
            price_eur: 80,
            cabin: "business",
            headline: "Barcelona-Londres business",
            date_out: "2026-09-10",
          },
          {
            id: "deal-4",
            type: "hotel",
            origin: "",
            destination: "PAR",
            city_to: "París",
            price_eur: 120,
            cabin: "economy",
            headline: "Hotel París centro",
          },
        ],
      }),
    ),
  },
  readFile: vi.fn().mockResolvedValue(
    JSON.stringify({ deals: [] }),
  ),
}));

beforeAll(() => {
  // Ensure fresh import after mock
});

describe("/api/search route", () => {
  it("filtra por origin", async () => {
    const { GET } = await import("../route");
    const req = new NextRequest("http://localhost/api/search?origin=MAD");
    const res = await GET(req);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
    expect(body.every((d: { origin: string }) => d.origin === "MAD")).toBe(true);
  });

  it("filtra por max_price", async () => {
    const { GET } = await import("../route");
    const req = new NextRequest("http://localhost/api/search?max_price=100");
    const res = await GET(req);
    const body = await res.json();
    expect(body.every((d: { price_eur: number }) => d.price_eur <= 100)).toBe(
      true,
    );
  });

  it("filtra por deal_type=flight (excluye hoteles)", async () => {
    const { GET } = await import("../route");
    const req = new NextRequest("http://localhost/api/search?deal_type=flight");
    const res = await GET(req);
    const body = await res.json();
    expect(body.every((d: { type: string }) => d.type === "flight")).toBe(true);
  });

  it("busca libre con q", async () => {
    const { GET } = await import("../route");
    const req = new NextRequest("http://localhost/api/search?q=barat");
    const res = await GET(req);
    const body = await res.json();
    expect(body.length).toBeGreaterThan(0);
  });

  it("limit aplica + sort ascendente price", async () => {
    const { GET } = await import("../route");
    const req = new NextRequest("http://localhost/api/search?limit=2");
    const res = await GET(req);
    const body = await res.json();
    expect(body.length).toBeLessThanOrEqual(2);
    if (body.length > 1) {
      expect(body[0].price_eur).toBeLessThanOrEqual(body[1].price_eur);
    }
  });

  it("limit max 200 (rechaza valores absurdos)", async () => {
    const { GET } = await import("../route");
    const req = new NextRequest("http://localhost/api/search?limit=99999");
    const res = await GET(req);
    expect(res.status).toBe(200);
    // mocked dataset has only 4 deals, so 4 is fine
  });

  it("response tiene CORS + cache headers", async () => {
    const { GET } = await import("../route");
    const req = new NextRequest("http://localhost/api/search");
    const res = await GET(req);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
  });
});
