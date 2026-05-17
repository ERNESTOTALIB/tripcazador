/**
 * /api/admin/concierge/tickets GET route.test.ts — SSS272 (17 may 2026)
 * Sync cookies + X-Admin-Token dual auth.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookieGet })),
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

function buildReq(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/admin/concierge/tickets", {
    method: "GET",
    headers,
  });
}

describe("/api/admin/concierge/tickets GET — auth", () => {
  it("401 sin auth", async () => {
    const GET = await importGet();
    const res = await GET(buildReq());
    expect(res.status).toBe(401);
  });

  it("200 con cookie válida", async () => {
    mockCookieGet.mockImplementation((key: string) =>
      key === "tc_panel_session" ? { value: "valid_token" } : undefined,
    );
    const GET = await importGet();
    const res = await GET(buildReq());
    expect(res.status).toBe(200);
  });

  it("401 con X-Admin-Token incorrecto", async () => {
    process.env.ADMIN_TOKEN = "real_token";
    const GET = await importGet();
    const res = await GET(buildReq({ "x-admin-token": "wrong" }));
    expect(res.status).toBe(401);
  });
});
