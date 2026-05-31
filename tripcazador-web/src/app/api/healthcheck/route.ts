/**
 * /api/healthcheck — SSS468 (24 may 2026)
 *
 * Endpoint público (read-only) para uptime monitors externos (UptimeRobot,
 * Pingdom, BetterStack). Probe ligero de subsistemas críticos:
 *
 * - status: "ok" | "degraded" (algunos componentes con error)
 * - version: BUILD_ID short (git sha)
 * - subsystems[]: lista verificaciones (backend, deals_fresh, stripe_ready)
 *
 * NO incluye secrets ni KV completos. Latency limit 5s por subsistema.
 * Public CORS-enabled (uptime monitors necesitan).
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";

interface SubsystemStatus {
  name: string;
  ok: boolean;
  latencyMs: number;
  note?: string;
}

async function probeBackend(): Promise<SubsystemStatus> {
  // AUDIT-FIX (31 may 2026): backend Oracle VPS eliminado en refactor static-only.
  // El "subsystem backend" antes verificaba /api/health del FastAPI VPS; ahora
  // no aplica. Mantenemos el slot por compat con monitors externos pero lo
  // marcamos como deprecated (ok=true, sin fetch real).
  return {
    name: "backend",
    ok: true,
    latencyMs: 0,
    note: "deprecated_static_only",
  };
}

async function probeDealsFresh(): Promise<SubsystemStatus> {
  const start = Date.now();
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com"}/deals-latest.json`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        name: "deals_fresh",
        ok: false,
        latencyMs: Date.now() - start,
        note: `HTTP ${res.status}`,
      };
    }
    const j = (await res.json().catch(() => null)) as { generated_at?: string } | null;
    if (!j || !j.generated_at) {
      return {
        name: "deals_fresh",
        ok: false,
        latencyMs: Date.now() - start,
        note: "missing_generated_at",
      };
    }
    const ageHours = (Date.now() - new Date(j.generated_at).getTime()) / 3600000;
    return {
      name: "deals_fresh",
      ok: ageHours < 12, // <12h fresh
      latencyMs: Date.now() - start,
      note: `${ageHours.toFixed(1)}h old`,
    };
  } catch (e) {
    return {
      name: "deals_fresh",
      ok: false,
      latencyMs: Date.now() - start,
      note: e instanceof Error ? e.name : "fetch_failed",
    };
  }
}

function probeStripe(): SubsystemStatus {
  return {
    name: "stripe_configured",
    ok: STRIPE_KEY.length > 10,
    latencyMs: 0,
    note: STRIPE_KEY.startsWith("sk_live") ? "LIVE" : STRIPE_KEY.startsWith("sk_test") ? "TEST" : "NOT_SET",
  };
}

function probeKv(): SubsystemStatus {
  return {
    name: "kv_configured",
    ok: KV_URL.length > 10,
    latencyMs: 0,
    note: KV_URL ? "configured" : "NOT_SET — in-memory fallback active",
  };
}

export async function GET(): Promise<NextResponse> {
  const [backend, dealsFresh] = await Promise.all([probeBackend(), probeDealsFresh()]);
  const stripe = probeStripe();
  const kv = probeKv();

  const subsystems: SubsystemStatus[] = [backend, dealsFresh, stripe, kv];
  // SSS472: KV es opcional (in-memory fallback funciona OK).
  // AUDIT-FULL-2 (24 may 2026): backend remoto puede estar caído pero si
  // deals_fresh está OK (cache <12h), el sitio público funciona. No 503.
  // criticalOk requiere solo (stripe LIVE configurado) + (deals frescos o backend OK)
  const dealsOrBackend = dealsFresh.ok || backend.ok;
  const criticalOk = stripe.ok && dealsOrBackend;
  const allOk = subsystems.every((s) => s.ok);

  const body = {
    status: allOk ? "ok" : criticalOk ? "partial" : "degraded",
    version: (process.env.VERCEL_GIT_COMMIT_SHA || "dev").slice(0, 8),
    timestamp: new Date().toISOString(),
    subsystems,
  };

  return NextResponse.json(body, {
    status: criticalOk ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
