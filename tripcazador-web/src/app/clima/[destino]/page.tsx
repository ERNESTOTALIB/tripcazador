/**
 * /clima/[destino] — AUDIT-FULL-2 (24 may 2026)
 *
 * 12 landings SEO programmatic con clima mensual por destino top.
 * Captura long-tail "clima en X mes", "mejor mes para viajar a X",
 * "qué llevar a X en julio".
 *
 * JSON-LD: Breadcrumb + FAQ + Article.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CLIMA_CATALOG,
  CLIMA_SLUGS,
  getClima,
  type ClimateMonth,
} from "@/lib/clima_catalog";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema_helpers";
import { DESTINO_SLUGS } from "@/lib/destinos_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ destino: string }> {
  return CLIMA_SLUGS.map((destino) => ({ destino }));
}

export async function generateMetadata({
  params,
}: {
  params: { destino: string };
}): Promise<Metadata> {
  const c = getClima(params.destino);
  if (!c) return { title: "Destino no encontrado" };
  const title = `Clima ${c.name} mes a mes: cuándo ir y qué llevar`;
  const description = `${c.oneLiner} Tabla 12 meses + mejores meses + tips equipaje.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/clima/${c.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/clima/${c.slug}`,
      type: "article",
    },
  };
}

function rowClass(m: ClimateMonth): string {
  if (m.recommended) return "bg-emerald-500/5 border-emerald-500/30";
  if (m.precipMm > 200 || m.tempMaxC > 38 || m.tempMaxC < 5) return "bg-red-500/5 border-red-500/30";
  return "bg-slate-800/40 border-slate-700";
}

export default function ClimaPage({ params }: { params: { destino: string } }) {
  const c = getClima(params.destino);
  if (!c) notFound();

  const hasDestino = c.destinoSlug && DESTINO_SLUGS.includes(c.destinoSlug);
  const others = CLIMA_CATALOG.filter((x) => x.slug !== c.slug).slice(0, 6);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Clima por destino", url: "/clima" },
    { name: c.name, url: `/clima/${c.slug}` },
  ]);

  const bestMonthsLabel = c.bestMonths
    .map((m) => c.months[m - 1].monthName)
    .join(", ");

  const faqJsonLd = faqPageSchema([
    {
      q: `¿Cuál es el mejor mes para viajar a ${c.name}?`,
      a: `Los mejores meses son: ${bestMonthsLabel}. ${c.oneLiner}`,
    },
    {
      q: `¿Cuándo NO conviene viajar a ${c.name}?`,
      a: `Evitar: ${c.worstMonths.map((m) => c.months[m - 1].monthName).join(", ")}. Razones varían: lluvias, calor extremo, frío excesivo o turismo masificado.`,
    },
    {
      q: `¿Qué temperatura hace en ${c.name}?`,
      a: `Mín ${Math.min(...c.months.map((m) => m.tempMinC))}°C en invierno a máx ${Math.max(...c.months.map((m) => m.tempMaxC))}°C en pico verano.`,
    },
    {
      q: `¿Qué llevar en la maleta a ${c.name}?`,
      a: c.packingTips.join(". "),
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
        <Link href="/clima" className="hover:text-amber-400">Clima</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{c.name}</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">{c.emoji}</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Clima {c.name}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">{c.oneLiner}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/5 px-4 py-1.5 text-xs">
          <span className="text-amber-300">Mejor temporada:</span>
          <span className="font-bold text-white">{bestMonthsLabel}</span>
        </div>
      </header>

      <section className="mb-8 overflow-x-auto">
        <h2 className="mb-4 text-2xl font-bold text-white">📅 12 meses en {c.name}</h2>
        <div className="space-y-2">
          {c.months.map((m) => (
            <article
              key={m.month}
              className={`rounded-xl border p-4 ${rowClass(m)}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-bold text-white">
                  {m.monthName}
                  {m.recommended && <span className="ml-2 text-xs text-emerald-300">★ Recomendado</span>}
                </h3>
                <div className="text-xs text-slate-300">
                  <span className="font-mono">
                    {m.tempMinC}-{m.tempMaxC}°C
                  </span>
                  {" · "}
                  <span className="font-mono">{m.precipMm}mm</span>
                  {" · "}
                  <span className="font-mono">{m.sunDays}d sol</span>
                </div>
              </div>
              {m.note && (
                <p className="mt-2 text-xs text-slate-400 italic">{m.note}</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-3 text-xl font-bold text-amber-300">🎒 Qué llevar</h2>
        <ul className="space-y-2">
          {c.packingTips.map((t, i) => (
            <li key={i} className="text-sm text-slate-300">
              • {t}
            </li>
          ))}
        </ul>
      </section>

      {hasDestino && (
        <section className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="text-sm font-bold text-white">¿Listo para viajar?</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/destinos/${c.destinoSlug}`}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              Ver vuelos a {c.name} →
            </Link>
            <Link
              href={`/preparar-viaje/${c.destinoSlug}`}
              className="rounded-lg border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/10"
            >
              Checklist viaje
            </Link>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Clima de otros destinos
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/clima/${o.slug}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm text-slate-200 transition-colors hover:border-amber-500/50"
            >
              {o.emoji} {o.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
