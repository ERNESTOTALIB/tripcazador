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
import { cookies } from "next/headers";
import { verifyConciergeAccessToken } from "@/lib/concierge_access_token";
import { fetchOrdersByEmail } from "@/lib/concierge_orders_fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "tc_concierge_portal";

export async function GET(req: NextRequest): Promise<NextResponse> {
  // SSS332: dual auth — preferimos cookie (httpOnly, no leak en URL).
  // Fallback a ?token= por backwards-compat con magic-link primer click
  // (que va por server-side redirect, pero por si algún fetch lo manda).
  const ck = await cookies();
  const cookieToken = ck.get(COOKIE_NAME)?.value || "";
  const queryToken = req.nextUrl.searchParams.get("token") || "";
  const tokenToCheck = cookieToken || queryToken;
  const claims = verifyConciergeAccessToken(tokenToCheck);
  if (!claims) {
    return NextResponse.json(
      { ok: false, error: "token_invalid_or_expired" },
      { status: 401 },
    );
  }
  const orders = await fetchOrdersByEmail(claims.email);
  const response = NextResponse.json({ ok: true, email: claims.email, orders });
  // SSS332: frame-busting / clickjacking defense en API responses
  // (también lo hacemos en la page via Next.js config global).
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  return response;
}
