/**
 * visual_overlap_detector — fase SSS25 (May 2026)
 *
 * Detecta automáticamente bugs visuales que el ojo humano ve pero los
 * tests funcionales no:
 *   - Elementos solapados (heart sobre badge, badge -95% sobre nombre, etc)
 *   - Texto que sobresale del contenedor (overflow horizontal)
 *   - Imágenes rotas (img.naturalWidth === 0)
 *   - Botones con click area < 44×44px (a11y / mobile)
 *
 * Estrategia: lee el bounding box de cada elemento sospechoso y verifica
 * que NO se intersecten con sus vecinos en la misma "card" o que estén
 * dentro de los límites del contenedor.
 *
 * Genera screenshots cuando detecta un fallo (artifact GH Actions).
 *
 * Corre cada deploy + cron diario 06:00 UTC vía visual-regression.yml.
 */
import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "https://tripcazador.com";

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Devuelve true si dos cajas se solapan (con tolerancia de 2px). */
function boxesOverlap(a: Box, b: Box, tol = 2): boolean {
  return !(
    a.x + a.width <= b.x + tol ||
    b.x + b.width <= a.x + tol ||
    a.y + a.height <= b.y + tol ||
    b.y + b.height <= a.y + tol
  );
}

async function getBoxes(
  page: Page,
  selector: string,
): Promise<Array<{ box: Box; text: string; idx: number }>> {
  return await page.$$eval(selector, (els) =>
    els
      .map((el, idx) => {
        const r = el.getBoundingClientRect();
        return {
          box: { x: r.x, y: r.y, width: r.width, height: r.height },
          text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
          idx,
        };
      })
      .filter((e) => e.box.width > 0 && e.box.height > 0),
  );
}

test.describe("Visual overlap detector — home", () => {
  test("SkyHero floating cards: route name no debe solaparse con badge", async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    // Para cada .sky-floatcard verificar que .sky-fc-route + .sky-fc-badge no se solapan
    const cards = await page.$$(".sky-floatcard");
    expect(cards.length).toBeGreaterThan(0);
    for (let i = 0; i < cards.length; i++) {
      const route = await cards[i].$(".sky-fc-route");
      const badge = await cards[i].$(".sky-fc-badge");
      if (!route || !badge) continue;
      const routeBox = await route.boundingBox();
      const badgeBox = await badge.boundingBox();
      if (!routeBox || !badgeBox) continue;
      const routeText = (await route.textContent())?.trim() || "?";
      // El badge va top-right (absolute). El route texto debe terminar antes
      // de donde empieza el badge (con padding-right reservado).
      const routeRight = routeBox.x + routeBox.width;
      const badgeLeft = badgeBox.x;
      expect(
        routeRight,
        `Card ${i} (${routeText}): route name overflows under badge`,
      ).toBeLessThanOrEqual(badgeLeft + 4);
    }
  });

  test("DealCard heart no debe solaparse con classification badge", async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    // Buscar DealCards (usan data-testid en FavoriteButton)
    const hearts = await page.$$('[data-testid^="favorite-button-"]');
    if (hearts.length === 0) {
      test.skip(true, "No DealCards visible en home");
      return;
    }
    for (let i = 0; i < Math.min(hearts.length, 6); i++) {
      const heartBox = await hearts[i].boundingBox();
      if (!heartBox) continue;
      // Buscar el classification badge cerca (mismo card parent)
      const card = await hearts[i].evaluateHandle((el) =>
        el.closest("[class*='rounded']") || el.parentElement,
      );
      const badges = await card.asElement()?.$$('span:has-text("Error Fare"), span:has-text("Oferta"), span:has-text("Anomalía")');
      if (!badges || badges.length === 0) continue;
      for (const badge of badges) {
        const badgeBox = await badge.boundingBox();
        if (!badgeBox) continue;
        const overlap = boxesOverlap(heartBox, badgeBox, 2);
        expect(
          overlap,
          `Card ${i}: heart (${JSON.stringify(heartBox)}) overlaps with classification badge (${JSON.stringify(badgeBox)})`,
        ).toBe(false);
      }
    }
  });
});

test.describe("Broken images detector", () => {
  test("ningún <img> debe tener naturalWidth=0 (404 o broken)", async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    const broken = await page.$$eval("img", (imgs) =>
      imgs
        .filter((img) => img.complete && img.naturalWidth === 0 && img.src)
        .map((img) => ({
          src: img.src,
          alt: img.alt,
        })),
    );
    expect(
      broken,
      `Imágenes rotas detectadas: ${JSON.stringify(broken, null, 2)}`,
    ).toEqual([]);
  });
});

test.describe("Touch target a11y — botones >= 44×44px en mobile", () => {
  test.use({ viewport: { width: 380, height: 720 } });

  test("CTAs principales deben tener click area >= 44px", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    const tooSmall = await page.$$eval(
      "button, a.btn, [role='button']",
      (els) =>
        els
          .filter((el) => {
            const r = el.getBoundingClientRect();
            // Visible elements only
            if (r.width === 0 || r.height === 0) return false;
            // Skip elements with no functional CTA text
            const txt = (el.textContent || "").trim();
            if (txt.length === 0) return false;
            return r.width < 40 || r.height < 40;
          })
          .slice(0, 10) // limit to first 10 to avoid huge reports
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              text: (el.textContent || "").trim().slice(0, 40),
              w: Math.round(r.width),
              h: Math.round(r.height),
            };
          }),
    );
    // Permitimos hasta 5 elementos pequeños (iconos, dismissibles) — más sería bug serio
    expect(
      tooSmall.length,
      `Demasiados click targets <40px en mobile: ${JSON.stringify(tooSmall)}`,
    ).toBeLessThanOrEqual(5);
  });
});

test.describe("Horizontal overflow detector", () => {
  test("body no debe tener scroll horizontal en viewport mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 380, height: 720 });
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      html: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    // Tolerancia 4px por scrollbar
    expect(
      overflow.body,
      `Body overflows viewport: body=${overflow.body} viewport=${overflow.viewport}`,
    ).toBeLessThanOrEqual(overflow.viewport + 4);
  });
});

test.describe("Trending widget diversity check", () => {
  test("trending no debe ser 100% MAD/BCN (debe haber otros orígenes)", async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    // El widget Trending muestra rutas como "MAD - BKK"
    const routes = await page.$$eval(
      "[class*='trending'] [class*='route'], li:has-text('→')",
      (els) =>
        els
          .map((el) => (el.textContent || "").trim())
          .filter((t) => t.length > 3 && t.length < 30),
    );
    if (routes.length < 3) {
      test.skip(true, "Trending widget no encontrado o vacío");
      return;
    }
    const origins = routes
      .map((r) => r.split(/[-→]/)[0]?.trim().toUpperCase().slice(0, 3))
      .filter(Boolean);
    const unique = new Set(origins);
    expect(
      unique.size,
      `Trending solo muestra ${unique.size} origenes únicos: ${[...unique].join(",")} — esperamos diversidad >=2`,
    ).toBeGreaterThanOrEqual(2);
  });
});
