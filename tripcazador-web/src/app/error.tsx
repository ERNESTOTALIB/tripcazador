"use client";

import { useEffect } from "react";

/**
 * Error boundary global de Next.js App Router.
 * Se muestra cuando un Server Component (o un hijo) lanza una excepción no capturada.
 * Nota: debe ser Client Component y exportar `reset` para que el usuario pueda reintentar.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log a consola + hook de Sentry si está cargado en window
    console.error("[tripcazador] runtime error:", error);
    const sentry = (typeof window !== "undefined"
      ? (window as unknown as { Sentry?: { captureException?: (e: unknown) => void } }).Sentry
      : undefined);
    sentry?.captureException?.(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="panel p-8 sm:p-12 max-w-xl text-center space-y-5" role="alert" aria-live="assertive">
        <div aria-hidden="true" className="text-6xl">⚠️</div>
        <h1 className="text-3xl font-bold text-white">
          Algo salió mal en el radar
        </h1>
        <p className="text-gray-300">
          Hemos detectado un error al cargar esta página. Puedes intentar reintentar o
          volver a la home. Si persiste, escríbenos por Telegram.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-500 font-mono">
            ref: {error.digest}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="px-5 py-2.5 glass text-white font-semibold rounded-xl hover:border-amber-500/40 transition-colors"
          >
            Volver a la home
          </a>
          <a
            href="https://t.me/tripcazador_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 glass text-white font-semibold rounded-xl hover:border-amber-500/40 transition-colors"
          >
            Avisarnos por Telegram
          </a>
        </div>
      </div>
    </div>
  );
}
