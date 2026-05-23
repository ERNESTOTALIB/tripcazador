"use client";
/**
 * FreebieCaptureForm — SSS429 (23 may 2026)
 *
 * Formulario captura email para lead magnet. POST /api/subscribe con
 * source="freebie_${slug}" para segmentar en futuros drips.
 *
 * UX:
 * - Email + checkbox consent (RGPD)
 * - On submit: loading, después success message + link al recurso
 * - Si delivery=coming_soon, mensaje "Te avisamos en cuanto esté lista"
 * - Si delivery=blog, redirige a blog post tras 2s
 */
import { useState } from "react";

interface Props {
  slug: string;
  delivery:
    | { kind: "pdf"; pdfUrl: string }
    | { kind: "blog"; blogSlug: string }
    | { kind: "coming_soon" };
}

export function FreebieCaptureForm({ slug, delivery }: Props) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !consent) return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          consent: true,
          source: `freebie_${slug}`,
          locale: "es",
          hp,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt.slice(0, 200)}`);
      }
      setStatus("success");
      // Redirect a blog si delivery=blog
      if (delivery.kind === "blog") {
        setTimeout(() => {
          window.location.href = `/blog/${delivery.blogSlug}`;
        }, 2500);
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  if (status === "success") {
    let label = "";
    if (delivery.kind === "blog") {
      label = "¡Listo! Te redirigimos a la guía completa en 2 segundos…";
    } else if (delivery.kind === "pdf") {
      label = "¡Listo! Te enviamos el PDF por email en unos minutos.";
    } else {
      label =
        "¡Apuntado! Te avisamos por email en cuanto la guía esté disponible.";
    }
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5 text-emerald-200">
        <div className="text-2xl">✅</div>
        <h3 className="mt-2 text-base font-bold">{label}</h3>
        {delivery.kind === "pdf" && (
          <p className="mt-2 text-sm">
            Si no llega en 10 min, revisa Spam o escríbenos a{" "}
            <a href="mailto:hola@tripcazador.com" className="underline">
              hola@tripcazador.com
            </a>
            .
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-amber-500/30 bg-slate-800/40 p-5"
    >
      <label className="block">
        <span className="text-sm font-semibold text-white">Tu email:</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="hola@ejemplo.com"
          autoComplete="email"
          disabled={status === "submitting"}
          className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </label>

      {/* Honeypot — invisible para humanos, attractor para bots */}
      <input
        type="text"
        name="website"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px" }}
      />

      <label className="flex items-start gap-2 text-xs text-slate-300">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={status === "submitting"}
          className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500"
        />
        <span>
          Acepto recibir el lead magnet + newsletter de chollos. Sin spam, sin
          compartir mis datos. Puedo darme de baja en cualquier email.
        </span>
      </label>

      {status === "error" && (
        <p className="text-xs text-red-300">
          Algo falló: {errorMsg}. Reintenta o escríbenos a hola@tripcazador.com.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting" || !email || !consent}
        className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "submitting" ? "Enviando…" : "Obtener guía gratis"}
      </button>
    </form>
  );
}

export default FreebieCaptureForm;
