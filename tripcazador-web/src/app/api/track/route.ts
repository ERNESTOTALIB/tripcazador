import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { trackEvent, EventType } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// fase tt-TT2: ampliados — calc_used / share_clicked / telegram_clicked permiten
// saber qué calculadoras usan, qué se comparte, qué Telegram conversions.
// SSS63: 9 eventos nuevos del funnel (landing/result/scroll/favorite/share/
// premium/concierge) — instrumentados desde frontend (lib/track_client.ts).
const VALID_TYPES: string[] = [
  "page_view",
  "deal_click",
  "search_submitted",
  "booking_redirect",
  "newsletter_signup",
  "alert_created",
  "calc_used",
  "share_clicked",
  "telegram_clicked",
  // SSS63 funnel events
  "landing_arrived",
  "result_viewed",
  "share_completed",
  "favorite_added",
  "scroll_75",
  "concierge_view",
  "concierge_click_pay",
  "premium_cta_view",
  "premium_cta_click",
];

// AUDIT-WEB FIX-CQ-H1 (31 may 2026): BACKEND_URL + ADMIN_TOKEN + persistRemote
// eliminados — backend Oracle VPS terminated (refactor static-only). La
// persistencia ahora es: in-memory ring + GitHub commit JSONL. No regresión:
// el VPS fire-and-forget ya silently fallaba post-18-may y nadie notó la
// pérdida (solo 2s timeout per request).

// SSS80: persistencia garantizada en GitHub repo (data/events-recent.jsonl).
// Buffer global de la lambda (compartido entre requests del mismo container)
// que se flusha cada 5 eventos al GH API. Antes el VPS estaba caído y los
// eventos se perdían, dejándonos viendo 59 visitas vs los 476 reales de CF.
const ghBuffer: Array<{ ts: string; type: string; visitor: string; meta: Record<string, string | number | boolean> }> = [];
// SSS174: era 5, pero events de alto valor (deal_click, booking_redirect,
// favorite_added, newsletter_signup) son MUY raros (~1 cada 5 visitas).
// Si lambda muere antes de acumular 5, perdíamos los más importantes.
// Threshold inteligente: flush inmediato para events de revenue,
// batch para eventos de bajo valor (page_view, scroll_75).
const GH_FLUSH_THRESHOLD = 3;
const FLUSH_IMMEDIATELY = new Set([
  "deal_click",
  "booking_redirect",
  "favorite_added",
  "newsletter_signup",
  "alert_created",
  "share_completed",
  "premium_cta_click",
  "concierge_click_pay",
]);

async function flushBufferToGitHub() {
  const ghToken = process.env.GH_TRACK_TOKEN || process.env.GITHUB_TOKEN || "";
  if (!ghToken) {
    // SSS181: si no hay token, los events se pierden silenciosamente. Antes
    // era simplemente `return`. Ahora log a stderr para que Vercel logs
    // tengan visibilidad — el operator puede grep "[track] GH_TRACK_TOKEN"
    // y ver que la env var falta.
    if (ghBuffer.length > 0) {
      console.error(
        `[track] GH_TRACK_TOKEN/GITHUB_TOKEN no seteado — perdiendo ${ghBuffer.length} events (set en Vercel env vars).`,
      );
      ghBuffer.length = 0; // limpiamos para no acumular indefinidamente
    }
    return;
  }
  if (ghBuffer.length === 0) return;
  const events = ghBuffer.splice(0, ghBuffer.length);
  const repo = "ERNESTOTALIB/tripcazador";
  const path = "data/events-recent.jsonl";
  try {
    let sha: string | undefined;
    let current = "";
    const getR = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: { Authorization: `token ${ghToken}`, Accept: "application/vnd.github+json" },
    });
    if (getR.ok) {
      const data = await getR.json();
      sha = data.sha;
      current = Buffer.from(data.content, "base64").toString("utf-8");
    } else if (getR.status !== 404) {
      // SSS181: 401/403 = token inválido. 422 = conflict por SHA. Log para
      // hacer visible cuál es la causa real del fail. 404 es OK (file no
      // existe aún, lo creamos abajo).
      console.error(`[track] GH contents GET ${getR.status} — losing ${events.length} events`);
    }
    const newLines = events.map((e) => JSON.stringify(e)).join("\n");
    const all = (current ? current.trimEnd() + "\n" : "") + newLines + "\n";
    // Mantén last 1000 lines para que el archivo no crezca infinitamente
    const trimmed = all.split("\n").filter((l) => l.trim()).slice(-1000).join("\n") + "\n";
    const putR = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${ghToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `chore(track): +${events.length} events [skip ci]`,
        content: Buffer.from(trimmed, "utf-8").toString("base64"),
        sha,
      }),
    });
    if (!putR.ok) {
      // SSS181: explicit log when PUT fails (lo más común: 409 Conflict por
      // concurrent flushes de lambdas distintos). Antes silent → 80% visibility
      // loss invisible.
      console.error(`[track] GH PUT ${putR.status} — lost ${events.length} events`);
    }
  } catch (err) {
    // SSS181: log unexpected errors (network, timeout). Mejor que bloquear el
    // response del user, pero AL MENOS dejar rastro en Vercel logs para que
    // el operator pueda diagnosticar visibility gaps.
    console.error(
      "[track] GH flush failed:",
      err instanceof Error ? err.message : String(err),
      `(lost ${events.length} events)`,
    );
  }
}

