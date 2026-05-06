/**
 * /api/admin/events-recent — SSS80 (May 2026)
 *
 * Lee el JSONL persistente desde el repo (data/events-recent.jsonl, escrito
 * por /api/track) y devuelve análisis: top paths, top destinos clicados,
 * embudo, etc. Persiste de verdad — no se pierden eventos entre lambdas.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Event = {
  ts: string;
  type: string;
  visitor: string;
  meta: Record<string, string | number | boolean>;
};

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_KEY)?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Read JSONL desde repo público (sin auth, mucho más rápido)
  let lines: string[] = [];
  try {
    const r = await fetch(
      "https://raw.githubusercontent.com/ERNESTOTALIB/tripcazador/main/data/events-recent.jsonl",
      { cache: "no-store" },
    );
    if (r.ok) {
      const text = await r.text();
      lines = text.split("\n").filter((l) => l.trim());
    }
  } catch {
    // ignore
  }

  const events: Event[] = lines
    .map((l) => {
      try {
        return JSON.parse(l) as Event;
      } catch {
        return null;
      }
    })
    .filter((e): e is Event => e !== null);

  // Aggregations
  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  const recent = events.filter((e) => new Date(e.ts).getTime() >= last24h);

  const byType = new Map<string, number>();
  const byPath = new Map<string, number>();
  const byVisitor = new Set<string>();
  const dealClicks = new Map<string, number>();
  const searchTo = new Map<string, number>();
  const referrers = new Map<string, number>();

  for (const e of recent) {
    byType.set(e.type, (byType.get(e.type) || 0) + 1);
    byVisitor.add(e.visitor);

    const meta = e.meta || {};
    const path = String(meta.path || "");
    if (path) byPath.set(path, (byPath.get(path) || 0) + 1);

    if (e.type === "deal_click") {
      const dest = String(meta.destination || meta.city_to || "?");
      if (dest && dest !== "?") dealClicks.set(dest, (dealClicks.get(dest) || 0) + 1);
    }
    if (e.type === "search_submitted") {
      const dest = String(meta.destination || meta.city_to || "?");
      if (dest && dest !== "?") searchTo.set(dest, (searchTo.get(dest) || 0) + 1);
    }
    const ref = String(meta.referrer || meta.utm_source || "");
    if (ref) referrers.set(ref, (referrers.get(ref) || 0) + 1);
  }

  function topN<K>(map: Map<K, number>, n: number) {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, count]) => ({ key: k, count }));
  }

  return NextResponse.json({
    period: "24h",
    generated_at: new Date().toISOString(),
    total_events: recent.length,
    total_events_all_time: events.length,
    unique_visitors: byVisitor.size,
    by_type: Object.fromEntries(byType),
    top_paths: topN(byPath, 15),
    top_destinations_clicked: topN(dealClicks, 10),
    top_destinations_searched: topN(searchTo, 10),
    top_referrers: topN(referrers, 10),
    note:
      events.length === 0
        ? "Aún no hay eventos persistidos. Espera que llegue tráfico tras este deploy. El tracking se commitea al repo cada 5 eventos."
        : `${events.length} eventos totales en data/events-recent.jsonl (rotación 1000 últimos)`,
  });
}
