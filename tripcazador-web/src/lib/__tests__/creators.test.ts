import { describe, it, expect } from "vitest";
import {
  signCreatorToken,
  verifyCreatorToken,
  buildCreatorLink,
  isValidCreatorCode,
} from "../creators";

describe("creators", () => {
  it("signs and verifies tokens", () => {
    const token = signCreatorToken("pedro123");
    const result = verifyCreatorToken(token);
    expect(result).toBe("pedro123");
  });

  it("rejects tampered tokens", () => {
    const token = signCreatorToken("pedro123");
    const tampered = token.replace(/.$/, "x");
    expect(verifyCreatorToken(tampered)).toBe(null);
  });

  it("rejects invalid format", () => {
    expect(verifyCreatorToken("nopointhere")).toBe(null);
    expect(verifyCreatorToken("")).toBe(null);
    expect(verifyCreatorToken(".sigonly")).toBe(null);
  });

  it("builds link with UTM params", () => {
    const link = buildCreatorLink("anna_traveler");
    expect(link).toContain("ref=anna_traveler");
    expect(link).toContain("utm_source=creator");
    expect(link).toContain("utm_campaign=anna_traveler");
  });

  it("validates code format", () => {
    expect(isValidCreatorCode("pedro")).toBe(true);
    expect(isValidCreatorCode("travel-time_2026")).toBe(true);
    expect(isValidCreatorCode("ab")).toBe(false); // too short
    expect(isValidCreatorCode("a".repeat(33))).toBe(false); // too long
    expect(isValidCreatorCode("pe dro")).toBe(false); // space
    expect(isValidCreatorCode("pedro!")).toBe(false); // special char
  });
});
