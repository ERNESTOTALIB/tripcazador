"use client";

/**
 * ScoringFeedbackClient — SSS389 (21 may 2026)
 *
 * Form admin para registrar outcomes de scoring v3.
 * POST /api/admin/scoring-feedback.
 */

import { useState } from "react";

interface RouteStats {
  route_key: string;
  total_samples: number;
  booking_rate: number;
  expired_rate: number;
  false_positive_rate: number;
  is_significant: boolean;
}

interface ApiResponse {
  ok: boolean;
  stats?: RouteStats;
  error?: string;
  required?: string[];
}

export function ScoringFeedbackClient() {
  const [dealId, setDealId] = useState("");
  const [routeKey, setRouteKey] = useState("");
  const [outcome, setOutcome] = useState<
    "booked" | "expired_no_takers" | "false_positive" | "regular_sale"
  >("booked");
  const [loading, setLoading] = useState(false);
  const [lastStats, setLastStats] = useState<RouteStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!dealId.trim() || !routeKey.trim()) {
      setError("Deal ID + Route Key son obligatorios");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/admin/scoring-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_id: dealId.trim(),
          route_key: routeKey.trim().toUpperCase(),
          outcome,
        }),
      });
      const data: ApiResponse = await r.json();
      if (!r.ok || !data.ok) {
        setError(data.error || "Error registrando feedback");
        return;
      }
      setSuccess(`Outcome registrado para ${routeKey.toUpperCase()}`);
      setLastStats(data.stats || null);
      setDealId("");
      // Mantener routeKey para múltiples entries rápidos
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="sf-deal"
              className="block text-xs font-semibold text-gray-300 uppercase mb-1"
            >
              Deal ID
            </label>
            <input
              id="sf-deal"
              type="text"
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              placeholder="d_abc123"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-white"
            />
          </div>
          <div>
            <label
              htmlFor="sf-route"
              className="block text-xs font-semibold text-gray-300 uppercase mb-1"
            >
              Route Key
            </label>
            <input
              id="sf-route"
              type="text"
              value={routeKey}
              onChange={(e) => setRouteKey(e.target.value.toUpperCase())}
              placeholder="MAD-NRT-NH"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-white font-mono uppercase"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="sf-outcome"
            className="block text-xs font-semibold text-gray-300 uppercase mb-1"
          >
            Outcome
          </label>
          <select
            id="sf-outcome"
            value={outcome}
            onChange={(e) =>
              setOutcome(
                e.target.value as
                  | "booked"
                  | "expired_no_takers"
                  | "false_positive"
                  | "regular_sale",
              )
            }
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-white"
          >
            <option value="booked">✅ booked — alguien reservó</option>
            <option value="regular_sale">📦 regular_sale — oferta normal</option>
            <option value="expired_no_takers">⏰ expired_no_takers — caducó sin bookings</option>
            <option value="false_positive">❌ false_positive — no era chollo real</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-300">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 text-black font-bold"
        >
          {loading ? "Guardando…" : "Registrar outcome"}
        </button>
      </form>

      {lastStats && (
        <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-4">
          <p className="text-xs text-gray-400 uppercase font-bold mb-2">
            Stats post-registro · {lastStats.route_key}
          </p>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{lastStats.total_samples}</p>
              <p className="text-[10px] text-gray-400">samples</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-300">
                {Math.round(lastStats.booking_rate * 100)}%
              </p>
              <p className="text-[10px] text-gray-400">booking</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">
                {Math.round(lastStats.expired_rate * 100)}%
              </p>
              <p className="text-[10px] text-gray-400">expired</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-300">
                {Math.round(lastStats.false_positive_rate * 100)}%
              </p>
              <p className="text-[10px] text-gray-400">FP</p>
            </div>
          </div>
          {lastStats.is_significant ? (
            <p className="text-xs text-emerald-300 mt-3 text-center">
              ✓ Sample significativo — el scoring v3 aplicará boost/penalty.
            </p>
          ) : (
            <p className="text-xs text-amber-400 mt-3 text-center">
              ⏳ Necesitas ≥3 samples por ruta para que el scoring use este histórico.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
