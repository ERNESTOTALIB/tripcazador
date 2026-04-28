"use client";

import { useEffect, useState } from "react";

/**
 * CurrencyToggle — abr-2026n (#217)
 *
 * Toggle ligero EUR ↔ USD / CHF / GBP. Persiste preferencia en
 * `localStorage.cv_currency`. Las tasas son hardcoded (refresh manual
 * cada cierto tiempo) — un proveedor de FX en vivo añadiría dependencia
 * + costo + RGPD que no compensa para una conversión de display.
 *
 * Para usarlo en una card de deal:
 *   const { currency, convert } = useCurrency();
 *   <span>{convert(deal.price_eur)} {currency}</span>
 *
 * El componente solo renderiza el selector. Helpers `getCurrency()` y
 * `convertEur(value)` son standalone — útiles desde cualquier card.
 */

export type SupportedCurrency = "EUR" | "USD" | "CHF" | "GBP";

// abr-2026n: tasas estimadas (1 EUR = X moneda). Refrescar cada 3 meses.
// Si se desvía > 10%, los precios se ven mal pero no rompen funcionalidad.
const RATES: Record<SupportedCurrency, number> = {
  EUR: 1.0,
  USD: 1.08,
  CHF: 0.95,
  GBP: 0.85,
};

const SYMBOLS: Record<SupportedCurrency, string> = {
  EUR: "€",
  USD: "$",
  CHF: "CHF",
  GBP: "£",
};

const STORAGE_KEY = "cv_currency";

/**
 * abr-2026w: detecta moneda preferida desde navigator.language en primer
 * visit. Mapeo: ES/IT/FR/DE/AT/PT/NL/BE → EUR; GB → GBP; CH → CHF;
 * US/CA → USD. Cualquier otro → EUR (fallback).
 *
 * Diseño: SOLO se aplica si no hay valor persistido (primer visit). Tras
 * elegir manualmente, la elección manda y la auto-detect no la sobreescribe.
 *
 * Razón pragmática: la mayoría del tráfico es DACH/ES — auto-set ahorra
 * 1-click al user típico sin complicar el flow.
 */
export function detectCurrencyFromLocale(
  locale?: string,
): SupportedCurrency {
  if (typeof window === "undefined" && !locale) return "EUR";
  const raw =
    locale ||
    (typeof navigator !== "undefined" && navigator.language) ||
    "es-ES";
  const lower = raw.toLowerCase();
  // language[-region] — usar región si existe, sino language como country
  const parts = lower.split(/[-_]/);
  const region = parts[1] || parts[0] || "";
  // Por región explícita
  if (region === "gb" || region === "uk") return "GBP";
  if (region === "ch") return "CHF";
  if (region === "us" || region === "ca") return "USD";
  // EUR-zone explícita o language en zona euro (es, it, fr, de, pt, nl, el, fi, ga, mt)
  const euLangs = new Set([
    "es", "it", "fr", "de", "pt", "nl", "el", "fi", "ga", "mt",
    "lt", "lv", "et", "sk", "sl", "hr", "ca", "eu", "gl",
  ]);
  if (euLangs.has(parts[0])) return "EUR";
  return "EUR";
}

export function getStoredCurrency(): SupportedCurrency {
  if (typeof window === "undefined") return "EUR";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && v in RATES) return v as SupportedCurrency;
    // abr-2026w: si no hay preferencia guardada, auto-detect.
    // No persistimos — sólo "guess inicial". Si el user toca el toggle, eso
    // ES persistido como elección explícita.
    return detectCurrencyFromLocale();
  } catch {
    /* noop */
  }
  return "EUR";
}

export function convertFromEur(value: number, target: SupportedCurrency): number {
  return value * (RATES[target] ?? 1.0);
}

export function formatPrice(value: number, target: SupportedCurrency): string {
  const converted = convertFromEur(value, target);
  // Sin decimales — los chollos van con número entero.
  const rounded = Math.round(converted);
  return `${SYMBOLS[target]}${rounded.toLocaleString("es-ES")}`;
}

export function CurrencyToggle({
  className = "",
}: {
  className?: string;
}) {
  const [currency, setCurrency] = useState<SupportedCurrency>("EUR");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCurrency(getStoredCurrency());
    setHydrated(true);
  }, []);

  function pick(c: SupportedCurrency) {
    setCurrency(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* noop */
    }
    // Notificar a otros componentes que escuchen cambios
    window.dispatchEvent(
      new CustomEvent("cv-currency-changed", { detail: c }),
    );
  }

  if (!hydrated) {
    // Skeleton compacto para no causar layout shift al hydrate.
    return (
      <div
        aria-hidden="true"
        className={`inline-flex items-center gap-1 ${className}`}
      >
        <div className="h-7 w-32 bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  const options: SupportedCurrency[] = ["EUR", "USD", "CHF", "GBP"];

  return (
    <div
      role="group"
      aria-label="Cambiar moneda de visualización"
      className={`inline-flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 ${className}`}
    >
      {options.map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={currency === c}
          onClick={() => pick(c)}
          className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            currency === c
              ? "bg-amber-500 text-gray-900"
              : "text-gray-300 hover:text-white hover:bg-gray-800"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

/**
 * Hook auxiliar para componentes que muestran precios.
 *
 * Escucha el custom event `cv-currency-changed` (emitido por el toggle)
 * y se re-renderiza al cambiar moneda. NO usa Context para mantenerlo
 * standalone (evita prop-drilling en cards/list ya pintadas SSR).
 */
export function useDisplayCurrency() {
  const [currency, setCurrency] = useState<SupportedCurrency>("EUR");

  useEffect(() => {
    setCurrency(getStoredCurrency());
    function onChange(e: Event) {
      const detail = (e as CustomEvent<SupportedCurrency>).detail;
      if (detail && detail in RATES) setCurrency(detail);
    }
    window.addEventListener("cv-currency-changed", onChange);
    return () => window.removeEventListener("cv-currency-changed", onChange);
  }, []);

  return {
    currency,
    convert: (eur: number) => convertFromEur(eur, currency),
    format: (eur: number) => formatPrice(eur, currency),
  };
}
