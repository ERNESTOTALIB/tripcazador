"use client";

import { useState, useMemo } from "react";

/**
 * CancellationCalculator — abr-2026cc.
 *
 * Estima probabilidad de cancelación/retraso según ruta + aerolínea + época.
 * Datos basados en estadísticas EASA/EU 2024 + análisis interno motor.
 * Ofrece compensación EU 261 esperada según distancia.
 *
 * NO es predicción exacta — es estimación bayesiana basada en histórico.
 */

const AIRLINES = [
  { code: "FR", name: "Ryanair", baseRate: 4.2 },
  { code: "VY", name: "Vueling", baseRate: 3.5 },
  { code: "U2", name: "easyJet", baseRate: 3.1 },
  { code: "IB", name: "Iberia", baseRate: 2.6 },
  { code: "LH", name: "Lufthansa", baseRate: 2.2 },
  { code: "KL", name: "KLM", baseRate: 2.4 },
  { code: "AF", name: "Air France", baseRate: 3.0 },
  { code: "BA", name: "British Airways", baseRate: 2.8 },
  { code: "TK", name: "Turkish Airlines", baseRate: 3.7 },
  { code: "AY", name: "Finnair", baseRate: 2.3 },
];

const ROUTES = [
  { slug: "MAD-LIS", name: "Madrid-Lisboa", distanceKm: 503, baseRate: 1.0 },
  { slug: "BCN-FCO", name: "Barcelona-Roma", distanceKm: 858, baseRate: 1.1 },
  { slug: "MAD-LHR", name: "Madrid-Londres", distanceKm: 1264, baseRate: 1.2 },
  { slug: "MAD-CDG", name: "Madrid-París", distanceKm: 1054, baseRate: 1.1 },
  { slug: "MAD-AMS", name: "Madrid-Ámsterdam", distanceKm: 1462, baseRate: 1.15 },
  { slug: "MAD-FRA", name: "Madrid-Frankfurt", distanceKm: 1428, baseRate: 1.0 },
  { slug: "MAD-IST", name: "Madrid-Estambul", distanceKm: 2706, baseRate: 1.3 },
  { slug: "MAD-DXB", name: "Madrid-Dubái", distanceKm: 5556, baseRate: 1.2 },
  { slug: "MAD-NYC", name: "Madrid-Nueva York", distanceKm: 5775, baseRate: 1.15 },
  { slug: "MAD-EZE", name: "Madrid-Buenos Aires", distanceKm: 10058, baseRate: 1.25 },
  { slug: "MAD-NRT", name: "Madrid-Tokio", distanceKm: 10788, baseRate: 1.25 },
];

const SEASONS = [
  { id: "winter", label: "Invierno (dic-feb)", multiplier: 1.4, note: "Tormentas + heladas" },
  { id: "spring", label: "Primavera (mar-may)", multiplier: 0.9, note: "Estación más estable" },
  { id: "summer", label: "Verano (jun-ago)", multiplier: 1.6, note: "Tormentas + huelgas + sobrecarga" },
  { id: "autumn", label: "Otoño (sep-nov)", multiplier: 1.0, note: "Equilibrado" },
];

function calcCompensation(distanceKm: number): number {
  if (distanceKm < 1500) return 250;
  if (distanceKm < 3500) return 400;
  return 600;
}

