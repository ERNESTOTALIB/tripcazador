/**
 * /idiomas — Hub idiomas para viajar. SUPERSESSION (24 may 2026)
 */
import type { Metadata } from "next";
import Link from "next/link";
import { IDIOMAS_CATALOG } from "@/lib/idiomas_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Idiomas para viajar: frases básicas por país",
  description: `Frases esenciales en ${IDIOMAS_CATALOG.length} idiomas con pronunciación: japonés, tailandés, mandarín, vietnamita, árabe, italiano y más.`,
  alternates: { canonical: `${SITE_URL}/idiomas` },
  openGraph: {
    title: "Idiomas para viajar: frases básicas",
    description: `Frases esenciales en ${IDIOMAS_CATALOG.length} idiomas con pronunciación.`,
    url: `${SITE_URL}/idiomas`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function IdiomasHubPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Idiomas para viajar", url: "/idiomas" },
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
        <span className="text-slate-200">Idiomas</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🗣️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Idiomas para viajar
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Frases esenciales en {IDIOMAS_CATALOG.length} idiomas con pronunciación
          fácil de leer. Saber 5 frases en idioma local transforma cómo te tratan.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {IDIOMAS_CATALOG.map((i) => (
          <Link
            key={i.slug}
            href={`/idiomas/${i.slug}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 transition-colors hover:border-amber-500/50"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{i.emoji}</span>
              <div>
                <h2 className="text-base font-bold text-white">{i.pais}</h2>
                <p className="text-xs text-amber-300">{i.idiomaName}</p>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{i.oneLiner}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
