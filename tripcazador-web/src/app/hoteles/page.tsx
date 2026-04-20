import type { Metadata } from "next";
import Link from "next/link";
import { getTopHotels, type Deal } from "@/lib/api";
import HotelSearchWidget from "@/components/HotelSearchWidget";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 900; // 15 minutos

export const metadata: Metadata = {
  title: "Hoteles baratos y chollos de hotel",
  description:
    "Busca hoteles en cualquier destino con el mejor precio de Booking.com y mira los chollos que nuestro motor detecta cada pocas horas: Phuket, Bali, Grecia, Tailandia, Caribe y más.",
  alternates: { canonical: "/hoteles" },
  openGraph: {
    title: "Hoteles baratos y chollos de hotel",
    description:
      "Buscador de hoteles + chollos detectados automáticamente. Sin recargos, sin ruido.",
    url: "/hoteles",
    type: "website",
  },
};

export default async function HotelesPage() {
  const hotels = await getTopHotels({ limit: 30, minStars: 3 });

  return (
    <div className="space-y-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
            { "@type": "ListItem", position: 2, name: "Hoteles", item: "https://tripcazador.com/hoteles" },
          ],
        }}
      />

      {/* Hero */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-white">Inicio</Link>
          <span>/</span>
          <span className="text-white">Hoteles</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white">
          Hoteles <span className="text-amber-400">baratos</span>, sin ruido
        </h1>
        <p className="text-slate-300 max-w-2xl text-lg">
          Búscalos directamente en Booking.com con nuestro widget, o mira los{" "}
          <strong className="text-white">chollos detectados</strong> por nuestro motor — los hoteles
          con precio-noche más bajo en destinos concretos, actualizado cada 15 minutos.
        </p>
      </header>

      {/* Widget de búsqueda */}
      <HotelSearchWidget />

      {/* Feed de chollos detectados por nuestro motor */}
      <section className="space-y-4">
        <div className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Chollos detectados ahora mismo
            </h2>
            <p className="text-slate-400 text-sm">
              Hoteles con precio por noche anómalamente bajo en destinos populares.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Ordenados del más barato al más caro · {hotels.length} activos
          </p>
        </div>

        {hotels.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <div className="text-5xl mb-4" aria-hidden="true">🏨</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Aún no tenemos chollos de hotel publicados
            </h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Nuestro motor de hoteles se ejecuta cada pocas horas. Usa el buscador de arriba
              para reservar cualquier destino ahora, o suscríbete al canal de Telegram para
              recibir los chollos en cuanto aparezcan.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/telegram"
                className="inline-block px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold rounded-xl transition-colors"
              >
                Ir al canal Telegram →
              </Link>
              <Link
                href="/"
                className="inline-block px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
              >
                Ver chollos de vuelos
              </Link>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {hotels.map((h) => (
              <li key={h.id}>
                <HotelCard hotel={h} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bloques SEO: qué buscar según el destino */}
      <section className="space-y-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">
          Cómo encontrar el mejor hotel según destino
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TipCard title="Grecia (Cícladas, Creta)">
            Reserva con <strong>3-4 meses</strong> de antelación para junio-septiembre.
            En Santorini, los hoteles de Oia triplican precios frente a Fira por la misma
            calidad de vista. Considera Imerovigli: mirador idéntico, hasta un 40% menos.
          </TipCard>
          <TipCard title="Tailandia (islas)">
            Booking muestra precios distintos con IP local: tarifas hasta un 15% más bajas
            desde Agoda con VPN a Bangkok. En Phuket y Koh Samui, abril-mayo (shoulder) da
            los mejores precios sin monzón serio.
          </TipCard>
          <TipCard title="Bali">
            Las mejores relaciones calidad/precio están en <strong>Canggu</strong> y{" "}
            <strong>Ubud</strong>. Evita Kuta (masificado). Los resorts de Nusa Dua suelen
            bajar un 25% en abril y octubre.
          </TipCard>
          <TipCard title="Japón">
            Reserva Kioto con <strong>2-3 meses</strong> de adelanto en temporada de
            momiji (noviembre) y sakura (abril): se agota antes que el vuelo. Los ryokan
            tradicionales requieren reserva directa; Booking no los tiene todos.
          </TipCard>
          <TipCard title="Caribe (Cuba, República Dominicana)">
            Todo-incluido Punta Cana: diciembre-abril casi duplica precios frente a
            septiembre-noviembre. En Cuba, reserva <strong>casas particulares</strong>{" "}
            vía Booking — más auténticas y 40% más baratas que hoteles estatales.
          </TipCard>
          <TipCard title="Europa ciudad">
            Roma, Lisboa, Ámsterdam, Berlín: los precios bajan un 30-50% en enero-febrero
            y noviembre. Si tu vuelo es a medio-día, pide check-in temprano: muchos
            hoteles lo dan gratis fuera de temporada alta.
          </TipCard>
        </div>
      </section>

      {/* FAQ con schema.org */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold text-white">
          Preguntas frecuentes
        </h2>

        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((q) => ({
              "@type": "Question",
              name: q.q,
              acceptedAnswer: { "@type": "Answer", text: q.a },
            })),
          }}
        />

        <div className="space-y-3">
          {FAQ_ITEMS.map((q) => (
            <details
              key={q.q}
              className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <summary className="cursor-pointer font-semibold text-white flex items-center justify-between list-none">
                <span>{q.q}</span>
                <span className="text-slate-500 group-open:rotate-180 transition-transform" aria-hidden="true">▾</span>
              </summary>
              <p className="mt-3 text-slate-300 leading-relaxed text-sm">{q.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="text-center text-xs text-slate-500 border-t border-slate-800 pt-6">
        <p>
          Datos extraídos automáticamente de Booking.com y nuestro motor de tarifas.
          Los enlaces a Booking son de afiliado — si reservas a través de ellos,
          recibimos una pequeña comisión sin coste adicional para ti.
        </p>
      </section>
    </div>
  );
}

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "¿Cómo funciona la búsqueda de hoteles de TripCazador?",
    a: "Nuestro motor monitoriza precios de hoteles en destinos seleccionados y destaca aquellos con precio por noche anómalamente bajo frente a su histórico. El buscador de la parte superior te lleva directamente a Booking.com con tu búsqueda ya rellenada — sin recargos, sin intermediarios.",
  },
  {
    q: "¿Cuánto tiempo dura un chollo de hotel?",
    a: "Depende de la disponibilidad. Los precios de hotel son más estables que los de vuelo: un chollo suele durar entre unas horas y 2-3 días. Pero el inventario a precio bajo se agota rápido, especialmente en destinos populares como Santorini, Maldivas o Bali en temporada.",
  },
  {
    q: "¿Es más barato reservar directamente con el hotel?",
    a: "A veces sí, sobre todo si llamas por teléfono y mencionas que has visto precio más bajo en Booking. Muchos hoteles igualan y añaden un desayuno o habitación con vistas. Pero Booking tiene políticas de cancelación flexibles que los hoteles no siempre ofrecen directamente.",
  },
  {
    q: "¿Puedo cancelar si reservo desde aquí?",
    a: "Depende del hotel y la tarifa que elijas en Booking. Siempre recomendamos la tarifa 'Cancelación gratis' si tu fecha no es firme, especialmente en destinos donde los precios pueden bajar. La diferencia suele ser 5-10% más cara, pero te protege.",
  },
  {
    q: "¿Por qué algunos destinos no tienen chollos publicados?",
    a: "Porque nuestro motor prioriza destinos donde la señal precio/calidad es clara: playas populares, ciudades europeas, Asia y Caribe. Para destinos muy específicos (pueblos pequeños, alojamientos rurales), usa el buscador directo de Booking desde arriba.",
  },
  {
    q: "¿Puedo combinar vuelo + hotel?",
    a: "Sí, y suele salir más barato hacerlo por separado: busca el vuelo en TripCazador, y luego el hotel aquí. Los paquetes vuelo+hotel de las agencias suelen añadir márgenes del 10-20%. La única excepción real son paquetes de operadores serios en Maldivas o islas remotas.",
  },
];

function TipCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-2xl bg-slate-900/60 ring-1 ring-slate-800 p-4 hover:ring-amber-400/40 transition">
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-slate-300 text-sm leading-relaxed">{children}</p>
    </article>
  );
}

function HotelCard({ hotel }: { hotel: Deal }) {
  const ppn =
    hotel.price_per_night ?? hotel.price_eur / Math.max(hotel.nights, 1);
  const tags = hotel.tags ?? [];
  const stars = tags.find((t) => t.includes("⭐"));
  const booking = tags.find((t) => t.startsWith("Booking"));

  return (
    <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden hover:border-slate-700 transition-colors h-full">
      <div className="p-5 flex-1 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {stars && (
            <span className="text-amber-400 text-sm">{stars}</span>
          )}
          {booking && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
              {booking}
            </span>
          )}
        </div>

        <h3 className="text-white font-semibold text-lg leading-tight">
          {hotel.headline || hotel.city_to}
        </h3>

        <div className="text-xs text-slate-400 space-y-1">
          <div>📍 {hotel.destination}</div>
          <div>
            📅 {hotel.date_out} → {hotel.date_ret}
            {hotel.nights > 0 && ` (${hotel.nights} noches)`}
          </div>
        </div>

        <div className="pt-2">
          <div className="text-3xl font-bold text-white">
            {ppn.toFixed(0)}€
            <span className="text-sm text-slate-400 font-normal"> / noche</span>
          </div>
          <div className="text-xs text-slate-500">
            {hotel.price_eur.toFixed(0)}€ en total
          </div>
        </div>
      </div>

      <a
        href={hotel.booking_url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="block bg-slate-800 hover:bg-slate-700 text-white text-center py-3 text-sm font-semibold transition-colors"
      >
        Ver en Booking →
      </a>
    </article>
  );
}
