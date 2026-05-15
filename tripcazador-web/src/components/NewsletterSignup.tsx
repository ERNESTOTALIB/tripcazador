"use client";

import { useState, FormEvent } from "react";
import { tcTrack } from "@/lib/track_client";

/**
 * NewsletterSignup — formulario de captación de email (abr-2026r/s).
 *
 * Ubicación: home + /destinos + below blog post body. Gating: solo se
 * dispara si el usuario ha dado consent analytics (cv_consent_v1.analytics).
 *
 * Backend: POST /api/subscribe — lo deja en cola DB (no envía email todavía
 * porque #165 SMTP creds bloqueado). Cuando SMTP esté disponible, el digest
 * semanal se mandará automáticamente desde la cola.
 *
 * UX patterns:
 *  - Inline form, no modal (evita rage-clicks).
 *  - Validación HTML5 (type=email + pattern), feedback inline.
 *  - Honeypot field oculto contra bots.
 *  - GA4 event "newsletter_signup" tras success.
 *  - Mensaje "ya estás suscrito" si el endpoint devuelve 409.
 *  - Aria-live region para feedback de screen-reader.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.origin) ||
  "";

type Status = "idle" | "submitting" | "success" | "duplicate" | "error";

interface Props {
  /** Variant visual: "compact" (1 line) o "expanded" (above-fold hero). */
  variant?: "compact" | "expanded";
  /** Opcional: contexto que se manda al backend (ej. "blog-post-marrakech"). */
  context?: string;
}

// gtag global se declara en src/components/WebVitalsReporter.tsx; no
// re-declaramos aquí para evitar conflict de tipos (TS2717).

export function NewsletterSignup({ variant = "compact", context = "site" }: Props) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || honeypot) {
      // Honeypot lleno = bot, fingimos éxito sin hacer nada
      if (honeypot) setStatus("success");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          source: context,
          consent: true, // RGPD: el botón de submit ES el consent explícito
        }),
      });
      if (res.status === 200 || res.status === 201) {
        const json = await res.json().catch(() => ({} as { status?: string }));
        if (json && json.status === "already_subscribed") {
          setStatus("duplicate");
        } else {
          setStatus("success");
          setEmail("");
          // SSS185: GA4 (gtag) + server-side /api/p (tcTrack) — newsletter_signup
          // está en FLUSH_IMMEDIATELY (SSS178), así que server lo flusha sync
          // a GitHub para que /api/admin/revenue lo cuente.
          if (typeof window !== "undefined" && typeof window.gtag === "function") {
            window.gtag("event", "newsletter_signup", { context });
          }
          tcTrack("newsletter_signup", { context });
        }
      } else if (res.status === 409) {
        setStatus("duplicate");
      } else if (res.status === 429) {
        setStatus("error");
        setErrorMsg("Demasiados intentos, espera un momento.");
      } else {
        setStatus("error");
        setErrorMsg("No pudimos suscribirte. Inténtalo más tarde.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Sin conexión. Revisa tu red.");
    }
  }

  const expanded = variant === "expanded";

  return (
    <div
      className={
        expanded
          ? "bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-6 md:p-8 space-y-4"
          : "bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3"
      }
      role="region"
      aria-labelledby="newsletter-title"
    >
      <h3
        id="newsletter-title"
        className={
          expanded
            ? "text-xl md:text-2xl font-bold text-white text-balance"
            : "text-sm font-semibold text-white"
        }
      >
        {expanded
          ? "PDF gratis: 50 hubs error-fare + chollos cada lunes"
          : "Newsletter semanal de error fares"}
      </h3>
      {expanded && (
        <p className="text-sm text-gray-300 max-w-xl">
          Te enviamos al instante el PDF <strong>&ldquo;50 hubs error-fare&rdquo;</strong> +
          un email cada lunes con los 10 chollos más bajos de la semana
          (vuelos &lt;€50 que detecta el motor). Sin spam, baja cuando quieras.
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 items-stretch">
        {/* Honeypot — bots lo llenan, humanos no lo ven (display:none) */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px" }}
        />
        <label className="flex-1 min-w-0">
          <span className="sr-only">Tu email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            disabled={status === "submitting" || status === "success"}
            className="w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none disabled:opacity-50"
            aria-describedby="newsletter-status"
          />
        </label>
        <button
          type="submit"
          disabled={status === "submitting" || status === "success"}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500 text-gray-900 font-semibold rounded transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none whitespace-nowrap"
          aria-busy={status === "submitting"}
        >
          {status === "submitting"
            ? "Suscribiendo..."
            : status === "success"
            ? "✓ Suscrito"
            : "Suscribirme"}
        </button>
      </form>
      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        className="text-xs min-h-[1em]"
      >
        {status === "success" && (
          <span className="text-emerald-400">
            ¡Listo! Te enviaremos el primer email el próximo lunes.
          </span>
        )}
        {status === "duplicate" && (
          <span className="text-amber-400">Ya estás en la lista — gracias.</span>
        )}
        {status === "error" && <span className="text-red-400">{errorMsg}</span>}
        {status === "idle" && expanded && (
          <span className="text-gray-500">
            Sin spam · Cancela cuando quieras · Datos protegidos
          </span>
        )}
      </p>
    </div>
  );
}

export default NewsletterSignup;
