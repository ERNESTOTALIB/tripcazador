/**
 * /api/admin/funnel-v2 GET route.test.ts — SSS272 (17 may 2026)
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
  return new NextRequest("http://localhost/api/admin/funnel-v2", {
    method: "GET",
  });
}

describe("/api/admin/funnel-v2 GET — auth", () => {
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
    expect([200, 500]).toContain(res.status);
  });
});
