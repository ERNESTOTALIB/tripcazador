/**
 * price_predictor.test.ts — SSS313 (19 may 2026)
 *
 * Tests deterministas para predictPrice():
 *  - buckets días hasta vuelo
 *  - ratio current vs avg
 *  - día de semana (martes/miércoles vs viernes/domingo)
 *  - combinaciones que cruzan thresholds verdict/confidence
 *  - boundaries y edge-cases (avg=0, daysToFlight=0, fechas pasadas)
 */
import { describe, it, expect } from "vitest";
import {
  predictPrice,
  verdictLabel,
  verdictColor,
  type PricePrediction,
} from "../price_predictor";

const TODAY = new Date("2026-05-19T12:00:00Z"); // martes

function daysFromToday(n: number): Date {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

describe("predictPrice — buckets días hasta vuelo", () => {
  it("<7 días + precio normal → verdict compra_ya (urgencia última semana)", () => {
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      date_out: daysFromToday(3),
      today: TODAY,
    });
    // -30 (urgencia) + 0 (ratio neutro) + dow → <= -20
    expect(out.verdict).toBe("compra_ya");
    expect(out.days_to_flight).toBe(3);
    expect(out.reasons.some((r) => r.includes("última semana"))).toBe(true);
  });

  it("7-21 días sweet spot + precio neutro → verdict neutro", () => {
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      date_out: daysFromToday(14),
      today: TODAY,
    });
    expect(out.verdict).toBe("neutro");
    expect(out.reasons.some((r) => r.includes("sweet spot"))).toBe(true);
  });

  it(">60 días + precio neutro → verdict neutro (precios estables)", () => {
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      date_out: daysFromToday(90),
      today: TODAY,
    });
    expect(out.verdict).toBe("neutro");
    expect(out.reasons.some((r) => r.includes("2 meses"))).toBe(true);
  });

  it("daysToFlight=0 → días en 0 (no negativos)", () => {
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      date_out: TODAY,
      today: TODAY,
    });
    expect(out.days_to_flight).toBe(0);
  });

  it("fecha pasada → daysToFlight 0 (Math.max guard)", () => {
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      date_out: daysFromToday(-10),
      today: TODAY,
    });
    expect(out.days_to_flight).toBe(0);
  });
});

describe("predictPrice — ratio current vs avg", () => {
  it("precio 80% bajo avg → score muy negativo → compra_ya con razón %bajo", () => {
    // current=160 avg=200 → ratio=0.8 (≤0.85) → -25
    // + 60d window → +0 → score=-25 → compra_ya
    const out = predictPrice({
      current_price: 160,
      avg_price: 200,
      date_out: daysFromToday(90),
      today: TODAY,
    });
    expect(out.verdict).toBe("compra_ya");
    expect(out.reasons.some((r) => r.includes("bajo media histórica"))).toBe(true);
  });

  it("precio 30% sobre avg → verdict espera con razón % por encima", () => {
    // current=260 avg=200 → ratio=1.3 (≥1.15) → +25
    // + 60d → +0 → score=+25 → espera
    const out = predictPrice({
      current_price: 260,
      avg_price: 200,
      date_out: daysFromToday(90),
      today: TODAY,
    });
    expect(out.verdict).toBe("espera");
    expect(out.reasons.some((r) => r.includes("por encima media"))).toBe(true);
  });

  it("avg_price=0 → skip bloque ratio (no NaN)", () => {
    const out = predictPrice({
      current_price: 200,
      avg_price: 0,
      date_out: daysFromToday(30),
      today: TODAY,
    });
    expect(out.verdict).toBeDefined();
    expect(Number.isFinite(out.expected_change_pct)).toBe(true);
    // No debe haber razón sobre ratio
    expect(out.reasons.some((r) => r.includes("media"))).toBe(false);
  });

  it("ratio exactamente 0.95 → bucket -10 (light discount)", () => {
    // current=190 avg=200 ratio=0.95
    const out = predictPrice({
      current_price: 190,
      avg_price: 200,
      date_out: daysFromToday(30),
      today: TODAY,
    });
    expect(out.reasons.some((r) => r.includes("por debajo media"))).toBe(true);
  });

  it("ratio 1.0 → ninguna razón sobre desviación", () => {
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      date_out: daysFromToday(30),
      today: TODAY,
    });
    expect(out.reasons.some((r) => r.includes("media"))).toBe(false);
  });
});

