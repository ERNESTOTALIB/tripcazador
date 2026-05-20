/**
 * /api/push/register — SSS357 (20 may 2026)
 *
 * Registra un Expo push token desde la app mobile. Persiste:
 *   - token (ExponentPushToken[xxx])
 *   - platform ("ios" | "android")
 *   - app_version
 *   - registered_at
 *
 * Store: in-memory + globalThis para sobrevivir hot reload. Idealmente
 * persistir a Vercel KV o backend FastAPI para crons.
 *
 * Anti-abuse:
 *   - Rate limit por IP (10/min) — sin librería externa, in-memory window
 *   - Tokens duplicados se reemplazan (dedupe por token string)
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PushTokenEntry {
  token: string;
  platform: "ios" | "android";
  app_version: string;
  registered_at: number;
  ip?: string;
}

const tokenStore: { entries: PushTokenEntry[] } = (
  globalThis as unknown as { __tc_push_tokens?: { entries: PushTokenEntry[] } }
).__tc_push_tokens ?? { entries: [] };
(globalThis as unknown as { __tc_push_tokens: typeof tokenStore }).__tc_push_tokens =
  tokenStore;

const rateLimit: { hits: Map<string, number[]> } = (
  globalThis as unknown as { __tc_push_rate?: { hits: Map<string, number[]> } }
).__tc_push_rate ?? { hits: new Map() };
(globalThis as unknown as { __tc_push_rate: typeof rateLimit }).__tc_push_rate =
  rateLimit;

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = rateLimit.hits.get(ip) ?? [];
  const recent = arr.filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  rateLimit.hits.set(ip, recent);
  return recent.length > RATE_MAX;
}

const EXPO_TOKEN_RE = /^ExponentPushToken\[[A-Za-z0-9_-]+\]$|^ExpoPushToken\[[A-Za-z0-9_-]+\]$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const token = String(body.token || "").trim();
  const platform = String(body.platform || "").toLowerCase();
  const appVersion = String(body.app_version || "").slice(0, 32);

  if (!EXPO_TOKEN_RE.test(token)) {
    return NextResponse.json(
      { ok: false, error: "invalid_token_format" },
      { status: 400 },
    );
  }
  if (platform !== "ios" && platform !== "android") {
    return NextResponse.json(
      { ok: false, error: "invalid_platform" },
      { status: 400 },
    );
  }

  // Dedupe por token (mismo device re-registrando)
  const idx = tokenStore.entries.findIndex((e) => e.token === token);
  const entry: PushTokenEntry = {
    token,
    platform: platform as "ios" | "android",
    app_version: appVersion,
    registered_at: Date.now(),
    ip,
  };
  if (idx >= 0) tokenStore.entries[idx] = entry;
  else tokenStore.entries.push(entry);

  return NextResponse.json({ ok: true, total: tokenStore.entries.length });
}

// GET para health check + admin listing (requiere ADMIN_TOKEN bearer)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("authorization") || "";
  const adminToken = process.env.ADMIN_TOKEN || "";
  if (!adminToken || auth !== `Bearer ${adminToken}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    total: tokenStore.entries.length,
    by_platform: {
      ios: tokenStore.entries.filter((e) => e.platform === "ios").length,
      android: tokenStore.entries.filter((e) => e.platform === "android").length,
    },
  });
}
