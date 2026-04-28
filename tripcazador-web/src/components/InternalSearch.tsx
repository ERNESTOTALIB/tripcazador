"use client";

import { useState, useMemo } from "react";

/**
 * InternalSearch — abr-2026bb.
 *
 * Búsqueda interna client-side sobre un índice estático pre-generado en
 * build time (blog posts + destinos + comparativas + aerolíneas + glosario).
 * Sin backend ni API. Filtrado por substring case-insensitive.
 *
 * Por qué interna: los usuarios buscan "vuelos baratos a Tokio" en el sitio.
 * Sin search interna, salen al SERP y a veces vuelven a competidores. Con
 * search local, mantienes intent dentro del dominio.
 */

export interface SearchItem {
  type: "blog" | "destino" | "comparativa" | "aerolinea" | "glosario" | "hub";
  title: string;
  url: string;
  description: string;
  tags?: string[];
}

interface Props {
  items: SearchItem[];
}

const TYPE_LABELS: Record<SearchItem["type"], string> = {
  blog: "Blog",
  destino: "Destino",
  comparativa: "Comparativa",
  aerolinea: "Aerolínea",
  glosario: "Glosario",
  hub: "Hub aeropuerto",
};

const TYPE_COLORS: Record<SearchItem["type"], string> = {
  blog: "bg-amber-500/20 text-amber-300",
  destino: "bg-blue-500/20 text-blue-300",
  comparativa: "bg-purple-500/20 text-purple-300",
  aerolinea: "bg-emerald-500/20 text-emerald-300",
  glosario: "bg-gray-500/20 text-gray-300",
  hub: "bg-pink-500/20 text-pink-300",
};

export function InternalSearch({ items }: Props) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | SearchItem["type"]>("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const filtered = items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      const text = [item.title, item.description, ...(item.tags || [])]
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });

    // Score: title match > description match > tag match
    return filtered
      .map((item) => {
        const titleMatch = item.title.toLowerCase().includes(q) ? 10 : 0;
        const descMatch = item.description.toLowerCase().includes(q) ? 3 : 0;
        const tagMatch = item.tags?.some((t) => t.toLowerCase().includes(q)) ? 1 : 0;
        return { item, score: titleMatch + descMatch + tagMatch };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((r) => r.item);
  }, [query, typeFilter, items]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const item of items) {
      map[item.type] = (map[item.type] || 0) + 1;
    }
    return map;
  }, [items]);

  return (
    <section
      role="search"
      aria-label="Búsqueda interna"
      className="space-y-6"
    >
      <div className="space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca destinos, blog posts, comparativas, aerolíneas…"
          className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:outline-none"
          aria-label="Término de búsqueda"
          autoFocus
        />
        <div className="flex flex-wrap gap-2">
          {(["all", "blog", "destino", "comparativa", "aerolinea", "hub", "glosario"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              aria-pressed={typeFilter === type}
              className={
                "text-xs px-3 py-1.5 rounded-full border transition-colors " +
                (typeFilter === type
                  ? "bg-amber-500 text-gray-900 font-semibold border-amber-500"
                  : "bg-gray-900 hover:bg-gray-800 text-gray-300 border-gray-800")
              }
            >
              {type === "all" ? "Todo" : TYPE_LABELS[type]}{" "}
              <span className="text-xs opacity-70">({counts[type] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {query.trim().length < 2 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">Escribe al menos 2 caracteres para empezar.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">
            Sin resultados para "<span className="text-amber-400">{query}</span>". Prueba con otro término.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400">
            {results.length} {results.length === 1 ? "resultado" : "resultados"} para "
            <span className="text-amber-400">{query}</span>"
          </p>
          <ul className="space-y-3">
            {results.map((r) => (
              <li
                key={r.url}
                className="bg-gray-900/40 border border-gray-800 hover:border-amber-500/40 rounded-xl transition-colors"
              >
                <a href={r.url} className="block p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        "text-xs px-2 py-0.5 rounded-full font-mono " + TYPE_COLORS[r.type]
                      }
                    >
                      {TYPE_LABELS[r.type]}
                    </span>
                    <h3 className="text-base font-semibold text-white">{r.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{r.description}</p>
                  {r.tags && r.tags.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {r.tags.slice(0, 4).map((t) => `#${t}`).join(" ")}
                    </p>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default InternalSearch;
