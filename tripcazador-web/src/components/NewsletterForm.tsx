"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.tripcazador.com";

type Status = "idle" | "loading" | "ok" | "already" | "error";

export function NewsletterForm({ source = "web" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, source }),
      });
      if (!res.ok) {
        const detail = (await res.json().catch(() => ({}))).detail;
        setError(detail || `Error ${res.status}`);
        setStatus("error");
        return;
      }
      const data = await res.json();
      setStatus(data.status === "already_subscribed" ? "already" : "ok");
      if (data.status === "subscribed") setEmail("");
    } catch (err) {
      setError("No se pudo conectar. Prueba en unos minutos.");
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-emerald-200">
        ✅ ¡Listo! Te hemos añadido a la lista. Pronto recibirás los mejores chollos en tu bandeja de entrada.
      </div>
    );
  }
  if (status === "already") {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-amber-200">
        Ya estás suscrito con este correo. ¡Gracias por cazar con nosotros!
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Correo electrónico
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          autoComplete="email"
          aria-describedby="newsletter-consent-desc"
          className="flex-1 bg-gray-900 border border-gray-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/40 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none transition-colors"
          disabled={status === "loading"}
        />
        <button
          type="submit"
          disabled={status === "loading" || !consent}
          className="bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-semibold rounded-lg px-6 py-2 transition-colors"
        >
          {status === "loading" ? "Enviando..." : "Suscribirme"}
        </button>
      </div>
      <label className="flex items-start gap-2 text-sm text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 accent-amber-500"
          required
        />
        <span id="newsletter-consent-desc">
          Acepto la{" "}
          <a href="/legal#privacidad" className="text-amber-400 hover:text-amber-300 underline">
            política de privacidad
          </a>{" "}
          y el tratamiento de mi correo para el envío de alertas.
        </span>
      </label>
      {status === "error" && (
        <div role="alert" aria-live="polite" className="text-sm text-red-300">
          <span aria-hidden="true">⚠️ </span>{error}
        </div>
      )}
    </form>
  );
}
