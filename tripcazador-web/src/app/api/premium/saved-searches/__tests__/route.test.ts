/**
 * /api/premium/saved-searches route.test.ts — SSS303
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "../route";
import { _clearStore } from "@/lib/saved_searches_store";

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/premium/saved-searches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/saved-searches${qs}`);
}

describe("POST /api/premium/saved-searches SSS303", () => {
  beforeEach(() => _clearStore());

  it("201 crea búsqueda válida", async () => {
    const res = await POST(
      postReq({
        customer_id: "cs_live_user001AA",
        name: "Tokio business",
        airlines: ["JL", "NH"],
        cabin: "business",
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.id).toMatch(/^ss_/);
  });

  it("400 customer_id inválido", async () => {
    const res = await POST(postReq({ customer_id: "garbage", name: "x" }));
    expect(res.status).toBe(400);
  });

  it("400 name vacío", async () => {
    const res = await POST(postReq({ customer_id: "cs_live_user001AA", name: "  " }));
    expect(res.status).toBe(400);
  });

  it("400 name demasiado largo", async () => {
    const res = await POST(
      postReq({ customer_id: "cs_live_user001AA", name: "x".repeat(200) }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("name_too_long");
  });

  it("400 origin no IATA", async () => {
    const res = await POST(
      postReq({ customer_id: "cs_live_user001AA", name: "x", origin: "ZZ" }),
    );
    expect(res.status).toBe(400);
  });

  it("airlines garbage filtradas", async () => {
    const res = await POST(
      postReq({
        customer_id: "cs_live_user001AA",
        name: "x",
        airlines: ["FR", "IB", "longstring", "***", "BB"],
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    // "longstring" excede 3 chars, "***" no es alfanum
    expect(data.search.airlines).toEqual(["FR", "IB", "BB"]);
  });

  it("max_price out-of-range ignorado", async () => {
    const res = await POST(
      postReq({ customer_id: "cs_live_user001AA", name: "x", max_price: 999999 }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.search.max_price).toBeUndefined();
  });

  it("cabin/stops/timeBand inválidos → default 'any'", async () => {
    const res = await POST(
      postReq({
        customer_id: "cs_live_user001AA",
        name: "x",
        cabin: "garbage",
        stops: "10",
        timeBand: "midnight",
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.search.cabin).toBe("any");
    expect(data.search.stops).toBe("any");
    expect(data.search.timeBand).toBe("any");
  });
});

describe("GET /api/premium/saved-searches SSS303", () => {
  beforeEach(() => _clearStore());

  it("400 customer_id missing", async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(400);
  });

  it("200 array vacío", async () => {
    const res = await GET(getReq("?customer_id=cs_live_empty01AA"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.count).toBe(0);
  });

  it("200 lista propias búsquedas", async () => {
    await POST(postReq({ customer_id: "cs_live_user99AA", name: "A" }));
    await POST(postReq({ customer_id: "cs_live_user99AA", name: "B" }));
    const res = await GET(getReq("?customer_id=cs_live_user99AA"));
    const data = await res.json();
    expect(data.count).toBe(2);
  });

  it("aislamiento por customer", async () => {
    await POST(postReq({ customer_id: "cs_live_alice99AA", name: "A" }));
    await POST(postReq({ customer_id: "cs_live_bob9999AA", name: "B" }));
    const res = await GET(getReq("?customer_id=cs_live_alice99AA"));
    const data = await res.json();
    expect(data.count).toBe(1);
  });
});
