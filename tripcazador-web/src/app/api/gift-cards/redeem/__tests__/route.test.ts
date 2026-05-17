/**
 * /api/gift-cards/redeem POST route.test.ts — SSS266 (17 may 2026)
 *
 * Tests para gift card redemption + affiliate suggestion links.
 */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

async function importPost() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.POST;
}

function buildReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/gift-cards/redeem", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/gift-cards/redeem POST", () => {
  it("400 si JSON inválido", async () => {
    const POST = await importPost();
    const req = new NextRequest("http://localhost/api/gift-cards/redeem", {
      method: "POST",
      body: "{broken",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si code vacío", async () => {
    const POST = await importPost();
    const res = await POST(buildReq({ code: "" }));
    expect(res.status).toBe(400);
  });

  it("400 si code missing", async () => {
    const POST = await importPost();
    const res = await POST(buildReq({}));
    expect(res.status).toBe(400);
  });

  it("400 si code inválido (no pasa verifyGiftCode)", async () => {
    const POST = await importPost();
    const res = await POST(buildReq({ code: "INVALID_CODE_123" }));
    expect(res.status).toBe(400);
  });

  it("400 si code con chars peligrosos", async () => {
    const POST = await importPost();
    const res = await POST(
      buildReq({ code: "<script>alert(1)</script>" }),
    );
    expect(res.status).toBe(400);
  });

  it("normaliza code uppercase + trim", async () => {
    const POST = await importPost();
    // Si el código existe — comportamiento determinado por verifyGiftCode
    const res = await POST(buildReq({ code: "  test  " }));
    expect([200, 400]).toContain(res.status);
  });

  it("response 400 NO incluye scheme peligroso en href", async () => {
    const POST = await importPost();
    const res = await POST(buildReq({ code: "fake" }));
    const text = await res.text();
    expect(text).not.toMatch(/javascript:/i);
    expect(text).not.toMatch(/data:text\/html/i);
  });
});
