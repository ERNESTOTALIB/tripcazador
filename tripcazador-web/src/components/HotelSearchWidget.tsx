"use client";

/**
 * HotelSearchWidget
 * ─────────────────
 * Buscador inline de hoteles con deep-link a Booking.com.
 *
 * Por qué deep-link y no API directa:
 *   - No tenemos motor propio de tarifas hoteleras (sí lo tenemos para el
 *     feed "top por precio/noche" que se pinta más abajo en la página).
 *   - Booking.com no permite API pública sin contrato — el afiliado se hace
 *     por URL con el parámetro `aid` (Booking affiliate ID).
 *   - Para el usuario es un flujo natural: rellena aquí → aterriza en
 *     Booking con su búsqueda preparada.
 *
 * Affiliate: Se lee de NEXT_PUBLIC_BOOKING_AID (si no está, el enlace va
 * limpio a booking.com sin tracking).
 */

import { useMemo, useState } from "react";
import { track } from "@/lib/analytics";

const BOOKING_AID = process.env.NEXT_PUBLIC_BOOKING_AID || "";

// Destinos sugeridos: mezcla de alto tráfico hispano (Grecia, Tailandia,
// Bali) + escapadas europeas cortas + clásicos de playa Caribe.
const SUGGESTED_DESTINATIONS: Array<{ label: string; query: string }> = [
  { label: "Santorini", query: "Santorini, Grecia" },
  { label: "Bali (Ubud)", query: "Ubud, Bali, Indonesia" },
  { label: "Phuket", query: "Phuket, Tailandia" },
  { label: "Roma", query: "Roma, Italia" },
  { label: "Lisboa", query: "Lisboa, Portugal" },
  { label: "Zanzíbar", query: "Zanzíbar, Tanzania" },
  { label: "Marrakech", query: "Marrakech, Marruecos" },
  { label: "Nueva York", query: "Nueva York, EEUU" },
  { label: "Ciudad de México", query: "Ciudad de México, México" },
  { label: "Cancún", query: "Cancún, México" },
  { label: "La Habana", query: "La Habana, Cuba" },
  { label: "Tokio", query: "Tokio, Japón" },
];

function todayPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Exportada para test: validar que todos los parámetros esperados (ss,
// checkin/checkout, group_adults, aid si procede) llegan en la query string.
export function buildBookingUrl(params: {
  destination: string;
  checkin: string;
  checkout: string;
  adults: number;
  rooms: number;
  children: number;
}): string {
  // Booking.com acepta `ss` para la búsqueda libre (ciudad o hotel).
  // Documentación: https://affiliate.booking.com
  const u = new URL("https://www.booking.com/searchresults.es.html");
  u.searchParams.set("ss", params.destination);
  u.searchParams.set("checkin", params.checkin);
  u.searchParams.set("checkout", params.checkout);
  u.searchParams.set("group_adults", String(params.adults));
  u.searchParams.set("group_children", String(params.children));
  u.searchParams.set("no_rooms", String(params.rooms));
  u.searchParams.set("selected_currency", "EUR");
  u.searchParams.set("lang", "es");
  if (BOOKING_AID) u.searchParams.set("aid", BOOKING_AID);
  return u.toString();
}

export default function HotelSearchWidget() {
  const [destination, setDestination] = useState("");
  const [checkin, setCheckin] = useState(todayPlusDays(7));
  const [checkout, setCheckout] = useState(todayPlusDays(10));
  const [adults, setAdults] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [children, setChildren] = useState(0);

  const canSearch = destination.trim().length >= 2 && checkin && checkout && checkout > checkin;

  const url = useMemo(() => {
    if (!canSearch) return "#";
    return buildBookingUrl({ destination: destination.trim(), checkin, checkout, adults, rooms, children });
  }, [destination, checkin, checkout, adults, rooms, children, canSearch]);

  return (
    <section
      className="rounded-2xl bg-slate-900/70 backdrop-blur ring-1 ring-slate-700/60 shadow-xl p-4 md:p-6"
      aria-label="Buscador de hoteles"
    >
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="md:col-span-2">
          <label htmlFor="hotel-destination" className="block text-xs uppercase tracking-wider text-slate-300 mb-1">
            Destino
          </label>
          <input
            id="hotel-destination"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value.slice(0, 80))}
            placeholder="Ciudad, barrio o nombre del hotel"
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="hotel-checkin" className="block text-xs uppercase tracking-wider text-slate-300 mb-1">
            Entrada
          </label>
          <input
            id="hotel-checkin"
            type="date"
            value={checkin}
            min={todayPlusDays(0)}
            onChange={(e) => {
              const v = e.target.value;
              setCheckin(v);
              if (checkout <= v) setCheckout(shiftDate(v, 3));
            }}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label htmlFor="hotel-checkout" className="block text-xs uppercase tracking-wider text-slate-300 mb-1">
            Salida
          </label>
          <input
            id="hotel-checkout"
            type="date"
            value={checkout}
            min={checkin}
            onChange={(e) => setCheckout(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label htmlFor="hotel-guests" className="block text-xs uppercase tracking-wider text-slate-300 mb-1">
            Huéspedes
          </label>
          <div className="flex items-center gap-1">
            <select
              id="hotel-guests"
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="flex-1 rounded-lg bg-slate-800 border border-slate-600 px-2 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Número de adultos"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "adulto" : "adultos"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="hotel-rooms" className="block text-xs uppercase tracking-wider text-slate-300 mb-1">
            Habitaciones
          </label>
          <select
            id="hotel-rooms"
            value={rooms}
            onChange={(e) => setRooms(Number(e.target.value))}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "hab." : "habs."}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div className="md:col-span-2">
          <label htmlFor="hotel-children" className="block text-xs uppercase tracking-wider text-slate-300 mb-1">
            Niños (0-17)
          </label>
          <select
            id="hotel-children"
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "niño" : "niños"}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4">
          {canSearch ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => {
                // Emitimos el evento antes de navegar: GA4 usa sendBeacon internamente,
                // así que el navegador suele completar la emisión incluso al cambiar de tab.
                track({
                  name: "booking_url_opened",
                  params: {
                    source: "hotel_widget",
                    destination: destination.trim(),
                    checkin,
                    checkout,
                  },
                });
              }}
              className="block text-center w-full rounded-lg font-semibold px-4 py-2.5 transition bg-amber-400 hover:bg-amber-300 text-slate-900"
            >
              Buscar en Booking.com →
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-label="Rellena el destino y las fechas para buscar en Booking.com"
              className="block text-center w-full rounded-lg font-semibold px-4 py-2.5 transition bg-slate-700 text-slate-400 cursor-not-allowed"
            >
              Buscar en Booking.com →
            </button>
          )}
        </div>
      </div>

      {/* Destinos rápidos */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-xs text-slate-400 uppercase tracking-wider mr-1 self-center">
          Populares:
        </span>
        {SUGGESTED_DESTINATIONS.slice(0, 8).map((d) => (
          <button
            key={d.label}
            type="button"
            onClick={() => setDestination(d.query)}
            className="text-xs rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1 transition"
          >
            {d.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Reservas a través de Booking.com (afiliado). El precio que ves en Booking
        es el que pagas — TripCazador no añade recargos.
      </p>
    </section>
  );
}

// Exportada para test: valida que el incremento de días no rompa con
// strings ISO malformadas (devuelve el input en ese caso, defensivo).
export function shiftDate(iso: string, days: number): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
