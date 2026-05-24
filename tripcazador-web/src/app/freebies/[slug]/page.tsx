/**
 * /freebies/[slug] — SSS429 (23 may 2026)
 *
 * Landing por lead magnet con email capture form.
 *
 * Server component renderiza el contenido + Schema.org JSON-LD. El
 * formulario es client (FreebieCaptureForm).
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  FREEBIES_SLUGS,
  getFreebie,
} from "@/lib/freebies_catalog";
import { FreebieCaptureForm } from "@/components/FreebieCaptureForm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ slug: string }> {
  return FREEBIES_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const f = getFreebie(params.slug);
  if (!f) return { title: "Guía no encontrada" };
  const title = `${f.title} (gratis)`;
  return {
    title,
    description: f.subtitle,
    alternates: { canonical: `${SITE_URL}/freebies/${f.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description: f.subtitle,
      url: `${SITE_URL}/freebies/${f.slug}`,
      type: "article",
    },
  };
}

export default function FreebiePage({ params }: { params: { slug: string } }) {
  const f = getFreebie(params.slug);
  if (!f) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Freebies", item: `${SITE_URL}/freebies` },
      { "@type": "ListItem", position: 3, name: f.title, item: `${SITE_URL}/freebies/${f.slug}` },
    ],
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/freebies" className="hover:text-amber-400">Guías gratis</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{f.title}</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">{f.emoji}</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          {f.title}
        </h1>
        <p className="mt-3 text-slate-300">{f.subtitle}</p>
        {f.pages !== undefined && (
          <p className="mt-2 text-xs text-slate-500">
            PDF · {f.pages} páginas · 100% gratis
          </p>
        )}
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-[1fr_1fr] md:items-start">
        <div>
          <h2 className="mb-3 text-xl font-bold text-white">Lo que vas a sacar</h2>
          <ul className="space-y-3">
            {f.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-300">
                <span className="mt-1 text-emerald-400">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <FreebieCaptureForm slug={f.slug} delivery={f.delivery} />
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-slate-700 bg-slate-800/40 p-5 text-sm text-slate-300">
        <h3 className="text-base font-bold text-white">¿Por qué gratis?</h3>
        <p className="mt-2">
          TripCazador detecta chollos de vuelo automáticamente. Estos PDFs son
          la versión condensada de lo que aprendemos cazando precios. Si te
          gustan, suscríbete a Premium (€9,99/mes con prueba 7 días gratis) para
          alertas en tiempo real y filtros pro.
        </p>
      </section>
    </main>
  );
}
