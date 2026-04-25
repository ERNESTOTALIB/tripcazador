/**
 * DealCardSkeleton — abr-2026l
 *
 * Placeholder con la misma silueta que `DealCard` para minimizar Cumulative
 * Layout Shift al montar la lista. El esqueleto ocupa exactamente el mismo
 * footprint (height + radius + paddings) que la versión real.
 *
 * Server component (sin "use client") — se renderiza durante streaming
 * mientras la lista de deals carga.
 *
 * a11y:
 *  - role="status" + aria-busy + sr-only label para que lectores anuncien
 *    "cargando ofertas".
 *  - prefers-reduced-motion respetado por la regla global en globals.css.
 */
export function DealCardSkeleton() {
  return (
    <li
      role="status"
      aria-busy="true"
      className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
    >
      <span className="sr-only">Cargando oferta…</span>
      {/* Cabecera con destino + precio */}
      <div className="p-5 space-y-4 animate-pulse">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-24 rounded bg-gray-800" />
            <div className="h-5 w-3/4 rounded bg-gray-800" />
          </div>
          <div className="h-7 w-16 rounded bg-amber-500/20" />
        </div>
        {/* Línea de fecha + duración */}
        <div className="flex flex-wrap gap-2">
          <div className="h-4 w-32 rounded bg-gray-800" />
          <div className="h-4 w-20 rounded bg-gray-800" />
          <div className="h-4 w-16 rounded bg-gray-800" />
        </div>
        {/* Tags */}
        <div className="flex gap-2 pt-2">
          <div className="h-5 w-14 rounded-full bg-gray-800" />
          <div className="h-5 w-20 rounded-full bg-gray-800" />
          <div className="h-5 w-12 rounded-full bg-gray-800" />
        </div>
      </div>
    </li>
  );
}

/**
 * Lista de N skeletons. Útil como fallback de Suspense.
 */
export function DealCardSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <ul
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      aria-label="Cargando ofertas"
    >
      {Array.from({ length: count }).map((_, i) => (
        <DealCardSkeleton key={i} />
      ))}
    </ul>
  );
}
