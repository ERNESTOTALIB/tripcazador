import type { Metadata } from "next";
import Link from "next/link";
import { getTopHotels, type Deal } from "@/lib/api";

export const revalidate = 900; // 15 minutos

export const metadata: Metadata = {
  title: "Chollos de hotel — los más baratos por noche | TripCazador",
  description:
    "Hoteles con mejor precio por noche detectados por nuestro motor en Booking.com: Phuket, Bali, Grecia, Tailandia... Actualizado continuamente.",
  alternates: { canonical: "/hoteles" },
  openGraph: {
    title: "Chollos de hotel — TripCazador",
    description:
      "Los hoteles más baratos por noche detectados automáticamente en Booking.",
    url: "/hoteles",
    type: "website",
  },
};

export default async function HotelesPage() {
  const hotels = await getTopHotels({ limit: 30, minStars: 3 });

  return (
    <div className="space-y-10">
      {/* Hero */}
      <header className="space-y-3">
        <h1 className="text-3xl md:text-5xl font-bold text-white">
          Chollos de <span className="text-amber-400">hotel</span>
        </h1>
        <p className="text-gray-400 max-w-2xl">
          Hoteles con el precio por noche más bajo detectados en Booking.com por
          nuestro motor. Ordenados del más barato al más caro.{" "}
          <span className="text-gray-500">
            Los precios cambian rápido — siempre verifica antes de reservar.
          </span>
        </p>
      </header>

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
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {hotels.map((h) => (
            <HotelCard key={h.id} hotel={h} />
          ))}
        </section>
      )}

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

function HotelCard({ hotel }: { hotel: Deal }) {
  const ppn =
    hotel.price_per_night ?? hotel.price_eur / Math.max(hotel.nights, 1);
  const tags = hotel.tags ?? [];
  const stars = tags.find((t) => t.includes("⭐"));
  const booking = tags.find((t) => t.startsWith("Booking"));

  return (
    <article className="flex flex-col rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden hover:border-gray-700 transition-colors">
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

        <h2 className="text-white font-semibold text-lg leading-tight">
          {hotel.headline || hotel.city_to}
        </h2>

        <div className="text-xs text-gray-400 space-y-1">
          <div>📍 {hotel.destination}</div>
          <div>
            📅 {hotel.date_out} → {hotel.date_ret}
            {hotel.nights > 0 && ` (${hotel.nights} noches)`}
          </div>
        </div>

        <div className="pt-2">
          <div className="text-3xl font-bold text-white">
            {ppn.toFixed(0)}€
            <span className="text-sm text-gray-400 font-normal"> / noche</span>
          </div>
          <div className="text-xs text-gray-500">
            {hotel.price_eur.toFixed(0)}€ en total
          </div>
        </div>
      </div>

      <a
        href={hotel.booking_url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="block bg-gray-800 hover:bg-gray-700 text-white text-center py-3 text-sm font-semibold transition-colors"
      >
        Ver en Booking →
      </a>
    </article>
  );
}
