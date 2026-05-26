/**
 * /equipo-viaje — SUPER-SPONSORS (25 may 2026)
 *
 * Hub vertical equipo de viaje (Amazon Associates).
 * 12 categorías de productos con guías honest. Cross-link a /equipaje
 * y /preparar-viaje.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { EQUIPO_VIAJE } from "@/lib/equipo_viaje_catalog";
import {
  isAmazonAffiliateConfigured,
} from "@/lib/amazon_affiliate";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Equipo de viaje 2026: guías honestas de categorías esenciales",
  description:
    "12 categorías de equipo de viaje con criterios técnicos, picks por presupuesto y FAQ. Sin reviews de modelos específicos — guías sobre cómo elegir.",
  alternates: { canonical: `${SITE_URL}/equipo-viaje` },
  openGraph: {
    title: "Equipo de viaje: guías honest por categoría",
    description:
      "Mochilas, adaptadores, organizadores, candados TSA, almohadas, báscula, AirTag, calcetines compresión y más. Picks por presupuesto.",
    url: `${SITE_URL}/equipo-viaje`,
    type: "article",
  },
};

export default function EquipoViajeHubPage() {
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Equipo viaje", url: "/equipo-viaje" },
  ]);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Equipo viaje</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🎒</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Equipo de viaje 2026
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          12 guías de categorías esenciales: criterios técnicos, picks por
          presupuesto (€/€€/€€€) y FAQ basadas en preguntas reales.
        </p>
        <p className="mx-auto mt-2 max-w-xl text-xs text-slate-500">
          No recomendamos modelos específicos premium — los reviews se quedan
          desactualizados en 6 meses. Listamos criterios para que elijas tú.
        </p>
      </header>

      {!isAmazonAffiliateConfigured() && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-300">
          <strong>Disclaimer transparencia:</strong> los links a Amazon en estas
          guías no llevan código de afiliado aún. Cuando el operador active
          Amazon Associates ES, las compras desde estos enlaces apoyarán
          TripCazador sin coste adicional para ti.
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EQUIPO_VIAJE.map((p) => (
          <Link
            key={p.slug}
            href={`/equipo-viaje/${p.slug}`}
            className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 transition-colors hover:border-amber-500/40"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{p.emoji}</div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-white">{p.name}</h2>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                  {p.seoDescription}
                </p>
                <p className="mt-2 text-xs text-amber-300">
                  Picks: {p.picks.presupuesto.rangeEur} · {p.picks.medio.rangeEur}{" "}
                  · {p.picks.premium.rangeEur}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-10 rounded-xl border border-slate-700 bg-slate-900/40 p-6">
        <h2 className="text-lg font-bold text-white">¿Cómo eligimos los picks?</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>
            <strong>Sin sponsorship oculto:</strong> ninguna marca paga por aparecer
            en estas listas. Los picks son los productos que un usuario informado
            elegiría según presupuesto.
          </li>
          <li>
            <strong>Categorías, no modelos:</strong> recomendamos rangos de precio
            + criterios técnicos. Ejemplos concretos son orientativos
            (cambian cada 6 meses).
          </li>
          <li>
            <strong>Comisión Amazon Associates:</strong> si el operador activa el
            programa, parte de tu compra (3-7%) apoya TripCazador sin coste extra.
            Esto no influye en las recomendaciones.
          </li>
          <li>
            <strong>Actualizado mayo 2026:</strong> criterios técnicos vigentes.
            Revisado cada 6 meses para asegurar relevancia.
          </li>
        </ul>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/equipaje"
          className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-center hover:border-amber-500/50"
        >
          <div className="text-2xl">🧳</div>
          <div className="mt-1 text-sm font-bold text-white">Equipaje aerolíneas</div>
          <div className="mt-1 text-xs text-slate-400">Medidas + precios oficiales</div>
        </Link>
        <Link
          href="/preparar-viaje/japon"
          className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-center hover:border-amber-500/50"
        >
          <div className="text-2xl">📋</div>
          <div className="mt-1 text-sm font-bold text-white">Checklists destinos</div>
          <div className="mt-1 text-xs text-slate-400">Qué llevar por país</div>
        </Link>
        <Link
          href="/equipaje-medidor"
          className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-center hover:border-amber-500/50"
        >
          <div className="text-2xl">📏</div>
          <div className="mt-1 text-sm font-bold text-white">Medidor equipaje</div>
          <div className="mt-1 text-xs text-slate-400">¿Pasa tu equipaje?</div>
        </Link>
      </section>
    </main>
  );
}
