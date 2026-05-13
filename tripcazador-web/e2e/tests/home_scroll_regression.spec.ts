/**
 * SSS157 — Anti-regresión del bug SSS156 ("no se puede bajar en Chrome").
 *
 * Verifica en TODOS los navegadores configurados (chromium, firefox, webkit,
 * Pixel 5, iPhone 14, iPhone SE, iPad portrait, iPad landscape) que:
 *
 *   1. NO aparece ningún overlay `position:fixed` z>=999 con tamaño
 *      ≥50% viewport en la carga normal de la home (modal de OnboardingTour
 *      autopopup bloqueaba scroll en SSS156).
 *   2. CSS scroll defensivo está activo:
 *      - html overflow-y: auto (no hidden)
 *      - html scroll-behavior: smooth
 *      - body overscroll-behavior-y NO es "none" (Chrome lo malinterpretaba)
 *   3. Scroll programático funciona (window.scrollTo desplaza el viewport).
 *   4. SkyHero NO ocupa más de 1.4× el viewport (mínimo deja contenido visible).
 *   5. /?tour=1 SÍ dispara el modal de onboarding (la flag opt-in funciona).
 *
 * Diseñado para correr contra el preview de PRE y prod. Si falla un assertion,
 * MUY probablemente algún componente está atrapando wheel events otra vez.
 *
 *   BASE_URL=https://tripcazador-git-pre-ernesto-talibs-projects.vercel.app \
 *     npx playwright test home_scroll_regression.spec.ts
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("Home scroll anti-regression (SSS156)", () => {
  test("NO hay overlay fullscreen z>=999 en carga normal", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    // Dejar tiempo a que se monten los useEffects (3s era el delay original
    // del OnboardingTour antes de SSS156).
    await page.waitForTimeout(4_000);

    const overlays = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      return Array.from(document.querySelectorAll("*"))
        .filter((el) => {
          const s = getComputedStyle(el);
          if (s.position !== "fixed") return false;
          const z = parseFloat(s.zIndex);
          if (!Number.isFinite(z) || z < 999) return false;
          const rect = (el as HTMLElement).getBoundingClientRect();
          // Bloquea si cubre >50% del área visible
          return rect.width * rect.height >= vw * vh * 0.5;
        })
        .map((el) => ({
          tag: el.tagName,
          cls: (el.className || "").toString().slice(0, 60),
          z: getComputedStyle(el).zIndex,
        }));
    });

    expect(
      overlays,
      `Overlay fullscreen z>=999 detectado — bloquearía wheel events:\n${JSON.stringify(overlays, null, 2)}`,
    ).toEqual([]);
  });

  test("CSS scroll defensivo activo (overflow-y, scroll-behavior, overscroll)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });

    const cssState = await page.evaluate(() => {
      const html = getComputedStyle(document.documentElement);
      const body = getComputedStyle(document.body);
      return {
        htmlOverflowY: html.overflowY,
        scrollBehavior: html.scrollBehavior,
        bodyOverscrollY: body.overscrollBehaviorY,
      };
    });

    // html overflow-y debe permitir scroll (auto, visible, o scroll — NUNCA hidden)
    expect(cssState.htmlOverflowY, "html.overflowY no debe ser 'hidden'").not.toBe("hidden");
    // scroll-behavior debería ser smooth (declarado en SSS156)
    expect(cssState.scrollBehavior, "html.scrollBehavior debe ser smooth").toBe("smooth");
    // overscroll-behavior-y debe permitir scroll natural (no "none" agresivo)
    expect(
      cssState.bodyOverscrollY,
      "body.overscrollBehaviorY no debe ser 'none' (compat Chrome)",
    ).not.toBe("none");
  });

  test("scroll programático mueve el viewport correctamente", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2_000); // permitir hidratación

    // Estado inicial
    const startY = await page.evaluate(() => window.scrollY);
    expect(startY).toBe(0);

    // Scroll programático
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: "instant" as ScrollBehavior }));
    await page.waitForTimeout(500);

    const afterY = await page.evaluate(() => window.scrollY);
    expect(afterY, `scroll programático no avanzó: ${afterY}`).toBeGreaterThanOrEqual(1400);

    // Verificar que el documento es realmente largo (no es solo el viewport)
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeight, "home debería tener mucho contenido scrollable").toBeGreaterThan(3_000);
  });

  test("SkyHero ocupa altura razonable (≤1.6 desktop, ≤3 mobile)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1_500);

    const dims = await page.evaluate(() => {
      const sky = document.querySelector(".sky-hero") as HTMLElement | null;
      return {
        skyHeroH: sky?.offsetHeight ?? 0,
        vw: window.innerWidth,
        vh: window.innerHeight,
      };
    });

    expect(dims.skyHeroH, "SkyHero no se renderizó").toBeGreaterThan(0);

    // En mobile (<640px width) el hero se apila vertical (form fields → 1
    // columna, hero text wraps a más líneas) y crece naturalmente. Threshold
    // más permisivo. Lo importante es que no sea ABSURDAMENTE alto (>3×
    // sugeriría un bug de layout que se traga el viewport).
    const isMobile = dims.vw < 640;
    const maxRatio = isMobile ? 3.0 : 1.6;
    const ratio = dims.skyHeroH / dims.vh;
    expect(
      ratio,
      `SkyHero ${dims.skyHeroH}px ocupa ${ratio.toFixed(2)}× viewport ${dims.vw}×${dims.vh} — debería ser ≤${maxRatio}× (${isMobile ? "mobile" : "desktop"})`,
    ).toBeLessThanOrEqual(maxRatio);
  });

  test("/?tour=1 SÍ dispara el modal de onboarding (opt-in funciona)", async ({ page }) => {
    await page.goto(`${BASE_URL}/?tour=1`, { waitUntil: "domcontentloaded" });
    // Delay del modal en SSS156 v2 es 800ms con ?tour=1
    await page.waitForTimeout(2_500);

    const onboardingVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[role="dialog"]')).some((el) =>
        (el.className || "").toString().includes("z-[9999]"),
      );
    });

    expect(
      onboardingVisible,
      "Con ?tour=1 el modal del OnboardingTour DEBE aparecer (el modal sigue disponible opt-in para marketing/QA)",
    ).toBe(true);
  });

  test("home tiene contenido visible debajo del SkyHero (anti-blank-page)", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2_000);

    // Buscar texto que sabemos que está abajo del SkyHero
    const hasContent = await page.evaluate(() => {
      const text = (document.body.textContent || "").toLowerCase();
      return (
        text.includes("chollos activos") ||
        text.includes("trending") ||
        text.includes("deals destacados") ||
        text.includes("pdf gratis")
      );
    });
    expect(
      hasContent,
      "Home no tiene contenido secundario detectable — posible bug de render",
    ).toBe(true);
  });
});
