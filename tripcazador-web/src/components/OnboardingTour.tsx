"use client";

/**
 * OnboardingTour — fase ww WW5
 *
 * Tour de bienvenida en primera visita. 4 steps: searchbar → deals → alertas → telegram.
 * LocalStorage flag tc_onboarded_v1. Skippable con Esc.
 *
 * Aparece solo en la home (/) cuando el flag no existe. No molesta a returning
 * visitors. CSS minimal-effort (overlay + tooltip simple sin libs externas).
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const KEY = "tc_onboarded_v1";

interface Step {
  title: string;
  body: string;
  emoji: string;
}

const STEPS: Step[] = [
  {
    emoji: "🔍",
    title: "Busca un vuelo en 5 segundos",
    body: "Pon origen, destino y fecha. Te llevamos a Skyscanner con la búsqueda exacta — sin redirecciones raras ni precios inflados.",
  },
  {
    emoji: "🔥",
    title: "Mira los chollos del momento",
    body: "Abajo verás los 70 mejores chollos detectados ahora. Error fares, Business class barato, fines de semana baratos — actualizado 24/7.",
  },
  {
    emoji: "🔔",
    title: "Alertas para no perderte nada",
    body: "Crea una alerta para tu ruta y precio máximo. Cuando aparezca, te avisamos por email + push. Premium notifica en menos de 60 segundos.",
  },
  {
    emoji: "📲",
    title: "Únete al Telegram",
    body: "Publicamos los TOP 3 chollos cada 8 horas. Gratis, sin spam, y allí pillarás los error fares 1-2 horas antes que en la web.",
  },
];

export function OnboardingTour() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (pathname !== "/" && pathname !== "/en") return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY)) return;

    // SSS156: deshabilitado auto-popup. El modal `fixed inset-0 z-[9999]`
    // atrapaba wheel events y daba la impresión de scroll bloqueado al
    // usuario (reportado en Chrome). Ahora opt-in: solo aparece si la URL
    // tiene `?tour=1` (link explícito desde footer u onboarding intencional).
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") !== "1") return;

    // Si llega aquí (con ?tour=1) sí aparece el tour con delay corto.
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, step]);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setVisible(false);
    try {
      navigator.sendBeacon(
        "/api/track",
        JSON.stringify({ type: "onboarding_dismissed", meta: { step } }),
      );
    } catch {}
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }
  function prev() {
    if (step > 0) setStep(step - 1);
  }

  if (!visible) return null;

  const s = STEPS[step];

  return (
    <div
      role="dialog"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-950 border border-amber-500/30 rounded-2xl p-6 shadow-2xl shadow-amber-500/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
            Paso {step + 1} / {STEPS.length}
          </div>
          <button
            onClick={dismiss}
            className="text-gray-500 hover:text-white text-2xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
            aria-label="Cerrar tour"
          >
            ×
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-amber-400" : "bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-5xl mb-4" aria-hidden="true">
          {s.emoji}
        </div>
        <h2 id="onboarding-title" className="text-xl font-bold text-white mb-2">
          {s.title}
        </h2>
        <p className="text-sm text-gray-300 leading-relaxed">{s.body}</p>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <button
            onClick={dismiss}
            className="text-xs text-gray-500 hover:text-gray-300 underline"
          >
            Saltar tour
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg"
              >
                ← Atrás
              </button>
            )}
            <button
              onClick={next}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-lg"
            >
              {step < STEPS.length - 1 ? "Siguiente →" : "¡Empezar!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
