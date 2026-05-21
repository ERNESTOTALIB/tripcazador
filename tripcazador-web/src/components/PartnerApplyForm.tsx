"use client";

/**
 * PartnerApplyForm — SSS375 (21 may 2026)
 *
 * Form aplicación programa /partners/agencia. POST → /api/agency-partner/apply.
 * Sin dependencias externas.
 */

import { useState } from "react";

interface ApplyResponse {
  ok: boolean;
  slug?: string;
  ref_code?: string;
  status?: string;
  message?: string;
  error?: string;
}

export function PartnerApplyForm() {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApplyResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setResult(null);
    if (!company.trim() || !email.trim()) {
      setErr("Nombre y email son obligatorios");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/agency-partner/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: company,
          contact_email: email,
          website: website || undefined,
          niche: niche || undefined,
          audience_size_estimate: audience ? Number(audience) : undefined,
        }),
      });
      const data: ApplyResponse = await r.json();
      if (!r.ok || !data.ok) {
        setErr(data.error || "Error procesando la aplicación.");
        return;
      }
      setResult(data);
    } catch {
      setErr("Error de red. Intenta de nuevo en unos minutos.");
    } finally {
      setLoading(false);
    }
  }

  if (result?.ok) {
    return (
      <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-5">
        <p className="text-2xl font-bold text-green-300 mb-2">¡Aplicación recibida!</p>
        <p className="text-sm text-gray-200">
          Tu código tentativo es{" "}
          <code className="px-2 py-0.5 rounded bg-black/40 text-amber-300">
            {result.ref_code}
          </code>
          . Te confirmaremos por email en 24-48h tras revisar tu perfil.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="pa-company" className="block text-sm font-semibold text-white mb-1">
          Nombre empresa/proyecto *
        </label>
        <input
          id="pa-company"
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          maxLength={120}
          className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-gray-700 text-white"
        />
      </div>
      <div>
        <label htmlFor="pa-email" className="block text-sm font-semibold text-white mb-1">
          Email contacto *
        </label>
        <input
          id="pa-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={120}
          className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-gray-700 text-white"
        />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="pa-web" className="block text-sm font-semibold text-white mb-1">
            Website / Instagram
          </label>
          <input
            id="pa-web"
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            maxLength={200}
            placeholder="https://… o @user"
            className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-gray-700 text-white"
          />
        </div>
        <div>
          <label htmlFor="pa-niche" className="block text-sm font-semibold text-white mb-1">
            Nicho
          </label>
          <input
            id="pa-niche"
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            maxLength={60}
            placeholder="Ej: viajes en familia"
            className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-gray-700 text-white"
          />
        </div>
      </div>
      <div>
        <label htmlFor="pa-audience" className="block text-sm font-semibold text-white mb-1">
          Audiencia mensual estimada
        </label>
        <input
          id="pa-audience"
          type="number"
          min="0"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="5000"
          className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-gray-700 text-white"
        />
      </div>

      {err && (
        <p className="text-sm text-red-400" role="alert">
          {err}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 text-black font-bold"
      >
        {loading ? "Enviando…" : "Solicitar acceso al programa →"}
      </button>
      <p className="text-[10px] text-gray-500 text-center">
        Aplicar no es vinculante. Revisamos manualmente para asegurar fit (ES/LATAM travel).
      </p>
    </form>
  );
}
