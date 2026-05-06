"use client";
/**
 * JetLagCalculator — A4 (May 2026)
 *
 * Input: timezone origen, destino, hora de salida, duración. Output: zona
 * horaria local de llegada, severidad jet lag (rule of thumb: 1 día por
 * cada 1-1.5 husos), plan de pre-shift sleep, exposición luz, café/melatonina.
 */
import { useMemo, useState } from "react";

const POPULAR_TZ: { iata: string; city: string; offset: number }[] = [
  { iata: "MAD", city: "Madrid", offset: 1 },
  { iata: "BCN", city: "Barcelona", offset: 1 },
  { iata: "LON", city: "Londres", offset: 0 },
  { iata: "NYC", city: "Nueva York", offset: -5 },
  { iata: "MIA", city: "Miami", offset: -5 },
  { iata: "MEX", city: "Ciudad de México", offset: -6 },
  { iata: "BOG", city: "Bogotá", offset: -5 },
  { iata: "EZE", city: "Buenos Aires", offset: -3 },
  { iata: "SCL", city: "Santiago de Chile", offset: -3 },
  { iata: "LIM", city: "Lima", offset: -5 },
  { iata: "DXB", city: "Dubái", offset: 4 },
  { iata: "BKK", city: "Bangkok", offset: 7 },
  { iata: "DPS", city: "Bali", offset: 8 },
  { iata: "HKG", city: "Hong Kong", offset: 8 },
  { iata: "PEK", city: "Pekín", offset: 8 },
  { iata: "NRT", city: "Tokio", offset: 9 },
  { iata: "SEL", city: "Seúl", offset: 9 },
  { iata: "SYD", city: "Sídney", offset: 10 },
  { iata: "AKL", city: "Auckland", offset: 12 },
  { iata: "JNB", city: "Johannesburgo", offset: 2 },
  { iata: "CAI", city: "El Cairo", offset: 2 },
];

