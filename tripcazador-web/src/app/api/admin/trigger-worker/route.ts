import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/trigger-worker — fase SSS153 (may-2026)
 *
 * Botón "Trigger worker hunt now" en el panel del owner. Dispara el
 * workflow `worker.yml` en GitHub Actions vía workflow_dispatch.
 *
 * Auth: cookie de panel (verifyToken). Sin cookie válida → 401.
 *
 * Rate limit: 1 trigger cada 10 minutos por proceso (defense contra
 * click-spamming que agotaría GH Actions minutes y daría rate-limit en
 * la GitHub API). El estado vive en módulo (in-memory) — basta porque
 * solo el owner llega aquí.
 *
 * Env vars:
 *   GITHUB_PAT_TRIGGER_WORKER  PAT con scope `actions:write` sobre el
 *                              repo TripCazador. Si no está, retorna 503.
 *
 * Diferencia con GitHubHuntDispatcher: ese componente envía el PAT
 * desde el browser directamente a github.com (el PAT vive en localStorage
 * del owner). Aquí en cambio el PAT vive solo en Vercel — el browser no
 * lo ve nunca. Más seguro para automatizar desde el panel.
 */

const REPO_OWNER = "ERNESTOTALIB";
const REPO_NAME = "tripcazador";
const WORKFLOW_FILE = "worker.yml";
const RATELIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 min

// In-memory rate limit. Reset al deploy, suficiente para 1 owner.
const lastTriggerByUser: Map<string, number> = new Map();

export function _resetRateLimitForTests() {
  lastTriggerByUser.clear();
}

export async function POST(req: NextRequest) {
  // 1. Auth
  let session;
  try {
    session = verifyToken(cookies().get(COOKIE_KEY)?.value);
  } catch {
    session = null;
  }
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized", message: "Panel session required" },
      { status: 401 },
    );
  }

  // 2. PAT configurado
  const pat = process.env.GITHUB_PAT_TRIGGER_WORKER || "";
  if (!pat) {
    return NextResponse.json(
      {
        error: "pat_not_configured",
        message:
          "GITHUB_PAT_TRIGGER_WORKER env var no configurada en Vercel. Setear con scope actions:write.",
      },
      { status: 503 },
    );
  }

  // 3. Rate limit por usuario panel
  const now = Date.now();
  const last = lastTriggerByUser.get(session.user) || 0;
  const elapsed = now - last;
  if (last > 0 && elapsed < RATELIMIT_WINDOW_MS) {
    const retryInSec = Math.ceil((RATELIMIT_WINDOW_MS - elapsed) / 1000);
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `Espera ${Math.ceil(retryInSec / 60)} min antes de volver a disparar`,
        retry_after_seconds: retryInSec,
      },
      { status: 429, headers: { "Retry-After": String(retryInSec) } },
    );
  }

  // 4. Body opcional: { ref?: string }
  let ref = "main";
  try {
    const body = (await req.json()) as { ref?: string };
    if (body?.ref && typeof body.ref === "string" && /^[\w./-]+$/.test(body.ref)) {
      ref = body.ref;
    }
  } catch {
    /* body vacío es OK */
  }

  // 5. POST a GitHub
  const ghUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  try {
    const resp = await fetch(ghUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "tripcazador-panel-trigger/1.0",
      },
      body: JSON.stringify({ ref, inputs: {} }),
      signal: AbortSignal.timeout(10_000),
    });

    if (resp.status === 204) {
      // GH devuelve 204 No Content en éxito
      lastTriggerByUser.set(session.user, now);
      return NextResponse.json(
        {
          ok: true,
          message:
            "Workflow disparado. Espera 10-15 min para que aparezca commit nuevo en main.",
          workflow: WORKFLOW_FILE,
          ref,
          actions_url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}`,
        },
        { status: 202 },
      );
    }

    const txt = await resp.text();
    return NextResponse.json(
      {
        error: "github_api_error",
        github_status: resp.status,
        message: txt.slice(0, 500),
      },
      { status: 502 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        error: "fetch_failed",
        message: e instanceof Error ? e.message : "unknown",
      },
      { status: 502 },
    );
  }
}
