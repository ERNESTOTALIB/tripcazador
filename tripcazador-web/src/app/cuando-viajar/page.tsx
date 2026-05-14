import Link from "next/link";
import type { Metadata } from "next";
import {
  DESTINATIONS_SEASONAL,
  formatMonthList,
  monthName,
} from "@/lib/seasonal_data";
import { JsonLd } from "@/components/JsonLd";

/**
 * /cuando-viajar — MMMM01 (May 2026)
 *
 * Índice de la vertical SEO "cuando ir a [destino]". Lista 12 destinos
 * con el sweet-spot month destacado, breve teaser, y link a la página
 * detalle de cada uno. Server Component (sin handlers JSX) para evitar
 * regresión SSS143.
 */

export const metadata: Metadata = {
  title:
    "Cuándo viajar: mejor mes por destino 2026 — TripCazador",
  description:
    "Mes a mes en 12 destinos clave: Japón, Tailandia, Bali, Marruecos, México, Vietnam, Perú, India, Egipto, Kenia, Islandia y Nueva Zelanda. Sweet-spot, meses a evitar, clima y precios reales.",
  alternates: { canonical: "/cuando-viajar" },
  openGraph: {
    title: "Cuándo viajar: mejor mes por destino 2026",
    description:
      "Sweet-spot, clima, crowds y precios mes a mes para 12 destinos. Decide cuándo ir antes de buscar el vuelo.",
    type: "website",
    url: "https://tripcazador.com/cuando-viajar",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TripCazador — chollos de vuelo desde Europa" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cuándo viajar: mejor mes por destino 2026",
    description:
      "Sweet-spot, clima y precios mes a mes para 12 destinos top.",
  },
};

export const revalidate = 86400; // 24h

export default function CuandoViajarIndex() {
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Cuándo viajar: mejor mes por destino",
    numberOfItems: DESTINATIONS_SEASONAL.length,
    itemListElement: DESTINATIONS_SEASONAL.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://tripcazador.com/cuando-viajar/${d.slug}`,
      name: `Cuándo ir a ${d.name}`,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
      { "@type": "ListItem", position: 2, name: "Cuándo viajar", item: "https://tripcazador.com/cuando-viajar" },
    ],
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <JsonLd data={itemListSchema} />
      <JsonLd data={breadcrumbSchema} />

      <nav className="text-xs text-gray-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>{" "}
        › Cuándo viajar
      </nav>

      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Cuándo viajar: mes a mes por destino
        </h1>
        <p className="text-gray-300 text-lg max-w-3xl">
          El mes en que viajas pesa más que cualquier truco de búsqueda: cambia
          el precio del vuelo, la posibilidad de buen tiempo, las multitudes y
          hasta si los templos están abiertos. Aquí tienes 12 destinos top con
          desglose mes a mes — clima, lluvia, crowds, precio y nuestro
          <em> sweet-spot</em> recomendado.
        </p>
        <p className="text-sm text-gray-400 max-w-3xl">
          Datos basados en patrones reales de turismo. Combinables con
          <Link href="/calculadora" className="text-amber-400 hover:underline mx-1">
            calculadoras
          </Link>
          y
          <Link href="/comparar-aerolineas" className="text-amber-400 hover:underline mx-1">
            comparativas de aerolíneas
          </Link>
          para planear ruta completa.
        </p>
      </header>

      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        aria-label="Destinos"
      >
        {DESTINATIONS_SEASONAL.map((d) => (
          <Link
            key={d.slug}
            href={`/cuando-viajar/${d.slug}`}
            className="group block rounded-xl border border-gray-800 hover:border-amber-500/40 p-5 bg-gray-900/40 hover:bg-gray-900/70 transition-colors"
          >
            <div className="text-[10px] uppercase tracking-wider text-amber-400/80 font-mono mb-1">
              {d.region}
            </div>
            <h2 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
              {d.name}
            </h2>
            <p className="mt-2 text-xs text-gray-500">
              Hubs:{" "}
              <span className="font-mono text-gray-400">
                {d.hubIATAs.join(" · ")}
              </span>
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold"
                >
                  ✓
                </span>
                <span className="text-gray-300">
                  <span className="text-amber-300 font-semibold">
                    Sweet-spot:
                  </span>{" "}
                  {formatMonthList(d.sweetSpotMonths)}
                </span>
              </div>
              {d.avoidMonths.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold"
                  >
                    ✗
                  </span>
                  <span className="text-gray-300">
                    <span className="text-rose-300 font-semibold">Evitar:</span>{" "}
                    {formatMonthList(d.avoidMonths)}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-gray-400 line-clamp-3">
              {d.description.split("\n\n")[0]}
            </p>
            <div className="mt-3 text-xs text-amber-400 group-hover:text-amber-300">
              Ver mes a mes →
            </div>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 space-y-3">
        <h2 className="text-xl font-bold text-white">
          ¿Cómo elegir el mes ideal?
        </h2>
        <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
          <li>
            <strong className="text-white">Clima &gt; precio:</strong> un vuelo
            barato a Tailandia en septiembre se arruina con lluvia diaria. El
            sweet-spot equilibra ambos.
          </li>
          <li>
            <strong className="text-white">Crowds:</strong> los 2-3 meses
            antes/después del pico turístico suelen tener el mismo clima con
            30-50% menos turistas y precios accesibles.
          </li>
          <li>
            <strong className="text-white">Festivales:</strong> Holi en India,
            Songkran en Tailandia o el Día de Muertos en México son
            experiencias únicas — pero llenan hoteles. Reservar 4+ meses.
          </li>
          <li>
            <strong className="text-white">Estaciones invertidas:</strong>{" "}
            Nueva Zelanda y otros destinos sur tienen verano cuando Europa
            tiene invierno. Útil para hacer escapadas a clima opuesto.
          </li>
        </ul>
        <p className="text-xs text-gray-400 pt-2">
          Consejo cazador: en el sweet-spot mes y dos semanas antes/después,
          revisa{" "}
          <Link href="/deals" className="text-amber-400 hover:underline">
            /deals
          </Link>{" "}
          para errores de tarifa y considera{" "}
          <Link href="/seguro-viaje" className="text-amber-400 hover:underline">
            seguro de viaje
          </Link>{" "}
          si es largo recorrido.
        </p>
      </section>

      <section
        className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6"
        aria-label="Próximos meses"
      >
        <h2 className="text-xl font-bold text-white mb-2">
          ¿Qué buscan los cazadores en {monthName((new Date().getMonth() + 2) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)}?
        </h2>
        <p className="text-sm text-gray-300 mb-3">
          Mira el mes objetivo de cada destino antes de buscar vuelo. Después
          activa{" "}
          <Link href="/alertas" className="text-amber-300 hover:underline">
            alertas de precio
          </Link>{" "}
          para tu sweet-spot mes.
        </p>
        <div className="flex flex-wrap gap-2">
          {DESTINATIONS_SEASONAL.slice(0, 6).map((d) => (
            <Link
              key={d.slug}
              href={`/cuando-viajar/${d.slug}`}
              className="px-3 py-1.5 rounded-full bg-gray-900/60 border border-gray-700 hover:border-amber-500/50 text-xs text-gray-200 hover:text-amber-300 transition-colors"
            >
              {d.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
