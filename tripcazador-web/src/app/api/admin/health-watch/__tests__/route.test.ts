/**
 * /api/admin/health-watch GET route.test.ts — SSS272 (17 may 2026)
 * Uses HEALTH_WATCH_KEY query param auth (no cookies).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/event_store", () => ({
  aggregate24h: vi.fn(() => ({
    totals: {
      page_views_24h: 100,
      deal_clicks_24h: 5,
      searches_24h: 20,
      booking_redirects_24h: 1,
      unique_visitors_24h: 50,
    },
    top_routes: [],
    top_airlines: [],
    recent_events: [],
  })),
  getRecentEvents: vi.fn(() => []),
}));

beforeEach(() => {
  delete process.env.HEALTH_WATCH_KEY;
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID_ADMIN;
  vi.resetModules();
  global.fetch = vi.fn(() =>
    Promise.resolve(new Response("{}", { status: 500 })),
  ) as unknown as typeof fetch;
});

async function importGet() {
  const mod = await import("../route");
  return mod.GET;
}

function buildReq(qs: string = ""): NextRequest {
  return new NextRequest(`http://localhost/api/admin/health-watch${qs}`, {
    method: "GET",
  });
}

describe("/api/admin/health-watch GET — auth", () => {
  it("200 si HEALTH_WATCH_KEY no configurado (open access for cron)", async () => {
    const GET = await importGet();
    const res = await GET(buildReq());
    expect(res.status).toBe(200);
  });

  it("401 si HEALTH_WATCH_KEY set y query key wrong", async () => {
    process.env.HEALTH_WATCH_KEY = "secret_key";
    const GET = await importGet();
    const res = await GET(buildReq("?key=wrong"));
    expect(res.status).toBe(401);
  });

  it("200 si HEALTH_WATCH_KEY set y query key correcto", async () => {
    process.env.HEALTH_WATCH_KEY = "secret_key";
    const GET = await importGet();
    const res = await GET(buildReq("?key=secret_key"));
    expect(res.status).toBe(200);
  });
});

describe("/api/admin/health-watch GET — shape", () => {
  it("response tiene checked_at + alerts + snapshot", async () => {
    const GET = await importGet();
    const res = await GET(buildReq());
    const j = await res.json();
    expect(j.checked_at).toBeTruthy();
    expect(Array.isArray(j.alerts)).toBe(true);
    expect(typeof j.notified_telegram).toBe("boolean");
    expect(j.snapshot).toBeTruthy();
  });
});
