"use client";

import { useState, useMemo } from "react";

/**
 * CO2Calculator — abr-2026aa.
 *
 * Calculadora interactiva que compara emisiones CO2 vuelo vs tren para
 * rutas Europa. Datos basados en factores de emisión 2024 publicados por
 * EU Environmental Agency.
 *
 * Linkbait climate-conscious: rutas presets europeas + tabla de impacto
 * + recomendación. Sin captura de email, todo cliente.
 */

interface RouteData {
  slug: string;
  origin: string;
  destination: string;
  flightKm: number;
  trainKm: number;
  flightHours: number;
  trainHours: number;
  hasTrain: boolean;
}

const ROUTES: RouteData[] = [
  { slug: "MAD-BCN", origin: "Madrid", destination: "Barcelona", flightKm: 506, trainKm: 621, flightHours: 1.25, trainHours: 2.5, hasTrain: true },
  { slug: "MAD-LIS", origin: "Madrid", destination: "Lisboa", flightKm: 503, trainKm: 656, flightHours: 1.25, trainHours: 9.5, hasTrain: true },
  { slug: "MAD-PAR", origin: "Madrid", destination: "París", flightKm: 1054, trainKm: 1280, flightHours: 2, trainHours: 12, hasTrain: true },
  { slug: "BCN-PAR", origin: "Barcelona", destination: "París", flightKm: 838, trainKm: 1040, flightHours: 1.75, trainHours: 6.5, hasTrain: true },
  { slug: "MAD-LON", origin: "Madrid", destination: "Londres", flightKm: 1264, trainKm: 1660, flightHours: 2.5, trainHours: 14, hasTrain: true },
  { slug: "BCN-MAR", origin: "Barcelona", destination: "Marsella", flightKm: 396, trainKm: 510, flightHours: 1.25, trainHours: 4.5, hasTrain: true },
  { slug: "MAD-MIL", origin: "Madrid", destination: "Milán", flightKm: 1188, trainKm: 1450, flightHours: 2.25, trainHours: 18, hasTrain: true },
  { slug: "MAD-NYC", origin: "Madrid", destination: "Nueva York", flightKm: 5775, trainKm: 0, flightHours: 8, trainHours: 0, hasTrain: false },
  { slug: "MAD-NRT", origin: "Madrid", destination: "Tokio", flightKm: 10788, trainKm: 0, flightHours: 14, trainHours: 0, hasTrain: false },
];

// Factores emisión kg CO2e por pasajero/km (EU EEA 2024)
const FACTORS = {
  flight_short: 0.255, // <1500 km
  flight_long: 0.195, // >1500 km (vuelos largos más eficientes per-km)
  train_high_speed: 0.014, // AVE/TGV
  train_regular: 0.041, // Convencional
  car_alone: 0.171,
  car_4: 0.043,
};

