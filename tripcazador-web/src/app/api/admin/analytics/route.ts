import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { aggregate24h } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const session = verifyToken(cookies().get(COOKIE_KEY)?.value);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Aggregate analytics + complementar con stats motor
  const data = aggregate24h();

  // Hunter status (best-effort, fallback si /api/health no responde)
  let hunter = {
    last_run_at: null as string | null,
    last_run_status: "unknown",
    deals_total: 0,
    age_minutes: 0,
  };
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${baseUrl}/api/health`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const h = await res.json();
      hunter = {
        last_run_at: h.timestamp || null,
        last_run_status: h.status || "unknown",
        deals_total: h.deals_total || 0,
        age_minutes: h.last_hunt_minutes_ago || 0,
      };
    }
  } catch { /* best effort */ }

  return NextResponse.json({ ...data, hunter });
}
