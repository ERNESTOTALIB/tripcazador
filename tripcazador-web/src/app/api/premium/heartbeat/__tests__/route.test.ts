/**
 * /api/premium/heartbeat route.test.ts — SSS322
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { getLastSeen, _clearStore } from "@/lib/last_seen_store";

const CUSTOMER = "cs_live_user322AAA";

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/premium/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/premium/heartbeat SSS322", () => {
  beforeEach(() => _clearStore());

  it("200 graba last_seen", async () => {
    const before = Date.now();
    const res = await POST(postReq({ customer_id: CUSTOMER }));
    expect(res.status).toBe(200);
    const ts = await getLastSeen(CUSTOMER);
    expect(ts).toBeGreaterThanOrEqual(before);
  });

  it("400 customer_id inválido", async () => {
    const res = await POST(postReq({ customer_id: "junk" }));
    expect(res.status).toBe(400);
  });

  it("400 customer_id missing", async () => {
    const res = await POST(postReq({}));
    expect(res.status).toBe(400);
  });

  it("400 JSON inválido", async () => {
    const req = new NextRequest("http://localhost/api/premium/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
