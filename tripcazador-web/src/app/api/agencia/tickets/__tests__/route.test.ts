/**
 * /api/agencia/tickets route.test.ts — SSS305
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { createTicket, _clearAgenciaStore } from "@/lib/agencia_store";

function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/agencia/tickets${qs}`);
}

describe("GET /api/agencia/tickets SSS305", () => {
  beforeEach(() => _clearAgenciaStore());

  it("400 email missing", async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(400);
  });

  it("400 email inválido", async () => {
    const res = await GET(getReq("?email=garbage"));
    expect(res.status).toBe(400);
  });

  it("200 vacío sin tickets", async () => {
    const res = await GET(getReq("?email=empty@y.com"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.count).toBe(0);
  });

  it("200 lista tickets del email", async () => {
    await createTicket({ tipo: "vuelo", email: "list@y.com", request: { origin: "BCN" } });
    await createTicket({ tipo: "vuelo_hotel", email: "list@y.com", request: {} });
    const res = await GET(getReq("?email=list@y.com"));
    const data = await res.json();
    expect(data.count).toBe(2);
  });

  it("aislamiento por email", async () => {
    await createTicket({ tipo: "vuelo", email: "alice@y.com", request: {} });
    await createTicket({ tipo: "vuelo", email: "bob@y.com", request: {} });
    const res = await GET(getReq("?email=alice@y.com"));
    const data = await res.json();
    expect(data.count).toBe(1);
  });
});
