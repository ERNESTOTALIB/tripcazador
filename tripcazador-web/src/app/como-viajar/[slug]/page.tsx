import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ArrowLeft, Check, X } from "lucide-react";
import { PARTNERS, getPartner } from "@/lib/travel_partners";
import { JsonLd } from "@/components/JsonLd";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;

export async function generateStaticParams() {
  return PARTNERS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const partner = getPartner(params.slug);
  if (!partner) return {};
  return {
    title: `${partner.name}: cómo usarlo para viajar — TripCazador`,
    description: partner.shortDescription,
    alternates: { canonical: `/como-viajar/${partner.slug}` },
    openGraph: {
      title: `${partner.name} — guía de uso para viajeros`,
      description: partner.longDescription,
      url: `${SITE}/como-viajar/${partner.slug}`,
    },
  };
}

export const revalidate = 86400;

export default function PartnerPage({ params }: { params: { slug: string } }) {
  const p = getPartner(params.slug);
  if (!p) notFound();

  const url = p.affiliateUrl();
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Cómo viajar", item: `${SITE}/como-viajar` },
      { "@type": "ListItem", position: 3, name: p.name, item: `${SITE}/como-viajar/${p.slug}` },
    ],
  };

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Cómo usar ${p.name} en tu viaje`,
    description: p.shortDescription,
    step: p.useCase.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: `Paso ${i + 1}`,
      text: s,
    })),
  };

  const sibling = PARTNERS.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 3);

  return (
    <div className="space-y-8">
      <JsonLd data={[breadcrumb, howTo]} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/como-viajar" className="hover:text-amber-400 inline-flex items-center gap-1">
          <ArrowLeft size={14} />
          Cómo viajar
        </Link>
        <span>/</span>
        <span className="text-gray-300">{p.name}</span>
      </div>

      {/* Hero */}
      <header className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-5xl">{p.emoji}</span>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{p.name}</h1>
            <p className="text-amber-400 text-sm font-semibold uppercase tracking-wider">
              {p.category}
            </p>
          </div>
        </div>
        <p className="text-lg text-gray-300 max-w-3xl">{p.shortDescription}</p>
      </header>

      {/* CTA arriba (sticky en mobile sería ideal) */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="block w-full sm:max-w-md rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-center px-6 py-4 transition-colors"
        data-testid="partner-cta-top"
      >
        <span className="flex items-center justify-center gap-2">
          {p.ctaLabel}
          <ExternalLink size={16} />
        </span>
      </a>

      {/* Long description */}
      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <h2 className="text-xl font-bold text-white mb-3">¿Qué es {p.name}?</h2>
        <p className="text-gray-300 leading-relaxed">{p.longDescription}</p>
      </section>

      {/* Cómo usarlo */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Cómo usarlo paso a paso</h2>
        <ol className="space-y-3">
          {p.useCase.map((step, i) => (
            <li
              key={i}
              className="flex gap-4 p-4 rounded-xl bg-gray-900 border border-gray-800"
            >
              <span className="shrink-0 w-8 h-8 rounded-full bg-amber-500/15 text-amber-400 font-bold inline-flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-gray-300 flex-1">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Tips de pro */}
      <section className="rounded-2xl bg-gradient-to-br from-amber-950/30 to-gray-950 border border-amber-500/20 p-6">
        <h2 className="text-xl font-bold text-white mb-3">Tips de viajero experimentado</h2>
        <ul className="space-y-2">
          {p.tips.map((tip, i) => (
            <li key={i} className="flex gap-3 text-gray-300">
              <span className="text-amber-400 mt-0.5 shrink-0">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pros / Cons */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/20 p-5">
          <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2">
            <Check size={18} />
            Lo bueno
          </h3>
          <ul className="space-y-2">
            {p.pros.map((pro, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2">
                <span className="text-emerald-400 shrink-0">✓</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-red-950/15 border border-red-500/20 p-5">
          <h3 className="text-lg font-bold text-red-300 mb-3 flex items-center gap-2">
            <X size={18} />
            Lo no tan bueno
          </h3>
          <ul className="space-y-2">
            {p.cons.map((con, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2">
                <span className="text-red-400 shrink-0">✗</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA bottom */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="block w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-center px-6 py-4 transition-colors"
        data-testid="partner-cta-bottom"
      >
        <span className="flex items-center justify-center gap-2">
          {p.ctaLabel}
          <ExternalLink size={16} />
        </span>
      </a>
      <p className="text-xs text-gray-500 text-center">
        Enlace de afiliado · Sin coste extra para ti, ayudas a mantener TripCazador
      </p>

      {/* Otras opciones de la misma categoría */}
      {sibling.length > 0 && (
        <section className="border-t border-gray-800 pt-8">
          <h2 className="text-xl font-bold text-white mb-4">Otras opciones similares</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sibling.map((s) => (
              <Link
                key={s.slug}
                href={`/como-viajar/${s.slug}`}
                className="rounded-xl p-4 bg-gray-900 border border-gray-800 hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{s.emoji}</span>
                  <span className="font-bold text-white">{s.name}</span>
                </div>
                <p className="text-xs text-gray-400">{s.shortDescription.slice(0, 80)}…</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
