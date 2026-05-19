/**
 * /api/premium/hotel-watchlist route.test.ts — SSS323
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET, DELETE } from "../route";
import { _clearStore } from "@/lib/hotel_watchlist_store";

const CUSTOMER = "cs_live_user323AAA";
const VALID = {
  customer_id: CUSTOMER,
  email: "x@y.com",
  city: "LIS",
  date_in: "2026-08-15",
  date_out: "2026-08-17",
  price_per_night_baseline: 80,
};

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/premium/hotel-watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/hotel-watchlist${qs}`);
}
function delReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/hotel-watchlist${qs}`, {
    method: "DELETE",
  });
}

describe("POST /api/premium/hotel-watchlist SSS323", () => {
  beforeEach(() => _clearStore());

  it("201 crea hotel watch válido", async () => {
    const res = await POST(postReq(VALID));
    expect(res.status).toBe(201);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.watch.id).toMatch(/^hw_/);
    expect(d.watch.target_drop_pct).toBe(10);
  });

  it("400 customer_id inválido", async () => {
    const res = await POST(postReq({ ...VALID, customer_id: "junk" }));
    expect(res.status).toBe(400);
  });

  it("400 email inválido", async () => {
    const res = await POST(postReq({ ...VALID, email: "no_at" }));
    expect(res.status).toBe(400);
  });

  it("400 city no IATA", async () => {
    const res = await POST(postReq({ ...VALID, city: "xx" }));
    expect(res.status).toBe(400);
  });

  it("400 date_in inválido", async () => {
    const res = await POST(postReq({ ...VALID, date_in: "15/08/2026" }));
    expect(res.status).toBe(400);
  });

  it("400 rango fechas invertido", async () => {
    const res = await POST(
      postReq({ ...VALID, date_in: "2026-08-17", date_out: "2026-08-15" }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("date_range_invalid");
  });

  it("400 precio inválido", async () => {
    const res = await POST(postReq({ ...VALID, price_per_night_baseline: 0 }));
    expect(res.status).toBe(400);
  });

  it("400 target_drop_pct fuera de rango", async () => {
    const res = await POST(postReq({ ...VALID, target_drop_pct: 99 }));
    expect(res.status).toBe(400);
  });

  it("dedupe: misma city + fechas → mismo id", async () => {
    const a = await POST(postReq(VALID));
    const b = await POST(postReq(VALID));
    const da = await a.json();
    const db = await b.json();
    expect(da.watch.id).toBe(db.watch.id);
  });

  it("400 body no-JSON", async () => {
    const req = new NextRequest("http://localhost/api/premium/hotel-watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    expect((await POST(req)).status).toBe(400);
  });
});

describe("GET /api/premium/hotel-watchlist SSS323", () => {
  beforeEach(() => _clearStore());

  it("200 lista del customer ordenada más reciente primero", async () => {
    await POST(postReq({ ...VALID, city: "LIS" }));
    await new Promise((r) => setTimeout(r, 2));
    await POST(postReq({ ...VALID, city: "BCN" }));
    const res = await GET(getReq(`?customer_id=${CUSTOMER}`));
    const d = await res.json();
    expect(d.watches.length).toBe(2);
    expect(d.watches[0].city).toBe("BCN");
  });

  it("400 customer_id inválido", async () => {
    const res = await GET(getReq("?customer_id=junk"));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/premium/hotel-watchlist SSS323", () => {
  beforeEach(() => _clearStore());

  it("200 borra del owner", async () => {
    const create = await POST(postReq(VALID));
    const { watch } = await create.json();
    const res = await DELETE(
      delReq(`?id=${watch.id}&customer_id=${CUSTOMER}`),
    );
    expect(res.status).toBe(200);
  });

  it("404 si owner no coincide", async () => {
    const create = await POST(postReq(VALID));
    const { watch } = await create.json();
    const res = await DELETE(
      delReq(`?id=${watch.id}&customer_id=cs_live_otherY00`),
    );
    expect(res.status).toBe(404);
  });

  it("400 id mal formado", async () => {
    const res = await DELETE(delReq(`?id=hack&customer_id=${CUSTOMER}`));
    expect(res.status).toBe(400);
  });
});
