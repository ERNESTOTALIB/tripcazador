"use client";
/**
 * TripCazador — SearchBar
 * Buscador en vivo (origen/destino/fechas/precio). Llama a /api/search
 * del FastAPI y renderiza los resultados debajo.
 *
 * Uso:
 *   <SearchBar />                // anywhere → anywhere
 *   <SearchBar defaultOrigin="BSL" />
 */

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  searchDeals,
  searchDealsLive,
  getAirports,
  getDeals,
  formatDate,
  getCabinLabel,
  type Deal,
  type SearchParams,
  type Airport,
} from "@/lib/api";

// ──────────────────────────────────────────────────────────────
// Alternativas cuando la búsqueda en vivo no devuelve nada.
// Tres niveles (orden de relevancia para el usuario):
//   1) Mismas rutas, fechas cercanas (±3 días) — suele ser la causa real
//   2) Mismo destino desde otros hubs cercanos (p. ej. MAD vs. BCN)
//   3) Chollos trending del día, ordenados por score
// ──────────────────────────────────────────────────────────────
type AlternativesBlock = {
  nearbyDates: Deal[];       // mismas IATAs, fechas ±3
  sameDestination: Deal[];   // mismo destino, cualquier origen
  trending: Deal[];          // lo más llamativo ahora mismo
};

// Hubs alternativos para rutas españolas/DACH (los más comunes)
const ALT_ORIGINS: Record<string, string[]> = {
  MAD: ["BCN", "VLC", "SVQ", "AGP", "BIO"],
  BCN: ["MAD", "VLC", "PMI", "AGP"],
  AGP: ["MAD", "BCN", "SVQ"],
  VLC: ["MAD", "BCN", "AGP"],
  BIO: ["MAD", "BCN", "SDR"],
  SVQ: ["MAD", "BCN", "AGP"],
  PMI: ["MAD", "BCN", "VLC"],
  BSL: ["ZRH", "GVA", "FRA", "MUC"],
  ZRH: ["BSL", "GVA", "MUC"],
  GVA: ["BSL", "ZRH", "CDG"],
  FRA: ["MUC", "STR", "DUS"],
  MUC: ["FRA", "STR", "VIE"],
  VIE: ["MUC", "BUD", "SZG"],
};

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Aeropuertos más buscados por el público objetivo (DACH hispanohablante).
// Orden = prioridad en el autocomplete.
const TOP_AIRPORTS: Array<{ iata: string; city: string; country: string }> = [
  // DACH hub origins
  { iata: "BSL", city: "Basilea/Mulhouse", country: "Suiza/Francia" },
  { iata: "ZRH", city: "Zúrich", country: "Suiza" },
  { iata: "GVA", city: "Ginebra", country: "Suiza" },
  { iata: "BRN", city: "Berna", country: "Suiza" },
  { iata: "FRA", city: "Fráncfort", country: "Alemania" },
  { iata: "MUC", city: "Múnich", country: "Alemania" },
  { iata: "BER", city: "Berlín", country: "Alemania" },
  { iata: "HAM", city: "Hamburgo", country: "Alemania" },
  { iata: "DUS", city: "Düsseldorf", country: "Alemania" },
  { iata: "STR", city: "Stuttgart", country: "Alemania" },
  { iata: "VIE", city: "Viena", country: "Austria" },
  { iata: "SZG", city: "Salzburgo", country: "Austria" },
  // España
  { iata: "MAD", city: "Madrid", country: "España" },
  { iata: "BCN", city: "Barcelona", country: "España" },
  { iata: "AGP", city: "Málaga", country: "España" },
  { iata: "VLC", city: "Valencia", country: "España" },
  { iata: "SVQ", city: "Sevilla", country: "España" },
  { iata: "BIO", city: "Bilbao", country: "España" },
  { iata: "PMI", city: "Palma de Mallorca", country: "España" },
  { iata: "TFS", city: "Tenerife", country: "España" },
  { iata: "LPA", city: "Gran Canaria", country: "España" },
  // Hubs grandes para comparar precios
  { iata: "CDG", city: "París CDG", country: "Francia" },
  { iata: "AMS", city: "Ámsterdam", country: "Países Bajos" },
  { iata: "LHR", city: "Londres Heathrow", country: "Reino Unido" },
  { iata: "LGW", city: "Londres Gatwick", country: "Reino Unido" },
  { iata: "FCO", city: "Roma", country: "Italia" },
  { iata: "MXP", city: "Milán", country: "Italia" },
  { iata: "LIS", city: "Lisboa", country: "Portugal" },
  { iata: "OPO", city: "Oporto", country: "Portugal" },
  { iata: "ATH", city: "Atenas", country: "Grecia" },
  // Long-haul populares
  { iata: "JFK", city: "Nueva York", country: "EEUU" },
  { iata: "LAX", city: "Los Ángeles", country: "EEUU" },
  { iata: "MIA", city: "Miami", country: "EEUU" },
  { iata: "DXB", city: "Dubái", country: "EAU" },
  { iata: "BKK", city: "Bangkok", country: "Tailandia" },
  { iata: "NRT", city: "Tokio", country: "Japón" },
  { iata: "SIN", city: "Singapur", country: "Singapur" },
  { iata: "GRU", city: "São Paulo", country: "Brasil" },
  { iata: "EZE", city: "Buenos Aires", country: "Argentina" },
  { iata: "SCL", city: "Santiago", country: "Chile" },
  { iata: "MEX", city: "Ciudad de México", country: "México" },
  { iata: "CUN", city: "Cancún", country: "México" },
  { iata: "HAV", city: "La Habana", country: "Cuba" },
  { iata: "SDQ", city: "Santo Domingo", country: "Rep. Dominicana" },
  // África / Asia menos habitual (valor añadido vs. competencia)
  { iata: "ZNZ", city: "Zanzíbar", country: "Tanzania" },
  { iata: "NBO", city: "Nairobi", country: "Kenia" },
  { iata: "MBA", city: "Mombasa", country: "Kenia" },
  { iata: "CAI", city: "El Cairo", country: "Egipto" },
  { iata: "HRG", city: "Hurgada", country: "Egipto" },
  { iata: "CMN", city: "Casablanca", country: "Marruecos" },
  { iata: "RAK", city: "Marrakech", country: "Marruecos" },
  { iata: "DEL", city: "Nueva Delhi", country: "India" },
  { iata: "CMB", city: "Colombo", country: "Sri Lanka" },
  { iata: "MLE", city: "Malé", country: "Maldivas" },
  { iata: "HKT", city: "Phuket", country: "Tailandia" },
  { iata: "DPS", city: "Bali", country: "Indonesia" },
];

