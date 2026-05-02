"use client";

import { useState, useEffect, useRef, useId } from "react";
import {
  fuzzySearchAirports,
  fuzzySearchAirportsAll,
  loadBulkAirports,
  isBulkAirportsLoaded,
  AirportEntry,
  getAirportByIata,
} from "@/lib/airports_catalog";

interface Props {
  label: string;
  /** IATA value (controlled) */
  value: string;
  /** onChange recibe IATA seleccionada (3 letras MAYÚS) */
  onChange: (iata: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

/**
 * AirportCombobox — fase kk K3.
 * Input texto que abre dropdown con resultados fuzzy. Acepta:
 *   - "Madrid" → MAD
 *   - "España" → primer aeropuerto España (MAD)
 *   - "MAD" → MAD directo
 *   - "Bal" → muestra Balearic options (PMI, IBZ)
 *   - "Costa del Sol" → AGP via alias
 *
 * UX:
 *   - Hint visible: "Ciudad, país o IATA"
 *   - Cada resultado: emoji + IATA + ciudad + país
 *   - Keyboard: ↑↓ navega, Enter selecciona, Esc cierra
 *   - Click fuera cierra
 */
export function AirportCombobox({ label, value, onChange, placeholder, required, id: idProp }: Props) {
  const generatedId = useId();
  const id = idProp || generatedId;
  const [text, setText] = useState(() => {
    const a = getAirportByIata(value);
    return a ? `${a.iata} · ${a.city}` : value;
  });
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(0);
  const [results, setResults] = useState<AirportEntry[]>([]);
  const [bulkReady, setBulkReady] = useState(() => isBulkAirportsLoaded());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);

    // DDD1: precarga del bulk catalog en background tras render. Idempotente.
    // Si el user empieza a escribir antes de que cargue, ve resultados curated;
    // cuando bulk carga, re-renderea con resultados extendidos.
    if (!isBulkAirportsLoaded()) {
      // Pequeño delay para no competir con el FCP
      const t = setTimeout(() => {
        loadBulkAirports().then(() => setBulkReady(true)).catch(() => {});
      }, 800);
      return () => {
        clearTimeout(t);
        document.removeEventListener("mousedown", onClickOutside);
      };
    }
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleInput(q: string) {
    setText(q);
    // Si bulk ya está cargado usar versión extendida; si no, curated only
    const r = bulkReady ? fuzzySearchAirportsAll(q, 18) : fuzzySearchAirports(q, 18);
    setResults(r);
    setOpen(r.length > 0);
    setHover(0);
  }

  function pick(a: AirportEntry) {
    onChange(a.iata);
    setText(`${a.iata} · ${a.city}`);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHover((h) => (h + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHover((h) => (h - 1 + results.length) % results.length); }
    else if (e.key === "Enter") { e.preventDefault(); pick(results[hover]); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="block text-xs uppercase text-gray-500 mb-1">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={text}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => {
          if (results.length === 0 && text) handleInput(text);
          else if (results.length > 0) setOpen(true);
        }}
        onKeyDown={onKey}
        placeholder={placeholder || "Ciudad, país o IATA (ej: Madrid)"}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={open && results.length > 0 ? `${id}-opt-${hover}` : undefined}
        required={required}
        className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
      />
      {open && results.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-30 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-xl max-h-72 overflow-y-auto"
        >
          {results.map((a, i) => (
            <li
              key={a.iata}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === hover}
              onMouseDown={(e) => { e.preventDefault(); pick(a); }}
              onMouseEnter={() => setHover(i)}
              className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer ${
                i === hover ? "bg-amber-500/15 text-amber-100" : "text-gray-200 hover:bg-gray-800"
              }`}
            >
              <span aria-hidden="true">{a.emoji || "📍"}</span>
              <span className="font-mono font-bold text-amber-300 w-10">{a.iata}</span>
              <span className="flex-1 truncate">{a.city}</span>
              <span className="text-xs text-gray-500 truncate">{a.country}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
