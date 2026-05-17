/**
 * /api/admin/analytics GET route.test.ts — SSS271 (17 may 2026)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookieGet })),
}));

vi.mock("@/lib/panel_auth", () => ({
  COOKIE_KEY: "tc_panel_session",
  verifyToken: vi.fn((v: string | undefined) => {
    if (v === "valid_token") return { ok: true };
    return null;
  }),
}));

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
}));

beforeEach(() => {
  delete process.env.ADMIN_TOKEN;
  delete process.env.NEXT_PUBLIC_API_URL;
  mockCookieGet.mockReset();
  mockCookieGet.mockReturnValue(undefined);
  vi.resetModules();
  global.fetch = vi.fn(() =>
    Promise.resolve(new Response("{}", { status: 500 })),
  ) as unknown as typeof fetch;
});

async function importGet() {
  const mod = await import("../route");
  return mod.GET;
}

function buildReq(): NextRequest {
  return new NextRequest("http://localhost/api/admin/analytics", {
    method: "GET",
  });
}

describe("/api/admin/analytics GET — auth", () => {
  it("401 sin sesión", async () => {
    const GET = await importGet();
    const res = await GET(buildReq());
    expect(res.status).toBe(401);
  });

  it("401 token inválido", async () => {
    mockCookieGet.mockReturnValue({ value: "wrong" });
    const GET = await importGet();
    const res = await GET(buildReq());
    expect(res.status).toBe(401);
  });

  it("200 con sesión válida", async () => {
    mockCookieGet.mockImplementation((key: string) =>
      key === "tc_panel_session" ? { value: "valid_token" } : undefined,
    );
    const GET = await importGet();
    const res = await GET(buildReq());
    expect(res.status).toBe(200);
  });
});

describe("/api/admin/analytics GET — shape", () => {
  beforeEach(() => {
    mockCookieGet.mockImplementation((key: string) =>
      key === "tc_panel_session" ? { value: "valid_token" } : undefined,
    );
  });

  it("response shape correcto", async () => {
    const GET = await importGet();
    const res = await GET(buildReq());
    const j = await res.json();
    expect(j.totals).toBeTruthy();
    expect(typeof j.totals.page_views_24h).toBe("number");
    expect(typeof j.totals.unique_visitors_24h).toBe("number");
    expect(j.conversion).toBeTruthy();
    expect(typeof j.conversion.click_through_rate).toBe("number");
    expect(j.source).toMatch(/memory|remote|merged/);
  });

  it("conversion rates calculated", async () => {
    const GET = await importGet();
    const res = await GET(buildReq());
    const j = await res.json();
    // CTR = deal_click/page_view = 5/100 = 0.05
    expect(j.conversion.click_through_rate).toBeGreaterThanOrEqual(0);
    expect(j.conversion.click_through_rate).toBeLessThanOrEqual(1);
  });
});
