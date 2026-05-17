/**
 * /api/push/subscribe POST route.test.ts — SSS264 (16 may 2026)
 *
 * Tests para endpoint web-push subscription forwarding.
 */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

async function importPost() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.POST;
}

function buildReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/push/subscribe POST", () => {
  it("400 si JSON inválido", async () => {
    const POST = await importPost();
    const req = new NextRequest("http://localhost/api/push/subscribe", {
      method: "POST",
      body: "{broken",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si subscription missing", async () => {
    const POST = await importPost();
    const req = buildReq({ foo: "bar" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("missing_subscription");
  });

  it("202 + ok con subscription válida", async () => {
    const POST = await importPost();
    const req = buildReq({
      subscription: {
        endpoint: "https://fcm.googleapis.com/fcm/send/abc",
        keys: { p256dh: "key", auth: "auth" },
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(202);
    expect((await res.json()).ok).toBe(true);
  });

  it("acepta payload con subscription en cualquier shape", async () => {
    const POST = await importPost();
    const req = buildReq({
      subscription: { endpoint: "https://test.example/push" },
      tags: ["mad-deals"],
    });
    const res = await POST(req);
    expect(res.status).toBe(202);
  });
});
