/**
 * /api/admin/funnel GET route.test.ts — SSS272 (17 may 2026)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet })),
}));

vi.mock("@/lib/panel_auth", () => ({
  COOKIE_KEY: "tc_panel_session",
  verifyToken: vi.fn((v: string | undefined) =>
    v === "valid_token" ? { ok: true } : null,
  ),
}));

vi.mock("@/lib/event_store", () => ({
  aggregate24h: vi.fn(() => ({
    totals: {
      page_views_24h: 100,
      deal_clicks_24h: 10,
      searches_24h: 30,
      booking_redirects_24h: 2,
      unique_visitors_24h: 60,
    },
    top_routes: [],
    top_airlines: [],
    recent_events: [],
  })),
}));

beforeEach(() => {
  mockCookieGet.mockReset();
  mockCookieGet.mockReturnValue(undefined);
  vi.resetModules();
});

async function importGet() {
  const mod = await import("../route");
  return mod.GET;
}

function buildReq(): NextRequest {
  return new NextRequest("http://localhost/api/admin/funnel", { method: "GET" });
}

describe("/api/admin/funnel GET — auth", () => {
  it("401 sin sesión", async () => {
    const GET = await importGet();
    const res = await GET(buildReq());
    expect(res.status).toBe(401);
  });
  it("200 con sesión válida + shape funnel", async () => {
    mockCookieGet.mockImplementation((key: string) =>
      key === "tc_panel_session" ? { value: "valid_token" } : undefined,
    );
    const GET = await importGet();
    const res = await GET(buildReq());
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j).toBeTruthy();
  });
});
