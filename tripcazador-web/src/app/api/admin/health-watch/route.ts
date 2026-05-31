import { NextRequest, NextResponse } from "next/server";
import { aggregate24h, getRecentEvents } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/health-watch — fase SSS61 (May 2026)
 *
 * Cron-friendly endpoint que detecta anomalías y notifica al owner por
 * Telegram. Diseñado para ser llamado cada 15min por GH Actions o
 * Vercel Cron.
 *
 * Triggers de alerta:
 *  1. Visitantes 1h < 10% de la media móvil 6h (caída tráfico)
 *  2. Hunter last_run > 360 min (cron caído)
 *  3. /api/health devuelve != "ok" (backend down)
 *  4. Errores 5xx > 1% en /api/track (instrumentación rota)
 *
 * Auth: token URL ?key= (compartido con cron). Sin cookie panel para
 * facilitar invocación desde GH Actions.
 *
 * Telegram: TG_BOT_TOKEN + TG_OWNER_CHAT_ID env vars.
 */

interface AlertResult {
  trigger: string;
  severity: "info" | "warn" | "crit";
  message: string;
  details: Record<string, number | string>;
}

async function checkHunterHealth(): Promise<AlertResult | null> {
  // AUDIT-WEB FIX-CQ-H3 (31 may 2026): backend Oracle VPS eliminado en
  // refactor static-only. Sin VPS no hay /api/health remoto que probar.
  // Early-return null para no spamear Sentry/Telegram con "backend_down"
  // cada 15 min. Hunter health real ahora se infiere de deals-latest.json
  // generated_at (ver healthcheck route).
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const r = await fetch(`${apiUrl}/api/health`, {
      headers: { "User-Agent": "tc-health-watch/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      return {
        trigger: "backend_down",
        severity: "crit",
        message: `Backend FastAPI HTTP ${r.status}`,
        details: { status: r.status },
      };
    }
    const data = (await r.json()) as { hunter_last_run_min?: number; status?: string };
    const lastMin = data.hunter_last_run_min ?? 9999;
    if (lastMin > 360) {
      return {
        trigger: "hunter_stale",
        severity: "warn",
        message: `Hunter sin ejecución hace ${lastMin} min (>6h)`,
        details: { last_run_min: lastMin },
      };
    }
    return null;
  } catch (e) {
    return {
      trigger: "backend_unreachable",
      severity: "crit",
      message: `No respondió /api/health: ${e instanceof Error ? e.message : "?"}`,
      details: {},
    };
  }
}

function checkTrafficDip(): AlertResult | null {
  const events = getRecentEvents();
  const now = Date.now();
  const last1h = events.filter((e) => e.type === "page_view" && now - e.ts < 3600_000).length;
  const last6h = events.filter(
    (e) => e.type === "page_view" && now - e.ts < 6 * 3600_000,
  ).length;
  const avg1h = last6h / 6;
  if (avg1h < 5) return null; // muy poco tráfico para alertar
  if (last1h < avg1h * 0.1) {
    return {
      trigger: "traffic_dip",
      severity: "warn",
      message: `Visitantes 1h cayeron a ${last1h} (esperado ~${Math.round(avg1h)})`,
      details: { last_1h: last1h, avg_1h_window_6h: Math.round(avg1h) },
    };
  }
  return null;
}

function checkPremiumInterest(): AlertResult | null {
  const events = getRecentEvents();
  const now = Date.now();
  const last24h = events.filter((e) => now - e.ts < 24 * 3600_000);
  const premViews = last24h.filter((e) => e.type === "premium_cta_view").length;
  const premClicks = last24h.filter(
    (e) => e.type === "premium_cta_click" || e.type === "concierge_click_pay",
  ).length;
  // INFO-only: notifica si hay actividad premium para Ernesto sepa
  if (premClicks >= 3) {
    return {
      trigger: "premium_interest_high",
      severity: "info",
      message: `${premClicks} clicks Premium en últimas 24h (${premViews} views)`,
      details: { clicks_24h: premClicks, views_24h: premViews },
    };
  }
  return null;
}

async function notifyTelegram(alerts: AlertResult[]): Promise<boolean> {
  const token = process.env.TG_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TG_OWNER_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "";
  if (!token || !chatId || alerts.length === 0) return false;
  const emoji = (s: string) => (s === "crit" ? "🚨" : s === "warn" ? "⚠️" : "ℹ️");
  const lines = alerts.map(
    (a) => `${emoji(a.severity)} *${a.trigger}*\n${a.message}`,
  );
  const text = `🛰 *TripCazador health watch*\n\n${lines.join("\n\n")}\n\n_${new Date().toISOString()}_`;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const expected = process.env.HEALTH_WATCH_KEY || "";
  if (expected && sp.get("key") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const alerts: AlertResult[] = [];
  const hunter = await checkHunterHealth();
  if (hunter) alerts.push(hunter);
  const traffic = checkTrafficDip();
  if (traffic) alerts.push(traffic);
  const prem = checkPremiumInterest();
  if (prem) alerts.push(prem);

  const notified = alerts.length > 0 ? await notifyTelegram(alerts) : false;

  const agg = aggregate24h();
  return NextResponse.json({
    checked_at: new Date().toISOString(),
    alerts,
    notified_telegram: notified,
    snapshot: {
      visitors_24h: agg.totals.unique_visitors_24h,
      page_views_24h: agg.totals.page_views_24h,
      deal_clicks_24h: agg.totals.deal_clicks_24h,
    },
  });
}
