/**
 * /api/premium/saved-searches/[id] — SSS303
 *
 * DELETE: borra búsqueda guardada. Requiere customer_id matching.
 */

import { NextRequest, NextResponse } from "next/server";
import { deleteSavedSearch } from "@/lib/saved_searches_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUSTOMER_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{8,}$/;
const SEARCH_ID_RE = /^ss_[A-Za-z0-9]{8,}$/;

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  if (!SEARCH_ID_RE.test(params.id)) {
    return NextResponse.json({ ok: false, error: "search_id_invalid" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id") || "";
  if (!CUSTOMER_ID_RE.test(customerId)) {
    return NextResponse.json({ ok: false, error: "customer_id_invalid" }, { status: 400 });
  }

  const ok = await deleteSavedSearch(params.id, customerId);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "not_found_or_forbidden" },
      { status: 403 },
    );
  }
  return NextResponse.json({ ok: true });
}
