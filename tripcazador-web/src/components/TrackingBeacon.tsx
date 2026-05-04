"use client";

import { useEffect } from "react";
import { tcTrack, tcTrackOnce, readUtmFromLocation } from "@/lib/track_client";

/**
 * TrackingBeacon — fase kk K2 + SSS63 (May 2026)
 *
 * Cliente que postea page_view a /api/track al montar. Adicionalmente:
 *  - landing_arrived: 1ra page_view de la sesión, anota utm_* si vienen
 *  - scroll_75: dispara cuando el usuario alcanza 75% del documento
 *  - expone window.tcTrack(type, meta) para componentes legacy
 *
 * Respeta consent: si el usuario rechazó cookies de analytics, NO emite.
 * (Asume que el banner de consentimiento setea localStorage.tc_analytics_ok.)
 */
export function TrackingBeacon({ pagePath }: { pagePath?: string }) {
  useEffect(() => {
    const path =
      pagePath || (typeof location !== "undefined" ? location.pathname : "/");

    // page_view inicial
    tcTrack("page_view", { path });

    // landing_arrived 1× por sesión, con UTM si los hay
    const utm = readUtmFromLocation();
    tcTrackOnce("landing_arrived", "session", { path, ...utm });

    // Expose helper global (legacy consumers)
    (
      window as unknown as {
        tcTrack?: (t: string, m: Record<string, unknown>) => void;
      }
    ).tcTrack = (t, m) => tcTrack(t, m);

    // scroll_75 listener — dedup once per page path
    function onScroll() {
      try {
        const doc = document.documentElement;
        const scrolled = window.scrollY + window.innerHeight;
        const total = doc.scrollHeight;
        if (total <= 0) return;
        if (scrolled / total >= 0.75) {
          tcTrackOnce("scroll_75", `path:${path}`, { path });
          window.removeEventListener("scroll", onScroll);
        }
      } catch {
        /* swallow */
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pagePath]);

  return null;
}
