"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "cv_consent_v1";
// Escuchado por el loader de GA4 — al cambiar, recarga scripts.
const EVENT = "cv-consent-changed";

type Consent = {
  analytics: boolean;
  timestamp: string;
};

function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Consent;
  } catch {
    return null;
  }
}

function writeConsent(c: Consent) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
  // Google Consent Mode v2
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("consent", "update", {
      analytics_storage: c.analytics ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: c }));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Pequeño delay para no bloquear el LCP
    const t = setTimeout(() => {
      if (!readConsent()) setVisible(true);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const accept = () => {
    writeConsent({ analytics: true, timestamp: new Date().toISOString() });
    setVisible(false);
  };
  const reject = () => {
    writeConsent({ analytics: false, timestamp: new Date().toISOString() });
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6 bg-gray-950/95 backdrop-blur border-t border-amber-500/30"
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 id="cookie-title" className="text-white font-semibold mb-1">
            🍪 Cookies en TripCazador
          </h2>
          <p id="cookie-desc" className="text-gray-400 text-sm">
            Usamos cookies técnicas (necesarias) y, si aceptas, cookies analíticas
            anónimas para entender cómo usas el sitio. No usamos cookies de
            publicidad.{" "}
            <a href="/legal#cookies" className="text-amber-400 hover:text-amber-300 underline">
              Más información
            </a>
            .
          </p>
          {showDetails && (
            <ul id="cookie-details" className="mt-3 text-xs text-gray-300 space-y-1">
              <li>
                <strong className="text-gray-300">Técnicas</strong> — necesarias para el sitio, siempre activas.
              </li>
              <li>
                <strong className="text-gray-300">Analíticas (GA4, IP anonimizada)</strong> — solo si aceptas.
              </li>
              <li>
                <strong className="text-gray-300">Afiliación</strong> — cookies de Travelpayouts/Skyscanner cuando haces clic en &quot;Reservar&quot;, gestionadas por el tercero.
              </li>
            </ul>
          )}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            aria-expanded={showDetails}
            aria-controls="cookie-details"
            className="text-sm text-gray-300 hover:text-white px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
          >
            {showDetails ? "Ocultar detalles" : "Ver detalles"}
          </button>
          <button
            type="button"
            onClick={reject}
            className="text-sm text-gray-200 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-4 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={accept}
            className="text-sm bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-lg px-4 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:ring-amber-300"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Hook que devuelve el estado actual de consentimiento y lo mantiene al día. */
export function useConsent(): Consent | null {
  const [c, setC] = useState<Consent | null>(null);
  useEffect(() => {
    setC(readConsent());
    const handler = (e: Event) => {
      const ev = e as CustomEvent<Consent>;
      setC(ev.detail);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);
  return c;
}
