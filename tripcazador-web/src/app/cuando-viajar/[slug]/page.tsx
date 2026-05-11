import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CUANDO_VIAJAR_DESTINOS,
  getCuandoViajarBySlug,
  bestMonths,
  sweetSpotMonth,
} from "@/lib/cuando_viajar";
import { JsonLd } from "@/components/JsonLd";
import { NewsletterSignup } from "@/components/NewsletterSignup";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return CUANDO_VIAJAR_DESTINOS.map((d) => ({ slug: d.slug }));
}

export const dynamicParams = false;
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const d = getCuandoViajarBySlug(params.slug);
  if (!d) return { title: "No encontrado | TripCazador" };
  const sweet = sweetSpotMonth(d);
  return {
    title: `Cuándo viajar a ${d.name} 2026 — Mejor mes (datos honestos) | TripCazador`,
    description: `Calendario mes a mes ${d.name}: precios, clima, crowds. Mejor temporada: ${d.bestSeason} Sweet spot cazador: ${sweet?.name}.`,
    alternates: { canonical: `/cuando-viajar/${d.slug}` },
    openGraph: {
      title: `Cuándo viajar a ${d.name} 2026 — Mejor mes`,
      description: `Calendario mes a mes con precios, clima y veredicto cazador para ${d.name}.`,
      type: "article",
      url: `https://tripcazador.com/cuando-viajar/${d.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Cuándo viajar a ${d.name} 2026`,
      description: `Sweet spot: ${sweet?.name}. Precios mes a mes + veredicto cazador.`,
    },
  };
}

const monthSlugs: Record<number, string> = {
  1: "enero", 2: "febrero", 3: "marzo", 4: "abril",
  5: "mayo", 6: "junio", 7: "julio", 8: "agosto",
  9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre",
};

