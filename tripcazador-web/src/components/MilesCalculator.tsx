"use client";

import { useState, useMemo } from "react";

/**
 * MilesCalculator — abr-2026bb.
 *
 * Calculadora de distancia + millas equivalentes para una ruta IATA-IATA.
 * Calcula gran círculo (Haversine) y estima millas/euros según fare class
 * y programa frequent flyer. Linkbait practical.
 */

// Coordenadas IATA seleccionadas. Datos públicos OpenFlights.
const COORDS: Record<string, [number, number]> = {
  // Europa
  MAD: [40.4719, -3.5626], BCN: [41.2974, 2.0833], LIS: [38.7813, -9.1359],
  CDG: [49.0097, 2.5479], LHR: [51.4700, -0.4543], FRA: [50.0379, 8.5622],
  AMS: [52.3105, 4.7683], FCO: [41.8003, 12.2389], MUC: [48.3537, 11.7861],
  ZRH: [47.4647, 8.5492], IST: [41.2753, 28.7519], HEL: [60.3172, 24.9633],
  // Asia
  NRT: [35.7720, 140.3929], HND: [35.5494, 139.7798], BKK: [13.6900, 100.7501],
  ICN: [37.4602, 126.4407], SIN: [1.3644, 103.9915], HKG: [22.3080, 113.9185],
  PEK: [40.0801, 116.5846], DXB: [25.2532, 55.3657], DOH: [25.2731, 51.6080],
  AUH: [24.4330, 54.6511], DPS: [-8.7480, 115.1672], CMB: [7.1808, 79.8841],
  MLE: [4.1918, 73.5290],
  // América
  JFK: [40.6413, -73.7781], LAX: [33.9416, -118.4085], ORD: [41.9742, -87.9073],
  MIA: [25.7959, -80.2870], EZE: [-34.8222, -58.5358], MEX: [19.4361, -99.0719],
  SCL: [-33.3927, -70.7858], GRU: [-23.4356, -46.4731], LIM: [-12.0219, -77.1143],
  HAV: [22.9892, -82.4091], CUN: [21.0365, -86.8771], PUJ: [18.5674, -68.3634],
  // África / Oceanía
  CMN: [33.3675, -7.5897], RAK: [31.6069, -8.0363], JNB: [-26.1392, 28.2461],
  CAI: [30.1219, 31.4056], NBO: [-1.3192, 36.9277], SYD: [-33.9461, 151.1772],
  AKL: [-37.0082, 174.7917],
};

// Programas frequent flyer principales con factor de earning para EUR-Asia business.
// Datos aproximados 2026, varían por fare class.
const FFP_PROGRAMS = [
  { name: "Iberia Plus (Avios)", earningFactor: 1.5, redemptionValueCt: 1.4 }, // 1 mile = 1.4 cents
  { name: "Lufthansa M&M", earningFactor: 2.0, redemptionValueCt: 1.2 },
  { name: "ANA Mileage Club", earningFactor: 1.5, redemptionValueCt: 1.6 },
  { name: "JAL Mileage Bank", earningFactor: 1.5, redemptionValueCt: 1.5 },
  { name: "Flying Blue (AF/KLM)", earningFactor: 1.0, redemptionValueCt: 1.1 },
  { name: "British Airways Avios", earningFactor: 1.0, redemptionValueCt: 1.4 },
  { name: "Qatar Privilege Club", earningFactor: 1.5, redemptionValueCt: 1.3 },
  { name: "Turkish Miles&Smiles", earningFactor: 1.0, redemptionValueCt: 1.0 },
];

const FARE_CLASSES = [
  { id: "economy", label: "Economy", earningMultiplier: 1.0 },
  { id: "premium", label: "Premium Economy", earningMultiplier: 1.25 },
  { id: "business", label: "Business", earningMultiplier: 1.5 },
  { id: "first", label: "First Class", earningMultiplier: 2.0 },
];

