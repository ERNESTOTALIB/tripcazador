/**
 * /codigos-pais/[iso] — SSS444 (23 may 2026)
 *
 * Landing por país con lookup compacto: huso, divisa, idioma, prefijo,
 * enchufe, conducción, visa, tip curioso.
 *
 * Cross-link a /preparar-viaje/[destino] si destinoSlug existe.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CODIGOS_PAIS_CATALOG,
  CODIGOS_PAIS_ISOS,
  getCodigoPais,
} from "@/lib/codigos_pais_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ iso: string }> {
  return CODIGOS_PAIS_ISOS.map((iso) => ({ iso }));
}

export async function generateMetadata({
  params,
}: {
  params: { iso: string };
}): Promise<Metadata> {
  const c = getCodigoPais(params.iso);
  if (!c) return { title: "País no encontrado" };
  const title = `${c.name}: códigos, divisa ${c.currency.code}, prefijo ${c.phonePrefix}`;
  const description = `Lookup ${c.name}: ${c.timezone}, divisa ${c.currency.name} (${c.currency.symbol}), prefijo ${c.phonePrefix}, enchufe ${c.plug.type}. Información esencial para viajeros españoles.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/codigos-pais/${c.iso}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/codigos-pais/${c.iso}`,
      type: "article",
    },
  };
}

export default function CodigoPaisPage({ params }: { params: { iso: string } }) {
  const c = getCodigoPais(params.iso);
  if (!c) notFound();

  const others = CODIGOS_PAIS_CATALOG.filter((x) => x.iso !== c.iso).slice(0, 6);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Códigos por país", url: "/codigos-pais" },
    { name: c.name, url: `/codigos-pais/${c.iso}` },
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
        <Link href="/codigos-pais" className="hover:text-amber-400">Códigos por país</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{c.name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {c.emoji} {c.name}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          ISO <span className="font-mono">{c.iso.toUpperCase()}</span> · Capital {c.capital}
        </p>
      </header>

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <div className="text-xs uppercase text-slate-500">Huso horario</div>
          <div className="mt-1 text-lg font-bold text-white">{c.timezone}</div>
          {c.timezoneNote && (
            <p className="mt-1 text-xs text-slate-400">{c.timezoneNote}</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <div className="text-xs uppercase text-slate-500">Divisa</div>
          <div className="mt-1 text-lg font-bold text-white">
            {c.currency.symbol} {c.currency.code}
          </div>
          <p className="mt-1 text-xs text-slate-400">{c.currency.name}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <div className="text-xs uppercase text-slate-500">Idioma</div>
          <div className="mt-1 text-lg font-bold text-white">{c.language}</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <div className="text-xs uppercase text-slate-500">Prefijo telefónico</div>
          <div className="mt-1 font-mono text-lg font-bold text-white">{c.phonePrefix}</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <div className="text-xs uppercase text-slate-500">Enchufe</div>
          <div className="mt-1 text-sm font-bold text-white">{c.plug.type}</div>
          <p className="mt-1 text-xs text-slate-400">
            {c.plug.voltage} ·{" "}
            {c.plug.needsAdapterFromSpain ? (
              <span className="text-amber-300">Adaptador necesario</span>
            ) : (
              <span className="text-emerald-300">Sin adaptador desde España</span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <div className="text-xs uppercase text-slate-500">Conducción</div>
          <div className="mt-1 text-lg font-bold text-white capitalize">
            {c.driving === "izquierdo" ? "Por la izquierda" : "Por la derecha"}
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <div className="text-xs uppercase text-slate-500">Vuelo desde Madrid</div>
          <div className="mt-1 text-lg font-bold text-white">{c.flightHoursFromMad}h</div>
        </div>
        <div
          className={`rounded-xl border p-4 ${
            c.visa === "no-required" || c.visa === "schengen"
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-amber-500/40 bg-amber-500/5"
          }`}
        >
          <div className="text-xs uppercase text-slate-400">Visa para españoles</div>
          <div className="mt-1 text-sm font-bold capitalize">
            {c.visa === "no-required"
              ? "No requerida"
              : c.visa === "schengen"
                ? "Espacio Schengen"
                : c.visa === "evisa"
                  ? "eVisa online"
                  : c.visa === "on-arrival"
                    ? "Visa on arrival"
                    : "Embajada"}
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="text-base font-bold text-amber-300">💡 Tip curioso</h2>
        <p className="mt-2 text-sm text-slate-200">{c.funFact}</p>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        {c.destinoSlug && (
          <Link
            href={`/preparar-viaje/${c.destinoSlug}`}
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-colors hover:border-amber-500/50"
          >
            <div className="text-2xl">📋</div>
            <div className="mt-1 text-sm font-bold text-white">Preparar viaje</div>
            <div className="text-xs text-slate-400">Checklist completa {c.name}</div>
          </Link>
        )}
        <Link
          href="/deals"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 transition-colors hover:border-amber-500/70"
        >
          <div className="text-2xl">🎯</div>
          <div className="mt-1 text-sm font-bold text-white">Vuelos a {c.name}</div>
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
                href={`/codigos-pais/${o.iso}`}
                className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-300"
              >
                {o.emoji} {o.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
