/**
 * /etiqueta — SSS486 (24 may 2026)
 *
 * Hub para guías de etiqueta cultural por país. Cierra cluster
 * SEO + permite breadcrumb desde landings volver al índice.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ETIQUETA_CATALOG } from "@/lib/etiqueta_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Etiqueta cultural: guía por país | TripCazador",
  description: `Guías culturales para ${ETIQUETA_CATALOG.length} destinos top: propinas, saludos, vestuario, tabúes y gestos para no quedar mal viajando.`,
  alternates: { canonical: `${SITE_URL}/etiqueta` },
  // SSS493-FIX7: añadir openGraph para consistencia con otras landings nuevas
  openGraph: {
    title: "Etiqueta cultural: guía por país",
    description: `Propinas, saludos, vestuario y tabúes para ${ETIQUETA_CATALOG.length} destinos top.`,
    url: `${SITE_URL}/etiqueta`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function EtiquetaIndexPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Etiqueta cultural", url: "/etiqueta" },
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
        <span className="text-slate-200">Etiqueta cultural</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🌍</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Etiqueta cultural por país
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Propinas, saludos, vestuario y tabúes para {ETIQUETA_CATALOG.length} destinos top.
          Evita gaffes culturales y respeta a tus anfitriones.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {ETIQUETA_CATALOG.map((e) => (
          <Link
            key={e.slug}
            href={`/etiqueta/${e.slug}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 transition-colors hover:border-amber-500/50"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{e.emoji}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white">{e.country}</h2>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{e.oneLiner}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
        <h2 className="text-lg font-bold text-white">¿Echas en falta un país?</h2>
        <p className="mt-2 text-sm text-slate-300">
          Iremos añadiendo más guías regularmente. Mientras tanto, consulta nuestros{" "}
          <Link href="/destinos" className="text-amber-400 hover:underline">
            destinos
          </Link>{" "}
          o el{" "}
          <Link href="/codigos-pais" className="text-amber-400 hover:underline">
            lookup por país
          </Link>{" "}
          (huso, divisa, prefijo).
        </p>
      </section>
    </main>
  );
}