function haversineKm(p1: [number, number], p2: [number, number]): number {
  const [lat1, lon1] = p1;
  const [lat2, lon2] = p2;
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function MilesCalculator() {
  const [origin, setOrigin] = useState<string>("MAD");
  const [destination, setDestination] = useState<string>("NRT");
  const [fareClass, setFareClass] = useState<string>("business");
  const [program, setProgram] = useState<string>("Iberia Plus (Avios)");

  const result = useMemo(() => {
    const o = COORDS[origin.toUpperCase()];
    const d = COORDS[destination.toUpperCase()];
    if (!o || !d) return null;
    const km = haversineKm(o, d);
    const miles = km * 0.621371;
    const fc = FARE_CLASSES.find((f) => f.id === fareClass) || FARE_CLASSES[0];
    const ffp = FFP_PROGRAMS.find((p) => p.name === program) || FFP_PROGRAMS[0];
    const earnedMiles = Math.round(miles * fc.earningMultiplier * ffp.earningFactor);
    const valueEur = Math.round((earnedMiles * ffp.redemptionValueCt) / 100);
    return { km: Math.round(km), miles: Math.round(miles), earnedMiles, valueEur };
  }, [origin, destination, fareClass, program]);

  const availableIata = Object.keys(COORDS).sort();

  return (
    <section
      role="region"
      aria-labelledby="miles-calc-title"
      className="space-y-6 bg-gray-900/40 border border-gray-800 rounded-2xl p-6"
    >
      <header className="space-y-2">
        <h2 id="miles-calc-title" className="text-xl font-bold text-white">
          Calculadora de millas y distancia
        </h2>
        <p className="text-sm text-gray-400">
          Calcula distancia gran círculo + millas que ganarías + valor estimado en redenciones.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label htmlFor="miles-orig" className="block text-xs uppercase tracking-wider text-gray-500">
            Origen (IATA)
          </label>
          <select
            id="miles-orig"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2 font-mono"
          >
            {availableIata.map((iata) => (
              <option key={iata} value={iata}>{iata}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="miles-dest" className="block text-xs uppercase tracking-wider text-gray-500">
            Destino (IATA)
          </label>
          <select
            id="miles-dest"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2 font-mono"
          >
            {availableIata.map((iata) => (
              <option key={iata} value={iata}>{iata}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="miles-fc" className="block text-xs uppercase tracking-wider text-gray-500">
            Cabina
          </label>
          <select
            id="miles-fc"
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
          <label htmlFor="miles-prog" className="block text-xs uppercase tracking-wider text-gray-500">
            Programa de millas
          </label>
          <select
            id="miles-prog"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 text-white rounded px-3 py-2"
          >
            {FFP_PROGRAMS.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {result ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-800">
          <div className="bg-blue-500/5 border border-blue-500/30 rounded-xl p-4 space-y-1">
            <p className="text-xs uppercase text-blue-300">Distancia</p>
            <p className="text-2xl font-bold text-blue-400 font-mono">
              {result.km.toLocaleString("es-ES")} km
            </p>
            <p className="text-xs text-gray-500">{result.miles.toLocaleString("es-ES")} mi</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4 space-y-1">
            <p className="text-xs uppercase text-amber-300">Millas ganadas</p>
            <p className="text-2xl font-bold text-amber-400 font-mono">
              {result.earnedMiles.toLocaleString("es-ES")}
            </p>
            <p className="text-xs text-gray-500">por viaje ida y vuelta</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4 space-y-1">
            <p className="text-xs uppercase text-emerald-300">Valor estimado</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono">
              €{result.valueEur.toLocaleString("es-ES")}
            </p>
            <p className="text-xs text-gray-500">en redenciones óptimas</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Selecciona origen y destino válidos.</p>
      )}

      <div className="text-xs text-gray-500 pt-4 border-t border-gray-800 space-y-1">
        <p><strong className="text-gray-400">Nota</strong>: cifras estimadas. Las millas reales dependen de tu fare class exacta (Y/B/M vs Q/T/L) y promociones. El valor en redenciones varía según ruta y disponibilidad. Para cifras exactas, consulta el T&C de tu programa.</p>
        <p><strong className="text-gray-400">Earning factor</strong>: multiplicador estimado del programa (1.0 = base). M&M y ANA tienen mejores tasas en business. Avios y Flying Blue tienen mejores redenciones short-haul.</p>
      </div>
    </section>
  );
}

export default MilesCalculator;
