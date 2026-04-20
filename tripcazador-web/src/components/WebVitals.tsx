"use client";

/**
 * WebVitals — envía Core Web Vitals a GA4.
 *
 * Next 14 expone `useReportWebVitals` sobre el observer de web-vitals.
 * Por métrica recibimos `{ id, name, value, delta, rating, navigationType }`.
 *
 * Estrategia:
 * - Solo enviamos si existe `window.gtag` (significa que el usuario aceptó
 *   consent en el banner y GA4 está cargado).
 * - Mapeo a event `web_vitals` con `event_category: "Web Vitals"` que es la
 *   convención recomendada por Google para Explore reports.
 * - CLS se multiplica ×1000 porque GA4 no acepta decimales en `value`.
 * - `non_interaction: true` para que no infle la bounce rate.
 */
import { useReportWebVitals } from "next/web-vitals";

// Nota: `window.gtag` ya está declarado en `src/lib/analytics.ts`.
// Reutilizamos esa declaración global para evitar TS2717 (merge collision).

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (typeof window === "undefined" || !window.gtag) return;

    // CLS llega como decimal (0.001–0.5). GA4 `value` es entero.
    const value = Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value);

    window.gtag("event", "web_vitals", {
      event_category: "Web Vitals",
      event_label: metric.id,
      metric_id: metric.id,
      metric_name: metric.name,
      metric_value: value,
      metric_delta: Math.round(
        metric.name === "CLS" ? metric.delta * 1000 : metric.delta,
      ),
      metric_rating: metric.rating,
      non_interaction: true,
    });
  });

  return null;
}
