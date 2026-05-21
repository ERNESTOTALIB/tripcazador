/**
 * currency_convert.test.ts — SSS380
 */
import { describe, it, expect } from "vitest";
import {
  convertFromEur,
  formatCurrency,
  symbolFor,
  nameFor,
  defaultCurrencyForIata,
  defaultCurrencyForCountry,
  listSupportedCurrencies,
} from "../currency_convert";

describe("convertFromEur", () => {
  it("EUR→USD redondea a 2 decimales", () => {
    expect(convertFromEur(100, "USD")).toBe(108);
    expect(convertFromEur(9.99, "USD")).toBeCloseTo(10.79, 2);
  });

  it("EUR→ARS redondea a 0 decimales", () => {
    const r = convertFromEur(100, "ARS");
    expect(Number.isInteger(r)).toBe(true);
    expect(r).toBeGreaterThan(0);
  });

  it("EUR→MXN 1 decimal", () => {
    const r = convertFromEur(100, "MXN");
    expect(r.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(1);
  });

  it("amount negativo o NaN → 0", () => {
    expect(convertFromEur(-5, "USD")).toBe(0);
    expect(convertFromEur(NaN, "USD")).toBe(0);
  });

  it("EUR→EUR = identidad", () => {
    expect(convertFromEur(100, "EUR")).toBe(100);
    expect(convertFromEur(9.99, "EUR")).toBe(9.99);
  });
});

describe("formatCurrency", () => {
  it("formatea EUR", () => {
    const s = formatCurrency(9.99, "EUR");
    expect(s).toContain("9,99");
  });
  it("formatea USD", () => {
    expect(formatCurrency(108, "USD")).toContain("108,00");
  });
  it("ARS sin decimales", () => {
    const s = formatCurrency(95000, "ARS");
    expect(s).not.toContain(",00");
  });
});

describe("symbolFor + nameFor", () => {
  it("EUR €", () => {
    expect(symbolFor("EUR")).toBe("€");
    expect(nameFor("EUR")).toContain("Euro");
  });
  it("BRL R$", () => {
    expect(symbolFor("BRL")).toBe("R$");
  });
});

describe("defaultCurrencyForCountry / IATA", () => {
  it("US → USD", () => {
    expect(defaultCurrencyForCountry("US")).toBe("USD");
  });
  it("JFK → USD", () => {
    expect(defaultCurrencyForIata("JFK")).toBe("USD");
  });
  it("MEX → MXN", () => {
    expect(defaultCurrencyForIata("MEX")).toBe("MXN");
  });
  it("EZE → ARS", () => {
    expect(defaultCurrencyForIata("EZE")).toBe("ARS");
  });
  it("GRU → BRL", () => {
    expect(defaultCurrencyForIata("GRU")).toBe("BRL");
  });
  it("MAD desconocido (España default) → EUR", () => {
    expect(defaultCurrencyForIata("MAD")).toBe("EUR");
  });
});

describe("listSupportedCurrencies", () => {
  it("incluye 9 monedas", () => {
    const list = listSupportedCurrencies();
    expect(list.length).toBe(9);
    expect(list).toContain("EUR");
    expect(list).toContain("USD");
    expect(list).toContain("ARS");
  });
});