interface Props {
  defaultOrigin?: string;
  defaultDestination?: string;
  compact?: boolean;
}

export default function SearchBar({
  defaultOrigin = "",
  defaultDestination = "",
  compact = false,
}: Props) {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [cabin, setCabin] = useState("");
  const [results, setResults] = useState<Deal[]>([]);
  const [alternatives, setAlternatives] = useState<AlternativesBlock | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateWarning, setDateWarning] = useState<string | null>(null);

  const [originFocus, setOriginFocus] = useState(false);
  const [destFocus, setDestFocus] = useState(false);

  // Catálogo dinámico cargado del backend (/api/airports). Se fusiona
  // con TOP_AIRPORTS priorizando estos últimos en el orden del dropdown.
  const [remoteAirports, setRemoteAirports] = useState<Airport[]>([]);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;
    getAirports({ limit: 600 })
      .then((list) => {
        if (!cancelled) setRemoteAirports(list);
      })
      .catch(() => {
        /* silencio: si falla, usamos solo TOP_AIRPORTS */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Autocomplete: filtra TOP_AIRPORTS por el texto actual, extendido con
  // el catálogo remoto (si cargó) para que cualquier IATA del backend aparezca.
  const originMatches = useMemo(
    () => filterAirports(origin, remoteAirports),
    [origin, remoteAirports],
  );
  const destMatches = useMemo(
    () => filterAirports(destination, remoteAirports),
    [destination, remoteAirports],
  );

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setAlternatives(null);
    setDateWarning(null);
    setSearched(true);

    // Validación UX: si "hasta" es anterior a "desde" lo auto-corregimos
    // en memoria (no mutamos el input salvo aviso visible).
    let effectiveDateTo = dateTo;
    if (dateFrom && dateTo && dateTo < dateFrom) {
      effectiveDateTo = shiftDate(dateFrom, 7);
      setDateWarning(
        `Tu fecha "hasta" era anterior a "desde". Buscamos hasta ${effectiveDateTo} (7 días después).`,
      );
    }

    // Decisión: si hay origen, destino y fecha → búsqueda en caliente (RapidAPI+Ryanair).
    // Si falta algo → fallback al search sobre deals.json indexados.
    const hasLiveShape = !!(origin && destination && dateFrom);

    try {
      let data: Deal[] = [];

      if (hasLiveShape) {
        data = await searchDealsLive({
          origin,
          destination,
          date_out: dateFrom,
          cabin: (cabin || "economy") as "economy" | "premium_economy" | "business" | "first",
          limit: 20,
        });

        // Filtro cliente: max_price (el endpoint live no lo aplica)
        if (maxPrice !== "" && data.length > 0) {
          data = data.filter((d) => d.price_eur <= Number(maxPrice));
        }

        // Si live devuelve 0, intentamos el fallback sobre deals.json para que
        // el usuario al menos vea ofertas indexadas relacionadas.
        if (data.length === 0) {
          data = await searchDeals({
            origin,
            destination,
            date_from: dateFrom,
            date_to: effectiveDateTo || dateFrom,
            max_price: maxPrice === "" ? undefined : Number(maxPrice),
            cabin: cabin || undefined,
            limit: 30,
          });
        }
      } else {
        const params: SearchParams = {
          origin: origin || undefined,
          destination: destination || undefined,
          date_from: dateFrom || undefined,
          date_to: effectiveDateTo || undefined,
          max_price: maxPrice === "" ? undefined : Number(maxPrice),
          cabin: cabin || undefined,
          limit: 30,
        };
        data = await searchDeals(params);
      }

      setResults(data);

      // Si no hay resultados, cargamos alternativas en cascada para
      // que el usuario nunca vea una pantalla vacía sin opciones.
      if (data.length === 0) {
        const alts = await buildAlternatives({
          origin,
          destination,
          dateFrom,
          cabin: cabin || undefined,
          maxPrice: maxPrice === "" ? undefined : Number(maxPrice),
        });
        setAlternatives(alts);

        const hasAnyAlt =
          alts.nearbyDates.length + alts.sameDestination.length + alts.trending.length > 0;

        if (hasAnyAlt) {
          setError(null); // el error "duro" se reemplaza por el panel de alternativas
        } else {
          setError(
            hasLiveShape
              ? "No encontramos vuelos para esa combinación ni alternativas cercanas. Prueba otra ruta."
              : "Añade origen, destino y fecha para búsqueda en vivo, o prueba con filtros más amplios.",
          );
        }
      }
    } catch (err) {
      setError("No pudimos conectar con el servidor. Inténtalo de nuevo en unos minutos.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  // ──────────────────────────────────────────────
  // Constructor de alternativas (se ejecuta sólo si la búsqueda primaria
  // devuelve 0 resultados). Todas las queries van contra el índice indexado
  // (/api/search) para que sean rápidas y estén siempre disponibles.
  // ──────────────────────────────────────────────
  async function buildAlternatives(opts: {
    origin: string;
    destination: string;
    dateFrom: string;
    cabin?: string;
    maxPrice?: number;
  }): Promise<AlternativesBlock> {
    const { origin: o, destination: d, dateFrom: df, cabin: c, maxPrice: mp } = opts;

    // 1) Fechas cercanas: ventana ancha alrededor de la fecha pedida
    let nearbyDatesPromise: Promise<Deal[]> = Promise.resolve([]);
    if (o && d && df) {
      nearbyDatesPromise = searchDeals({
        origin: o,
        destination: d,
        date_from: shiftDate(df, -14),
        date_to: shiftDate(df, 30),
        cabin: c,
        max_price: mp,
        limit: 12,
      });
    }

    // 2) Mismo destino, otros hubs de salida (cualquier fecha, ordenadas por score)
    let sameDestinationPromise: Promise<Deal[]> = Promise.resolve([]);
    if (d) {
      // Lanzamos una búsqueda sin origen fijado para captar todos los chollos
      // al destino, y después quitamos la combinación original del usuario.
      // Los hubs "preferidos" (ALT_ORIGINS) se priorizan dentro del orden final.
      const preferred = o ? new Set(ALT_ORIGINS[o] || []) : new Set<string>();
      sameDestinationPromise = searchDeals({
        destination: d,
        cabin: c,
        max_price: mp,
        limit: 20,
      }).then((list) => {
        const filtered = list.filter((x) => x.origin !== o);
        // Primero los que están en ALT_ORIGINS, luego el resto — preservando orden original
        const head = filtered.filter((x) => preferred.has(x.origin));
        const tail = filtered.filter((x) => !preferred.has(x.origin));
        return [...head, ...tail].slice(0, 8);
      });
    }

    // 3) Trending: chollos del día (score alto, cualquier ruta)
    const trendingPromise = getDeals({ limit: 12 })
      .then((r) => r.deals || [])
      .catch(() => [] as Deal[]);

    const [nearbyDates, sameDestination, trending] = await Promise.all([
      nearbyDatesPromise,
      sameDestinationPromise,
      trendingPromise,
    ]);

    // Dedup entre secciones: si un deal ya está en nearbyDates, no lo repetimos en
    // sameDestination; y si está en cualquiera de las dos, tampoco en trending.
    const seen = new Set<string>();
    const uniq = (list: Deal[]) => {
      const out: Deal[] = [];
      for (const x of list) {
        if (seen.has(x.id)) continue;
        seen.add(x.id);
        out.push(x);
      }
      return out;
    };
    return {
      nearbyDates: uniq(nearbyDates).slice(0, 6),
      sameDestination: uniq(sameDestination).slice(0, 6),
      trending: uniq(trending).slice(0, 6),
    };
  }

  // API pública: permite a la home prellenar el buscador desde fuera y disparar
  // la búsqueda (usado por los chips "Madrid → NYC" etc). Expuesto vía un
  // CustomEvent global para evitar acoplar el ref de form con los padres.
  useEffect(() => {
    function onPrefill(e: Event) {
      const detail = (e as CustomEvent).detail as {
        origin?: string;
        destination?: string;
        date_from?: string;
        cabin?: string;
      };
      if (detail?.origin) setOrigin(detail.origin.toUpperCase());
      if (detail?.destination) setDestination(detail.destination.toUpperCase());
      if (detail?.date_from) setDateFrom(detail.date_from);
      if (detail?.cabin) setCabin(detail.cabin);
      // Scroll al form para UX clara
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        // Disparar submit en el siguiente tick para que los setState se apliquen
        setTimeout(() => handleSubmit(), 50);
      });
    }
    window.addEventListener("tripcazador:prefill-search", onPrefill);
    return () => window.removeEventListener("tripcazador:prefill-search", onPrefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atajo: Enter en cualquier input envía el form.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" && formRef.current && document.activeElement?.closest("form") === formRef.current) {
        handleSubmit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, dateFrom, dateTo, maxPrice, cabin]);

  return (
    <section className={compact ? "w-full" : "w-full max-w-6xl mx-auto"}>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="bg-slate-900/70 backdrop-blur ring-1 ring-slate-700/50 rounded-2xl p-4 md:p-6 shadow-xl"
        aria-label="Buscador de vuelos"
      >
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {/* Origen */}
          <div className="md:col-span-2 relative">
            <label
              htmlFor="search-origin"
              className="block text-xs uppercase tracking-wider text-slate-300 mb-1"
            >
              Desde
            </label>
            <input
              id="search-origin"
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase().slice(0, 40))}
              onFocus={() => setOriginFocus(true)}
              onBlur={() => setTimeout(() => setOriginFocus(false), 150)}
              placeholder="Ciudad o IATA (BSL, MAD...)"
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoComplete="off"
              role="combobox"
              aria-expanded={originFocus && originMatches.length > 0}
              aria-controls="origin-listbox"
              aria-autocomplete="list"
            />
            {originFocus && originMatches.length > 0 && (
              <AutocompleteList
                id="origin-listbox"
                items={originMatches}
                onPick={(code) => setOrigin(code)}
              />
            )}
          </div>

          {/* Destino */}
          <div className="md:col-span-2 relative">
            <label
              htmlFor="search-destination"
              className="block text-xs uppercase tracking-wider text-slate-300 mb-1"
            >
              A
            </label>
            <input
              id="search-destination"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value.toUpperCase().slice(0, 40))}
              onFocus={() => setDestFocus(true)}
              onBlur={() => setTimeout(() => setDestFocus(false), 150)}
              placeholder="Cualquier sitio, país o IATA"
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoComplete="off"
              role="combobox"
              aria-expanded={destFocus && destMatches.length > 0}
              aria-controls="dest-listbox"
              aria-autocomplete="list"
            />
            {destFocus && destMatches.length > 0 && (
              <AutocompleteList
                id="dest-listbox"
                items={destMatches}
                onPick={(code) => setDestination(code)}
              />
            )}
          </div>

          {/* Fechas */}
          <div>
            <label
              htmlFor="search-date-from"
              className="block text-xs uppercase tracking-wider text-slate-300 mb-1"
            >
              Salida desde
            </label>
            <input
              id="search-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label
              htmlFor="search-date-to"
              className="block text-xs uppercase tracking-wider text-slate-300 mb-1"
            >
              Hasta
            </label>
            <input
              id="search-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Segunda fila: precio + cabina + botón */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label
              htmlFor="search-max-price"
              className="block text-xs uppercase tracking-wider text-slate-300 mb-1"
            >
              Precio máximo (€)
            </label>
            <input
              id="search-max-price"
              type="number"
              min="0"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Sin límite"
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="search-cabin"
              className="block text-xs uppercase tracking-wider text-slate-300 mb-1"
            >
              Cabina
            </label>
            <select
              id="search-cabin"
              value={cabin}
              onChange={(e) => setCabin(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">Cualquiera</option>
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-600 text-slate-900 font-semibold px-4 py-2 transition"
            >
              {loading
                ? origin && destination && dateFrom
                  ? "Buscando en vivo…"
                  : "Buscando…"
                : origin && destination && dateFrom
                  ? "Buscar en vivo"
                  : "Buscar ofertas"}
            </button>
          </div>
        </div>
      </form>

      {/* Aviso ligero de fecha auto-corregida (no es un error) */}
      {dateWarning && (
        <p className="mt-3 text-xs text-amber-300/80" role="status">
          ⚠︎ {dateWarning}
        </p>
      )}

      {/* Resultados */}
      {searched && (
        <div className="mt-6" aria-live="polite" aria-atomic="true">
          {results.length > 0 ? (
            <>
              <p className="text-slate-300 mb-3 text-sm">
                {results.length} {results.length === 1 ? "oferta" : "ofertas"} coinciden con tu búsqueda.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((d) => (
                  <SearchResultCard key={d.id} deal={d} />
                ))}
              </ul>
            </>
          ) : alternatives && (
              alternatives.nearbyDates.length +
                alternatives.sameDestination.length +
                alternatives.trending.length >
              0
            ) ? (
            <NoResultsWithAlternatives
              origin={origin}
              destination={destination}
              dateFrom={dateFrom}
              block={alternatives}
              onRetry={(patch) => {
                if (patch.dateFrom !== undefined) setDateFrom(patch.dateFrom);
                if (patch.origin !== undefined) setOrigin(patch.origin);
                if (patch.destination !== undefined) setDestination(patch.destination);
                // dejar que el siguiente frame aplique los setState y relanzar
                requestAnimationFrame(() => setTimeout(() => handleSubmit(), 40));
              }}
            />
          ) : error ? (
            <p role="alert" className="text-amber-300">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Panel "no hay resultados, aquí tienes alternativas"
// ──────────────────────────────────────────────────────────────
function NoResultsWithAlternatives({
  origin,
  destination,
  dateFrom,
  block,
  onRetry,
}: {
  origin: string;
  destination: string;
  dateFrom: string;
  block: AlternativesBlock;
  onRetry: (patch: { origin?: string; destination?: string; dateFrom?: string }) => void;
}) {
  const { nearbyDates, sameDestination, trending } = block;
  const routeLabel =
    origin && destination ? `${origin} → ${destination}` : origin || destination || "esa búsqueda";

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-slate-900/60 ring-1 ring-slate-700/60 p-4 md:p-5">
        <h3 className="text-white font-semibold">
          No hay match exacto para {routeLabel}
          {dateFrom && <> el {formatDate(dateFrom)}</>}
        </h3>
        <p className="text-slate-300 text-sm mt-1">
          Te enseñamos chollos parecidos para que no salgas de vacío. La búsqueda en vivo
          cubre 48 h hacia delante; para fechas más lejanas, lo mejor suele ser esta lista.
        </p>
      </div>

      {nearbyDates.length > 0 && (
        <AltSection
          title="Mismas rutas, fechas cercanas"
          subtitle={
            origin && destination
              ? `${origin} → ${destination} con fecha flexible ±2 semanas`
              : "Fechas cercanas con precio conocido"
          }
          deals={nearbyDates}
          footerCta={
            dateFrom ? (
              <button
                type="button"
                onClick={() => onRetry({ dateFrom: shiftDate(dateFrom, 7) })}
                className="text-amber-300 hover:text-amber-200 text-sm font-medium underline underline-offset-4"
              >
                Reintentar en vivo con la fecha +7 días →
              </button>
            ) : null
          }
        />
      )}

      {sameDestination.length > 0 && (
        <AltSection
          title="Mismo destino desde otros aeropuertos"
          subtitle={
            destination
              ? `Chollos hacia ${destination} desde hubs cercanos`
              : "Alternativas de destino"
          }
          deals={sameDestination}
        />
      )}

      {trending.length > 0 && (
        <AltSection
          title="Chollos destacados ahora mismo"
          subtitle="Las mejores anomalías de precio que el motor está siguiendo"
          deals={trending}
        />
      )}
    </div>
  );
}

function AltSection({
  title,
  subtitle,
  deals,
  footerCta,
}: {
  title: string;
  subtitle?: string;
  deals: Deal[];
  footerCta?: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-3">
        <h4 className="text-white font-semibold">{title}</h4>
        {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
      </header>
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {deals.map((d) => (
          <SearchResultCard key={d.id} deal={d} />
        ))}
      </ul>
      {footerCta && <div className="mt-3">{footerCta}</div>}
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// Subcomponentes
// ──────────────────────────────────────────────────────────────

function normalize(s: string): string {
  // Accent-insensitive: NFD + remove combining marks (U+0300..U+036F)
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function filterAirports(
  query: string,
  remote: Airport[] = [],
): Array<{ iata: string; city: string; country: string }> {
  const q = normalize(query.trim());

  // Merge: TOP_AIRPORTS primero (prioridad), luego el catálogo remoto sin
  // duplicar códigos IATA.
  const seen = new Set(TOP_AIRPORTS.map((a) => a.iata));
  const merged: Array<{ iata: string; city: string; country: string }> = [
    ...TOP_AIRPORTS,
  ];
  for (const a of remote) {
    if (!seen.has(a.iata)) {
      merged.push({ iata: a.iata, city: a.city, country: a.country });
      seen.add(a.iata);
    }
  }

  if (!q) return merged.slice(0, 8);

  return merged
    .filter(
      (a) =>
        normalize(a.iata).includes(q) ||
        normalize(a.city).includes(q) ||
        normalize(a.country).includes(q),
    )
    .slice(0, 8);
}

function AutocompleteList({
  id,
  items,
  onPick,
}: {
  id?: string;
  items: Array<{ iata: string; city: string; country: string }>;
  onPick: (code: string) => void;
}) {
  return (
    <ul
      id={id}
      className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg bg-slate-800 border border-slate-600 shadow-2xl"
      role="listbox"
    >
      {items.map((a) => (
        <li key={a.iata} role="option" aria-selected="false">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(a.iata);
            }}
            aria-label={`Seleccionar ${a.city}, ${a.country} (${a.iata})`}
            className="w-full text-left px-3 py-2 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <span className="font-mono font-semibold text-amber-300">{a.iata}</span>{" "}
            <span className="text-slate-200">{a.city}</span>{" "}
            <span className="text-slate-400 text-sm">· {a.country}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function SearchResultCard({ deal }: { deal: Deal }) {
  const savings = deal.savings_pct ? `-${Math.round(deal.savings_pct)}%` : "";
  return (
    <li className="rounded-xl bg-slate-900/60 ring-1 ring-slate-700/60 hover:ring-amber-400/60 transition overflow-hidden">
      <Link href={`/deals/${deal.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-slate-400">
              {deal.origin} → {deal.destination}
            </p>
            <h3 className="mt-1 text-base font-semibold text-white truncate">
              {deal.city_to || deal.destination}
            </h3>
            <p className="text-xs text-slate-500">{deal.country_to}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-amber-300">
              {Math.round(deal.price_eur)}€
            </p>
            {savings && (
              <p className="text-xs text-emerald-400 font-semibold">{savings}</p>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>{formatDate(deal.date_out)}</span>
          <span>
            {deal.airline_name || deal.airline} · {getCabinLabel(deal.cabin)}
          </span>
        </div>
      </Link>
    </li>
  );
}
