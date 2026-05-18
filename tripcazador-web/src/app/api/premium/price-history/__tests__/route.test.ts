/**
 * /api/premium/price-history route.test.ts — SSS302
 */
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

function req(qs: string): NextRequest {
  return new NextRequest(`http://localhost/api/premium/price-history${qs}`);
}

describe("GET /api/premium/price-history SSS302", () => {
  it("200 con params válidos", async () => {
    const res = await GET(req("?origin=BCN&destination=JFK&cabin=economy&current=400"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.current).toBe(400);
    expect(data.points.length).toBe(30);
    expect(["low", "fair", "high"]).toContain(data.verdict);
  });

  it("400 si origin no IATA", async () => {
    const res = await GET(req("?origin=ZZ&destination=JFK&current=400"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("origin_invalid");
  });

  it("400 si destination no IATA", async () => {
    const res = await GET(req("?origin=BCN&destination=JF&current=400"));
    expect(res.status).toBe(400);
  });

  it("400 si current missing o no número", async () => {
    const res = await GET(req("?origin=BCN&destination=JFK&current=garbage"));
    expect(res.status).toBe(400);
  });

  it("400 si current excede 50000", async () => {
    const res = await GET(req("?origin=BCN&destination=JFK&current=99999"));
    expect(res.status).toBe(400);
  });

  it("400 si current <= 0", async () => {
    const res = await GET(req("?origin=BCN&destination=JFK&current=0"));
    expect(res.status).toBe(400);
  });

  it("default cabin = economy", async () => {
    const res = await GET(req("?origin=BCN&destination=JFK&current=400"));
    expect(res.status).toBe(200);
  });

  it("400 si cabin no soportada", async () => {
    const res = await GET(
      req("?origin=BCN&destination=JFK&cabin=premium_super_first&current=400"),
    );
    expect(res.status).toBe(400);
  });

  it("Cache-Control 1h", async () => {
    const res = await GET(req("?origin=BCN&destination=JFK&current=400"));
    expect(res.headers.get("Cache-Control")).toContain("max-age=3600");
  });

  it("determinismo: misma ruta misma curva", async () => {
    const r1 = await (
      await GET(req("?origin=BCN&destination=JFK&current=400"))
    ).json();
    const r2 = await (
      await GET(req("?origin=BCN&destination=JFK&current=400"))
    ).json();
    expect(r1.points).toEqual(r2.points);
  });
});