export function CO2Calculator() {
  const [selectedRoute, setSelectedRoute] = useState<string>("MAD-BCN");
  const [carriers, setCarriers] = useState<number>(1);

  const route = ROUTES.find((r) => r.slug === selectedRoute) || ROUTES[0];

  const calculations = useMemo(() => {
    const flightFactor = route.flightKm < 1500 ? FACTORS.flight_short : FACTORS.flight_long;
    const flightCO2 = route.flightKm * flightFactor;
    const trainCO2 = route.hasTrain ? route.trainKm * FACTORS.train_high_speed : 0;
    const carAloneCO2 = route.hasTrain ? route.trainKm * FACTORS.car_alone : 0;
    const car4CO2 = route.hasTrain ? route.trainKm * FACTORS.car_4 : 0;

    const flightTotalGroup = flightCO2 * carriers;
    const trainTotalGroup = trainCO2 * carriers;

    const savedVsFlight = flightCO2 - trainCO2;
    const savedPct = trainCO2 > 0 ? Math.round((savedVsFlight / flightCO2) * 100) : 0;

    // Equivalentes tangibles
    // 1 árbol absorbe ~21 kg CO2/año
    const treesEquivalent = Math.round(savedVsFlight / 21);

    return {
      flightCO2,
      trainCO2,
      carAloneCO2,
      car4CO2,
      flightTotalGroup,
      trainTotalGroup,
      savedVsFlight,
      savedPct,
      treesEquivalent,
    };
  }, [route, carriers]);

  return (
    <section
      role="region"
      aria-labelledby="co2-calc-title"
      className="space-y-6 bg-gray-900/40 border border-gray-800 rounded-2xl p-6"
    >
      <header className="space-y-2">
        <h2 id="co2-calc-title" className="text-xl font-bold text-white">
          Calculadora CO2: vuelo vs tren
        </h2>
        <p className="text-sm text-gray-400">
          Calcula emisiones de CO2 por persona para rutas Europeas. Datos
          basados en factores oficiales EU EEA 2024.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label htmlFor="co2-route" className="block text-xs uppercase tracking-wider text-gray-500">
            Ruta
          </label>
          <select
            id="co2-route"
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2"
          >
            {ROUTES.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.origin} → {r.destination}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="co2-pax" className="block text-xs uppercase tracking-wider text-gray-500">
            Número de personas
          </label>
          <input
            id="co2-pax"
            type="number"
            min="1"
            max="10"
            value={carriers}
            onChange={(e) => setCarriers(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
            className="w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-800">
        <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-red-300 uppercase tracking-wider">
            ✈️ Vuelo
          </h3>
          <p className="text-3xl font-bold text-red-400 font-mono">
            {Math.round(calculations.flightCO2)} kg CO2e
          </p>
          <p className="text-xs text-gray-400">
            por persona · {Math.round(calculations.flightTotalGroup)} kg total grupo
          </p>
          <p className="text-xs text-gray-500 pt-2 border-t border-red-500/20">
            {route.flightHours}h de vuelo · {route.flightKm} km · factor {route.flightKm < 1500 ? "0.255" : "0.195"} kg/km
          </p>
        </div>

        {route.hasTrain ? (
          <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider">
              🚄 Tren AVE/TGV
            </h3>
            <p className="text-3xl font-bold text-emerald-400 font-mono">
              {Math.round(calculations.trainCO2)} kg CO2e
            </p>
            <p className="text-xs text-gray-400">
              por persona · {Math.round(calculations.trainTotalGroup)} kg total grupo
            </p>
            <p className="text-xs text-gray-500 pt-2 border-t border-emerald-500/20">
              {route.trainHours}h tren · {route.trainKm} km · factor 0.014 kg/km
            </p>
          </div>
        ) : (
          <div className="bg-gray-900/40 border border-gray-700 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              🚄 Tren
            </h3>
            <p className="text-2xl font-bold text-gray-500">No disponible</p>
            <p className="text-xs text-gray-500">
              Para rutas transatlánticas o intercontinentales, no hay alternativa de tren.
            </p>
          </div>
        )}
      </div>

      {route.hasTrain && (
        <>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-white">
              {calculations.savedPct >= 80 ? "🌱 Tren ahorra significativo" : calculations.savedPct >= 50 ? "✓ Tren ahorra notable" : "⚠️ Tren ahorra moderado"}
            </p>
            <p className="text-3xl font-bold text-emerald-400 font-mono">
              −{Math.round(calculations.savedVsFlight)} kg CO2e
            </p>
            <p className="text-sm text-gray-300">
              Por persona, ahorrarías un <strong className="text-emerald-400">{calculations.savedPct}%</strong> de emisiones eligiendo tren en lugar de vuelo.
            </p>
            <p className="text-xs text-gray-400 pt-2 border-t border-amber-500/20">
              Equivalente a lo que absorberían <strong className="text-emerald-400">{calculations.treesEquivalent} árboles en un año</strong> (estimación: 21 kg CO2/árbol/año).
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Para comparar: coche
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Coche solo</p>
                <p className="text-lg font-mono font-semibold text-orange-400">
                  {Math.round(calculations.carAloneCO2)} kg
                </p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Coche 4 personas</p>
                <p className="text-lg font-mono font-semibold text-amber-400">
                  {Math.round(calculations.car4CO2)} kg
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="text-xs text-gray-500 pt-4 border-t border-gray-800 space-y-1">
        <p>Fuentes:</p>
        <p>· Factores emisión: EU Environmental Agency 2024 (CO2e por pasajero-km)</p>
        <p>· Distancias tren: aproximaciones ferroviarias reales (no líneas rectas)</p>
        <p>· Vuelo {"<1500km"}: factor 0.255 (LTO + cruise emissions)</p>
        <p>· Vuelo {">1500km"}: factor 0.195 (eficiencia per-km mayor)</p>
      </div>
    </section>
  );
}

export default CO2Calculator;
