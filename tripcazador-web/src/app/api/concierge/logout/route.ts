/**
 * /api/concierge/logout — SSS332 (20 may 2026)
 *
 * Cierra la sesión del portal Concierge limpiando la cookie
 * `tc_concierge_portal`. Redirige a /concierge/mis-pedidos (sin token)
 * → muestra form de "pedir acceso" de nuevo.
 *
 * POST (no GET para evitar logout via embed/img/etc tracking).
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "tc_concierge_portal";

export async function POST(): Promise<NextResponse> {
  const ck = await cookies();
  ck.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/concierge",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
