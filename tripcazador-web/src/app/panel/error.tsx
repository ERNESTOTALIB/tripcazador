"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * /panel/error.tsx — fase tt-TT3
 *
 * Error boundary específico para /panel. Reemplaza la pantalla en blanco
 * por un mensaje útil y opciones de recuperación.
 *
 * Next 14 monta este componente cuando un descendant del segment crashea.
 */
export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[/panel] error boundary:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-gray-900 border border-red-700/40 rounded-lg p-6">
        <h1 className="text-xl font-bold text-red-400 mb-3">
          Error cargando el panel
        </h1>
        <p className="text-sm text-gray-300 mb-4">
          Algo falló al renderizar. Esto suele resolverse re-cargando o
          volviendo a iniciar sesión.
        </p>
        {error.message && (
          <pre className="text-xs text-gray-500 bg-gray-950 border border-gray-800 rounded p-3 mb-4 overflow-x-auto">
            {error.message}
          </pre>
        )}
        {error.digest && (
          <p className="text-xs text-gray-500 mb-4">
            Code: <code>{error.digest}</code>
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded text-sm"
          >
            Reintentar
          </button>
          <Link
            href="/panel/login"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm"
          >
            Volver al login
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-gray-400 hover:text-gray-200 text-sm"
          >
            Ir al sitio
          </Link>
        </div>
      </div>
    </main>
  );
}
