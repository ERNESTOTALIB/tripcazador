"use client";

/**
 * PremiumUpgradeButton — fase ww WW8 + SSS63 instrumentación
 *
 * CTA principal de la página /premium. Lanza el flow de upgrade:
 *   1. Si STRIPE_PRICE_ID está configurado → POST /api/premium/checkout → redirect Stripe Checkout
 *   2. Si no (modo MVP sin Stripe) → activa trial 7 días en localStorage para validar
 *      conversión antes de gastar en Stripe API
 *
 * SSS63: emite premium_cta_view (IntersectionObserver, 1× sesión) +
 * premium_cta_click → funnel monitoring.
 */
import { useEffect, useRef, useState } from "react";
import { activateTrial, getPremiumStatus, type PremiumStatus } from "@/lib/premium";
import { tcTrack, tcTrackOnce } from "@/lib/track_client";
import { capturePendingReferralFromUrl } from "@/lib/referral_client";

export function PremiumUpgradeButton() {
  const [status, setStatus] = useState<PremiumStatus>({
    active: false,
    tier: "free",
    source: "manual",
  });
  const [loading, setLoading] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setStatus(getPremiumStatus());
    // SSS321: capturar pending referral (?ref=&r=) si llegamos vía link
    // de referido. Persiste en localStorage para que el redeem post-checkout
    // sepa quién refirió.
    capturePendingReferralFromUrl();
    function onChange(e: Event) {
      setStatus((e as CustomEvent).detail);
    }
    window.addEventListener("tc:premium-changed", onChange);
    return () => window.removeEventListener("tc:premium-changed", onChange);
  }, []);

  // SSS63: dispara premium_cta_view cuando el botón entra en viewport
  useEffect(() => {
    const node = btnRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            tcTrackOnce("premium_cta_view", "premium_upgrade_btn", {
              source: typeof location !== "undefined" ? location.pathname : "/",
            });
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  async function handleClick() {
    setLoading(true);
    // SSS63: emit premium_cta_click sin importar si Stripe responde o no
    tcTrack("premium_cta_click", {
      source: typeof location !== "undefined" ? location.pathname : "/",
      tier: status.tier,
    });

    // Intento Stripe Checkout
    try {
      const res = await fetch("/api/premium/checkout", { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch {
      /* fallback */
    }

    // MVP fallback: activar trial 7 días en localStorage + analytics
    activateTrial();
    setStatus(getPremiumStatus());
    setLoading(false);

    // Track conversion intent (legacy event, mantener para retro-compat)
    try {
      navigator.sendBeacon(
        "/api/track",
        JSON.stringify({
          type: "premium_upgrade_intent",
          meta: { source: "/premium" },
        }),
      );
    } catch {
      /* best effort */
    }
  }

  if (status.active) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 font-semibold text-sm">
          ✓ Premium activo {status.expiresAt && `· hasta ${new Date(status.expiresAt).toLocaleDateString("es-ES")}`}
        </div>
        <p className="text-xs text-gray-400 mt-3">Gestiona tu suscripción desde <a href="/panel" className="text-amber-400 hover:underline">/panel</a></p>
      </div>
    );
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      disabled={loading}
      className="w-full px-6 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold text-lg rounded-xl transition-colors shadow-lg shadow-amber-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
    >
      {loading ? "Procesando…" : "Empieza tu prueba de 7 días gratis"}
    </button>
  );
}
