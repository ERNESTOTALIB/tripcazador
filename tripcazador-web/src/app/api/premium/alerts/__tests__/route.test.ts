/**
 * /api/premium/alerts route.test.ts — SSS302 (18 may 2026)
 *
 * Tests para POST + GET premium alerts endpoint.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "../route";
import { _clearStore } from "@/lib/price_alerts_store";

function makePostReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/premium/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGetReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/alerts${qs}`);
}

describe("POST /api/premium/alerts SSS302", () => {
  beforeEach(() => _clearStore());

  it("crea alert premium con customerId válido", async () => {
    const res = await POST(
      makePostReq({
        customer_id: "cs_live_abc123XYZ",
        email: "p@y.com",
        max_price: 150,
        origin: "BCN",
        destination: "JFK",
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.tier).toBe("premium");
    expect(data.id).toMatch(/^pa_/);
  });

  it("400 si customer_id falta", async () => {
    const res = await POST(makePostReq({ email: "p@y.com", max_price: 100 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("customer_id_invalid");
  });

  it("400 si customer_id no parece Stripe", async () => {
    const res = await POST(
      makePostReq({
        customer_id: "not_a_stripe_id",
        email: "p@y.com",
        max_price: 100,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("400 si email inválido", async () => {
    const res = await POST(
      makePostReq({
        customer_id: "cs_live_abc12345",
        email: "not-an-email",
        max_price: 100,
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("email_invalid");
  });

  it("400 si max_price negativo o cero", async () => {
    const res = await POST(
      makePostReq({
        customer_id: "cs_live_abc12345",
        email: "p@y.com",
        max_price: 0,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("400 si origin IATA inválido", async () => {
    const res = await POST(
      makePostReq({
        customer_id: "cs_live_abc12345",
        email: "p@y.com",
        max_price: 100,
        origin: "ZZ",
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("origin_invalid");
  });

  it("Premium NO está sujeto al free quota", async () => {
    // Crear 10 alertas Premium en serie
    for (let i = 0; i < 10; i++) {
      const res = await POST(
        makePostReq({
          customer_id: "cs_live_unlimited",
          email: "p@y.com",
          max_price: 100 + i,
        }),
      );
      expect(res.status).toBe(201);
    }
  });

  it("test_id cs_test_ también aceptado (sandbox)", async () => {
    const res = await POST(
      makePostReq({
        customer_id: "cs_test_sandbox123",
        email: "p@y.com",
        max_price: 100,
      }),
    );
    expect(res.status).toBe(201);
  });
});

describe("GET /api/premium/alerts SSS302", () => {
  beforeEach(() => _clearStore());

  it("400 si customer_id missing", async () => {
    const res = await GET(makeGetReq());
    expect(res.status).toBe(400);
  });

  it("400 si customer_id formato inválido", async () => {
    const res = await GET(makeGetReq("?customer_id=garbage"));
    expect(res.status).toBe(400);
  });

  it("200 + array vacío si customer no tiene alerts", async () => {
    const res = await GET(makeGetReq("?customer_id=cs_live_nothing01"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.count).toBe(0);
    expect(data.alerts).toEqual([]);
  });

  it("200 lista alertas del customer", async () => {
    // Primero crear
    await POST(
      makePostReq({
        customer_id: "cs_live_listme01",
        email: "list@y.com",
        max_price: 200,
      }),
    );
    await POST(
      makePostReq({
        customer_id: "cs_live_listme01",
        email: "list@y.com",
        max_price: 300,
        origin: "BCN",
      }),
    );
    const res = await GET(makeGetReq("?customer_id=cs_live_listme01"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.count).toBe(2);
    expect(data.alerts.length).toBe(2);
    expect(data.alerts[0].tier).toBe("premium");
  });

  it("aislamiento de customers: no devuelve alertas de otro", async () => {
    await POST(
      makePostReq({
        customer_id: "cs_live_alice123",
        email: "a@y.com",
        max_price: 100,
      }),
    );
    await POST(
      makePostReq({
        customer_id: "cs_live_bob12345",
        email: "b@y.com",
        max_price: 100,
      }),
    );
    const aliceRes = await GET(makeGetReq("?customer_id=cs_live_alice123"));
    const aliceData = await aliceRes.json();
    expect(aliceData.count).toBe(1);
    expect(aliceData.alerts[0].email).toBe("a@y.com");
  });
});
