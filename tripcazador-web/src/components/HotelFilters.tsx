"use client";

/**
 * HotelFilters — fase BBB2 (rewrite usando hotel_helpers + URL state)
 *
 * Componente de filtros completo para /hoteles:
 *  - Tabs categoría (con conteos dinámicos)
 *  - Sort dropdown
 *  - Region select
 *  - Slider precio máximo
 *  - Slider rating mínimo
 *  - Slider stars mínimas
 *  - Multi-select amenities (chips)
 *  - URL state sync (lectura inicial + escritura on-change)
 *
 * Toda la lógica de filtrado/orden delega a hotel_helpers.* — el componente es
 * solo presentacional + estado UI.
 */
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { HotelCard } from "@/components/HotelCard";
import {
  filterHotels,
  sortHotels,
  countByCategory,
  AMENITIES,
  AMENITY_LABELS,
  CATEGORY_META,
  type SortKey,
  type Amenity,
  type HotelFiltersState,
} from "@/lib/hotel_helpers";
import type { Deal } from "@/lib/api";
import type { HotelCategory } from "@/lib/hotel_seed";

interface HotelFiltersProps {
  hotels: Deal[];
  /** Si true, lee/escribe state en URL searchParams. */
  syncUrl?: boolean;
}

const REGIONS = ["Todas", "Europa", "Asia", "Caribe", "África", "América Norte", "América Sur", "Oceanía", "Oriente Medio"];

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "recommended", label: "Recomendados" },
  { key: "price_asc",   label: "Precio: menor primero" },
  { key: "price_desc",  label: "Precio: mayor primero" },
  { key: "rating_desc", label: "Mejor valorados" },
  { key: "stars_desc",  label: "Más estrellas" },
];

