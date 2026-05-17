/**
 * /api/panel/logout POST route.test.ts — SSS267 (17 may 2026)
 */
import { describe, it, expect, vi } from "vitest";

async function importPost() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.POST;
}

describe("/api/panel/logout POST", () => {
  it("200 + Set-Cookie con Max-Age=0 (clears session)", async () => {
    const POST = await importPost();
    const res = await POST();
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toBeTruthy();
    expect(cookie).toContain("tc_panel_session=");
    expect(cookie).toContain("Max-Age=0");
  });

  it("Set-Cookie mantiene security flags (HttpOnly, Secure, SameSite=Strict)", async () => {
    const POST = await importPost();
    const res = await POST();
    const cookie = res.headers.get("set-cookie") || "";
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
  });

  it("response body { ok: true }", async () => {
    const POST = await importPost();
    const res = await POST();
    const j = await res.json();
    expect(j.ok).toBe(true);
  });
});
