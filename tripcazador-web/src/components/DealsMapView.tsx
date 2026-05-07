/**
 * DealsMapView — SSS83 (May 2026)
 *
 * Vista mapa de deals con pins por destino. Server-rendered SVG (no
 * hydratación) — funciona aunque JS falle. Click en pin abre el deal.
 */
import Link from "next/link";
import type { Deal } from "@/lib/api";

interface Props {
  deals: Deal[];
}

const MAP_W = 1000;
const MAP_H = 500;

function project(lat: number, lon: number): [number, number] {
  const lonClamped = Math.max(-180, Math.min(180, lon));
  const latClamped = Math.max(-60, Math.min(75, lat));
  const x = ((lonClamped + 180) / 360) * MAP_W;
  const phi = (latClamped * Math.PI) / 180;
  const yMerc = Math.log(Math.tan(Math.PI / 4 + phi / 2));
  const yMercMin = Math.log(Math.tan(Math.PI / 4 + (-60 * Math.PI) / 180 / 2));
  const yMercMax = Math.log(Math.tan(Math.PI / 4 + (75 * Math.PI) / 180 / 2));
  const y = MAP_H - ((yMerc - yMercMin) / (yMercMax - yMercMin)) * MAP_H;
  return [x, y];
}

const CONTINENTS = [
  "M460,150 L490,135 L530,130 L580,135 L610,150 L625,170 L615,195 L590,210 L555,220 L520,215 L490,205 L470,185 L460,165 Z",
  "M490,225 L530,220 L575,235 L605,255 L620,290 L625,325 L615,360 L595,395 L570,420 L540,440 L510,440 L485,420 L470,390 L470,355 L480,320 L490,285 L490,255 Z",
  "M620,140 L660,130 L720,135 L780,145 L830,160 L860,180 L865,210 L850,235 L820,250 L780,255 L740,250 L700,240 L665,225 L640,205 L625,180 Z",
  "M555,100 L640,95 L730,100 L820,105 L890,115 L900,140 L880,160 L850,170 L800,170 L745,165 L685,160 L625,150 L580,135 Z",
  "M810,260 L850,265 L880,275 L890,295 L875,310 L845,315 L815,305 L795,285 Z",
  "M150,140 L200,125 L260,120 L310,130 L355,150 L370,180 L355,210 L325,235 L290,250 L250,255 L215,245 L180,225 L155,200 L145,170 Z",
  "M260,260 L295,255 L320,265 L335,290 L320,310 L290,315 L265,300 L255,280 Z",
  "M310,310 L345,305 L375,315 L395,340 L405,370 L400,405 L385,440 L365,465 L340,475 L315,470 L295,445 L290,410 L295,375 L302,340 Z",
  "M820,395 L860,395 L890,405 L905,425 L900,445 L880,455 L850,455 L820,445 L805,425 L810,410 Z",
  "M450,135 L470,130 L478,145 L470,160 L455,162 L445,150 Z",
];

function priceColor(price: number): string {
  if (price < 50) return "#22c55e"; // green
  if (price < 100) return "#fbbf24"; // amber
  if (price < 200) return "#fb923c"; // orange
  return "#ef4444"; // red
}

export function DealsMapView({ deals }: Props) {
  // Sólo deals con lat/lon válidos
  const pins = deals.filter((d) => typeof d.lat === "number" && typeof d.lon === "number");

  if (pins.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-800 p-6 bg-slate-900/40 text-gray-400 text-sm text-center">
        No hay deals con coordenadas para mostrar en el mapa.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Mapa de chollos</h2>
          <p className="text-sm text-gray-400">
            {pins.length} chollos con destino marcado · color por precio
          </p>
        </div>
        <div className="flex gap-3 text-xs items-center">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500"/>&lt;50€</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-amber-400"/>&lt;100€</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-orange-400"/>&lt;200€</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-500"/>≥200€</span>
        </div>
      </div>

      <div className="relative w-full rounded-xl bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700 overflow-hidden">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
          role="img"
          aria-label={`Mapa con ${pins.length} chollos disponibles`}
        >
          <rect width={MAP_W} height={MAP_H} fill="#0f172a" />
          <g fill="#475569" stroke="#64748b" strokeWidth="0.7" opacity="0.95">
            {CONTINENTS.map((d, i) => <path key={i} d={d} />)}
          </g>
          {pins.map((deal) => {
            const [x, y] = project(deal.lat as number, deal.lon as number);
            const c = priceColor(deal.price_eur ?? 999);
            return (
              <a key={deal.id} href={`/deals/${encodeURIComponent(deal.id)}`} aria-label={`${deal.city_to} desde ${deal.price_eur}€`}>
                <circle cx={x} cy={y} r={5} fill={c} stroke="#0f172a" strokeWidth="1.5" />
                <title>{deal.city_to} · {deal.price_eur}€ · {deal.airline_name}</title>
              </a>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Tip: pulsa cualquier pin para ver el detalle del chollo y reservar.
      </div>

      {/* Lista debajo del mapa para SEO + accesibilidad */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {pins.slice(0, 16).map((d) => (
          <Link
            key={d.id}
            href={`/deals/${encodeURIComponent(d.id)}`}
            className="text-xs text-gray-300 hover:text-amber-400 hover:bg-slate-800/50 rounded px-2 py-1 transition flex items-center gap-2"
          >
            <span aria-hidden="true" className="w-2 h-2 rounded-full" style={{ background: priceColor(d.price_eur ?? 999) }} />
            <span className="truncate">{d.city_to}</span>
            <span className="ml-auto text-amber-400">€{d.price_eur}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
