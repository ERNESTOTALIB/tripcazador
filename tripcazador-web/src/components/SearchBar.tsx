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
import { track } from "@/lib/analytics";

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

// ──────────────────────────────────────────────────────────────
// Grupos: "España", "DACH"... — expanden a varios IATAs.
// Cuando el usuario elige un grupo del autocomplete, el input guarda el
// formato `GRP:<slug>` y en submit lanzamos N búsquedas en paralelo.
// ──────────────────────────────────────────────────────────────
type AirportGroup = {
  slug: string;          // id estable (ES, DE, DACH…)
  label: string;         // lo que ve el usuario ("España (9 aeropuertos)")
  short: string;         // prefijo para el input (ES, DACH…)
  aliases: string[];     // lo que escribe el usuario (debe normalizarse)
  iatas: string[];       // aeropuertos reales para la búsqueda
};

const AIRPORT_GROUPS: AirportGroup[] = [
  {
    slug: "ES",
    label: "España — todos los aeropuertos principales",
    short: "España",
    aliases: ["espana", "spain", "esp", "iberia", "peninsula iberica"],
    iatas: ["MAD", "BCN", "AGP", "VLC", "SVQ", "BIO", "PMI", "IBZ", "TFS", "LPA", "ALC"],
  },
  {
    slug: "DE",
    label: "Alemania — FRA/MUC/BER/HAM/DUS/STR",
    short: "Alemania",
    aliases: ["alemania", "germany", "deutschland", "ger"],
    iatas: ["FRA", "MUC", "BER", "HAM", "DUS", "STR", "CGN"],
  },
  {
    slug: "CH",
    label: "Suiza — ZRH/GVA/BSL/BRN",
    short: "Suiza",
    aliases: ["suiza", "switzerland", "schweiz", "helvetia"],
    iatas: ["ZRH", "GVA", "BSL", "BRN"],
  },
  {
    slug: "AT",
    label: "Austria — VIE/SZG/INN",
    short: "Austria",
    aliases: ["austria", "osterreich", "wien"],
    iatas: ["VIE", "SZG", "INN"],
  },
  {
    slug: "DACH",
    label: "DACH — Alemania + Austria + Suiza",
    short: "DACH",
    aliases: ["dach", "centroeuropa", "central europe"],
    iatas: ["FRA", "MUC", "ZRH", "VIE", "BER", "HAM", "GVA", "BSL", "SZG", "BRN", "STR"],
  },
  {
    slug: "IT",
    label: "Italia — FCO/MXP/BLQ/VCE/NAP",
    short: "Italia",
    aliases: ["italia", "italy", "italiano"],
    iatas: ["FCO", "MXP", "LIN", "BLQ", "VCE", "NAP", "BRI"],
  },
  {
    slug: "FR",
    label: "Francia — CDG/ORY/NCE/LYS/MRS",
    short: "Francia",
    aliases: ["francia", "france", "paris"],
    iatas: ["CDG", "ORY", "NCE", "LYS", "MRS", "TLS", "BOD"],
  },
  {
    slug: "PT",
    label: "Portugal — LIS/OPO/FAO",
    short: "Portugal",
    aliases: ["portugal", "lisboa"],
    iatas: ["LIS", "OPO", "FAO"],
  },
  {
    slug: "UK",
    label: "Reino Unido — LHR/LGW/STN/LTN/MAN/EDI",
    short: "Reino Unido",
    aliases: ["uk", "inglaterra", "england", "britain", "reino unido", "londres", "london"],
    iatas: ["LHR", "LGW", "STN", "LTN", "MAN", "EDI", "BHX"],
  },
  {
    slug: "NL",
    label: "Países Bajos — AMS/EIN/RTM",
    short: "Países Bajos",
    aliases: ["paises bajos", "holanda", "netherlands", "ams"],
    iatas: ["AMS", "EIN", "RTM"],
  },
  {
    slug: "SCAN",
    label: "Escandinavia — CPH/ARN/OSL/HEL",
    short: "Escandinavia",
    aliases: ["escandinavia", "nordic", "nordicos", "paises nordicos", "scandinavia"],
    iatas: ["CPH", "ARN", "OSL", "HEL", "GOT", "BGO"],
  },
  {
    slug: "GR",
    label: "Grecia — ATH/HER/SKG/JMK/JTR",
    short: "Grecia",
    aliases: ["grecia", "greece", "greek", "islas griegas", "cycladas"],
    iatas: ["ATH", "HER", "SKG", "JMK", "JTR", "RHO", "CFU"],
  },
  {
    slug: "US",
    label: "EEUU — JFK/LAX/MIA/ORD/SFO/BOS",
    short: "EEUU",
    aliases: ["eeuu", "usa", "united states", "estados unidos"],
    iatas: ["JFK", "EWR", "LAX", "MIA", "ORD", "SFO", "BOS", "IAD", "DFW", "SEA"],
  },
  {
    slug: "SEA",
    label: "Sudeste asiático — BKK/HKT/SIN/DPS/KUL",
    short: "Sudeste asiático",
    aliases: ["sudeste asiatico", "asia sudeste", "sea", "southeast asia", "tailandia", "bali", "indonesia"],
    iatas: ["BKK", "HKT", "DMK", "SIN", "DPS", "CGK", "KUL"],
  },
  {
    slug: "JP",
    label: "Japón — NRT/HND/KIX/NGO",
    short: "Japón",
    aliases: ["japon", "japan", "nippon", "tokio", "tokyo"],
    iatas: ["NRT", "HND", "KIX", "NGO", "FUK"],
  },
  {
    slug: "CARIB",
    label: "Caribe — HAV/SDQ/PUJ/CUN/MBJ",
    short: "Caribe",
    aliases: ["caribe", "caribbean", "cuba", "republica dominicana", "riviera maya"],
    iatas: ["HAV", "SDQ", "PUJ", "CUN", "MBJ", "NAS"],
  },
  {
    slug: "MA",
    label: "Marruecos — CMN/RAK/FEZ/AGA",
    short: "Marruecos",
    aliases: ["marruecos", "morocco", "marrakech", "casablanca"],
    iatas: ["CMN", "RAK", "FEZ", "AGA", "TNG"],
  },
  {
    slug: "SAM",
    label: "Sudamérica — EZE/SCL/GRU/BOG/LIM",
    short: "Sudamérica",
    aliases: ["sudamerica", "latinoamerica", "south america", "latam"],
    iatas: ["EZE", "SCL", "GRU", "GIG", "BOG", "LIM", "UIO", "MVD"],
  },
];

