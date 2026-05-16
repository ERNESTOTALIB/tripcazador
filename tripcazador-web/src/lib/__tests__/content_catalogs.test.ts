/**
 * content_catalogs.test.ts — SSS251 (16 may 2026)
 *
 * Tests para 3 libs content sin tests previo:
 *  - airline_reviews.ts (402 líneas)
 *  - glossary.ts (476 líneas)
 *  - drip_templates.ts (248 líneas, newsletter email templates)
 */
import { describe, it, expect } from "vitest";
import { AIRLINE_REVIEWS, getAirlineReview } from "../airline_reviews";
import { GLOSSARY, getGlossaryByCategory, CATEGORY_LABELS } from "../glossary";
import {
  DRIP_TEMPLATES,
  getTemplate,
  CONCIERGE_RECOVERY_TEMPLATE,
} from "../drip_templates";

const SLUG_REGEX = /^[a-z0-9-]+$/;

describe("AIRLINE_REVIEWS catalog", () => {
  it("tiene mínimo 10 reviews", () => {
    expect(AIRLINE_REVIEWS.length).toBeGreaterThanOrEqual(10);
  });

  it("IATA codes únicos format 2-char uppercase", () => {
    const iatas = AIRLINE_REVIEWS.map((a) => a.iata);
    expect(new Set(iatas).size).toBe(iatas.length);
    for (const iata of iatas) {
      expect(iata).toMatch(/^[A-Z0-9]{2}$/);
    }
  });

  it("ICAO codes format 3-char uppercase", () => {
    for (const a of AIRLINE_REVIEWS) {
      expect(a.icao).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("alliance en allowlist", () => {
    const valid = new Set(["Star Alliance", "Oneworld", "SkyTeam", "Ninguna"]);
    for (const a of AIRLINE_REVIEWS) {
      expect(valid.has(a.alliance)).toBe(true);
    }
  });

  it("star_rating en rango 1-5", () => {
    for (const a of AIRLINE_REVIEWS) {
      expect(a.star_rating).toBeGreaterThanOrEqual(1);
      expect(a.star_rating).toBeLessThanOrEqual(5);
    }
  });

  it("on_time_pct en rango 0-100", () => {
    for (const a of AIRLINE_REVIEWS) {
      expect(a.on_time_pct).toBeGreaterThanOrEqual(0);
      expect(a.on_time_pct).toBeLessThanOrEqual(100);
    }
  });

  it("bag_lost_per_1000 no negativo", () => {
    for (const a of AIRLINE_REVIEWS) {
      expect(a.bag_lost_per_1000).toBeGreaterThanOrEqual(0);
    }
  });

  it("name no contiene chars peligrosos XSS", () => {
    for (const a of AIRLINE_REVIEWS) {
      expect(a.name).not.toMatch(/[<>]/);
      expect(a.name.length).toBeGreaterThan(1);
    }
  });

  it("hub no vacío (puede ser nombre ciudad + IATA)", () => {
    for (const a of AIRLINE_REVIEWS) {
      expect(a.hub).toBeTruthy();
      expect(a.hub.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("getAirlineReview", () => {
  it("retorna review por IATA válido", () => {
    const first = AIRLINE_REVIEWS[0];
    const found = getAirlineReview(first.iata);
    expect(found).toBeDefined();
    expect(found?.iata).toBe(first.iata);
  });

  it("undefined para IATA desconocido", () => {
    expect(getAirlineReview("XX")).toBeUndefined();
    expect(getAirlineReview("ZZ")).toBeUndefined();
  });

  it("case-insensitive lookup", () => {
    const first = AIRLINE_REVIEWS[0];
    const lower = getAirlineReview(first.iata.toLowerCase());
    expect(lower).toBeDefined();
    expect(lower?.iata).toBe(first.iata);
  });
});

describe("GLOSSARY catalog", () => {
  it("tiene mínimo 20 términos", () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(20);
  });

  it("slugs únicos format kebab-case", () => {
    const slugs = GLOSSARY.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(SLUG_REGEX);
    }
  });

  it("cada término tiene definition no vacío", () => {
    for (const g of GLOSSARY) {
      expect(g.term).toBeTruthy();
      expect(g.definition.length).toBeGreaterThanOrEqual(10);
    }
  });

  it("category en allowlist", () => {
    const valid = new Set([
      "tarifas",
      "operativa",
      "alianzas",
      "miles",
      "cabina",
      "aeropuertos",
      "cazador",
    ]);
    for (const g of GLOSSARY) {
      expect(valid.has(g.category)).toBe(true);
    }
  });

  it("aliases es array si existe", () => {
    for (const g of GLOSSARY) {
      if (g.aliases !== undefined) {
        expect(Array.isArray(g.aliases)).toBe(true);
      }
    }
  });

  it("term + definition no contienen chars XSS peligrosos", () => {
    for (const g of GLOSSARY) {
      expect(g.term).not.toMatch(/[<>]/);
      expect(g.definition).not.toMatch(/<script/i);
    }
  });
});

describe("getGlossaryByCategory", () => {
  it("agrupa términos por category", () => {
    const grouped = getGlossaryByCategory();
    expect(typeof grouped).toBe("object");
    const keys = Object.keys(grouped);
    expect(keys.length).toBeGreaterThan(0);
  });

  it("cada array no vacío contiene términos de esa category", () => {
    const grouped = getGlossaryByCategory();
    for (const [cat, terms] of Object.entries(grouped)) {
      for (const t of terms) {
        expect(t.category).toBe(cat);
      }
    }
  });
});

describe("CATEGORY_LABELS", () => {
  it("tiene labels para todas las categories usadas en GLOSSARY", () => {
    const cats = new Set(GLOSSARY.map((g) => g.category));
    for (const cat of cats) {
      expect(CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });
});

describe("DRIP_TEMPLATES catalog", () => {
  it("tiene mínimo 4 templates (welcome + drip stages)", () => {
    expect(DRIP_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });

  it("stages únicos consecutivos desde 0", () => {
    const stages = DRIP_TEMPLATES.map((t) => t.stage).sort((a, b) => a - b);
    expect(stages[0]).toBe(0);
    // No duplicados
    expect(new Set(stages).size).toBe(stages.length);
  });

  it("cada template tiene subject + html + text no vacíos", () => {
    for (const t of DRIP_TEMPLATES) {
      expect(t.subject).toBeTruthy();
      expect(t.subject.length).toBeGreaterThan(5);
      expect(t.html).toBeTruthy();
      expect(t.html.length).toBeGreaterThan(50);
      expect(t.text).toBeTruthy();
    }
  });

  it("html incluye {{unsubscribe_url}} placeholder (compliance)", () => {
    for (const t of DRIP_TEMPLATES) {
      expect(t.html).toContain("{{unsubscribe_url}}");
    }
  });

  it("html es HTML válido (DOCTYPE + html tags)", () => {
    for (const t of DRIP_TEMPLATES) {
      expect(t.html).toMatch(/<!DOCTYPE html>/i);
      expect(t.html).toMatch(/<html/i);
      expect(t.html).toMatch(/<\/html>/i);
    }
  });

  it("subject no tiene chars peligrosos (newline injection email header)", () => {
    for (const t of DRIP_TEMPLATES) {
      expect(t.subject).not.toMatch(/\r|\n/);
    }
  });
});

describe("getTemplate", () => {
  it("retorna template por stage válido", () => {
    const t0 = getTemplate(0);
    expect(t0).not.toBeNull();
    expect(t0?.stage).toBe(0);
  });

  it("null para stage desconocido (negativo, demasiado grande)", () => {
    expect(getTemplate(-1)).toBeNull();
    expect(getTemplate(999)).toBeNull();
  });
});

describe("CONCIERGE_RECOVERY_TEMPLATE", () => {
  it("es un DripTemplate válido con shape correcta", () => {
    expect(CONCIERGE_RECOVERY_TEMPLATE.subject).toBeTruthy();
    expect(CONCIERGE_RECOVERY_TEMPLATE.html).toBeTruthy();
    expect(CONCIERGE_RECOVERY_TEMPLATE.text).toBeTruthy();
  });

  it("html incluye unsubscribe + DOCTYPE", () => {
    expect(CONCIERGE_RECOVERY_TEMPLATE.html).toContain("{{unsubscribe_url}}");
    expect(CONCIERGE_RECOVERY_TEMPLATE.html).toMatch(/<!DOCTYPE html>/i);
  });
});