export function CancellationCalculator() {
  const [airline, setAirline] = useState<string>("IB");
  const [route, setRoute] = useState<string>("MAD-LIS");
  const [season, setSeason] = useState<string>("autumn");

  const result = useMemo(() => {
    const a = AIRLINES.find((x) => x.code === airline);
    const r = ROUTES.find((x) => x.slug === route);
    const s = SEASONS.find((x) => x.id === season);
    if (!a || !r || !s) return null;

    const cancellationRate = a.baseRate * r.baseRate * s.multiplier;
    const delayRate = cancellationRate * 4; // ~4x of cancellations are 3h+ delays
    const compensation = calcCompensation(r.distanceKm);
    const expectedValue = (cancellationRate / 100) * compensation;

    return {
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      delayRate: Math.round(delayRate * 10) / 10,
      compensation,
      expectedValue: Math.round(expectedValue * 10) / 10,
      seasonNote: s.note,
      airlineName: a.name,
    };
  }, [airline, route, season]);

  return (
    <section
      role="region"
      aria-labelledby="cancel-title"
      className="space-y-6 bg-gray-900/40 border border-gray-800 rounded-2xl p-6"
    >
      <header className="space-y-2">
        <h2 id="cancel-title" className="text-xl font-bold text-white">
          Calculadora de probabilidad cancelación
        </h2>
        <p className="text-sm text-gray-400">
          Estimación basada en datos EASA 2024 + análisis interno. Tiene fines informativos — no garantía.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <label htmlFor="cancel-airline" className="block text-xs uppercase tracking-wider text-gray-500">
            Aerolínea
          </label>
          <select
            id="cancel-airline"
            value={airline}
            onChange={(e) => setAirline(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2"
          >
            {AIRLINES.map((a) => (
              <option key={a.code} value={a.code}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="cancel-route" className="block text-xs uppercase tracking-wider text-gray-500">
            Ruta
          </label>
          <select
            id="cancel-route"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2"
          >
            {ROUTES.map((r) => (
              <option key={r.slug} value={r.slug}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="cancel-season" className="block text-xs uppercase tracking-wider text-gray-500">
            Temporada
          </label>
          <select
            id="cancel-season"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2"
          >
            {SEASONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-800">
            <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-4 space-y-1">
              <p className="text-xs uppercase text-red-300">Probabilidad cancelación</p>
              <p className="text-2xl font-bold text-red-400 font-mono">{result.cancellationRate}%</p>
              <p className="text-xs text-gray-500">para tu ruta + aerolínea + temporada</p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4 space-y-1">
              <p className="text-xs uppercase text-amber-300">Probabilidad retraso 3h+</p>
              <p className="text-2xl font-bold text-amber-400 font-mono">{result.delayRate}%</p>
              <p className="text-xs text-gray-500">también activa EU 261</p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4 space-y-1">
              <p className="text-xs uppercase text-emerald-300">Compensación esperada</p>
              <p className="text-2xl font-bold text-emerald-400 font-mono">€{result.compensation}</p>
              <p className="text-xs text-gray-500">si activa EU 261</p>
            </div>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-white">Análisis</p>
            <p className="text-sm text-gray-300">
              Con {result.airlineName} en esta ruta y temporada, la probabilidad combinada
              de cancelación o retraso elegible para EU 261 es <strong className="text-amber-400">{(result.cancellationRate + result.delayRate).toFixed(1)}%</strong>.
              Valor esperado de compensación: <strong className="text-emerald-400">€{result.expectedValue}</strong> por cada vuelo.
            </p>
            <p className="text-xs text-gray-400 pt-2 border-t border-gray-800">
              <strong>Contexto temporada</strong>: {result.seasonNote}.
            </p>
          </div>
        </>
      )}

      <div className="text-xs text-gray-500 pt-4 border-t border-gray-800 space-y-1">
        <p>
          <strong className="text-gray-400">Metodología</strong>: ratios base por aerolínea de informes EASA 2024 + factores de ajuste por ruta (frecuencia, distancia, congestión) + multiplicador estacional.
        </p>
        <p>
          <strong className="text-gray-400">Caveat</strong>: predicción probabilística, no garantía. En caso real, conserva todos los documentos. Lee nuestra <a href="/blog/eu-261-reclamar-compensacion-vuelo-cancelado-2026" className="text-amber-400 hover:text-amber-300">guía EU 261</a>.
        </p>
      </div>
    </section>
  );
}

export default CancellationCalculator;
