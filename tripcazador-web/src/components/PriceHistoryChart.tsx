import type { PriceHistory } from "@/lib/api";

interface Props {
  history: PriceHistory | null;
  currentPrice: number; // precio del deal actual (se marca con un punto)
}

/**
 * Sparkline SVG puro (sin JS en cliente) — dibuja la evolución del precio
 * mínimo diario de la ruta. Si no hay datos suficientes (<2 puntos) devuelve null.
 *
 * Muestra:
 *   - Línea suavizada con gradiente bajo la curva
 *   - Marca del precio actual vs. histórico (arriba/abajo del mínimo)
 *   - Stats: min/max/avg + variación % con flecha de tendencia
 */
export function PriceHistoryChart({ history, currentPrice }: Props) {
  if (!history || history.points.length < 2) return null;

  const points = history.points;
  const stats = "min" in history.stats ? history.stats : null;
  if (!stats) return null;

  // Dimensiones SVG — viewBox fijo, el padre lo escala con clases Tailwind.
  const W = 600;
  const H = 160;
  const PAD_X = 12;
  const PAD_Y = 20;

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices, currentPrice);
  const max = Math.max(...prices, currentPrice);
  const range = max - min || 1;

  const toX = (i: number) =>
    PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2);
  const toY = (v: number) =>
    H - PAD_Y - ((v - min) / range) * (H - PAD_Y * 2);

  // Path polyline
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.price).toFixed(1)}`)
    .join(" ");
  // Area (cierra hasta la baseline inferior)
  const area = `${d} L${toX(points.length - 1).toFixed(1)},${(H - PAD_Y).toFixed(1)} L${toX(0).toFixed(1)},${(H - PAD_Y).toFixed(1)} Z`;

  // Color según tendencia
  const trendCfg = {
    down: { stroke: "#34d399", fill: "#34d39933", label: "text-emerald-400", arrow: "↓", word: "baja" },
    up: { stroke: "#f87171", fill: "#f8717133", label: "text-red-400", arrow: "↑", word: "sube" },
    flat: { stroke: "#9ca3af", fill: "#9ca3af33", label: "text-gray-400", arrow: "→", word: "estable" },
  } as const;
  const cfg = trendCfg[stats.trend];

  // Posición del marcador "precio actual"
  const lastX = toX(points.length - 1);
  const currentY = toY(currentPrice);

  // Labels extremos (primer y último día)
  const firstDate = points[0].ts;
  const lastDate = points[points.length - 1].ts;

  // Ahorro vs. max histórico
  const saveVsMax = stats.max > 0 ? ((stats.max - currentPrice) / stats.max) * 100 : 0;

  return (
    <section className="rounded-2xl bg-gray-900/60 border border-gray-800 overflow-hidden">
      <header className="flex flex-wrap items-baseline justify-between gap-3 px-6 py-4 border-b border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Historial de precios ({stats.days_covered}d)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Ruta {history.origin}→{history.destination} ·{" "}
            {history.cabin.replace("_", " ")}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Stat label="Mín." value={`${stats.min.toFixed(0)}€`} />
          <Stat label="Máx." value={`${stats.max.toFixed(0)}€`} />
          <Stat label="Medio" value={`${stats.avg.toFixed(0)}€`} />
          <div className={`font-semibold ${cfg.label}`}>
            {cfg.arrow} {Math.abs(stats.change_pct).toFixed(0)}% {cfg.word}
          </div>
        </div>
      </header>

      <div className="px-2 pt-2 pb-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Evolución del precio de ${history.origin} a ${history.destination}`}
          className="w-full h-40"
        >
          {/* Gridlines (baseline & mid) */}
          <line
            x1={PAD_X}
            x2={W - PAD_X}
            y1={H - PAD_Y}
            y2={H - PAD_Y}
            stroke="#374151"
            strokeDasharray="2 3"
          />
          <line
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_Y}
            y2={PAD_Y}
            stroke="#374151"
            strokeDasharray="2 3"
          />

          {/* Área bajo la curva */}
          <path d={area} fill={cfg.fill} />
          {/* Línea */}
          <path
            d={d}
            fill="none"
            stroke={cfg.stroke}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Marcador del precio actual */}
          <circle
            cx={lastX}
            cy={currentY}
            r="5"
            fill="#fbbf24"
            stroke="#0a0a0a"
            strokeWidth="2"
          />
          <text
            x={lastX}
            y={currentY - 10}
            textAnchor="end"
            className="fill-amber-300"
            fontSize="12"
            fontWeight="600"
          >
            {currentPrice.toFixed(0)}€ hoy
          </text>

          {/* Labels de fechas en los extremos */}
          <text
            x={PAD_X}
            y={H - 4}
            className="fill-gray-500"
            fontSize="10"
          >
            {firstDate}
          </text>
          <text
            x={W - PAD_X}
            y={H - 4}
            textAnchor="end"
            className="fill-gray-500"
            fontSize="10"
          >
            {lastDate}
          </text>
        </svg>
      </div>

      {saveVsMax > 8 && (
        <footer className="px-6 pb-4">
          <p className="text-xs text-emerald-400/90">
            💡 Estás ahorrando ~{saveVsMax.toFixed(0)}% frente al máximo
            histórico ({stats.max.toFixed(0)}€).
          </p>
        </footer>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className="text-gray-200 font-medium">{value}</div>
    </div>
  );
}
