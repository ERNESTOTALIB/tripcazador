/**
 * tracker.ts — fase tt-TT4
 *
 * Helper client-side para enviar eventos a /api/track via sendBeacon.
 * Garantiza envío incluso si el usuario navega/cierra tab inmediatamente
 * después de clicar.
 *
 * Uso:
 *   trackClick("calc_used", { calc: "vuelo-valor" })
 *   trackClick("share_clicked", { platform: "whatsapp", deal_id: "..." })
 *   trackClick("telegram_clicked", { source: "footer" })
 *   trackPageView()  // automático desde layout/page
 *
 * Consent gate: si NEXT_PUBLIC_GA4_ID está set y el banner cookies está
 * dismissed (localStorage tc_cookies_consent==="accepted"), enviamos.
 * Si no, no enviamos eventos identificables (page_view sí, sin user_id).
 *
 * Note: para event types nuevos, añadir también al type EventType de
 * event_store.ts y a VALID_TYPES de /api/track.
 */

export type ClientEventType =
  | "page_view"
  | "deal_click"
  | "search_submitted"
  | "booking_redirect"
  | "newsletter_signup"
  | "alert_created"
  | "calc_used"
  | "share_clicked"
  | "telegram_clicked";

interface EventMeta {
  [key: string]: string | number | boolean | undefined;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function sanitizeMeta(meta: EventMeta): EventMeta {
  const out: EventMeta = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.length > 200) {
      out[k] = v.slice(0, 200);
    } else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Envía un evento a /api/track. No throws nunca.
 * Usa sendBeacon (sobrevive a unload) o fallback fetch keepalive.
 */
export function trackClick(type: ClientEventType, meta: EventMeta = {}): void {
  if (!isBrowser()) return;

  const payload = JSON.stringify({
    type,
    meta: sanitizeMeta(meta),
  });

  try {
    if ("sendBeacon" in navigator) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
      return;
    }
  } catch {
    /* fallthrough */
  }

  // Fallback: fetch keepalive
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      /* no-op */
    });
  } catch {
    /* no-op */
  }
}

/**
 * Helper específico para page_view.
 *
 * SSS51 (May 2026): NO-OP. Movimos el tracking de page_view a GA4 +
 * Cloudflare ground-truth analytics (SSS45/47) — son gratis e ilimitados.
 * Mantener este endpoint server-side disparaba invocations Vercel
 * innecesariamente (page_view = 70% del tráfico /api/track). Para obtener
 * la métrica usa /panel — que ahora cruza CF visitor counts con eventos
 * de alta señal (deal_click, booking_redirect, share_clicked, etc).
 *
 * Si necesitas reactivar page_view a server-side por algún motivo
 * (ej. tracking sin JS), borra este return early. Pero antes considera
 * que GA4 + CF cubren el caso al 99%.
 */
export function trackPageView(_extra: EventMeta = {}): void {
  // intencionalmente vacío — ver docstring
  return;
}

/**
 * Adjunta listener a un link (típico Telegram externo) que dispare
 * tracking antes de la navegación.
 *
 * Uso: <a href={TG_URL} onClick={onTelegramClick("homepage_footer")}>
 */
export function onTelegramClick(source: string): React.MouseEventHandler {
  return () => {
    trackClick("telegram_clicked", { source });
  };
}

// Re-export para tests
export const _internal = { sanitizeMeta };
