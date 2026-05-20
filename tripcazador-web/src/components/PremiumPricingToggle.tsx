"use client";

/**
 * PremiumPricingToggle — SSS335 (20 may 2026)
 *
 * Toggle Mensual / Anual con CTA Stripe Checkout. Reemplaza el botón
 * legacy en /premium dando opción al user de elegir billing cycle.
 *
 * Annual €99/año = ahorro €20.88 vs 12×€9.99. Pricing display "€8.25/mes
 * cuando pagas anual" para framing.
 */

import { useState, useEffect, useRef } from "react";
import { getPremiumStatus, type PremiumStatus } from "@/lib/premium";
import { tcTrack, tcTrackOnce } from "@/lib/track_client";

type Cycle = "monthly" | "annual";

export function PremiumPricingToggle() {
  const [status, setStatus] = useState<PremiumStatus>({
    active: false,
    tier: "free",
    source: "manual",
  });
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [loading, setLoading] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setStatus(getPremiumStatus());
    const onChange = (e: Event) => setStatus((e as CustomEvent).detail);
    window.addEventListener("tc:premium-changed", onChange);
    return () => window.removeEventListener("tc:premium-changed", onChange);
  }, []);

  useEffect(() => {
    const node = btnRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            tcTrackOnce("premium_cta_view", "premium_pricing_toggle", {
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

  async function handleSubscribe() {
    setLoading(true);
    tcTrack("premium_cta_click", {
      source: typeof location !== "undefined" ? location.pathname : "/",
      tier: status.tier,
      cycle,
    });
    try {
      const res = await fetch("/api/premium/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle }),
      });
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
    setLoading(false);
  }

  if (status.active) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 font-semibold text-sm">
          ✓ Premium activo {status.expiresAt && `· hasta ${new Date(status.expiresAt).toLocaleDateString("es-ES")}`}
        </div>
        <p className="text-xs text-gray-400 mt-3">Gestiona en <a href="/panel/premium" className="text-amber-400 hover:underline">/panel/premium</a></p>
      </div>
    );
  }

  const monthlyTotal = "9,99€";
  const annualTotal = "99€";
  const annualPerMonth = "8,25€";

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="inline-flex rounded-full bg-gray-900 border border-gray-800 p-1 mx-auto">
        <button
          type="button"
          onClick={() => setCycle("monthly")}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
            cycle === "monthly"
              ? "bg-amber-500 text-black"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Mensual
        </button>
        <button
          type="button"
          onClick={() => setCycle("annual")}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition relative ${
            cycle === "annual"
              ? "bg-amber-500 text-black"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Anual
          <span className="ml-2 inline-block px-1.5 py-0.5 bg-emerald-500/30 text-emerald-200 text-[10px] rounded">
            -17%
          </span>
        </button>
      </div>

      {/* Price display */}
      <div className="text-center">
        {cycle === "monthly" ? (
          <>
            <div className="text-5xl font-bold text-white">
              {monthlyTotal}
              <span className="text-lg text-gray-400 font-normal">/mes</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              o solo <strong className="text-amber-300">0,33€/día</strong> · cancela cuando quieras
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl font-bold text-emerald-300">
              {annualTotal}
              <span className="text-lg text-gray-400 font-normal">/año</span>
            </div>
            <div className="text-xs text-emerald-200 mt-1">
              = <strong>{annualPerMonth}/mes</strong> · ahorras <strong>20,88€</strong> vs mensual · 2 meses gratis
            </div>
          </>
        )}
      </div>

      <button
        ref={btnRef}
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full px-6 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold text-lg rounded-xl transition-colors shadow-lg shadow-amber-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        {loading
          ? "Procesando…"
          : cycle === "annual"
            ? "Empieza prueba 14 días gratis · Anual"
            : "Empieza prueba 14 días gratis · Mensual"}
      </button>

      <div className="text-xs text-center text-gray-500">
        Pago seguro con Stripe · cancela en 1 click desde tu panel
      </div>
    </div>
  );
}
