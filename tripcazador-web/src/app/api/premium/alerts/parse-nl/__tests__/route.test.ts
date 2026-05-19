/**
 * /api/premium/alerts/parse-nl route.test.ts — SSS319
 */
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/premium/alerts/parse-nl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/premium/alerts/parse-nl SSS319", () => {
  it("200 parsea input válido", async () => {
    const res = await POST(
      postReq({
        customer_id: "cs_live_user319AAAA",
        text: "vuelos a Tokio bajo 500€ business agosto",
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.parsed.destination).toBe("TYO");
    expect(data.parsed.max_price).toBe(500);
    expect(data.parsed.cabin).toBe("business");
    expect(data.confidence).toBe("high");
  });

  it("400 customer_id inválido", async () => {
    const res = await POST(postReq({ customer_id: "junk", text: "Tokio 500€" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("customer_id_invalid");
  });

  it("400 text requerido", async () => {
    const res = await POST(
      postReq({ customer_id: "cs_live_user319AAAA", text: "" }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("text_required");
  });

  it("400 text demasiado largo", async () => {
    const res = await POST(
      postReq({
        customer_id: "cs_live_user319AAAA",
        text: "x".repeat(600),
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("text_too_long");
  });

  it("400 body no-JSON", async () => {
    const req = new NextRequest(
      "http://localhost/api/premium/alerts/parse-nl",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      },
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("200 con warnings para texto basura", async () => {
    const res = await POST(
      postReq({ customer_id: "cs_live_user319AAAA", text: "hola que tal" }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.warnings).toContain("no_route_detected");
    expect(data.confidence).toBe("low");
  });
});
