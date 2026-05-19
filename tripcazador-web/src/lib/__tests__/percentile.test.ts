/**
 * percentile.test.ts — SSS326
 */
import { describe, it, expect } from "vitest";
import { calculatePercentile } from "../percentile";

describe("calculatePercentile SSS326", () => {
  it("lista vacía → 50% con label 'primer Premium'", () => {
    const r = calculatePercentile(100, []);
    expect(r.percentile).toBe(50);
    expect(r.total_customers).toBe(0);
    expect(r.label).toContain("primer Premium");
  });

  it("user en el medio de la distribución", () => {
    // 10 totales, mi total=50 → 4 below (10..40) + 1 equal (yo) → (4+0.5)/10×100 = 45%
    const sorted = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const r = calculatePercentile(50, sorted);
    expect(r.percentile).toBe(45);
    expect(r.total_customers).toBe(10);
  });

  it("user con valor máximo → top percentile (capped 99%)", () => {
    const sorted = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const r = calculatePercentile(100, sorted);
    expect(r.percentile).toBeLessThanOrEqual(99);
    expect(r.percentile).toBeGreaterThan(90);
    expect(r.label).toContain("Top");
  });

  it("user con valor mínimo → bottom percentile (capped 1%)", () => {
    const sorted = [10, 20, 30, 40, 50];
    const r = calculatePercentile(10, sorted);
    expect(r.percentile).toBeGreaterThanOrEqual(1);
    expect(r.percentile).toBeLessThanOrEqual(20);
  });

  it("muestra pequeña (<5) usa label generic sin percentile", () => {
    const sorted = [10, 20, 30];
    const r = calculatePercentile(20, sorted);
    expect(r.label).toContain("Llevas");
    expect(r.label).toContain("20€");
  });

  it("user con 0€ devuelve label sin ahorros", () => {
    const r = calculatePercentile(0, [10, 20, 30]);
    expect(r.label).toContain("Sin ahorros");
  });

  it("user con negativo → fallback 0€", () => {
    const r = calculatePercentile(-5, [10, 20, 30]);
    expect(r.my_total_eur).toBe(0);
  });

  it("user con valor entre rangos calcula proporcionalmente", () => {
    // 4 below (10,20,30,40), 0 equal, total 10 → 4/10×100 = 40%
    const sorted = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const r = calculatePercentile(45, sorted);
    expect(r.percentile).toBe(40);
  });

  it("label top 90+ menciona 'Top 10%'", () => {
    const sorted = Array.from({ length: 100 }, (_, i) => i + 1);
    const r = calculatePercentile(95, sorted);
    expect(r.percentile).toBeGreaterThanOrEqual(90);
    expect(r.label).toContain("🏆");
  });
});