// Rate limit muy básico — cada IP máx 200 events/min
const rate = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 200;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function visitorId(req: NextRequest): string {
  const ip = getIp(req);
  const ua = req.headers.get("user-agent") || "";
  return crypto.createHash("sha256").update(ip + ua).digest("hex").slice(0, 16);
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const now = Date.now();
  const r = rate.get(ip);
  if (r && now - r.windowStart < RATE_WINDOW_MS) {
    if (r.count >= RATE_LIMIT) {
      return NextResponse.json({ error: "rate-limited" }, { status: 429 });
    }
    r.count++;
  } else {
    rate.set(ip, { count: 1, windowStart: now });
  }

  let body: { type?: string; meta?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const type = body.type as EventType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const meta = body.meta && typeof body.meta === "object" ? body.meta : {};
  // Sanitizar meta: solo strings/numbers/booleans, max 20 keys, cada string max 200 chars
  const sanitized: Record<string, string | number | boolean> = {};
  let count = 0;
  for (const [k, v] of Object.entries(meta)) {
    if (count >= 20) break;
    if (typeof v === "string" && v.length <= 200) sanitized[k] = v;
    else if (typeof v === "number" && Number.isFinite(v)) sanitized[k] = v;
    else if (typeof v === "boolean") sanitized[k] = v;
    count++;
  }

  const event = {
    ts: now,
    type: type as EventType,
    visitor_id: visitorId(req),
    meta: sanitized,
  };

  // 1) In-memory ring (rápido, vista admin sin backend)
  trackEvent(event);

  // 2) AUDIT-WEB (31 may 2026): persistRemote eliminado — VPS muerto.

  // 3) SSS80: persistencia GitHub. VPS está down, event_store es por-lambda
  // (perdemos 80% de visibility). GH API es lento pero PERSISTE → veremos
  // todos los eventos reales en data/events-recent.jsonl.
  ghBuffer.push({
    ts: new Date(now).toISOString(),
    type,
    visitor: event.visitor_id,
    meta: sanitized,
  });
  // SSS174: flush inmediato para events de revenue/conversión (no perdemos
  // ninguno por cold-start), batch para los de bajo valor (page_view).
  //
  // SSS178 (May 2026, smoke audit reveló GH no commiteaba events de revenue
  // tras smoke directo a /api/p): el fire-and-forget en Vercel Node runtime
  // NO garantiza que el callback async complete antes de killar el lambda.
  // Para revenue events ahora AWAITAMOS el flush (+200-500ms latency aceptable
  // ya que sendBeacon no espera la respuesta — el user no nota nada).
  // Para events de bajo valor (page_view, scroll_75) mantenemos fire-and-forget.
  const mustFlushSync = FLUSH_IMMEDIATELY.has(type);
  if (mustFlushSync) {
    try {
      await flushBufferToGitHub();
    } catch {
      // si el flush sync falla devolvemos OK igualmente — perder un evento es
      // mejor que rejectar el response (frontend retry o se pierde silenciosamente)
    }
  } else if (ghBuffer.length >= GH_FLUSH_THRESHOLD) {
    flushBufferToGitHub().catch(() => { /* no-op */ });
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
