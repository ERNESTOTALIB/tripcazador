import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: "Esta ruta no existe. Vuelve a la home para seguir cazando chollos.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="panel p-8 sm:p-12 max-w-xl text-center space-y-5">
        <div aria-hidden="true" className="text-6xl">🛰️</div>
        <h1 className="text-4xl font-bold text-white">
          404 — <span className="text-amber-400">Deal no encontrado</span>
        </h1>
        <p className="text-gray-300">
          Esta ruta no está en el radar del cazador. Puede que el chollo haya expirado
          o que la URL esté mal escrita. Prueba a volver a la home o a ver los deals activos.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <a
            href="/"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            Volver a la home
          </a>
          <a
            href="/deals"
            className="px-5 py-2.5 glass text-white font-semibold rounded-xl hover:border-amber-500/40 transition-colors"
          >
            Ver deals activos
          </a>
          <a
            href="/destinos"
            className="px-5 py-2.5 glass text-white font-semibold rounded-xl hover:border-amber-500/40 transition-colors"
          >
            Explorar destinos
          </a>
        </div>
      </div>
    </div>
  );
}
