/**
 * regression_revenue_leaks.test.ts — SSS184 (May 2026)
 *
 * Tests anti-regresión de las CINCO clases de bugs detectados en SSS177-181:
 *
 *   1) SSS177  A/B revenue experiment defaultVariant mata revenue
 *   2) SSS178  fire-and-forget en route handlers Node runtime pierde writes
 *   3) SSS179  consent gating bloquea features que NO son PII
 *   4) SSS180  silent fail en revenue/payment paths sin Sentry tag
 *   5) SSS181  affiliate URL fallbacks rotos (string vacío como marker)
 *
 * Cada test está diseñado para FALLAR si vuelve a aparecer el patrón bug.
 * Si más adelante hay un cambio legítimo (ej. nuevo experimento revenue con
 * bWeight=10), añadir explicit exception list aquí con comentario del motivo.
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EXPERIMENTS, getVariant } from "../ab";
import { routeBookingUrl } from "../booking_url_router";
import { captureRevenueError, captureRevenueMessage } from "../sentry_helper";

// ────────────────────────────────────────────────────────────────────────
// Clase 1: SSS177 — A/B experiments con defaultVariant que mata revenue
// ────────────────────────────────────────────────────────────────────────

/**
 * Lista de experimentos cuya variant "B" genera revenue (vs A=baseline €0).
 * Si añades un nuevo experimento revenue, registralo aquí con bWeight+default
 * esperados. El test fallará si el experimento existe con configuración
 * sub-óptima.
 */
const REVENUE_EXPERIMENTS: Record<
  string,
  { minBWeight: number; expectedDefault: "A" | "B"; reason: string }
> = {
  booking_router_v1: {
    minBWeight: 100,
    expectedDefault: "B",
    reason:
      "B = aviasales con TP marker (€1-3 commission), A = direct ryanair (€0). SSS177 lo promovió a 100% B.",
  },
  // Cuando añadas nuevos experimentos revenue, registralos aquí:
  // upsell_premium_v1: { minBWeight: 50, expectedDefault: "B", reason: "..." },
};

