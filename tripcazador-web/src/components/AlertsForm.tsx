"use client";

/**
 * AlertsForm — fase SSS152
 *
 * Client component para /alertas. Form público (sin login) que crea una
 * alerta de precio vía POST /api/price-alerts.
 *
 * Estados: idle | submitting | success | error
 * Validación client-side: IATA 3 letras, precio entero > 0, email regex.
 * Tracking: emit `alert_created` via lib/track_client.
 */

import { useState } from "react";
import { tcTrack } from "@/lib/track_client";

interface FormData {
  origin: string;
  destination: string;
  max_price: string;
  email: string;
  cabin: "economy" | "business";
}

const INITIAL: FormData = {
  origin: "",
  destination: "",
  max_price: "",
  email: "",
  cabin: "economy",
};

interface AlertsFormProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialMaxPrice?: string;
}

function isIata(s: string): boolean {
  return /^[A-Z]{3}$/.test(s);
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 254;
}

export function AlertsForm({
  initialOrigin = "",
  initialDestination = "",
  initialMaxPrice = "",
}: AlertsFormProps) {
  const [data, setData] = useState<FormData>({
    ...INITIAL,
    origin: initialOrigin.toUpperCase(),
    destination: initialDestination.toUpperCase(),
    max_price: initialMaxPrice,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function fillExample(origin: string, destination: string, max: string) {
    setData((prev) => ({
      ...prev,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      max_price: max,
    }));
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const origin = data.origin.trim().toUpperCase();
    const destination = data.destination.trim().toUpperCase();
    const email = data.email.trim();
    const priceNum = parseInt(data.max_price, 10);

    if (!isIata(origin)) {
      setError("El origen debe ser un código IATA de 3 letras (ej. MAD).");
      return;
    }
    if (!isIata(destination)) {
      setError("El destino debe ser un código IATA de 3 letras (ej. NRT).");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Indica un precio objetivo en € (entero positivo).");
      return;
    }
    if (!isEmail(email)) {
      setError("El email no parece válido.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          max_price: priceNum,
          email,
          cabin: data.cabin,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        tcTrack("alert_created", {
          origin,
          destination,
          max_price: priceNum,
          cabin: data.cabin,
          source: "alertas_page",
        });
      } else {
        const body = await res.json().catch(() => ({}));
        setError(
          body.error === "rate_limit"
            ? "Demasiadas alertas. Inténtalo en una hora."
            : "No pudimos crear la alerta. Revisa los campos.",
        );
      }
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        data-testid="alerts-form-success"
        className="rounded-2xl border border-emerald-300/40 bg-emerald-50 p-6 text-emerald-900"
      >
        <h3 className="font-semibold text-lg mb-1">✅ Alerta creada</h3>
        <p className="text-sm">
          Te avisaremos por email cuando <strong>{data.origin}→{data.destination}</strong>{" "}
          baje de <strong>€{data.max_price}</strong>. Revisa también el spam la primera vez.
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setData(INITIAL);
          }}
          className="mt-3 inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
        >
          Crear otra alerta
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="alerts-form">
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">
          Ejemplos rápidos
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fillExample("MAD", "NRT", "450")}
            className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-300 hover:border-amber-400 hover:text-amber-700 transition"
          >
            MAD → NRT &lt; €450
          </button>
          <button
            type="button"
            onClick={() => fillExample("BCN", "JFK", "300")}
            className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-300 hover:border-amber-400 hover:text-amber-700 transition"
          >
            BCN → JFK &lt; €300
          </button>
          <button
            type="button"
            onClick={() => fillExample("MAD", "DPS", "550")}
            className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-300 hover:border-amber-400 hover:text-amber-700 transition"
          >
            MAD → DPS &lt; €550
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="alert-origin"
              className="text-xs uppercase tracking-wider text-slate-500 mb-1 block font-semibold"
            >
              Origen (IATA, 3 letras)
            </label>
            <input
              id="alert-origin"
              type="text"
              required
              maxLength={3}
              value={data.origin}
              onChange={(e) => update("origin", e.target.value.toUpperCase().slice(0, 3))}
              placeholder="MAD"
              className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-slate-300 focus:border-amber-400 focus:outline-none uppercase tracking-widest"
            />
          </div>
          <div>
            <label
              htmlFor="alert-destination"
              className="text-xs uppercase tracking-wider text-slate-500 mb-1 block font-semibold"
            >
              Destino (IATA, 3 letras)
            </label>
            <input
              id="alert-destination"
              type="text"
              required
              maxLength={3}
              value={data.destination}
              onChange={(e) => update("destination", e.target.value.toUpperCase().slice(0, 3))}
              placeholder="NRT"
              className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-slate-300 focus:border-amber-400 focus:outline-none uppercase tracking-widest"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="alert-max-price"
            className="text-xs uppercase tracking-wider text-slate-500 mb-1 block font-semibold"
          >
            Precio objetivo (€)
          </label>
          <input
            id="alert-max-price"
            type="number"
            min="1"
            max="50000"
            step="1"
            required
            value={data.max_price}
            onChange={(e) => update("max_price", e.target.value)}
            placeholder="450"
            className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-slate-300 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <fieldset>
          <legend className="text-xs uppercase tracking-wider text-slate-500 mb-2 block font-semibold">
            Cabina
          </legend>
          <div className="flex gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 cursor-pointer">
              <input
                type="radio"
                name="cabin"
                value="economy"
                checked={data.cabin === "economy"}
                onChange={() => update("cabin", "economy")}
                className="accent-amber-500"
              />
              <span className="text-sm">Economy</span>
            </label>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 cursor-pointer">
              <input
                type="radio"
                name="cabin"
                value="business"
                checked={data.cabin === "business"}
                onChange={() => update("cabin", "business")}
                className="accent-amber-500"
              />
              <span className="text-sm">Business</span>
            </label>
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="alert-email"
            className="text-xs uppercase tracking-wider text-slate-500 mb-1 block font-semibold"
          >
            Tu email
          </label>
          <input
            id="alert-email"
            type="email"
            required
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-slate-300 focus:border-amber-400 focus:outline-none"
          />
        </div>

        {error && (
          <div
            role="alert"
            data-testid="alerts-form-error"
            className="rounded-lg bg-red-50 border border-red-300 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center px-6 py-4 min-h-[52px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold text-base transition-colors"
        >
          {submitting ? "Creando alerta…" : "Crear alerta gratis"}
        </button>

        <p className="text-xs text-slate-500 text-center">
          Sin login. Sin spam. Cancela cuando quieras con un solo clic.
        </p>
      </form>
    </div>
  );
}