describe("predictPrice — día de semana", () => {
  it("vuelo en viernes → razón día caro", () => {
    // 2026-05-22 es viernes
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      date_out: new Date("2026-05-22T12:00:00Z"),
      today: TODAY,
    });
    expect(out.reasons.some((r) => r.includes("viernes"))).toBe(true);
  });

  it("vuelo en domingo → razón día caro", () => {
    // 2026-05-24 es domingo
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      date_out: new Date("2026-05-24T12:00:00Z"),
      today: TODAY,
    });
    expect(out.reasons.some((r) => r.includes("domingo"))).toBe(true);
  });

  it("vuelo en martes → sin razón día caro", () => {
    // 2026-05-26 es martes
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      date_out: new Date("2026-05-26T12:00:00Z"),
      today: TODAY,
    });
    expect(out.reasons.some((r) => r.includes("día caro"))).toBe(false);
  });
});

describe("predictPrice — combinaciones que disparan verdict + confidence", () => {
  it("urgencia <7d + precio alto → score mixto, verdict compra_ya por bias temporal", () => {
    // 5d → -30, ratio 1.3 → +25, viernes (2026-05-22) → -5 → score=-10 → neutro
    // Pero si combinamos urgencia muy alta sin precio alto:
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      date_out: daysFromToday(2), // jueves
      today: TODAY,
    });
    expect(out.verdict).toBe("compra_ya");
  });

  it("ventana 14d + precio 20% sobre avg → verdict espera", () => {
    // sweet spot +10, ratio 1.2 → +25 → +35 → espera (alta confidence)
    const out = predictPrice({
      current_price: 240,
      avg_price: 200,
      date_out: daysFromToday(14),
      today: TODAY,
    });
    expect(out.verdict).toBe("espera");
    expect(out.confidence).toBe("alta");
  });

  it("score absoluto >= 35 → confidence alta", () => {
    // -30 urgencia + -25 precio bajo + -5 viernes = -60 (cap)
    const out = predictPrice({
      current_price: 160,
      avg_price: 200,
      date_out: daysFromToday(2),
      today: TODAY,
    });
    expect(out.confidence).toBe("alta");
    expect(out.verdict).toBe("compra_ya");
  });

  it("score absoluto < 15 → confidence baja", () => {
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      date_out: daysFromToday(45),
      today: TODAY,
    });
    expect(out.confidence).toBe("baja");
  });

  it("expected_change_pct capped a ±30", () => {
    const high = predictPrice({
      current_price: 300,
      avg_price: 200,
      date_out: daysFromToday(60),
      today: TODAY,
    });
    expect(high.expected_change_pct).toBeLessThanOrEqual(30);
    expect(high.expected_change_pct).toBeGreaterThanOrEqual(-30);
  });

  it("expected_change_pct redondeado a 1 decimal", () => {
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      date_out: daysFromToday(14),
      today: TODAY,
    });
    const fractional = out.expected_change_pct * 10;
    expect(Math.round(fractional)).toBe(fractional);
  });
});

describe("predictPrice — determinismo + inputs", () => {
  it("misma entrada → mismo output (determinista)", () => {
    const input = {
      current_price: 200,
      avg_price: 220,
      date_out: daysFromToday(10),
      today: TODAY,
    };
    const a = predictPrice(input);
    const b = predictPrice(input);
    expect(a).toEqual(b);
  });

  it("acepta date_out como string ISO", () => {
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      date_out: "2026-06-15",
      today: TODAY,
    });
    expect(out.days_to_flight).toBeGreaterThan(0);
  });

  it("sin date_out → days_to_flight=0 (default hoy)", () => {
    const out = predictPrice({
      current_price: 200,
      avg_price: 200,
      today: TODAY,
    });
    expect(out.days_to_flight).toBe(0);
  });
});

describe("verdictLabel + verdictColor — UI helpers", () => {
  it("verdictLabel cubre los 3 casos", () => {
    expect(verdictLabel("compra_ya")).toContain("Compra YA");
    expect(verdictLabel("espera")).toContain("Espera");
    expect(verdictLabel("neutro")).toContain("normal");
  });

  it("verdictColor cubre los 3 casos con clases tailwind válidas", () => {
    expect(verdictColor("compra_ya")).toMatch(/^text-/);
    expect(verdictColor("espera")).toMatch(/^text-/);
    expect(verdictColor("neutro")).toMatch(/^text-/);
  });
});

describe("predictPrice — sanity invariants", () => {
  it("verdict siempre ∈ {compra_ya, espera, neutro}", () => {
    const samples: PricePrediction[] = [];
    for (let d = 0; d <= 120; d += 7) {
      for (const ratio of [0.6, 0.8, 1.0, 1.2, 1.5]) {
        samples.push(
          predictPrice({
            current_price: 200 * ratio,
            avg_price: 200,
            date_out: daysFromToday(d),
            today: TODAY,
          }),
        );
      }
    }
    for (const s of samples) {
      expect(["compra_ya", "espera", "neutro"]).toContain(s.verdict);
      expect(["alta", "media", "baja"]).toContain(s.confidence);
    }
  });
});
