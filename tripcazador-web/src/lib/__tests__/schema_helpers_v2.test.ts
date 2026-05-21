/**
 * schema_helpers_v2.test.ts — SSS398
 *
 * Tests para los nuevos schemas HowTo + Article.
 */
import { describe, it, expect } from "vitest";
import { howToSchema, articleSchema, cleanSchema } from "../schema_helpers";

describe("howToSchema", () => {
  it("genera estructura HowTo válida con steps posiciones 1-based", () => {
    const s = howToSchema({
      name: "Cómo cazar un error fare",
      description: "Guía paso a paso",
      totalTime: "PT15M",
      steps: [
        { name: "Suscríbete", text: "Únete al newsletter" },
        { name: "Espera la alerta", text: "Te llegará en email/push" },
      ],
    });
    expect(s["@context"]).toBe("https://schema.org");
    expect(s["@type"]).toBe("HowTo");
    expect(s.name).toContain("error fare");
    const steps = s.step as Array<{ position: number; "@type": string }>;
    expect(steps).toHaveLength(2);
    expect(steps[0].position).toBe(1);
    expect(steps[1].position).toBe(2);
    expect(steps[0]["@type"]).toBe("HowToStep");
  });

  it("respeta position manual si se provee", () => {
    const s = howToSchema({
      name: "x",
      description: "y",
      steps: [{ name: "a", text: "b", position: 5 }],
    });
    const steps = s.step as Array<{ position: number }>;
    expect(steps[0].position).toBe(5);
  });

  it("incluye estimatedCost cuando se pasa", () => {
    const s = howToSchema({
      name: "x",
      description: "y",
      estimatedCost: { currency: "EUR", value: 0 },
      steps: [],
    });
    expect(s.estimatedCost).toMatchObject({
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: 0,
    });
  });
});

describe("articleSchema", () => {
  it("genera estructura Article con publisher TripCazador", () => {
    const s = articleSchema({
      headline: "Vuelos baratos en mayo 2026",
      description: "Análisis de chollos",
      url: "https://tripcazador.com/blog/mayo-2026",
      datePublished: "2026-05-21T00:00:00Z",
    });
    expect(s["@type"]).toBe("Article");
    expect(s.headline).toBe("Vuelos baratos en mayo 2026");
    expect(s.inLanguage).toBe("es-ES");
    const publisher = s.publisher as { name: string };
    expect(publisher.name).toBe("TripCazador");
  });

  it("trunca headline a 110 chars (Google limit)", () => {
    const long = "a".repeat(150);
    const s = articleSchema({
      headline: long,
      description: "x",
      url: "https://x",
      datePublished: "2026-05-21",
    });
    expect((s.headline as string).length).toBe(110);
  });

  it("dateModified default = datePublished si no se pasa", () => {
    const s = articleSchema({
      headline: "x",
      description: "y",
      url: "https://x",
      datePublished: "2026-05-21",
    });
    expect(s.dateModified).toBe("2026-05-21");
  });
});

describe("cleanSchema con howTo", () => {
  it("elimina undefined keys", () => {
    const dirty = howToSchema({
      name: "x",
      description: "y",
      steps: [{ name: "a", text: "b" }], // sin totalTime ni position custom
    });
    const cleaned = cleanSchema(dirty) as { estimatedCost?: unknown };
    expect(cleaned.estimatedCost).toBeUndefined();
  });
});
