/**
 * experiments_registry.ts — SSS367 (21 may 2026)
 *
 * Sistema central de A/B testing. Define todos los experiments activos
 * en un solo lugar. Usado por componentes que quieren bucket users +
 * report exposure/conversion eventos.
 *
 * Ventajas vs los A/B sueltos previos:
 *  - Source of truth única (qué experiments están corriendo)
 *  - Statistical significance check helper
 *  - Auto cleanup post-ending date
 *  - Coherencia entre web + mobile + email
 */

import { useEffect, useState } from "react";

export interface Experiment {
  id: string;
  description: string;
  variants: string[]; // ej ["A", "B"] o ["control", "discount_50", "discount_30"]
  /** Distribución por variant — debe sumar 1.0 */
  weights?: number[];
  start_at: string; // ISO date
  end_at?: string; // ISO date — null = sigue activo
  /** Hash modulo para asignar consistente por userId/sessionId */
  hash_mod: number;
}

export const EXPERIMENTS: Experiment[] = [
  {
    id: "premium_cta_copy_v1",
    description: "Premium CTA copy: 'Prueba 7d' vs '€9.99/mes claro'",
    variants: ["control", "price_explicit"],
    weights: [0.5, 0.5],
    start_at: "2026-05-15",
    end_at: "2026-06-30",
    hash_mod: 100,
  },
  {
    id: "newsletter_ab_widget",
    description: "Newsletter signup form embed vs ribbon CTA",
    variants: ["form", "ribbon"],
    weights: [0.5, 0.5],
    start_at: "2026-05-10",
    hash_mod: 100,
  },
  {
    id: "deal_card_hot_badge",
    description: "Hot badge style: 🔥 EN VIVO vs ⚡ CHOLLO",
    variants: ["fire", "lightning"],
    weights: [0.5, 0.5],
    start_at: "2026-05-21",
    end_at: "2026-06-21",
    hash_mod: 100,
  },
  {
    id: "exit_intent_offer",
    description: "Exit-intent modal: email signup vs Premium 50% off",
    variants: ["signup", "premium_discount"],
    weights: [0.5, 0.5],
    start_at: "2026-05-21",
    hash_mod: 100,
  },
];

/**
 * Hash de string → int. Determinístico, fast. Compatible web + edge runtime.
 */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Asigna variant a un user determinístico por experiment + bucketKey.
 * bucketKey debe ser estable: anonymous_id, email, customer_id, etc.
 */
export function assignVariant(experimentId: string, bucketKey: string): string {
  const exp = EXPERIMENTS.find((e) => e.id === experimentId);
  if (!exp) return "control";
  // Check active
  const now = Date.now();
  if (Date.parse(exp.start_at) > now) return "control";
  if (exp.end_at && Date.parse(exp.end_at) < now) return "control";

  const bucket = hashString(`${experimentId}:${bucketKey}`) % exp.hash_mod;
  const weights = exp.weights ?? exp.variants.map(() => 1 / exp.variants.length);
  let acc = 0;
  for (let i = 0; i < exp.variants.length; i++) {
    acc += weights[i] * exp.hash_mod;
    if (bucket < acc) return exp.variants[i];
  }
  return exp.variants[exp.variants.length - 1];
}

/**
 * Hook React client-side. Anonymous bucketing via localStorage cookie.
 */
export function useExperiment(experimentId: string): string {
  const [variant, setVariant] = useState<string>("control");
  useEffect(() => {
    if (typeof window === "undefined") return;
    let aid = localStorage.getItem("tc_anon_id");
    if (!aid) {
      aid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("tc_anon_id", aid);
    }
    setVariant(assignVariant(experimentId, aid));
  }, [experimentId]);
  return variant;
}

/**
 * Statistical significance helper (chi-square 95%). Simple aproximación.
 * Useful para checks rápidos sin tener que abrir Excel/Statkin.
 */
export function isSignificant(opts: {
  controlExposures: number;
  controlConversions: number;
  variantExposures: number;
  variantConversions: number;
}): { significant: boolean; pValue: number; lift_pct: number } {
  const { controlExposures, controlConversions, variantExposures, variantConversions } = opts;
  if (controlExposures < 100 || variantExposures < 100) {
    return { significant: false, pValue: 1, lift_pct: 0 };
  }
  const cRate = controlConversions / controlExposures;
  const vRate = variantConversions / variantExposures;
  const pooledRate = (controlConversions + variantConversions) / (controlExposures + variantExposures);
  const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / controlExposures + 1 / variantExposures));
  const z = (vRate - cRate) / (se || 1);
  // Two-tailed p approx via standard normal tail
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));
  const lift = cRate > 0 ? ((vRate - cRate) / cRate) * 100 : 0;
  return {
    significant: pValue < 0.05,
    pValue: Math.round(pValue * 10_000) / 10_000,
    lift_pct: Math.round(lift * 10) / 10,
  };
}

// Standard normal CDF via Abramowitz approximation
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.39894228 * Math.exp((-z * z) / 2);
  const p =
    d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

export function getActiveExperiments(): Experiment[] {
  const now = Date.now();
  return EXPERIMENTS.filter(
    (e) => Date.parse(e.start_at) <= now && (!e.end_at || Date.parse(e.end_at) > now),
  );
}
