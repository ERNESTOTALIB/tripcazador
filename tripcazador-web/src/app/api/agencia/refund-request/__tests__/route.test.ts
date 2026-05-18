/**
 * /api/agencia/refund-request route.test.ts — SSS305
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { createTicket, _clearAgenciaStore, markRefunded } from "@/lib/agencia_store";

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/agencia/refund-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/agencia/refund-request SSS305", () => {
  beforeEach(() => _clearAgenciaStore());

  it("200 refund válido", async () => {
    const t = await createTicket({ tipo: "vuelo", email: "x@y.com", request: {} });
    const res = await POST(postReq({
      ticket_id: t.id,
      email: "x@y.com",
      proof_url: "https://skyscanner.com/proof",
    }));
    expect(res.status).toBe(200);
  });

  it("400 ticket_id formato inválido", async () => {
    const res = await POST(postReq({
      ticket_id: "garbage",
      email: "x@y.com",
      proof_url: "https://skyscanner.com",
    }));
    expect(res.status).toBe(400);
  });

  it("400 email inválido", async () => {
    const res = await POST(postReq({
      ticket_id: "agt_validId12",
      email: "not-email",
      proof_url: "https://skyscanner.com",
    }));
    expect(res.status).toBe(400);
  });

  it("400 proof_url no https/http", async () => {
    const res = await POST(postReq({
      ticket_id: "agt_validId12",
      email: "x@y.com",
      proof_url: "javascript:alert(1)",
    }));
    expect(res.status).toBe(400);
  });

  it("404 si ticket no existe", async () => {
    const res = await POST(postReq({
      ticket_id: "agt_doesNotExist",
      email: "x@y.com",
      proof_url: "https://skyscanner.com",
    }));
    expect(res.status).toBe(404);
  });

  it("403 si email mismatch", async () => {
    const t = await createTicket({ tipo: "vuelo", email: "owner@y.com", request: {} });
    const res = await POST(postReq({
      ticket_id: t.id,
      email: "intruder@y.com",
      proof_url: "https://skyscanner.com",
    }));
    expect(res.status).toBe(403);
  });

  it("409 si ya refunded", async () => {
    const t = await createTicket({ tipo: "vuelo", email: "x@y.com", request: {} });
    await markRefunded(t.id);
    const res = await POST(postReq({
      ticket_id: t.id,
      email: "x@y.com",
      proof_url: "https://skyscanner.com",
    }));
    expect(res.status).toBe(409);
  });
});
