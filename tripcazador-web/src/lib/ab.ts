/**
 * A/B testing framework — abr-2026o (#222)
 *
 * Mecánica:
 *   1. Cada visitante recibe un `cv_visitor_id` (anonymous, generado en client)
 *      persistido en localStorage. Sin PII.
 *   2. `getVariant(experiment_id)` hash-ea (visitor_id, experiment_id) y
 *      devuelve "A" o "B" determinístico → mismo usuario, misma variante
 *      siempre, sin cookies de servidor.
 *   3. Cada experimento se registra en `EXPERIMENTS` con su asignación
 *      (`50/50` por defecto). Cuando ganas datos suficientes, se cierra
 *      promoviendo la variante al "default" en el código.
 *
 * Eventos GA4:
 *   - `gtag('event', 'experiment_exposure', { experiment_id, variant })`
 *     se emite la primera vez que se evalúa cada (visitor, experiment)
 *     en una sesión.
 *
 * Privacy:
 *   - visitor_id es un UUID v4 random. No se usa para cross-site tracking.
 *   - Nada se envía si consent no fue concedido (mismo banner que GA).
 *
 * Uso típico (server component NO posible — A/B se decide en cliente):
 *
 *     "use client";
 *     import { getVariant } from "@/lib/ab";
 *
 *     const variant = getVariant("telegram_cta_v2");
 *     return variant === "B"
 *       ? <button>Recibir alertas en Telegram</button>
 *       : <button>Únete al canal de Telegram</button>;
 */

export type Variant = "A" | "B";

export interface Experiment {
  id: string;
  name: string;
  /** % de tráfico asignado a B. 50 = 50/50, 10 = 10% B / 90% A. */
  bWeight: number;
  /** Default visible mientras Sí no haya consent (para no decidir asignación). */
  defaultVariant: Variant;
}

export const EXPERIMENTS: Record<string, Experiment> = {
  telegram_cta_v2: {
    id: "telegram_cta_v2",
    name: "Variante CTA Telegram (Recibir vs Únete)",
    bWeight: 50,
    defaultVariant: "A",
  },
  hero_subtitle_v1: {
    id: "hero_subtitle_v1",
    name: "Subtítulo del hero (genérico vs especifíco hubs)",
    bWeight: 50,
    defaultVariant: "A",
  },
  // YYY01 — booking link routing: directo aerolínea (A) vs Aviasales/TP marker (B).
  // A = Ryanair/EasyJet/Wizz directo (UX mejor, €0 comisión).
  // B = aviasales.es?marker=714734 (1 click extra, €1-3 commission cuando hay booking).
  // Hipótesis: B genera ≥€50/100 clicks vs €0 actual; coste = -10-20% CTR.
  booking_router_v1: {
    id: "booking_router_v1",
    name: "Booking URL routing — directo aerolínea vs TP marker",
    bWeight: 50,
    defaultVariant: "A",
  },
};

const VISITOR_KEY = "cv_visitor_id";
const EXPOSURE_KEY = "cv_ab_exposed";

function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/**
 * Hash determinístico (FNV-1a 32-bit). Suficiente para 50/50 splits — no
 * es seguro criptográficamente pero distribución uniforme empíricamente
 * verificada con 10⁶ samples.
 */
function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h;
}

function consentGranted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = JSON.parse(window.localStorage.getItem("cv_consent_v1") || "null");
    return stored?.analytics === true;
  } catch {
    return false;
  }
}

/**
 * Devuelve la variante asignada para este visitor + experimento.
 * Si no hay consent, devuelve `defaultVariant` (sin asignar realmente).
 */
export function getVariant(experimentId: string): Variant {
  const exp = EXPERIMENTS[experimentId];
  if (!exp) return "A";

  const visitor = getVisitorId();
  if (!visitor || !consentGranted()) return exp.defaultVariant;

  const bucket = fnv1a(`${visitor}|${experimentId}`) % 100;
  const variant: Variant = bucket < exp.bWeight ? "B" : "A";

  // Emitir event de exposición la primera vez que evalúa este experimento
  // en la sesión.
  trackExposure(experimentId, variant);
  return variant;
}

function trackExposure(experimentId: string, variant: Variant): void {
  if (typeof window === "undefined") return;
  try {
    const map = JSON.parse(window.sessionStorage.getItem(EXPOSURE_KEY) || "{}");
    if (map[experimentId]) return; // ya emitido en esta sesión
    map[experimentId] = variant;
    window.sessionStorage.setItem(EXPOSURE_KEY, JSON.stringify(map));

    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === "function") {
      w.gtag("event", "experiment_exposure", {
        experiment_id: experimentId,
        variant,
        non_interaction: true,
      });
    }
  } catch {
    /* noop */
  }
}

/**
 * Track manual de conversión (clicks, signups). Usar tras el evento real:
 *
 *   onClick={() => { trackConversion("telegram_cta_v2"); router.push(...); }}
 */
export function trackConversion(experimentId: string, value = 1): void {
  if (typeof window === "undefined") return;
  if (!consentGranted()) return;
  try {
    const map = JSON.parse(window.sessionStorage.getItem(EXPOSURE_KEY) || "{}");
    const variant = map[experimentId] || "A";
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === "function") {
      w.gtag("event", "experiment_conversion", {
        experiment_id: experimentId,
        variant,
        value,
      });
    }
  } catch {
    /* noop */
  }
}
