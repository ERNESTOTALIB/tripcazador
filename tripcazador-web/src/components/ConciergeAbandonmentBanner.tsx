"use client";
/**
 * ConciergeAbandonmentBanner — SSS423 (23 may 2026)
 *
 * Banner fijo bottom-right que aparece en cualquier página si el
 * usuario abrió /concierge en las últimas 24h pero no completó.
 *
 * UX:
 * - Aparece 5min tras abrir concierge (evita spam dentro de sesión).
 * - Cerrable (sessionStorage tc_concierge_banner_closed = "1").
 * - CTA → /concierge/[tier]?from=abandonment&coupon=TC10 (-10%).
 * - Dismiss limpia cookie + cierra banner.
 *
 * No se muestra en /concierge* (sería redundante).
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getRecoverableAbandonment,
  clearConciergeAbandonment,
  buildRecoveryUrl,
  RECOVERY_COUPON_CODE,
  type AbandonmentState,
} from "@/lib/concierge_abandonment";

const SESSION_DISMISSED_KEY = "tc_concierge_banner_closed";

export function ConciergeAbandonmentBanner() {
  const pathname = usePathname();
  const [state, setState] = useState<AbandonmentState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Refresh logic — se ejecuta en mount y al cambiar pathname.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // No mostrar en concierge* (el user ya está allí).
    if (pathname && pathname.startsWith("/concierge")) {
      setState(null);
      return;
    }
    const sessionDismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY) === "1";
    if (sessionDismissed) {
      setDismissed(true);
      return;
    }
    const recoverable = getRecoverableAbandonment();
    setState(recoverable);
  }, [pathname]);

  if (!state || dismissed) return null;

  const recoveryUrl = buildRecoveryUrl(state);

  return (
    <aside
      role="complementary"
      aria-label="Recupera tu pedido Concierge"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-amber-500/50 bg-slate-900/95 p-4 shadow-2xl backdrop-blur"
      style={{ animation: "slide-up 0.4s ease-out" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-2xl">✈️</div>
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
            setDismissed(true);
          }}
          aria-label="Cerrar banner"
          className="-mr-1 -mt-1 rounded p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          ✕
        </button>
      </div>
      <h3 className="mt-1 text-base font-bold text-white">
        ¿Olvidaste tu pedido Concierge?
      </h3>
      <p className="mt-1 text-sm text-slate-300">
        Vuelve y completa con código{" "}
        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-amber-300">
          {RECOVERY_COUPON_CODE}
        </span>{" "}
        para -10%.
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <a
          href={recoveryUrl}
          className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-center text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400"
        >
          Recuperar pedido
        </a>
        <button
          type="button"
          onClick={() => {
            clearConciergeAbandonment();
            setDismissed(true);
          }}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
        >
          No, gracias
        </button>
      </div>
    </aside>
  );
}

export default ConciergeAbandonmentBanner;
