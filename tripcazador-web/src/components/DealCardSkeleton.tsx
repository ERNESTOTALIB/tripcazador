/**
 * TripCazador — DealCardSkeleton
 *
 * Placeholder animado que replica la silueta de un DealCard mientras se
 * carga la búsqueda. Preferimos skeletons a spinners porque:
 *   1) Indican al usuario qué forma tendrá el resultado (menos sensación de CLS).
 *   2) Los tiempos percibidos son menores (~20% según varios estudios de UX).
 *   3) Son accesibles: role="status" + aria-live anuncia "Cargando resultados".
 *
 * Reutilizamos la clase `.skeleton` definida en globals.css (shimmer gradient).
 * No importamos iconos para mantener el bundle del esqueleto mínimo.
 */

interface DealCardSkeletonGridProps {
  /** Cuántas cards placeholder renderizar. Default: 6 (mitad del ancho en desktop). */
  count?: number;
  /** Etiqueta para lectores de pantalla. */
  label?: string;
}

export function DealCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-gray-800 glass">
      {/* Imagen placeholder */}
      <div className="skeleton h-44 w-full" />

      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Ruta (IATA-line-IATA) */}
        <div className="flex items-center gap-2">
          <div className="skeleton h-4 w-10" />
          <div className="skeleton h-px flex-1" />
          <div className="skeleton h-4 w-10" />
        </div>

        {/* Titular destino */}
        <div className="skeleton h-5 w-3/4" />

        {/* Precio grande + ahorro */}
        <div className="flex items-end justify-between">
          <div className="skeleton h-9 w-24" />
          <div className="skeleton h-4 w-16" />
        </div>

        {/* Detalles */}
        <div className="flex gap-2">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-3 w-12" />
        </div>

        {/* CTA */}
        <div className="skeleton h-10 w-full mt-auto" />
      </div>
    </div>
  );
}

/**
 * Grid completa de esqueletos, anunciada como status region.
 * Úsalo en el contenedor que renderiza la lista de resultados
 * mientras `loading === true`.
 */
export function DealCardSkeletonGrid({
  count = 6,
  label = "Cargando resultados",
}: DealCardSkeletonGridProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <DealCardSkeleton key={i} />
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}

/** Variante horizontal compacta para /deals (lista). */
export function DealRowSkeleton() {
  return (
    <div className="flex items-stretch gap-0 rounded-xl glass border border-gray-800 overflow-hidden">
      <div className="skeleton w-24 sm:w-32 shrink-0" />
      <div className="flex-1 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="skeleton h-4 w-10" />
          <div className="skeleton h-px flex-1" />
          <div className="skeleton h-4 w-10" />
        </div>
        <div className="skeleton h-5 w-2/3" />
        <div className="flex items-center justify-between">
          <div className="skeleton h-7 w-20" />
          <div className="skeleton h-9 w-28" />
        </div>
      </div>
    </div>
  );
}

export function DealRowSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando resultados"
      className="space-y-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <DealRowSkeleton key={i} />
      ))}
      <span className="sr-only">Cargando resultados…</span>
    </div>
  );
}

export default DealCardSkeletonGrid;
