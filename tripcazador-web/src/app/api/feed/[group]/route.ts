/**
 * /api/feed/[group] — fase qqq5
 *
 * Endpoint público que devuelve deals filtrados por route_group.
 * Se consume desde home (chips "Mi feed") y desde /feed/[group] page.
 *
 * Cache: 5 min (deals rotan despacio en seed sintético).
 */

import { NextRequest, NextResponse } from "next/server";
import { diversifyDeals } from "@/lib/seed_diversifier";
import { getGroupBySlug, type RouteGroup } from "@/lib/route_groups";
import { rankByQuality } from "@/lib/hunter_quality";

export const runtime = "nodejs";
export const revalidate = 300; // 5 min

export async function GET(
  _req: NextRequest,
  { params }: { params: { group: string } },
) {
  const meta = getGroupBySlug(params.group as RouteGroup);
  if (!meta) {
    return NextResponse.json({ error: "unknown group" }, { status: 404 });
  }

  const all = diversifyDeals([]);
  const filtered = all.filter(meta.filter);
  const ranked = rankByQuality(filtered).slice(0, 30);

  return NextResponse.json(
    {
      group: meta.id,
      label: meta.label,
      emoji: meta.emoji,
      description: meta.description,
      count: filtered.length,
      deals: ranked,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      },
    },
  );
}
