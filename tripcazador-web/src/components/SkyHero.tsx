"use client";

/**
 * SkyHero — fase vv VV7v2
 *
 * Hero full-width con sky gradient + glass searchbar RICA:
 *   - DESDE: input texto con autocompletado fuzzy (ciudad/país/IATA, 600+ aeropuertos)
 *   - A: ídem
 *   - IDA + VUELTA: date pickers
 *   - CABINA: select compacto
 *   - Buscar → /deals con todos los params
 *
 * Reusa AirportCombobox (fase kk K3) para autocompletar contra el catálogo
 * remoto + fuzzy search local. Glass styling adaptado del fase uu C8 hero.
 */
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AirportCombobox } from "@/components/AirportCombobox";
import { getBookingUrl } from "@/lib/airline_links";

export interface FloatingDeal {
  route: string;
  price: string;
  /** URL del deal/booking. Si externa abre en nueva pestaña, si interna router.push. */
  href: string;
  /** true → window.open externo (booking aerolínea/Skyscanner). false → /deals/{id} */
  external?: boolean;
  /** Badge opcional: "-58%", "ERROR" */
  badge?: string;
}

// Fallback si page.tsx no pasa floating (ej: build sin VPS). Si user los ve,
// significa que el motor no devolvió deals < €200.
const FLOATING_FALLBACK: FloatingDeal[] = [
  { route: "Madrid → Reikiavik", price: "119€", href: "/deals?destination=KEF&max_price=200", external: false },
  { route: "Barcelona → Marrakech", price: "49€", href: "/deals?destination=RAK&max_price=100", external: false },
  { route: "Madrid → Estambul", price: "89€", href: "/deals?destination=IST&max_price=150", external: false },
];

interface SkyHeroProps {
  deals_total?: number;
  floating?: FloatingDeal[];
}

export function SkyHero({ deals_total = 50, floating }: SkyHeroProps) {
  const cards = floating && floating.length > 0 ? floating : FLOATING_FALLBACK;
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [cabin, setCabin] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const o = (origin || "").toUpperCase();
    const d = (destination || "").toUpperCase();

    // VV14 — Búsqueda REAL: si hay origen + destino + fecha de ida, redirigimos
    // directo al booking engine (Skyscanner con TP marker / Travelpayouts si
    // configurado). El usuario ve precios LIVE para esa ruta+fecha exacta.
    if (o.length === 3 && d.length === 3 && dateFrom) {
      const url = getBookingUrl({
        origin: o,
        destination: d,
        dateOut: dateFrom,
        dateRet: dateTo || undefined,
      });
      // open en nueva pestaña — patrón estándar para CTAs externos
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    // Fallback: si falta info, llevamos a /deals con los filtros que tengamos
    // (sirve para "todos los chollos desde MAD" sin destino concreto, etc).
    const params = new URLSearchParams();
    if (o) params.set("origin", o);
    if (d) params.set("destination", d);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (cabin) params.set("cabin", cabin);
    if (maxPrice) params.set("max_price", maxPrice);
    router.push(params.toString() ? `/deals?${params.toString()}` : "/deals");
  }

  return (
    <div className="sky-hero">
      <div className="sky-hero-clouds" aria-hidden="true" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pb-24 text-center text-white">
        {/* Badge live */}
        <span className="sky-badge">
          <span className="sky-badge-dot" aria-hidden="true" />
          {deals_total} chollos activos · motor en directo
        </span>

        {/* H1 hero */}
        <h1 className="sky-h1">
          Vuelos imposibles
          <br />
          al precio <em>posible</em>.
        </h1>

        {/* Lead */}
        <p className="sky-lead">
          Error fares, business class barato y los mejores chollos europeos.
          Rastreamos 750+ aerolíneas mientras tú vives.
        </p>

        {/* Search bar — VV7 funcional con autocomplete + dates ida/vuelta + cabina */}
        <form
          className="sky-searchbar-rich"
          role="search"
          onSubmit={handleSubmit}
          aria-label="Buscar vuelos"
        >
          <div className="sky-row sky-row-airports">
            <div className="sky-cell">
              <AirportCombobox
                label="Desde"
                value={origin}
                onChange={setOrigin}
                placeholder="Ciudad, país o IATA"
              />
            </div>
            <div className="sky-cell">
              <AirportCombobox
                label="A"
                value={destination}
                onChange={setDestination}
                placeholder="Cualquier destino"
              />
            </div>
          </div>
          <div className="sky-row sky-row-meta">
            <label className="sky-cell sky-cell-mini">
              <span className="sky-cell-label">Ida</span>
              <input
                type="date"
                className="sky-cell-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Fecha de ida (opcional)"
              />
            </label>
            <label className="sky-cell sky-cell-mini">
              <span className="sky-cell-label">Vuelta</span>
              <input
                type="date"
                className="sky-cell-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Fecha de vuelta (opcional)"
              />
            </label>
            <label className="sky-cell sky-cell-mini">
              <span className="sky-cell-label">Cabina</span>
              <select
                className="sky-cell-input sky-cell-select"
                value={cabin}
                onChange={(e) => setCabin(e.target.value)}
                aria-label="Clase de cabina"
              >
                <option value="">Cualquiera</option>
                <option value="economy">Economy</option>
                <option value="premium_economy">Premium Eco</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </label>
            <label className="sky-cell sky-cell-mini">
              <span className="sky-cell-label">Precio máx</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={50}
                className="sky-cell-input"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="€ sin límite"
                aria-label="Precio máximo en euros (opcional)"
              />
            </label>
            <button type="submit" className="sky-search-btn">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Buscar
            </button>
          </div>
        </form>

        {/* Floating deal cards — 3-6 chollos reales (server props) */}
        <div className="sky-floating">
          {cards.map((d) => {
            const linkProps = d.external
              ? { href: d.href, target: "_blank" as const, rel: "noopener noreferrer" }
              : { href: d.href };
            return (
              <Link {...linkProps} key={d.route + d.price} className="sky-floatcard">
                <span className="sky-fc-route">{d.route}</span>
                <span className="sky-fc-price">{d.price}</span>
                {d.badge && <span className="sky-fc-badge">{d.badge}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
