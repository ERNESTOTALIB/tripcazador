import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SectionHero } from "@/components/SectionHero";

export const metadata: Metadata = {
  title: "Destinos en tendencia — TripCazador",
  description:
    "Los destinos más buscados por viajeros españoles esta semana. Crecimiento, precio medio y mejor origen para cada uno. Datos actualizados cada 30 minutos.",
  alternates: { canonical: "/tendencias" },
  openGraph: {
    type: "website",
    title: "Top destinos en tendencia — TripCazador",
    description: "Lo que buscan los viajeros esta semana, con precios y crecimiento",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TripCazador — chollos de vuelo desde Europa" }],
  },
};

export const revalidate = 1800;
export const dynamic = "force-static";

type TrendRow = {
  rank: number;
  destination: string;
  country: string;
  emoji: string;
  searches_7d: number;
  growth_pct: number;
  sparkline: number[];
  avg_price: number;
  best_origin: string;
};

async function getTrends(): Promise<TrendRow[]> {
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com"}/api/trends`,
      { next: { revalidate: 1800 } },
    );
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data?.rows) ? data.rows : [];
  } catch {
    return [];
  }
}

function Sparkline({ data, growth }: { data: number[]; growth: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color = growth > 5 ? "#10b981" : growth < -5 ? "#ef4444" : "#fbbf24";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function TendenciasPage() {
  const rows = await getTrends();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Destinos en tendencia TripCazador",
      description: "Top destinos buscados por viajeros españoles, agregados semanal.",
      keywords: ["tendencias", "destinos", "viajes", "TripCazador"],
      license: "https://creativecommons.org/licenses/by/4.0/",
      creator: { "@type": "Organization", name: "TripCazador" },
      url: "https://tripcazador.com/tendencias",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com" },
        { "@type": "ListItem", position: 2, name: "Tendencias", item: "https://tripcazador.com/tendencias" },
      ],
    },
  ];

  return (
    <>
      <SectionHero
        title="Destinos en tendencia"
        subtitle="Lo que más buscan los viajeros esta semana. Datos agregados de búsquedas, actualizados cada 30 min."
        badge="Semana actual"
        size="compact"
      />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-amber-400 border-b border-slate-700">
              <tr>
                <th className="text-left py-3 pl-2">#</th>
                <th className="text-left py-3">Destino</th>
                <th className="text-right py-3 hidden sm:table-cell">Búsquedas 7d</th>
                <th className="text-right py-3">Tendencia</th>
                <th className="text-right py-3 hidden md:table-cell">Precio medio</th>
                <th className="text-right py-3 pr-2">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((r) => (
                <tr key={r.destination} className="hover:bg-slate-800/40">
                  <td className="py-3 pl-2 text-gray-400 font-mono">#{r.rank}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" aria-hidden="true">{r.emoji}</span>
                      <div>
                        <div className="font-bold text-white">{r.destination}</div>
                        <div className="text-xs text-gray-400">{r.country}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right hidden sm:table-cell tabular-nums text-gray-300">
                    {r.searches_7d.toLocaleString("es-ES")}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Sparkline data={r.sparkline} growth={r.growth_pct} />
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          r.growth_pct > 5
                            ? "text-emerald-400"
                            : r.growth_pct < -5
                              ? "text-red-400"
                              : "text-amber-400"
                        }`}
                      >
                        {r.growth_pct > 0 ? "+" : ""}
                        {r.growth_pct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right hidden md:table-cell tabular-nums text-amber-400 font-bold">
                    {r.avg_price}€
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <Link
                      href={`/destinos/${r.destination.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-amber-400 hover:underline text-sm"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="mt-8 grid sm:grid-cols-3 gap-4">
          <div className="panel">
            <div className="text-2xl mb-2">📈</div>
            <h3 className="font-bold text-white">¿Cómo lo medimos?</h3>
            <p className="text-sm text-gray-300 mt-1">
              Agregamos búsquedas anonimizadas en TripCazador últimos 7 días. Sin tracking individual.
            </p>
          </div>
          <div className="panel">
            <div className="text-2xl mb-2">🔄</div>
            <h3 className="font-bold text-white">Actualización</h3>
            <p className="text-sm text-gray-300 mt-1">Cada 30 minutos. Caché CDN agresivo.</p>
          </div>
          <div className="panel">
            <div className="text-2xl mb-2">📰</div>
            <h3 className="font-bold text-white">Para periodistas</h3>
            <p className="text-sm text-gray-300 mt-1">
              Datos abiertos CC-BY. <Link href="/prensa" className="text-amber-400 underline">Press kit</Link>
            </p>
          </div>
        </section>
      </main>
      <JsonLd data={jsonLd} />
    </>
  );
}
