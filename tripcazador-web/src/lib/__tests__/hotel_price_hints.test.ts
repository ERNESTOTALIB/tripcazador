/**
 * hotel_price_hints.test.ts — SSS325
 */
import { describe, it, expect } from "vitest";
import { getHotelPriceHint } from "../hotel_price_hints";

describe("getHotelPriceHint SSS325", () => {
  it("ciudad conocida lowercase", () => {
    expect(getHotelPriceHint("tokio")).toBe(130);
    expect(getHotelPriceHint("barcelona")).toBe(130);
  });

  it("input mixed case se normaliza", () => {
    expect(getHotelPriceHint("Tokio")).toBe(130);
    expect(getHotelPriceHint("BARCELONA")).toBe(130);
  });

  it("IATA → traduce a ciudad + hint", () => {
    expect(getHotelPriceHint("TYO")).toBe(130); // → Tokio
    expect(getHotelPriceHint("BCN")).toBe(130); // → Barcelona
    expect(getHotelPriceHint("JFK")).toBe(200); // → Nueva York
  });

  it("string vacía → default", () => {
    expect(getHotelPriceHint("")).toBe(90);
  });

  it("ciudad desconocida → default", () => {
    expect(getHotelPriceHint("xyzzz")).toBe(90);
  });

  it("bigram con espacios funciona", () => {
    expect(getHotelPriceHint("nueva york")).toBe(200);
    expect(getHotelPriceHint("buenos aires")).toBe(70);
  });
});
