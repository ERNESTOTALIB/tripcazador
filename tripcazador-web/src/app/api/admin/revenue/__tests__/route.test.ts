/**
 * /api/admin/revenue GET route.test.ts — SSS271 (17 may 2026)
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

beforeEach(() => {
  for (const k of Object.keys(process.env)) {
    if (k.endsWith("_REVENUE_30D_EUR") || k.endsWith("_REVENUE_7D_EUR") || k.endsWith("_REVENUE_24H_EUR")) {
      delete process.env[k];
    }
  }
  delete process.env.TRAVELPAYOUTS_API_TOKEN;
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
  return new NextRequest("http://localhost/api/admin/revenue", {
    method: "GET",
  });
}

describe("/api/admin/revenue GET — auth", () => {
  it("401 sin sesión", async () => {
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

describe("/api/admin/revenue GET — sources", () => {
  beforeEach(() => {
    mockCookieGet.mockImplementation((key: string) =>
      key === "tc_panel_session" ? { value: "valid_token" } : undefined,
    );
  });

  it("response tiene sources array + totals", async () => {
    const GET = await importGet();
    const res = await GET(buildReq());
    const j = await res.json();
    expect(Array.isArray(j.sources)).toBe(true);
    expect(j.totals).toBeTruthy();
    expect(typeof j.totals.last_24h_eur).toBe("number");
    expect(typeof j.totals.last_7d_eur).toBe("number");
    expect(typeof j.totals.last_30d_eur).toBe("number");
  });

  it("manual env var GYG_REVENUE_30D_EUR alimenta totals", async () => {
    process.env.GYG_REVENUE_30D_EUR = "150";
    const GET = await importGet();
    const res = await GET(buildReq());
    const j = await res.json();
    expect(j.totals.last_30d_eur).toBeGreaterThanOrEqual(150);
    const gyg = j.sources.find((s: { name: string }) =>
      s.name.includes("GetYourGuide"),
    );
    expect(gyg.configured).toBe(true);
    expect(gyg.last_30d_eur).toBe(150);
  });

  it("source no configurada → configured=false con note hint", async () => {
    const GET = await importGet();
    const res = await GET(buildReq());
    const j = await res.json();
    const adsense = j.sources.find((s: { name: string }) =>
      s.name.includes("AdSense"),
    );
    expect(adsense.configured).toBe(false);
    expect(adsense.note).toContain("ADSENSE_REVENUE_30D_EUR");
  });
});