export function JetLagCalculator() {
  const [origin, setOrigin] = useState("MAD");
  const [dest, setDest] = useState("NRT");
  const [departTime, setDepartTime] = useState("14:30");
  const [durationH, setDurationH] = useState(13);

  const result = useMemo(() => {
    const o = POPULAR_TZ.find((t) => t.iata === origin);
    const d = POPULAR_TZ.find((t) => t.iata === dest);
    if (!o || !d) return null;
    const tzDelta = d.offset - o.offset;
    const tzAbs = Math.abs(tzDelta);
    const direction = tzDelta > 0 ? "este" : tzDelta < 0 ? "oeste" : "ninguno";

    // arrival local time
    const [hh, mm] = departTime.split(":").map(Number);
    const departMinutes = hh * 60 + mm;
    const arrivalUtc = departMinutes - o.offset * 60 + durationH * 60;
    const arrivalLocal = arrivalUtc + d.offset * 60;
    const normalized = ((arrivalLocal % 1440) + 1440) % 1440;
    const arrH = Math.floor(normalized / 60);
    const arrM = Math.round(normalized % 60);
    const arrival = `${String(arrH).padStart(2, "0")}:${String(arrM).padStart(2, "0")}`;
    const dayShift = Math.floor((arrivalLocal - departMinutes) / 1440);

    // severity rule of thumb: 1 day recovery per 1-1.5 timezones
    const recoveryDays = Math.ceil(tzAbs / 1.3);
    let severity: "leve" | "moderado" | "severo" = "leve";
    if (tzAbs >= 8) severity = "severo";
    else if (tzAbs >= 4) severity = "moderado";

    return { tzDelta, tzAbs, direction, arrival, dayShift, recoveryDays, severity, origin: o, dest: d };
  }, [origin, dest, departTime, durationH]);

  if (!result) return null;

  // Pre-shift sleep plan
  const preShift: string[] = [];
  if (result.tzAbs >= 4) {
    const days = Math.min(4, Math.floor(result.tzAbs / 2));
    const direction = result.direction === "este" ? "antes" : "después";
    for (let i = days; i >= 1; i--) {
      preShift.push(`${i} ${i === 1 ? "día" : "días"} antes: acuéstate y levántate ${i * 30} min ${direction} de lo habitual`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="panel grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Origen</label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400 outline-none"
          >
            {POPULAR_TZ.map((t) => (
              <option key={t.iata} value={t.iata}>
                {t.city} ({t.iata}) UTC{t.offset >= 0 ? "+" : ""}{t.offset}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Destino</label>
          <select
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400 outline-none"
          >
            {POPULAR_TZ.map((t) => (
              <option key={t.iata} value={t.iata}>
                {t.city} ({t.iata}) UTC{t.offset >= 0 ? "+" : ""}{t.offset}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Hora salida (local origen)</label>
          <input
            type="time"
            value={departTime}
            onChange={(e) => setDepartTime(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Duración (h)</label>
          <input
            type="number"
            value={durationH}
            onChange={(e) => setDurationH(Number(e.target.value))}
            min={1}
            max={24}
            step={0.5}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400 outline-none"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <ResultBox label="Husos saltados" value={`${result.tzAbs}h ${result.direction !== "ninguno" ? result.direction : ""}`} />
        <ResultBox label="Llegada local" value={result.arrival + (result.dayShift !== 0 ? ` (${result.dayShift > 0 ? "+" : ""}${result.dayShift}d)` : "")} />
        <ResultBox label="Recuperación" value={`~${result.recoveryDays} ${result.recoveryDays === 1 ? "día" : "días"}`} highlight={result.severity} />
      </div>

      {result.tzAbs >= 4 && (
        <div className="panel">
          <h3 className="text-sm uppercase tracking-wide text-amber-400 font-bold mb-3">Plan pre-vuelo (opcional)</h3>
          <ul className="space-y-1 text-sm text-gray-200">
            {preShift.map((p, i) => (
              <li key={i}>• {p}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel">
        <h3 className="text-sm uppercase tracking-wide text-amber-400 font-bold mb-3">Recomendaciones llegada</h3>
        <ul className="space-y-2 text-sm text-gray-200">
          {result.direction === "este" ? (
            <>
              <li>☀️ <strong>Luz:</strong> exposición a la luz por la mañana (8-12h locales)</li>
              <li>🌙 <strong>Evitar luz:</strong> entre 16-20h locales el primer día</li>
              <li>☕ <strong>Cafeína:</strong> sólo antes de mediodía local</li>
              <li>💊 <strong>Melatonina (consulta médico):</strong> 0.5-3mg 1h antes de dormir, 3-5 noches</li>
            </>
          ) : result.direction === "oeste" ? (
            <>
              <li>☀️ <strong>Luz:</strong> exposición a la luz al final del día (16-20h locales)</li>
              <li>🌙 <strong>Evitar luz:</strong> al amanecer el primer día</li>
              <li>☕ <strong>Cafeína:</strong> útil para mantenerse despierto hasta la hora local</li>
              <li>💊 <strong>Melatonina:</strong> generalmente NO se recomienda hacia oeste</li>
            </>
          ) : (
            <li>✓ Sin cambio de huso. Sólo recuperar del cansancio del vuelo.</li>
          )}
          <li>💧 <strong>Hidratación:</strong> 200ml/h en vuelo, evita alcohol durante</li>
          <li>🍽️ <strong>Comidas:</strong> sincronizar a horario local desde día 1</li>
        </ul>
      </div>
    </div>
  );
}

function ResultBox({ label, value, highlight }: { label: string; value: string; highlight?: "leve" | "moderado" | "severo" }) {
  const color =
    highlight === "severo"
      ? "border-red-500/40 bg-red-500/10 text-red-300"
      : highlight === "moderado"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : highlight === "leve"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : "border-amber-400/30 bg-amber-400/5 text-amber-400";
  return (
    <div className={`rounded-lg p-4 border ${color}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-2xl font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}
