import { describe, it, expect } from "vitest";
import {
  roundRating,
  googleToBookingScale,
  formatRating,
  isGoodRating,
} from "./rating-utils";

describe("roundRating", () => {
  it("redondea 4.575 → 4.6", () => {
    expect(roundRating(4.575)).toBe(4.6);
  });

  it("redondea 4.421312 → 4.4", () => {
    expect(roundRating(4.421312)).toBe(4.4);
  });

  it("redondea 4.286853 → 4.3", () => {
    expect(roundRating(4.286853)).toBe(4.3);
  });

  it("pasa 5 tal cual", () => {
    expect(roundRating(5)).toBe(5);
  });

  it("clampea a 5 cuando viene por encima", () => {
    expect(roundRating(5.4)).toBe(5);
  });

  it("clampea a 1 cuando viene por debajo de 1 pero > 0", () => {
    expect(roundRating(0.3)).toBe(1);
  });

  it("devuelve null para 0", () => {
    expect(roundRating(0)).toBeNull();
  });

  it("devuelve null para negativos", () => {
    expect(roundRating(-2)).toBeNull();
  });

  it("devuelve null para NaN e Infinity", () => {
    expect(roundRating(NaN)).toBeNull();
    expect(roundRating(Infinity)).toBeNull();
  });

  it("devuelve null para strings/objetos/null/undefined", () => {
    expect(roundRating("4.5")).toBeNull();
    expect(roundRating(null)).toBeNull();
    expect(roundRating(undefined)).toBeNull();
    expect(roundRating({})).toBeNull();
  });
});

describe("googleToBookingScale", () => {
  it("4.6 (Google) → 9.2 (Booking)", () => {
    expect(googleToBookingScale(4.6)).toBe(9.2);
  });

  it("5.0 → 10.0", () => {
    expect(googleToBookingScale(5)).toBe(10);
  });

  it("null para inputs inválidos", () => {
    expect(googleToBookingScale("abc")).toBeNull();
    expect(googleToBookingScale(0)).toBeNull();
  });
});

describe("formatRating", () => {
  it('formato "4.6" para 4.575', () => {
    expect(formatRating(4.575)).toBe("4.6");
  });

  it('"—" para inputs inválidos', () => {
    expect(formatRating(null)).toBe("—");
    expect(formatRating(undefined)).toBe("—");
    expect(formatRating(0)).toBe("—");
  });

  it('siempre 1 decimal (no "5" sino "5.0")', () => {
    expect(formatRating(5)).toBe("5.0");
  });
});

describe("isGoodRating", () => {
  it("4.0 por defecto como umbral → 4.0 es bueno", () => {
    expect(isGoodRating(4.0)).toBe(true);
    expect(isGoodRating(3.9)).toBe(false);
  });

  it("acepta umbral custom", () => {
    expect(isGoodRating(4.2, 4.5)).toBe(false);
    expect(isGoodRating(4.7, 4.5)).toBe(true);
  });

  it("rating inválido no es bueno", () => {
    expect(isGoodRating(null)).toBe(false);
    expect(isGoodRating(0)).toBe(false);
    expect(isGoodRating("4.5")).toBe(false);
  });
});
