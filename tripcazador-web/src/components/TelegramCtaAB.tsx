"use client";

import { useEffect, useState } from "react";
import { getVariant, trackConversion } from "@/lib/ab";

/**
 * TelegramCtaAB — abr-2026o (#222)
 *
 * Wrapper del CTA Telegram que pinta una de dos variantes según el
 * experimento `telegram_cta_v2`. Mide cuál convierte mejor.
 *
 *   A: "Únete al canal de Telegram"  (control, copy original)
 *   B: "🔔 Recibir alertas en Telegram"  (variante con énfasis en utilidad)
 *
 * El componente es client-only (la asignación necesita localStorage).
 * Mientras hidrata, render del control para evitar layout shift.
 */

const TELEGRAM_URL = "https://t.me/tripcazador_bot";

interface Props {
  className?: string;
  /** Etiqueta forzada — útil para tests o secciones donde el A/B no aplica. */
  forceVariant?: "A" | "B";
}

export function TelegramCtaAB({ className = "", forceVariant }: Props) {
  const [variant, setVariant] = useState<"A" | "B">("A");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (forceVariant) {
      setVariant(forceVariant);
    } else {
      setVariant(getVariant("telegram_cta_v2"));
    }
    setHydrated(true);
  }, [forceVariant]);

  const label =
    variant === "B" ? "🔔 Recibir alertas en Telegram" : "Únete al canal de Telegram";

  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (!forceVariant) trackConversion("telegram_cta_v2");
      }}
      className={`inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-5 py-3 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${className}`}
      data-experiment="telegram_cta_v2"
      data-variant={hydrated ? variant : "A"}
    >
      {label}
    </a>
  );
}
