"use client";
/**
 * UnsubscribeForm — SSS430 (23 may 2026)
 *
 * Client form que envía POST /api/newsletter/unsubscribe con email +
 * reason opcional. Honeypot incluido.
 */
import { useState } from "react";

const REASONS = [
  { value: "too_many_emails", label: "Demasiados emails" },
  { value: "not_relevant", label: "Los chollos no son relevantes para mí" },
  { value: "expensive", label: "El precio Premium es demasiado alto" },
  { value: "switching", label: "Cambio a otro servicio" },
  { value: "other", label: "Otra razón" },
];

export function UnsubscribeForm() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [hp, setHp] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), reason, hp }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt.slice(0, 200)}`);
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-6 text-center text-emerald-200">
        <div className="text-3xl">✅</div>
        <h2 className="mt-3 text-xl font-bold">Te hemos dado de baja</h2>
        <p className="mt-2 text-sm">
          No recibirás más emails de TripCazador. Sentimos verte ir — si quieres
          volver, suscríbete cuando gustes en{" "}
          <a href="/" className="underline">tripcazador.com</a>.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800/40 p-6"
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

      <label className="block">
        <span className="text-sm font-semibold text-white">¿Por qué te das de baja? (opcional)</span>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={status === "submitting"}
          className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="">— Prefiero no decir —</option>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </label>

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

      {status === "error" && (
        <p className="text-xs text-red-300">Algo falló: {errorMsg}.</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting" || !email}
        className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "submitting" ? "Procesando…" : "Darme de baja"}
      </button>
    </form>
  );
}

export default UnsubscribeForm;
