/**
 * ab_test.ts — SSS465 (24 may 2026)
 *
 * Minimal A/B test framework client-side. Asignación estable por
 * visitor_id (hash localStorage) + tracking events via tcTrack.
 *
 * Diseño:
 * - No SSR (corre solo en cliente; durante SSR usa variant default).
 * - Persistencia: localStorage `tc_ab_${testId}` = "A"|"B"|"C"
 * - Distribución equiprobable (random 0-1 → buckets equal-size).
 * - Track exposure 1× por test cuando user ve variant (anti-double-count).
 *
 * Uso:
 *   const variant = useAbTest("premium_cta_v2", ["A", "B", "C"]);
 *   if (variant === "A") return <CtaCopyA />;
 *   if (variant === "B") return <CtaCopyB />;
 *   return <CtaCopyC />;
 */

const STORAGE_PREFIX = "tc_ab_";
const EXPOSED_PREFIX = "tc_ab_exposed_";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Asigna stable variant para testId entre opciones.
 * Devuelve la primera opción durante SSR (no random) para hidratación
 * estable; en client re-evalúa con localStorage.
 */
export function getAbVariant<T extends string>(
  testId: string,
  variants: readonly T[],
): T {
  if (variants.length === 0) {
    throw new Error("ab_test.getAbVariant: at least one variant required");
  }
  if (!isBrowser()) return variants[0];
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + testId);
    if (stored && (variants as readonly string[]).includes(stored)) {
      return stored as T;
    }
    // Asignar nuevo
    const idx = Math.floor(Math.random() * variants.length);
    const chosen = variants[idx];
    localStorage.setItem(STORAGE_PREFIX + testId, chosen);
    return chosen;
  } catch {
    return variants[0];
  }
}

/** Trackea exposure 1× por test. */
export function trackAbExposure(testId: string, variant: string): void {
  if (!isBrowser()) return;
  try {
    const exposedKey = EXPOSED_PREFIX + testId;
    if (localStorage.getItem(exposedKey) === variant) return; // already tracked
    localStorage.setItem(exposedKey, variant);
    // Dispatcher: usa tcTrack si existe global, sino fetch directo.
    const win = window as Window & {
      tcTrack?: (type: string, meta?: Record<string, unknown>) => void;
    };
    if (typeof win.tcTrack === "function") {
      win.tcTrack("ab_exposure", { test_id: testId, variant });
    } else {
      // Fallback: fetch a /api/track silent
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ab_exposure", meta: { test_id: testId, variant } }),
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    // silent
  }
}

/** Trackea conversión (e.g., click CTA del variant). */
export function trackAbConversion(testId: string, variant: string, value?: number): void {
  if (!isBrowser()) return;
  try {
    const win = window as Window & {
      tcTrack?: (type: string, meta?: Record<string, unknown>) => void;
    };
    const meta: Record<string, unknown> = { test_id: testId, variant };
    if (typeof value === "number") meta.value = value;
    if (typeof win.tcTrack === "function") {
      win.tcTrack("ab_conversion", meta);
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ab_conversion", meta }),
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    // silent
  }
}

/** Helper: reset (para QA/debug). */
export function resetAbTest(testId: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_PREFIX + testId);
    localStorage.removeItem(EXPOSED_PREFIX + testId);
  } catch {
    // silent
  }
}
