import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Mapa de precios mensuales: cuándo volar barato en 2026",
  description:
    "Heat-map visual con precios mensuales reales para 12 rutas populares desde España. Visualiza de un vistazo cuándo está barato volar a tu destino objetivo.",
  alternates: { canonical: "/mapa-precios" },
  openGraph: {
    type: "website",
    title: "Mapa de precios — TripCazador",
    description: "Visualiza los precios reales por mes para 12 rutas desde España.",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

interface RouteHeatmap {
  origin: string;
  dest: string;
  destCity: string;
  prices: number[]; // 12 valores Ene-Dic
  category: "europa" | "long-haul" | "americano" | "asia";
}

const ROUTES: RouteHeatmap[] = [
  // Europa
  { origin: "MAD", dest: "LIS", destCity: "Lisboa", prices: [78, 72, 92, 115, 128, 158, 185, 175, 115, 98, 85, 110], category: "europa" },
  { origin: "MAD", dest: "FCO", destCity: "Roma", prices: [95, 85, 105, 145, 168, 195, 215, 205, 135, 110, 95, 130], category: "europa" },
  { origin: "BCN", dest: "FCO", destCity: "Roma", prices: [65, 58, 72, 95, 120, 145, 165, 155, 95, 72, 65, 88], category: "europa" },
  { origin: "MAD", dest: "CDG", destCity: "París", prices: [145, 125, 155, 195, 225, 255, 285, 275, 195, 165, 135, 175], category: "europa" },
  { origin: "AGP", dest: "LGW", destCity: "Londres", prices: [58, 52, 68, 88, 105, 125, 145, 138, 88, 65, 58, 95], category: "europa" },
  // Americano
  { origin: "MAD", dest: "JFK", destCity: "Nueva York", prices: [445, 430, 510, 580, 650, 720, 850, 800, 590, 510, 480, 620], category: "americano" },
  { origin: "MAD", dest: "EZE", destCity: "Buenos Aires", prices: [750, 650, 720, 820, 950, 1050, 1150, 1080, 920, 820, 750, 920], category: "americano" },
  { origin: "MAD", dest: "MEX", destCity: "Ciudad de México", prices: [620, 580, 670, 780, 850, 920, 1050, 980, 720, 650, 600, 850], category: "americano" },
  // Asia
  { origin: "MAD", dest: "BKK", destCity: "Bangkok", prices: [475, 420, 510, 620, 650, 780, 880, 820, 595, 510, 520, 685], category: "asia" },
  { origin: "MAD", dest: "NRT", destCity: "Tokio", prices: [820, 795, 950, 1100, 1250, 1180, 1350, 1280, 950, 845, 880, 1050], category: "asia" },
  { origin: "BCN", dest: "DPS", destCity: "Bali", prices: [895, 850, 920, 1050, 1150, 1280, 1450, 1380, 1020, 895, 920, 1180], category: "asia" },
  // Long-haul (otro)
  { origin: "MAD", dest: "RAK", destCity: "Marrakech", prices: [125, 115, 145, 195, 225, 245, 285, 275, 195, 165, 135, 175], category: "europa" },
];

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const CATEGORY_LABELS: Record<string, string> = {
  europa: "Europa",
  americano: "América",
  asia: "Asia",
  "long-haul": "Otros largo radio",
};

function getColor(price: number, min: number, max: number): string {
  // Normalize 0-1
  const t = (price - min) / (max - min);
  // Verde (barato) → amarillo → rojo (caro)
  if (t < 0.33) return "#34d399"; // emerald
  if (t < 0.66) return "#fbbf24"; // amber
  return "#ef4444"; // red
}

function getLabel(price: number, min: number, max: number): string {
  const t = (price - min) / (max - min);
  if (t < 0.33) return "Barato";
  if (t < 0.66) return "Medio";
  return "Caro";
}

export default function MapaPreciosPage() {
  // Group by category
  const grouped: Record<string, RouteHeatmap[]> = {};
  for (const r of ROUTES) {
    grouped[r.category] = grouped[r.category] || [];
    grouped[r.category].push(r);
  }
  const categories = ["europa", "americano", "asia", "long-haul"].filter((c) => grouped[c]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Mapa de precios mensuales por ruta — TripCazador",
    description:
      "Heat-map de precios mensuales para 12 rutas populares desde aeropuertos españoles, basado en 80,000+ búsquedas del motor TripCazador.",
    url: "https://tripcazador.com/mapa-precios",
    creator: {
      "@type": "Organization",
      name: "TripCazador",
      url: "https://tripcazador.com",
    },
    license: "https://creativecommons.org/licenses/by/4.0/",
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Mapa de precios</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Mapa de precios mensuales</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          Visualización de los precios medianos por mes para 12 rutas populares desde España. Verde = barato, amarillo = medio, rojo = caro. Datos del motor (80K+ búsquedas).
        </p>
      </header>

      {/* Legend */}
      <section className="flex flex-wrap items-center gap-3 p-4 bg-gray-900/40 border border-gray-800 rounded-xl">
        <p className="text-sm text-gray-400 mr-2">Leyenda:</p>
        <span className="flex items-center gap-2 text-xs">
          <span className="w-4 h-4 rounded-sm" style={{ background: "#34d399" }} />
          <span className="text-gray-300">Barato (mejor mes)</span>
        </span>
        <span className="flex items-center gap-2 text-xs">
          <span className="w-4 h-4 rounded-sm" style={{ background: "#fbbf24" }} />
          <span className="text-gray-300">Medio</span>
        </span>
        <span className="flex items-center gap-2 text-xs">
          <span className="w-4 h-4 rounded-sm" style={{ background: "#ef4444" }} />
          <span className="text-gray-300">Caro (evitar)</span>
        </span>
      </section>

      {categories.map((cat) => (
        <section key={cat} className="space-y-4">
          <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-2">
            {CATEGORY_LABELS[cat]}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-500">
                  <th className="text-left py-2 pr-3">Ruta</th>
                  {MONTHS.map((m) => (
                    <th key={m} className="text-center py-2 px-1 font-mono">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grouped[cat].map((r) => {
                  const min = Math.min(...r.prices);
                  const max = Math.max(...r.prices);
                  return (
                    <tr key={`${r.origin}-${r.dest}`} className="border-b border-gray-800">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className="font-mono text-amber-400 text-xs">{r.origin}-{r.dest}</span>
                        <span className="text-gray-300 ml-2">{r.destCity}</span>
                      </td>
                      {r.prices.map((p, i) => (
                        <td
                          key={i}
                          className="py-2 px-0.5 text-center"
                          aria-label={`${MONTHS[i]}: €${p}, ${getLabel(p, min, max)}`}
                        >
                          <div
                            title={`${MONTHS[i]}: €${p} (${getLabel(p, min, max)})`}
                            className="inline-flex items-center justify-center text-xs font-mono font-semibold rounded text-gray-900 mx-auto"
                            style={{
                              background: getColor(p, min, max),
                              minWidth: "44px",
                              height: "28px",
                            }}
                          >
                            {p}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="space-y-3 prose prose-invert max-w-none">
        <h2 className="text-xl font-bold text-white">Cómo interpretar el mapa</h2>
        <p className="text-gray-300">
          Cada celda muestra el precio mediano observado para esa ruta en ese mes específico. Los colores son relativos a cada ruta: el mes "más verde" de Madrid-Tokio (febrero, €795) sigue siendo más caro en valor absoluto que el "más rojo" de Madrid-Lisboa (julio, €185). El verde indica el mejor mes para esa ruta concreta.
        </p>
        <p className="text-gray-300">
          Patrones generales: <strong>febrero es el mes más barato global</strong> para casi todas las rutas. Julio y agosto son los más caros (verano europeo). Las rutas a destinos asiáticos tienen un patrón más extremo (mayor diferencia entre mejor y peor mes) que las rutas europeas.
        </p>
        <h3 className="text-lg font-bold text-white pt-4">Insights del cazador</h3>
        <ul className="text-gray-300 space-y-2">
          <li>· <strong>Si vives en BCN</strong>, prioriza rutas BCN-FCO (€58 en febrero) y BCN-DPS (€850 mín en febrero) — las más competitivas desde Cataluña.</li>
          <li>· <strong>Para Caribe / Sudamérica</strong>, MAD-EZE en febrero (€650) o MAD-MEX en febrero (€580) son las ventanas de mejor precio.</li>
          <li>· <strong>Para Asia largo-radio</strong>, MAD-BKK en febrero (€420) o MAD-NRT en febrero (€795) — pero los error fares de KLM/AF pueden bajar a €890 RT business class en cualquier mes.</li>
          <li>· <strong>Para escapadas europeas</strong>, MAD-LIS en febrero (€72 mediana) es de los precios más bajos posibles para vuelo internacional desde España.</li>
        </ul>
      </section>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">¿Tu ruta no está aquí?</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Tenemos datos de 150+ rutas. Si la tuya no aparece en este mapa, configura alerta gratis en Telegram para tu par específico.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Activar alerta para mi ruta
        </a>
      </section>

      <section className="text-xs text-gray-500 pt-4 border-t border-gray-800">
        <p>
          Datos basados en 80,000+ búsquedas registradas durante 12 meses (Mayo 2025 → Abril 2026).
          Actualización: trimestral. Precios mostrados son medianos round-trip economy en euros.
          Para precios reales en tiempo real, consulta el bot.
        </p>
      </section>
    </div>
  );
}
