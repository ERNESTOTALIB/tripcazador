import type { Metadata } from "next";
import { GLOSSARY, getGlossaryByCategory, CATEGORY_LABELS } from "@/lib/glossary";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Glosario de vuelos: 50+ términos del sector explicados (2026)",
  description:
    "Diccionario de términos del sector aviación: error fare, code share, fare class, EU 261, yield management y 45 más. Definiciones claras en español.",
  alternates: { canonical: "/glosario" },
  openGraph: {
    type: "website",
    title: "Glosario de vuelos — TripCazador",
    description:
      "50+ términos del sector aviación explicados en español. De \"error fare\" a \"yield management\".",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TripCazador — chollos de vuelo desde Europa" }],
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function GlossaryPage() {
  const grouped = getGlossaryByCategory();
  const categories = Object.keys(CATEGORY_LABELS).filter((c) => grouped[c]?.length);

  // JSON-LD: una entrada DefinedTerm por término dentro de un DefinedTermSet.
  // Habilita rich snippets de "Definition" en SERP.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      name: "Glosario de vuelos — TripCazador",
      url: "https://tripcazador.com/glosario",
      description:
        "Diccionario completo de términos del sector aviación, error fares y caza de vuelos baratos.",
      hasDefinedTerm: GLOSSARY.map((t) => ({
        "@type": "DefinedTerm",
        "@id": `https://tripcazador.com/glosario#${t.slug}`,
        name: t.term,
        alternateName: t.aliases || [],
        description: t.definition,
        inDefinedTermSet: "https://tripcazador.com/glosario",
        termCode: t.slug,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Glosario",
          item: "https://tripcazador.com/glosario",
        },
      ],
    },
  ];

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Glosario</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Glosario de vuelos</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          {GLOSSARY.length} términos del sector aviación, error fares, alianzas y caza de chollos. Definiciones claras en español.
        </p>
      </header>

      <nav
        aria-label="Saltar a categoría"
        className="flex flex-wrap gap-2 pb-4 border-b border-gray-800"
      >
        {categories.map((cat) => (
          <a
            key={cat}
            href={`#cat-${cat}`}
            className="text-xs bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-amber-300 px-3 py-1.5 rounded-full border border-gray-800 transition-colors"
          >
            {CATEGORY_LABELS[cat]}{" "}
            <span className="text-gray-500">({grouped[cat].length})</span>
          </a>
        ))}
      </nav>

      {categories.map((cat) => (
        <section key={cat} id={`cat-${cat}`} className="space-y-6 scroll-mt-20">
          <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">
            {CATEGORY_LABELS[cat]}
          </h2>
          <dl className="space-y-5">
            {grouped[cat].map((t) => (
              <div
                key={t.slug}
                id={t.slug}
                className="scroll-mt-20 bg-gray-900/40 border border-gray-800 rounded-xl p-5"
              >
                <dt className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">
                    <a
                      href={`#${t.slug}`}
                      className="hover:text-amber-300 group"
                      aria-label={`Enlace permanente a ${t.term}`}
                    >
                      {t.term}
                      <span className="text-gray-600 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        #
                      </span>
                    </a>
                  </h3>
                  {t.aliases && t.aliases.length > 0 && (
                    <p className="text-xs text-gray-500 italic">
                      También: {t.aliases.join(", ")}
                    </p>
                  )}
                </dt>
                <dd className="mt-2 text-gray-300 leading-relaxed">
                  {t.definition}
                  {t.detail && (
                    <span className="block mt-2 text-sm text-gray-400 border-l-2 border-amber-500/40 pl-3">
                      {t.detail}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">¿Falta algún término?</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Escríbenos por Telegram y lo añadimos. Si lo proponen 3 personas distintas, lo incluímos en la próxima revisión.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Sugerir término por Telegram
        </a>
      </section>
    </div>
  );
}
