/**
 * baggage_rules.test.ts — SSS291 (18 may 2026)
 *
 * Catalog invariants para BAGGAGE_RULES.
 * Garantiza que cada landing /equipaje/[aerolinea] tenga datos consistentes.
 */
import { describe, it, expect } from "vitest";
import { BAGGAGE_RULES, BAGGAGE_BY_SLUG, getBaggageBySlug } from "../baggage_rules";

describe("BAGGAGE_RULES catalog invariants", () => {
  it("catalog has 15 airlines (SSS289 + SSS290)", () => {
    expect(BAGGAGE_RULES.length).toBe(15);
  });

  it("all slugs unique", () => {
    const slugs = BAGGAGE_RULES.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("all IATA codes unique", () => {
    const codes = BAGGAGE_RULES.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("all slugs lowercase-kebab-case", () => {
    for (const r of BAGGAGE_RULES) {
      expect(r.slug).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it("all IATA codes uppercase 2-3 chars", () => {
    for (const r of BAGGAGE_RULES) {
      expect(r.code).toMatch(/^[A-Z0-9]{2,3}$/);
    }
  });

  it("personalItem.dimensions formato '40 × 20 × 25 cm'", () => {
    for (const r of BAGGAGE_RULES) {
      expect(r.personalItem.dimensions).toMatch(/\d+ × \d+ × \d+ cm/);
    }
  });

  it("cabin.dimensions formato correcto", () => {
    for (const r of BAGGAGE_RULES) {
      expect(r.cabin.dimensions).toMatch(/\d+ × \d+ × \d+ cm/);
    }
  });

  it("cabin.weight contains 'kg'", () => {
    for (const r of BAGGAGE_RULES) {
      expect(r.cabin.weight).toContain("kg");
    }
  });

  it("checked.weight contains 'kg'", () => {
    for (const r of BAGGAGE_RULES) {
      expect(r.checked.weight).toContain("kg");
    }
  });

  it("feeFromEur is number >= 0", () => {
    for (const r of BAGGAGE_RULES) {
      expect(typeof r.cabin.feeFromEur).toBe("number");
      expect(r.cabin.feeFromEur).toBeGreaterThanOrEqual(0);
      expect(typeof r.checked.feeFromEur).toBe("number");
      expect(r.checked.feeFromEur).toBeGreaterThanOrEqual(0);
    }
  });

  it("gateFine.amountEur is number >= 0", () => {
    for (const r of BAGGAGE_RULES) {
      expect(typeof r.gateFine.amountEur).toBe("number");
      expect(r.gateFine.amountEur).toBeGreaterThanOrEqual(0);
    }
  });

  it("tips array has at least 3 items", () => {
    for (const r of BAGGAGE_RULES) {
      expect(r.tips.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("tips son strings no vacíos", () => {
    for (const r of BAGGAGE_RULES) {
      for (const tip of r.tips) {
        expect(typeof tip).toBe("string");
        expect(tip.length).toBeGreaterThan(20);
      }
    }
  });

  it("comparison es string no vacío", () => {
    for (const r of BAGGAGE_RULES) {
      expect(typeof r.comparison).toBe("string");
      expect(r.comparison.length).toBeGreaterThan(30);
    }
  });

  it("lastUpdated formato YYYY-MM", () => {
    for (const r of BAGGAGE_RULES) {
      expect(r.lastUpdated).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it("name no vacío", () => {
    for (const r of BAGGAGE_RULES) {
      expect(r.name.length).toBeGreaterThan(2);
    }
  });

  it("emoji presente (1-4 caracteres unicode)", () => {
    for (const r of BAGGAGE_RULES) {
      expect(r.emoji.length).toBeGreaterThan(0);
      expect(r.emoji.length).toBeLessThanOrEqual(8);
    }
  });
});

describe("BAGGAGE_BY_SLUG map", () => {
  it("contiene todas las airlines", () => {
    for (const r of BAGGAGE_RULES) {
      expect(BAGGAGE_BY_SLUG[r.slug]).toBeTruthy();
      expect(BAGGAGE_BY_SLUG[r.slug].code).toBe(r.code);
    }
  });
});

describe("getBaggageBySlug helper", () => {
  it("ryanair → Ryanair rule", () => {
    const r = getBaggageBySlug("ryanair");
    expect(r).toBeTruthy();
    expect(r!.code).toBe("FR");
    expect(r!.name).toBe("Ryanair");
  });

  it("slug inválido → null", () => {
    expect(getBaggageBySlug("nonexistent-airline")).toBeNull();
  });

  it("emirates (SSS290) → Emirates rule", () => {
    const r = getBaggageBySlug("emirates");
    expect(r).toBeTruthy();
    expect(r!.code).toBe("EK");
  });
});

describe("FAQ data (SSS290 rich snippets)", () => {
  it("airlines con FAQ tienen 3+ Q&A", () => {
    const withFaq = BAGGAGE_RULES.filter((r) => r.faq && r.faq.length > 0);
    expect(withFaq.length).toBeGreaterThanOrEqual(5); // mínimo 5 nuevas SSS290
    for (const r of withFaq) {
      expect(r.faq!.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("FAQ questions terminan con ?", () => {
    for (const r of BAGGAGE_RULES) {
      if (!r.faq) continue;
      for (const f of r.faq) {
        expect(f.q).toMatch(/\?$/);
      }
    }
  });

  it("FAQ answers son strings descriptivos (>40 chars)", () => {
    for (const r of BAGGAGE_RULES) {
      if (!r.faq) continue;
      for (const f of r.faq) {
        expect(f.a.length).toBeGreaterThan(40);
      }
    }
  });
});

describe("Ryanair (FR) specific data — verified mayo 2026", () => {
  it("bolso pequeño 40 × 20 × 25 cm", () => {
    const r = getBaggageBySlug("ryanair")!;
    expect(r.personalItem.dimensions).toBe("40 × 20 × 25 cm");
  });

  it("gate fine €75", () => {
    const r = getBaggageBySlug("ryanair")!;
    expect(r.gateFine.amountEur).toBe(75);
  });

  it("personalItem.free = true (gratis)", () => {
    const r = getBaggageBySlug("ryanair")!;
    expect(r.personalItem.free).toBe(true);
  });
});

describe("Iberia (IB) — full-service generoso", () => {
  it("cabina incluida en TODAS las tarifas (feeFromEur=0)", () => {
    const r = getBaggageBySlug("iberia")!;
    expect(r.cabin.feeFromEur).toBe(0);
  });

  it("gateFine = 0 (política flexible)", () => {
    const r = getBaggageBySlug("iberia")!;
    expect(r.gateFine.amountEur).toBe(0);
  });
});

describe("Qatar Airways (QR) — luxury 30kg facturados", () => {
  it("checked weight 30kg", () => {
    const r = getBaggageBySlug("qatar-airways")!;
    expect(r.checked.weight).toContain("30");
  });
});
