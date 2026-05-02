"use client";

/**
 * PremiumUpgradeButton — fase ww WW8
 *
 * CTA principal de la página /premium. Lanza el flow de upgrade:
 *   1. Si STRIPE_PRICE_ID está configurado → POST /api/premium/checkout → redirect Stripe Checkout
 *   2. Si no (modo MVP sin Stripe) → activa trial 7 días en localStorage para validar
 *      conversión antes de gastar en Stripe API
 *
 * Cuando se conecte Stripe webhook esto se reemplazará por server-side state
 * con cookie httpOnly. De momento client-only es suficiente para validar mercado.
 */
import { useEffect, useState } from "react";
import { activateTrial, getPremiumStatus, type PremiumStatus } from "@/lib/premium";

export function PremiumUpgradeButton() {
  const [status, setStatus] = useState<PremiumStatus>({
    active: false,
    tier: "free",
    source: "manual",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStatus(getPremiumStatus());
    function onChange(e: Event) {
      setStatus((e as CustomEvent).detail);
    }
    window.addEventListener("tc:premium-changed", onChange);
    return () => window.removeEventListener("tc:premium-changed", onChange);
  }, []);

  async function handleClick() {
    setLoading(true);

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

    // Track conversion intent
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
      onClick={handleClick}
      disabled={loading}
      className="w-full px-6 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold text-lg rounded-xl transition-colors shadow-lg shadow-amber-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
    >
      {loading ? "Procesando…" : "Empieza tu prueba de 7 días gratis"}
    </button>
  );
}
