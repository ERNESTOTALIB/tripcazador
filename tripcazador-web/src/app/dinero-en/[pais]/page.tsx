/**
 * /dinero-en/[pais] — SUPERSESSION (24 may 2026)
 *
 * 10 landings SEO programmatic: cuánto efectivo sacar, dónde cambiar,
 * propinas, tarjetas, errores típicos. Captura "dinero en X país viajero".
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  DINERO_CATALOG,
  DINERO_SLUGS,
  getDinero,
} from "@/lib/dinero_catalog";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema_helpers";
import { DESTINO_SLUGS } from "@/lib/destinos_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ pais: string }> {
  return DINERO_SLUGS.map((pais) => ({ pais }));
}

const TARJETAS_BADGE: Record<string, string> = {
  "muy alta": "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  media: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  baja: "bg-red-500/15 text-red-300 border-red-500/40",
  "muy baja": "bg-red-500/15 text-red-300 border-red-500/40",
};

export async function generateMetadata({
  params,
}: {
  params: { pais: string };
}): Promise<Metadata> {
  const d = getDinero(params.pais);
  if (!d) return { title: "Guía dinero no encontrada" };
  const title = `Dinero en ${d.pais}: cuánto sacar, propinas, tarjetas`;
  const description = `Guía práctica del dinero en ${d.pais} (${d.moneda}): efectivo a sacar, dónde cambiar, propinas obligatorias, tarjetas aceptadas y errores típicos.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/dinero-en/${d.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/dinero-en/${d.slug}`,
      type: "article",
    },
  };
}

export default function DineroPaisPage({ params }: { params: { pais: string } }) {
  const d = getDinero(params.pais);
  if (!d) notFound();

  const others = DINERO_CATALOG.filter((x) => x.slug !== d.slug).slice(0, 5);
  const hasDestino = d.destinoSlug && DESTINO_SLUGS.includes(d.destinoSlug);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Dinero por país", url: "/dinero-en" },
    { name: d.pais, url: `/dinero-en/${d.slug}` },
  ]);

  const faqJsonLd = faqPageSchema([
    {
      q: `¿Cuánto dinero efectivo necesito en ${d.pais}?`,
      a: d.efectivoSacar,
    },
    {
      q: `¿Dónde cambiar dinero en ${d.pais}?`,
      a: d.donde_cambiar,
    },
    {
      q: `¿Aceptan tarjetas en ${d.pais}?`,
      a: `Aceptación tarjetas: ${d.tarjetasAceptadas}. ${d.tarjetasDetalle}`,
    },
    {
      q: `¿Hay que dejar propina en ${d.pais}?`,
      a: d.propinas,
    },
  ]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/dinero-en" className="hover:text-amber-400">Dinero por país</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{d.pais}</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">💰</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Dinero en {d.pais}
        </h1>
        <p className="mx-auto mt-2 text-sm text-slate-400">{d.moneda}</p>
      </header>

      <div className="space-y-6">
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <h2 className="mb-3 text-xl font-bold text-emerald-300">💵 Efectivo recomendado</h2>
          <p className="text-sm text-slate-300">{d.efectivoSacar}</p>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <h2 className="mb-3 text-xl font-bold text-white">🏦 Dónde cambiar</h2>
          <p className="text-sm text-slate-300">{d.donde_cambiar}</p>
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <h3 className="text-sm font-bold text-red-300">⚠️ Evitar</h3>
            <p className="mt-1 text-xs text-slate-300">{d.cambio_evitar}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h2 className="mb-3 text-xl font-bold text-amber-300">💸 Propinas</h2>
          <p className="text-sm text-slate-300">{d.propinas}</p>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-white">
            💳 Tarjetas
            <span className={`rounded-full border px-2 py-0.5 text-xs ${TARJETAS_BADGE[d.tarjetasAceptadas]}`}>
              {d.tarjetasAceptadas}
            </span>
          </h2>
          <p className="text-sm text-slate-300">{d.tarjetasDetalle}</p>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <h2 className="mb-3 text-xl font-bold text-white">🏧 Cajero ATM</h2>
          <p className="text-sm text-slate-300">{d.cajero}</p>
        </section>

        <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="mb-3 text-xl font-bold text-red-300">🚨 Error típico a evitar</h2>
          <p className="text-sm text-slate-300">{d.errorTipico}</p>
        </section>
      </div>

      {hasDestino && (
        <section className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="text-sm font-bold text-white">¿Viajando a {d.pais}?</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/destinos/${d.destinoSlug}`}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              Ver vuelos →
            </Link>
            <Link
              href={`/tarjetas-viaje`}
              className="rounded-lg border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/10"
            >
              Tarjetas viaje 0% comisión
            </Link>
            <Link
              href={`/etiqueta/${d.slug}`}
              className="rounded-lg border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/10"
            >
              Etiqueta cultural
            </Link>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Dinero en otros países
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/dinero-en/${o.slug}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm text-slate-200 transition-colors hover:border-amber-500/50"
            >
              {o.emoji} {o.pais}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
