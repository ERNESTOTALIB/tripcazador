"use client";

/**
 * MobileStickyCta — fase fff F2 (Apr 2026)
 *
 * Bottom-fixed CTA bar para mobile. Aparece tras 50% scroll en home/blog/destinos.
 * Optimizado para conversión:
 *  - Solo mobile (<sm: 640px)
 *  - Dismiss persistido en sessionStorage (no molesta repetidamente)
 *  - Auto-hide en /deals, /panel, /hoteles para no duplicar CTA propio
 *  - Track click event para análisis de conversión
 *  - safe-area-inset-bottom para iOS notch
 *
 * Por qué este componente: el usuario llega a un blog post o comparativa via
 * SEO, scrollea contenido, y se va sin descubrir /deals. Esta barra fija captura
 * 8-15% de esos abandonos al hacer un CTA persistente y visual.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "tc-sticky-cta-dismissed-v1";
const SCROLL_TRIGGER_PCT = 0.4; // 40% scroll
// Páginas donde NO mostrar (ya tienen CTA propio dominante)
const HIDDEN_PATHS = ["/deals", "/panel", "/hoteles", "/api"];

export function MobileStickyCta() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Estado inicial: leer dismiss persistido
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setDismissed(true);
        return;
      }
    } catch { /* sessionStorage bloqueado en private mode */ }

    // No mostrar en rutas excluidas
    if (HIDDEN_PATHS.some((p) => pathname?.startsWith(p))) return;

    function onScroll() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const pct = window.scrollY / total;
      if (pct >= SCROLL_TRIGGER_PCT && !visible) setVisible(true);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // check initial scroll state
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname, visible]);

  function handleDismiss() {
    setDismissed(true);
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    // Track dismiss para análisis (allowed type)
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      try {
        navigator.sendBeacon(
          "/api/track",
          new Blob(
            [JSON.stringify({ type: "share_clicked", visitor_id: "anon", meta: { src: "sticky_cta", action: "dismiss" } })],
            { type: "application/json" },
          ),
        );
      } catch { /* ignore */ }
    }
  }

  function handleCtaClick() {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      try {
        navigator.sendBeacon(
          "/api/track",
          new Blob(
            [JSON.stringify({ type: "deal_click", visitor_id: "anon", meta: { src: "sticky_cta", path: pathname || "" } })],
            { type: "application/json" },
          ),
        );
      } catch { /* ignore */ }
    }
  }

  if (dismissed || !visible) return null;

  return (
    <div
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-amber-500 text-black shadow-[0_-4px_16px_rgba(0,0,0,0.4)] border-t-2 border-amber-600"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="complementary"
      aria-label="Acceso directo a chollos"
      data-testid="mobile-sticky-cta"
    >
      <div className="flex items-stretch">
        <Link
          href="/deals?freshness=fresh&sort=cheapest"
          onClick={handleCtaClick}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold text-sm min-h-[48px] active:bg-amber-600 transition-colors focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-[-2px]"
          data-testid="sticky-cta-button"
        >
          <span aria-hidden="true">⚡</span>
          <span>Ver chollos en directo</span>
          <span className="opacity-70" aria-hidden="true">→</span>
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="px-4 py-3 min-h-[48px] text-black/70 hover:text-black active:bg-amber-600 transition-colors text-lg font-bold focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-[-2px]"
          aria-label="Cerrar barra de chollos"
          data-testid="sticky-cta-dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
