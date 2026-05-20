import { describe, it, expect } from "vitest";
import {
  faqPageSchema,
  breadcrumbSchema,
  flightOfferSchema,
  premiumProductSchema,
  organizationSchema,
  webPageSchema,
  cleanSchema,
} from "@/lib/schema_helpers";

describe("schema_helpers", () => {
  it("faqPageSchema produce shape Schema.org FAQPage", () => {
    const out = faqPageSchema([
      { q: "¿Pregunta?", a: "Respuesta." },
      { q: "Otra", a: "Otra resp." },
    ]);
    expect(out["@context"]).toBe("https://schema.org");
    expect(out["@type"]).toBe("FAQPage");
    expect(Array.isArray(out.mainEntity)).toBe(true);
    expect((out.mainEntity as unknown[]).length).toBe(2);
  });

  it("breadcrumbSchema prepende dominio a paths relativos", () => {
    const out = breadcrumbSchema([
      { name: "Inicio", url: "/" },
      { name: "Deals", url: "/deals" },
    ]);
    const items = out.itemListElement as Array<{ position: number; item: string }>;
    expect(items[0].position).toBe(1);
    expect(items[0].item).toBe("https://tripcazador.com/");
    expect(items[1].item).toBe("https://tripcazador.com/deals");
  });

  it("breadcrumbSchema respeta URLs absolutas existentes", () => {
    const out = breadcrumbSchema([
      { name: "External", url: "https://other.com/page" },
    ]);
    const items = out.itemListElement as Array<{ item: string }>;
    expect(items[0].item).toBe("https://other.com/page");
  });

  it("flightOfferSchema marca offer con priceCurrency EUR", () => {
    const out = flightOfferSchema({
      origin: "MAD",
      destination: "JFK",
      priceEur: 199,
      bookingUrl: "https://example.com",
    });
    const offer = out.offers as { price: number; priceCurrency: string };
    expect(offer.price).toBe(199);
    expect(offer.priceCurrency).toBe("EUR");
  });

  it("premiumProductSchema incluye brand TripCazador", () => {
    const out = premiumProductSchema({
      name: "Premium",
      description: "test",
      priceEur: 9.99,
      url: "/premium",
    });
    expect((out.brand as { name: string }).name).toBe("TripCazador");
  });

  it("organizationSchema incluye sameAs social links", () => {
    const out = organizationSchema();
    expect(Array.isArray(out.sameAs)).toBe(true);
    expect((out.sameAs as string[]).some((s) => s.includes("twitter"))).toBe(true);
  });

  it("webPageSchema embebe breadcrumb cuando se le pasa", () => {
    const out = webPageSchema({
      url: "/test",
      name: "Test",
      description: "Desc",
      breadcrumbItems: [{ name: "Home", url: "/" }],
    });
    expect((out.breadcrumb as { "@type": string })["@type"]).toBe("BreadcrumbList");
  });

  it("cleanSchema elimina undefined/null recursivamente", () => {
    const input = {
      a: 1,
      b: undefined,
      c: null,
      d: { e: 2, f: undefined },
      g: [1, null, 2],
    };
    const out = cleanSchema(input) as Record<string, unknown>;
    expect(out.a).toBe(1);
    expect("b" in out).toBe(false);
    expect("c" in out).toBe(false);
    expect("f" in (out.d as Record<string, unknown>)).toBe(false);
    expect((out.g as number[])).toEqual([1, 2]);
  });
});
