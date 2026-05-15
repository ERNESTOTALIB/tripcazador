"use client";

import { useState } from "react";
import { getBookingUrl } from "@/lib/airline_links";
import { AirportCombobox } from "@/components/AirportCombobox";
import { PriceCalendarHeatmap } from "@/components/PriceCalendarHeatmap";
import { tcTrack } from "@/lib/track_client";

/**
 * FlightSearchForm — fase ii F4
 *
 * Form client-side. Al submit:
 *   1. Valida origen (IATA 3 letras), destino (IATA 3 letras), fechas
 *   2. Construye URL via airline_links.getBookingUrl con la aerolínea seleccionada
 *   3. Redirige al user a esa URL en tab nueva
 *
 * Por qué client-side: no necesitamos roundtrip al server, los URLs son
 * deterministic en función de los inputs.
 */

const AIRLINES = [
  { code: "", name: "Cualquier aerolínea (mejor precio)" },
  { code: "FR", name: "Ryanair" },
  { code: "U2", name: "easyJet" },
  { code: "W6", name: "Wizz Air" },
  { code: "VY", name: "Vueling" },
  { code: "IB", name: "Iberia" },
  { code: "LH", name: "Lufthansa" },
  { code: "KL", name: "KLM" },
  { code: "AF", name: "Air France" },
  { code: "BA", name: "British Airways" },
  { code: "TP", name: "TAP Portugal" },
  { code: "UX", name: "Air Europa" },
  { code: "DY", name: "Norwegian" },
  { code: "TK", name: "Turkish Airlines" },
  { code: "QR", name: "Qatar Airways" },
  { code: "EK", name: "Emirates" },
  { code: "SQ", name: "Singapore Airlines" },
  { code: "NH", name: "ANA" },
  { code: "JL", name: "Japan Airlines" },
  { code: "CX", name: "Cathay Pacific" },
  { code: "SK", name: "SAS" },
  { code: "AY", name: "Finnair" },
  { code: "A3", name: "Aegean Airlines" },
];

const POPULAR_ORIGINS = ["MAD", "BCN", "AGP", "VLC", "SVQ", "PMI", "BIO"];
const POPULAR_DESTINATIONS = [
  "JFK", "LAX", "MIA", "EZE", "GRU", "BOG", "CUN", "HAV", "PUJ",
  "BKK", "NRT", "ICN", "HKG", "SIN", "DEL", "SYD",
  "LIS", "OPO", "FCO", "BCN", "MAD", "CDG", "LHR", "AMS",
  "RAK", "CMN", "IST", "DXB", "DOH",
];

function safeIata(s: string): string {
  return s.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function FlightSearchForm() {
  const [origin, setOrigin] = useState("MAD");
  const [destination, setDestination] = useState("");
  const [dateOut, setDateOut] = useState(todayPlus(30));
  const [dateRet, setDateRet] = useState(todayPlus(37));
  const [oneWay, setOneWay] = useState(false);
  const [airline, setAirline] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const o = safeIata(origin);
    const d = safeIata(destination);
    if (o.length !== 3 || d.length !== 3) {
      setError("Origen y destino deben ser códigos IATA de 3 letras (ej: MAD, JFK)");
      return;
    }
    if (o === d) {
      setError("Origen y destino no pueden ser iguales");
      return;
    }
    if (!dateOut) {
      setError("Selecciona la fecha de ida");
      return;
    }
    if (!oneWay && !dateRet) {
      setError("Selecciona la fecha de vuelta o marca 'Solo ida'");
      return;
    }
    if (!oneWay && dateRet < dateOut) {
      setError("La fecha de vuelta no puede ser anterior a la de ida");
      return;
    }

    const url = getBookingUrl({
      airlineCode: airline || undefined,
      origin: o,
      destination: d,
      dateOut,
      dateRet: oneWay ? "" : dateRet,
    });

    if (typeof window !== "undefined") {
      // SSS185: emit a AMBOS — GA4 (gtag) + /api/p (tcTrack). search_submitted
      // está en VALID_TYPES (ver /api/track/route.ts) pero NO en FLUSH_IMMEDIATELY
      // (no es revenue directo, conversion path indirecta).
      const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
      if (gtag) {
        gtag("event", "search_submitted", {
          origin: o,
          destination: d,
          date_out: dateOut,
          one_way: oneWay,
          airline_code: airline || "any",
        });
      }
      tcTrack("search_submitted", {
        origin: o,
        destination: d,
        date_out: dateOut,
        one_way: oneWay,
        airline_code: airline || "any",
      });
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AirportCombobox
          label="Origen"
          value={origin}
          onChange={(v) => setOrigin(v)}
          placeholder="Madrid, España, MAD…"
          required
          id="origin-cb"
        />
        <AirportCombobox
          label="Destino"
          value={destination}
          onChange={(v) => setDestination(v)}
          placeholder="Tokio, Japón, NRT…"
          required
          id="dest-cb"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date-out" className="block text-xs uppercase text-gray-500 mb-1">
            Fecha ida
          </label>
          <input
            id="date-out"
            type="date"
            value={dateOut}
            onChange={(e) => setDateOut(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
            required
          />
        </div>
        <div>
          <label htmlFor="date-ret" className="block text-xs uppercase text-gray-500 mb-1">
            Fecha vuelta
          </label>
          <input
            id="date-ret"
            type="date"
            value={dateRet}
            onChange={(e) => setDateRet(e.target.value)}
            disabled={oneWay}
            className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm focus:border-amber-400 focus:outline-none disabled:opacity-40"
          />
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={oneWay}
          onChange={(e) => setOneWay(e.target.checked)}
          className="h-4 w-4 accent-amber-500"
        />
        Solo ida
      </label>

      <div>
        <label htmlFor="airline" className="block text-xs uppercase text-gray-500 mb-1">
          Aerolínea (opcional)
        </label>
        <select
          id="airline"
          value={airline}
          onChange={(e) => setAirline(e.target.value)}
          className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
        >
          {AIRLINES.map((a) => (
            <option key={a.code} value={a.code}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 px-4 rounded-md transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        Buscar →
      </button>

      <p className="text-xs text-gray-500">
        Se abrirá la web de la aerolínea (o Skyscanner con carrier pre-filtrado)
        en una pestaña nueva con tu ruta y fechas pre-cargadas.
      </p>

      {/* Calendario heatmap precio-mes (visual de orientación) */}
      {origin && destination && (
        <div className="mt-6 pt-6 border-t border-gray-800">
          <h3 className="text-sm font-semibold text-amber-300 mb-3">
            Precio por día — orientativo
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Los días en verde son los más baratos según tendencia histórica.
            Click en un día para usar esa fecha.
          </p>
          <PriceCalendarHeatmap
            origin={origin}
            destination={destination}
            startDate={dateOut}
            onPickDay={(d) => setDateOut(d)}
          />
        </div>
      )}
    </form>
  );
}
