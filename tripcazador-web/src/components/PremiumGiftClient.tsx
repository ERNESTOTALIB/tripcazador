"use client";

/**
 * PremiumGiftClient — SSS335 (20 may 2026)
 *
 * Form para regalar Premium one-off €9.99. Recolecta email destinatario
 * + mensaje opcional, lanza Stripe Checkout en mode=payment con
 * metadata.cycle=gift y gift_recipient.
 */

import { useState } from "react";

export function PremiumGiftClient() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [yourEmail, setYourEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGift(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!recipientEmail.includes("@")) {
      setError("Email del destinatario inválido");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/premium/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycle: "gift",
          email: yourEmail || undefined,
          gift_recipient: recipientEmail.trim().toLowerCase(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setError(data.error || `error_${res.status}`);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleGift}
      className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-gray-900 p-6 space-y-4"
    >
      <label className="text-sm text-gray-300 block">
        <span className="block mb-1 font-semibold">
          Email del destinatario *
        </span>
        <input
          type="email"
          required
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="amigo@email.com"
          className="w-full px-4 py-3 rounded-xl bg-black border border-gray-700 text-white"
        />
      </label>

      <label className="text-sm text-gray-300 block">
        <span className="block mb-1">
          Tu email (opcional, para confirmación)
        </span>
        <input
          type="email"
          value={yourEmail}
          onChange={(e) => setYourEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full px-4 py-3 rounded-xl bg-black border border-gray-700 text-white"
        />
      </label>

      <div className="rounded-xl bg-black/40 border border-amber-500/20 px-4 py-3 text-xs text-gray-400">
        <strong className="text-white">Total:</strong>{" "}
        <span className="text-amber-300 font-bold text-base">9,99€</span>{" "}
        · pago único · sin renovación automática
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/10 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold text-lg rounded-xl transition-colors shadow-lg shadow-amber-500/20"
      >
        {loading ? "Procesando…" : "🎁 Regalar Premium · 9,99€"}
      </button>

      <div className="text-xs text-center text-gray-500">
        Pago seguro con Stripe · TripCazador no almacena datos de tarjeta
      </div>
    </form>
  );
}
