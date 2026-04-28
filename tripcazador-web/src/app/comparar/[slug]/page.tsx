import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COMPARISONS, getComparisonBySlug } from "@/lib/comparisons";
import { JsonLd } from "@/components/JsonLd";
import { NewsletterSignup } from "@/components/NewsletterSignup";

type Params = { slug: string };

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const c = getComparisonBySlug(params.slug);
  if (!c) return { title: "Comparativa no encontrada" };
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/comparar/${c.slug}` },
    openGraph: {
      type: "article",
      title: c.title,
      description: c.description,
    },
  };
}

function winnerColor(w: "a" | "b" | "tie"): string {
  if (w === "a") return "text-blue-400";
  if (w === "b") return "text-emerald-400";
  return "text-gray-400";
}

export default function ComparisonPage({ params }: { params: Params }) {
  const c = getComparisonBySlug(params.slug);
  if (!c) notFound();

  // Pre-compute totals
  const aTotal = c.criteria.reduce((acc, x) => acc + x.aScore, 0);
  const bTotal = c.criteria.reduce((acc, x) => acc + x.bScore, 0);
  const winner = aTotal > bTotal ? "a" : bTotal > aTotal ? "b" : "tie";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: c.title,
      description: c.description,
      author: { "@type": "Organization", name: "TripCazador team" },
      publisher: {
        "@type": "Organization",
        name: "TripCazador",
        url: "https://tripcazador.com",
      },
      datePublished: "2026-04-27",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://tripcazador.com/comparar/${c.slug}`,
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
          name: "Comparativas",
          item: "https://tripcazador.com/comparar",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: c.title,
          item: `https://tripcazador.com/comparar/${c.slug}`,
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
        <a href="/comparar" className="hover:text-white">Comparativas</a>
        <span>/</span>
        <span className="text-white truncate">{c.title}</span>
      </nav>

      <header className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
          {c.title}
        </h1>
        <p className="text-gray-400 text-lg">{c.description}</p>
      </header>

      {/* Cards lado A vs lado B */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-500/5 border border-blue-500/30 rounded-2xl p-5 space-y-2">
          <div className="text-4xl">{c.a.emoji}</div>
          <h2 className="text-2xl font-bold text-white">{c.a.name}</h2>
          <p className="text-xs text-gray-500 font-mono">{c.a.iata} · {c.a.country}</p>
          <p className="text-sm text-gray-300">{c.a.tagline}</p>
          {c.a.typicalPriceFromMad > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Desde MAD: típico €{c.a.typicalPriceFromMad} · mín €{c.a.minObserved}
            </p>
          )}
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-5 space-y-2">
          <div className="text-4xl">{c.b.emoji}</div>
          <h2 className="text-2xl font-bold text-white">{c.b.name}</h2>
          <p className="text-xs text-gray-500 font-mono">{c.b.iata} · {c.b.country}</p>
          <p className="text-sm text-gray-300">{c.b.tagline}</p>
          {c.b.typicalPriceFromMad > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Desde MAD: típico €{c.b.typicalPriceFromMad} · mín €{c.b.minObserved}
            </p>
          )}
        </div>
      </section>

      {/* Tabla criterios */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Comparativa por criterios</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="py-2 pr-4">Criterio</th>
                <th className="py-2 px-3 text-center">{c.a.emoji} {c.a.name}</th>
                <th className="py-2 px-3 text-center">{c.b.emoji} {c.b.name}</th>
                <th className="py-2 pl-3 text-center">Gana</th>
              </tr>
            </thead>
            <tbody>
              {c.criteria.map((cr, i) => (
                <tr key={i} className="border-b border-gray-900">
                  <td className="py-3 pr-4">
                    <span className="text-gray-300">{cr.label}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{cr.note}</p>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-mono font-semibold text-blue-400">{cr.aScore}/10</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-mono font-semibold text-emerald-400">{cr.bScore}/10</span>
                  </td>
                  <td className={`py-3 pl-3 text-center font-semibold ${winnerColor(cr.winner)}`}>
                    {cr.winner === "a" ? c.a.emoji : cr.winner === "b" ? c.b.emoji : "="}
                  </td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-900/50">
                <td className="py-3 pr-4 text-white">TOTAL</td>
                <td className="py-3 px-3 text-center text-blue-400 font-mono">{aTotal}</td>
                <td className="py-3 px-3 text-center text-emerald-400 font-mono">{bTotal}</td>
                <td className={`py-3 pl-3 text-center ${winnerColor(winner)}`}>
                  {winner === "a" ? c.a.emoji : winner === "b" ? c.b.emoji : "Empate"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Veredicto */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Veredicto</h2>
        <p className="text-gray-300 leading-relaxed">{c.verdict}</p>
      </section>

      {/* Pick A / Pick B */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-500/5 border border-blue-500/30 rounded-2xl p-5 space-y-3">
          <h3 className="text-lg font-bold text-white">Elige {c.a.name} si…</h3>
          <ul className="space-y-2">
            {c.pickA.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="text-blue-400 shrink-0">·</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
          <h3 className="text-lg font-bold text-white">Elige {c.b.name} si…</h3>
          <ul className="space-y-2">
            {c.pickB.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="text-emerald-400 shrink-0">·</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <NewsletterSignup variant="compact" context={`comparar-${c.slug}`} />

      <div className="border-t border-gray-800 pt-6 flex justify-between text-sm">
        <a href="/comparar" className="text-amber-400 hover:text-amber-300">
          ← Otras comparativas
        </a>
        <a href="/destinos" className="text-amber-400 hover:text-amber-300">
          Explorar destinos →
        </a>
      </div>
    </article>
  );
}
