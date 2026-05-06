"use client";
import { useState } from "react";
import { buildHeuristicPackingList, type PackingInput, type PackingItem } from "@/lib/packing";

const ACTIVITIES = [
  { id: "playa", label: "🏖️ Playa" },
  { id: "ciudad", label: "🏙️ Ciudad" },
  { id: "trekking", label: "🥾 Trekking" },
  { id: "fiesta", label: "🎉 Fiesta" },
  { id: "frio", label: "❄️ Frío extremo" },
  { id: "trabajo", label: "💼 Trabajo" },
];

export function PackingListClient() {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(7);
  const [travelers, setTravelers] = useState(2);
  const [travelerType, setTravelerType] = useState<PackingInput["travelerType"]>("pareja");
  const [season, setSeason] = useState<PackingInput["season"]>("verano");
  const [activities, setActivities] = useState<string[]>(["ciudad", "playa"]);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState(false);

  function generate() {
    const list = buildHeuristicPackingList({
      destination,
      days,
      travelers,
      travelerType,
      season,
      activities,
    });
    setItems(list);
    setGenerated(true);
    setChecked(new Set());
  }

  function toggleAct(id: string) {
    setActivities((acts) => (acts.includes(id) ? acts.filter((a) => a !== id) : [...acts, id]));
  }

  function toggleCheck(name: string) {
    setChecked((s) => {
      const ns = new Set(s);
      if (ns.has(name)) ns.delete(name);
      else ns.add(name);
      return ns;
    });
  }

  // Group items by category
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PackingItem[]>);

  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
        className="panel sticky top-24 self-start space-y-4"
      >
        <h2 className="text-lg font-bold text-amber-400">Tu maleta</h2>
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Destino</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Tokio, Bali..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-amber-400 outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Días</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min={1}
              max={30}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Personas</label>
            <input
              type="number"
              value={travelers}
              onChange={(e) => setTravelers(Number(e.target.value))}
              min={1}
              max={8}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Tipo</label>
            <select
              value={travelerType}
              onChange={(e) => setTravelerType(e.target.value as PackingInput["travelerType"])}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="solo">Solo</option>
              <option value="pareja">Pareja</option>
              <option value="familia">Familia</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-300 mb-1">Estación</label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value as PackingInput["season"])}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="primavera">Primavera</option>
              <option value="verano">Verano</option>
              <option value="otoño">Otoño</option>
              <option value="invierno">Invierno</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-300 mb-2">Actividades</label>
          <div className="grid grid-cols-2 gap-2">
            {ACTIVITIES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAct(a.id)}
                className={`text-xs py-2 px-2 rounded border transition ${
                  activities.includes(a.id)
                    ? "bg-amber-400 text-slate-900 border-amber-400"
                    : "bg-slate-800 text-gray-200 border-slate-700"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 rounded-lg"
        >
          🎒 Generar lista
        </button>
      </form>

      <div className="space-y-4">
        {!generated && (
          <div className="panel py-16 text-center">
            <div className="text-5xl mb-3">🎒</div>
            <h3 className="text-lg font-bold text-amber-400">Tu packing list aparecerá aquí</h3>
            <p className="text-sm text-gray-300 mt-2">Rellena el formulario y la generamos al instante.</p>
          </div>
        )}
        {generated && (
          <>
            <div className="panel flex items-baseline justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">{items.length} items</h3>
                <p className="text-sm text-gray-400">
                  {checked.size} ya empacados ·{" "}
                  {items.length - checked.size} pendientes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChecked(new Set())}
                className="text-xs text-gray-400 hover:text-amber-400 underline"
              >
                Reiniciar marcadores
              </button>
            </div>
            {Object.entries(grouped).map(([cat, list]) => (
              <div key={cat} className="panel">
                <h4 className="text-sm uppercase tracking-wide text-amber-400 font-bold mb-3">{cat}</h4>
                <ul className="space-y-2">
                  {list.map((it) => (
                    <li key={it.name} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked.has(it.name)}
                        onChange={() => toggleCheck(it.name)}
                        className="w-5 h-5 accent-amber-400"
                      />
                      <span
                        className={`flex-1 text-sm ${
                          checked.has(it.name) ? "text-gray-500 line-through" : "text-gray-200"
                        }`}
                      >
                        {it.name}
                        {it.qty > 1 && <span className="text-gray-500"> × {it.qty}</span>}
                        {it.essential && (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-red-400">
                            esencial
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
