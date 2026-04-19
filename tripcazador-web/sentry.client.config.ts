/**
 * Sentry — cliente (browser).
 * Se activa automaticamente si NEXT_PUBLIC_SENTRY_DSN esta definida.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV || "production",
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_RATE || 0.1),
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: true,
      }),
    ],
    ignoreErrors: [
      // Errores de extensiones o red benignos
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      /^NetworkError/,
      /Load failed/,
    ],
  });
}
