"use client";

/**
 * track_client.ts — fase SSS63 (May 2026)
 *
 * Helper centralizado para emitir eventos del funnel desde componentes
 * cliente. Encapsula:
 *   - consent gating (localStorage tc_analytics_ok)
 *   - sendBeacon preferido / fetch keepalive fallback
 *   - dedup de eventos visuales (1× por sesión por target)
 *
 * Uso típico:
 *   import { tcTrack } from "@/lib/track_client";
 *   tcTrack("favorite_added", { deal_id, destination });
 *
 * Para "viewed-once" (premium banner, deal in viewport):
 *   import { tcTrackOnce } from "@/lib/track_client";
 *   tcTrackOnce("premium_cta_view", "hero_banner", { source: "/" });
 */

const SEEN_KEY = "tc_track_seen_v1";

function consentOk(): boolean {
  try {
    // SSS174: leer el consent REAL del CookieBanner (cv_consent_v1) además
    // del legacy tc_analytics_ok. Antes track_client revisaba solo
    // tc_analytics_ok que nunca lo escribía nadie → tracking SIEMPRE corriendo
    // (RGPD breach). Ahora respeta lo que el user eligió en el banner.
    const raw = localStorage.getItem("cv_consent_v1");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { analytics?: boolean };
        if (parsed && typeof parsed.analytics === "boolean") {
          return parsed.analytics === true;
        }
      } catch {
        /* malformed JSON, ignore */
      }
    }
    // Legacy fallback — solo bloquea si explícitamente "0"
    return localStorage.getItem("tc_analytics_ok") !== "0";
  } catch {
    return true;
  }
}

function getSeen(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen)));
  } catch {
    /* swallow */
  }
}

export function tcTrack(type: string, meta: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  if (!consentOk()) return;

  const payload = JSON.stringify({ type, meta });
  // SSS175: AdBlockers (uBlock, EasyPrivacy) bloquean /api/track agresivamente.
  // 93% events perdidos vs CF unique. Probamos /api/p (alias, mismo handler)
  // primero; si beacon falla, fallback a /api/track con fetch keepalive.
  const primaryUrl = "/api/p";
  const fallbackUrl = "/api/track";
  try {
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        primaryUrl,
        new Blob([payload], { type: "application/json" }),
      );
      if (!ok) {
        // sendBeacon devuelve false si adblocker o queue full → fallback
        navigator.sendBeacon(
          fallbackUrl,
          new Blob([payload], { type: "application/json" }),
        );
      }
    } else {
      fetch(primaryUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() =>
        fetch(fallbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => undefined),
      );
    }
  } catch {
    /* swallow */
  }
}

/**
 * Versión dedup: solo dispara el evento la primera vez que se ve este
 * (type, key) en la sesión. Útil para "premium_cta_view", "result_viewed",
 * "scroll_75" — para no inflar contadores con observadores hyperactivos.
 */
export function tcTrackOnce(
  type: string,
  key: string,
  meta: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  const seen = getSeen();
  const dedupKey = `${type}::${key}`;
  if (seen.has(dedupKey)) return;
  seen.add(dedupKey);
  saveSeen(seen);
  tcTrack(type, meta);
}

/**
 * Lee utm_source/medium/campaign/content/term del URL actual.
 * Devuelve {} si no hay ninguno (no contamina el evento).
 */
export function readUtmFromLocation(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const sp = new URLSearchParams(window.location.search);
    const out: Record<string, string> = {};
    for (const k of ["source", "medium", "campaign", "content", "term"]) {
      const v = sp.get(`utm_${k}`);
      if (v) out[`utm_${k}`] = v;
    }
    return out;
  } catch {
    return {};
  }
}
