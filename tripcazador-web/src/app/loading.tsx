/**
 * Loading UI global. Next.js App Router lo renderiza automáticamente
 * mientras un Server Component suspende en el árbol actual.
 *
 * Usamos el DealCardSkeleton compartido para que la forma del placeholder
 * coincida con el contenido real — reduce CLS percibido frente al skeleton
 * genérico anterior (h-72 plano).
 */
import { DealCardSkeleton } from "@/components/DealCardSkeleton";

export default function Loading() {
  return (
    <div className="space-y-10" aria-busy="true" aria-live="polite">
      <div className="text-center py-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Rastreando ofertas…
        </div>
        <div className="skeleton h-12 w-3/4 max-w-xl mx-auto" />
        <div className="skeleton h-5 w-2/3 max-w-md mx-auto" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <DealCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
