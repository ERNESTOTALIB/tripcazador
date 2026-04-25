/**
 * Sentry — cliente (browser).
 * Se activa automaticamente si NEXT_PUBLIC_SENTRY_DSN esta definida.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  // abr-2026m: release tracking — agrupar issues por release permite ver
  // regresiones tras cada deploy. El SHA se inyecta en build-time desde
  // Vercel/GitHub Actions vía NEXT_PUBLIC_GIT_SHA.
  const sha = process.env.NEXT_PUBLIC_GIT_SHA || "";
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";
  const release = `tripcazador-web@${version}${sha ? "+" + sha.slice(0, 12) : ""}`;

  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV || "production",
    release,
    // `dist` separa builds del mismo release (mobile vs desktop, locale, etc).
    // Usamos NEXT_PUBLIC_VERCEL_ENV (preview/production) si existe.
    dist: process.env.NEXT_PUBLIC_VERCEL_ENV || undefined,
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
    // Tag automático por SHA — filtrar issues "introducidos por commit X".
    initialScope: {
      tags: sha ? { git_sha: sha.slice(0, 12) } : undefined,
    },
  });
}
