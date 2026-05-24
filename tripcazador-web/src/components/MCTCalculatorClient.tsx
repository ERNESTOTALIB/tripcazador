"use client";
/**
 * MCTCalculatorClient — SUPER-1D (24 may 2026)
 *
 * Calculator interactiva minimum connecting time por aeropuerto + tipo.
 */
import { useState } from "react";
import { MCT_AIRPORTS, recommendedMCT } from "@/lib/mct_data";

const SCENARIOS = [
  { value: "dd", label: "Doméstico → Doméstico" },
  { value: "di", label: "Doméstico → Internacional" },
  { value: "ii", label: "Internacional → Internacional" },
  { value: "id", label: "Internacional → Doméstico" },
] as const;

export function MCTCalculatorClient() {
  const [iata, setIata] = useState("MAD");
  const [scenario, setScenario] = useState<"dd" | "di" | "ii" | "id">("ii");

  const entry = MCT_AIRPORTS.find((m) => m.iata === iata);
  const result = entry ? recommendedMCT(entry, scenario) : null;

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-6">
      <h2 className="text-lg font-bold text-white mb-4">⏱️ Calculadora MCT</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mct-iata" className="text-xs font-semibold text-slate-300 block mb-1">
            Aeropuerto
          </label>
          <select
            id="mct-iata"
            value={iata}
            onChange={(e) => setIata(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-base text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            {MCT_AIRPORTS.map((m) => (
              <option key={m.iata} value={m.iata}>
                {m.emoji} {m.iata} — {m.city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="mct-scenario" className="text-xs font-semibold text-slate-300 block mb-1">
            Tipo de conexión
          </label>
          <select
            id="mct-scenario"
            value={scenario}
            onChange={(e) => setScenario(e.target.value as "dd" | "di" | "ii" | "id")}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-base text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            {SCENARIOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {result && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 text-center">
          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
            <div className="text-xs text-slate-400 uppercase">MCT publicado</div>
            <div className="mt-1 text-3xl font-bold text-white">{result.mct} min</div>
          </div>
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <div className="text-xs text-amber-300 uppercase">Recomendado real</div>
            <div className="mt-1 text-3xl font-bold text-amber-300">{result.recommended} min</div>
            <div className="text-xs text-slate-400 mt-1">+{result.buffer}min margen</div>
          </div>
        </div>
      )}

      {entry && (
        <div className="mt-6 space-y-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300">
          <div>
            <strong className="text-white">📍 Notas:</strong> {entry.notes}
          </div>
          {entry.warningCase && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <strong className="text-red-300">⚠️ Caso engañoso:</strong> {entry.warningCase}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MCTCalculatorClient;
