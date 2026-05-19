/**
 * /api/premium/roi route.test.ts — SSS315
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { logSavings, _clearStore } from "@/lib/savings_log_store";

const CUSTOMER = "cs_live_user315AAA";

function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/roi${qs}`);
}

describe("GET /api/premium/roi SSS315", () => {
  beforeEach(() => _clearStore());

  it("400 customer_id inválido", async () => {
    const res = await GET(getReq("?customer_id=junk"));
    expect(res.status).toBe(400);
  });

  it("200 vacío para customer sin savings", async () => {
    const res = await GET(getReq(`?customer_id=${encodeURIComponent(CUSTOMER)}`));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.summary.total_eur).toBe(0);
    expect(d.summary.count).toBe(0);
    expect(d.recent).toEqual([]);
  });

  it("200 suma savings del customer + filtra otros customers", async () => {
    await logSavings({
      customerId: CUSTOMER,
      email: "x@y.com",
      deal_id: "d_1",
      origin: "BCN",
      destination: "JFK",
      savings_eur: 87.5,
      source: "alert",
    });
    await logSavings({
      customerId: CUSTOMER,
      email: "x@y.com",
      deal_id: "d_2",
      origin: "BCN",
      destination: "LAX",
      savings_eur: 120,
      source: "watch",
    });
    // Otro customer — no debe aparecer
    await logSavings({
      customerId: "cs_live_OTHER000001",
      email: "z@y.com",
      deal_id: "d_3",
      savings_eur: 999,
      source: "alert",
    });

    const res = await GET(getReq(`?customer_id=${encodeURIComponent(CUSTOMER)}`));
    const d = await res.json();
    expect(d.summary.total_eur).toBe(207.5);
    expect(d.summary.count).toBe(2);
    expect(d.summary.by_source.alert).toBe(87.5);
    expect(d.summary.by_source.watch).toBe(120);
    expect(d.recent.length).toBe(2);
  });

  it("recent solo trae 10 más recientes", async () => {
    for (let i = 0; i < 15; i++) {
      await logSavings({
        customerId: CUSTOMER,
        email: "x@y.com",
        deal_id: `d_${i}`,
        savings_eur: 10 + i,
        source: "alert",
      });
    }
    const res = await GET(getReq(`?customer_id=${encodeURIComponent(CUSTOMER)}`));
    const d = await res.json();
    expect(d.summary.count).toBe(15);
    expect(d.recent.length).toBe(10);
  });
});
