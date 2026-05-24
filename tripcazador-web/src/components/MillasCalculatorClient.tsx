"use client";
/**
 * MillasCalculatorClient — SUPER-1D (24 may 2026)
 *
 * Calculadora client-side puntos→euros para 6 programas de millas.
 * Pure-fn (sin fetch). Lib: millas_programas.ts.
 */
import { useState } from "react";
import { MILLAS_PROGRAMAS, valorMillas } from "@/lib/millas_programas";

export function MillasCalculatorClient() {
  const [millas, setMillas] = useState(25000);
  const [slug, setSlug] = useState("avios");

  const valor = valorMillas(slug, millas);
  const program = MILLAS_PROGRAMAS.find((m) => m.slug === slug);

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-6">
      <h2 className="text-lg font-bold text-white mb-4">🧮 Calculadora rápida</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="millas-input" className="text-xs font-semibold text-slate-300 block mb-1">
            Tus millas
          </label>
          <input
            id="millas-input"
            type="number"
            min={0}
            step={1000}
            value={millas}
            onChange={(e) => setMillas(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-base text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div>
          <label htmlFor="programa-select" className="text-xs font-semibold text-slate-300 block mb-1">
            Programa
          </label>
          <select
            id="programa-select"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-base text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            {MILLAS_PROGRAMAS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className="text-xs uppercase tracking-wider text-slate-400">
          Valor estimado redención saver
        </div>
        <div className="mt-2 text-5xl font-bold text-amber-300">
          €{valor?.toFixed(2) || "0.00"}
        </div>
        {program && (
          <p className="mt-3 text-xs text-slate-400">
            cpm: <strong className="text-white">{program.cpm}</strong> centavos por 1.000 millas
          </p>
        )}
      </div>

      {program && (
        <div className="mt-6 space-y-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300">
          <div>
            <strong className="text-emerald-300">✅ Mejor uso:</strong> {program.bestUse}
          </div>
          <div>
            <strong className="text-amber-300">⚠️ Evitar:</strong> {program.worstUse}
          </div>
          <div className="text-xs text-slate-400">
            Expiran: {program.expirationMonths === 0 ? "NUNCA" : `${program.expirationMonths} meses de inactividad`}
          </div>
        </div>
      )}
    </div>
  );
}

export default MillasCalculatorClient;
