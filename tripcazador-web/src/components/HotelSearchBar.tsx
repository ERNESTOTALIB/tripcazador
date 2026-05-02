"use client";

/**
 * HotelSearchBar — fase BBB2
 *
 * Buscador completo para hoteles inspirado en Booking/Kayak. Devuelve un
 * estado compartido con HotelFilters via URL search params.
 *
 * Campos:
 *  - Destino (autocomplete con ciudades del catálogo)
 *  - Check-in / Check-out (date pickers)
 *  - Huéspedes (adultos + niños + habitaciones)
 *
 * El submit:
 *  - Si está embebido en /hoteles, actualiza la URL con search params para
 *    que HotelFilters re-renderice.
 *  - Si está en home/otra página, navega a /hoteles?city=...&checkIn=...
 *
 * Tests cubren: autocomplete keyboard, date validation, guest counter
 * (no debajo de 1 adulto, no encima de 16 personas), URL state.
 */
import { useState, useMemo, useEffect, useRef, useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { suggestCities, validateDateRange } from "@/lib/hotel_helpers";
import type { Deal } from "@/lib/api";

interface HotelSearchBarProps {
  /** Lista completa de hoteles para alimentar el autocomplete. */
  hotels: Deal[];
  /** Si true, rellena los campos desde URL params al montar. */
  syncFromUrl?: boolean;
  /** CSS extra contenedor. */
  className?: string;
  /**
   * Callback opcional al submit. Si se pasa, se invoca CON el state actual
   * antes (o en lugar de) navegar.
   */
  onSubmit?: (state: HotelSearchState) => void;
}

export interface HotelSearchState {
  city: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
}

function todayPlus(days: number): string {
  return new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
}

export function HotelSearchBar({ hotels, syncFromUrl = true, className = "", onSubmit }: HotelSearchBarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const cityInputId = useId();
  const checkInId = useId();
  const checkOutId = useId();
  const guestsId = useId();

  // Estado inicial: lee de URL si syncFromUrl
  const [city, setCity] = useState<string>(() => (syncFromUrl ? params?.get("city") ?? "" : ""));
  const [checkIn, setCheckIn] = useState<string>(
    () => (syncFromUrl ? params?.get("checkIn") ?? todayPlus(30) : todayPlus(30)),
  );
  const [checkOut, setCheckOut] = useState<string>(
    () => (syncFromUrl ? params?.get("checkOut") ?? todayPlus(35) : todayPlus(35)),
  );
  const [adults, setAdults] = useState<number>(
    () => parseInt((syncFromUrl ? params?.get("adults") : null) ?? "2", 10) || 2,
  );
  const [children, setChildrenCount] = useState<number>(
    () => parseInt((syncFromUrl ? params?.get("children") : null) ?? "0", 10) || 0,
  );
  const [rooms, setRooms] = useState<number>(
    () => parseInt((syncFromUrl ? params?.get("rooms") : null) ?? "1", 10) || 1,
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cerrar popovers al click outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setShowGuestPicker(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  const suggestions = useMemo(() => suggestCities(hotels, city, 8), [hotels, city]);
  const guestSummary = useMemo(() => {
    const totalPeople = adults + children;
    const ppl = totalPeople === 1 ? "1 persona" : `${totalPeople} personas`;
    const r = rooms === 1 ? "1 habitación" : `${rooms} habitaciones`;
    return `${ppl} · ${r}`;
  }, [adults, children, rooms]);

  function pickCity(c: string) {
    setCity(c);
    setShowSuggestions(false);
    setActiveIdx(-1);
  }

  function handleKeyboard(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      pickCity(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validación fechas
    const dateValidation = validateDateRange(checkIn, checkOut);
    if (!dateValidation.valid) {
      setError(dateValidation.error ?? "Fechas inválidas");
      return;
    }

    // Validación huéspedes
    if (adults < 1) {
      setError("Mínimo 1 adulto");
      return;
    }
    if (adults + children > 16) {
      setError("Máximo 16 huéspedes total");
      return;
    }
    if (rooms < 1 || rooms > 8) {
      setError("Habitaciones entre 1 y 8");
      return;
    }

    const state: HotelSearchState = { city, checkIn, checkOut, adults, children, rooms };
    if (onSubmit) onSubmit(state);

    // Construye query string
    const qs = new URLSearchParams();
    if (city) qs.set("city", city);
    qs.set("checkIn", checkIn);
    qs.set("checkOut", checkOut);
    qs.set("adults", String(adults));
    if (children > 0) qs.set("children", String(children));
    qs.set("rooms", String(rooms));

    const url = `/hoteles?${qs.toString()}`;
    router.push(url);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`hotel-search-bar bg-white/95 backdrop-blur-md text-gray-900 rounded-2xl shadow-2xl ${className}`}
      role="search"
      aria-label="Buscar hoteles"
      data-testid="hotel-search-bar"
    >
      <div ref={wrapperRef} className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr_1.1fr_auto] gap-px bg-gray-200 rounded-2xl overflow-hidden">
        {/* Destino */}
        <div className="bg-white relative px-4 py-3">
          <label htmlFor={cityInputId} className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-0.5">
            Destino
          </label>
          <input
            id={cityInputId}
            type="text"
            value={city}
            onChange={(e) => { setCity(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyboard}
            placeholder="¿A dónde quieres ir?"
            autoComplete="off"
            className="w-full bg-transparent text-base text-gray-900 placeholder:text-gray-400 outline-none"
            aria-autocomplete="list"
            aria-controls={`${cityInputId}-list`}
            aria-expanded={showSuggestions && suggestions.length > 0}
            data-testid="hotel-city-input"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul
              id={`${cityInputId}-list`}
              role="listbox"
              className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-auto z-30"
              data-testid="hotel-city-suggestions"
            >
              {suggestions.map((c, i) => (
                <li key={c} role="option" aria-selected={i === activeIdx}>
                  <button
                    type="button"
                    onClick={() => pickCity(c)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      i === activeIdx ? "bg-amber-50 text-amber-900" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    📍 {c}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Check-in */}
        <div className="bg-white px-4 py-3">
          <label htmlFor={checkInId} className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-0.5">
            Entrada
          </label>
          <input
            id={checkInId}
            type="date"
            value={checkIn}
            min={todayPlus(0)}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-base text-gray-900 outline-none"
            data-testid="hotel-checkin"
          />
        </div>

        {/* Check-out */}
        <div className="bg-white px-4 py-3">
          <label htmlFor={checkOutId} className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-0.5">
            Salida
          </label>
          <input
            id={checkOutId}
            type="date"
            value={checkOut}
            min={checkIn || todayPlus(1)}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-base text-gray-900 outline-none"
            data-testid="hotel-checkout"
          />
        </div>

        {/* Huéspedes */}
        <div className="bg-white relative px-4 py-3">
          <label htmlFor={guestsId} className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-0.5">
            Huéspedes
          </label>
          <button
            id={guestsId}
            type="button"
            onClick={() => setShowGuestPicker((v) => !v)}
            className="w-full text-left text-base text-gray-900 outline-none"
            aria-expanded={showGuestPicker}
            data-testid="hotel-guests-toggle"
          >
            {guestSummary}
          </button>
          {showGuestPicker && (
            <div
              className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg w-72 p-4 z-30 space-y-3"
              data-testid="hotel-guests-picker"
              onClick={(e) => e.stopPropagation()}
            >
              <Counter
                label="Adultos"
                sublabel="A partir de 18"
                value={adults}
                onChange={setAdults}
                min={1}
                max={12}
                testId="hotel-adults-counter"
              />
              <Counter
                label="Niños"
                sublabel="Menores de 18"
                value={children}
                onChange={setChildrenCount}
                min={0}
                max={8}
                testId="hotel-children-counter"
              />
              <Counter
                label="Habitaciones"
                sublabel=""
                value={rooms}
                onChange={setRooms}
                min={1}
                max={8}
                testId="hotel-rooms-counter"
              />
              <button
                type="button"
                onClick={() => setShowGuestPicker(false)}
                className="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg py-2 text-sm font-semibold mt-2"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold px-8 py-3 transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          data-testid="hotel-search-submit"
          aria-label="Buscar hoteles"
        >
          🔍 Buscar
        </button>
      </div>
      {error && (
        <div
          role="alert"
          className="px-4 py-2 text-xs text-red-700 bg-red-50 border-t border-red-200"
          data-testid="hotel-search-error"
        >
          ⚠️ {error}
        </div>
      )}
    </form>
  );
}

interface CounterProps {
  label: string;
  sublabel: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  testId?: string;
}

function Counter({ label, sublabel, value, onChange, min, max, testId }: CounterProps) {
  return (
    <div className="flex items-center justify-between" data-testid={testId}>
      <div>
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        {sublabel && <div className="text-xs text-gray-500">{sublabel}</div>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Reducir ${label.toLowerCase()}`}
          className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold flex items-center justify-center"
          data-testid={testId ? `${testId}-minus` : undefined}
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold text-gray-900" data-testid={testId ? `${testId}-value` : undefined}>
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Aumentar ${label.toLowerCase()}`}
          className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold flex items-center justify-center"
          data-testid={testId ? `${testId}-plus` : undefined}
        >
          +
        </button>
      </div>
    </div>
  );
}
