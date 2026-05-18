/**
 * DELETE /api/premium/saved-searches/[id] tests — SSS303
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { DELETE } from "../route";
import { createSavedSearch, _clearStore } from "@/lib/saved_searches_store";

function delReq(id: string, customerId?: string): NextRequest {
  const qs = customerId ? `?customer_id=${customerId}` : "";
  return new NextRequest(`http://localhost/api/premium/saved-searches/${id}${qs}`, {
    method: "DELETE",
  });
}

describe("DELETE /api/premium/saved-searches/[id]", () => {
  beforeEach(() => _clearStore());

  it("200 borra propia búsqueda", async () => {
    const s = await createSavedSearch({ customerId: "cs_live_owner99AA", name: "x" });
    const res = await DELETE(delReq(s.id, "cs_live_owner99AA"), { params: { id: s.id } });
    expect(res.status).toBe(200);
  });

  it("400 search_id formato inválido", async () => {
    const res = await DELETE(delReq("garbage", "cs_live_owner99AA"), {
      params: { id: "garbage" },
    });
    expect(res.status).toBe(400);
  });

  it("400 customer_id missing", async () => {
    const res = await DELETE(delReq("ss_abc12345"), { params: { id: "ss_abc12345" } });
    expect(res.status).toBe(400);
  });

  it("403 ownership mismatch", async () => {
    const s = await createSavedSearch({ customerId: "cs_live_owner99AA", name: "x" });
    const res = await DELETE(delReq(s.id, "cs_live_intrudrAA"), { params: { id: s.id } });
    expect(res.status).toBe(403);
  });

  it("403 si no existe (no-leak)", async () => {
    const res = await DELETE(delReq("ss_nonexist", "cs_live_owner99AA"), {
      params: { id: "ss_nonexist" },
    });
    expect(res.status).toBe(403);
  });
});
