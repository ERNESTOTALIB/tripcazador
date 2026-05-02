import type { Metadata } from "next";
import Link from "next/link";
import { getTopHotels } from "@/lib/api";
import { SectionHero } from "@/components/SectionHero";
import { HotelFilters } from "@/components/HotelFilters";
import { HotelSearchBar } from "@/components/HotelSearchBar";

export const revalidate = 900; // 15 minutos

export const metadata: Metadata = {
  title: "Buscador de hoteles — Chollos por noche con filtros | TripCazador",
  description:
    "Busca entre 60+ hoteles con mejor precio/noche en Phuket, Bali, Grecia, Maldivas y más. Filtra por categoría, rating, estrellas, servicios. Reserva con descuento.",
  alternates: { canonical: "/hoteles" },
  openGraph: {
    title: "Buscador de hoteles — TripCazador",
    description:
      "Buscador completo de hoteles con autocomplete, fechas, huéspedes y filtros avanzados. Categorías Playa / Ciudad / Lujo / Familia / Económico.",
    url: "/hoteles",
    type: "website",
  },
};

export default async function HotelesPage() {
  const hotels = await getTopHotels({ limit: 60, minStars: 3 });

  // JSON-LD ItemList para SEO
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Chollos de hotel TripCazador",
    description:
      "Listado de hoteles seleccionados con mejor precio por noche detectados por nuestro motor.",
    itemListElement: hotels.slice(0, 30).map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Hotel",
        name: h.airline_name || h.headline,
        address: {
          "@type": "PostalAddress",
          addressLocality: h.city_to,
          addressCountry: h.country_to,
        },
        priceRange: `€${h.price_per_night ?? 0}/noche`,
        aggregateRating:
          // @ts-expect-error custom field
          h.review_score
            ? {
                "@type": "AggregateRating",
                // @ts-expect-error custom field
                ratingValue: h.review_score,
                // @ts-expect-error custom field
                reviewCount: h.review_count ?? 100,
                bestRating: 10,
                worstRating: 1,
              }
            : undefined,
      },
    })),
  };

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />

      <SectionHero
        size="tall"
        badge="Booking.com · 60+ hoteles · ordenados por precio/noche"
        title={
          <>
            Buscador de <em>hoteles</em>
          </>
        }
        subtitle="Busca por destino, fechas, huéspedes. Filtra por playa, ciudad, lujo, familia o económico. Los precios se actualizan en horas — verifica antes de reservar."
      />

      {/* Buscador en la parte superior — sticky en mobile para acceso rápido */}
      <div className="-mt-4">
        <HotelSearchBar hotels={hotels} className="" />
      </div>

      {hotels.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-12 text-center">
          <div className="text-5xl mb-4">🏨</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Aún no tenemos chollos de hotel publicados
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Nuestro motor de hoteles se ejecuta cada pocas horas. Vuelve pronto
            o suscríbete al canal de Telegram para recibir los mejores chollos
            en cuanto aparezcan.
          </p>
          <Link
            href="/telegram"
            className="inline-block mt-6 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors"
          >
            Ir al canal Telegram →
          </Link>
        </div>
      ) : (
        <HotelFilters hotels={hotels} />
      )}

      {/* SEO content block */}
      <section className="prose prose-invert max-w-3xl mx-auto text-sm">
        <h2 className="text-white">Cómo cazamos chollos de hotel</h2>
        <p className="text-gray-300">
          Nuestro motor analiza más de 60 hoteles 4★/5★ en destinos de alta
          rotación de precios (Bali, Tailandia, Maldivas, Grecia, Italia...) y
          detecta caídas anómalas comparando contra el histórico de la misma
          fecha. Las tarifas mostradas son aproximadas — Booking ajusta
          dinámicamente según ocupación, así que verifica el precio final antes
          de reservar.
        </p>
        <h3 className="text-white">Categorías y filtros</h3>
        <ul className="text-gray-300">
          <li><strong>Playa</strong>: hoteles frente al mar en Caribe, Asia y Mediterráneo.</li>
          <li><strong>Ciudad</strong>: hoteles boutique en capitales europeas y asiáticas.</li>
          <li><strong>Lujo</strong>: 5★ con servicios premium (spa, infinity, suite con jacuzzi…).</li>
          <li><strong>Familia</strong>: all-inclusive con piscinas y kids-club.</li>
          <li><strong>Económico</strong>: 3★/4★ con buena relación calidad-precio.</li>
        </ul>
        <p className="text-gray-300">
          Filtra también por servicios concretos (piscina, spa, kids club, parking),
          rating mínimo 0-9.5 estilo Booking, estrellas mínimas, precio máximo por noche.
          Las URLs incluyen los filtros aplicados — puedes guardar como marcador o compartir.
        </p>
      </section>

      <section className="text-center text-xs text-gray-500 border-t border-gray-800 pt-6">
        <p>
          Datos extraídos automáticamente de Booking.com. Los enlaces de reserva
          son de afiliado — si reservas a través de ellos, recibimos una pequeña
          comisión sin coste adicional para ti.
        </p>
      </section>
    </div>
  );
}