// Item "unificado" que usa el autocomplete — puede ser un aeropuerto
// concreto o un grupo expansible.
type SuggestionItem =
  | { kind: "airport"; iata: string; city: string; country: string }
  | { kind: "group"; group: AirportGroup };

// Detecta si el contenido de un input es un grupo y devuelve su definición
function matchGroupInput(input: string): AirportGroup | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.startsWith("GRP:")) {
    const slug = trimmed.slice(4);
    return AIRPORT_GROUPS.find((g) => g.slug === slug) ?? null;
  }
  return null;
}

// Distancia de Levenshtein truncada (máx 3) — suficiente para corregir typos
// de 1-2 caracteres en nombres de ciudades sin pagar el coste del algoritmo
// completo en cada tecla.
function fuzzyDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

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
  const [flexDates, setFlexDates] = useState(false);
  const [directOnly, setDirectOnly] = useState(false);
  const [showMoreOpts, setShowMoreOpts] = useState(false);
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

  // Autocomplete: filtra TOP_AIRPORTS + grupos (España, DACH…) por el texto
  // actual, extendido con el catálogo remoto (si cargó). Soporta fuzzy
  // matching para typos cortos (madrit, barcelons).
  const originMatches = useMemo(
    () => filterSuggestions(origin, remoteAirports),
    [origin, remoteAirports],
  );
  const destMatches = useMemo(
    () => filterSuggestions(destination, remoteAirports),
    [destination, remoteAirports],
  );

  // Helper para pintar un input de forma "humana" si contiene un grupo.
  // Cuando el input es "GRP:ES" queremos que el placeholder interno muestre
  // "España (11 aeropuertos)" al usuario — no GRP:ES.
  function renderInputValue(raw: string): string {
    const g = matchGroupInput(raw);
    if (g) return `${g.short} · ${g.iatas.length} aeropuertos`;
    return raw;
  }

  function pickSuggestion(
    item: SuggestionItem,
    setter: (v: string) => void,
  ) {
    if (item.kind === "airport") setter(item.iata);
    else setter(`GRP:${item.group.slug}`);
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setAlternatives(null);
    setDateWarning(null);
    setSearched(true);

    // Analytics: top del embudo. El caller con grupo se marca como "group"
    // para poder separar en GA4 los dos caminos (broad discovery vs ruta
    // concreta).
    const hasGroup = !!matchGroupInput(origin) || !!matchGroupInput(destination);
    track({
      name: "search_submitted",
      params: {
        origin: origin || "(any)",
        destination: destination || "(any)",
        date_out: dateFrom || undefined,
        flex_days: flexDates ? 3 : 0,
        direct_only: directOnly,
        search_type: hasGroup ? "group" : "airport",
      },
    });

    // Validación UX: si "hasta" es anterior a "desde" lo auto-corregimos
    // en memoria (no mutamos el input salvo aviso visible).
    let effectiveDateTo = dateTo;
    if (dateFrom && dateTo && dateTo < dateFrom) {
      effectiveDateTo = shiftDate(dateFrom, 7);
      setDateWarning(
        `Tu fecha "hasta" era anterior a "desde". Buscamos hasta ${effectiveDateTo} (7 días después).`,
      );
    }

    // Expande grupos (GRP:ES, GRP:DACH…) a lista de IATAs.
    // Si el usuario no eligió grupo, el array contiene solo el IATA o "".
    const originGroup = matchGroupInput(origin);
    const destGroup = matchGroupInput(destination);
    const originList: string[] = originGroup ? originGroup.iatas : origin ? [origin] : [""];
    const destList: string[] = destGroup ? destGroup.iatas : destination ? [destination] : [""];

    // Ramo flex ±3: ventana adicional de búsqueda cuando el usuario marca "flex"
    const flexDays = flexDates ? 3 : 0;

    // Decisión: tenemos "shape live" (origen+destino+fecha concretos) si todos
    // los tres están definidos y NO hay grupos (un grupo multiplica demasiado
    // el coste del live; lo gestionamos con searchDeals indexado en vez).
    const hasLiveShape =
      !!(origin && destination && dateFrom) && !originGroup && !destGroup;

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

        // Si live devuelve 0, intentamos el fallback sobre deals.json con
        // ventana ampliada (flex) para que el usuario al menos vea ofertas
        // indexadas relacionadas.
        if (data.length === 0) {
          data = await searchDeals({
            origin,
            destination,
            date_from: shiftDate(dateFrom, -flexDays),
            date_to: effectiveDateTo
              ? shiftDate(effectiveDateTo, flexDays)
              : shiftDate(dateFrom, flexDays || 0),
            max_price: maxPrice === "" ? undefined : Number(maxPrice),
            cabin: cabin || undefined,
            limit: 30,
          });
        }
      } else {
        // Hay grupos o falta fecha: lanzamos N×M queries sobre el índice (rápido)
        // y fusionamos. Sirve también para el caso estándar "sin fecha".
        const queries: Promise<Deal[]>[] = [];
        for (const o of originList) {
          for (const d of destList) {
            const params: SearchParams = {
              origin: o || undefined,
              destination: d || undefined,
              date_from: dateFrom ? shiftDate(dateFrom, -flexDays) : undefined,
              date_to: effectiveDateTo
                ? shiftDate(effectiveDateTo, flexDays)
                : dateFrom
                  ? shiftDate(dateFrom, flexDays)
                  : undefined,
              max_price: maxPrice === "" ? undefined : Number(maxPrice),
              cabin: cabin || undefined,
              limit: 20,
            };
            queries.push(searchDeals(params));
          }
        }

        const chunks = await Promise.all(queries);
        const seen = new Set<string>();
        const merged: Deal[] = [];
        for (const c of chunks) {
          for (const deal of c) {
            if (!seen.has(deal.id)) {
              seen.add(deal.id);
              merged.push(deal);
            }
          }
        }
        // Sort by price ascendente; los chollos más baratos arriba
        merged.sort((a, b) => a.price_eur - b.price_eur);
        data = merged.slice(0, 40);
      }

      // Filtro cliente: directOnly — el backend no siempre lo expone
      if (directOnly && data.length > 0) {
        data = data.filter((d) => (d.stops ?? 0) === 0);
      }

      setResults(data);

      // Si no hay resultados, cargamos alternativas en cascada para
      // que el usuario nunca vea una pantalla vacía sin opciones.
      if (data.length === 0) {
        // Para alternativas usamos el primer IATA del grupo (si existe) como
        // "representante" — suficiente para buscar rutas cercanas/trending.
        const altOrigin = originGroup ? originGroup.iatas[0] : origin;
        const altDest = destGroup ? destGroup.iatas[0] : destination;
        const alts = await buildAlternatives({
          origin: altOrigin,
          destination: altDest,
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
  }, [origin, destination, dateFrom, dateTo, maxPrice, cabin, flexDates, directOnly]);

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
              value={renderInputValue(origin)}
              onChange={(e) => {
                // Al editar, desmontamos el marcador de grupo y empezamos
                // de cero con lo que escriba el usuario.
                const raw = e.target.value;
                setOrigin(raw.toUpperCase().slice(0, 40));
              }}
              onFocus={() => setOriginFocus(true)}
              onBlur={() => setTimeout(() => setOriginFocus(false), 150)}
              placeholder="Ciudad, país o IATA (ej: Madrid, España, MAD)"
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
                onPick={(item) => pickSuggestion(item, setOrigin)}
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
              value={renderInputValue(destination)}
              onChange={(e) => setDestination(e.target.value.toUpperCase().slice(0, 40))}
              onFocus={() => setDestFocus(true)}
              onBlur={() => setTimeout(() => setDestFocus(false), 150)}
              placeholder="Cualquier sitio, país, región o IATA"
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
                onPick={(item) => pickSuggestion(item, setDestination)}
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
                : origin && destination && dateFrom && !matchGroupInput(origin) && !matchGroupInput(destination)
                  ? "Buscar en vivo"
                  : "Buscar ofertas"}
            </button>
          </div>
        </div>

        {/* Toggle "Más opciones" */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowMoreOpts((v) => !v)}
            aria-expanded={showMoreOpts}
            aria-controls="search-advanced"
            className="text-xs text-slate-300 hover:text-amber-300 transition inline-flex items-center gap-1.5"
          >
            <span aria-hidden="true">{showMoreOpts ? "▾" : "▸"}</span>
            {showMoreOpts ? "Ocultar opciones avanzadas" : "Más opciones (flex fechas, directos…)"}
          </button>
        </div>

        {showMoreOpts && (
          <div
            id="search-advanced"
            className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl bg-slate-950/60 ring-1 ring-slate-700/50 p-3"
          >
            <label className="flex items-start gap-2 text-sm text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={flexDates}
                onChange={(e) => setFlexDates(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-amber-400 focus:ring-amber-400"
              />
              <span>
                Fechas flexibles <span className="text-slate-400">±3 días</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Amplía la ventana de búsqueda en el fallback indexado
                </span>
              </span>
            </label>

            <label className="flex items-start gap-2 text-sm text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={directOnly}
                onChange={(e) => setDirectOnly(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-amber-400 focus:ring-amber-400"
              />
              <span>
                Solo vuelos directos
                <span className="block text-xs text-slate-500 mt-0.5">
                  Oculta resultados con escalas
                </span>
              </span>
            </label>

            <div className="text-xs text-slate-400 leading-relaxed md:col-span-1">
              <p className="text-slate-300 font-semibold text-sm mb-1">Tip</p>
              Puedes escribir <span className="text-amber-300">"España"</span>,{" "}
              <span className="text-amber-300">"DACH"</span> o{" "}
              <span className="text-amber-300">"Caribe"</span> en origen/destino: el
              buscador expande a todos los aeropuertos del grupo.
            </div>
          </div>
        )}
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

function filterSuggestions(
  query: string,
  remote: Airport[] = [],
): SuggestionItem[] {
  const q = normalize(query.trim());

  // Merge: TOP_AIRPORTS primero (prioridad), luego el catálogo remoto sin
  // duplicar códigos IATA.
  const seen = new Set(TOP_AIRPORTS.map((a) => a.iata));
  const mergedAirports: Array<{ iata: string; city: string; country: string }> = [
    ...TOP_AIRPORTS,
  ];
  for (const a of remote) {
    if (!seen.has(a.iata)) {
      mergedAirports.push({ iata: a.iata, city: a.city, country: a.country });
      seen.add(a.iata);
    }
  }

  // Estado "sin query": mostramos unos pocos grupos top + los aeropuertos
  // más habituales para la audiencia objetivo (DACH hispanohablante).
  if (!q) {
    const topGroups: SuggestionItem[] = AIRPORT_GROUPS.filter((g) =>
      ["ES", "DE", "CH", "DACH", "IT", "UK"].includes(g.slug),
    ).map((g) => ({ kind: "group", group: g }));
    const topAirports: SuggestionItem[] = mergedAirports.slice(0, 6).map((a) => ({
      kind: "airport",
      iata: a.iata,
      city: a.city,
      country: a.country,
    }));
    return [...topGroups, ...topAirports].slice(0, 12);
  }

  // 1) Grupos que matchean por alias, slug o label
  const matchedGroups: SuggestionItem[] = [];
  for (const g of AIRPORT_GROUPS) {
    const hit =
      normalize(g.slug).includes(q) ||
      normalize(g.short).includes(q) ||
      normalize(g.label).includes(q) ||
      g.aliases.some((a) => normalize(a).includes(q));
    if (hit) matchedGroups.push({ kind: "group", group: g });
  }

  // 2) Aeropuertos por substring (rápido)
  const substring: Array<{ iata: string; city: string; country: string; score: number }> = [];
  for (const a of mergedAirports) {
    const iataN = normalize(a.iata);
    const cityN = normalize(a.city);
    const countryN = normalize(a.country);
    if (iataN === q) {
      substring.push({ ...a, score: 0 });
    } else if (iataN.startsWith(q)) {
      substring.push({ ...a, score: 1 });
    } else if (cityN.startsWith(q)) {
      substring.push({ ...a, score: 2 });
    } else if (iataN.includes(q) || cityN.includes(q) || countryN.includes(q)) {
      substring.push({ ...a, score: 3 });
    }
  }
  substring.sort((x, y) => x.score - y.score);

  // 3) Fuzzy para cuando no hay match por substring y la query es razonable.
  // Mide distancia contra ciudad y país; útil para typos tipo "madrit", "barcelons".
  const fuzzyPool =
    substring.length < 3 && q.length >= 4
      ? mergedAirports
          .map((a) => {
            const d1 = fuzzyDistance(normalize(a.city), q);
            const d2 = fuzzyDistance(normalize(a.country), q);
            return { ...a, d: Math.min(d1, d2) };
          })
          .filter((a) => a.d <= 2 && !substring.some((s) => s.iata === a.iata))
          .sort((x, y) => x.d - y.d)
          .slice(0, 4)
      : [];

  const airportItems: SuggestionItem[] = [
    ...substring.map((a) => ({
      kind: "airport" as const,
      iata: a.iata,
      city: a.city,
      country: a.country,
    })),
    ...fuzzyPool.map((a) => ({
      kind: "airport" as const,
      iata: a.iata,
      city: a.city,
      country: a.country,
    })),
  ];

  // Final: grupos primero (suelen ser lo que el usuario quería si escribió un país),
  // luego aeropuertos ordenados por relevancia.
  return [...matchedGroups, ...airportItems].slice(0, 10);
}

function AutocompleteList({
  id,
  items,
  onPick,
}: {
  id?: string;
  items: SuggestionItem[];
  onPick: (item: SuggestionItem) => void;
}) {
  return (
    <ul
      id={id}
      className="absolute z-20 mt-1 w-full max-h-72 overflow-auto rounded-lg bg-slate-800 border border-slate-600 shadow-2xl"
      role="listbox"
    >
      {items.map((item, idx) => (
        <li
          key={item.kind === "airport" ? `a:${item.iata}` : `g:${item.group.slug}`}
          role="option"
          aria-selected="false"
          aria-posinset={idx + 1}
          aria-setsize={items.length}
        >
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(item);
            }}
            aria-label={
              item.kind === "airport"
                ? `Seleccionar ${item.city}, ${item.country} (${item.iata})`
                : `Seleccionar grupo ${item.group.short} (${item.group.iatas.length} aeropuertos)`
            }
            className="w-full text-left px-3 py-2 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {item.kind === "airport" ? (
              <>
                <span className="font-mono font-semibold text-amber-300">{item.iata}</span>{" "}
                <span className="text-slate-200">{item.city}</span>{" "}
                <span className="text-slate-400 text-sm">· {item.country}</span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20 px-1.5 py-0.5 text-xs font-semibold">
                  <span aria-hidden="true">⦿</span> Grupo
                </span>{" "}
                <span className="text-slate-200 ml-1">{item.group.short}</span>
                <span className="text-slate-500 text-xs block mt-0.5">
                  {item.group.iatas.slice(0, 6).join(" · ")}
                  {item.group.iatas.length > 6 && ` +${item.group.iatas.length - 6}`}
                </span>
              </>
            )}
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
