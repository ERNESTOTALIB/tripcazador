/**
 * /en/comparar/[slug] — UUU03 (May 2026)
 *
 * EN-language comparator pages. Uses the same `getComparisonBySlug()`
 * data source from comparisons.ts (DestinationComparison shape with
 * a/b sides, criteria scores, pickA/pickB lists). Translates labels
 * inline to English.
 *
 * Hreflang: each EN page links back to /comparar/{slug-es} as alternate.
 * Curated to top 12 ES↔EN slugs with proven Anglophone search volume.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPARISONS, getComparisonBySlug } from "@/lib/comparisons";
import { JsonLd } from "@/components/JsonLd";

type Params = { slug: string };

const SITE_URL = "https://tripcazador.com";

const EN_COMPARISON_SLUGS = new Set([
  "madrid-vs-lisboa-fin-de-semana",
  "praga-vs-budapest",
  "marrakech-vs-estambul",
  "nueva-york-vs-los-angeles",
  "tokio-vs-seul",
  "reikiavik-vs-helsinki",
  "cancun-vs-punta-cana",
  "praga-vs-berlin",
  "madrid-vs-roma",
  "bali-vs-maldivas",
  "berlin-vs-madrid",
  "buenos-aires-vs-mexico",
]);

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return COMPARISONS
    .filter((c) => EN_COMPARISON_SLUGS.has(c.slug))
    .map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const c = getComparisonBySlug(params.slug);
  if (!c || !EN_COMPARISON_SLUGS.has(c.slug)) {
    return { title: "Comparison not found" };
  }
  const title = `${c.a.name} vs ${c.b.name}: which to pick`;
  const description = `Side-by-side comparison: ${c.a.name} vs ${c.b.name}. Pricing, best months, flight time, when to choose each.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/en/comparar/${c.slug}`,
      languages: {
        en: `${SITE_URL}/en/comparar/${c.slug}`,
        "es": `${SITE_URL}/comparar/${c.slug}`,
        "x-default": `${SITE_URL}/comparar/${c.slug}`,
      },
    },
    openGraph: {
      type: "article",
      title,
      description,
      locale: "en_US",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TripCazador — chollos de vuelo desde Europa" }],
  },
  };
}

function winnerColor(w: "a" | "b" | "tie"): string {
  if (w === "a") return "text-blue-400";
  if (w === "b") return "text-emerald-400";
  return "text-gray-400";
}

function winnerLabel(w: "a" | "b" | "tie", aName: string, bName: string): string {
  if (w === "a") return aName;
  if (w === "b") return bName;
  return "Tied";
}

export default function EnComparisonPage({ params }: { params: Params }) {
  const c = getComparisonBySlug(params.slug);
  if (!c || !EN_COMPARISON_SLUGS.has(c.slug)) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Comparisons",
        item: `${SITE_URL}/en`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${c.a.name} vs ${c.b.name}`,
        item: `${SITE_URL}/en/comparar/${c.slug}`,
      },
    ],
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <JsonLd data={breadcrumbJsonLd} />

      <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-4">
        <Link href="/en" className="hover:text-amber-300">
          Home
        </Link>
        {" / "}
        <span className="text-gray-300">
          {c.a.name} vs {c.b.name}
        </span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 text-balance">
          {c.a.emoji} {c.a.name} vs {c.b.name} {c.b.emoji}
        </h1>
        <p className="text-gray-300">
          Head-to-head comparison from real-world data. Tested by our hunter engine
          across the last 90 days of European-origin flights.
        </p>
      </header>

      {/* Side cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          { side: "a" as const, data: c.a, color: "blue" },
          { side: "b" as const, data: c.b, color: "emerald" },
        ].map(({ data, color }) => (
          <div
            key={data.name}
            className={`rounded-xl border bg-gray-900/40 p-5 ${
              color === "blue"
                ? "border-blue-500/30"
                : "border-emerald-500/30"
            }`}
          >
            <div className="text-3xl mb-2">{data.emoji}</div>
            <h2
              className={`text-xl font-bold mb-2 ${
                color === "blue" ? "text-blue-300" : "text-emerald-300"
              }`}
            >
              {data.name}
            </h2>
            <p className="text-sm text-gray-400 mb-3">{data.tagline}</p>
            <dl className="space-y-1 text-sm">
              <div>
                <dt className="inline text-gray-500">Country: </dt>
                <dd className="inline text-gray-200">{data.country}</dd>
              </div>
              <div>
                <dt className="inline text-gray-500">Typical price (from MAD): </dt>
                <dd className="inline text-gray-200">€{data.typicalPriceFromMad}</dd>
              </div>
              <div>
                <dt className="inline text-gray-500">Cheapest seen: </dt>
                <dd className="inline text-amber-300 font-semibold">€{data.minObserved}</dd>
              </div>
              <div>
                <dt className="inline text-gray-500">Flight time: </dt>
                <dd className="inline text-gray-200">{data.flightTime}</dd>
              </div>
            </dl>
          </div>
        ))}
      </section>

      {/* Criteria scoring */}
      <section className="mb-10 overflow-x-auto">
        <h2 className="text-lg font-bold text-white mb-3">By criterion (1-10)</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 text-gray-400 font-medium">Criterion</th>
              <th className="text-center py-2 text-blue-400 font-semibold">{c.a.name}</th>
              <th className="text-center py-2 text-emerald-400 font-semibold">{c.b.name}</th>
              <th className="text-center py-2 text-amber-300 font-medium">Winner</th>
            </tr>
          </thead>
          <tbody>
            {c.criteria.map((row, i) => (
              <tr key={i} className="border-b border-gray-800/60">
                <td className="py-3 text-gray-300">{row.label}</td>
                <td className="py-3 text-center text-gray-200">{row.aScore}</td>
                <td className="py-3 text-center text-gray-200">{row.bScore}</td>
                <td className={`py-3 text-center font-semibold ${winnerColor(row.winner)}`}>
                  {winnerLabel(row.winner, c.a.name, c.b.name)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* When to pick A vs B */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="rounded-xl border border-blue-500/30 bg-blue-900/10 p-5">
          <h3 className="text-blue-300 font-semibold mb-3">Pick {c.a.name} when:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
            {c.pickA.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-900/10 p-5">
          <h3 className="text-emerald-300 font-semibold mb-3">Pick {c.b.name} when:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
            {c.pickB.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Verdict */}
      <section className="mb-10 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="text-lg font-bold text-amber-300 mb-2">Bottom line</h2>
        <p className="text-gray-200 leading-relaxed">{c.verdict}</p>
      </section>

      {/* Other comparisons */}
      <section>
        <h2 className="text-lg font-semibold text-gray-300 mb-3">Other comparisons (EN)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {COMPARISONS
            .filter((x) => EN_COMPARISON_SLUGS.has(x.slug) && x.slug !== c.slug)
            .slice(0, 8)
            .map((x) => (
              <Link
                key={x.slug}
                href={`/en/comparar/${x.slug}`}
                className="text-amber-300 hover:underline"
              >
                {x.a.emoji} {x.a.name} vs {x.b.name} {x.b.emoji} →
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}
