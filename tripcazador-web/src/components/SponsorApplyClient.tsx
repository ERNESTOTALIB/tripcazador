"use client";
/**
 * SponsorApplyClient.tsx — SUPER-SPONSORS (25 may 2026)
 *
 * Form interactivo client-side. Recoge tier+brand+url+email+tagline
 * y POST a /api/sponsors/checkout. Si responde { url } redirige a
 * Stripe Checkout. Si responde 503 sponsor_price_not_configured,
 * fallback a mailto.
 */

import { useState } from "react";
import { SPONSOR_TIERS, type SponsorTierSlug } from "@/lib/sponsors_catalog";

interface FormState {
  tier: SponsorTierSlug;
  brand: string;
  url: string;
  contact_email: string;
  tagline: string;
}

const INITIAL: FormState = {
  tier: "newsletter",
  brand: "",
  url: "",
  contact_email: "",
  tagline: "",
};

export default function SponsorApplyClient() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/sponsors/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (res.status === 503 && data?.error === "sponsor_price_not_configured") {
        // Fallback mailto si Stripe prices no están set todavía
        const subject = `Sponsorship ${form.tier} — ${form.brand}`;
        const body =
          `Hola,\n\nMe interesa el tier ${form.tier}.\n\n` +
          `Marca: ${form.brand}\n` +
          `URL: ${form.url}\n` +
          `Email contacto: ${form.contact_email}\n` +
          `Tagline: ${form.tagline}\n\n` +
          `(Stripe Checkout no disponible — admin contactará en 24-48h)\n`;
        window.location.href = `mailto:partners@tripcazador.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        return;
      }
      setError(data?.error || `Error HTTP ${res.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "network_error");
    } finally {
      setLoading(false);
    }
  }

  const selectedTier = SPONSOR_TIERS.find((t) => t.slug === form.tier);

  return (
    <section
      id="apply"
      className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent p-6"
    >
      <h2 className="text-2xl font-bold text-white">Aplicar self-serve</h2>
      <p className="text-sm text-gray-400 mt-1">
        Rellena estos 5 campos. Te redirigimos a Stripe para pagar. Sponsor
        entra en cola de aprobación (max 24h).
      </p>

      <form onSubmit={submit} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm sm:col-span-2">
          <span className="text-gray-300">Tier</span>
          <select
            value={form.tier}
            onChange={(e) => set("tier", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white text-sm"
            disabled={loading}
          >
            {SPONSOR_TIERS.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name} — {t.priceEur} € / {t.period}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="text-gray-300">Nombre de marca *</span>
          <input
            type="text"
            value={form.brand}
            onChange={(e) => set("brand", e.target.value)}
            required
            minLength={2}
            maxLength={80}
            placeholder="Ej. Holafly"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white text-sm"
            disabled={loading}
          />
        </label>

        <label className="text-sm">
          <span className="text-gray-300">URL destino *</span>
          <input
            type="url"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            required
            placeholder="https://holafly.com/?utm_source=tripcazador"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white text-sm"
            disabled={loading}
          />
        </label>

        <label className="text-sm">
          <span className="text-gray-300">Email contacto *</span>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => set("contact_email", e.target.value)}
            required
            placeholder="partnerships@holafly.com"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white text-sm"
            disabled={loading}
          />
        </label>

        <label className="text-sm">
          <span className="text-gray-300">Tagline (1 línea, opcional)</span>
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            maxLength={140}
            placeholder="eSIM ilimitada para tus viajes — desde 19 €"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white text-sm"
            disabled={loading}
          />
        </label>

        <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !form.brand || !form.url || !form.contact_email}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-3 text-black font-bold text-sm"
          >
            {loading
              ? "Cargando…"
              : selectedTier
                ? `Pagar ${selectedTier.priceEur} € →`
                : "Continuar"}
          </button>
          <p className="text-xs text-gray-500">
            Stripe Checkout. Reembolso 100% si rechazamos el sponsor.
          </p>
        </div>

        {error && (
          <p className="sm:col-span-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
