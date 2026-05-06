"use client";
import { useState } from "react";

const AMOUNTS = [
  { value: 25, label: "25€", desc: "Hotel weekend" },
  { value: 50, label: "50€", desc: "Vuelo Europa" },
  { value: 100, label: "100€", desc: "Vuelo + hotel" },
  { value: 200, label: "200€", desc: "Escapada completa" },
];

export function GiftCardBuyer() {
  const [amount, setAmount] = useState(50);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/gift-cards/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          message,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.url) {
        setError(data.error || "No se pudo iniciar el pago");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError("Error de red — vuelve a intentarlo");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4">
      <h2 className="text-xl font-bold text-amber-400">Regalar TripCazador</h2>
      <p className="text-sm text-gray-300">
        Tu regalo se aplica a través de cualquier link de booking del receptor (vuelos, hoteles, tours). Sin caducidad.
      </p>

      <div>
        <label className="block text-xs uppercase tracking-wide text-gray-300 mb-2">Importe</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {AMOUNTS.map((a) => (
            <button
              type="button"
              key={a.value}
              onClick={() => setAmount(a.value)}
              className={`p-3 rounded-lg border text-left transition ${
                amount === a.value
                  ? "bg-amber-400 text-slate-900 border-amber-400"
                  : "bg-slate-800 text-white border-slate-700 hover:border-amber-400/50"
              }`}
            >
              <div className="text-lg font-bold">{a.label}</div>
              <div className="text-xs opacity-80">{a.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">
          Email del receptor (opcional)
        </label>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="amigo@example.com"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-amber-400 outline-none"
          maxLength={200}
        />
        <p className="text-xs text-gray-500 mt-1">Lo enviaremos a esa dirección. Si lo dejas vacío te llega a ti para entregárselo.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Nombre receptor</label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value.slice(0, 80))}
            placeholder="María"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-amber-400 outline-none"
            maxLength={80}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Mensaje (opcional)</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            placeholder="¡Felicidades! Que disfrutes el viaje…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-amber-400 outline-none"
            maxLength={200}
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg p-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 rounded-lg transition disabled:opacity-50"
      >
        {loading ? "Procesando…" : `Pagar ${amount}€ con tarjeta`}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Pago seguro con Stripe. Sin caducidad. Sin comisiones para el receptor.
      </p>
    </form>
  );
}

export function GiftCardRedeemer() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string; suggestions: { type: string; label: string; href: string }[] } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/gift-cards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Código no válido");
        setLoading(false);
        return;
      }
      setResult(data);
    } catch (e) {
      setError("Error de red — vuelve a intentarlo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4">
      <h2 className="text-xl font-bold text-amber-400">Canjear código</h2>
      <p className="text-sm text-gray-300">¿Te han regalado TripCazador? Introduce tu código aquí.</p>
      <div>
        <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Código</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 17))}
          placeholder="TC-XXXX-XXXX-NN"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-amber-400 outline-none font-mono uppercase"
        />
      </div>
      {error && (
        <div role="alert" className="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg p-2">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 rounded-lg transition disabled:opacity-50"
      >
        {loading ? "Verificando…" : "Verificar código"}
      </button>
      {result && (
        <div className="bg-emerald-900/30 border border-emerald-500/40 rounded-lg p-4 space-y-3">
          <p className="text-sm text-emerald-300">{result.message}</p>
          <div className="grid grid-cols-3 gap-2">
            {result.suggestions.map((s) => (
              <a
                key={s.type}
                href={s.href}
                target="_blank"
                rel="noopener sponsored"
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-400 rounded-lg p-2 text-center text-xs text-white"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
