/**
 * /api/admin/vitals GET route.test.ts — SSS271 (17 may 2026)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet })),
}));

vi.mock("@/lib/panel_auth", () => ({
  COOKIE_KEY: "tc_panel_session",
  verifyToken: vi.fn((v: string | undefined) => {
    if (v === "valid_token") return { ok: true };
    return null;
  }),
}));

const mockGetSamples = vi.fn(() => []);
vi.mock("@/lib/vitals_store", () => ({
  getVitalsSamples: () => mockGetSamples(),
}));

beforeEach(() => {
  mockCookieGet.mockReset();
  mockCookieGet.mockReturnValue(undefined);
  mockGetSamples.mockReturnValue([]);
  vi.resetModules();
});

async function importGet() {
  const mod = await import("../route");
  return mod.GET;
}

describe("/api/admin/vitals GET — auth", () => {
  it("401 sin token de sesión", async () => {
    const GET = await importGet();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("401 token inválido", async () => {
    mockCookieGet.mockReturnValue({ value: "wrong_token" });
    const GET = await importGet();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("200 token válido + 0 samples → note presente", async () => {
    mockCookieGet.mockImplementation((key: string) =>
      key === "tc_panel_session" ? { value: "valid_token" } : undefined,
    );
    const GET = await importGet();
    const res = await GET();
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.sample_count).toBe(0);
    expect(j.by_page).toEqual([]);
    expect(j.note).toBeTruthy();
    expect(j.thresholds).toBeTruthy();
  });
});

describe("/api/admin/vitals GET — aggregation", () => {
  beforeEach(() => {
    mockCookieGet.mockImplementation((key: string) =>
      key === "tc_panel_session" ? { value: "valid_token" } : undefined,
    );
  });

  it("p75 calcula correctamente con samples", async () => {
    mockGetSamples.mockReturnValue([
      { page_path: "/", name: "LCP", value: 1000 },
      { page_path: "/", name: "LCP", value: 2000 },
      { page_path: "/", name: "LCP", value: 3000 },
      { page_path: "/", name: "LCP", value: 4000 },
    ] as never);
    const GET = await importGet();
    const res = await GET();
    const j = await res.json();
    expect(j.sample_count).toBe(4);
    expect(j.by_page[0].path).toBe("/");
    expect(j.by_page[0].p75.LCP).toBe(4000);
  });

  it("agrupa por página correctamente", async () => {
    mockGetSamples.mockReturnValue([
      { page_path: "/", name: "LCP", value: 1000 },
      { page_path: "/blog", name: "LCP", value: 2000 },
      { page_path: "/blog", name: "LCP", value: 2500 },
    ] as never);
    const GET = await importGet();
    const res = await GET();
    const j = await res.json();
    expect(j.by_page.length).toBe(2);
    expect(j.sample_count).toBe(3);
  });

  it("thresholds expuestos en response", async () => {
    const GET = await importGet();
    const res = await GET();
    const j = await res.json();
    expect(j.thresholds.LCP.good).toBe(2500);
    expect(j.thresholds.CLS.good).toBe(0.1);
    expect(j.thresholds.INP.good).toBe(200);
  });
});
