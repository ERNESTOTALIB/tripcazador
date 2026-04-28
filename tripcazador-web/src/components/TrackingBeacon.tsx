"use client";

import { useEffect } from "react";

/**
 * TrackingBeacon — fase kk K2
 *
 * Cliente que postea page_view a /api/track al montar.
 * También expone window.tcTrack(type, meta) para que otros componentes
 * disparen eventos sin importar trackingBeacon.
 *
 * Respeta consent: si el usuario rechazó cookies de analytics, NO emite.
 * (Asume que el banner de consentimiento setea localStorage.tc_analytics_ok.)
 */
export function TrackingBeacon({ pagePath }: { pagePath?: string }) {
  useEffect(() => {
    // sendBeacon es preferido (no bloquea unload). Fallback a fetch.
    const send = (type: string, meta: Record<string, unknown>) => {
      try {
        // Consent-gated (default si no hay banner: opt-in implícito)
        const consent = localStorage.getItem("tc_analytics_ok");
        if (consent === "0") return;

        const payload = JSON.stringify({ type, meta });
        const url = "/api/track";
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
        } else {
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => undefined);
        }
      } catch { /* swallow */ }
    };

    // page_view inicial
    send("page_view", { path: pagePath || (typeof location !== "undefined" ? location.pathname : "/") });

    // Expose global helper
    (window as unknown as { tcTrack?: (t: string, m: Record<string, unknown>) => void }).tcTrack = send;
  }, [pagePath]);

  return null;
}
