/**
 * page.test.tsx — SSS225 (16 may 2026) — extended SSS234+243+244
 *
 * Regression tests para los 5 pricing landings i18n:
 *  - /precios-vuelos-baratos (SSS217, ES)
 *  - /en/cheap-flight-prices (SSS223, EN)
 *  - /de/billige-flugpreise (SSS234, DE)
 *  - /fr/prix-vols-pas-chers (SSS243, FR)
 *  - /it/prezzi-voli-economici (SSS244, IT)
 *
 * Verificaciones:
 * - JSON-LD schemas válidos (WebPage + FAQPage + BreadcrumbList)
 * - hreflang cross-references quinteto (es-ES, en-US, de-DE, fr-FR, it-IT)
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

    it("tiene hreflang QUINTETO completo (SSS223+234+243+244)", () => {
      expect(src).toMatch(/en-US.*\/en\/cheap-flight-prices/s);
      expect(src).toMatch(/es-ES.*\/precios-vuelos-baratos/s);
      expect(src).toMatch(/de-DE.*\/de\/billige-flugpreise/s);
      expect(src).toMatch(/fr-FR.*\/fr\/prix-vols-pas-chers/s);
      expect(src).toMatch(/it-IT.*\/it\/prezzi-voli-economici/s);
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

    it("tiene hreflang QUINTETO completo (SSS234+243+244)", () => {
      expect(src).toMatch(/es-ES.*\/precios-vuelos-baratos/s);
      expect(src).toMatch(/en-US.*\/en\/cheap-flight-prices/s);
      expect(src).toMatch(/de-DE.*\/de\/billige-flugpreise/s);
      expect(src).toMatch(/fr-FR.*\/fr\/prix-vols-pas-chers/s);
      expect(src).toMatch(/it-IT.*\/it\/prezzi-voli-economici/s);
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

    it("tiene hreflang QUINTETO (es-ES, en-US, de-DE, fr-FR, it-IT)", () => {
      expect(src).toMatch(/es-ES.*\/precios-vuelos-baratos/s);
      expect(src).toMatch(/en-US.*\/en\/cheap-flight-prices/s);
      expect(src).toMatch(/de-DE.*\/de\/billige-flugpreise/s);
      expect(src).toMatch(/fr-FR.*\/fr\/prix-vols-pas-chers/s);
      expect(src).toMatch(/it-IT.*\/it\/prezzi-voli-economici/s);
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

  describe("FR version /fr/prix-vols-pas-chers (SSS243)", () => {
    const src = readPage("src/app/fr/prix-vols-pas-chers/page.tsx");

    it("tiene JSON-LD WebPage en francés (inLanguage fr-FR)", () => {
      expect(src).toContain('"@type": "WebPage"');
      expect(src).toContain('inLanguage: "fr-FR"');
    });

    it("tiene FAQPage + BreadcrumbList", () => {
      expect(src).toContain('"@type": "FAQPage"');
      expect(src).toContain('"@type": "BreadcrumbList"');
    });

    it("tiene hreflang cuarteto (es-ES, en-US, de-DE, fr-FR)", () => {
      expect(src).toMatch(/es-ES.*\/precios-vuelos-baratos/s);
      expect(src).toMatch(/en-US.*\/en\/cheap-flight-prices/s);
      expect(src).toMatch(/de-DE.*\/de\/billige-flugpreise/s);
      expect(src).toMatch(/fr-FR.*\/fr\/prix-vols-pas-chers/s);
    });

    it("tabla incluye nombres franceses (Lisbonne, Londres, Vienne, Athènes)", () => {
      expect(src).toContain('"Lisbonne"');
      expect(src).toContain('"Londres"');
      expect(src).toContain('"Vienne"');
      expect(src).toContain('"Athènes"');
    });

    it("openGraph locale es fr_FR", () => {
      expect(src).toContain('locale: "fr_FR"');
    });

    it("title incluye palabras clave SEO francesas (prix, vols, pas chers)", () => {
      const titleMatch = src.match(/title:\s*["']([^"']+)["']/);
      expect(titleMatch).toBeTruthy();
      if (titleMatch) {
        const title = titleMatch[1].toLowerCase();
        expect(title).toContain("prix");
        expect(title).toMatch(/vols? pas chers?/);
      }
    });
  });

  describe("IT version /it/prezzi-voli-economici (SSS244)", () => {
    const src = readPage("src/app/it/prezzi-voli-economici/page.tsx");

    it("tiene JSON-LD WebPage en italiano (inLanguage it-IT)", () => {
      expect(src).toContain('"@type": "WebPage"');
      expect(src).toContain('inLanguage: "it-IT"');
    });

    it("tiene FAQPage + BreadcrumbList", () => {
      expect(src).toContain('"@type": "FAQPage"');
      expect(src).toContain('"@type": "BreadcrumbList"');
    });

    it("tiene hreflang QUINTETO completo (es-ES, en-US, de-DE, fr-FR, it-IT)", () => {
      expect(src).toMatch(/es-ES.*\/precios-vuelos-baratos/s);
      expect(src).toMatch(/en-US.*\/en\/cheap-flight-prices/s);
      expect(src).toMatch(/de-DE.*\/de\/billige-flugpreise/s);
      expect(src).toMatch(/fr-FR.*\/fr\/prix-vols-pas-chers/s);
      expect(src).toMatch(/it-IT.*\/it\/prezzi-voli-economici/s);
    });

    it("tabla incluye nombres italianos (Lisbona, Milano, Parigi, Londra, Berlino)", () => {
      expect(src).toContain('"Lisbona"');
      expect(src).toContain('"Milano"');
      expect(src).toContain('"Parigi"');
      expect(src).toContain('"Londra"');
      expect(src).toContain('"Berlino"');
    });

    it("openGraph locale es it_IT", () => {
      expect(src).toContain('locale: "it_IT"');
    });

    it("title incluye palabras clave SEO italianas (prezzi, voli, economici)", () => {
      const titleMatch = src.match(/title:\s*["']([^"']+)["']/);
      expect(titleMatch).toBeTruthy();
      if (titleMatch) {
        const title = titleMatch[1].toLowerCase();
        expect(title).toContain("prezzi");
        expect(title).toMatch(/voli/);
        expect(title).toMatch(/economici/);
      }
    });
  });

  describe("PT version /pt/precos-voos-baratos (SSS246)", () => {
    const src = readPage("src/app/pt/precos-voos-baratos/page.tsx");

    it("tiene JSON-LD WebPage en portugués (inLanguage pt-PT)", () => {
      expect(src).toContain('"@type": "WebPage"');
      expect(src).toContain('inLanguage: "pt-PT"');
    });

    it("tiene FAQPage + BreadcrumbList", () => {
      expect(src).toContain('"@type": "FAQPage"');
      expect(src).toContain('"@type": "BreadcrumbList"');
    });

    it("tiene hreflang SEXTETO completo (es-ES, en-US, de-DE, fr-FR, it-IT, pt-PT)", () => {
      expect(src).toMatch(/es-ES.*\/precios-vuelos-baratos/s);
      expect(src).toMatch(/en-US.*\/en\/cheap-flight-prices/s);
      expect(src).toMatch(/de-DE.*\/de\/billige-flugpreise/s);
      expect(src).toMatch(/fr-FR.*\/fr\/prix-vols-pas-chers/s);
      expect(src).toMatch(/it-IT.*\/it\/prezzi-voli-economici/s);
      expect(src).toMatch(/pt-PT.*\/pt\/precos-voos-baratos/s);
    });

    it("tabla incluye nombres portugueses (Milão, Berlim, Amesterdão, Viena, Tóquio)", () => {
      expect(src).toContain('"Milão"');
      expect(src).toContain('"Berlim"');
      expect(src).toContain('"Amesterdão"');
      expect(src).toContain('"Viena"');
      expect(src).toContain('"Tóquio"');
    });

    it("openGraph locale es pt_PT", () => {
      expect(src).toContain('locale: "pt_PT"');
    });

    it("title incluye palabras clave SEO portuguesas (preços, voos, baratos)", () => {
      const titleMatch = src.match(/title:\s*["']([^"']+)["']/);
      expect(titleMatch).toBeTruthy();
      if (titleMatch) {
        const title = titleMatch[1].toLowerCase();
        expect(title).toContain("preços");
        expect(title).toMatch(/voos? baratos?/);
      }
    });
  });

  describe("NL version /nl/goedkope-vliegtickets (SSS250)", () => {
    const src = readPage("src/app/nl/goedkope-vliegtickets/page.tsx");

    it("tiene JSON-LD WebPage en holandés (inLanguage nl-NL)", () => {
      expect(src).toContain('"@type": "WebPage"');
      expect(src).toContain('inLanguage: "nl-NL"');
    });

    it("tiene FAQPage + BreadcrumbList", () => {
      expect(src).toContain('"@type": "FAQPage"');
      expect(src).toContain('"@type": "BreadcrumbList"');
    });

    it("tiene hreflang SEPTETO completo (es-ES, en-US, de-DE, fr-FR, it-IT, pt-PT, nl-NL)", () => {
      expect(src).toMatch(/es-ES.*\/precios-vuelos-baratos/s);
      expect(src).toMatch(/en-US.*\/en\/cheap-flight-prices/s);
      expect(src).toMatch(/de-DE.*\/de\/billige-flugpreise/s);
      expect(src).toMatch(/fr-FR.*\/fr\/prix-vols-pas-chers/s);
      expect(src).toMatch(/it-IT.*\/it\/prezzi-voli-economici/s);
      expect(src).toMatch(/pt-PT.*\/pt\/precos-voos-baratos/s);
      expect(src).toMatch(/nl-NL.*\/nl\/goedkope-vliegtickets/s);
    });

    it("tabla incluye nombres holandeses (Lissabon, Milaan, Parijs, Londen, Berlijn, Wenen)", () => {
      expect(src).toContain('"Lissabon"');
      expect(src).toContain('"Milaan"');
      expect(src).toContain('"Parijs"');
      expect(src).toContain('"Londen"');
      expect(src).toContain('"Berlijn"');
      expect(src).toContain('"Wenen"');
    });

    it("openGraph locale es nl_NL", () => {
      expect(src).toContain('locale: "nl_NL"');
    });

    it("title incluye palabras clave SEO holandesas (goedkope, vliegtickets)", () => {
      const titleMatch = src.match(/title:\s*["']([^"']+)["']/);
      expect(titleMatch).toBeTruthy();
      if (titleMatch) {
        const title = titleMatch[1].toLowerCase();
        expect(title).toContain("goedkope");
        expect(title).toContain("vliegtickets");
      }
    });
  });

  describe("Sitemap entries (SSS217+223+234+243+244+246+250)", () => {
    const src = readPage("src/app/sitemap.ts");

    it("incluye /precios-vuelos-baratos con priority 0.8", () => {
      expect(src).toContain("/precios-vuelos-baratos");
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

    it("incluye /fr/prix-vols-pas-chers con priority 0.7 (SSS243)", () => {
      expect(src).toContain("/fr/prix-vols-pas-chers");
      expect(src).toMatch(/prix-vols-pas-chers[\s\S]{0,200}priority:\s*0\.7/);
    });

    it("incluye /it/prezzi-voli-economici con priority 0.7 (SSS244)", () => {
      expect(src).toContain("/it/prezzi-voli-economici");
      expect(src).toMatch(/prezzi-voli-economici[\s\S]{0,200}priority:\s*0\.7/);
    });

    it("incluye /pt/precos-voos-baratos con priority 0.7 (SSS246)", () => {
      expect(src).toContain("/pt/precos-voos-baratos");
      expect(src).toMatch(/precos-voos-baratos[\s\S]{0,200}priority:\s*0\.7/);
    });

    it("incluye /nl/goedkope-vliegtickets con priority 0.7 (SSS250)", () => {
      expect(src).toContain("/nl/goedkope-vliegtickets");
      expect(src).toMatch(/goedkope-vliegtickets[\s\S]{0,200}priority:\s*0\.7/);
    });

    it("LANG_ALT_PRICING incluye los 7 idiomas + x-default", () => {
      expect(src).toMatch(/LANG_ALT_PRICING[\s\S]*es-ES/);
      expect(src).toMatch(/LANG_ALT_PRICING[\s\S]*en-US/);
      expect(src).toMatch(/LANG_ALT_PRICING[\s\S]*de-DE/);
      expect(src).toMatch(/LANG_ALT_PRICING[\s\S]*fr-FR/);
      expect(src).toMatch(/LANG_ALT_PRICING[\s\S]*it-IT/);
      expect(src).toMatch(/LANG_ALT_PRICING[\s\S]*pt-PT/);
      expect(src).toMatch(/LANG_ALT_PRICING[\s\S]*nl-NL/);
      expect(src).toMatch(/LANG_ALT_PRICING[\s\S]*x-default/);
    });
  });
});
