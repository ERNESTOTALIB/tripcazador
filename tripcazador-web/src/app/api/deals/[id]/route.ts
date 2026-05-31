/**
 * /api/deals/[id] — REFACTOR (31 may 2026)
 *
 * Backend FastAPI Oracle muerto desde 18 may. Lee directo de
 * public/deals-latest.json (hunter cron commits). Misma signature.
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Deal {
  id: string;
  sources?: string[];
  tags?: string[];
  [k: string]: unknown;
}

// Cache module-level 60s. El JSON solo cambia con commits del worker.
let cached: { deals: Deal[]; ts: number } | null = null;
const CACHE_MS = 60_000;

async function loadStaticDeals(): Promise<Deal[]> {
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_MS) return cached.deals;
  try {
    const filepath = path.join(process.cwd(), "public", "deals-latest.json");
    const raw = await fs.readFile(filepath, "utf8");
    const json = JSON.parse(raw) as { deals?: Deal[] };
    const deals = Array.isArray(json.deals) ? json.deals : [];
    cached = { deals, ts: now };
    return deals;
  } catch {
    return cached?.deals ?? [];
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  if (!id || id.length > 200) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const deals = await loadStaticDeals();
  const deal = deals.find((d) => d.id === id);

  if (!deal) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return new NextResponse(JSON.stringify(deal), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Deals-Source": "static",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}
