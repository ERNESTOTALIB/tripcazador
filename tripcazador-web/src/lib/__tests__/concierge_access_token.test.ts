/**
 * concierge_access_token.test.ts — SSS328
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  issueConciergeAccessToken,
  verifyConciergeAccessToken,
  CONCIERGE_ACCESS_TTL_SEC,
} from "../concierge_access_token";

describe("ConciergeAccessToken SSS328", () => {
  const ORIG_SECRET = process.env.PANEL_SECRET;
  beforeEach(() => {
    process.env.PANEL_SECRET = "test_secret_concierge_xxx";
  });
  afterEach(() => {
    if (ORIG_SECRET === undefined) delete process.env.PANEL_SECRET;
    else process.env.PANEL_SECRET = ORIG_SECRET;
  });

  it("issue + verify round-trip", () => {
    const token = issueConciergeAccessToken("user@example.com");
    const claims = verifyConciergeAccessToken(token);
    expect(claims).not.toBeNull();
    expect(claims!.email).toBe("user@example.com");
  });

  it("normaliza email lowercase + trim", () => {
    const token = issueConciergeAccessToken("  USER@Example.COM  ");
    const claims = verifyConciergeAccessToken(token);
    expect(claims?.email).toBe("user@example.com");
  });

  it("acepta emails con caracteres especiales encoded", () => {
    const token = issueConciergeAccessToken("user+tag@example.com");
    const claims = verifyConciergeAccessToken(token);
    expect(claims?.email).toBe("user+tag@example.com");
  });

  it("rechaza token undefined", () => {
    expect(verifyConciergeAccessToken(undefined)).toBeNull();
    expect(verifyConciergeAccessToken("")).toBeNull();
  });

  it("rechaza token con menos de 3 partes", () => {
    expect(verifyConciergeAccessToken("only-one")).toBeNull();
    expect(verifyConciergeAccessToken("a:b")).toBeNull();
  });

  it("rechaza signature inválida", () => {
    const token = issueConciergeAccessToken("user@example.com");
    const tampered = token.slice(0, -1) + "0";
    expect(verifyConciergeAccessToken(tampered)).toBeNull();
  });

  it("rechaza token con ts no numérico", () => {
    expect(
      verifyConciergeAccessToken("user%40example.com:notanumber:somesig"),
    ).toBeNull();
  });

  it("rechaza token expirado (>7d)", () => {
    const token = issueConciergeAccessToken("user@example.com");
    const futureNow = Date.now() + (CONCIERGE_ACCESS_TTL_SEC + 60) * 1000;
    expect(verifyConciergeAccessToken(token, futureNow)).toBeNull();
  });

  it("acepta token a punto de expirar pero válido", () => {
    const token = issueConciergeAccessToken("user@example.com");
    const justInside = Date.now() + (CONCIERGE_ACCESS_TTL_SEC - 60) * 1000;
    expect(verifyConciergeAccessToken(token, justInside)).not.toBeNull();
  });

  it("rechaza token con timestamp futuro (sanity)", () => {
    // Simulamos un token con ts en el futuro lejano
    const futureTs = Math.floor(Date.now() / 1000) + 100_000;
    // Construimos manualmente — pero no podemos sin SECRET. Verificamos
    // que un token actual evaluado en "pasado" da age<0 → null.
    const token = issueConciergeAccessToken("user@example.com");
    const pastNow = (Math.floor(Date.now() / 1000) - 100_000) * 1000;
    expect(verifyConciergeAccessToken(token, pastNow)).toBeNull();
    void futureTs;
  });

  it("diferentes emails generan tokens distintos", () => {
    const a = issueConciergeAccessToken("alice@example.com");
    const b = issueConciergeAccessToken("bob@example.com");
    expect(a).not.toBe(b);
  });

  it("verifyConciergeAccessToken rechaza email mal formado tras decode", () => {
    // Token construido con email no válido como payload — el decode
    // dará algo no @
    const malformed = "notvalidemail:" + Math.floor(Date.now() / 1000) + ":fakesig";
    expect(verifyConciergeAccessToken(malformed)).toBeNull();
  });
});
