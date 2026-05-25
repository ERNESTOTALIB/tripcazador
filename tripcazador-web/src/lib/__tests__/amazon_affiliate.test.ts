import { describe, it, expect } from "vitest";
import { buildAmazonLink, buildAmazonSearchLink } from "@/lib/amazon_affiliate";

describe("buildAmazonLink", () => {
  it("ASIN sin tag override usa env (NEXT_PUBLIC_AMAZON_TAG vacío en tests)", () => {
    const url = buildAmazonLink("B0XYZ123AB");
    expect(url).toContain("amazon.es/dp/B0XYZ123AB");
  });

  it("ASIN con tagOverride inyecta tag y linkCode", () => {
    const url = buildAmazonLink("B0XYZ123AB", "es", "tripcazador-21");
    expect(url).toContain("tag=tripcazador-21");
    expect(url).toContain("linkCode=ll1");
  });

  it("URL completa preserva path + añade tag", () => {
    const url = buildAmazonLink(
      "https://amazon.es/dp/B0ABC?foo=bar",
      "es",
      "myTag-21",
    );
    expect(url).toContain("tag=myTag-21");
    expect(url).toContain("foo=bar");
  });

  it("locale .com vs .es", () => {
    const es = buildAmazonLink("B0ABC12345", "es", "t-21");
    const com = buildAmazonLink("B0ABC12345", "com", "t-21");
    expect(es).toContain("amazon.es");
    expect(com).toContain("amazon.com");
  });

  it("string invalido (no ASIN, no URL) devuelve original", () => {
    expect(buildAmazonLink("nope")).toBe("nope");
    expect(buildAmazonLink("B0X")).toBe("B0X"); // 3 chars no ASIN
  });
});

describe("buildAmazonSearchLink", () => {
  it("escape query", () => {
    const url = buildAmazonSearchLink("mochila 40L cabina");
    expect(url).toContain("amazon.es/s?k=mochila%2040L%20cabina");
  });
});
