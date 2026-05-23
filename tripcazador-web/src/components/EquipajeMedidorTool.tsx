"use client";
/**
 * EquipajeMedidorTool — SSS450 (23 may 2026)
 *
 * Client tool: input dimensiones (L × A × H cm) + peso (kg), output
 * tabla de qué aerolíneas aceptan tu bolso en:
 * - Personal item (gratis)
 * - Cabin (con fee si la aerolínea cobra)
 *
 * Reusa checkAllAirlines de lib/baggage_dimensions.
 */
import { useState, useMemo } from "react";
import { checkAllAirlines, type BagSize, type FitResult } from "@/lib/baggage_dimensions";

const PRESETS: Array<{ label: string; bag: BagSize }> = [
  { label: "Mochila Cabin Max 55×40×20", bag: { length: 55, width: 40, height: 20, weightKg: 10 } },
  { label: "Bolso pequeño 40×20×25", bag: { length: 40, width: 20, height: 25, weightKg: 7 } },
  { label: "Personal item compacto 35×20×20", bag: { length: 35, width: 20, height: 20, weightKg: 5 } },
];

export function EquipajeMedidorTool() {
  const [length, setLength] = useState(55);
  const [width, setWidth] = useState(40);
  const [height, setHeight] = useState(20);
  const [weight, setWeight] = useState(8);

  const results: FitResult[] = useMemo(
    () => checkAllAirlines({ length, width, height, weightKg: weight }),
    [length, width, height, weight],
  );

  const personalCount = results.filter((r) => r.personalItem.fits).length;
  const cabinCount = results.filter((r) => r.cabinPaid.fits).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="mb-3 text-lg font-bold text-white">📏 Dimensiones de tu bolso</h2>

        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setLength(p.bag.length);
                setWidth(p.bag.width);
                setHeight(p.bag.height);
                setWeight(p.bag.weightKg);
              }}
              className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-300"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <label className="block">
            <span className="text-xs uppercase text-slate-500">Largo (cm)</span>
            <input
              type="number"
              min={1}
              max={200}
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value, 10) || 0)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase text-slate-500">Ancho (cm)</span>
            <input
              type="number"
              min={1}
              max={200}
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value, 10) || 0)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase text-slate-500">Alto (cm)</span>
            <input
              type="number"
              min={1}
              max={200}
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value, 10) || 0)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase text-slate-500">Peso (kg)</span>
            <input
              type="number"
              min={0}
              max={50}
              step={0.5}
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
          <div className="text-xs uppercase text-emerald-300">Personal item (gratis)</div>
          <div className="mt-1 font-mono text-3xl font-bold text-white">
            {personalCount}/{results.length}
          </div>
          <div className="text-xs text-slate-400">aerolíneas aceptan</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
          <div className="text-xs uppercase text-amber-300">Cabin (con fee)</div>
          <div className="mt-1 font-mono text-3xl font-bold text-white">
            {cabinCount}/{results.length}
          </div>
          <div className="text-xs text-slate-400">aerolíneas aceptan</div>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/40">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Aerolínea</th>
              <th className="px-4 py-3 text-center">Personal item</th>
              <th className="px-4 py-3 text-center">Cabin (fee)</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.airline.slug} className="border-t border-slate-700">
                <td className="px-4 py-3">
                  <div className="font-bold text-white">
                    {r.airline.emoji} {r.airline.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    Personal: {r.airline.personalItem.dimensions} · Cabin:{" "}
                    {r.airline.cabin.dimensions} ({r.airline.cabin.weight})
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {r.personalItem.fits ? (
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300">
                      ✓ OK
                    </span>
                  ) : (
                    <span
                      title={r.personalItem.reason}
                      className="rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-300"
                    >
                      ✗ No
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {r.cabinPaid.fits ? (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-300">
                      €{r.cabinPaid.feeFromEur}+
                    </span>
                  ) : (
                    <span
                      title={r.cabinPaid.reason}
                      className="rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-300"
                    >
                      ✗ No
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="text-xs text-slate-500">
        Datos verificados mayo 2026. Las aerolíneas pueden cambiar políticas —
        confirma siempre en su web antes de volar. Las dimensiones se verifican
        en orientación libre (cualquier eje vale como largo/ancho/alto).
      </p>
    </div>
  );
}

export default EquipajeMedidorTool;
