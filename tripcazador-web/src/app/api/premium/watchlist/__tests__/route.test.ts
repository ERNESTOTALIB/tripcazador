/**
 * /api/premium/watchlist route.test.ts — SSS314
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET, DELETE } from "../route";
import { _clearStore } from "@/lib/watchlist_store";

const OK_CUSTOMER = "cs_live_user314AAA";

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/premium/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/watchlist${qs}`);
}
function delReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/watchlist${qs}`, {
    method: "DELETE",
  });
}

const VALID_BODY = {
  customer_id: OK_CUSTOMER,
  email: "x@y.com",
  deal_id: "deal_abc",
  origin: "BCN",
  destination: "JFK",
  price_when_added: 400,
};

describe("POST /api/premium/watchlist SSS314", () => {
  beforeEach(() => _clearStore());

  it("201 crea watch válido con defaults", async () => {
    const res = await POST(postReq(VALID_BODY));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.watch.id).toMatch(/^wl_/);
    expect(data.watch.target_drop_pct).toBe(10);
  });

  it("400 customer_id inválido", async () => {
    const res = await POST(postReq({ ...VALID_BODY, customer_id: "junk" }));
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.error).toBe("customer_id_invalid");
  });

  it("400 email inválido", async () => {
    const res = await POST(postReq({ ...VALID_BODY, email: "noatsign" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("email_invalid");
  });

  it("400 deal_id inválido (caracteres raros)", async () => {
    const res = await POST(postReq({ ...VALID_BODY, deal_id: "deal with spaces!" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("deal_id_invalid");
  });

  it("400 origin/destination no IATA", async () => {
    const res = await POST(postReq({ ...VALID_BODY, origin: "XX" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("iata_invalid");
  });

  it("400 price <= 0", async () => {
    const res = await POST(postReq({ ...VALID_BODY, price_when_added: 0 }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("price_invalid");
  });

  it("400 target_drop_pct fuera de rango", async () => {
    const r1 = await POST(postReq({ ...VALID_BODY, target_drop_pct: 1 }));
    expect(r1.status).toBe(400);
    const r2 = await POST(postReq({ ...VALID_BODY, target_drop_pct: 99 }));
    expect(r2.status).toBe(400);
  });

  it("acepta target_drop_pct válido (5-50)", async () => {
    const res = await POST(postReq({ ...VALID_BODY, target_drop_pct: 25 }));
    expect(res.status).toBe(201);
    expect((await res.json()).watch.target_drop_pct).toBe(25);
  });

  it("dedupe: misma deal_id → mismo wl_id", async () => {
    const a = await POST(postReq(VALID_BODY));
    const b = await POST(postReq(VALID_BODY));
    const da = await a.json();
    const db = await b.json();
    expect(da.watch.id).toBe(db.watch.id);
  });

  it("400 body no-JSON", async () => {
    const req = new NextRequest("http://localhost/api/premium/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/premium/watchlist SSS314", () => {
  beforeEach(() => _clearStore());

  it("200 lista watches del customer ordenados", async () => {
    await POST(postReq({ ...VALID_BODY, deal_id: "deal_1" }));
    await new Promise((r) => setTimeout(r, 2));
    await POST(postReq({ ...VALID_BODY, deal_id: "deal_2" }));
    const res = await GET(
      getReq(`?customer_id=${encodeURIComponent(OK_CUSTOMER)}`),
    );
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.watches.length).toBe(2);
    // Ordenado más reciente primero
    expect(d.watches[0].deal_id).toBe("deal_2");
  });

  it("400 customer_id inválido", async () => {
    const res = await GET(getReq("?customer_id=junk"));
    expect(res.status).toBe(400);
  });

  it("200 lista vacía si customer no tiene watches", async () => {
    const res = await GET(
      getReq(`?customer_id=cs_live_other999AA`),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).watches).toEqual([]);
  });
});

describe("DELETE /api/premium/watchlist SSS314", () => {
  beforeEach(() => _clearStore());

  it("200 borra watch del customer dueño", async () => {
    const create = await POST(postReq(VALID_BODY));
    const { watch } = await create.json();
    const res = await DELETE(
      delReq(
        `?id=${encodeURIComponent(watch.id)}&customer_id=${encodeURIComponent(OK_CUSTOMER)}`,
      ),
    );
    expect(res.status).toBe(200);
  });

  it("404 no encontrado o forbidden si customer no es dueño", async () => {
    const create = await POST(postReq(VALID_BODY));
    const { watch } = await create.json();
    const res = await DELETE(
      delReq(
        `?id=${encodeURIComponent(watch.id)}&customer_id=cs_live_attacker99`,
      ),
    );
    expect(res.status).toBe(404);
  });

  it("400 id inválido", async () => {
    const res = await DELETE(
      delReq(`?id=hacker&customer_id=${encodeURIComponent(OK_CUSTOMER)}`),
    );
    expect(res.status).toBe(400);
  });
});
