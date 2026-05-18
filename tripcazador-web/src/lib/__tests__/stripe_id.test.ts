/**
 * stripe_id.test.ts — SSS304 (18 may 2026)
 *
 * Tests para los helpers de validación Stripe ID.
 */
import { describe, it, expect } from "vitest";
import {
  isValidStripeCustomerId,
  isValidStripeSessionId,
  isValidStripeOwnerId,
} from "../stripe_id";

describe("stripe_id validators SSS304", () => {
  describe("isValidStripeCustomerId", () => {
    it("acepta cus_xxx 8+ chars", () => {
      expect(isValidStripeCustomerId("cus_OdLMNOPQrst")).toBe(true);
      expect(isValidStripeCustomerId("cus_12345678")).toBe(true);
    });
    it("rechaza cus_xxx con menos de 8 chars", () => {
      expect(isValidStripeCustomerId("cus_short")).toBe(false);
    });
    it("rechaza cs_ format", () => {
      expect(isValidStripeCustomerId("cs_live_abc12345")).toBe(false);
      expect(isValidStripeCustomerId("cs_test_abc12345")).toBe(false);
    });
    it("rechaza valores no string", () => {
      expect(isValidStripeCustomerId(undefined)).toBe(false);
      expect(isValidStripeCustomerId(null)).toBe(false);
      expect(isValidStripeCustomerId(42)).toBe(false);
    });
    it("rechaza prefijos incorrectos", () => {
      expect(isValidStripeCustomerId("sub_abc12345")).toBe(false);
      expect(isValidStripeCustomerId("pi_abc12345")).toBe(false);
    });
  });

  describe("isValidStripeSessionId", () => {
    it("acepta cs_test_xxx", () => {
      expect(isValidStripeSessionId("cs_test_abc12345")).toBe(true);
    });
    it("acepta cs_live_xxx", () => {
      expect(isValidStripeSessionId("cs_live_abc12345")).toBe(true);
    });
    it("rechaza cus_xxx", () => {
      expect(isValidStripeSessionId("cus_OdLMNOPQrst")).toBe(false);
    });
    it("rechaza prefijo cs_ sin test/live", () => {
      expect(isValidStripeSessionId("cs_abc12345")).toBe(false);
    });
  });

  describe("isValidStripeOwnerId — acepta ambos", () => {
    it("acepta cus_xxx", () => {
      expect(isValidStripeOwnerId("cus_OdLMNOPQrst")).toBe(true);
    });
    it("acepta cs_test_xxx", () => {
      expect(isValidStripeOwnerId("cs_test_abc12345")).toBe(true);
    });
    it("acepta cs_live_xxx", () => {
      expect(isValidStripeOwnerId("cs_live_abc12345")).toBe(true);
    });
    it("rechaza garbage", () => {
      expect(isValidStripeOwnerId("garbage")).toBe(false);
      expect(isValidStripeOwnerId("")).toBe(false);
      expect(isValidStripeOwnerId("cus_2chars")).toBe(false);
    });
    it("rechaza prefijos malos", () => {
      expect(isValidStripeOwnerId("custumer_abc12345")).toBe(false);
      expect(isValidStripeOwnerId("ch_abc12345")).toBe(false);
    });
  });
});
