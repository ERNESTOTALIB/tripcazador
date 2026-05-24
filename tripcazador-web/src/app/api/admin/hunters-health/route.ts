/**
 * /api/admin/hunters-health — fase qqq4
 *
 * Agrega métricas de salud del sistema hunter para el dashboard /panel/hunters:
 * - Total templates seed
 * - Distribución por región
 * - Distribución por mes (próximos 12)
 * - Última hunt cron real (fetch a /api/health backend)
 * - Quotas API (estimadas si no hay endpoint backend)
 *
 * Auth: requiere ADMIN_TOKEN en cookie (panel_session) o header.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FALLBACK_CATALOG } from "@/lib/hunter_health_data";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HuntersHealth {
  generated_at: string;
  templates: {
    total: number;
    by_region: Record<string, number>;
    by_month: Record<string, number>;
    by_classification: Record<string, number>;
    by_origin: Record<string, number>;
  };
  worker: {
    last_run_iso: string | null;
    last_run_status: string;
    deals_total: number;
    quota_estimates: {
      rapidapi_calls_today: number;
      serpapi_calls_today: number;
      aviationstack_calls_today: number;
    };
  };
  alerts: Array<{ severity: "info" | "warning" | "error"; message: string }>;
}

export async function GET(req: NextRequest) {
  // SSS265 (17 may 2026) — SECURITY FIX:
  // - Cookie name era "panel_session" (wrong) en lugar de "tc_panel_session"
  //   (COOKIE_KEY constante de panel_auth.ts) → session siempre undefined.
  // - Lógica `!session && !ADMIN_TOKEN` permitía bypass auth en cualquier
  //   request si ADMIN_TOKEN env var estaba set en Vercel (que sí lo está
  //   para forwarding al backend FastAPI). Resultado: cualquiera podía
  //   GETtear el endpoint en prod.
  // Fix: usar COOKIE_KEY + verifyToken (mismo patrón que admin/vitals).
  // Para uso server-to-server (cron desde GH Actions), añadir Bearer ADMIN_TOKEN
  // header — esto NO se cumple solo por tener el env var en server.
  const ck = await cookies();
  const session = verifyToken(ck.get(COOKIE_KEY)?.value);
  if (!session) {
    const auth = req.headers.get("authorization") || "";
    const adminToken = process.env.ADMIN_TOKEN || "";
    const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    // AUDIT-FULL FIX-SEC-3 (24 may 2026): constant-time compare (otros admin
    // routes ya usan timingSafeEqual desde SSS329; este endpoint era el outlier).
    if (!adminToken || provided.length !== adminToken.length) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    try {
      const provBuf = Buffer.from(provided);
      const tokBuf = Buffer.from(adminToken);
      const cryptoMod = await import("node:crypto");
      if (!cryptoMod.timingSafeEqual(provBuf, tokBuf)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const templates = FALLBACK_CATALOG;
  const byRegion: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  const byClassification: Record<string, number> = {};
  const byOrigin: Record<string, number> = {};
  for (const t of templates) {
    const r = t.region || "Unknown";
    byRegion[r] = (byRegion[r] || 0) + 1;
    const m = (t.date_out || "").slice(0, 7) || "Unknown";
    byMonth[m] = (byMonth[m] || 0) + 1;
    const c = t.classification || "NORMAL";
    byClassification[c] = (byClassification[c] || 0) + 1;
    const o = t.origin || "Unknown";
    byOrigin[o] = (byOrigin[o] || 0) + 1;
  }

  // Fetch real backend health
  let workerLastRun: string | null = null;
  let workerStatus = "unknown";
  let dealsTotal = 0;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.tripcazador.com";
    const r = await fetch(`${apiUrl}/api/health`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const data = await r.json();
      workerLastRun = data.deals_updated_at || null;
      workerStatus = data.deals_exists ? "ok" : "no-deals";
      dealsTotal = data.deals_count || 0;
    }
  } catch {
    workerStatus = "backend-unreachable";
  }

  // Alerts heuristic
  const alerts: HuntersHealth["alerts"] = [];
  if (workerStatus === "no-deals" || dealsTotal === 0) {
    alerts.push({
      severity: "error",
      message: "Worker no tiene deals reales — solo se sirve catálogo sintético. Revisa GH Secrets RAPIDAPI_KEY/SERPAPI_KEY.",
    });
  }
  if (workerStatus === "backend-unreachable") {
    alerts.push({
      severity: "error",
      message: "Backend FastAPI VPS inalcanzable. Verifica https://api.tripcazador.com/api/health.",
    });
  }
  if (workerLastRun) {
    const ageMin = (Date.now() - new Date(workerLastRun).getTime()) / 60000;
    if (ageMin > 720) {
      alerts.push({
        severity: "warning",
        message: `Última hunt cron hace ${Math.round(ageMin / 60)}h — esperado <12h. Revisa GH Action 'Worker'.`,
      });
    }
  }
  if (templates.length < 200) {
    alerts.push({
      severity: "info",
      message: `Catálogo sintético ${templates.length} templates — target 250+.`,
    });
  }

  const health: HuntersHealth = {
    generated_at: new Date().toISOString(),
    templates: {
      total: templates.length,
      by_region: byRegion,
      by_month: byMonth,
      by_classification: byClassification,
      by_origin: byOrigin,
    },
    worker: {
      last_run_iso: workerLastRun,
      last_run_status: workerStatus,
      deals_total: dealsTotal,
      quota_estimates: {
        rapidapi_calls_today: 0,
        serpapi_calls_today: 0,
        aviationstack_calls_today: 0,
      },
    },
    alerts,
  };

  return NextResponse.json(health, {
    headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
  });
}
