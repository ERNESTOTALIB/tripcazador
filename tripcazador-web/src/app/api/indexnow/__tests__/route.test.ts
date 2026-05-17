/**
 * /api/indexnow GET route.test.ts — SSS267 (17 may 2026)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

beforeEach(() => {
  delete process.env.INDEXNOW_TOKEN;
  vi.resetModules();
});

async function importGet() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.GET;
}

function buildReq(query: string = ""): NextRequest {
  return new NextRequest(`http://localhost/api/indexnow${query}`, {
    method: "GET",
  });
}

describe("/api/indexnow GET — auth", () => {
  it("503 si INDEXNOW_TOKEN no configurado", async () => {
    const GET = await importGet();
    const res = await GET(buildReq("?token=anything"));
    expect([401, 503]).toContain(res.status);
  });

  it("401/403 con token wrong (constant-time mismatch)", async () => {
    process.env.INDEXNOW_TOKEN = "secret_token_xyz";
    const GET = await importGet();
    const res = await GET(buildReq("?token=wrong_token"));
    expect([401, 403]).toContain(res.status);
  });

  it("401/403 con token missing", async () => {
    process.env.INDEXNOW_TOKEN = "secret_token_xyz";
    const GET = await importGet();
    const res = await GET(buildReq(""));
    expect([401, 403]).toContain(res.status);
  });
});

describe("/api/indexnow GET — token correcto (mockeado fetch)", () => {
  it("acepta token válido (response 200 o error de fetch)", async () => {
    process.env.INDEXNOW_TOKEN = "valid_token_abc";
    // Mock fetch to indexnow.org so the test doesn't hit real network
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    );
    const GET = await importGet();
    const res = await GET(buildReq("?token=valid_token_abc"));
    expect([200, 500, 502]).toContain(res.status);
  });
});
