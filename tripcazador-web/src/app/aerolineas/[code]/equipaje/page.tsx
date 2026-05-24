/**
 * /aerolineas/[code]/equipaje — SUPER-1D (24 may 2026)
 *
 * Sub-vertical SEO programmatic combinando AIRLINES catalog (códigos
 * IATA lowercase) con baggage_rules. 15 landings que capturan
 * "ryanair equipaje", "vueling equipaje mano", "iberia maletas" etc.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { AIRLINES, getAirlineByCode } from "@/lib/airlines";
import { BAGGAGE_RULES, getBaggageBySlug } from "@/lib/baggage_rules";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

// Mapping IATA code → baggage slug. Algunos aerolíneas tienen slugs
// diferentes (ej. ryanair vs FR). Solo generamos sub-rutas para los que
// tienen baggage_rules.
const CODE_TO_SLUG: Record<string, string> = {
  fr: "ryanair",
  vy: "vueling",
  u2: "easyjet",
  ib: "iberia",
  w6: "wizz",
  lh: "lufthansa",
  af: "air-france",
  kl: "klm",
  dy: "norwegian",
  qr: "qatar",
  tp: "tap-portugal",
  tk: "turkish",
  ba: "british-airways",
  ei: "aer-lingus",
  ek: "emirates",
};

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ code: string }> {
  return Object.keys(CODE_TO_SLUG).map((code) => ({ code }));
}

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const a = getAirlineByCode(params.code);
  const slug = CODE_TO_SLUG[params.code.toLowerCase()];
  const b = slug ? getBaggageBySlug(slug) : null;
  if (!a || !b) return { title: "Equipaje no encontrado" };
  const title = `Equipaje ${a.name}: medidas, peso, precio 2026`;
  const description = `Reglas equipaje ${a.name} (${a.code}): bolso personal ${b.personalItem.dimensions}, cabina ${b.cabin.dimensions} ${b.cabin.weight}, facturado ${b.checked.weight}. Precios actualizados.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/aerolineas/${params.code}/equipaje` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/aerolineas/${params.code}/equipaje`,
      type: "article",
    },
  };
}

export default function EquipajeAerolineaPage({
  params,
}: {
  params: { code: string };
}) {
  const a = getAirlineByCode(params.code);
  const slug = CODE_TO_SLUG[params.code.toLowerCase()];
  const b = slug ? getBaggageBySlug(slug) : null;
  if (!a || !b) notFound();

  // Otros 5 aerolíneas con sub-vertical para cross-link
  const others = AIRLINES.filter(
    (x) =>
      x.code.toLowerCase() !== params.code.toLowerCase() &&
      CODE_TO_SLUG[x.code.toLowerCase()],
  ).slice(0, 5);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Aerolíneas", url: "/aerolineas" },
    { name: a.name, url: `/aerolineas/${params.code}` },
    { name: "Equipaje", url: `/aerolineas/${params.code}/equipaje` },
  ]);

  const faqJsonLd = faqPageSchema([
    {
      q: `¿Qué medidas tiene el bolso de mano gratuito en ${a.name}?`,
      a: `${b.personalItem.name}: ${b.personalItem.dimensions}. ${b.personalItem.free ? "Gratis incluido." : "Tarifa aplica."}`,
    },
    {
      q: `¿Cuánto cuesta facturar maleta en ${a.name}?`,
      a: `Maleta facturada ${b.checked.weight}: desde €${b.checked.feeFromEur}. ${b.checked.feeNote}`,
    },
    {
      q: `¿Puedo llevar trolley de cabina gratis en ${a.name}?`,
      a: `Trolley cabina ${b.cabin.dimensions} ${b.cabin.weight}: desde €${b.cabin.feeFromEur}. ${b.cabin.feeNote}`,
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
        <Link href="/aerolineas" className="hover:text-amber-400">Aerolíneas</Link>
        <span className="mx-2">/</span>
        <Link href={`/aerolineas/${params.code}`} className="hover:text-amber-400">{a.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Equipaje</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">{b.emoji} 🧳</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Equipaje {a.name}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Medidas, peso y precios oficiales 2026. Actualizado: {b.lastUpdated}.
        </p>
      </header>

      <section className="mb-8 space-y-4">
        {/* Bolso personal */}
        <article className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">👜 {b.personalItem.name}</h2>
              <p className="mt-1 font-mono text-2xl text-emerald-300">{b.personalItem.dimensions}</p>
            </div>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
              {b.personalItem.free ? "✓ GRATIS" : "Tarifa aplica"}
            </span>
          </div>
        </article>

        {/* Cabina */}
        <article className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">🎒 Equipaje de cabina (trolley)</h2>
              <p className="mt-1 font-mono text-2xl text-amber-300">{b.cabin.dimensions}</p>
              <p className="mt-1 text-sm text-slate-400">Peso: <strong className="text-white">{b.cabin.weight}</strong></p>
            </div>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
              desde €{b.cabin.feeFromEur}
            </span>
          </div>
          {b.cabin.feeNote && <p className="mt-3 text-xs text-slate-400 italic">{b.cabin.feeNote}</p>}
        </article>

        {/* Facturado */}
        <article className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">🧳 Maleta facturada</h2>
              <p className="mt-1 font-mono text-2xl text-slate-300">{b.checked.weight}</p>
            </div>
            <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-3 py-1 text-xs font-bold text-slate-300">
              desde €{b.checked.feeFromEur}
            </span>
          </div>
          {b.checked.feeNote && <p className="mt-3 text-xs text-slate-400 italic">{b.checked.feeNote}</p>}
        </article>
      </section>

      {/* specialItems removido — no está en BaggageRule type */}

      <section className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-3 text-lg font-bold text-amber-300">💡 Tip clave</h2>
        <p className="text-sm text-slate-300">
          ¿No estás seguro si tu equipaje cumple? Usa nuestro{" "}
          <Link href="/equipaje-medidor" className="font-bold text-amber-400 hover:underline">
            medidor interactivo
          </Link>
          {" "}— introduce dimensiones reales y te dice si pasa control.
        </p>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/aerolineas/${params.code}`}
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50"
        >
          <div className="text-2xl">✈️</div>
          <div className="mt-1 text-sm font-bold text-white">{a.name} completo</div>
        </Link>
        <Link
          href={`/aerolineas/${params.code}/rutas`}
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50"
        >
          <div className="text-2xl">🗺️</div>
          <div className="mt-1 text-sm font-bold text-white">Rutas {a.name}</div>
        </Link>
      </section>

      <section className="mt-10">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Equipaje otras aerolíneas
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {others.map((o) => (
            <Link
              key={o.code}
              href={`/aerolineas/${o.code.toLowerCase()}/equipaje`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm text-slate-200 transition-colors hover:border-amber-500/50"
            >
              {o.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
