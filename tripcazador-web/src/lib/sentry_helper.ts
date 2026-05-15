/**
 * sentry_helper.ts — SSS181 (May 2026)
 *
 * Wrapper conveniente para Sentry.captureException con tags/extra estructurados
 * en route handlers de revenue/payment críticos. Patrón:
 *
 *     import { captureRevenueError } from "@/lib/sentry_helper";
 *     try { ... } catch (err) {
 *       captureRevenueError(err, {
 *         module: "concierge_checkout",
 *         code: "stripe_session_failed",
 *         extra: { order_id, email },
 *       });
 *       return NextResponse.json({ error: "..." }, { status: 502 });
 *     }
 *
 * Si SENTRY_DSN env var no está seteado, Sentry.init() no se ejecuta y
 * captureException es no-op (safe to call siempre). En tests vitest también
 * no-op porque Sentry no está inicializado en jsdom environment.
 *
 * Por qué un helper en lugar de Sentry.captureException directo:
 *   1) Anti-boilerplate: 3-5 líneas por catch → 1 import + 1 call.
 *   2) Convención: todos los tags `module` y `code` salen de un mismo set
 *      enumerado → grep '"module":' en Sentry para auditar coverage.
 *   3) Test-friendly: mockable via vi.mock("@/lib/sentry_helper").
 *   4) Antes este file no existía, había 0 captureException en código →
 *      Sentry solo capturaba uncaught (poco útil porque los critical paths
 *      ya tienen try/catch que swallow).
 */

import * as Sentry from "@sentry/nextjs";

export interface RevenueErrorContext {
  /** Identificador del módulo que falló (ej: "concierge_checkout", "stripe_webhook"). */
  module: string;
  /** Subtipo del error (ej: "stripe_session_failed", "backend_persist_failed"). */
  code: string;
  /** Datos adicionales útiles para debug. NUNCA incluir PII sin pseudonimizar. */
  extra?: Record<string, unknown>;
  /** Severity Sentry: default "error". Usar "warning" para non-blocking failures. */
  level?: "fatal" | "error" | "warning" | "info";
}

/**
 * Captura un error de revenue/payment a Sentry con tags estructurados.
 * Safe to call si Sentry no está inicializado (SENTRY_DSN ausente) — no-op.
 */
export function captureRevenueError(err: unknown, ctx: RevenueErrorContext): void {
  try {
    Sentry.captureException(err, {
      tags: { module: ctx.module, code: ctx.code },
      extra: ctx.extra,
      level: ctx.level || "error",
    });
  } catch {
    /* swallow: Sentry SDK puede no estar inicializado en algunos paths
       (edge runtime, tests). El error original ya está siendo manejado por
       el caller — capturar fallido NO debe romper el flow. */
  }
}

/**
 * Captura un mensaje (no-error) a Sentry. Útil para warnings sin throw.
 */
export function captureRevenueMessage(message: string, ctx: RevenueErrorContext): void {
  try {
    Sentry.captureMessage(message, {
      tags: { module: ctx.module, code: ctx.code },
      extra: ctx.extra,
      level: ctx.level || "warning",
    });
  } catch {
    /* swallow */
  }
}
