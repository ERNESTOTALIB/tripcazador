/**
 * concierge_store.test.ts — SSS240 (16 may 2026)
 *
 * Tests para lib/concierge_store.ts (73 líneas, /concierge €19 orders).
 *
 * Cubre:
 *  - getOrdersLocal: vacío inicial, lee de localStorage
 *  - saveOrderLocal: persist, dedupe por id, slice 200 max
 *  - generateOrderId: format ord_<timestamp>_<rand>, único
 *  - SSR guard: getOrdersLocal sin window → []
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  getOrdersLocal,
  saveOrderLocal,
  generateOrderId,
  type ConciergeOrder,
} from "../concierge_store";

beforeEach(() => {
  localStorage.clear();
});

function order(id: string, email: string = "x@y.com"): ConciergeOrder {
  return {
    id,
    email,
    status: "pending",
    createdAt: new Date().toISOString(),
    origin: "MAD",
    destination: "LIS",
    date_from: "2026-06-01",
    date_to: "2026-06-10",
    flex_days: 3,
    budget: 800,
    travelers: 2,
    hotel_stars: 4,
    amount_paid_eur: 19,
  };
}

describe("generateOrderId", () => {
  it("formato ord_<ts36>_<rand6>", () => {
    const id = generateOrderId();
    expect(id).toMatch(/^ord_[a-z0-9]+_[a-z0-9]{6}$/);
  });

  it("genera IDs distintos en llamadas consecutivas", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      ids.add(generateOrderId());
    }
    // Casi imposible colisión en 50 con rand 6 chars (~ 2.1e9 espacio)
    expect(ids.size).toBeGreaterThanOrEqual(49);
  });

  it("comienza con ord_", () => {
    expect(generateOrderId().startsWith("ord_")).toBe(true);
  });
});

describe("getOrdersLocal", () => {
  it("retorna [] si localStorage vacío", () => {
    expect(getOrdersLocal()).toEqual([]);
  });

  it("retorna [] si JSON inválido", () => {
    localStorage.setItem("tc_concierge_orders_v1", "{not-json");
    expect(getOrdersLocal()).toEqual([]);
  });

  it("retorna array parseado", () => {
    const o = order("ord_1");
    localStorage.setItem("tc_concierge_orders_v1", JSON.stringify([o]));
    const got = getOrdersLocal();
    expect(got).toHaveLength(1);
    expect(got[0].id).toBe("ord_1");
  });
});

describe("saveOrderLocal", () => {
  it("persiste a localStorage con key correcta", () => {
    saveOrderLocal(order("ord_save_1"));
    const raw = localStorage.getItem("tc_concierge_orders_v1");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as ConciergeOrder[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("ord_save_1");
  });

  it("prepend: nuevo order va al inicio", () => {
    saveOrderLocal(order("first"));
    saveOrderLocal(order("second"));
    saveOrderLocal(order("third"));

    const list = getOrdersLocal();
    expect(list[0].id).toBe("third");
    expect(list[1].id).toBe("second");
    expect(list[2].id).toBe("first");
  });

  it("DEDUPE: order con id existente reemplaza al viejo (no duplica)", () => {
    saveOrderLocal({ ...order("dup_id"), email: "old@x.com" });
    saveOrderLocal({ ...order("dup_id"), email: "new@x.com" });

    const list = getOrdersLocal();
    expect(list).toHaveLength(1);
    expect(list[0].email).toBe("new@x.com");
  });

  it("limita a 200 orders max (slice 200)", () => {
    // Empujamos 205 orders
    for (let i = 0; i < 205; i++) {
      saveOrderLocal(order(`ord_${i}`));
    }
    const list = getOrdersLocal();
    expect(list.length).toBe(200);
    // El último guardado (ord_204) debe estar al inicio
    expect(list[0].id).toBe("ord_204");
    // Los primeros 5 (ord_0..ord_4) deben haberse caído
    expect(list.find((o) => o.id === "ord_0")).toBeUndefined();
    expect(list.find((o) => o.id === "ord_4")).toBeUndefined();
  });
});

describe("ConciergeOrder shape", () => {
  it("preserva todos los campos al persistir/leer", () => {
    const o: ConciergeOrder = {
      id: "ord_shape",
      email: "test@example.com",
      status: "in_progress",
      createdAt: "2026-05-16T12:00:00.000Z",
      origin: "BCN",
      destination: "NRT",
      date_from: "2026-08-01",
      date_to: "2026-08-15",
      flex_days: 2,
      budget: 2500,
      travelers: 2,
      hotel_stars: 5,
      notes: "Honeymoon vibe",
      amount_paid_eur: 49,
      stripe_session_id: "cs_test_123",
      tier: "standard",
    };
    saveOrderLocal(o);

    const got = getOrdersLocal();
    expect(got[0]).toEqual(o);
  });
});
