/**
 * /feed/[group] — fase qqq5
 *
 * Página pública por route_group. Permite descubrir deals filtrados:
 *   /feed/weekend-escape
 *   /feed/business-class-deals
 *   /feed/asia-explorer
 *   ...etc
 *
 * SEO: title + description del group + JSON-LD ItemList.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ROUTE_GROUPS, getGroupBySlug, type RouteGroup } from "@/lib/route_groups";
import { diversifyDeals } from "@/lib/seed_diversifier";
import { rankByQuality } from "@/lib/hunter_quality";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export async function generateStaticParams() {
  return ROUTE_GROUPS.map((g) => ({ group: g.id }));
}

export async function generateMetadata(
  { params }: { params: { group: string } },
): Promise<Metadata> {
  const meta = getGroupBySlug(params.group as RouteGroup);
  if (!meta) return { title: "Feed no encontrado" };
  return {
    title: `${meta.emoji} ${meta.label} — TripCazador`,
    description: meta.description,
    alternates: { canonical: `/feed/${meta.id}` },
    openGraph: {
      title: `${meta.label} | TripCazador`,
      description: meta.description,
      type: "website",
    },
  };
}

export default function FeedGroupPage({ params }: { params: { group: string } }) {
  const meta = getGroupBySlug(params.group as RouteGroup);
  if (!meta) notFound();

  const all = diversifyDeals([]);
  const matched = all.filter(meta.filter);
  const ranked = rankByQuality(matched).slice(0, 24);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: meta.label,
    description: meta.description,
    url: `${SITE}/feed/${meta.id}`,
    itemListElement: ranked.slice(0, 10).map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/deals/${d.id}`,
      name: d.headline,
    })),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={jsonLd} />

      <header className="mb-8">
        <Link href="/feed" className="text-sm text-amber-700 hover:underline">
          ← Todos los feeds
        </Link>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          {meta.emoji} {meta.label}
        </h1>
        <p className="mt-2 text-lg text-neutral-600">{meta.description}</p>
        <p className="mt-1 text-sm text-neutral-500">
          {matched.length} ofertas en este feed · Top {ranked.length} por calidad
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ranked.map((d) => (
          <article
            key={d.id}
            className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-md transition"
          >
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              {d.region} · {d.classification}
            </div>
            <h2 className="mt-1 text-lg font-semibold leading-snug">
              <Link href={`/deals/${d.id}`} className="hover:text-amber-700">
                {d.headline}
              </Link>
            </h2>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-600">{d.price_eur}€</div>
                <div className="text-xs text-neutral-500">
                  {d.savings_pct}% off · {d.cabin}
                </div>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <div>{d.city_from} → {d.city_to}</div>
                <div>{d.nights}n · {d.stops === 0 ? "directo" : `${d.stops} escala`}</div>
              </div>
            </div>
            <Link
              href={`/deals/${d.id}`}
              className="mt-3 inline-block w-full rounded-lg bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-amber-700"
            >
              Ver oferta →
            </Link>
          </article>
        ))}
      </section>

      {ranked.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
          No hay deals en este feed ahora mismo. Vuelve en unas horas — el catálogo
          rota cada 6h.
        </div>
      )}
    </main>
  );
}