describe("Regression — SSS177: A/B revenue defaults", () => {
  it("EXPERIMENTS catalog tiene tipos válidos", () => {
    for (const exp of Object.values(EXPERIMENTS)) {
      expect(typeof exp.id).toBe("string");
      expect(typeof exp.bWeight).toBe("number");
      expect(exp.bWeight).toBeGreaterThanOrEqual(0);
      expect(exp.bWeight).toBeLessThanOrEqual(100);
      expect(["A", "B"]).toContain(exp.defaultVariant);
    }
  });

  for (const [expId, requirement] of Object.entries(REVENUE_EXPERIMENTS)) {
    it(`experimento revenue '${expId}' cumple SSS177 reqs (default=${requirement.expectedDefault}, bWeight≥${requirement.minBWeight})`, () => {
      const exp = EXPERIMENTS[expId];
      expect(
        exp,
        `Experimento revenue '${expId}' está REGISTRADO en REVENUE_EXPERIMENTS pero no existe en EXPERIMENTS catalog. Si fue eliminado, quítalo también de REVENUE_EXPERIMENTS. Reason original: ${requirement.reason}`,
      ).toBeDefined();
      if (!exp) return;
      expect(
        exp.defaultVariant,
        `${expId}.defaultVariant debe ser '${requirement.expectedDefault}'. ${requirement.reason}`,
      ).toBe(requirement.expectedDefault);
      expect(
        exp.bWeight,
        `${expId}.bWeight debe ser ≥${requirement.minBWeight}. ${requirement.reason}`,
      ).toBeGreaterThanOrEqual(requirement.minBWeight);
    });
  }

  it("booking_router_v1 routea Ryanair a TP marker sin requerir consent (SSS179 unblock)", () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* swallow */ }
    // Simula visitor SIN consent (cv_consent_v1 ausente)
    const r = routeBookingUrl({
      originalUrl: "https://ryanair.com/x",
      airlineCode: "FR",
      origin: "STN",
      destination: "BCN",
      dateOut: "2026-06-01",
    });
    // Antes SSS177+179: variant=A, no rerouted. Hoy: variant=B, rerouted.
    expect(r.variant).toBe("B");
    expect(r.rerouted).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────
// Clase 2: SSS178 — fire-and-forget audit (estático, lectura de archivos)
// ────────────────────────────────────────────────────────────────────────

const REPO_ROOT = join(__dirname, "..", "..", "..");

function readSource(rel: string): string {
  return readFileSync(join(REPO_ROOT, rel), "utf-8");
}

/**
 * Files que tienen runtime nodejs y NO deben tener fire-and-forget de
 * operaciones críticas. Lista whitelist para no detectar low-value events.
 */
const ROUTE_FILES_CRITICAL: Array<{ path: string; description: string }> = [
  {
    path: "src/app/api/track/route.ts",
    description: "track route: revenue events (deal_click/booking_redirect) DEBEN await el flush",
  },
  {
    path: "src/app/api/concierge/checkout/route.ts",
    description: "concierge: persistToBackend DEBE ser awaited (SSS180)",
  },
  {
    path: "src/app/api/stripe/webhook/route.ts",
    description: "stripe webhook: notifications deben ser awaited",
  },
];

describe("Regression — SSS178+180: fire-and-forget en routes nodejs", () => {
  for (const { path, description } of ROUTE_FILES_CRITICAL) {
    it(`${path} no tiene 'void <fn>(...)' problemáticos`, () => {
      const src = readSource(path);
      // Pattern: `void someFn(args)` o `someFn(args);` standalone (sin asignación)
      // que sea async — heurística aproximada pero captura los casos comunes.
      const voidCallMatches = src.match(/^\s*void\s+\w+\([^)]*\);?$/gm) || [];
      expect(
        voidCallMatches,
        `${path} tiene ${voidCallMatches.length} fire-and-forget 'void fn(...)' — ${description}. Matches: ${voidCallMatches.slice(0, 3).join(" | ")}`,
      ).toHaveLength(0);
    });

    it(`${path} no usa '.catch(() => {})' SIN comentario explicativo`, () => {
      const src = readSource(path);
      // Capturamos `.catch(() => { })` con o sin comentario dentro
      const catchMatches = src.match(/\.catch\(\(\s*\)\s*=>\s*\{[^}]*\}\)/g) || [];
      const undocumented = catchMatches.filter((m) => {
        // Si contiene cualquier word de "no-op|swallow|ignore|fallthrough|noop|telemetry|best-effort" lo aceptamos
        return !/no-op|swallow|ignore|fallthrough|noop|telemetry|best-effort/i.test(m);
      });
      expect(
        undocumented,
        `${path} tiene ${undocumented.length} fire-and-forget .catch() SIN comentario. Add /* swallow: razón */ con justificación: ${undocumented.slice(0, 2).join(" | ")}`,
      ).toHaveLength(0);
    });
  }

  it("/api/track FLUSH_IMMEDIATELY set incluye deal_click + booking_redirect (SSS178)", () => {
    const src = readSource("src/app/api/track/route.ts");
    expect(src).toContain("FLUSH_IMMEDIATELY");
    expect(src).toMatch(/"deal_click"/);
    expect(src).toMatch(/"booking_redirect"/);
    // Y el handler debe AWAITAR flushBufferToGitHub() para FLUSH_IMMEDIATELY events
    expect(src).toMatch(/await\s+flushBufferToGitHub/);
  });
});

// ────────────────────────────────────────────────────────────────────────
// Clase 3: SSS179 — consent gating excesivo
// ────────────────────────────────────────────────────────────────────────

describe("Regression — SSS179: consent gating no bloquea A/B routing", () => {
  beforeEach(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* swallow */ }
  });

  it("getVariant SIN consent asigna por hash (no devuelve siempre defaultVariant)", () => {
    // SSS179: previo era "sin consent → defaultVariant" → 93% users → ningún
    // A/B producía data. Test simula visitor sin consent y verifica que un
    // experimento 50/50 puede devolver A o B (asignación por hash funciona).
    const exp = EXPERIMENTS.telegram_cta_v2;
    expect(exp.bWeight).toBe(50);

    // Generar varios visitor_ids distintos y verificar que vemos ambas variantes
    const variants = new Set<string>();
    for (let i = 0; i < 20; i++) {
      try { localStorage.clear(); sessionStorage.clear(); } catch { /* swallow */ }
      // Force a different visitor_id
      localStorage.setItem("cv_visitor_id", `regression-visitor-${i}-${Math.random()}`);
      const v = getVariant("telegram_cta_v2");
      variants.add(v);
    }
    // Con 20 visitors distintos y bWeight=50, debemos ver AMBAS variantes
    // (probabilidad de no ver una de las dos: 2 × (0.5)^20 ≈ 2e-6).
    expect(variants).toEqual(new Set(["A", "B"]));
  });

  it("getVariant SIN consent + bWeight=100 siempre devuelve B (booking_router_v1)", () => {
    expect(getVariant("booking_router_v1")).toBe("B");
  });
});

