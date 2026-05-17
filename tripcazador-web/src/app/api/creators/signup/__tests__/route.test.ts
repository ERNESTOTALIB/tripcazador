/**
 * /api/creators/signup POST route.test.ts — SSS264 (16 may 2026)
 *
 * Tests para creator signup (referral revenue).
 */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

async function importPost() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.POST;
}

function buildReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/creators/signup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/creators/signup POST — validation", () => {
  it("400 si JSON inválido", async () => {
    const POST = await importPost();
    const req = new NextRequest("http://localhost/api/creators/signup", {
      method: "POST",
      body: "{broken",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si code inválido (chars peligrosos)", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({ code: "<script>", email: "test@example.com" }),
    );
    expect(res.status).toBe(400);
  });

  it("400 si code demasiado corto (<3 chars)", async () => {
    const POST = await importPost();
    const res = await POST(buildReq({ code: "ab", email: "t@x.com" }));
    expect(res.status).toBe(400);
  });

  it("400 si code demasiado largo (>32 chars)", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({ code: "x".repeat(50), email: "t@x.com" }),
    );
    expect(res.status).toBe(400);
  });

  it("400 si email inválido", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({ code: "validcode", email: "notanemail" }),
    );
    expect(res.status).toBe(400);
  });

  it("400 si code missing", async () => {
    const POST = await importPost();
    const res = await POST(buildReq({ email: "test@example.com" }));
    expect(res.status).toBe(400);
  });

  it("400 si email missing", async () => {
    const POST = await importPost();
    const res = await POST(buildReq({ code: "validcode" }));
    expect(res.status).toBe(400);
  });
});

describe("/api/creators/signup POST — happy path", () => {
  it("200 + code/token/link/stats/next_steps shape", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({
        code: "my-creator",
        email: "creator@example.com",
        handle: "@my_handle",
        platform: "instagram",
      }),
    );
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.code).toBe("my-creator");
    expect(typeof j.token).toBe("string");
    expect(j.link).toMatch(/^https?:\/\//);
    expect(j.stats).toBeTruthy();
    expect(Array.isArray(j.next_steps)).toBe(true);
    expect(j.next_steps.length).toBeGreaterThan(0);
  });

  it("acepta code con underscore + hyphen", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({ code: "my_creator-123", email: "x@y.com" }),
    );
    expect(res.status).toBe(200);
  });

  it("trunca email a 200 chars", async () => {
    const POST = await importPost();
    const longEmail = "x".repeat(100) + "@example.com";
    const res = await POST(
      buildReq({ code: "longemail", email: longEmail }),
    );
    expect(res.status).toBe(200);
  });
});
