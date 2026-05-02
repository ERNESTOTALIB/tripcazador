"use client";

/**
 * /comparar-vuelos — fase mmm LLL3 (May 2026)
 *
 * Selecciona 2-3 deals favoritos y los compara lado a lado: precio, escalas,
 * duración, aerolínea. Útil para usuarios indecisos entre rutas similares.
 *
 * Source: lee de localStorage favorites + permite cargar 2 IDs via URL params.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plane, Check, X, ExternalLink } from "lucide-react";
import { getFavorites, type FavoriteDeal } from "@/lib/favorites";
import { SectionHero } from "@/components/SectionHero";

const MAX_COMPARE = 3;

export default function CompararVuelosPage() {
  const [favs, setFavs] = useState<FavoriteDeal[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    document.title = "Compara vuelos lado a lado — TripCazador";
    setFavs(getFavorites());
    setHydrated(true);
  }, []);

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= MAX_COMPARE) {
        alert(`Máximo ${MAX_COMPARE} vuelos en comparación`);
        return;
      }
      next.add(id);
    }
    setSelected(next);
  }

  const compareList = favs.filter((f) => selected.has(f.id));
  const cheapest = compareList.length > 0 ? Math.min(...compareList.map((f) => f.price_eur)) : 0;

  return (
    <div className="space-y-8">
      <SectionHero
        badge={hydrated && favs.length > 0 ? `${favs.length} vuelos guardados` : "Compara vuelos"}
        title={
          <>
            Compara <em>lado a lado</em>
          </>
        }
        subtitle="Selecciona 2 o 3 chollos guardados y mira sus diferencias en precio, escalas, duración y aerolínea."
      />

      {!hydrated && <div className="text-center py-20 text-gray-500">Cargando…</div>}

      {hydrated && favs.length === 0 && (
        <div className="text-center py-16 text-gray-400 max-w-md mx-auto">
          <Plane size={48} className="mx-auto mb-4 text-gray-700" />
          <h2 className="text-xl font-semibold text-white mb-2">Sin favoritos guardados</h2>
          <p className="mb-6">Necesitas guardar al menos 2 chollos para compararlos. Pulsa el corazón en cualquier deal.</p>
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
          >
            Explorar chollos →
          </Link>
        </div>
      )}

      {hydrated && favs.length > 0 && (
        <>
          {/* Selector */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">
              Selecciona hasta 3 vuelos para comparar ({selected.size}/{MAX_COMPARE})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {favs.map((f) => {
                const isSelected = selected.has(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleSelect(f.id)}
                    aria-pressed={isSelected}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30"
                        : "bg-gray-900 border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-amber-400 text-sm">{f.origin}</span>
                      <Plane size={10} className="text-gray-500 rotate-90" />
                      <span className="font-mono font-bold text-white text-sm">{f.destination}</span>
                      {isSelected && <Check size={14} className="ml-auto text-amber-400" />}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{f.city_to || f.destination}</div>
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className="text-lg font-bold text-white">{f.price_eur.toFixed(0)}€</span>
                      {f.airline_name && (
                        <span className="text-[10px] text-gray-500 truncate ml-2">{f.airline_name}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Comparison table */}
          {compareList.length >= 2 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Comparación</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-3 text-xs uppercase tracking-wider text-gray-500 sticky left-0 bg-gray-950">
                        Atributo
                      </th>
                      {compareList.map((f) => (
                        <th key={f.id} className="text-left p-3 text-sm font-bold text-white min-w-[180px]">
                          {f.origin} → {f.destination}
                          <div className="text-[10px] text-gray-500 font-normal mt-0.5">
                            {f.city_to || f.destination}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <CompareRow
                      label="Precio"
                      values={compareList.map((f) => (
                        <span
                          key={f.id}
                          className={`font-bold text-lg ${
                            f.price_eur === cheapest ? "text-emerald-400" : "text-white"
                          }`}
                        >
                          {f.price_eur.toFixed(0)}€{f.price_eur === cheapest && " 🏆"}
                        </span>
                      ))}
                    />
                    <CompareRow
                      label="Aerolínea"
                      values={compareList.map((f) => (
                        <span key={f.id} className="text-sm text-gray-300">
                          {f.airline_name || "—"}
                        </span>
                      ))}
                    />
                    <CompareRow
                      label="Cabina"
                      values={compareList.map((f) => (
                        <span key={f.id} className="text-sm text-gray-300 capitalize">
                          {f.cabin || "economy"}
                        </span>
                      ))}
                    />
                    <CompareRow
                      label="Fecha ida"
                      values={compareList.map((f) => (
                        <span key={f.id} className="text-sm text-gray-300">
                          {f.date_out || "—"}
                        </span>
                      ))}
                    />
                    <CompareRow
                      label="Fecha vuelta"
                      values={compareList.map((f) => (
                        <span key={f.id} className="text-sm text-gray-300">
                          {f.date_ret || "Solo ida"}
                        </span>
                      ))}
                    />
                    <CompareRow
                      label="Tipo"
                      values={compareList.map((f) => (
                        <span key={f.id} className="text-sm text-amber-400">
                          {f.classification || "—"}
                        </span>
                      ))}
                    />
                    <tr className="border-b border-gray-800">
                      <td className="p-3 text-xs text-gray-500 sticky left-0 bg-gray-950">CTA</td>
                      {compareList.map((f) => (
                        <td key={f.id} className="p-3">
                          <Link
                            href={`/deals?origin=${encodeURIComponent(f.origin)}&destination=${encodeURIComponent(f.destination)}`}
                            className="inline-flex items-center gap-1 px-3 py-2 min-h-[36px] rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
                          >
                            Ver chollos
                            <ExternalLink size={11} />
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {compareList.length < 2 && favs.length >= 2 && (
            <p className="text-center text-gray-500 text-sm py-8">
              Selecciona al menos 2 vuelos arriba para ver la comparación.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function CompareRow({
  label,
  values,
}: {
  label: string;
  values: React.ReactNode[];
}) {
  return (
    <tr className="border-b border-gray-800">
      <td className="p-3 text-xs text-gray-500 sticky left-0 bg-gray-950 align-top">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="p-3 align-top">
          {v}
        </td>
      ))}
    </tr>
  );
}
