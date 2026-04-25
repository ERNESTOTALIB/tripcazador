/**
 * Sentry — Edge runtime (middleware, route handlers edge).
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  const sha = process.env.GIT_SHA || process.env.NEXT_PUBLIC_GIT_SHA || "";
  const version = process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";
  const release = `tripcazador-web@${version}${sha ? "+" + sha.slice(0, 12) : ""}`;

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENV || "production",
    release,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_RATE || 0.1),
    initialScope: {
      tags: sha ? { git_sha: sha.slice(0, 12) } : undefined,
    },
  });
}
