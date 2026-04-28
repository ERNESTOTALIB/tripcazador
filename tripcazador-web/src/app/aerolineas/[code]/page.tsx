import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AIRLINES, getAirlineByCode } from "@/lib/airlines";
import { JsonLd } from "@/components/JsonLd";
import { NewsletterSignup } from "@/components/NewsletterSignup";

type Params = { code: string };

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  return AIRLINES.map((a) => ({ code: a.code.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const a = getAirlineByCode(params.code);
  if (!a) return { title: "Aerolínea no encontrada" };
  return {
    title: `${a.name} (${a.code}) — Análisis y precios reales 2026`,
    description: `${a.name}: rangos de precio observados, error fares confirmados, hubs y rutas desde España. Análisis basado en datos reales del motor.`,
    alternates: { canonical: `/aerolineas/${a.code.toLowerCase()}` },
    openGraph: {
      type: "website",
      title: `${a.name} desde España — Análisis 2026`,
      description: `Hubs: ${a.hubs.slice(0, 3).join(", ")}. ${a.keyPoints[0]}`,
    },
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  "low-cost": "Low-cost",
  "full-service": "Full-service",
  luxury: "Luxury",
  regional: "Regional",
};

export default function AirlineDetailPage({ params }: { params: Params }) {
  const a = getAirlineByCode(params.code);
  if (!a) notFound();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Airline",
      name: a.name,
      iataCode: a.code,
      icaoCode: a.icao,
      legalName: a.name,
      brand: a.name,
      areaServed: { "@type": "Country", name: a.country },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Aerolíneas",
          item: "https://tripcazador.com/aerolineas",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: a.name,
          item: `https://tripcazador.com/aerolineas/${a.code.toLowerCase()}`,
        },
      ],
    },
  ];

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      <JsonLd data={jsonLd} />
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <a href="/" className="hover:text-white">Inicio</a>
        <span>/</span>
        <a href="/aerolineas" className="hover:text-white">Aerolíneas</a>
        <span>/</span>
        <span className="text-white">{a.name}</span>
      </nav>

      <header className="space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-amber-400 text-sm">{a.code}</span>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[a.category]}
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white">{a.name}</h1>
        <p className="text-gray-400">
          {a.country} · Hubs principales: {a.hubs.join(", ")}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Lo importante</h2>
        <ul className="space-y-2">
          {a.keyPoints.map((p, i) => (
            <li key={i} className="flex gap-3 text-gray-300">
              <span className="text-amber-400 shrink-0">·</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Rutas populares desde España</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="py-2 pr-4">Ruta</th>
                <th className="py-2 pr-4 text-right">Precio típico</th>
                <th className="py-2 text-right">Mínimo observado</th>
              </tr>
            </thead>
            <tbody>
              {a.popularRoutesFromSpain.map((r) => (
                <tr key={r.route} className="border-b border-gray-900">
                  <td className="py-3 pr-4 font-mono text-white">{r.route}</td>
                  <td className="py-3 pr-4 text-right text-gray-300">€{r.typicalPriceEur.toLocaleString("es-ES")}</td>
                  <td className="py-3 text-right text-emerald-400 font-semibold">€{r.minPriceEur.toLocaleString("es-ES")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">
          Precios típicos = mediana observada por nuestro motor en los últimos 12 meses. Mínimo = error fare honored confirmado.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Análisis</h2>
        <div className="text-gray-300 space-y-4 leading-relaxed whitespace-pre-line">
          {a.description}
        </div>
      </section>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20 space-y-3">
        <h2 className="text-lg font-bold text-white">¿Quieres alertas de {a.name}?</h2>
        <p className="text-sm text-gray-400">
          Configuramos alertas específicas por aerolínea en el bot Telegram. Cuando aparezca un error fare de {a.name}, te llega notificación en segundos.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Activar alertas Telegram
        </a>
      </section>

      <NewsletterSignup variant="compact" context={`aerolinea-${a.code}`} />

      <div className="border-t border-gray-800 pt-6 flex justify-between text-sm">
        <a href="/aerolineas" className="text-amber-400 hover:text-amber-300">
          ← Todas las aerolíneas
        </a>
        <a href="/destinos" className="text-amber-400 hover:text-amber-300">
          Explorar destinos →
        </a>
      </div>
    </article>
  );
}
