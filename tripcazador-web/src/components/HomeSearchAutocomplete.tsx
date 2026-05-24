"use client";
/**
 * HomeSearchAutocomplete — SSS478 (24 may 2026)
 *
 * Client autocomplete que usa quick_search lib (SSS466) para sugerir
 * destinos, aeropuertos y verticales mientras el user escribe.
 *
 * UX:
 * - Input grande hero-style con icon search
 * - Dropdown con max 6 resultados al escribir 2+ chars
 * - Click resultado → navega a su href
 * - Esc cierra dropdown, Enter selecciona primero
 *
 * Es un component aislado — pages lo importan donde tenga sentido.
 */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { quickSearch, type QuickSearchResult } from "@/lib/quick_search";

interface Props {
  placeholder?: string;
  maxResults?: number;
  /** className extra para el container. */
  className?: string;
}

export function HomeSearchAutocomplete({
  placeholder = "Busca un destino, aeropuerto o servicio…",
  maxResults = 6,
  className = "",
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Recalcula resultados cuando cambia query
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const r = quickSearch(query.trim(), maxResults);
    setResults(r);
    setHighlighted(0);
  }, [query, maxResults]);

  // Close on click-outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    }
    if (e.key === "Enter" && results[highlighted]) {
      e.preventDefault();
      window.location.href = results[highlighted].href;
    }
  }

  const showDropdown = open && results.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Buscar destinos, aeropuertos o servicios"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pl-12 pr-4 text-base text-white placeholder-slate-500 backdrop-blur transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>

      {showDropdown && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        >
          {results.map((r, i) => (
            <Link
              key={`${r.type}-${r.href}-${i}`}
              href={r.href}
              role="option"
              aria-selected={i === highlighted}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                i === highlighted
                  ? "bg-amber-500/15 text-amber-100"
                  : "text-slate-200 hover:bg-slate-800"
              }`}
            >
              <span className="text-xl">{r.emoji || (r.type === "airport" ? "✈️" : r.type === "destino" ? "🌍" : "🎯")}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{r.label}</div>
                {r.sublabel && (
                  <div className="truncate text-xs text-slate-400">{r.sublabel}</div>
                )}
              </div>
              <span className="text-xs text-slate-500 capitalize">{r.type === "vertical" ? "tool" : r.type}</span>
            </Link>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && results.length === 0 && open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-slate-700 bg-slate-900 p-4 text-center text-sm text-slate-400 shadow-2xl">
          Sin resultados para &ldquo;{query}&rdquo;. Prueba un destino o aeropuerto IATA.
        </div>
      )}
    </div>
  );
}

export default HomeSearchAutocomplete;