export default function CuandoViajarPage({ params }: { params: Params }) {
  const d = getCuandoViajarBySlug(params.slug);
  if (!d) notFound();

  const sweet = sweetSpotMonth(d);
  const top3 = bestMonths(d, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Cuándo viajar a ${d.name} 2026 — Calendario mes a mes`,
    description: d.summary,
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
      "@id": `https://tripcazador.com/cuando-viajar/${d.slug}`,
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
        name: "Cuándo viajar",
        item: "https://tripcazador.com/cuando-viajar",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `Cuándo viajar a ${d.name}`,
        item: `https://tripcazador.com/cuando-viajar/${d.slug}`,
      },
    ],
  };

  const priceColor = (p: string) => {
    if (p === "€") return "text-green-400";
    if (p === "€€") return "text-emerald-400";
    if (p === "€€€") return "text-amber-400";
    return "text-rose-400";
  };
  const scoreColor = (s: number) => {
    if (s >= 9) return "text-amber-300 font-bold";
    if (s >= 7) return "text-amber-400";
    if (s >= 5) return "text-gray-300";
    return "text-gray-500";
  };
  const crowdsColor = (c: string) => {
    if (c === "saturado") return "text-rose-400";
    if (c === "lleno") return "text-amber-400";
    if (c === "normal") return "text-gray-300";
    return "text-emerald-400";
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      <nav className="text-xs text-gray-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>{" "}
        ›{" "}
        <Link href="/cuando-viajar" className="hover:text-amber-400">
          Cuándo viajar
        </Link>{" "}
        › {d.name}
      </nav>

      <header>
        <div className="text-xs uppercase tracking-wider text-amber-400/80 font-mono mb-2">
          {d.countryEmoji} {d.category}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          {d.emoji} Cuándo viajar a {d.name} 2026
        </h1>
        <p className="mt-3 text-gray-300 text-lg">{d.summary}</p>
      </header>

      {/* Quick verdict */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="text-[10px] uppercase tracking-wider text-amber-300/80 font-mono mb-1">
            Sweet spot cazador
          </div>
          <div className="text-xl font-bold text-amber-300">
            {sweet?.name}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {sweet?.price} · {sweet?.score}/10
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono mb-1">
            Mejor temporada
          </div>
          <div className="text-sm text-gray-200">{d.bestSeason}</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono mb-1">
            Evitar
          </div>
          <div className="text-sm text-gray-200">{d.worstSeason}</div>
        </div>
      </section>

      {/* Mes a mes table */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">
          Calendario mes a mes
        </h2>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-gray-800">
                <th className="text-left py-2 pr-3">Mes</th>
                <th className="text-center py-2 px-2">Precio</th>
                <th className="text-center py-2 px-2">Temp / lluvia</th>
                <th className="text-center py-2 px-2">Crowds</th>
                <th className="text-center py-2 px-2">Score</th>
                <th className="text-left py-2 pl-3">Nota</th>
              </tr>
            </thead>
            <tbody>
              {d.months.map((m) => (
                <tr
                  key={m.month}
                  className={`border-b border-gray-900 ${m.name === sweet?.name ? "bg-amber-500/5" : ""}`}
                >
                  <td className="py-3 pr-3 text-gray-200 font-medium capitalize">
                    {m.name}
                  </td>
                  <td className={`text-center font-mono ${priceColor(m.price)}`}>
                    {m.price}
                  </td>
                  <td className="text-center text-xs text-gray-300 font-mono whitespace-nowrap">
                    {m.tempC}°C · {m.rainyDays}d
                  </td>
                  <td className={`text-center text-xs ${crowdsColor(m.crowds)}`}>
                    {m.crowds}
                  </td>
                  <td className={`text-center font-mono ${scoreColor(m.score)}`}>
                    {m.score}/10
                  </td>
                  <td className="py-3 pl-3 text-gray-300 text-xs">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top 3 meses + linked /vuelos-baratos */}
      <section>
        <h2 className="text-xl font-bold text-white mb-3">
          Top 3 meses para volar a {d.name}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {top3.map((m, i) => (
            <Link
              key={m.month}
              href={`/vuelos-baratos/${monthSlugs[m.month]}`}
              className="block rounded-xl border border-gray-800 hover:border-amber-500/40 p-4 bg-gray-900/40 hover:bg-gray-900/70 transition-colors"
            >
              <div className="text-[10px] uppercase tracking-wider text-amber-400/80 font-mono mb-1">
                #{i + 1} · {m.price} · {m.score}/10
              </div>
              <div className="text-base font-bold text-white capitalize">
                {m.name}
              </div>
              <p className="text-xs text-gray-400 mt-1.5 line-clamp-3">
                {m.note}
              </p>
              <div className="mt-2 text-[11px] text-amber-300">
                Vuelos {m.name} →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Cross-link a destino + comparar */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href={`/destinos/${d.slug}`}
          className="rounded-xl border border-gray-800 hover:border-amber-500/40 p-4 bg-gray-900/40 hover:bg-gray-900/70 transition-colors text-sm text-gray-200"
        >
          <div className="font-bold text-white mb-1">
            Información completa: {d.name}
          </div>
          <p className="text-xs text-gray-400">
            Itinerarios, presupuesto, visados y planning detallado.
          </p>
        </Link>
        <Link
          href="/comparar-barrios"
          className="rounded-xl border border-gray-800 hover:border-amber-500/40 p-4 bg-gray-900/40 hover:bg-gray-900/70 transition-colors text-sm text-gray-200"
        >
          <div className="font-bold text-white mb-1">
            Dónde dormir: comparar barrios
          </div>
          <p className="text-xs text-gray-400">
            12 ciudades europeas head-to-head para elegir zona.
          </p>
        </Link>
      </section>

      <NewsletterSignup
        variant="compact"
        context={`cuando-viajar-${d.slug}`}
      />

      {/* Related */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3">
          Otros destinos: cuándo viajar
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CUANDO_VIAJAR_DESTINOS.filter((other) => other.slug !== d.slug)
            .slice(0, 6)
            .map((other) => (
              <Link
                key={other.slug}
                href={`/cuando-viajar/${other.slug}`}
                className="text-sm text-gray-300 hover:text-amber-300 py-2 px-3 rounded-lg hover:bg-gray-800/50"
              >
                {other.emoji} Cuándo viajar a {other.name} →
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}
