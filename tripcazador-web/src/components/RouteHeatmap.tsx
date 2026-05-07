/**
 * RouteHeatmap — SSS83 (May 2026)
 *
 * Heatmap calendario por ruta: 12 meses x 7 días = grid color-coded por
 * precio mínimo del día (verde=mejor, rojo=caro). Server component.
 */

interface DayPrice {
  date: string; // YYYY-MM-DD
  price: number;
}

interface Props {
  origin: string;
  destination: string;
  data: DayPrice[];
}

function colorFor(price: number, min: number, max: number): string {
  if (price <= 0) return "#1e293b";
  if (max <= min) return "#22c55e";
  const ratio = (price - min) / (max - min);
  if (ratio < 0.25) return "#22c55e"; // green
  if (ratio < 0.5) return "#84cc16"; // lime
  if (ratio < 0.75) return "#fbbf24"; // amber
  return "#ef4444"; // red
}

export function RouteHeatmap({ origin, destination, data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 p-6 text-center text-sm text-gray-400">
        Sin histórico para {origin}-{destination} aún.
      </div>
    );
  }

  const prices = data.map((d) => d.price).filter((p) => p > 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  // Group by month
  const byMonth = new Map<string, DayPrice[]>();
  for (const d of data) {
    const month = d.date.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(d);
  }
  const months = Array.from(byMonth.keys()).sort();

  const monthName = (m: string) => {
    const names = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const [y, mo] = m.split("-");
    return `${names[parseInt(mo, 10) - 1]} ${y}`;
  };

  return (
    <div className="rounded-2xl border border-gray-800 p-4 sm:p-6 bg-slate-900/40">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-white">Calendario de precios</h3>
          <p className="text-sm text-gray-400">{origin} → {destination} · {data.length} días con datos</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{min}€</span>
          <span className="inline-flex h-2 w-32 rounded-full overflow-hidden">
            <span style={{ background: "#22c55e", width: "25%" }}/>
            <span style={{ background: "#84cc16", width: "25%" }}/>
            <span style={{ background: "#fbbf24", width: "25%" }}/>
            <span style={{ background: "#ef4444", width: "25%" }}/>
          </span>
          <span>{max}€</span>
        </div>
      </div>

      <div className="space-y-3 overflow-x-auto">
        {months.map((m) => {
          const days = byMonth.get(m)!;
          return (
            <div key={m}>
              <div className="text-xs text-gray-400 mb-1">{monthName(m)}</div>
              <div className="flex flex-wrap gap-1">
                {days.map((d) => {
                  const c = colorFor(d.price, min, max);
                  const day = parseInt(d.date.slice(8, 10), 10);
                  return (
                    <div
                      key={d.date}
                      title={`${d.date}: ${d.price}€`}
                      className="w-7 h-7 rounded text-[10px] font-bold flex items-center justify-center text-slate-900"
                      style={{ background: c }}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Tip: días en verde son los más baratos para volar. Pulsa el deal para reservar.
      </p>
    </div>
  );
}
