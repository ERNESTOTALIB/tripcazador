/**
 * agencia_store.test.ts — SSS305
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createTicket,
  listTicketsByEmail,
  getTicket,
  markRefunded,
  markDelivered,
  AGENCIA_PRICES,
  AGENCIA_GUARANTEE_DAYS,
  _clearAgenciaStore,
} from "../agencia_store";

describe("agencia_store SSS305", () => {
  beforeEach(() => _clearAgenciaStore());

  it("AGENCIA_PRICES vuelo=9.99 vuelo_hotel=19.99", () => {
    expect(AGENCIA_PRICES.vuelo).toBe(9.99);
    expect(AGENCIA_PRICES.vuelo_hotel).toBe(19.99);
  });

  it("AGENCIA_GUARANTEE_DAYS = 7", () => {
    expect(AGENCIA_GUARANTEE_DAYS).toBe(7);
  });

  it("crea ticket vuelo con amount 9.99", async () => {
    const t = await createTicket({
      tipo: "vuelo",
      email: "x@y.com",
      request: { origin: "BCN", destination: "JFK" },
    });
    expect(t.id).toMatch(/^agt_/);
    expect(t.amount_eur).toBe(9.99);
    expect(t.tipo).toBe("vuelo");
    expect(t.status).toBe("paid");
  });

  it("crea ticket vuelo_hotel con amount 19.99", async () => {
    const t = await createTicket({
      tipo: "vuelo_hotel",
      email: "x@y.com",
      request: {},
    });
    expect(t.amount_eur).toBe(19.99);
  });

  it("normaliza email lowercase", async () => {
    const t = await createTicket({
      tipo: "vuelo",
      email: "MIxedCase@Y.com",
      request: {},
    });
    expect(t.email).toBe("mixedcase@y.com");
  });

  it("listTicketsByEmail filtra + sort desc", async () => {
    await createTicket({ tipo: "vuelo", email: "a@y.com", request: {} });
    await new Promise((r) => setTimeout(r, 5));
    const t2 = await createTicket({ tipo: "vuelo", email: "a@y.com", request: {} });
    await createTicket({ tipo: "vuelo", email: "b@y.com", request: {} });
    const list = await listTicketsByEmail("a@y.com");
    expect(list.length).toBe(2);
    expect(list[0].id).toBe(t2.id);
  });

  it("listTicketsByEmail case-insensitive", async () => {
    await createTicket({ tipo: "vuelo", email: "Foo@Y.com", request: {} });
    expect((await listTicketsByEmail("FOO@y.com")).length).toBe(1);
  });

  it("getTicket devuelve null si no existe", async () => {
    expect(await getTicket("agt_nope")).toBeNull();
  });

  it("markRefunded cambia status + agrega proof_url", async () => {
    const t = await createTicket({ tipo: "vuelo", email: "x@y.com", request: {} });
    const ok = await markRefunded(t.id, "https://skyscanner.com/proof");
    expect(ok).toBe(true);
    const after = await getTicket(t.id);
    expect(after?.status).toBe("refunded");
    expect(after?.refund_proof_url).toBe("https://skyscanner.com/proof");
    expect(after?.refunded_at).toBeDefined();
  });

  it("markDelivered cambia status + delivered_at", async () => {
    const t = await createTicket({ tipo: "vuelo", email: "x@y.com", request: {} });
    expect(await markDelivered(t.id)).toBe(true);
    const after = await getTicket(t.id);
    expect(after?.status).toBe("delivered");
    expect(after?.delivered_at).toBeDefined();
  });

  it("markRefunded/markDelivered devuelven false si ticket no existe", async () => {
    expect(await markRefunded("agt_nope")).toBe(false);
    expect(await markDelivered("agt_nope")).toBe(false);
  });
});
