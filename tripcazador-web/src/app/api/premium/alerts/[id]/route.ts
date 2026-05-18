/**
 * /api/premium/alerts/[id] — SSS302
 *
 * DELETE: borra/desactiva una alerta Premium. Requiere customer_id
 * matching como prueba de ownership (mismo modelo que activate endpoint).
 *
 * Request:
 *   DELETE /api/premium/alerts/pa_xxx?customer_id=cs_live_xxx
 *
 * Responses:
 *   200 { ok: true } si borrado OK
 *   400 si customer_id formato inválido
 *   403 si la alerta existe pero customer_id no matchea (no-leak: same 403)
 *   404 si la alerta no existe
 */

import { NextRequest, NextResponse } from "next/server";
import { deleteAlert } from "@/lib/price_alerts_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUSTOMER_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{8,}$/;
const ALERT_ID_RE = /^pa_[A-Za-z0-9_-]{8,}$/;

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const alertId = params.id;
  if (!alertId || !ALERT_ID_RE.test(alertId)) {
    return NextResponse.json({ ok: false, error: "alert_id_invalid" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customer_id") || "";
  if (!customerId || !CUSTOMER_ID_RE.test(customerId)) {
    return NextResponse.json(
      { ok: false, error: "customer_id_invalid" },
      { status: 400 },
    );
  }

  const ok = await deleteAlert(alertId, customerId);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "not_found_or_forbidden" },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true });
}
