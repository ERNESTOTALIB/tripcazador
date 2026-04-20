import { describe, expect, it } from "vitest";
import { validateAlert, EMAIL_RE, IATA_RE } from "./PriceAlertModal";

describe("validateAlert", () => {
  const base = { email: "ok@example.com", origin: "MAD", destination: "JFK", targetPrice: "500" };

  it("pasa con entrada válida", () => {
    expect(validateAlert(base)).toEqual({});
  });

  it("requiere email", () => {
    expect(validateAlert({ ...base, email: "" }).email).toMatch(/falta/i);
  });

  it("rechaza email malformado", () => {
    expect(validateAlert({ ...base, email: "not-an-email" }).email).toMatch(/válido/i);
  });

  it("acepta email con mayúsculas y espacios (trim interno)", () => {
    expect(validateAlert({ ...base, email: " Mixed@Case.COM" }).email).toBeUndefined();
  });

  it("rechaza IATA no de 3 letras", () => {
    expect(validateAlert({ ...base, origin: "MADRID" }).origin).toMatch(/iata/i);
    expect(validateAlert({ ...base, destination: "JF" }).destination).toMatch(/iata/i);
    expect(validateAlert({ ...base, origin: "12M" }).origin).toMatch(/iata/i);
  });

  it("normaliza IATA a mayúsculas antes de validar", () => {
    expect(validateAlert({ ...base, origin: "mad", destination: "jfk" })).toEqual({});
  });

  it("acepta origin vacío si hay destination", () => {
    expect(validateAlert({ ...base, origin: "" })).toEqual({});
  });

  it("rechaza precio negativo o cero", () => {
    expect(validateAlert({ ...base, targetPrice: "-1" }).targetPrice).toBeDefined();
    expect(validateAlert({ ...base, targetPrice: "0" }).targetPrice).toBeDefined();
  });

  it("rechaza precio superior al tope", () => {
    expect(validateAlert({ ...base, targetPrice: "200000" }).targetPrice).toMatch(/máximo/i);
  });

  it("acepta precio vacío (alerta sin tope)", () => {
    expect(validateAlert({ ...base, targetPrice: "" })).toEqual({});
  });

  it("rechaza falta de origen, destino y deal_id", () => {
    const result = validateAlert({ email: "a@b.com", origin: "", destination: "", targetPrice: "" });
    expect(result.form).toMatch(/origen|destino/i);
  });

  it("acepta deal_id sin origen/destino", () => {
    const result = validateAlert({
      email: "a@b.com", origin: "", destination: "", targetPrice: "", dealId: "deal-abc",
    });
    expect(result.form).toBeUndefined();
  });
});

describe("regexes exportados", () => {
  it("EMAIL_RE básico", () => {
    expect(EMAIL_RE.test("a@b.co")).toBe(true);
    expect(EMAIL_RE.test("no-at-sign")).toBe(false);
    expect(EMAIL_RE.test("two@@signs.com")).toBe(false);
  });

  it("IATA_RE solo mayúsculas A-Z de longitud 3", () => {
    expect(IATA_RE.test("MAD")).toBe(true);
    expect(IATA_RE.test("mad")).toBe(false);
    expect(IATA_RE.test("MA")).toBe(false);
    expect(IATA_RE.test("MADD")).toBe(false);
    expect(IATA_RE.test("M1D")).toBe(false);
  });
});
