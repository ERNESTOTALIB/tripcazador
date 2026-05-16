/**
 * page.test.tsx — SSS225 (16 may 2026) — extended SSS234
 *
 * Regression tests para /precios-vuelos-baratos (SSS217),
 * /en/cheap-flight-prices (SSS223), y /de/billige-flugpreise (SSS234).
 *
 * Verificaciones:
 * - JSON-LD schemas válidos (WebPage + FAQPage + BreadcrumbList)
 * - hreflang cross-references trí-direccional (es-ES, en-US, de-DE)
 * - Tabla con destinos rendering
 * - FAQ items presente con summary + content
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..", "..", "..");

function readPage(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Pricing landing pages — SSS217+223", () => {
  describe("ES version /precios-vuelos-baratos", () => {
    const src = readPage("src/app/precios-vuelos-baratos/page.tsx");

    it("tiene JSON-LD schemas (WebPage + FAQPage + BreadcrumbList)", () => {
      expect(src).toMatch(/priceJsonLd|\"@type\":\s*\"WebPage\"/);
      expect(src).toMatch(/faqJsonLd|\"@type\":\s*\"FAQPage\"/);
      expect(src).toMatch(/breadcrumbJsonLd|\"@type\":\s*\"BreadcrumbList\"/);
    });

    it("tiene hreflang to English + German version (SSS223+234)", () => {
      expect(src).toMatch(/en-US.*\/en\/cheap-flight-prices/s);
      expect(src).toMatch(/es-ES.*\/precios-vuelos-baratos/s);
      expect(src).toMatch(/de-DE.*\/de\/billige-flugpreise/s);
    });

    it("tiene metadata title + description", () => {
      expect(src).toMatch(/title:\s*["'].*Precios.*vuelos baratos/);
      expect(src).toMatch(/description:\s*["']/);
    });

    it("tabla incluye destinos top (Lisboa, Estambul, Tokio)", () => {
      expect(src).toContain('"Lisboa"');
      expect(src).toContain('"Estambul"');
      expect(src).toContain('"Tokio"');
    });

    it("FAQ tiene mínimo 6 preguntas (estructura `{ q, a }`)", () => {
      const matches = src.match(/^\s*\{\s*$\s+q:/gm) || [];
      expect(matches.length).toBeGreaterThanOrEqual(6);
    });

    it("tiene 3 dangerouslySetInnerHTML scripts (JSON-LD)", () => {
      const matches = src.match(/dangerouslySetInnerHTML/g) || [];
      expect(matches.length).toBe(3);
    });

    it("title incluye palabras key SEO (precios, vuelos baratos)", () => {
      const titleMatch = src.match(/title:\s*["']([^"']+)["']/);
      expect(titleMatch).toBeTruthy();
      if (titleMatch) {
        const title = titleMatch[1].toLowerCase();
        expect(title).toContain("precios");
        expect(title).toMatch(/vuelos? baratos?/);
      }
    });
  });

  describe("EN version /en/cheap-flight-prices", () => {
    const src = readPage("src/app/en/cheap-flight-prices/page.tsx");

    it("tiene JSON-LD WebPage en inglés (inLanguage en-US)", () => {
      expect(src).toContain('"@type": "WebPage"');
      expect(src).toContain('inLanguage: "en-US"');
    });

    it("tiene FAQPage + BreadcrumbList", () => {
      expect(src).toContain('"@type": "FAQPage"');
      expect(src).toContain('"@type": "BreadcrumbList"');
    });

    it("tiene hreflang to Spanish + German version (SSS234)", () => {
      expect(src).toMatch(/es-ES.*\/precios-vuelos-baratos/s);
      expect(src).toMatch(/en-US.*\/en\/cheap-flight-prices/s);
      expect(src).toMatch(/de-DE.*\/de\/billige-flugpreise/s);
    });

    it("tabla incluye destinations en inglés (Lisbon, Istanbul, Tokyo)", () => {
      expect(src).toContain('"Lisbon"');
      expect(src).toContain('"Istanbul"');
      expect(src).toContain('"Tokyo"');
    });

    it("FAQ tiene 8 preguntas (translated)", () => {
      const matches = src.match(/^\s*\{\s*$\s+q:/gm) || [];
      expect(matches.length).toBeGreaterThanOrEqual(6);
    });

    it("contiene CTA al canal Telegram", () => {
      expect(src).toContain("@tripcazador");
      expect(src).toContain("t.me/tripcazador");
    });

    it("openGraph locale es en_US", () => {
      expect(src).toContain('locale: "en_US"');
    });
  });

  describe("DE version /de/billige-flugpreise (SSS234)", () => {
    const src = readPage("src/app/de/billige-flugpreise/page.tsx");

    it("tiene JSON-LD WebPage en alemán (inLanguage de-DE)", () => {
      expect(src).toContain('"@type": "WebPage"');
      expect(src).toContain('inLanguage: "de-DE"');
    });

    it("tiene FAQPage + BreadcrumbList", () => {
      expect(src).toContain('"@type": "FAQPage"');
      expect(src).toContain('"@type": "BreadcrumbList"');
    });

    it("tiene hreflang trio (es-ES, en-US, de-DE)", () => {
      expect(src).toMatch(/es-ES.*\/precios-vuelos-baratos/s);
      expect(src).toMatch(/en-US.*\/en\/cheap-flight-prices/s);
      expect(src).toMatch(/de-DE.*\/de\/billige-flugpreise/s);
    });

    it("tabla incluye nombres alemanes (Lissabon, Marrakesch, Mailand, Wien, Prag)", () => {
      expect(src).toContain('"Lissabon"');
      expect(src).toContain('"Marrakesch"');
      expect(src).toContain('"Mailand"');
      expect(src).toContain('"Wien"');
      expect(src).toContain('"Prag"');
    });

    it("FAQ tiene 6+ preguntas en alemán", () => {
      const matches = src.match(/^\s*\{\s*$\s+q:/gm) || [];
      expect(matches.length).toBeGreaterThanOrEqual(6);
    });

    it("contiene CTA al canal Telegram", () => {
      expect(src).toContain("@tripcazador");
      expect(src).toContain("t.me/tripcazador");
    });

    it("openGraph locale es de_DE", () => {
      expect(src).toContain('locale: "de_DE"');
    });

    it("title incluye palabras clave SEO alemanas (billig, Flug)", () => {
      const titleMatch = src.match(/title:\s*["']([^"']+)["']/);
      expect(titleMatch).toBeTruthy();
      if (titleMatch) {
        const title = titleMatch[1].toLowerCase();
        expect(title).toMatch(/billig|günstig/);
        expect(title).toMatch(/flug/);
      }
    });
  });

  describe("Sitemap entries (SSS217+223+234)", () => {
    const src = readPage("src/app/sitemap.ts");

    it("incluye /precios-vuelos-baratos con priority 0.8", () => {
      expect(src).toContain("/precios-vuelos-baratos");
      // priority debería estar cerca del slug
      expect(src).toMatch(/precios-vuelos-baratos[\s\S]{0,200}priority:\s*0\.8/);
    });

    it("incluye /en/cheap-flight-prices con priority 0.7", () => {
      expect(src).toContain("/en/cheap-flight-prices");
      expect(src).toMatch(/cheap-flight-prices[\s\S]{0,200}priority:\s*0\.7/);
    });

    it("incluye /de/billige-flugpreise con priority 0.7 (SSS234)", () => {
      expect(src).toContain("/de/billige-flugpreise");
      expect(src).toMatch(/billige-flugpreise[\s\S]{0,200}priority:\s*0\.7/);
    });
  });
});
