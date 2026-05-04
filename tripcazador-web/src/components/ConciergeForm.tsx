"use client";

/**
 * ConciergeForm — fase sss SSS10 (May 2026, tiered agency)
 *
 * Formulario /concierge tiered con 4 niveles. Submit envía a /api/concierge/checkout
 * que:
 *   - Si STRIPE_SECRET_KEY + price del tier elegido están → crea sesión Stripe
 *     Checkout (mode "payment", one-time) y redirect.
 *   - Si no → devuelve 200 status="pending_setup", el form lo guarda en
 *     localStorage para que /panel/concierge lo vea.
 *
 * UX: tier selector radio cards arriba (sticky en mobile), validación
 * client-side, draft persistido en localStorage por tier+resto.
 */
import { useState, useEffect } from "react";
import { Plane, Loader2, Check, Star } from "lucide-react";
import { saveOrderLocal, type ConciergeOrder } from "@/lib/concierge_store";
import {
  CONCIERGE_TIER_IDS,
  CONCIERGE_TIERS,
  DEFAULT_TIER,
  isValidTier,
  type ConciergeTier,
} from "@/lib/concierge_tiers";
import { tcTrack, tcTrackOnce } from "@/lib/track_client";

const FORM_KEY = "tc_concierge_form_draft_v2";

interface FormData {
  tier: ConciergeTier;
  email: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to: string;
  flex_days: number;
  budget: number;
  travelers: number;
  hotel_stars: number;
  notes: string;
}

const INITIAL: FormData = {
  tier: DEFAULT_TIER,
  email: "",
  origin: "",
  destination: "",
  date_from: "",
  date_to: "",
  flex_days: 3,
  budget: 1500,
  travelers: 2,
  hotel_stars: 4,
  notes: "",
};

