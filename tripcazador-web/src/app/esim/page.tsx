/**
 * /esim — SSS418 (May 2026)
 *
 * Hub vertical eSIM data internacional. Captura keyword "esim viaje" +
 * sirve de hub para los 31 landings /esim/[destino] (afiliado Holafly).
 *
 * Server Component puro (anti-SSS143 regression).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { DESTINOS_CATALOG } from "@/lib/destinos_catalog";
import { JsonLd } from "@/components/JsonLd";

const HOLAFLY_REF = process.env.NEXT_PUBLIC_HOLAFLY_REF || "tripcazador";

export const metadata: Metadata = {
  title: "eSIM para viajar 2026: comparativa Holafly, Airalo — TripCazador",
  description:
    "Guía eSIM data internacional: cómo funciona, comparativa Holafly vs Airalo, planes recomendados por destino. Descuento Holafly aplicado.",
  alternates: { canonical: "/esim" },
  openGraph: {
    title: "eSIM 2026: comparativa + recomendaciones por destino",
    description:
      "Ahorra hasta 80% vs roaming. Holafly y Airalo comparados con planes por destino.",
    type: "article",
    images: [
      {
        url: "/api/og?title=eSIM%20internacional&subtitle=Data%20sin%20roaming%20para%20m%C3%A1s%20de%20100%20destinos",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const holaflyHubUrl = `https://esim.holafly.com/?ref=${HOLAFLY_REF}&utm_source=tripcazador&utm_medium=programmatic&utm_campaign=esim_hub`;

export default function EsimHubPage() {
  const essential = DESTINOS_CATALOG.filter((d) => d.esim === "essential");
  const recommended = DESTINOS_CATALOG.filter((d) => d.esim === "recommended");

  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "TripCazador", item: "https://tripcazador.com" },
      { "@type": "ListItem", position: 2, name: "eSIM", item: "https://tripcazador.com/esim" },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <JsonLd data={breadcrumbsLd} />

      <header className="mb-8">
        <div className="mb-3 text-5xl" aria-hidden>📱</div>
        <h1 className="mb-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
          eSIM para viajar — guía 2026
        </h1>
        <p className="text-lg text-slate-300">
          Una eSIM es una tarjeta SIM virtual: se activa por código QR sin
          cambiar la SIM física, te da data prepago en destino y evita el
          roaming caro. La instalas en 2 minutos antes del vuelo.
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-400">
          Recomendación TripCazador
        </div>
        <h2 className="mb-3 text-2xl font-bold text-white">Holafly — data ilimitada</h2>
        <p className="mb-4 text-slate-300">
          Holafly es nuestra recomendación principal: data ilimitada en la
          mayoría de destinos, cobertura en 170+ países, activación en
          minutos, soporte 24/7 en español y app móvil simple.
        </p>
        <a
          href={holaflyHubUrl}
          target="_blank"
          rel="noopener nofollow sponsored"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-bold text-slate-900 transition-colors hover:bg-amber-400"
        >
          Ver planes Holafly →
        </a>
        <p className="mt-3 text-xs text-slate-500">
          Link afiliado: comisión sin coste extra para ti.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-white">
          eSIM imprescindible — destinos sin roaming gratis
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {essential.map((d) => (
            <Link
              key={d.slug}
              href={`/esim/${d.slug}`}
              className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/30 p-3 transition-colors hover:border-amber-500/50"
            >
              <span className="text-2xl" aria-hidden>{d.emoji}</span>
              <span className="text-sm font-semibold text-white">eSIM {d.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-white">
          eSIM recomendada — destinos con roaming caro
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((d) => (
            <Link
              key={d.slug}
              href={`/esim/${d.slug}`}
              className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/30 p-3 transition-colors hover:border-amber-500/50"
            >
              <span className="text-2xl" aria-hidden>{d.emoji}</span>
              <span className="text-sm font-semibold text-white">eSIM {d.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
        <h2 className="mb-3 text-xl font-bold text-white">¿Tu móvil soporta eSIM?</h2>
        <p className="text-slate-300">
          Casi todos los smartphones de gama media-alta lanzados desde 2018-2019
          soportan eSIM: iPhone XS o posterior, Samsung Galaxy S20 o posterior,
          Google Pixel 4 o posterior. Verifica en tu móvil: <em>Ajustes → Datos
          móviles → Añadir plan de datos</em>.
        </p>
      </section>
    </main>
  );
}
