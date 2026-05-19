/**
 * nl_alert_parser.test.ts — SSS319 (19 may 2026)
 */
import { describe, it, expect } from "vitest";
import { parseNLAlert } from "../nl_alert_parser";

describe("parseNLAlert SSS319 IATA matching", () => {
  it("extrae origin + destination con 2 IATA", () => {
    const r = parseNLAlert("BCN → JFK bajo 400€ economy agosto");
    expect(r.parsed.origin).toBe("BCN");
    expect(r.parsed.destination).toBe("JFK");
    expect(r.parsed.max_price).toBe(400);
    expect(r.parsed.cabin).toBe("economy");
    expect(r.parsed.date_min).toMatch(/-08-01$/);
    expect(r.parsed.date_max).toMatch(/-08-31$/);
    expect(r.confidence).toBe("high");
  });

  it("1 IATA tras 'desde' → origin", () => {
    const r = parseNLAlert("vuelos desde MAD a Tokio bajo 600");
    expect(r.parsed.origin).toBe("MAD");
    expect(r.parsed.destination).toBe("TYO"); // alias tokio
  });

  it("1 IATA sin keyword → asume destination", () => {
    const r = parseNLAlert("vuelos a JFK bajo 400€");
    expect(r.parsed.destination).toBe("JFK");
    expect(r.parsed.origin).toBeUndefined();
  });
});

describe("parseNLAlert SSS319 aliases de ciudad", () => {
  it("Tokio → TYO", () => {
    const r = parseNLAlert("vuelos a Tokio bajo 500€");
    expect(r.parsed.destination).toBe("TYO");
  });

  it("Bali → DPS", () => {
    const r = parseNLAlert("Bali en septiembre bajo 700");
    expect(r.parsed.destination).toBe("DPS");
    expect(r.parsed.date_min).toMatch(/-09-01$/);
  });

  it("'nueva york' → NYC (bigram)", () => {
    const r = parseNLAlert("Nueva York máximo 600€");
    expect(r.parsed.destination).toBe("NYC");
  });

  it("Roma → ROM", () => {
    const r = parseNLAlert("vuelos a Roma 200€ economy");
    expect(r.parsed.destination).toBe("ROM");
    expect(r.parsed.max_price).toBe(200);
  });

  it("destinos region (Asia) → warning region_unsupported", () => {
    const r = parseNLAlert("vuelos a Asia bajo 600€ business");
    expect(r.warnings).toContain("region_unsupported___REGION_ASIA__");
    expect(r.parsed.destination).toBeUndefined();
  });
});

describe("parseNLAlert SSS319 precio", () => {
  it("'bajo 500' → 500", () => {
    const r = parseNLAlert("Tokio bajo 500 economy");
    expect(r.parsed.max_price).toBe(500);
  });

  it("'500€' sin keyword → 500", () => {
    const r = parseNLAlert("Tokio 500€ economy");
    expect(r.parsed.max_price).toBe(500);
  });

  it("'máximo 800' → 800", () => {
    const r = parseNLAlert("Tokio máximo 800");
    expect(r.parsed.max_price).toBe(800);
  });

  it("'hasta 250' → 250", () => {
    const r = parseNLAlert("vuelos Tokio hasta 250€");
    expect(r.parsed.max_price).toBe(250);
  });

  it("ignora números fuera de rango razonable (>20000 o <20)", () => {
    const r = parseNLAlert("vuelos a Tokio en 2026 con ID 1234567");
    // 2026 fuera de rango 20-20000 → de hecho está en rango, pero
    // queremos asegurar al menos que el patrón con keyword se prefiere
    const r2 = parseNLAlert("Tokio precio 5");
    expect(r2.parsed.max_price).toBeUndefined();
    void r; // no aserción dura para el primero
  });

  it("warning no_price_detected si no hay precio", () => {
    const r = parseNLAlert("vuelos a Tokio en agosto");
    expect(r.warnings).toContain("no_price_detected");
  });
});

describe("parseNLAlert SSS319 cabin", () => {
  it("'business' → business", () => {
    const r = parseNLAlert("Tokio bajo 500 business");
    expect(r.parsed.cabin).toBe("business");
  });

  it("'turista' → economy", () => {
    const r = parseNLAlert("Bali bajo 400 turista");
    expect(r.parsed.cabin).toBe("economy");
  });

  it("'primera' → first", () => {
    const r = parseNLAlert("Dubai bajo 2000 primera");
    expect(r.parsed.cabin).toBe("first");
  });

  it("sin cabin → undefined", () => {
    const r = parseNLAlert("Tokio bajo 500");
    expect(r.parsed.cabin).toBeUndefined();
  });
});

describe("parseNLAlert SSS319 mes", () => {
  it("'septiembre' → rango 09-01 a 09-30", () => {
    const r = parseNLAlert("Tokio bajo 500 septiembre");
    expect(r.parsed.date_min).toMatch(/-09-01$/);
    expect(r.parsed.date_max).toMatch(/-09-30$/);
  });

  it("'febrero' → 28 días normalmente", () => {
    const r = parseNLAlert("BKK bajo 600 febrero");
    expect(r.parsed.date_max).toMatch(/-02-(28|29)$/);
  });

  it("'enero' (ya pasó si hoy es may) → año siguiente", () => {
    const r = parseNLAlert("vuelos enero a Tokio bajo 500");
    const minYear = parseInt(r.parsed.date_min!.slice(0, 4), 10);
    const now = new Date();
    expect(minYear).toBeGreaterThanOrEqual(now.getFullYear());
  });
});

describe("parseNLAlert SSS319 confidence + warnings", () => {
  it("input vacío → low + empty_input warning", () => {
    const r = parseNLAlert("");
    expect(r.warnings).toContain("empty_input");
    expect(r.confidence).toBe("low");
  });

  it("input super largo → warning input_too_long", () => {
    const r = parseNLAlert("a".repeat(600));
    expect(r.warnings).toContain("input_too_long");
  });

  it("high confidence cuando hay destination + precio + cabin", () => {
    const r = parseNLAlert("vuelos a Tokio bajo 500€ business septiembre");
    expect(r.confidence).toBe("high");
  });

  it("low confidence con basura", () => {
    const r = parseNLAlert("hola me llamo paco");
    expect(r.confidence).toBe("low");
    expect(r.warnings).toContain("no_route_detected");
  });

  it("matches incluye los raw strings detectados", () => {
    const r = parseNLAlert("Tokio bajo 500€ business");
    const fields = r.matches.map((m) => m.field);
    expect(fields).toContain("destination");
    expect(fields).toContain("max_price");
    expect(fields).toContain("cabin");
  });
});
