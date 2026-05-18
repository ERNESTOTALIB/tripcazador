/**
 * /api/premium/alerts/[id] route.test.ts — SSS302
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { DELETE } from "../route";
import { createAlert, _clearStore } from "@/lib/price_alerts_store";

function delReq(id: string, customerId?: string): NextRequest {
  const qs = customerId ? `?customer_id=${customerId}` : "";
  return new NextRequest(`http://localhost/api/premium/alerts/${id}${qs}`, {
    method: "DELETE",
  });
}

describe("DELETE /api/premium/alerts/[id] SSS302", () => {
  beforeEach(() => _clearStore());

  it("borra OK con customerId match", async () => {
    const a = await createAlert({
      email: "x@y.com",
      max_price: 100,
      tier: "premium",
      customerId: "cs_live_owner001",
    });
    const res = await DELETE(delReq(a.id, "cs_live_owner001"), {
      params: { id: a.id },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it("400 si alert_id formato inválido", async () => {
    const res = await DELETE(delReq("garbage_id", "cs_live_owner001"), {
      params: { id: "garbage_id" },
    });
    expect(res.status).toBe(400);
  });

  it("400 si customer_id missing", async () => {
    const res = await DELETE(delReq("pa_abc12345"), {
      params: { id: "pa_abc12345" },
    });
    expect(res.status).toBe(400);
  });

  it("400 si customer_id formato inválido", async () => {
    const res = await DELETE(delReq("pa_abc12345", "garbage"), {
      params: { id: "pa_abc12345" },
    });
    expect(res.status).toBe(400);
  });

  it("403 si customer_id no matchea ownership", async () => {
    const a = await createAlert({
      email: "x@y.com",
      max_price: 100,
      tier: "premium",
      customerId: "cs_live_owner001",
    });
    const res = await DELETE(delReq(a.id, "cs_live_intruder99"), {
      params: { id: a.id },
    });
    expect(res.status).toBe(403);
  });

  it("403 si alert no existe", async () => {
    const res = await DELETE(delReq("pa_doesnotexist", "cs_live_owner001"), {
      params: { id: "pa_doesnotexist" },
    });
    expect(res.status).toBe(403);
  });
});
