"use client";

import { useEffect, useState } from "react";
import { getVariant } from "@/lib/ab";

/**
 * HeroCopyAB — fase ff-C4
 *
 * A/B test del título principal de home. Variantes:
 *   A (control): "El cazador automático de chollos de vuelo"
 *   B (variant): "Vuelos hasta -70% antes que nadie"
 *
 * Subline también cambia para coherencia. CTA principal igual.
 *
 * Tracking: getVariant("hero_copy_v1") + GA4 event experiment_exposure
 * + cuando el usuario clica "Ver todos los deals" emitimos
 * hero_cta_click con variant attached.
 *
 * Hidratación: el componente renderiza variant="A" (control) en SSR para
 * evitar hydration mismatch. En cliente, useEffect detecta y aplica B si
 * corresponde. Esto significa que ~50% de usuarios B ven A breve y luego
 * cambia (<100ms). Aceptable para A/B test inicial.
 */

const VARIANTS = {
  A: {
    h1Lead: "El cazador automático de",
    h1Highlight: "chollos de vuelo",
    sub: "Error fares, Business class a precio de economy y los mejores chollos desde aeropuertos europeos. Rastrea 750+ aerolíneas 24/7.",
  },
  B: {
    h1Lead: "Vuelos hasta",
    h1Highlight: "-70% antes que nadie",
    sub: "Detectamos en minutos los errores de tarifa que aparecen y desaparecen en horas. Activa una alerta y te avisamos por email cuando aparezca tu próximo viaje.",
  },
};

export function HeroCopyAB() {
  // SSR siempre renderiza A para evitar mismatch de hidratación
  const [variant, setVariant] = useState<"A" | "B">("A");

  useEffect(() => {
    // getVariant ya emite el experiment_exposure event a GA4 internamente.
    const v = getVariant("hero_copy_v1");
    if (v === "B") {
      setVariant("B");
    }
  }, []);

  const copy = VARIANTS[variant];

  return (
    <>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight" data-experiment="hero_copy_v1" data-variant={variant}>
        {copy.h1Lead}{" "}
        <br />
        <span className="text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.35)]">
          {copy.h1Highlight}
        </span>
      </h1>

      <p className="text-lg text-gray-300 max-w-2xl mx-auto">
        {copy.sub}
      </p>
    </>
  );
}
