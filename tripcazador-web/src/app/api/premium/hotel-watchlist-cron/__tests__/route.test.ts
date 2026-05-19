/**
 * /api/premium/hotel-watchlist-cron route.test.ts — SSS323
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { createHotelWatch, _clearStore } from "@/lib/hotel_watchlist_store";

function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/hotel-watchlist-cron${qs}`);
}

describe("GET /api/premium/hotel-watchlist-cron SSS323", () => {
  const ORIG = process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM;
  beforeEach(() => {
    _clearStore();
    process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM = "test_hw_token";
  });
  afterEach(() => {
    if (ORIG === undefined) delete process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM;
    else process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM = ORIG;
    vi.restoreAllMocks();
  });

  it("503 sin token configurado", async () => {
    delete process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM;
    delete process.env.PRICE_ALERT_CRON_TOKEN;
    const res = await GET(getReq("?token=anything"));
    expect(res.status).toBe(503);
  });

  it("401 token incorrecto", async () => {
    const res = await GET(getReq("?token=wrong"));
    expect(res.status).toBe(401);
  });

  it("200 sin watches", async () => {
    const res = await GET(getReq("?token=test_hw_token"));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.watches_active).toBe(0);
    expect(d.checked).toBe(0);
  });

  it("200 procesa watches existentes (checked > 0)", async () => {
    await createHotelWatch({
      customerId: "cus_TEST00000001",
      email: "x@y.com",
      city: "LIS",
      date_in: "2026-08-15",
      date_out: "2026-08-17",
      price_per_night_baseline: 80,
    });
    const res = await GET(getReq("?token=test_hw_token"));
    const d = await res.json();
    expect(d.watches_active).toBe(1);
    expect(d.checked).toBe(1);
  });

  it("flag resend_active=false sin RESEND_PROXY_TOKEN", async () => {
    delete process.env.RESEND_PROXY_TOKEN;
    const res = await GET(getReq("?token=test_hw_token"));
    const d = await res.json();
    expect(d.resend_active).toBe(false);
  });
});
