/**
 * /api/admin/events-recent GET route.test.ts — SSS272 (17 may 2026)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

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
  mockCookieGet.mockReset();
  mockCookieGet.mockReturnValue(undefined);
  vi.resetModules();
});

async function importGet() {
  const mod = await import("../route");
  return mod.GET;
}

describe("/api/admin/events-recent GET — auth", () => {
  it("401 sin sesión", async () => {
    const GET = await importGet();
    const res = await GET();
    expect(res.status).toBe(401);
  });
  it("200 con sesión válida", async () => {
    mockCookieGet.mockImplementation((key: string) =>
      key === "tc_panel_session" ? { value: "valid_token" } : undefined,
    );
    const GET = await importGet();
    const res = await GET();
    expect(res.status).toBe(200);
  });
});
