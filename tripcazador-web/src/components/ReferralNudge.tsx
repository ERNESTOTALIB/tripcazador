"use client";

/**
 * ReferralNudge — fase mmm MMM5 (May 2026)
 *
 * Cuando el user llega a 3 favoritos guardados, le invitamos a compartir su
 * código de referido con un amigo. Ambos ganan 1 mes Premium gratis si el
 * amigo se registra.
 *
 * Se muestra una vez (localStorage flag), bottom-right toast.
 *
 * Por qué este momento: 3 favoritos = high-intent user. Convertir 1 referido
 * por cada 5 high-intent users = +20% growth orgánico.
 */
import { useEffect, useState } from "react";
import { Gift, X, Copy, Check } from "lucide-react";
import { getFavorites, subscribeFavorites } from "@/lib/favorites";

const NUDGE_KEY = "tc_referral_nudge_shown";
const FAV_THRESHOLD = 3;

export function ReferralNudge() {
  const [show, setShow] = useState(false);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(NUDGE_KEY)) return;
    } catch {
      return;
    }

    const checkFavs = () => {
      const favs = getFavorites();
      if (favs.length >= FAV_THRESHOLD) {
        // Get or generate referral code from the existing system
        let stored = "";
        try {
          stored = localStorage.getItem("tc_referral_code_v1") || "";
        } catch {
          /* no-op */
        }
        if (!stored) {
          // Simple TC-XXXX generation (matches lib/referral.ts pattern)
          const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
          stored = `TC-${rand}`;
          try {
            localStorage.setItem("tc_referral_code_v1", stored);
          } catch {
            /* no-op */
          }
        }
        setCode(stored);
        setTimeout(() => setShow(true), 1200);
      }
    };
    checkFavs();
    return subscribeFavorites(checkFavs);
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(NUDGE_KEY, "1");
    } catch {
      /* no-op */
    }
  }

  async function handleCopy() {
    const url = `https://tripcazador.com/?ref=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (typeof window !== "undefined" && (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag) {
        (window as unknown as { gtag: (...a: unknown[]) => void }).gtag("event", "referral_copy", { source: "favorite_nudge" });
      }
    } catch {
      /* no-op */
    }
  }

  async function handleShare() {
    const text = `Encuentro vuelos baratos con TripCazador. Apúntate gratis con mi código y ambos ganamos 1 mes Premium: https://tripcazador.com/?ref=${code}`;
    const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }) : null;
    if (nav && typeof nav.share === "function") {
      try {
        await nav.share({ title: "TripCazador — chollos de vuelo", text });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  }

  if (!show) return null;

  return (
    <div
      role="alertdialog"
      aria-live="polite"
      aria-labelledby="referral-nudge-title"
      className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-[55] rounded-2xl border border-fuchsia-500/40 bg-gray-900 shadow-2xl shadow-fuchsia-500/10 p-4 animate-in fade-in slide-in-from-bottom-2"
      data-testid="referral-nudge"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar"
        className="absolute top-2 right-2 w-7 h-7 rounded-full text-gray-500 hover:text-white hover:bg-gray-800 inline-flex items-center justify-center"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-fuchsia-500/15 inline-flex items-center justify-center">
          <Gift size={18} className="text-fuchsia-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 id="referral-nudge-title" className="text-sm font-bold text-white">
            ¿Conoces a alguien que viaja?
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Comparte TripCazador. Si tu amig@ se apunta, ambos ganáis <span className="text-fuchsia-300 font-semibold">1 mes Premium gratis</span>.
          </p>
          {code && (
            <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700">
              <span className="text-xs font-mono text-fuchsia-300 flex-1 truncate">{code}</span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copiar código"
                className="text-gray-400 hover:text-white"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 px-3 py-2 min-h-[36px] rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-xs font-bold transition-colors"
            >
              Compartir
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="px-3 py-2 min-h-[36px] rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-colors"
            >
              Más tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
