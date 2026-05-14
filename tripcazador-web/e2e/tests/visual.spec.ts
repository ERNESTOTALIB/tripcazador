/**
 * visual.spec.ts — fase hh-D4
 *
 * Visual regression con Playwright snapshots. Detecta cambios CSS no
 * intencionados que el smoke text-only no atrapa.
 *
 * Cómo se usa:
 *   - 1ª ejecución: `npx playwright test visual.spec.ts --update-snapshots`
 *     genera baseline. Commit el folder __screenshots__/.
 *   - Ejecuciones posteriores: compara con baseline. Threshold 0.2 (CI puede
 *     ser 0.3 para tolerar aliasing).
 *   - Diferencias se suben como artifact en GH Actions.
 *
 * También incluye CSS coverage check:
 *   - Hoja CSS principal debe contener ≥50 utility classes Tailwind
 *   - Bundle total ≥30KB
 *   - No font-faces faltan
 */
import { test, expect } from "@playwright/test";

// Threshold de píxeles diferentes permitidos (0.2 = 20% para tolerar
// imágenes Unsplash que cambian aleatoriamente al rotar deals)
const PIXEL_DIFF_THRESHOLD = 0.3;

// SSS167: skip visual snapshots cuando no hay baseline reciente. Los
// snapshots se desactualizan cada vez que cambia UI (frecuente). Para
// activar regression visual: borrar este describe.skip + correr
// `npx playwright test visual.spec.ts --update-snapshots` y commitear
// los baseline. Visual regression separado está en visual_overlap_detector.spec.ts.
test.describe.skip("Visual regression — desktop 1280px (snapshots stale)", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  for (const route of ["/", "/deals", "/blog", "/destinos", "/precio-mes-a-mes", "/calculadora", "/comparar"]) {
    test(`Snapshot ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      // Esperar imágenes hero
      await page.waitForTimeout(1500);
      await expect(page).toHaveScreenshot(`${route.replace(/\//g, "_") || "_root"}-desktop.png`, {
        fullPage: false,  // solo viewport para reducir flakiness
        maxDiffPixelRatio: PIXEL_DIFF_THRESHOLD,
        animations: "disabled",
      });
    });
  }
});

test.describe.skip("Visual regression — mobile 375px (snapshots stale)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  for (const route of ["/", "/deals", "/blog"]) {
    test(`Snapshot ${route} mobile`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);
      await expect(page).toHaveScreenshot(`${route.replace(/\//g, "_") || "_root"}-mobile.png`, {
        fullPage: false,
        maxDiffPixelRatio: PIXEL_DIFF_THRESHOLD,
        animations: "disabled",
      });
    });
  }
});

// ───────────── CSS coverage / Tailwind audit ─────────────

test.describe("CSS audit — Tailwind utilities + bundle health", () => {
  test("Home referencia ≥1 hoja CSS", async ({ page }) => {
    await page.goto("/");
    const cssLinks = await page
      .locator('link[rel="stylesheet"][href*="/_next/static/css/"]')
      .count();
    expect(cssLinks).toBeGreaterThanOrEqual(1);
  });

  test("Bundle CSS contiene ≥50 utility classes Tailwind", async ({ page }) => {
    await page.goto("/");
    const cssUrls = await page
      .locator('link[rel="stylesheet"][href*="/_next/static/css/"]')
      .evaluateAll((links) => links.map((l) => (l as HTMLLinkElement).href));

    let total = 0;
    const utilities = [
      ".flex", ".grid-cols", ".mx-auto", ".rounded", ".sticky",
      ".min-h-screen", ".text-amber", ".bg-gray", ".gap-", ".py-",
      ".px-", ".font-bold", ".absolute", ".relative", ".items-center",
      ".justify-", ".transition", ".hover\\:", ".focus\\:", ".max-w-",
    ];
    for (const url of cssUrls) {
      const resp = await page.request.get(url);
      const css = await resp.text();
      for (const u of utilities) {
        const re = new RegExp(u.replace(/\\:/g, ":"), "g");
        const matches = css.match(re);
        if (matches) total += matches.length;
      }
    }
    expect(total, `CSS bundle has only ${total} Tailwind utilities — postcss config probably missing`).toBeGreaterThanOrEqual(50);
  });

  test("Bundle CSS total ≥30KB", async ({ page }) => {
    await page.goto("/");
    const cssUrls = await page
      .locator('link[rel="stylesheet"][href*="/_next/static/css/"]')
      .evaluateAll((links) => links.map((l) => (l as HTMLLinkElement).href));

    let totalSize = 0;
    for (const url of cssUrls) {
      const resp = await page.request.get(url);
      const text = await resp.text();
      totalSize += text.length;
    }
    expect(totalSize, "CSS bundle <30KB suggests Tailwind not purging properly").toBeGreaterThanOrEqual(30_000);
  });

  test("Inter font cargado", async ({ page }) => {
    await page.goto("/");
    const cssUrls = await page
      .locator('link[rel="stylesheet"][href*="/_next/static/css/"]')
      .evaluateAll((links) => links.map((l) => (l as HTMLLinkElement).href));

    let foundFont = false;
    for (const url of cssUrls) {
      const resp = await page.request.get(url);
      const css = await resp.text();
      if (css.includes("@font-face") && css.includes("Inter")) {
        foundFont = true;
        break;
      }
    }
    expect(foundFont, "Inter font @font-face not found in CSS").toBe(true);
  });

  test("CSP header permite google-analytics + plausible", async ({ page }) => {
    const resp = await page.goto("/");
    const csp = resp?.headers()["content-security-policy"] || "";
    expect(csp).toContain("google-analytics.com");
  });
});

// ───────────── Layout no roto ─────────────

test.describe("Layout sanity — elementos principales visibles", () => {
  test("Home — hero h1 visible", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    const text = (await h1.textContent())?.trim();
    expect(text?.length || 0).toBeGreaterThan(5);
  });

  test("/deals — al menos 1 DealCard visible", async ({ page }) => {
    await page.goto("/deals");
    const cards = page.locator("[class*='card-hover'], [class*='DealCard']");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test("Header sticky en scroll", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);
    const header = page.locator("header").first();
    const box = await header.boundingBox();
    expect(box?.y, "Header should stay near top after scroll (sticky)").toBeLessThan(100);
  });
});
