"use client";
/**
 * SocialProofToast — F3 (May 2026)
 *
 * Toast en esquina inferior izquierda con eventos reales de booking_url_opened
 * (anonymizados). Carga desde /api/social-proof, rota cada 8s, dismissable.
 *
 * Consent-aware: sólo se muestra si tc_consent_marketing=1 en cookies.
 * Frecuencia: 1 toast cada 25s, máximo 4 toasts por sesión.
 */
import { useEffect, useRef, useState } from "react";

type ProofEvent = {
  city: string;
  country: string;
  destination: string;
  price?: number;
  origin?: string;
  ago_min: number;
};

const ROTATE_MS = 8000;
const DELAY_MS = 5000; // delay before first toast
const INTER_MS = 25000;
const MAX_TOASTS = 4;
const SESSION_KEY = "tc_social_proof_count_v1";

function readSessionCount(): number {
  try {
    return Number(sessionStorage.getItem(SESSION_KEY) || "0");
  } catch {
    return 0;
  }
}
function bumpSessionCount() {
  try {
    sessionStorage.setItem(SESSION_KEY, String(readSessionCount() + 1));
  } catch {
    // ignore
  }
}

function hasMarketingConsent(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("tc_consent_marketing=1") || document.cookie.includes("tc_consent=all");
}

export function SocialProofToast() {
  const [events, setEvents] = useState<ProofEvent[]>([]);
  const [idx, setIdx] = useState(-1); // -1 = hidden
  const [dismissed, setDismissed] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!hasMarketingConsent()) return;
    if (readSessionCount() >= MAX_TOASTS) return;

    let mounted = true;
    fetch("/api/social-proof")
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data?.events) && data.events.length > 0) {
          setEvents(data.events.slice(0, 10));
          // Show first toast after delay
          setTimeout(() => {
            if (mounted) setIdx(0);
          }, DELAY_MS);
        }
      })
      .catch(() => {
        // ignore
      });

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (idx < 0 || dismissed || events.length === 0) return;
    bumpSessionCount();
    if (readSessionCount() > MAX_TOASTS) {
      setDismissed(true);
      return;
    }
    intervalRef.current = setTimeout(() => {
      setIdx(-1); // hide
      setTimeout(() => {
        const next = (idx + 1) % events.length;
        if (readSessionCount() < MAX_TOASTS && !dismissed) setIdx(next);
      }, INTER_MS);
    }, ROTATE_MS);
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [idx, dismissed, events]);

  if (idx < 0 || dismissed || !events[idx]) return null;
  const ev = events[idx];

  const minLabel =
    ev.ago_min < 1
      ? "ahora mismo"
      : ev.ago_min < 60
        ? `hace ${ev.ago_min} min`
        : ev.ago_min < 1440
          ? `hace ${Math.floor(ev.ago_min / 60)}h`
          : `hace ${Math.floor(ev.ago_min / 1440)}d`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-3 z-40 max-w-sm bg-slate-900/95 border border-amber-400/30 rounded-lg shadow-2xl p-3 backdrop-blur-sm animate-slide-up"
      style={{ animation: "slideUp 0.4s ease-out" }}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0" aria-hidden="true">
          ✈️
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white">
            <span className="font-bold text-amber-400">Alguien de {ev.city}</span> acaba de buscar{" "}
            <span className="font-bold">{ev.destination}</span>
            {ev.price ? <> · <span className="text-amber-400">{ev.price}€</span></> : null}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{minLabel}</p>
        </div>
        <button
          aria-label="Cerrar"
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-white p-1 -m-1 shrink-0"
        >
          ×
        </button>
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
