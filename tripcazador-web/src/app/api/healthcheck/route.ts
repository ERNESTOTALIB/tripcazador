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

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";

interface SubsystemStatus {
  name: string;
  ok: boolean;
  latencyMs: number;
  note?: string;
}

async function probeBackend(): Promise<SubsystemStatus> {
  if (!BACKEND_URL) return { name: "backend", ok: false, latencyMs: 0, note: "NOT_CONFIGURED" };
  const start = Date.now();
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    return {
      name: "backend",
      ok: res.ok,
      latencyMs: Date.now() - start,
      note: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      name: "backend",
      ok: false,
      latencyMs: Date.now() - start,
      note: e instanceof Error ? e.name : "fetch_failed",
    };
  }
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
  // SSS472: KV es opcional (in-memory fallback funciona OK). No degradar 503
  // si solo KV falla — solo backend + deals_fresh + stripe son críticos para
  // uptime alerts externos.
  const criticalOk = backend.ok && dealsFresh.ok && stripe.ok;
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
