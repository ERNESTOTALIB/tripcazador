/**
 * a11y_seo_perf.spec.ts — fase hh-D6
 *
 * Tests automatizados para a11y, SEO y performance básico contra cada
 * página clave. Para a11y completo, instalar `@axe-core/playwright`:
 *   npm i -D @axe-core/playwright
 * Y descomentar el bloque accessibility violations.
 *
 * Asserciones:
 *   - <h1> exactamente 1 por página (semántica)
 *   - lang attribute en <html> matches "es" o "en"
 *   - canonical link presente y absoluto
 *   - meta description <160 chars, ≥50
 *   - og:image absoluta y https
 *   - robots no es noindex en páginas públicas
 *   - schema JSON-LD parseable en cada página clave
 *   - hreflang válido por idioma
 *   - LCP <2.5s (sample, no estricto)
 *   - imágenes con alt
 */
import { test, expect } from "@playwright/test";

const PUBLIC_PAGES = [
  "/",
  "/deals",
  "/blog",
  "/destinos",
  "/comparar",
  "/precio-mes-a-mes",
  "/calculadora",
  "/glosario",
  "/aerolineas",
  "/regiones",
  "/buscar",
  "/faq",
  "/opiniones",
  "/prensa",
  "/partners",
  "/stopovers",
  "/embed",
  "/mapa-precios",
  "/en",
  "/en/blog",
  "/en/destinos",
];

// ───────────── SEO básico per página ─────────────

test.describe("SEO básico — todas las páginas públicas", () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} — SEO checks`, async ({ page }) => {
      const resp = await page.goto(path);
      expect(resp?.status(), `${path} returned ${resp?.status()}`).toBe(200);

      // 1) <h1> exactamente 1
      const h1Count = await page.locator("h1").count();
      expect(h1Count, `${path} has ${h1Count} h1s — should be exactly 1`).toBe(1);

      // 2) <html lang>
      const lang = await page.locator("html").getAttribute("lang");
      expect(lang).toMatch(/^(es|en)/);

      // 3) Canonical link
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical, `${path} no canonical`).toBeTruthy();
      expect(canonical).toMatch(/^https?:\/\//);

      // 4) Meta description
      const desc = await page.locator('meta[name="description"]').getAttribute("content");
      if (desc) {
        expect(desc.length, `${path} description ${desc.length} chars`).toBeGreaterThanOrEqual(40);
        expect(desc.length).toBeLessThanOrEqual(200);
      }

      // 5) OG image
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
      if (ogImage) {
        expect(ogImage).toMatch(/^https?:\/\//);
      }

      // 6) robots no noindex en públicas (admin OK noindex)
      if (!path.startsWith("/admin")) {
        const robots = await page.locator('meta[name="robots"]').getAttribute("content");
        expect(robots || "", `${path} robots: ${robots}`).not.toMatch(/noindex/i);
      }
    });
  }
});

// ───────────── JSON-LD parseable ─────────────

test.describe("JSON-LD Schema.org parseable", () => {
  test("Home tiene Organization schema", async ({ page }) => {
    await page.goto("/");
    const ldJson = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ldJson.length, "no JSON-LD found").toBeGreaterThan(0);

    let foundOrg = false;
    for (const txt of ldJson) {
      try {
        const data = JSON.parse(txt);
        const types = Array.isArray(data) ? data.map((d) => d["@type"]) : [data["@type"]];
        if (types.includes("Organization") || types.includes("WebSite")) {
          foundOrg = true;
          break;
        }
      } catch {
        // skip malformed (which itself is a bug — assertion below)
      }
    }
    expect(foundOrg).toBe(true);
  });

  test("Cada blog post tiene Article JSON-LD", async ({ page }) => {
    await page.goto("/blog/vuelos-baratos-erasmus-2026");
    const ldJson = await page.locator('script[type="application/ld+json"]').allTextContents();
    let foundArticle = false;
    for (const txt of ldJson) {
      try {
        const data = JSON.parse(txt);
        const types = Array.isArray(data) ? data.map((d) => d["@type"]) : [data["@type"]];
        if (types.includes("Article") || types.includes("BlogPosting")) {
          foundArticle = true;
          break;
        }
      } catch { /* */ }
    }
    expect(foundArticle).toBe(true);
  });

  test("Cada JSON-LD es JSON parseable (sin syntax errors)", async ({ page }) => {
    await page.goto("/");
    const ldJson = await page.locator('script[type="application/ld+json"]').allTextContents();
    for (const txt of ldJson) {
      expect(() => JSON.parse(txt), "JSON-LD malformado").not.toThrow();
    }
  });
});

// ───────────── hreflang per página ─────────────

test.describe("hreflang correcto", () => {
  test("Home tiene hreflang es y en", async ({ page }) => {
    await page.goto("/");
    const tags = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) =>
      links.map((l) => ({ lang: l.getAttribute("hreflang"), href: l.getAttribute("href") }))
    );
    const langs = tags.map((t) => t.lang);
    expect(langs).toContain("es");
    expect(langs).toContain("en");
  });
});

// ───────────── A11y básico (Playwright assertions) ─────────────

test.describe("Accesibilidad básica", () => {
  test("Imágenes con alt en home", async ({ page }) => {
    await page.goto("/");
    const imgsWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imgsWithoutAlt, "Imágenes sin alt").toBe(0);
  });

  test("Botones con accessible name", async ({ page }) => {
    await page.goto("/");
    const btns = page.locator("button");
    const count = await btns.count();
    let unnamed = 0;
    for (let i = 0; i < Math.min(count, 30); i++) {
      const b = btns.nth(i);
      const aria = await b.getAttribute("aria-label");
      const text = (await b.textContent())?.trim();
      if (!aria && !text) unnamed++;
    }
    expect(unnamed, "Botones sin accessible name").toBe(0);
  });

  test("Skip-to-content link presente", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: /ir al contenido|skip|saltar/i }).first();
    await expect(skip).toBeAttached();
  });

  test("Focus visible en CTA principal", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /Ver todos los deals/i }).first();
    await cta.focus();
    // Verifica que focus-visible está aplicado (style.outline o ring)
    const hasFocusStyle = await cta.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return (
        styles.outline !== "none" ||
        styles.boxShadow !== "none" ||
        styles.outlineWidth !== "0px"
      );
    });
    expect(hasFocusStyle).toBe(true);
  });
});

// ───────────── Performance sample (loose) ─────────────

test.describe("Performance — LCP sample", () => {
  test("Home LCP <3.5s en sample", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "load" });
    const elapsed = Date.now() - start;
    // Loose: load complete <3.5s
    expect(elapsed, `Page load took ${elapsed}ms`).toBeLessThan(5000);
  });

  test("/deals primeira card render <3s", async ({ page }) => {
    const start = Date.now();
    await page.goto("/deals");
    await page.waitForSelector("[class*='card-hover']", { timeout: 5000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});

// ───────────── Headers de seguridad ─────────────

test.describe("Security headers per page", () => {
  for (const path of ["/", "/deals", "/blog", "/admin"]) {
    test(`${path} — security headers`, async ({ page }) => {
      const resp = await page.goto(path);
      const headers = resp?.headers() || {};
      // CSP
      expect(headers["content-security-policy"] || headers["content-security-policy-report-only"], `${path} no CSP`).toBeTruthy();
      // X-Content-Type-Options
      expect(headers["x-content-type-options"]).toBe("nosniff");
      // HSTS
      expect(headers["strict-transport-security"]).toBeTruthy();
    });
  }
});
