"use client";

/**
 * WhatsAppOptInWidget — SSS365 (21 may 2026)
 *
 * Captura número WhatsApp para opt-in a chollos via Business API.
 * Variants:
 *   - inline: card grande para blog posts + landings
 *   - compact: pill button para sidebar/footer
 *
 * UX: input + validación E.164 client-side + POST a /api/whatsapp/subscribe.
 * Premium customer_id se pasa opcional si el user ya está suscrito.
 */
import { useState } from "react";
import { tcTrack } from "@/lib/track_client";

interface Props {
  variant?: "inline" | "compact";
  source?: string;
  premiumCustomerId?: string;
}

export function WhatsAppOptInWidget({
  variant = "inline",
  source = "blog_cta",
  premiumCustomerId,
}: Props) {
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setErrorMsg("Debes aceptar recibir alertas para continuar");
      return;
    }
    if (!/^\+?\d{10,15}$/.test(phone.replace(/[\s-]/g, ""))) {
      setErrorMsg("Formato inválido — usa +34611223344");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    tcTrack("whatsapp_subscribe_submit", { source });
    try {
      const res = await fetch("/api/whatsapp/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: phone.replace(/[\s-]/g, ""),
          source,
          premium_customer_id: premiumCustomerId,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("ok");
        tcTrack("whatsapp_subscribe_ok", { source });
      } else {
        setStatus("error");
        setErrorMsg(json.error || "Error inesperado");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Error de red");
    }
  }

  if (status === "ok") {
    return (
      <div
        className={
          variant === "compact"
            ? "rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-sm text-emerald-300"
            : "rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-6 text-center"
        }
      >
        <div className="text-2xl mb-2">✅</div>
        <p className="font-semibold">¡Listo!</p>
        <p className="text-xs text-emerald-200/80 mt-1">
          Recibirás los próximos chollos en WhatsApp. Responde &quot;BAJA&quot; en cualquier momento para darte de baja.
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <form onSubmit={onSubmit} className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">📲</span>
          <span className="text-sm font-semibold text-white">Chollos por WhatsApp</span>
        </div>
        <input
          type="tel"
          inputMode="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+34611223344"
          className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm placeholder:text-gray-600 focus:border-amber-500 focus:outline-none"
        />
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="accent-amber-500"
          />
          <span>Acepto recibir alertas (gratis, baja con &quot;BAJA&quot;)</span>
        </label>
        {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold"
        >
          {status === "sending" ? "Enviando…" : "🔔 Activar"}
        </button>
      </form>
    );
  }

  return (
    <aside
      aria-label="Alertas WhatsApp"
      className="my-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl shrink-0" aria-hidden="true">📲</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            Chollos directos a tu WhatsApp
          </h3>
          <p className="text-sm text-gray-300 mt-1">
            Te avisamos en menos de 60 segundos cuando aparezca un error fare. Sin spam, sin grupos.
          </p>
          <form onSubmit={onSubmit} className="mt-4 space-y-3 max-w-md">
            <input
              type="tel"
              inputMode="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 611 22 33 44"
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none"
            />
            <label className="flex items-start gap-2 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="accent-emerald-500 mt-0.5"
              />
              <span>
                Acepto recibir alertas de chollos por WhatsApp. Puedo darme de baja respondiendo &quot;BAJA&quot; en cualquier momento.
              </span>
            </label>
            {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm"
            >
              {status === "sending" ? "Enviando…" : "🔔 Activar alertas WhatsApp gratis"}
            </button>
          </form>
          <p className="text-[10px] text-gray-500 mt-3">
            Tu número solo se usa para alertas TripCazador. No vendemos datos. Conforme RGPD + Meta Business Policies.
          </p>
        </div>
      </div>
    </aside>
  );
}
