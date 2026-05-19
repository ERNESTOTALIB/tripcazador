/**
 * /api/concierge/my-orders — SSS328 (19 may 2026)
 *
 * Devuelve la lista de pedidos Concierge del cliente identificado por
 * un token magic-link (issueConciergeAccessToken).
 *
 * GET ?token=<email-encoded>:<ts>:<hmac> → 200 { ok, orders[] }
 *
 * AUTH: solo el token. El email se extrae del token verificado, no se
 * acepta como query separado (defensa contra forging).
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyConciergeAccessToken } from "@/lib/concierge_access_token";
import { fetchOrdersByEmail } from "@/lib/concierge_orders_fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get("token") || "";
  const claims = verifyConciergeAccessToken(token);
  if (!claims) {
    return NextResponse.json(
      { ok: false, error: "token_invalid_or_expired" },
      { status: 401 },
    );
  }
  const orders = await fetchOrdersByEmail(claims.email);
  return NextResponse.json({ ok: true, email: claims.email, orders });
}
