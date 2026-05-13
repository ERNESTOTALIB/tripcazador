"use client";

import { useState } from "react";

/**
 * AdminWorkerTrigger — fase SSS153 (may-2026)
 *
 * Botón que dispara el workflow `worker.yml` vía POST /api/admin/trigger-worker.
 * Pensado para montarse dentro del panel del owner. El PAT vive en Vercel
 * (server-side), nunca llega al browser — más seguro que GitHubHuntDispatcher.
 *
 * UX:
 *   - 1 click → POST inmediato
 *   - Feedback "Disparado, espera 10-15 min" si 202
 *   - Si 503 (PAT no configurado) o 429 (rate limit) muestra mensaje claro
 *   - Auto-resetea estado tras 30s
 */

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; message: string; actionsUrl?: string }
  | { kind: "error"; message: string };

export function AdminWorkerTrigger() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function trigger() {
    setState({ kind: "loading" });
    try {
      const r = await fetch("/api/admin/trigger-worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        actions_url?: string;
        error?: string;
      };
      if (r.status === 202 && data.ok) {
        setState({
          kind: "ok",
          message: data.message || "Workflow disparado.",
          actionsUrl: data.actions_url,
        });
        // Auto-reset
        setTimeout(() => setState({ kind: "idle" }), 30_000);
        return;
      }
      const msg =
        data.message ||
        (r.status === 401
          ? "Sesión expirada — vuelve a entrar al panel"
          : r.status === 429
            ? "Rate-limit: espera unos minutos"
            : r.status === 503
              ? "PAT no configurado (GITHUB_PAT_TRIGGER_WORKER falta en Vercel)"
              : `Error HTTP ${r.status}`);
      setState({ kind: "error", message: msg });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Network error",
      });
    }
  }

  return (
    <div
      data-testid="admin-worker-trigger"
      className="inline-flex flex-col gap-2"
    >
      <button
        type="button"
        onClick={trigger}
        disabled={state.kind === "loading"}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-md text-sm"
        aria-label="Disparar workflow worker.yml ahora"
      >
        {state.kind === "loading" ? "⏳ Disparando…" : "🚀 Trigger worker hunt now"}
      </button>
      {state.kind === "ok" && (
        <p
          role="status"
          data-testid="admin-worker-trigger-ok"
          className="text-xs text-emerald-300 max-w-xs"
        >
          {state.message}
          {state.actionsUrl && (
            <>
              {" "}
              <a
                href={state.actionsUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-emerald-200"
              >
                Ver en GitHub Actions ↗
              </a>
            </>
          )}
        </p>
      )}
      {state.kind === "error" && (
        <p
          role="alert"
          data-testid="admin-worker-trigger-error"
          className="text-xs text-red-300 max-w-xs"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
