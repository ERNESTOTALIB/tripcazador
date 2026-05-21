"use client";
/**
 * TripPlannerClient — F1 (May 2026)
 *
 * Form que envía a /api/trip-planner y muestra el itinerario generado.
 * Free tier: 1 generación/día por localStorage. Premium ilimitado.
 */
import { useState, useMemo } from "react";
import type { GeneratedItinerary, TripStyle } from "@/lib/trip_planner";

const STYLES: { value: TripStyle; label: string; emoji: string }[] = [
  { value: "cultural", label: "Cultural", emoji: "🏛️" },
  { value: "foodie", label: "Foodie", emoji: "🍜" },
  { value: "aventura", label: "Aventura", emoji: "🥾" },
  { value: "relax", label: "Relax", emoji: "🏖️" },
  { value: "fiesta", label: "Fiesta", emoji: "🎉" },
  { value: "familia", label: "Familia", emoji: "👨‍👩‍👧" },
  { value: "romantico", label: "Romántico", emoji: "💕" },
];

const FREE_TRIES_KEY = "tc_planner_tries_v1";

function readDailyTries(): number {
  if (typeof localStorage === "undefined") return 0;
  try {
    const raw = localStorage.getItem(FREE_TRIES_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (data.day !== today) return 0;
    return data.count || 0;
  } catch {
    return 0;
  }
}

function bumpDailyTries() {
  if (typeof localStorage === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  const cur = readDailyTries();
  localStorage.setItem(FREE_TRIES_KEY, JSON.stringify({ day: today, count: cur + 1 }));
}

export function TripPlannerClient() {
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("MAD");
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState(1200);
  const [travelers, setTravelers] = useState(2);
  const [style, setStyle] = useState<TripStyle>("cultural");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedItinerary | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- `result` triggers re-read after generation
  const triesUsed = useMemo(() => (typeof window !== "undefined" ? readDailyTries() : 0), [result]);
  const isPremium = useMemo(() => {
    if (typeof window === "undefined") return false;
    return document.cookie.includes("tc_premium=1") || localStorage.getItem("tc_premium") === "1";
  }, []);
  const remaining = isPremium ? Infinity : Math.max(0, 1 - triesUsed);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isPremium && remaining <= 0) {
      setError("Has usado tu generación gratuita de hoy. Hazte Premium para uso ilimitado.");
      return;
    }
    if (!destination.trim()) {
      setError("Indica un destino");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/trip-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, origin, days, budget, travelers, style, notes }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Error generando itinerario");
        return;
      }
      setResult(data);
      if (!isPremium) bumpDailyTries();
      // Track event
      try {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "planner_generated", destination, days, budget, style, used_ai: data.used_ai }),
        });
      } catch {
        // ignore
      }
    } catch (_e) {
      setError("Error de red — vuelve a intentarlo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
      {/* FORM */}
      <form onSubmit={onSubmit} className="panel sticky top-24 space-y-4 self-start">
        <h2 className="text-lg font-bold text-amber-400 mb-4">Tu plan en 30 segundos</h2>

        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Destino</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Tokio, Bali, Lisboa…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-amber-400 outline-none"
            required
            maxLength={80}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Origen</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="MAD"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-amber-400 outline-none uppercase"
              maxLength={4}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Días</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min={2}
              max={21}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Presupuesto (€)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              min={150}
              max={50000}
              step={50}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Viajeros</label>
            <input
              type="number"
              value={travelers}
              onChange={(e) => setTravelers(Number(e.target.value))}
              min={1}
              max={8}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-300 mb-2">Estilo de viaje</label>
          <div className="grid grid-cols-3 gap-2">
            {STYLES.map((s) => (
              <button
                type="button"
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`text-xs py-2 px-2 rounded-lg border transition ${
                  style === s.value
                    ? "bg-amber-400 text-slate-900 border-amber-400 font-bold"
                    : "bg-slate-800 text-gray-200 border-slate-700 hover:border-amber-400/50"
                }`}
              >
                <div>{s.emoji}</div>
                <div>{s.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">
            Notas opcionales <span className="text-gray-500">(alergias, must-see…)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 300))}
            placeholder="Ej: vegetariana, sin escaleras, niños 6+10"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-amber-400 outline-none min-h-[60px]"
            rows={2}
            maxLength={300}
          />
        </div>

        {error && (
          <div role="alert" className="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg p-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generando…" : "✨ Generar itinerario"}
        </button>

        <div className="text-xs text-gray-400 text-center">
          {isPremium ? (
            <span className="text-amber-400">✓ Premium activo — uso ilimitado</span>
          ) : (
            <>
              {remaining > 0 ? `Te queda ${remaining} generación gratis hoy.` : "Has agotado tu free de hoy."}{" "}
              <a href="/premium" className="underline text-amber-400">
                Premium
              </a>{" "}
              ilimitado por 2,99€/mes.
            </>
          )}
        </div>
      </form>

      {/* RESULT */}
      <div className="space-y-4">
        {!result && !loading && (
          <div className="panel text-center py-16">
            <div className="text-5xl mb-3">🗺️</div>
            <h3 className="text-lg font-bold text-amber-400">Tu itinerario aparecerá aquí</h3>
            <p className="text-sm text-gray-300 mt-2 max-w-md mx-auto">
              Rellena el formulario y nuestro planificador genera un día-a-día con vuelos, hoteles, comidas y
              actividades. Todo enlazado a las mejores ofertas reales.
            </p>
          </div>
        )}
        {loading && (
          <div className="panel py-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-gray-300">Diseñando tu viaje a {destination}…</p>
          </div>
        )}
        {result && <ItineraryView itin={result} />}
      </div>
    </div>
  );
}

function ItineraryView({ itin }: { itin: GeneratedItinerary }) {
  return (
    <div className="space-y-4">
      <div className="panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-amber-400">{itin.destination}</h2>
            <p className="text-sm text-gray-300 mt-1">{itin.summary}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Total estimado</div>
            <div className="text-2xl font-bold text-white">{itin.total_budget.toFixed(0)}€</div>
            <div className="text-xs text-gray-400">{Math.round(itin.per_person_per_day)}€/persona/día</div>
          </div>
        </div>
        {!itin.used_ai && (
          <div className="mt-3 text-xs text-amber-400/80 italic">
            * Plan generado con plantilla heurística. Activa la API de IA para itinerarios totalmente personalizados.
          </div>
        )}
      </div>

      <div className="panel">
        <h3 className="text-sm uppercase tracking-wide text-amber-400 font-bold mb-3">Reservar</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(itin.bookings).map(([k, v]) => (
            <a
              key={k}
              href={v.href}
              target="_blank"
              rel="noopener sponsored"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-400 rounded-lg p-3 text-center transition"
            >
              <div className="text-xs uppercase tracking-wide text-gray-400">
                {k === "flights" ? "✈️ Vuelo" : k === "hotel" ? "🏨 Hotel" : k === "activities" ? "🎫 Tours" : k === "insurance" ? "🛡️ Seguro" : "📶 eSIM"}
              </div>
              <div className="text-xs text-white mt-1 line-clamp-2">{v.label}</div>
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {itin.daily.map((day) => (
          <div key={day.day} className="panel">
            <div className="flex items-baseline justify-between">
              <h4 className="font-bold text-white">{day.title}</h4>
              {day.cost_est && <span className="text-xs text-amber-400">{day.cost_est}</span>}
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-amber-400 w-20 shrink-0">🌅 Mañana</dt>
                <dd className="text-gray-200">{day.morning}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-amber-400 w-20 shrink-0">☀️ Tarde</dt>
                <dd className="text-gray-200">{day.afternoon}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-amber-400 w-20 shrink-0">🌙 Noche</dt>
                <dd className="text-gray-200">{day.evening}</dd>
              </div>
              {day.food_pick && (
                <div className="flex gap-2">
                  <dt className="text-amber-400 w-20 shrink-0">🍽️ Probar</dt>
                  <dd className="text-gray-200">{day.food_pick}</dd>
                </div>
              )}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
