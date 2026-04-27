import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MONTHS, getMonthBySlug } from "@/lib/months";
import { JsonLd } from "@/components/JsonLd";

type Params = { mes: string };

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  return MONTHS.map((m) => ({ mes: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const m = getMonthBySlug(params.mes);
  if (!m) return { title: "Mes no encontrado" };
  return {
    title: `Vuelos baratos en ${m.monthEs} 2026: destinos top + trucos`,
    description: `Mejor mes para volar a tus destinos favoritos en ${m.monthEs} 2026. Precios típicos, destinos top, qué evitar. ${m.description}`,
    alternates: { canonical: `/vuelos-baratos-${m.slug}` },
    openGraph: {
      type: "website",
      title: `${m.emoji} Vuelos baratos en ${m.monthEs} — TripCazador`,
      description: m.description,
    },
  };
}

export default function MonthDetailPage({ params }: { params: Params }) {
  const m = getMonthBySlug(params.mes);
  if (!m) notFound();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `Vuelos baratos en ${m.monthEs} 2026`,
      description: m.description,
      datePublished: "2026-04-27",
      author: { "@type": "Organization", name: "TripCazador" },
      publisher: { "@type": "Organization", name: "TripCazador", url: "https://tripcazador.com" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Vuelos por mes",
          item: "https://tripcazador.com/vuelos-baratos-mes",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: m.monthEs,
          item: `https://tripcazador.com/vuelos-baratos-${m.slug}`,
        },
      ],
    },
  ];

  return (
    <article className="space-y-10 max-w-3xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <a href="/vuelos-baratos-mes" className="hover:text-white">Vuelos por mes</a>
          <span>/</span>
          <span className="text-white">{m.monthEs}</span>
        </nav>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl">{m.emoji}</span>
          <h1 className="text-4xl font-bold text-white">Vuelos baratos en {m.monthEs} 2026</h1>
        </div>
        <p className="text-gray-400 text-lg">{m.description}</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Destinos top en {m.monthEs}</h2>
        <ul className="space-y-3">
          {m.topDestinations.map((d) => (
            <li
              key={d.iata}
              className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="space-y-1">
                <p className="text-white font-semibold">{d.name}</p>
                <p className="text-xs text-gray-500 font-mono">{d.iata}</p>
                <p className="text-sm text-gray-400">{d.reason}</p>
              </div>
              <p className="text-amber-400 font-mono font-bold whitespace-nowrap">
                desde €{d.price}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {m.avoid.length > 0 && (
        <section className="bg-red-500/5 border border-red-500/30 rounded-xl p-5 space-y-2">
          <h2 className="text-lg font-bold text-red-300">⚠️ A evitar en {m.monthEs}</h2>
          <ul className="space-y-1">
            {m.avoid.map((a, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2">
                <span className="text-red-400 shrink-0">·</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Tips para viajar en {m.monthEs}</h2>
        <ul className="space-y-2">
          {m.tips.map((t, i) => (
            <li key={i} className="flex gap-2 text-gray-300">
              <span className="text-amber-400 shrink-0">·</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Mes anterior y siguiente */}
        {(() => {
          const prev = MONTHS.find((x) => x.number === (m.number === 1 ? 12 : m.number - 1));
          const next = MONTHS.find((x) => x.number === (m.number === 12 ? 1 : m.number + 1));
          return (
            <>
              {prev && (
                <a
                  href={`/vuelos-baratos-${prev.slug}`}
                  className="bg-gray-900/40 border border-gray-800 hover:border-amber-500/40 rounded-xl p-4 transition-colors"
                >
                  <p className="text-xs text-gray-500">← Mes anterior</p>
                  <p className="text-white font-semibold mt-1">
                    {prev.emoji} {prev.monthEs}
                  </p>
                </a>
              )}
              {next && (
                <a
                  href={`/vuelos-baratos-${next.slug}`}
                  className="bg-gray-900/40 border border-gray-800 hover:border-amber-500/40 rounded-xl p-4 transition-colors text-right"
                >
                  <p className="text-xs text-gray-500">Mes siguiente →</p>
                  <p className="text-white font-semibold mt-1">
                    {next.emoji} {next.monthEs}
                  </p>
                </a>
              )}
            </>
          );
        })()}
      </section>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">Activar alertas para {m.monthEs}</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Configura alertas para tus destinos preferidos en {m.monthEs}. El motor avisa cuando aparece un error fare.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Activar bot Telegram
        </a>
      </section>
    </article>
  );
}
