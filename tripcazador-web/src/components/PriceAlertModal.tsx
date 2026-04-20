"use client";

/**
 * TripCazador — PriceAlertModal
 *
 * Modal para registrar una alerta de precio. El usuario introduce email
 * + precio objetivo + (opcional) origen/destino. El backend cruzará
 * esto con los nuevos deals y enviará un aviso cuando haya match.
 *
 * La UX sigue el patrón de Google Flights / Hopper: inline, sin salir
 * de la página, con feedback inmediato.
 *
 * El POST va al endpoint Next `/api/price-alerts` que proxea a FastAPI
 * (si el endpoint existe en backend) o responde 202 localmente para no
 * romper el flujo mientras se despliega la parte backend.
 */

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

export interface PriceAlertPrefill {
  origin?: string;
  destination?: string;
  targetPrice?: number;
  dealId?: string;
}

interface PriceAlertModalProps {
  open: boolean;
  onClose: () => void;
  prefill?: PriceAlertPrefill;
}

type Status = "idle" | "loading" | "success" | "error";

export function PriceAlertModal({ open, onClose, prefill }: PriceAlertModalProps) {
  const [email, setEmail] = useState("");
  const [origin, setOrigin] = useState(prefill?.origin ?? "");
  const [destination, setDestination] = useState(prefill?.destination ?? "");
  const [targetPrice, setTargetPrice] = useState(
    prefill?.targetPrice ? String(prefill.targetPrice) : "",
  );
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Reseteamos al abrir para que los prefill se apliquen cada vez
  useEffect(() => {
    if (open) {
      setOrigin(prefill?.origin ?? "");
      setDestination(prefill?.destination ?? "");
      setTargetPrice(prefill?.targetPrice ? String(prefill.targetPrice) : "");
      setStatus("idle");
      setErrorMsg(null);
    }
  }, [open, prefill]);

  // Cierra con ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          origin: origin.toUpperCase().slice(0, 3) || null,
          destination: destination.toUpperCase().slice(0, 3) || null,
          target_price: targetPrice ? Number(targetPrice) : null,
          deal_id: prefill?.dealId ?? null,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setStatus("success");
      track({
        name: "price_alert_created",
        params: {
          origin: origin || "(any)",
          destination: destination || "(any)",
          target_price: targetPrice ? Number(targetPrice) : null,
        },
      });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 id="alert-title" className="text-lg font-semibold text-white">
            Avísame cuando baje el precio
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {status === "success" ? (
          <div className="p-6 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center text-2xl text-emerald-400">
              ✓
            </div>
            <p className="text-white font-semibold">¡Alerta creada!</p>
            <p className="text-sm text-gray-400">
              Te avisaremos a <strong className="text-amber-300">{email}</strong> en cuanto
              encontremos una oferta que cumpla tus criterios.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-5 py-2 btn-gradient text-black font-semibold rounded-lg"
            >
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="alert-email" className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                id="alert-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="alert-origin" className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Origen (IATA)
                </label>
                <input
                  id="alert-origin"
                  type="text"
                  maxLength={3}
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                  placeholder="MAD"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase"
                />
              </div>
              <div>
                <label htmlFor="alert-destination" className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Destino (IATA)
                </label>
                <input
                  id="alert-destination"
                  type="text"
                  maxLength={3}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase())}
                  placeholder="JFK"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase"
                />
              </div>
            </div>

            <div>
              <label htmlFor="alert-price" className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                Precio objetivo (€)
              </label>
              <input
                id="alert-price"
                type="number"
                min={1}
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="500"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                Te avisamos si encontramos un vuelo por debajo de este precio.
              </p>
            </div>

            {status === "error" && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                No hemos podido crear la alerta{errorMsg ? `: ${errorMsg}` : ""}. Prueba
                en un momento.
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={status === "loading" || !email}
                className="flex-1 px-5 py-2.5 btn-gradient text-black font-semibold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed cta-lift"
              >
                {status === "loading" ? "Creando alerta…" : "Crear alerta"}
              </button>
            </div>

            <p className="text-[10px] text-gray-500 text-center">
              Al crear la alerta aceptas recibir emails puntuales. Cancela cuando
              quieras con un click desde el propio email.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Botón disparador reutilizable. Encapsula el estado "abierto" de forma
 * local para que cada emplazamiento no tenga que gestionarlo.
 */
interface PriceAlertButtonProps {
  prefill?: PriceAlertPrefill;
  className?: string;
  label?: string;
}

export function PriceAlertButton({
  prefill,
  className = "",
  label = "🔔 Avísame si baja",
}: PriceAlertButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${className}`}
      >
        {label}
      </button>
      <PriceAlertModal open={open} onClose={() => setOpen(false)} prefill={prefill} />
    </>
  );
}

export default PriceAlertModal;
