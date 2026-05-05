/**
 * vitals_store.ts — fase SSS73 (May 2026)
 *
 * Ring buffer in-memory para Core Web Vitals samples. Extraído del route
 * handler `/api/web-vitals/route.ts` porque Next.js 14 no permite exports
 * adicionales en archivos route.ts (solo HTTP verbs + segment config),
 * lo que rompía el build con:
 *   "getVitalsSamples" is not a valid Route export field.
 *
 * Persistencia: in-memory + globalThis para sobrevivir hot reloads en dev.
 * En prod (multi-instancia) cada lambda tendrá su propio buffer; aceptable
 * para muestreo agregado p75 por página vía /api/admin/vitals.
 */

export interface VitalSample {
  ts: number;
  name: string;        // LCP / CLS / INP / FCP / TTFB
  value: number;
  rating: string;
  page_path: string;
  visitor_hash: string; // anónimo
}

const RING_SIZE = 10000;
const TTL_MS = 24 * 3600 * 1000;

const store: { ring: VitalSample[]; idx: number } = (
  globalThis as unknown as { __tc_vitals_store?: { ring: VitalSample[]; idx: number } }
).__tc_vitals_store ?? { ring: [], idx: 0 };

(globalThis as unknown as { __tc_vitals_store: typeof store }).__tc_vitals_store = store;

export function pushSample(s: VitalSample): void {
  if (store.ring.length < RING_SIZE) {
    store.ring.push(s);
  } else {
    store.ring[store.idx] = s;
    store.idx = (store.idx + 1) % RING_SIZE;
  }
}

export function getVitalsSamples(): VitalSample[] {
  const now = Date.now();
  return store.ring.filter((s) => s && now - s.ts < TTL_MS);
}
