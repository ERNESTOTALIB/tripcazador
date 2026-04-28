import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, issueToken, buildSetCookieHeader } from "@/lib/panel_auth";

export const runtime = "nodejs"; // requiere crypto module
export const dynamic = "force-dynamic";

// Simple rate-limit en memoria (por IP). Reset cada 5 min.
const attemptMap = new Map<string, { count: number; firstAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const now = Date.now();
  const rec = attemptMap.get(ip);
  if (rec && now - rec.firstAt < WINDOW_MS && rec.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many attempts" },
      { status: 429, headers: { "Retry-After": "300" } }
    );
  }

  let body: { user?: string; pass?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const ok = checkCredentials(body.user || "", body.pass || "");
  if (!ok) {
    if (rec && now - rec.firstAt < WINDOW_MS) {
      attemptMap.set(ip, { count: rec.count + 1, firstAt: rec.firstAt });
    } else {
      attemptMap.set(ip, { count: 1, firstAt: now });
    }
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  // success — limpiar attempts + emitir cookie
  attemptMap.delete(ip);
  const token = issueToken(body.user || "");
  const resp = NextResponse.json({ ok: true });
  resp.headers.set("Set-Cookie", buildSetCookieHeader(token));
  return resp;
}
