/**
 * /divisas/[code] — SSS457 (23 may 2026)
 *
 * Landing por divisa con tipo cambio orientativo + tabla EUR→X y
 * X→EUR para denominaciones típicas + tips viajero.
 *
 * Cross-link a /tarjetas-viaje (Wise/Revolut affiliate) y /codigos-pais
 * cuando aplique.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  DIVISAS_CATALOG,
  DIVISAS_CODES,
  getDivisa,
} from "@/lib/divisas_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ code: string }> {
  return DIVISAS_CODES.map((code) => ({ code }));
}

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const d = getDivisa(params.code);
  if (!d) return { title: "Divisa no encontrada" };
  const title = `Cambio Euro a ${d.nameEs}: ${d.symbol} (${d.code}) hoy`;
  const description = `1 EUR ≈ ${d.symbol}${d.rateFromEur.toLocaleString("es-ES")} ${d.code}. Tips para viajar a ${d.countries[0]} con menos comisiones bancarias. Wise vs Revolut.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/divisas/${d.code.toLowerCase()}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/divisas/${d.code.toLowerCase()}`,
      type: "article",
    },
  };
}

// Denominaciones típicas para tabla rápida
const EUR_AMOUNTS = [1, 5, 10, 20, 50, 100, 200, 500, 1000];

export default function DivisaPage({ params }: { params: { code: string } }) {
  const d = getDivisa(params.code);
  if (!d) notFound();

  const others = DIVISAS_CATALOG.filter((x) => x.code !== d.code).slice(0, 6);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Divisas", url: "/divisas" },
    { name: d.nameEs, url: `/divisas/${d.code.toLowerCase()}` },
  ]);

  // FAQ schema (Google rich snippet eligibility)
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `¿A cuánto está 1 euro en ${d.nameEs} hoy?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `1 EUR ≈ ${d.symbol}${d.rateFromEur} ${d.code} (orientativo, actualizado ${d.lastUpdated}). El tipo varía a diario — para conversiones live consulta Wise.com o XE.com.`,
        },
      },
      {
        "@type": "Question",
        name: `¿Cuánto son 100 euros en ${d.nameEs}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `100 EUR ≈ ${d.symbol}${(100 * d.rateFromEur).toLocaleString("es-ES")} ${d.code} (al tipo orientativo).`,
        },
      },
      {
        "@type": "Question",
        name: `¿Cómo evitar comisiones al cambiar Euro a ${d.code}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Usa tarjetas como Wise o Revolut que cambian al tipo interbancario sin markup. Evita cajeros del aeropuerto (5-8% peor tipo) y casas de cambio sin transparencia.`,
        },
      },
    ],
  };

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
        <Link href="/divisas" className="hover:text-amber-400">Divisas</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{d.nameEs}</span>
      </nav>

      <header className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <span className="text-4xl">{d.emoji}</span>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Euro a {d.nameEs}
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          {d.code} ({d.symbol}) · Usada en {d.countries.join(", ")}
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
        <div className="text-xs uppercase text-amber-400">Tipo orientativo</div>
        <div className="mt-2 font-mono text-3xl font-bold text-white">
          1 € = {d.symbol}
          {d.rateFromEur.toLocaleString("es-ES")} {d.code}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Última actualización: {d.lastUpdated}. Variabilidad{" "}
          <span className="capitalize">{d.volatility}</span>.
        </div>
      </section>

      <section className="mb-8 overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/40">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">EUR</th>
              <th className="px-4 py-3 text-right">{d.code}</th>
            </tr>
          </thead>
          <tbody>
            {EUR_AMOUNTS.map((eur) => {
              const converted = eur * d.rateFromEur;
              return (
                <tr key={eur} className="border-t border-slate-700">
                  <td className="px-4 py-2 font-mono text-white">€{eur}</td>
                  <td className="px-4 py-2 text-right font-mono text-amber-300">
                    {d.symbol}
                    {converted.toLocaleString("es-ES", {
                      maximumFractionDigits: converted >= 100 ? 0 : 2,
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="mb-8 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="mb-3 text-lg font-bold text-white">💡 Tips para viajeros</h2>
        <ul className="space-y-2">
          {d.travelTips.map((t, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
              <span className="mt-1 text-amber-400">→</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/tarjetas-viaje"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 transition-colors hover:border-amber-500/70"
        >
          <div className="text-2xl">💳</div>
          <div className="mt-1 text-sm font-bold text-white">Tarjetas viaje</div>
          <div className="text-xs text-amber-300">Wise vs Revolut vs N26</div>
        </Link>
        <Link
          href="/deals"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🎯</div>
          <div className="mt-1 text-sm font-bold text-white">Vuelos a {d.countries[0]}</div>
          <div className="text-xs text-slate-400">Chollos detectados</div>
        </Link>
      </section>

      {others.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">Otras divisas</h2>
          <div className="flex flex-wrap gap-2">
            {others.map((o) => (
              <Link
                key={o.code}
                href={`/divisas/${o.code.toLowerCase()}`}
                className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-300"
              >
                {o.emoji} {o.code}
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-10 text-xs text-slate-500">
        Tipos orientativos {d.lastUpdated}. La aplicación recomienda
        consultar el tipo live en{" "}
        <a
          href="https://wise.com/es/currency-converter"
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="text-amber-400 hover:underline"
        >
          Wise
        </a>{" "}
        o XE.com antes de cambiar grandes cantidades.
      </footer>
    </main>
  );
}