// ────────────────────────────────────────────────────────────────────────
// Clase 4: SSS181 — sentry_helper no crashea sin SENTRY_DSN
// ────────────────────────────────────────────────────────────────────────

describe("Regression — SSS181: sentry_helper safe sin DSN", () => {
  it("captureRevenueError no throws si Sentry no inicializado", () => {
    expect(() =>
      captureRevenueError(new Error("test"), {
        module: "test_module",
        code: "test_code",
        extra: { foo: "bar" },
      }),
    ).not.toThrow();
  });

  it("captureRevenueError acepta non-Error values sin throws", () => {
    expect(() =>
      captureRevenueError("string error", { module: "x", code: "y" }),
    ).not.toThrow();
    expect(() =>
      captureRevenueError({ custom: "object" }, { module: "x", code: "y" }),
    ).not.toThrow();
    expect(() =>
      captureRevenueError(null, { module: "x", code: "y" }),
    ).not.toThrow();
  });

  it("captureRevenueMessage no throws sin DSN", () => {
    expect(() =>
      captureRevenueMessage("test warning", {
        module: "test_module",
        code: "test_code",
        level: "warning",
      }),
    ).not.toThrow();
  });

  it("captureRevenueError invoca Sentry.captureException con tags estructurados", async () => {
    // Mock Sentry SDK para verificar shape del call. Usamos vi.doMock para
    // que la mock se aplique antes del re-import dinámico.
    vi.resetModules();
    const captureSpy = vi.fn();
    vi.doMock("@sentry/nextjs", () => ({
      captureException: captureSpy,
      captureMessage: vi.fn(),
    }));
    const mod = (await import("../sentry_helper")) as {
      captureRevenueError: typeof captureRevenueError;
    };
    mod.captureRevenueError(new Error("smoke"), {
      module: "regression_test",
      code: "test_code",
      extra: { foo: "bar" },
    });
    expect(captureSpy).toHaveBeenCalledOnce();
    const callArgs = captureSpy.mock.calls[0];
    expect(callArgs[0]).toBeInstanceOf(Error);
    expect(callArgs[1]?.tags).toEqual({ module: "regression_test", code: "test_code" });
    expect(callArgs[1]?.extra).toEqual({ foo: "bar" });
    vi.resetModules();
    vi.doUnmock("@sentry/nextjs");
  });
});

// ────────────────────────────────────────────────────────────────────────
// Clase 5: SSS181 — affiliate URL fallbacks rotos
// ────────────────────────────────────────────────────────────────────────

describe("Regression — SSS181: affiliate URL fallbacks no rotos", () => {
  it("trip_planner.ts skyscanner: omite associateid si TP_MARKER vacío (no envía junk)", () => {
    const src = readSource("src/lib/trip_planner.ts");
    // Antes: associateid=${tpMarker || "tripcazador"} → "tripcazador" no es marker válido
    expect(src).not.toContain('associateid=${tpMarker || "tripcazador"}');
    // Verificar pattern condicional: si tpMarker existe, añadir associateid; si no, URL plana
    expect(src).toMatch(/tpMarker\s*\n?\s*\?\s*[`'"]/);
  });

  it("trip_planner.ts heymondo: usa dominio canonical .com (no .es)", () => {
    const src = readSource("src/lib/trip_planner.ts");
    expect(src).not.toContain("heymondo.es");
    expect(src).toMatch(/heymondo\.com/);
  });

  it("gift-cards/redeem: omite GYG partner_id si vacío (no envía 'partner_id=')", () => {
    const src = readSource("src/app/api/gift-cards/redeem/route.ts");
    expect(src).not.toMatch(/partner_id=\$\{[^}]*\|\|\s*""\}/);
    expect(src).toMatch(/gygPartner\s*\n?\s*\?/);
  });

  it("gift-cards/redeem: omite associateid si TP_MARKER vacío", () => {
    const src = readSource("src/app/api/gift-cards/redeem/route.ts");
    // Antes: tpMarker || "tripcazador" → invalida tracking. El test verifica
    // que NO está el patrón problemático (sin matar comentarios que mencionan
    // la palabra). Usamos regex específico del antiguo fallback.
    expect(src).not.toMatch(/tpMarker\s*\|\|\s*"tripcazador"/);
    expect(src).toMatch(/tpMarker\s*\n?\s*\?/);
  });
});
