/**
 * blog_image_gen.test.ts — SSS373
 *
 * Tests pure fns sin red. Cubre prompt building + destination detection.
 */
import { describe, it, expect } from "vitest";
import {
  buildPrompt,
  buildEnrichedPrompt,
  detectDestinationFromTitle,
  placeholderSeed,
  generateHeroImage,
} from "../blog_image_gen";

describe("buildPrompt", () => {
  it("incluye título + style default", () => {
    const p = buildPrompt({ title: "Vuelos baratos a Tokio en 2026" });
    expect(p).toContain("Vuelos baratos a Tokio en 2026");
    expect(p).toContain("cinematic");
    expect(p).toContain("no text");
  });

  it("acepta tags hasta 3", () => {
    const p = buildPrompt({
      title: "Bali completo",
      tags: ["bali", "indonesia", "playa", "extra"],
    });
    expect(p).toContain("bali, indonesia, playa");
    expect(p).not.toContain("extra");
  });

  it("style custom override", () => {
    const p = buildPrompt({ title: "x", style: "anime style" });
    expect(p).toContain("anime style");
  });
});

describe("detectDestinationFromTitle", () => {
  it("detecta Tokio", () => {
    expect(detectDestinationFromTitle("Vuelos a Tokio baratos")).toContain("Tokyo");
  });

  it("detecta Bali", () => {
    expect(detectDestinationFromTitle("Bali en septiembre")).toContain("Bali");
  });

  it("detecta variantes Paris/París", () => {
    expect(detectDestinationFromTitle("Paris en primavera")).toContain("Paris");
    expect(detectDestinationFromTitle("París low cost")).toContain("Paris");
  });

  it("sin destino reconocido devuelve null", () => {
    expect(detectDestinationFromTitle("Trucos de viaje generales")).toBeNull();
  });
});

describe("buildEnrichedPrompt", () => {
  it("añade scene cuando destino reconocido", () => {
    const p = buildEnrichedPrompt({ title: "Tokio en agosto" });
    expect(p).toContain("Scene:");
    expect(p).toContain("Tokyo");
  });

  it("no añade scene si destino no reconocido", () => {
    const p = buildEnrichedPrompt({ title: "Cómo cazar errores de tarifa" });
    expect(p).not.toContain("Scene:");
  });
});

describe("placeholderSeed", () => {
  it("genera 12 chars determinístico", () => {
    const s1 = placeholderSeed("Tokio en agosto");
    const s2 = placeholderSeed("Tokio en agosto");
    expect(s1).toBe(s2);
    expect(s1.length).toBe(12);
  });

  it("diferentes inputs → diferentes seeds", () => {
    expect(placeholderSeed("a")).not.toBe(placeholderSeed("b"));
  });
});

describe("generateHeroImage dry-run sin env", () => {
  it("retorna no_token cuando no hay REPLICATE_API_TOKEN", async () => {
    const r = await generateHeroImage({ title: "Test" });
    // Sin env vars en test runtime → dry_run true
    expect(r.dry_run).toBe(true);
    expect(r.cost_estimate_usd).toBe(0);
    expect(r.reason).toBe("no_token");
  });
});
