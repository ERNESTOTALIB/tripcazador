/**
 * /api/premium/percentile route.test.ts — SSS326
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { logSavings, _clearStore } from "@/lib/savings_log_store";

function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/percentile${qs}`);
}

describe("GET /api/premium/percentile SSS326", () => {
  beforeEach(() => _clearStore());

  it("400 customer_id inválido", async () => {
    const res = await GET(getReq("?customer_id=junk"));
    expect(res.status).toBe(400);
  });

  it("200 con customer sin ahorros", async () => {
    const res = await GET(getReq("?customer_id=cus_NEW00000001"));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.my_total_eur).toBe(0);
    // sin entries, total_customers=0
    expect(d.total_customers).toBe(0);
  });

  it("200 con distribución: user mid-tier", async () => {
    // 5 customers con totales 10/20/30/40/50
    const totals = [10, 20, 30, 40, 50];
    for (let i = 0; i < totals.length; i++) {
      await logSavings({
        customerId: `cus_USR${String(i).padStart(8, "0")}`,
        email: `${i}@x.com`,
        deal_id: `d_${i}`,
        savings_eur: totals[i],
        source: "alert",
      });
    }
    // user con 30€ → percentile mid
    const res = await GET(getReq("?customer_id=cus_USR00000002"));
    const d = await res.json();
    expect(d.my_total_eur).toBe(30);
    expect(d.total_customers).toBe(5);
    expect(d.percentile).toBeGreaterThan(0);
    expect(d.percentile).toBeLessThan(100);
  });

  it("label menciona percentile cuando >=5 customers", async () => {
    const totals = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    for (let i = 0; i < totals.length; i++) {
      await logSavings({
        customerId: `cus_USR${String(i).padStart(8, "0")}`,
        email: `${i}@x.com`,
        deal_id: `d_${i}`,
        savings_eur: totals[i],
        source: "alert",
      });
    }
    const res = await GET(getReq("?customer_id=cus_USR00000009"));
    const d = await res.json();
    expect(d.label.length).toBeGreaterThan(10);
    expect(d.percentile).toBeGreaterThan(50);
  });

  it("privacy: response NO incluye customer ids ni totales individuales", async () => {
    await logSavings({
      customerId: "cus_USR00000001",
      email: "1@x.com",
      deal_id: "d_1",
      savings_eur: 100,
      source: "alert",
    });
    const res = await GET(getReq("?customer_id=cus_USR00000001"));
    const d = await res.json();
    expect(d.customer_id).toBeUndefined();
    expect(d.totals).toBeUndefined();
    expect(d.all_savings).toBeUndefined();
  });
});
