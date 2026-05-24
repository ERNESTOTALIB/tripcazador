/**
 * /tasa-turistica/[ciudad] — SSS459 (23 may 2026)
 *
 * Landing por ciudad con tasa turística detallada.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  TASA_TURISTICA_CATALOG,
  TASA_TURISTICA_SLUGS,
  getTasaTuristica,
} from "@/lib/tasa_turistica_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ ciudad: string }> {
  return TASA_TURISTICA_SLUGS.map((ciudad) => ({ ciudad }));
}

export async function generateMetadata({
  params,
}: {
  params: { ciudad: string };
}): Promise<Metadata> {
  const t = getTasaTuristica(params.ciudad);
  if (!t) return { title: "Ciudad no encontrada" };
  const title = `Tasa turística ${t.city} 2026: ${t.ratePerNight.split(" ")[0]}`;
  const description = `Cuánto pagas de tasa turística en ${t.city}: ${t.ratePerNight}. Cobro: ${t.collection}. Excepciones detalladas y actualización ${t.lastUpdated}.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/tasa-turistica/${t.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/tasa-turistica/${t.slug}`,
      type: "article",
    },
  };
}

export default function TasaTuristicaPage({ params }: { params: { ciudad: string } }) {
  const t = getTasaTuristica(params.ciudad);
  if (!t) notFound();

  const others = TASA_TURISTICA_CATALOG.filter((x) => x.slug !== t.slug).slice(0, 6);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Tasa turística", url: "/tasa-turistica" },
    { name: t.city, url: `/tasa-turistica/${t.slug}` },
  ]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/tasa-turistica" className="hover:text-amber-400">Tasa turística</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{t.city}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {t.emoji} Tasa turística {t.city}
        </h1>
        <p className="mt-2 text-sm text-slate-400">{t.country} · Actualizado {t.lastUpdated}</p>
      </header>

      <section className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="text-xs uppercase text-amber-400">Tasa por noche y persona</div>
        <div className="mt-2 text-xl font-bold text-white">{t.ratePerNight}</div>
        {t.maxNights && (
          <p className="mt-2 text-sm text-slate-300">
            Máximo cobrado: <strong>{t.maxNights} noches</strong> por estancia.
          </p>
        )}
      </section>

      <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="mb-2 text-lg font-bold text-white">💳 Cómo se cobra</h2>
        <p className="text-slate-300">{t.collection}</p>
      </section>

      {t.exemptions.length > 0 && (
        <section className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <h2 className="mb-3 text-lg font-bold text-emerald-300">✅ Excepciones (no pagas)</h2>
          <ul className="space-y-2">
            {t.exemptions.map((e, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-200">
                <span className="mt-1 text-emerald-400">✓</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="mb-2 text-lg font-bold text-white">📝 Notas relevantes</h2>
        <p className="text-sm text-slate-300">{t.notes}</p>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/deals"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 transition-colors hover:border-amber-500/70"
        >
          <div className="text-2xl">🎯</div>
          <div className="mt-1 text-sm font-bold text-white">Vuelos a {t.city}</div>
          <div className="text-xs text-amber-300">Chollos detectados</div>
        </Link>
        <Link
          href="/preparar-viaje"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">📋</div>
          <div className="mt-1 text-sm font-bold text-white">Preparar viaje</div>
          <div className="text-xs text-slate-400">Checklists pre-trip</div>
        </Link>
      </section>

      {others.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-bold text-white">Otras ciudades</h2>
          <div className="flex flex-wrap gap-2">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/tasa-turistica/${o.slug}`}
                className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-300"
              >
                {o.emoji} {o.city}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
