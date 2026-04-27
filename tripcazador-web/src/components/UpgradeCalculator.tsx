"use client";

import { useState, useMemo } from "react";

/**
 * UpgradeCalculator — abr-2026dd.
 *
 * Estima probabilidad de upgrade gratis a business class según fare class +
 * status frequent flyer + tipo ruta + temporada. Datos basados en práctica
 * común aerolíneas + foros frequent flyer (FlyerTalk).
 */

const FARE_CLASSES = [
  { id: "deep_discount", label: "Económica básica (Q/T/L/V)", baseProb: 0.05 },
  { id: "discount", label: "Económica descuento (M/H)", baseProb: 0.08 },
  { id: "full_econ", label: "Económica flexible (Y/B)", baseProb: 0.15 },
  { id: "premium_econ", label: "Premium Economy (W)", baseProb: 0.25 },
];

const STATUS_LEVELS = [
  { id: "none", label: "Sin status", multiplier: 1.0 },
  { id: "silver", label: "Silver / Bronze (Iberia Plus, M&M Frequent Traveller)", multiplier: 2.0 },
  { id: "gold", label: "Gold (BA Gold, M&M Senator, Iberia Platinum)", multiplier: 4.0 },
  { id: "platinum", label: "Platinum / Diamond (M&M HON Circle, BA Premier)", multiplier: 8.0 },
];

const ROUTE_TYPES = [
  { id: "short_eu", label: "Corto Europa (<3h)", multiplier: 0.7 },
  { id: "medium_eu", label: "Medio Europa (3-5h)", multiplier: 1.0 },
  { id: "long_haul", label: "Long-haul (>6h)", multiplier: 1.3 },
];

const SEASONS = [
  { id: "low", label: "Baja temporada (feb, oct, nov)", multiplier: 1.5, note: "Cabinas más vacías" },
  { id: "shoulder", label: "Media temporada (mar-may, sep)", multiplier: 1.0, note: "Demanda equilibrada" },
  { id: "high", label: "Alta temporada (jul-ago, dic)", multiplier: 0.4, note: "Cabinas casi llenas" },
];

export function UpgradeCalculator() {
  const [fareClass, setFareClass] = useState<string>("discount");
  const [status, setStatus] = useState<string>("none");
  const [routeType, setRouteType] = useState<string>("long_haul");
  const [season, setSeason] = useState<string>("shoulder");

  const result = useMemo(() => {
    const fc = FARE_CLASSES.find((f) => f.id === fareClass) || FARE_CLASSES[0];
    const s = STATUS_LEVELS.find((x) => x.id === status) || STATUS_LEVELS[0];
    const r = ROUTE_TYPES.find((x) => x.id === routeType) || ROUTE_TYPES[0];
    const se = SEASONS.find((x) => x.id === season) || SEASONS[0];

    const probability = Math.min(0.95, fc.baseProb * s.multiplier * r.multiplier * se.multiplier);
    const probabilityPct = Math.round(probability * 100);

    let advice = "";
    if (probability < 0.05) {
      advice = "Casi imposible. Mejor pagar upgrade directo o usar millas.";
    } else if (probability < 0.15) {
      advice = "Posible pero no contar con ello. Vístete bien y check-in temprano por si acaso.";
    } else if (probability < 0.30) {
      advice = "Probabilidad razonable. Algunas estrategias mejoran tus odds.";
    } else if (probability < 0.50) {
      advice = "Buenas probabilidades. Maximiza con check-in temprano + buena presencia.";
    } else {
      advice = "Probabilidad alta. Pide cortésmente al check-in si hay disponibilidad.";
    }

    return { probability, probabilityPct, advice, seasonNote: se.note };
  }, [fareClass, status, routeType, season]);

  return (
    <section
      role="region"
      aria-labelledby="upgrade-title"
      className="space-y-6 bg-gray-900/40 border border-gray-800 rounded-2xl p-6"
    >
      <header className="space-y-2">
        <h2 id="upgrade-title" className="text-xl font-bold text-white">
          Calculadora probabilidad upgrade business
        </h2>
        <p className="text-sm text-gray-400">
          Estima tus probabilidades de upgrade gratis. Datos basados en prácticas
          comunes aerolíneas + datos públicos FlyerTalk.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label htmlFor="up-fc" className="block text-xs uppercase tracking-wider text-gray-500">
            Tu fare class
          </label>
          <select
            id="up-fc"
            value={fareClass}
            onChange={(e) => setFareClass(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2"
          >
            {FARE_CLASSES.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="up-status" className="block text-xs uppercase tracking-wider text-gray-500">
            Tu status frequent flyer
          </label>
          <select
            id="up-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2"
          >
            {STATUS_LEVELS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="up-route" className="block text-xs uppercase tracking-wider text-gray-500">
            Tipo de ruta
          </label>
          <select
            id="up-route"
            value={routeType}
            onChange={(e) => setRouteType(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2"
          >
            {ROUTE_TYPES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="up-season" className="block text-xs uppercase tracking-wider text-gray-500">
            Temporada
          </label>
          <select
            id="up-season"
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

      <div
        className={
          "rounded-xl p-5 border space-y-2 " +
          (result.probability >= 0.3
            ? "bg-emerald-500/10 border-emerald-500/30"
            : result.probability >= 0.15
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-red-500/10 border-red-500/30")
        }
      >
        <p className="text-xs uppercase tracking-wider text-gray-400">Probabilidad upgrade gratis</p>
        <p
          className={
            "text-4xl font-bold font-mono " +
            (result.probability >= 0.3
              ? "text-emerald-400"
              : result.probability >= 0.15
              ? "text-amber-400"
              : "text-red-400")
          }
        >
          {result.probabilityPct}%
        </p>
        <p className="text-sm text-gray-300">{result.advice}</p>
        <p className="text-xs text-gray-500 pt-2 border-t border-gray-800">
          <strong>Contexto temporada</strong>: {result.seasonNote}
        </p>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-white">Tips para mejorar tus odds</h3>
        <ul className="space-y-1.5 text-sm text-gray-300">
          <li>· Vístete formal: business casual, no chándal o pantalón corto</li>
          <li>· Check-in online tan pronto abra (24h antes)</li>
          <li>· Pregunta cortésmente al check-in: "¿Hay alguna posibilidad de upgrade hoy?"</li>
          <li>· Solo en aerolíneas full-service: NO funciona en Ryanair/Wizz/easyJet</li>
          <li>· Aniversarios/luna miel: a veces aerolíneas reconocen y upgradean</li>
          <li>· Volar SOLO (no en grupo) aumenta probabilidad significativamente</li>
        </ul>
      </div>

      <p className="text-xs text-gray-500 pt-3 border-t border-gray-800">
        Estimación probabilística basada en datos públicos (FlyerTalk, Reddit r/oneworld). Tu probabilidad real depende de cabin load del día concreto, política aerolínea actual, y otros factores no incluidos. No garantía.
      </p>
    </section>
  );
}

export default UpgradeCalculator;
