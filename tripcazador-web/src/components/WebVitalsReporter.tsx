"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * WebVitalsReporter — abr-2026l
 *
 * Captura las métricas Core Web Vitals (LCP, CLS, INP, FCP, TTFB) y las
 * envía a GA4 vía `gtag('event', 'web_vitals', ...)`. Sólo dispara si:
 *   - El consent de analytics está concedido (lo evaluamos releyendo
 *     `localStorage.cv_consent_v1` que el banner mantiene actualizado).
 *   - `window.gtag` existe (sólo cuando NEXT_PUBLIC_GA_ID está configurado).
 *
 * Por qué `useReportWebVitals` y no `web-vitals` directo: Next 14 ya emite
 * los eventos con buffering correcto + rounding razonable, y se ejecuta
 * sin re-render. No hay payload extra al bundle.
 *
 * Privacy: NO mandamos URL completa con query strings (Google la
 * sanitizaría igual, pero por defensa en profundidad).
 */

type WebVitalsMetric = {
  id: string;
  name: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  delta?: number;
  navigationType?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function consentGranted(): boolean {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem("cv_consent_v1") || "null",
    );
    return stored?.analytics === true;
  } catch {
    return false;
  }
}

export function WebVitalsReporter(): null {
  useReportWebVitals((metric: WebVitalsMetric) => {
    // Sólo reportar si consent + GA cargado.
    if (typeof window === "undefined" || !window.gtag) return;
    if (!consentGranted()) return;

    // CLS llega en unidades 0..1 (lo escalamos a 1000 entero — convención GA4).
    // El resto va en ms tal cual.
    const value =
      metric.name === "CLS"
        ? Math.round(metric.value * 1000)
        : Math.round(metric.value);

    window.gtag("event", metric.name, {
      // GA4 standard event params para Web Vitals
      event_category: "web_vitals",
      event_label: metric.id,
      value,
      metric_value: metric.value,
      metric_rating: metric.rating || "unknown",
      metric_delta: metric.delta != null ? Math.round(metric.delta) : undefined,
      navigation_type: metric.navigationType || "navigate",
      // Path SIN query string para evitar leak de filtros de búsqueda.
      page_path:
        typeof window !== "undefined" ? window.location.pathname : undefined,
      non_interaction: true,
    });

    // SSS64: dual-write a /api/web-vitals para ground-truth en /panel
    // (no depende de GA4 Reporting API + service account)
    try {
      const payload = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating || "unknown",
        page_path: window.location.pathname,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/web-vitals",
          new Blob([payload], { type: "application/json" }),
        );
      } else {
        fetch("/api/web-vitals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => undefined);
      }
    } catch {
      /* swallow */
    }
  });

  return null;
}
