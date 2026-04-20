/**
 * Next.js instrumentation hook (App Router).
 *
 * Se ejecuta una sola vez al arrancar cada runtime (nodejs / edge).
 * Aquí lazy-importamos la configuración de Sentry correspondiente para
 * que el runtime `edge` no intente cargar el SDK de Node y viceversa.
 *
 * Cómo activarlo:
 *   · Poner NEXT_PUBLIC_SENTRY_DSN en Vercel → Environment Variables.
 *   · (opcional) SENTRY_AUTH_TOKEN para subir source maps en el build.
 *
 * Si la DSN no está definida, los archivos sentry.*.config.ts hacen early
 * return y Sentry queda totalmente inerte — no rompe ni tiene overhead.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Hook opcional para reportar errores de RSC/SSR/routes a Sentry.
 * Disponible en Next.js 15+, inerte en 14 (no pasa nada).
 */
export async function onRequestError(err: unknown, request: Request) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(err, {
      extra: { url: request.url, method: request.method },
    });
  } catch {
    // Sentry carga perezosa falló — silencioso
  }
}