export function ConciergeForm({ initialTier }: { initialTier?: ConciergeTier } = {}) {
  const [data, setData] = useState<FormData>({
    ...INITIAL,
    tier: initialTier && isValidTier(initialTier) ? initialTier : DEFAULT_TIER,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FORM_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Validar tier — si invalid, usar default
        const tier: ConciergeTier = isValidTier(parsed?.tier) ? parsed.tier : DEFAULT_TIER;
        setData((prev) => ({ ...prev, ...parsed, tier }));
      }
    } catch {
      /* no-op */
    }
    // SSS63: emit concierge_view 1× sesión
    tcTrackOnce("concierge_view", "concierge_form", {
      path: typeof location !== "undefined" ? location.pathname : "/concierge",
    });
  }, []);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(FORM_KEY, JSON.stringify(next));
      } catch {
        /* no-op */
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!data.email || !data.origin || !data.destination || !data.date_from) {
      setError("Rellena todos los campos obligatorios.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setError("El email no parece válido.");
      return;
    }
    if (!isValidTier(data.tier)) {
      setError("Selecciona un nivel de servicio.");
      return;
    }

    setSubmitting(true);
    // SSS63: emit concierge_click_pay (intent click, antes de saber si Stripe responde)
    tcTrack("concierge_click_pay", {
      tier: data.tier,
      amount_eur: CONCIERGE_TIERS[data.tier].amount_eur,
      origin: data.origin,
      destination: data.destination,
    });
    try {
      const res = await fetch("/api/concierge/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "checkout_failed");
      }
      if (payload.url) {
        window.location.href = payload.url; // redirect a Stripe Checkout
        return;
      }
      if (payload.status === "pending_setup") {
        if (payload.order) {
          saveOrderLocal(payload.order as ConciergeOrder);
        }
        setError(
          "✅ Solicitud recibida. El pago aún no está activo, pero te contactaremos por email cuando lo esté. (Pedido guardado).",
        );
        try {
          localStorage.removeItem(FORM_KEY);
        } catch {
          /* no-op */
        }
        return;
      }
      throw new Error("unexpected_response");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error";
      if (msg === "stripe_not_configured") {
        setError("Pago aún no operativo. Te avisaremos por email cuando se active.");
      } else {
        setError("Hubo un problema. Inténtalo de nuevo o escríbenos a contacto@tripcazador.com");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTier = CONCIERGE_TIERS[data.tier];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto" data-testid="concierge-form">
      {/* TIER SELECTOR */}
      <fieldset>
        <legend className="text-sm uppercase tracking-wider text-gray-400 font-bold mb-3 block">
          1. Elige tu nivel de servicio
        </legend>
        <div
          role="radiogroup"
          aria-label="Niveles de servicio Concierge"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {CONCIERGE_TIER_IDS.map((id) => {
            const t = CONCIERGE_TIERS[id];
            const isSelected = data.tier === id;
            return (
              <label
                key={id}
                className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all flex flex-col gap-2 ${
                  isSelected
                    ? "border-amber-400 bg-amber-500/10 shadow-[0_0_0_4px_rgba(251,191,36,0.15)]"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={id}
                  checked={isSelected}
                  onChange={() => update("tier", id)}
                  className="sr-only"
                  aria-describedby={`tier-${id}-desc`}
                />
                {t.popular && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                    <Star size={10} fill="currentColor" /> Más popular
                  </span>
                )}
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    {t.name}
                  </span>
                  {isSelected && <Check size={14} className="text-amber-400" />}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">€{t.amount_eur}</span>
                  <span className="text-xs text-gray-500">/ pago único</span>
                </div>
                <p className="text-[11px] text-amber-300 font-semibold">{t.delivery_label}</p>
                <ul id={`tier-${id}-desc`} className="space-y-1 mt-1">
                  {t.bullets.map((b, i) => (
                    <li key={i} className="text-xs text-gray-300 flex gap-1.5">
                      <Check size={11} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-sm uppercase tracking-wider text-gray-400 font-bold mb-3 block">
          2. Datos del viaje
        </legend>

        {/* Email */}
        <div>
          <label htmlFor="conc-email" className="text-xs uppercase tracking-wider text-gray-400 mb-1 block font-semibold">
            Tu email *
          </label>
          <input
            id="conc-email"
            type="email"
            required
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="conc-origin" className="text-xs uppercase tracking-wider text-gray-400 mb-1 block font-semibold">
              Salida (ciudad o IATA) *
            </label>
            <input
              id="conc-origin"
              type="text"
              required
              value={data.origin}
              onChange={(e) => update("origin", e.target.value)}
              placeholder="Madrid o MAD"
              className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="conc-destination" className="text-xs uppercase tracking-wider text-gray-400 mb-1 block font-semibold">
              Destino *
            </label>
            <input
              id="conc-destination"
              type="text"
              required
              value={data.destination}
              onChange={(e) => update("destination", e.target.value)}
              placeholder="Tokio, Bali, Nueva York…"
              className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="conc-from" className="text-xs uppercase tracking-wider text-gray-400 mb-1 block font-semibold">
              Fecha ida *
            </label>
            <input
              id="conc-from"
              type="date"
              required
              value={data.date_from}
              onChange={(e) => update("date_from", e.target.value)}
              className="w-full px-3 py-3 min-h-[44px] rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="conc-to" className="text-xs uppercase tracking-wider text-gray-400 mb-1 block font-semibold">
              Fecha vuelta
            </label>
            <input
              id="conc-to"
              type="date"
              value={data.date_to}
              onChange={(e) => update("date_to", e.target.value)}
              className="w-full px-3 py-3 min-h-[44px] rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="conc-flex" className="text-xs uppercase tracking-wider text-gray-400 mb-1 block font-semibold">
              Flexibilidad (±días)
            </label>
            <select
              id="conc-flex"
              value={data.flex_days}
              onChange={(e) => update("flex_days", parseInt(e.target.value))}
              className="w-full px-3 py-3 min-h-[44px] rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-amber-400 focus:outline-none"
            >
              <option value={0}>Sin flex (fechas exactas)</option>
              <option value={1}>±1 día</option>
              <option value={3}>±3 días</option>
              <option value={7}>±1 semana</option>
              <option value={14}>±2 semanas (máx ahorro)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="conc-trav" className="text-xs uppercase tracking-wider text-gray-400 mb-1 block font-semibold">
              Viajeros
            </label>
            <select
              id="conc-trav"
              value={data.travelers}
              onChange={(e) => update("travelers", parseInt(e.target.value))}
              className="w-full px-3 py-3 min-h-[44px] rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-amber-400 focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "persona" : "personas"}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="conc-stars" className="text-xs uppercase tracking-wider text-gray-400 mb-1 block font-semibold">
              Hotel mínimo
            </label>
            <select
              id="conc-stars"
              value={data.hotel_stars}
              onChange={(e) => update("hotel_stars", parseInt(e.target.value))}
              className="w-full px-3 py-3 min-h-[44px] rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-amber-400 focus:outline-none"
            >
              <option value={3}>3★ confort</option>
              <option value={4}>4★ recomendado</option>
              <option value={5}>5★ premium</option>
            </select>
          </div>
          <div>
            <label htmlFor="conc-budget" className="text-xs uppercase tracking-wider text-gray-400 mb-1 block font-semibold">
              Presupuesto total (€)
            </label>
            <input
              id="conc-budget"
              type="number"
              min="200"
              max="10000"
              step="50"
              value={data.budget}
              onChange={(e) => update("budget", parseInt(e.target.value) || 0)}
              className="w-full px-3 py-3 min-h-[44px] rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="conc-notes" className="text-xs uppercase tracking-wider text-gray-400 mb-1 block font-semibold">
            Notas / preferencias (opcional)
          </label>
          <textarea
            id="conc-notes"
            rows={3}
            value={data.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Ej: prefiero vuelo directo, hotel cerca centro, viajamos con bebé…"
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-400 focus:outline-none resize-y"
          />
        </div>
      </fieldset>

      {error && (
        <div role="alert" className="rounded-lg bg-red-950/40 border border-red-500/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 min-h-[52px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-base transition-colors"
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Procesando…
          </>
        ) : (
          <>
            <Plane size={18} />
            Pagar €{selectedTier.amount_eur} y empezar búsqueda · {selectedTier.name}
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Pago seguro vía Stripe. Pago único, sin suscripción. {selectedTier.delivery_label}.
      </p>
    </form>
  );
}
