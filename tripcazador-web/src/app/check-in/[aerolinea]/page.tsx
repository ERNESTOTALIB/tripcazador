/**
 * /check-in/[aerolinea] — SSS427 (23 may 2026)
 *
 * Landing por aerolínea con detalles de check-in: cuándo abre,
 * fee mostrador, ventana cierre, tips, errores típicos.
 *
 * Cross-links: /equipaje/[aerolinea] (mismo slug), /aerolineas/[code].
 *
 * SEO: "ryanair check-in cuando abre", "vueling fee mostrador",
 * "easyjet boarding pass impreso obligatorio".
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CHECK_IN_RULES,
  CHECK_IN_SLUGS,
  getCheckInRule,
} from "@/lib/check_in_rules";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ aerolinea: string }> {
  return CHECK_IN_SLUGS.map((aerolinea) => ({ aerolinea }));
}

export async function generateMetadata({
  params,
}: {
  params: { aerolinea: string };
}): Promise<Metadata> {
  const rule = getCheckInRule(params.aerolinea);
  if (!rule) return { title: "Aerolínea no encontrada | TripCazador" };
  const title = `${rule.name} check-in: cuándo abre, fees y tips | TripCazador`;
  const description = `Guía completa de check-in en ${rule.name}: online abre ${rule.online.opens.split("/")[0].trim()}, ${rule.airportCheckIn.feeEur > 0 ? `fee mostrador €${rule.airportCheckIn.feeEur}` : "mostrador gratis"}, tips y errores típicos.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/check-in/${rule.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/check-in/${rule.slug}`,
      type: "article",
    },
  };
}

export default function CheckInAerolineaPage({
  params,
}: {
  params: { aerolinea: string };
}) {
  const rule = getCheckInRule(params.aerolinea);
  if (!rule) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: rule.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Check-in", item: `${SITE_URL}/check-in` },
      { "@type": "ListItem", position: 3, name: rule.name, item: `${SITE_URL}/check-in/${rule.slug}` },
    ],
  };

  const otherRules = CHECK_IN_RULES.filter((r) => r.slug !== rule.slug).slice(0, 5);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/check-in" className="hover:text-amber-400">Check-in</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{rule.name}</span>
      </nav>

      <header className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <span className="text-4xl">{rule.emoji}</span>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Check-in {rule.name}
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          IATA <span className="font-mono">{rule.code}</span> · Actualizado {rule.lastUpdated}
        </p>
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <div className="text-xs uppercase text-slate-500">Online abre</div>
          <div className="mt-1 text-sm font-bold text-white">{rule.online.opens}</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <div className="text-xs uppercase text-slate-500">Online cierra</div>
          <div className="mt-1 text-sm font-bold text-white">{rule.online.closes}</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <div className="text-xs uppercase text-slate-500">Fee mostrador</div>
          <div
            className={`mt-1 text-sm font-bold ${rule.airportCheckIn.feeEur > 0 ? "text-red-300" : "text-emerald-300"}`}
          >
            {rule.airportCheckIn.feeEur > 0 ? `€${rule.airportCheckIn.feeEur}` : "Gratis"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <div className="text-xs uppercase text-slate-500">Mostrador cierra</div>
          <div className="mt-1 text-sm font-bold text-white">{rule.airportCounter.closes}</div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold text-white">Online check-in</h2>
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
          <p className="text-sm text-slate-300">
            <strong>Método:</strong> {rule.online.method}
          </p>
          {rule.onlineRequired && (
            <p className="mt-2 rounded bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              ⚠️ Hacer el check-in online es obligatorio en {rule.name} — si llegas al
              aeropuerto sin haberlo hecho, pagarás €{rule.airportCheckIn.feeEur}.
            </p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold text-white">Boarding pass</h2>
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="text-slate-500">Digital (app):</span>{" "}
              <span className="text-white">{rule.boardingPass.digital ? "Aceptado" : "No aceptado"}</span>
            </div>
            <div>
              <span className="text-slate-500">Impreso:</span>{" "}
              <span className="capitalize text-white">{rule.boardingPass.printed.replace("_", " ")}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">{rule.boardingPass.note}</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-white">Mostrador del aeropuerto</h2>
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
          <p className="text-sm text-slate-300">
            <strong>Abre:</strong> {rule.airportCounter.opens}<br />
            <strong>Cierra:</strong> {rule.airportCounter.closes}<br />
            <strong>Coste:</strong>{" "}
            {rule.airportCheckIn.feeEur > 0
              ? `€${rule.airportCheckIn.feeEur}`
              : "Gratuito"}
          </p>
          <p className="mt-2 text-xs text-slate-400">{rule.airportCheckIn.detail}</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-white">💡 Tips</h2>
        <ul className="space-y-2">
          {rule.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-300">
              <span className="mt-1 text-amber-400">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="mb-3 text-xl font-bold text-red-300">⚠️ Errores típicos que cuestan dinero</h2>
        <ul className="space-y-2">
          {rule.commonMistakes.map((m, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-300">
              <span className="mt-1 text-red-400">✗</span>
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-white">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {rule.faq.map((f, i) => (
            <details
              key={i}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-4"
            >
              <summary className="cursor-pointer font-semibold text-white">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/equipaje/${rule.slug}`}
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🧳</div>
          <div className="mt-2 text-sm font-bold text-white">Equipaje {rule.name}</div>
          <div className="text-xs text-slate-400">Reglas y dimensiones</div>
        </Link>
        <Link
          href={`/aerolineas/${rule.code.toLowerCase()}`}
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">✈️</div>
          <div className="mt-2 text-sm font-bold text-white">{rule.name}</div>
          <div className="text-xs text-slate-400">Análisis aerolínea</div>
        </Link>
      </section>

      {otherRules.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">Otras aerolíneas</h2>
          <div className="flex flex-wrap gap-2">
            {otherRules.map((r) => (
              <Link
                key={r.slug}
                href={`/check-in/${r.slug}`}
                className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-300"
              >
                {r.emoji} {r.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
