import { describe, it, expect } from "vitest";
import { generateGiftCode, verifyGiftCode, isValidGiftAmount } from "../gift_cards";

describe("gift_cards", () => {
  it("generates valid codes that verify", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateGiftCode();
      expect(code).toMatch(/^TC-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{2}$/);
      expect(verifyGiftCode(code)).toBe(true);
    }
  });

  it("rejects malformed codes", () => {
    expect(verifyGiftCode("")).toBe(false);
    expect(verifyGiftCode("TC-XXXX-XXXX-XX")).toBe(false);
    expect(verifyGiftCode("TC-1234-5678")).toBe(false);
    expect(verifyGiftCode("ABCDEF")).toBe(false);
  });

  it("rejects codes with bad checksum", () => {
    expect(verifyGiftCode("TC-1234-5678-00")).toBe(false);
  });

  it("validates allowed amounts", () => {
    expect(isValidGiftAmount(25)).toBe(true);
    expect(isValidGiftAmount(50)).toBe(true);
    expect(isValidGiftAmount(100)).toBe(true);
    expect(isValidGiftAmount(200)).toBe(true);
    expect(isValidGiftAmount(75)).toBe(false);
    expect(isValidGiftAmount(0)).toBe(false);
  });
});
