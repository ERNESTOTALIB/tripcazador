/**
 * secret_deals.test.ts — SSS318 (19 may 2026)
 */
import { describe, it, expect } from "vitest";
import {
  isSecretDeal,
  filterOutSecret,
  pickSecretDeals,
  secretTtlMs,
  SECRET_WINDOW_MS,
} from "../secret_deals";

const NOW = new Date("2026-05-19T12:00:00Z").getTime();

function isoMinusH(h: number): string {
  return new Date(NOW - h * 3_600_000).toISOString();
}

describe("isSecretDeal SSS318", () => {
  it("true para CRÍTICO encontrado hace 1h", () => {
    expect(
      isSecretDeal({ classification: "CRÍTICO", found_at: isoMinusH(1) }, NOW),
    ).toBe(true);
  });

  it("true para ERROR encontrado hace 23h59min", () => {
    const tFound = NOW - SECRET_WINDOW_MS + 60_000;
    expect(
      isSecretDeal(
        { classification: "ERROR", found_at: new Date(tFound).toISOString() },
        NOW,
      ),
    ).toBe(true);
  });

  it("false para CRÍTICO encontrado hace 25h (fuera de ventana)", () => {
    expect(
      isSecretDeal({ classification: "CRÍTICO", found_at: isoMinusH(25) }, NOW),
    ).toBe(false);
  });

  it("false para OFERTA reciente (clasificación no secret)", () => {
    expect(
      isSecretDeal({ classification: "OFERTA", found_at: isoMinusH(1) }, NOW),
    ).toBe(false);
  });

  it("false para ANOMALÍA reciente (no es CRÍTICO/ERROR)", () => {
    expect(
      isSecretDeal({ classification: "ANOMALÍA", found_at: isoMinusH(2) }, NOW),
    ).toBe(false);
  });

  it("false si found_at falta (ante duda no esconde)", () => {
    expect(isSecretDeal({ classification: "CRÍTICO" }, NOW)).toBe(false);
  });

  it("false si found_at es inválida", () => {
    expect(
      isSecretDeal({ classification: "CRÍTICO", found_at: "not-a-date" }, NOW),
    ).toBe(false);
  });

  it("false si classification falta", () => {
    expect(isSecretDeal({ found_at: isoMinusH(1) }, NOW)).toBe(false);
  });

  it("false si found_at está en el futuro (sanity)", () => {
    expect(
      isSecretDeal(
        { classification: "CRÍTICO", found_at: new Date(NOW + 3_600_000).toISOString() },
        NOW,
      ),
    ).toBe(false);
  });
});

describe("filterOutSecret + pickSecretDeals SSS318", () => {
  const deals = [
    { id: "a", classification: "CRÍTICO", found_at: isoMinusH(2) }, // secret
    { id: "b", classification: "CRÍTICO", found_at: isoMinusH(30) }, // public ya
    { id: "c", classification: "OFERTA", found_at: isoMinusH(1) }, // never secret
    { id: "d", classification: "ERROR", found_at: isoMinusH(12) }, // secret
    { id: "e", classification: "OFERTA" }, // no found_at, public
  ];

  it("filterOutSecret elimina deals dentro de ventana", () => {
    const r = filterOutSecret(deals, NOW);
    expect(r.map((d) => d.id).sort()).toEqual(["b", "c", "e"]);
  });

  it("pickSecretDeals devuelve solo los dentro de ventana", () => {
    const r = pickSecretDeals(deals, NOW);
    expect(r.map((d) => d.id).sort()).toEqual(["a", "d"]);
  });

  it("filterOutSecret + pickSecretDeals son complementarios", () => {
    const a = filterOutSecret(deals, NOW);
    const b = pickSecretDeals(deals, NOW);
    expect(a.length + b.length).toBe(deals.length);
  });
});

describe("secretTtlMs SSS318", () => {
  it("0 si no es secret", () => {
    expect(
      secretTtlMs({ classification: "OFERTA", found_at: isoMinusH(1) }, NOW),
    ).toBe(0);
  });

  it("~22h restantes para deal encontrado hace 2h", () => {
    const ttl = secretTtlMs(
      { classification: "CRÍTICO", found_at: isoMinusH(2) },
      NOW,
    );
    expect(ttl).toBeGreaterThan(21 * 3_600_000);
    expect(ttl).toBeLessThan(23 * 3_600_000);
  });

  it("cerca de 0 cuando casi se agota la ventana", () => {
    const ttl = secretTtlMs(
      {
        classification: "ERROR",
        found_at: new Date(NOW - SECRET_WINDOW_MS + 60_000).toISOString(),
      },
      NOW,
    );
    expect(ttl).toBeLessThan(120_000);
  });
});
