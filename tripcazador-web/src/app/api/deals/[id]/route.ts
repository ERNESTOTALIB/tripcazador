/**
 * /api/deals/[id] — SSS83 (May 2026)
 *
 * Hermano de /api/deals/route.ts: si el VPS devuelve 404 (porque el deal real
 * no está en su deals.json stale) o devuelve un seed, busca el id en el
 * deals-latest.json del repo (1271+ deals reales del hunter).
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VPS_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.tripcazador.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

interface Deal {
  id: string;
  sources?: string[];
  tags?: string[];
  [k: string]: unknown;
}

function isSeedDeal(d: Deal): boolean {
  return (
    (typeof d.id === "string" && d.id.startsWith("seed-")) ||
    (Array.isArray(d.sources) && d.sources.includes("seed")) ||
    (Array.isArray(d.tags) && d.tags.includes("seed"))
  );
}

async function fetchFromRepo(id: string): Promise<Deal | null> {
  try {
    const r = await fetch(`${SITE_URL}/deals-latest.json`, {
      cache: "force-cache",
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const deals: Deal[] = Array.isArray(j) ? j : Array.isArray(j.deals) ? j.deals : [];
    return deals.find((d) => d.id === id) || null;
  } catch {
    return null;
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

  // 1) Try VPS
  let vpsDeal: Deal | null = null;
  try {
    const r = await fetch(`${VPS_BASE}/api/deals/${encodeURIComponent(id)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) vpsDeal = (await r.json()) as Deal;
  } catch {
    // VPS down/timeout
  }

  // 2) Si VPS devolvió un deal real, devolver tal cual
  if (vpsDeal && !isSeedDeal(vpsDeal)) {
    return new NextResponse(JSON.stringify(vpsDeal), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Deals-Source": "vps",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  }

  // 3) VPS sin deal o seed → buscar en repo
  const repoDeal = await fetchFromRepo(id);
  if (repoDeal) {
    return new NextResponse(JSON.stringify(repoDeal), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Deals-Source": "repo-fallback",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  }

  // 4) Si VPS sí devolvió pero era seed, lo damos como último recurso
  if (vpsDeal) {
    return new NextResponse(JSON.stringify(vpsDeal), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Deals-Source": "vps-seed",
      },
    });
  }

  return NextResponse.json({ error: "not found" }, { status: 404 });
}
