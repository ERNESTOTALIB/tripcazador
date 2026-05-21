/**
 * voice_hotline.test.ts — SSS372
 *
 * Tests sin red. Sólo lógica determinística:
 *  - empty_input
 *  - too_long
 *  - canned fallback con detección destino
 *  - canned sin destino (fallback genérico)
 */
import { describe, it, expect } from "vitest";
import { processHotline, generateReplyCanned, fetchDealsForQuery } from "../voice_hotline";

describe("voice_hotline canned reply", () => {
  it("detecta 'Tokio' como destino TYO", () => {
    const r = generateReplyCanned("Quiero ir a Tokio en agosto");
    expect(r.destination).toBe("TYO");
    expect(r.reply_text).toContain("TYO");
  });

  it("detecta 'Nueva York' como NYC", () => {
    const r = generateReplyCanned("Vuelos a Nueva York baratos");
    expect(r.destination).toBe("NYC");
  });

  it("sin destino reconocido, pide más info", () => {
    const r = generateReplyCanned("hola buenas tardes");
    expect(r.destination).toBeUndefined();
    expect(r.reply_text.toLowerCase()).toContain("destino");
  });
});

describe("voice_hotline processHotline", () => {
  it("rechaza empty input", async () => {
    const r = await processHotline({ customer_id: "c1", user_text: "" });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("empty_input");
  });

  it("rechaza too long > 500 chars", async () => {
    const r = await processHotline({
      customer_id: "c1",
      user_text: "x".repeat(501),
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("too_long");
  });

  it("sin env vars, devuelve canned con detected destino", async () => {
    const r = await processHotline({
      customer_id: "c1",
      user_text: "Bali en septiembre",
    });
    expect(r.ok).toBe(true);
    expect(r.used_ai).toBe(false);
    expect(r.reason).toBe("disabled_canned_fallback");
    expect(r.reply_text).toContain("DPS");
  });

  it("sin destino reconocible, devuelve fallback genérico", async () => {
    const r = await processHotline({
      customer_id: "c1",
      user_text: "hola",
    });
    expect(r.ok).toBe(true);
    expect(r.reply_text.toLowerCase()).toContain("destino");
  });
});

describe("fetchDealsForQuery", () => {
  it("sin destino devuelve []", async () => {
    const r = await fetchDealsForQuery({});
    expect(r).toEqual([]);
  });

  it("con destino devuelve stub deal route correcto", async () => {
    const r = await fetchDealsForQuery({ destination: "TYO", origin: "BCN" });
    expect(r.length).toBe(1);
    expect(r[0].route).toBe("BCN-TYO");
  });
});
