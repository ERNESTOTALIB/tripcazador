import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/subscribers — fase yyy proxy
 *
 * Proxy server-side al backend VPS /api/admin/subscribers usando ADMIN_TOKEN
 * desde env. Así el SubscribersWidget puede vivir en /panel sin pedirle al
 * usuario el admin token (la cookie de sesión panel ya autoriza).
 *
 * Sin backend o sin token: devolvemos shape vacío con flag configured=false.
 */

interface SubscribersStats {
  configured: boolean;
  total: number;
  by_source: Record<string, number>;
  by_day_last_30: Record<string, number>;
  last_subscribed_at: string | null;
  error?: string;
}

export async function GET(_req: NextRequest): Promise<NextResponse<SubscribersStats | { error: string }>> {
  const session = verifyToken(cookies().get(COOKIE_KEY)?.value);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const adminToken = process.env.ADMIN_TOKEN || "";
  const empty: SubscribersStats = {
    configured: false,
    total: 0,
    by_source: {},
    by_day_last_30: {},
    last_subscribed_at: null,
  };

  if (!baseUrl || !adminToken) {
    return NextResponse.json({
      ...empty,
      error:
        "NEXT_PUBLIC_API_URL o ADMIN_TOKEN no configurados — no puedo hablar con el backend de suscriptores.",
    });
  }

  try {
    const res = await fetch(
      `${baseUrl}/api/admin/subscribers?token=${encodeURIComponent(adminToken)}`,
      { cache: "no-store", signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) {
      return NextResponse.json({
        ...empty,
        error: `Backend devolvió HTTP ${res.status}`,
      });
    }
    const json = (await res.json()) as Omit<SubscribersStats, "configured">;
    return NextResponse.json({ configured: true, ...json });
  } catch (err) {
    return NextResponse.json({
      ...empty,
      error: `Backend timeout o no alcanzable: ${(err as Error).message}`,
    });
  }
}