export function HotelFilters({ hotels, syncUrl = true }: HotelFiltersProps) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initial state desde URL (si syncUrl)
  const initialState: HotelFiltersState & { sort: SortKey } = useMemo(() => {
    if (!syncUrl || !params) {
      return { category: "all", region: "Todas", sort: "recommended", maxPricePerNight: 0, minRating: 0, minStars: 0, amenities: [] };
    }
    const cat = (params.get("category") as HotelCategory | null) ?? "all";
    const region = params.get("region") ?? "Todas";
    const sort = (params.get("sort") as SortKey | null) ?? "recommended";
    const maxPpn = parseInt(params.get("maxPrice") ?? "0", 10) || 0;
    const minRating = parseFloat(params.get("minRating") ?? "0") || 0;
    const minStars = parseInt(params.get("minStars") ?? "0", 10) || 0;
    const amenStr = params.get("amenities") ?? "";
    const amenities = amenStr ? (amenStr.split(",").filter(Boolean) as Amenity[]) : [];
    const query = params.get("city") ?? params.get("q") ?? "";
    return {
      category: cat,
      region,
      sort,
      maxPricePerNight: maxPpn,
      minRating,
      minStars,
      amenities,
      query,
    };
  }, [syncUrl, params]);

  const [category, setCategory] = useState<HotelCategory | "all">(initialState.category as HotelCategory | "all");
  const [region, setRegion] = useState<string>(initialState.region ?? "Todas");
  const [sort, setSort] = useState<SortKey>(initialState.sort);
  const [maxPrice, setMaxPrice] = useState<number>(initialState.maxPricePerNight ?? 0);
  const [minRating, setMinRating] = useState<number>(initialState.minRating ?? 0);
  const [minStars, setMinStars] = useState<number>(initialState.minStars ?? 0);
  const [amenities, setAmenities] = useState<Amenity[]>(initialState.amenities as Amenity[] ?? []);
  const [query, setQuery] = useState<string>(initialState.query ?? "");

  // Filter + sort
  const filtered = useMemo(() => {
    const filt = filterHotels(hotels, {
      query: query || undefined,
      category,
      region: region === "Todas" ? undefined : region,
      maxPricePerNight: maxPrice,
      minRating,
      minStars,
      amenities,
    });
    return sortHotels(filt, sort);
  }, [hotels, query, category, region, maxPrice, minRating, minStars, amenities, sort]);

  const counts = useMemo(() => countByCategory(hotels), [hotels]);

  // URL sync — escribe params al cambiar state
  useEffect(() => {
    if (!syncUrl) return;
    const qs = new URLSearchParams();
    if (category !== "all") qs.set("category", category);
    if (region !== "Todas") qs.set("region", region);
    if (sort !== "recommended") qs.set("sort", sort);
    if (maxPrice > 0) qs.set("maxPrice", String(maxPrice));
    if (minRating > 0) qs.set("minRating", minRating.toFixed(1));
    if (minStars > 0) qs.set("minStars", String(minStars));
    if (amenities.length > 0) qs.set("amenities", amenities.join(","));
    if (query) qs.set("q", query);
    // Preserva params no controlados aquí (city/checkIn/checkOut from search bar)
    if (params) {
      ["city", "checkIn", "checkOut", "adults", "children", "rooms"].forEach((k) => {
        const v = params.get(k);
        if (v && !qs.has(k)) qs.set(k, v);
      });
    }
    const next = qs.toString();
    const current = params?.toString() ?? "";
    if (next !== current) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
  }, [syncUrl, category, region, sort, maxPrice, minRating, minStars, amenities, query, params, pathname, router]);

  function toggleAmenity(a: Amenity) {
    setAmenities((arr) => (arr.includes(a) ? arr.filter((x) => x !== a) : [...arr, a]));
  }

  function resetAll() {
    setCategory("all");
    setRegion("Todas");
    setSort("recommended");
    setMaxPrice(0);
    setMinRating(0);
    setMinStars(0);
    setAmenities([]);
    setQuery("");
  }

  return (
    <div className="space-y-6" data-testid="hotel-filters">
      {/* Tabs categoría */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 min-w-max" role="tablist" aria-label="Categorías de hotel">
          {([
            { key: "all", label: "Todos", emoji: "🏨" },
            ...Object.entries(CATEGORY_META).map(([k, m]) => ({ key: k, label: m.label, emoji: m.emoji })),
          ] as Array<{ key: string; label: string; emoji: string }>).map((cat) => {
            const active = cat.key === category;
            return (
              <button
                key={cat.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="hotel-results"
                onClick={() => setCategory(cat.key as HotelCategory | "all")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap text-sm font-semibold transition-colors min-h-[44px] ${
                  active
                    ? "bg-amber-500 border-amber-400 text-black"
                    : "bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-600 hover:text-white"
                }`}
                data-testid={`hotel-filter-cat-${cat.key}`}
              >
                <span aria-hidden>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span className={active ? "text-black/70" : "text-gray-500"}>
                  ({counts[cat.key] ?? 0})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtros principales */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Búsqueda libre */}
          <label className="flex flex-col gap-1 text-xs flex-1 min-w-[200px]">
            <span className="text-gray-400 uppercase tracking-wide font-semibold">Buscar (ciudad, hotel)</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: Bali, Ubud, Marina Bay..."
              className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              data-testid="hotel-filter-search"
              aria-label="Buscar por ciudad u hotel"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-gray-400 uppercase tracking-wide font-semibold">Región</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              data-testid="hotel-filter-region"
            >
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-gray-400 uppercase tracking-wide font-semibold">Ordenar por</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              data-testid="hotel-filter-sort"
            >
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
        </div>

        {/* Sliders */}
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-gray-400 uppercase tracking-wide font-semibold">
              Máx €/noche {maxPrice > 0 ? `(${maxPrice}€)` : "(sin límite)"}
            </span>
            <input
              type="range"
              min={50}
              max={1000}
              step={25}
              value={maxPrice || 1000}
              onChange={(e) => setMaxPrice(parseInt(e.target.value, 10) === 1000 ? 0 : parseInt(e.target.value, 10))}
              className="accent-amber-400"
              data-testid="hotel-filter-max-price"
              aria-label="Precio máximo por noche en euros"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-gray-400 uppercase tracking-wide font-semibold">
              Rating mínimo {minRating > 0 ? `(≥${minRating.toFixed(1)})` : "(cualquiera)"}
            </span>
            <input
              type="range"
              min={0}
              max={9.5}
              step={0.5}
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="accent-amber-400"
              data-testid="hotel-filter-min-rating"
              aria-label="Rating mínimo de 0 a 10"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-gray-400 uppercase tracking-wide font-semibold">
              Estrellas mínimas {minStars > 0 ? `(${"★".repeat(minStars)})` : "(cualquiera)"}
            </span>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={minStars}
              onChange={(e) => setMinStars(parseInt(e.target.value, 10))}
              className="accent-amber-400"
              data-testid="hotel-filter-min-stars"
              aria-label="Estrellas mínimas de 0 a 5"
            />
          </label>
        </div>

        {/* Amenities */}
        <div className="space-y-2">
          <div className="text-gray-400 uppercase tracking-wide font-semibold text-xs">Servicios</div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros de servicios">
            {AMENITIES.map((a) => {
              const meta = AMENITY_LABELS[a];
              const on = amenities.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  aria-pressed={on}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors min-h-[36px] ${
                    on
                      ? "bg-amber-500/20 border-amber-400 text-amber-100"
                      : "bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                  }`}
                  data-testid={`hotel-filter-amenity-${a}`}
                >
                  <span className="mr-1" aria-hidden>{meta.emoji}</span>
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer: counts + reset */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            <strong className="text-white" data-testid="hotel-filters-count">{filtered.length}</strong>
            {" "}hoteles
            {hotels.length !== filtered.length && (
              <span className="ml-1 text-gray-500">(de {hotels.length})</span>
            )}
          </div>
          {(category !== "all" || region !== "Todas" || sort !== "recommended" || maxPrice > 0 || minRating > 0 || minStars > 0 || amenities.length > 0 || query) && (
            <button
              type="button"
              onClick={resetAll}
              className="text-xs text-amber-300 hover:text-amber-200 underline underline-offset-4"
              data-testid="hotel-filters-reset"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Resultados */}
      <div id="hotel-results" data-testid="hotel-results">
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl border border-gray-800 bg-gray-900/60 p-10 text-center"
            data-testid="hotel-empty-state"
          >
            <div className="text-4xl mb-3">🤷</div>
            <p className="text-gray-300">No hay hoteles con esos filtros — prueba a relajar la categoría, región o servicios.</p>
            <button
              type="button"
              onClick={resetAll}
              className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg min-h-[44px]"
              data-testid="hotel-empty-reset"
            >
              Reset filtros
            </button>
          </div>
        ) : (
          <section
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            aria-live="polite"
            aria-label={`${filtered.length} hoteles encontrados`}
          >
            {filtered.map((h, i) => (
              <HotelCard key={h.id} hotel={h} eager={i < 3} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
