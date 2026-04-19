/**
 * Sentry — Edge runtime (middleware, route handlers edge).
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENV || "production",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_RATE || 0.1),
  });
}
