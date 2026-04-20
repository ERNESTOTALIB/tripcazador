"use client";

/**
 * FavoritesClient — renderiza los deals favoritos del usuario.
 *
 * Estrategia de carga:
 *  1. Esperamos a que `useFavorites` termine el primer read de localStorage
 *     (`ready === true`) para evitar flash de empty state.
 *  2. Si no hay ids, mostramos empty state con CTA.
 *  3. Si hay ids, pedimos cada deal individualmente vía `getDeal(id)`:
 *     una promesa por id, `Promise.allSettled` para no romper si alguno
 *     falla o ya expiró. Los IDs que no se resuelven se marcan como
 *     "expirados" y se ofrece al usuario limpiarlos del store.
 *
 * La página es cliente-puro — ver page.tsx para los metadatos SEO.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { Deal, getDeal } from "@/lib/api";
import { DealCard } from "@/components/DealCard";
import { DealCardSkeleton } from "@/components/DealCardSkeleton";
import { useFavorites } from "@/lib/useFavorites";

type DealState =
  | { status: "loading" }
  | { status: "ok"; deal: Deal }
  | { status: "missing" };

export function FavoritesClient() {
  const { ids, ready, remove, clear } = useFavorites();
  const [byId, setById] = useState<Record<string, DealState>>({});

  // Stabilize dependency array so React doesn't re-fetch on unrelated renders.
  const idsKey = useMemo(() => ids.join(","), [ids]);

  useEffect(() => {
    if (!ready) return;
    if (ids.length === 0) {
      setById({});
      return;
    }

    // Marca como loading los ids que aún no tenemos.
    setById((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        if (!next[id]) next[id] = { status: "loading" };
      }
      // Elimina entradas de ids que ya no están en favoritos.
      for (const key of Object.keys(next)) {
        if (!ids.includes(key)) delete next[key];
      }
      return next;
    });

    let cancelled = false;
    Promise.allSettled(ids.map((id) => getDeal(id))).then((results) => {
      if (cancelled) return;
      setById((prev) => {
        const next = { ...prev };
        results.forEach((r, i) => {
          const id = ids[i];
          if (r.status === "fulfilled" && r.value) {
            next[id] = { status: "ok", deal: r.value };
          } else {
            next[id] = { status: "missing" };
          }
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, idsKey]);

  const missingIds = useMemo(
    () =>
      Object.entries(byId)
        .filter(([, s]) => s.status === "missing")
        .map(([id]) => id),
    [byId],
  );

  const okDeals = useMemo(
    () =>
      Object.values(byId).flatMap((s) => (s.status === "ok" ? [s.deal] : [])),
    [byId],
  );

  // Mientras leemos el primer storage: skeleton mínimo.
  if (!ready) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <PageHeader count={null} onClear={() => {}} disabled />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <DealCardSkeleton />
          <DealCardSkeleton />
          <DealCardSkeleton />
        </div>
      </div>
    );
  }

  // Empty state.
  if (ids.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 border border-gray-800 mb-6">
          <Heart size={28} className="text-gray-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">
          Aún no tienes favoritos
        </h1>
        <p className="text-gray-400 mb-8">
          Explora los chollos activos y marca con el corazón los que te
          interesen. Tus favoritos se guardan en este navegador, sin cuenta
          ni registro.
        </p>
        <Link
          href="/deals"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors"
        >
          Ver chollos activos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <PageHeader count={ids.length} onClear={clear} />

      {/* Aviso si hay ids que ya no se pudieron cargar */}
      {missingIds.length > 0 && (
        <div
          role="status"
          className="mb-6 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm text-amber-200 flex items-start justify-between gap-4"
        >
          <div>
            <p className="font-semibold mb-1">
              {missingIds.length} favorito{missingIds.length > 1 ? "s" : ""}{" "}
              ya no está{missingIds.length > 1 ? "n" : ""} disponible
              {missingIds.length > 1 ? "s" : ""}
            </p>
            <p className="text-amber-200/80">
              Los chollos expiran cuando la aerolínea retira la tarifa. Puedes
              limpiar los caducados para mantener tu lista al día.
            </p>
          </div>
          <button
            type="button"
            onClick={() => missingIds.forEach(remove)}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-semibold"
          >
            <Trash2 size={12} />
            Limpiar caducados
          </button>
        </div>
      )}

      {/* Grid de deals cargados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {okDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
        {/* Skeletons para ids aún cargando */}
        {ids.map((id) =>
          byId[id]?.status === "loading" ? <DealCardSkeleton key={id} /> : null,
        )}
      </div>
    </div>
  );
}

function PageHeader({
  count,
  onClear,
  disabled = false,
}: {
  count: number | null;
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Heart size={22} className="text-amber-400" fill="currentColor" />
          Mis favoritos
        </h1>
        {count !== null && (
          <p className="text-sm text-gray-400 mt-1">
            {count} chollo{count === 1 ? "" : "s"} guardado
            {count === 1 ? "" : "s"} en este navegador
          </p>
        )}
      </div>
      {count && count > 0 ? (
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-40"
        >
          Borrar todos
        </button>
      ) : null}
    </header>
  );
}
