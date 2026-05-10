import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  AIRLINE_COMPARISONS,
  getAirlineComparisonBySlug,
} from "@/lib/airline_comparisons";
import { JsonLd } from "@/components/JsonLd";
import { NewsletterSignup } from "@/components/NewsletterSignup";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return AIRLINE_COMPARISONS.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;
export const revalidate = 86400; // 24h

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const c = getAirlineComparisonBySlug(params.slug);
  if (!c) return { title: "Comparativa no encontrada | TripCazador" };
  // JJJJ02 + KKKK01: OG image dinámico por comparativa con score X-Y wins.
  // Path /api/og-comparison/[slug] (no /api/og/airline/[slug]) para evitar
  // conflict con rewrite Next/Vercel dynamic segments en nested paths.
  const ogImage = `https://tripcazador.com/api/og-comparison/${c.slug}`;
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/comparar-aerolineas/${c.slug}` },
    openGraph: {
      title: c.title,
      description: c.description,
      type: "article",
      url: `https://tripcazador.com/comparar-aerolineas/${c.slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${c.a.name} vs ${c.b.name} — comparativa head-to-head`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: c.title,
      description: c.description,
      images: [ogImage],
    },
  };
}

export default function AirlineComparisonPage({ params }: { params: Params }) {
  const c = getAirlineComparisonBySlug(params.slug);
  if (!c) notFound();

  const aWins = c.criteria.filter((cr) => cr.winner === "a").length;
  const bWins = c.criteria.filter((cr) => cr.winner === "b").length;
  const ties = c.criteria.filter((cr) => cr.winner === "tie").length;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    description: c.description,
    author: { "@type": "Organization", name: "TripCazador" },
    publisher: {
      "@type": "Organization",
      name: "TripCazador",
      logo: {
        "@type": "ImageObject",
        url: "https://tripcazador.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://tripcazador.com/comparar-aerolineas/${c.slug}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://tripcazador.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Comparar aerolíneas",
        item: "https://tripcazador.com/comparar-aerolineas",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${c.a.name} vs ${c.b.name}`,
        item: `https://tripcazador.com/comparar-aerolineas/${c.slug}`,
      },
    ],
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      <nav className="text-xs text-gray-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-amber-400">
          Inicio
        </Link>{" "}
        ›{" "}
        <Link href="/aerolineas" className="hover:text-amber-400">
          Aerolíneas
        </Link>{" "}
        › {c.a.name} vs {c.b.name}
      </nav>

      <header>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          {c.a.emoji} {c.a.name} vs {c.b.name} {c.b.emoji}
        </h1>
        <p className="mt-3 text-gray-300 text-lg">{c.description}</p>
        <div className="mt-2 text-xs text-gray-500">
          Contexto:{" "}
          <span className="font-mono text-gray-400">{c.routeContext}</span>
        </div>
      </header>

      {/* Side-by-side cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[c.a, c.b].map((side, i) => (
          <Link
            key={side.code}
            href={`/aerolineas/${side.code.toLowerCase()}`}
            className="block rounded-xl border border-gray-800 hover:border-amber-500/40 p-5 bg-gray-900/40 hover:bg-gray-900/60 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl" aria-hidden="true">
                {side.emoji}
              </span>
              <div>
                <div className="text-lg font-bold text-white">{side.name}</div>
                <div className="text-xs text-gray-400">
                  {side.country} · {side.category} · {side.skytraxStars}★
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-4">{side.tagline}</p>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <dt className="text-gray-500">Hub principal</dt>
              <dd className="text-gray-200 font-mono">{side.mainHub}</dd>
              <dt className="text-gray-500">Precio típico</dt>
              <dd className="text-gray-200">€{side.typicalPriceEur}</dd>
              <dt className="text-gray-500">Mín. error fare</dt>
              <dd className="text-amber-300 font-bold">€{side.minErrorFareEur}</dd>
              <dt className="text-gray-500">Programa</dt>
              <dd className="text-gray-300">{side.loyaltyProgram}</dd>
            </dl>
            <div className="mt-3 text-[11px] text-amber-400/80">
              Ver perfil completo {i === 0 ? c.a.name : c.b.name} →
            </div>
          </Link>
        ))}
      </section>

      {/* Criterios head-to-head */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">
          Comparativa por criterios
        </h2>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-gray-800">
                <th className="text-left py-2 pr-3">Criterio</th>
                <th className="text-center py-2 px-2">{c.a.name}</th>
                <th className="text-center py-2 px-2">{c.b.name}</th>
                <th className="text-left py-2 pl-3">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {c.criteria.map((cr) => (
                <tr key={cr.label} className="border-b border-gray-900">
                  <td className="py-3 pr-3 text-gray-200 font-medium">
                    {cr.label}
                  </td>
                  <td
                    className={`text-center font-mono ${cr.winner === "a" ? "text-amber-400 font-bold" : "text-gray-400"}`}
                  >
                    {cr.aScore}/10
                  </td>
                  <td
                    className={`text-center font-mono ${cr.winner === "b" ? "text-amber-400 font-bold" : "text-gray-400"}`}
                  >
                    {cr.bScore}/10
                  </td>
                  <td className="py-3 pl-3 text-gray-300 text-xs">{cr.note}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-xs text-gray-500">
                <td className="pt-3"></td>
                <td className="pt-3 text-center font-mono">
                  {aWins} {aWins === 1 ? "victoria" : "victorias"}
                </td>
                <td className="pt-3 text-center font-mono">
                  {bWins} {bWins === 1 ? "victoria" : "victorias"}
                </td>
                <td className="pt-3 pl-3">{ties} empates</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Verdict */}
      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="text-lg font-bold text-amber-300 mb-2">
          Veredicto del cazador
        </h2>
        <p className="text-gray-200 leading-relaxed">{c.verdict}</p>
      </section>

      {/* Pick A / Pick B */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <h3 className="text-base font-bold text-white mb-3">
            Elige {c.a.emoji} {c.a.name} si...
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            {c.pickA.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-400 flex-shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <h3 className="text-base font-bold text-white mb-3">
            Elige {c.b.emoji} {c.b.name} si...
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            {c.pickB.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-400 flex-shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterSignup
        variant="compact"
        context={`comparar-aerolineas-${c.slug}`}
      />

      {/* Other comparisons */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3">
          Otras comparativas de aerolíneas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AIRLINE_COMPARISONS.filter((other) => other.slug !== c.slug)
            .slice(0, 6)
            .map((other) => (
              <Link
                key={other.slug}
                href={`/comparar-aerolineas/${other.slug}`}
                className="text-sm text-gray-300 hover:text-amber-300 py-2 px-3 rounded-lg hover:bg-gray-800/50"
              >
                {other.a.emoji} {other.a.name} vs {other.b.name} {other.b.emoji}{" "}
                →
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}
