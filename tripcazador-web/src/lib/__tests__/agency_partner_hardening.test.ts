/**
 * agency_partner_hardening.test.ts — SSS382
 *
 * Anti-regresión hardening del ref_code:
 *  - debe ser 8 chars (no 4) — anti brute-force enumeration
 *  - chars deben venir de alfabeto seguro (no I/O/0/1 confundibles)
 *  - distintos en runs sucesivos (RNG funciona)
 */
import { describe, it, expect, beforeEach } from "vitest";
import { registerPartner, __resetForTests } from "../agency_partner";

beforeEach(() => __resetForTests());

describe("ref_code hardening SSS382", () => {
  it("genera 8 chars post-prefijo (TC-AGY-XXXXXXXX = 15 total)", () => {
    const p = registerPartner({ company_name: "x", contact_email: "x@x.com" });
    expect(p.ref_code).toMatch(/^TC-AGY-[A-Z0-9]{8}$/);
    expect(p.ref_code.length).toBe(15);
  });

  it("alfabeto excluye I/O/0/1 (anti-confusión visual)", () => {
    // Generar muchos y verificar que nunca aparezcan los confundibles
    for (let i = 0; i < 30; i++) {
      const p = registerPartner({ company_name: `x${i}`, contact_email: `x${i}@x.com` });
      const code = p.ref_code.slice(7); // chars post TC-AGY-
      expect(code).not.toMatch(/[IO01]/);
    }
  });

  it("ref_codes son únicos en 100 registros consecutivos", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const p = registerPartner({ company_name: `x${i}`, contact_email: `x${i}@x.com` });
      codes.add(p.ref_code);
    }
    expect(codes.size).toBe(100);
  });
});
