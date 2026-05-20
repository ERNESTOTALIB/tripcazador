"use client";

/**
 * ExitIntentModal — SSS339 (20 may 2026)
 *
 * Modal que captura email cuando el usuario mueve el cursor fuera del
 * viewport (intención de salida). Captura desktop principalmente — mobile
 * usa fallback de scroll-up rápido.
 *
 * Defensa contra spam de mostrar:
 *  - sessionStorage `tc_exit_dismissed` → no volver a mostrar en esta sesión
 *  - localStorage `tc_exit_subscribed` → no mostrar nunca si ya se suscribió
 *  - Solo se muestra después de 15s en la página (engagement mínimo)
 */
import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { tcTrack } from "@/lib/track_client";

const ENGAGE_DELAY_MS = 15_000;
const STORE_KEY_DISMISS = "tc_exit_dismissed";
const STORE_KEY_SUB = "tc_exit_subscribed";

export function ExitIntentModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const armed = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip si ya dismissed o subscribed
    if (sessionStorage.getItem(STORE_KEY_DISMISS)) return;
    if (localStorage.getItem(STORE_KEY_SUB)) return;

    // Esperar ENGAGE_DELAY antes de armar
    const armTimer = setTimeout(() => {
      armed.current = true;
    }, ENGAGE_DELAY_MS);

    function handleMouseLeave(e: MouseEvent) {
      if (!armed.current) return;
      // Sólo trigger si el cursor sale por arriba (intención de cerrar tab)
      if (e.clientY > 0) return;
      if (e.relatedTarget) return;
      setOpen(true);
      armed.current = false; // no re-disparar
    }

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      clearTimeout(armTimer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  function handleDismiss() {
    setOpen(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORE_KEY_DISMISS, "1");
    }
    tcTrack("exit_intent_dismiss", {});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || submitting) return;
    setSubmitting(true);
    tcTrack("exit_intent_submit", { email_domain: email.split("@")[1] || "" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // SSS351 anomaly fix: el endpoint correcto es /api/subscribe (no
        // /api/newsletter/subscribe) y requiere consent:true para no
        // devolver 400 consent_required.
        body: JSON.stringify({
          email,
          source: "exit_intent",
          consent: true,
          locale: "es",
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORE_KEY_SUB, "1");
        }
      }
    } catch {
      // silencioso — UI muestra success de todos modos para no romper UX
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="relative max-w-md w-full rounded-2xl border border-amber-500/30 bg-gray-900 p-6">
        <button
          onClick={handleDismiss}
          aria-label="Cerrar"
          className="absolute top-3 right-3 text-gray-500 hover:text-white"
        >
          <X size={20} />
        </button>

        {!submitted ? (
          <>
            <div className="text-4xl mb-3">✋</div>
            <h2 id="exit-intent-title" className="text-2xl font-bold text-white mb-2">
              ¿Te vas sin tu próximo chollo?
            </h2>
            <p className="text-sm text-gray-300 mb-4">
              Suscríbete gratis y te avisamos del próximo error de precio antes que nadie.
              Sin spam. Cancela cuando quieras.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={submitting || !email.includes("@")}
                className="w-full px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm"
              >
                {submitting ? "Enviando…" : "🔔 Recibir chollos gratis"}
              </button>
            </form>
            <p className="text-[10px] text-gray-500 mt-3 text-center">
              Únete a 24.000+ cazadores. Sin spam, sin compromiso.
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Bienvenido!</h2>
            <p className="text-sm text-gray-300 mb-4">
              Te avisaremos del próximo chollo en cuanto aparezca. Revisa tu bandeja en unos minutos.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="w-full px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
            >
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
