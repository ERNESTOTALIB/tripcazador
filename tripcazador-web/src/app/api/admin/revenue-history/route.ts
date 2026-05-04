import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/revenue-history — fase SSS64 (May 2026)
 *
 * GET: devuelve serie histórica revenue diario (últimos 180 días).
 *
 * POST (interno, auth ADMIN_TOKEN bearer): añade snapshot de hoy.
 * Diseñado para que workflow GH `revenue-snapshot.yml` cron daily lo
 * llame con el agregado del día.
 *
 * Almacenamiento: in-memory ring + best-effort persist al backend FastAPI
 * (que escribe revenue_snapshots.jsonl). Vercel funciones son ephemeras
 * pero el backend sí persiste.
 *
 * Output GET:
 *   {
 *     daily: [{ date: "2026-05-01", revenue_eur, deal_clicks, bookings_out, premium_clicks }],
 *     summary: { total_30d, total_90d, avg_daily_30d, mtd },
 *     generated_at
 *   }
 */

interface RevenueSnapshot {
  date: string;        // YYYY-MM-DD UTC
  revenue_eur: number;
  deal_clicks: number;
  bookings_out: number;
  premium_clicks: number;
  visitors: number;
}

const MAX_HISTORY = 365;

const store: { history: RevenueSnapshot[] } = (
  globalThis as unknown as { __tc_revenue_history?: { history: RevenueSnapshot[] } }
).__tc_revenue_history ?? { history: [] };

(globalThis as unknown as { __tc_revenue_history: typeof store }).__tc_revenue_history = store;

function ymdUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_KEY)?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const daily = [...store.history].sort((a, b) => a.date.localeCompare(b.date));
  const last180 = daily.slice(-180);

  const now = new Date();
  const sumWindow = (days: number) => {
    const cutoff = new Date(now.getTime() - days * 24 * 3600 * 1000);
    const cutoffStr = ymdUTC(cutoff);
    return daily
      .filter((d) => d.date >= cutoffStr)
      .reduce((acc, d) => acc + d.revenue_eur, 0);
  };
  const total30 = sumWindow(30);
  const total90 = sumWindow(90);
  const monthStart = `${ymdUTC(now).slice(0, 7)}-01`;
  const mtd = daily
    .filter((d) => d.date >= monthStart)
    .reduce((acc, d) => acc + d.revenue_eur, 0);

  return NextResponse.json({
    daily: last180,
    summary: {
      total_30d: Math.round(total30 * 100) / 100,
      total_90d: Math.round(total90 * 100) / 100,
      avg_daily_30d: Math.round((total30 / 30) * 100) / 100,
      mtd_revenue: Math.round(mtd * 100) / 100,
      days_recorded: daily.length,
    },
    generated_at: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  // Auth via ADMIN_TOKEN bearer (workflow-friendly, no cookie)
  const expected = process.env.ADMIN_TOKEN || "";
  const auth = req.headers.get("authorization") || "";
  const provided = auth.replace(/^Bearer\s+/i, "");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Partial<RevenueSnapshot>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const date = String(body.date || ymdUTC(new Date()));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid date format" }, { status: 400 });
  }

  const snap: RevenueSnapshot = {
    date,
    revenue_eur: typeof body.revenue_eur === "number" ? body.revenue_eur : 0,
    deal_clicks: typeof body.deal_clicks === "number" ? body.deal_clicks : 0,
    bookings_out: typeof body.bookings_out === "number" ? body.bookings_out : 0,
    premium_clicks: typeof body.premium_clicks === "number" ? body.premium_clicks : 0,
    visitors: typeof body.visitors === "number" ? body.visitors : 0,
  };

  // Replace if same date already present
  const idx = store.history.findIndex((s) => s.date === snap.date);
  if (idx >= 0) {
    store.history[idx] = snap;
  } else {
    store.history.push(snap);
  }
  if (store.history.length > MAX_HISTORY) {
    store.history.splice(0, store.history.length - MAX_HISTORY);
  }

  return NextResponse.json({ ok: true, snapshot: snap });
}
