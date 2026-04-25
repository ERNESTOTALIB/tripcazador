"use client";

import { useEffect, useState } from "react";

/**
 * PWAInstallBanner — abr-2026o (#221)
 *
 * Banner discreto de instalación PWA. Aparece cuando:
 *   - El navegador disparó `beforeinstallprompt` (Chrome / Edge / Samsung)
 *   - El usuario lleva >30s en sesión (no agresivo en el primer pageload)
 *   - No instaló ya y no descartó previamente (localStorage flag)
 *
 * Tras dismiss, no vuelve a mostrarse en 30 días. Tras install, nunca más.
 *
 * Safari iOS no soporta beforeinstallprompt — para iOS sólo mostramos el
 * banner si la heurística `isStandalone()` es false y el user-agent es iOS.
 *
 * Registro del SW se hace acá también (un único punto de mount global desde
 * el layout root simplifica el ciclo de vida).
 */

const DISMISS_KEY = "cv_pwa_dismissed_at";
const DISMISS_DAYS = 30;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS legacy
  return Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function dismissedRecently(): boolean {
  try {
    const v = window.localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    const ts = Number(v);
    if (!Number.isFinite(ts)) return false;
    const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return days < DISMISS_DAYS;
  } catch {
    return false;
  }
}

export function PWAInstallBanner() {
  const [promptEvt, setPromptEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  // Registrar SW + escuchar beforeinstallprompt en mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1) Registrar SW
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => {
          // No bloquear UX si SW falla (ej. dev tools desactivados)
          console.warn("SW register failed", err);
        });
    }

    if (isStandalone()) return; // ya instalada
    if (dismissedRecently()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS hint: mostrar instrucciones si Safari y no está instalada
    if (isIos() && !isStandalone()) {
      const iosTimer = setTimeout(() => setIosHint(true), 30000);
      return () => {
        window.removeEventListener("beforeinstallprompt", onPrompt);
        clearTimeout(iosTimer);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  // Delay de 30s antes de revelar (Chrome / Edge)
  useEffect(() => {
    if (!promptEvt) return;
    const t = setTimeout(() => setVisible(true), 30000);
    return () => clearTimeout(t);
  }, [promptEvt]);

  function dismiss() {
    setVisible(false);
    setIosHint(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
  }

  async function install() {
    if (!promptEvt) return;
    await promptEvt.prompt();
    const result = await promptEvt.userChoice;
    if (result.outcome === "accepted") {
      // No volver a mostrar nunca — installed flag más fuerte que dismiss
      try {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now() + 365 * 24 * 60 * 60 * 1000));
      } catch {
        /* noop */
      }
    }
    setPromptEvt(null);
    setVisible(false);
  }

  // iOS hint render
  if (iosHint) {
    return (
      <div
        role="dialog"
        aria-label="Instalar TripCazador en iOS"
        className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-50 bg-gray-900/95 backdrop-blur border border-amber-500/40 rounded-2xl p-4 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden="true">📲</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              Instala TripCazador en tu iPhone
            </p>
            <p className="text-gray-300 text-xs mt-1">
              Pulsa el botón Compartir y luego{" "}
              <strong>«Añadir a la pantalla de inicio»</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar"
            className="text-gray-400 hover:text-white text-xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  if (!visible || !promptEvt) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar TripCazador como aplicación"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-50 bg-gray-900/95 backdrop-blur border border-amber-500/40 rounded-2xl p-4 shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">✈️</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">
            ¿Instalar TripCazador?
          </p>
          <p className="text-gray-300 text-xs mt-1">
            Acceso directo a chollos sin abrir el navegador. 0 publicidad,
            funciona offline para los últimos deals que has visto.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={install}
              className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold text-xs px-3 py-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              Instalar
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="text-gray-300 hover:text-white text-xs px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
