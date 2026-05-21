"use client";

/**
 * CurrencyConverter — SSS380 (21 may 2026)
 *
 * Widget compacto para mostrar precio EUR en otra moneda. Audience LATAM
 * que ve €299 y necesita saber lo que cuesta en pesos/reales.
 *
 * Defaults: detecta moneda preferida via destination IATA. User puede
 * cambiar via select. Selección se persiste en localStorage.
 */

import { useEffect, useState } from "react";
import {
  convertFromEur,
  formatCurrency,
  defaultCurrencyForIata,
  listSupportedCurrencies,
  nameFor,
  type CurrencyCode,
} from "@/lib/currency_convert";

interface Props {
  amountEur: number;
  destinationIata?: string;
  variant?: "inline" | "card";
}

const LS_KEY = "tc_preferred_currency";

export function CurrencyConverter({
  amountEur,
  destinationIata,
  variant = "inline",
}: Props) {
  const defaultCurr = destinationIata
    ? defaultCurrencyForIata(destinationIata)
    : "EUR";
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurr);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LS_KEY) as CurrencyCode | null;
    if (stored && listSupportedCurrencies().includes(stored)) {
      setCurrency(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currency !== "EUR") {
      window.localStorage.setItem(LS_KEY, currency);
    } else {
      window.localStorage.removeItem(LS_KEY);
    }
  }, [currency]);

  if (currency === "EUR") {
    if (variant === "card") {
      return (
        <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-300">Ver precio en otra moneda</p>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="px-2 py-1 rounded bg-black/40 border border-gray-700 text-xs text-white"
              aria-label="Convertir a otra moneda"
            >
              {listSupportedCurrencies().map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }
    return (
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        className="px-2 py-1 rounded bg-black/40 border border-gray-700 text-xs text-gray-300"
        aria-label="Ver en otra moneda"
      >
        <option value="EUR">€ EUR</option>
        {listSupportedCurrencies()
          .filter((c) => c !== "EUR")
          .map((c) => (
            <option key={c} value={c}>
              ≈ {c}
            </option>
          ))}
      </select>
    );
  }

  const converted = convertFromEur(amountEur, currency);

  if (variant === "card") {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400">Precio aprox. en {nameFor(currency)}</p>
            <p className="text-xl font-bold text-white">
              {formatCurrency(converted, currency)}
            </p>
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="px-2 py-1 rounded bg-black/40 border border-gray-700 text-xs text-white"
            aria-label="Cambiar moneda"
          >
            {listSupportedCurrencies().map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          Tasa referencia (puede variar al pagar)
        </p>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 text-sm text-gray-300">
      <span className="text-gray-400">≈</span>
      <span className="font-semibold text-white">
        {formatCurrency(converted, currency)}
      </span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        className="px-1 py-0.5 rounded bg-transparent border border-gray-700 text-xs text-gray-300"
        aria-label="Cambiar moneda"
      >
        {listSupportedCurrencies().map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
