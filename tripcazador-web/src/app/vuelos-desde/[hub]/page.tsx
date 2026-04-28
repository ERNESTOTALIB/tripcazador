import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HUBS, getHubByCode } from "@/lib/hubs";
import { getAirlineByCode } from "@/lib/airlines";
import { JsonLd } from "@/components/JsonLd";
import { NewsletterSignup } from "@/components/NewsletterSignup";

type Params = { hub: string };

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  return HUBS.map((h) => ({ hub: h.code.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const h = getHubByCode(params.hub);
  if (!h) return { title: "Aeropuerto no encontrado" };
  return {
    title: `Vuelos baratos desde ${h.city} (${h.code}) — Análisis 2026`,
    description: `Vuelos desde ${h.city}: top destinos, aerolíneas operativas, rangos de precio reales y consejos prácticos para sacar el máximo al hub ${h.code}.`,
    alternates: { canonical: `/vuelos-desde/${h.code.toLowerCase()}` },
    openGraph: {
      type: "website",
      title: `${h.city} (${h.code}) — Vuelos baratos desde España`,
      description: `Análisis del aeropuerto ${h.code} con datos reales del motor.`,
    },
  };
}

export default function HubDetailPage({ params }: { params: Params }) {
  const h = getHubByCode(params.hub);
  if (!h) notFound();
  const airlineNames = h.primaryAirlines
    .map((c) => getAirlineByCode(c)?.name || c)
    .slice(0, 8);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Airport",
      name: h.name,
      iataCode: h.code,
      address: {
        "@type": "PostalAddress",
        addressLocality: h.city,
        addressRegion: h.region,
        addressCountry: "ES",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Vuelos desde España",
          item: "https://tripcazador.com/vuelos-desde",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: h.city,
          item: `https://tripcazador.com/vuelos-desde/${h.code.toLowerCase()}`,
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
        <a href="/vuelos-desde" className="hover:text-white">Vuelos desde España</a>
        <span>/</span>
        <span className="text-white">{h.city}</span>
      </nav>

      <header className="space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-amber-400 text-sm">{h.code}</span>
        </div>
        <h1 className="text-4xl font-bold text-white">Vuelos desde {h.city}</h1>
        <p className="text-gray-400 text-lg">
          {h.name} · {h.region} · {h.distanceKm} km al centro
        </p>
      </header>

      <section className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 space-y-2">
        <h2 className="text-xs uppercase tracking-wider text-gray-500">Acceso al centro</h2>
        <p className="text-gray-300">{h.cityAccess}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Aerolíneas con presencia en {h.code}</h2>
        <div className="flex flex-wrap gap-2">
          {h.primaryAirlines.map((code) => {
            const a = getAirlineByCode(code);
            return a ? (
              <a
                key={code}
                href={`/aerolineas/${code.toLowerCase()}`}
                className="text-sm bg-gray-800 hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 px-3 py-1.5 rounded-full border border-gray-800 hover:border-amber-500/30 transition-colors"
              >
                <span className="font-mono text-xs">{code}</span> {a.name}
              </a>
            ) : (
              <span key={code} className="text-sm bg-gray-800 text-gray-300 px-3 py-1.5 rounded-full">
                {code}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-gray-500">
          {airlineNames.slice(0, 3).join(", ")}
          {airlineNames.length > 3 && ` y ${airlineNames.length - 3} más`} concentran el mayor volumen desde este hub.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Top destinos europeos desde {h.code}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="py-2 pr-4">Destino</th>
                <th className="py-2 pr-4 text-right">Precio típico</th>
                <th className="py-2 text-right">Mínimo observado</th>
              </tr>
            </thead>
            <tbody>
              {h.topEuropeDestinations.map((d) => (
                <tr key={d.iata} className="border-b border-gray-900">
                  <td className="py-3 pr-4">
                    <span className="font-mono text-amber-300 text-xs mr-2">{d.iata}</span>
                    <span className="text-white">{d.city}</span>
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-300">€{d.typicalPriceEur.toLocaleString("es-ES")}</td>
                  <td className="py-3 text-right text-emerald-400 font-semibold">€{d.minObservedEur.toLocaleString("es-ES")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {h.topLongHaulDestinations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">Top destinos long-haul desde {h.code}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                  <th className="py-2 pr-4">Destino</th>
                  <th className="py-2 pr-4 text-right">Precio típico</th>
                  <th className="py-2 text-right">Mínimo observado</th>
                </tr>
              </thead>
              <tbody>
                {h.topLongHaulDestinations.map((d) => (
                  <tr key={d.iata} className="border-b border-gray-900">
                    <td className="py-3 pr-4">
                      <span className="font-mono text-amber-300 text-xs mr-2">{d.iata}</span>
                      <span className="text-white">{d.city}</span>
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-300">€{d.typicalPriceEur.toLocaleString("es-ES")}</td>
                    <td className="py-3 text-right text-emerald-400 font-semibold">€{d.minObservedEur.toLocaleString("es-ES")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Análisis del hub</h2>
        <p className="text-gray-300 leading-relaxed whitespace-pre-line">{h.description}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Tips locales</h2>
        <ul className="space-y-2">
          {h.tips.map((t, i) => (
            <li key={i} className="flex gap-3 text-gray-300">
              <span className="text-amber-400 shrink-0">·</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <NewsletterSignup variant="compact" context={`hub-${h.code}`} />

      <div className="border-t border-gray-800 pt-6 flex justify-between text-sm">
        <a href="/vuelos-desde" className="text-amber-400 hover:text-amber-300">
          ← Todos los hubs
        </a>
        <a href="/aerolineas" className="text-amber-400 hover:text-amber-300">
          Análisis de aerolíneas →
        </a>
      </div>
    </article>
  );
}
