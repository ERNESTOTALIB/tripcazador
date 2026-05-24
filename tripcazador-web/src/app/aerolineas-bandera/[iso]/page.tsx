/**
 * /aerolineas-bandera/[iso] — SSS449 (23 may 2026)
 *
 * Landing por país con flag carrier(s) + alianza.
 *
 * Cross-link a /aerolineas/[code] (cuando IATA está en catálogo
 * airlines.ts), /codigos-pais/[iso], /deals.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  FLAG_CARRIERS_CATALOG,
  FLAG_CARRIERS_ISOS,
  getFlagCarriers,
} from "@/lib/flag_carriers_catalog";
import { getAirlineByCode } from "@/lib/airlines";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

const ALLIANCE_LABEL: Record<string, string> = {
  oneworld: "oneworld",
  star: "Star Alliance",
  skyteam: "SkyTeam",
  none: "Sin alianza global",
};

const ALLIANCE_DESCRIPTION: Record<string, string> = {
  oneworld:
    "Alianza fundada por BA, AA, Iberia (entre otros). 13+ aerolíneas. Beneficios: acumulación de millas cruzada, lounge access con status Sapphire/Emerald.",
  star:
    "Mayor alianza global. Fundada por Lufthansa, United, ANA, SAS y Thai. 26+ aerolíneas. Beneficios: acumulación cruzada + lounges Gold.",
  skyteam:
    "Alianza Air France-KLM + Delta + Korean. 20+ aerolíneas. Beneficios: acumulación cruzada + lounges Elite Plus.",
  none: "Esta aerolínea opera independiente sin alianza global. Códigos de acceso a millas suelen ser solo via el programa propio.",
};

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ iso: string }> {
  return FLAG_CARRIERS_ISOS.map((iso) => ({ iso }));
}

export async function generateMetadata({
  params,
}: {
  params: { iso: string };
}): Promise<Metadata> {
  const c = getFlagCarriers(params.iso);
  if (!c) return { title: "País no encontrado | TripCazador" };
  const title = `Aerolínea bandera de ${c.country}: ${c.primary.name} | TripCazador`;
  const description = `${c.primary.name} (${c.primary.iata}) es la aerolínea bandera de ${c.country}, con hub en ${c.primary.hub}. ${c.alliance ? `Parte de ${ALLIANCE_LABEL[c.alliance]}.` : ""}`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/aerolineas-bandera/${c.iso}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/aerolineas-bandera/${c.iso}`,
      type: "article",
    },
  };
}

export default function FlagCarrierPage({ params }: { params: { iso: string } }) {
  const c = getFlagCarriers(params.iso);
  if (!c) notFound();

  const others = FLAG_CARRIERS_CATALOG.filter((x) => x.iso !== c.iso).slice(0, 6);

  const primaryInCatalog = getAirlineByCode(c.primary.iata);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Aerolíneas bandera", url: "/aerolineas-bandera" },
    { name: c.country, url: `/aerolineas-bandera/${c.iso}` },
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
        <Link href="/aerolineas-bandera" className="hover:text-amber-400">Aerolíneas bandera</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{c.country}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {c.emoji} Aerolínea bandera de {c.country}
        </h1>
      </header>

      <section className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">{c.primary.name}</h2>
            <p className="mt-1 text-sm text-slate-300">Hub: {c.primary.hub}</p>
          </div>
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-base font-bold text-amber-300">
            {c.primary.iata}
          </span>
        </div>
        {primaryInCatalog && (
          <Link
            href={`/aerolineas/${c.primary.iata.toLowerCase()}`}
            className="mt-3 inline-block text-sm text-amber-400 hover:underline"
          >
            Ver análisis aerolínea →
          </Link>
        )}
      </section>

      {c.alliance && (
        <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
          <h2 className="text-base font-bold text-white">
            Alianza global: {ALLIANCE_LABEL[c.alliance]}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            {ALLIANCE_DESCRIPTION[c.alliance]}
          </p>
        </section>
      )}

      {c.secondary.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-bold text-white">Otras aerolíneas relevantes</h2>
          <div className="space-y-2">
            {c.secondary.map((s) => {
              const inCatalog = getAirlineByCode(s.iata);
              return (
                <div
                  key={s.iata}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/40 p-3"
                >
                  <div>
                    <div className="font-semibold text-white">{s.name}</div>
                    <div className="text-xs text-slate-400">Hub: {s.hub}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-amber-300">{s.iata}</span>
                    {inCatalog && (
                      <Link
                        href={`/aerolineas/${s.iata.toLowerCase()}`}
                        className="text-xs text-amber-400 hover:underline"
                      >
                        Ver →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="mb-2 text-lg font-bold text-white">📝 Notas</h2>
        <p className="text-sm text-slate-300">{c.notes}</p>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/codigos-pais/${c.iso}`}
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🌍</div>
          <div className="mt-1 text-sm font-bold text-white">Códigos {c.country}</div>
          <div className="text-xs text-slate-400">Huso, divisa, enchufe, visa</div>
        </Link>
        <Link
          href="/deals"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 transition-colors hover:border-amber-500/70"
        >
          <div className="text-2xl">🎯</div>
          <div className="mt-1 text-sm font-bold text-white">Vuelos a {c.country}</div>
          <div className="text-xs text-amber-300">Chollos detectados</div>
        </Link>
      </section>

      {others.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-bold text-white">Otros países</h2>
          <div className="flex flex-wrap gap-2">
            {others.map((o) => (
              <Link
                key={o.iso}
                href={`/aerolineas-bandera/${o.iso}`}
                className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-300"
              >
                {o.emoji} {o.country}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
