import type { Metadata } from "next";
import Link from "next/link";
import { PARTNERS } from "@/lib/travel_partners";
import { SectionHero } from "@/components/SectionHero";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Cómo viajar barato — la guía con todas las herramientas",
  description:
    "Reserva hotel, tours, alquiler de coche, trenes, eSIM y seguro. Las 8 herramientas que usamos en cada viaje + tips de uso.",
  alternates: { canonical: "/como-viajar" },
};

export const revalidate = 86400; // 24h

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

const CATEGORIES = [
  { id: "hoteles", label: "Hoteles", emoji: "🏨" },
  { id: "tours", label: "Tours y actividades", emoji: "🎫" },
  { id: "alquiler", label: "Alquiler de coche", emoji: "🚗" },
  { id: "transporte", label: "Trenes y buses", emoji: "🚆" },
  { id: "pagos", label: "Pagos y cambio", emoji: "💳" },
  { id: "esim", label: "Internet (eSIM)", emoji: "📱" },
  { id: "seguro", label: "Seguro de viaje", emoji: "🛡️" },
] as const;

export default function ComoViajarPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Cómo viajar", item: `${SITE}/como-viajar` },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Herramientas para viajar — TripCazador",
    itemListElement: PARTNERS.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${SITE}/como-viajar/${p.slug}`,
    })),
  };

  return (
    <div className="space-y-10">
      <JsonLd data={[breadcrumb, itemList]} />

      <SectionHero
        badge="Guía completa"
        title={
          <>
            Cómo <em>viajar</em>
          </>
        }
        subtitle="Las 8 herramientas que usamos en cada viaje real. Hotel, tours, coche, trenes, eSIM, seguro y pagos. Sin BS, solo lo que funciona."
      />

      <p className="text-gray-300 max-w-3xl text-lg">
        El vuelo solo es el 30% de un viaje. El resto — alojamiento, transporte, datos, seguro — donde más dinero se pierde si no sabes qué herramientas usar. Aquí está nuestro stack: 8 plataformas testeadas en viaje real, con guía de uso paso a paso.
      </p>

      {/* Index por categoría */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATEGORIES.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="flex flex-col items-center gap-1 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-amber-500/30 transition-colors text-center"
          >
            <span className="text-2xl">{c.emoji}</span>
            <span className="text-xs font-semibold text-gray-300">{c.label}</span>
          </a>
        ))}
      </section>

      {/* Cards por partner agrupadas por categoría */}
      {CATEGORIES.map((cat) => {
        const partners = PARTNERS.filter((p) => p.category === cat.id);
        if (partners.length === 0) return null;
        return (
          <section key={cat.id} id={cat.id} className="space-y-4 scroll-mt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <span>{cat.emoji}</span>
              {cat.label}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {partners.map((p) => (
                <Link
                  key={p.slug}
                  href={`/como-viajar/${p.slug}`}
                  className="group rounded-2xl border border-gray-800 hover:border-amber-500/40 bg-gray-900 p-5 sm:p-6 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl shrink-0">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">{p.shortDescription}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.pros.slice(0, 2).map((pro) => (
                          <span
                            key={pro}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          >
                            ✓ {pro.length > 35 ? `${pro.slice(0, 35)}…` : pro}
                          </span>
                        ))}
                      </div>
                      <span className="inline-block mt-3 text-xs text-amber-400 font-semibold">
                        Cómo usarlo →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* CTA final */}
      <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 to-gray-950 p-6 sm:p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Empieza por encontrar el vuelo barato
        </h2>
        <p className="text-gray-300 mb-4 max-w-2xl mx-auto">
          Todas estas herramientas son útiles después. Pero el primer paso es cazar el chollo de vuelo. Mira nuestros 144 deals activos.
        </p>
        <Link
          href="/deals"
          className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
        >
          Ver chollos de vuelo →
        </Link>
      </section>

      <p className="text-xs text-gray-500 text-center max-w-2xl mx-auto">
        Algunos enlaces son de afiliado: si reservas a través de ellos no pagas más, pero recibimos una pequeña comisión que mantiene TripCazador funcionando. Solo recomendamos lo que usamos.
      </p>
    </div>
  );
}
