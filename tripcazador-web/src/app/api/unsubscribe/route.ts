/**
 * /api/unsubscribe — fase ss-SS2
 *
 * Endpoint público (one-click) para que el usuario se de baja desde el link
 * del email. Cumple List-Unsubscribe RFC 8058.
 *
 * GET /api/unsubscribe?t=BASE64URL  → marca como unsubscribed, devuelve HTML
 * POST /api/unsubscribe?t=BASE64URL → idem, para One-Click headers
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { unsubscribe } from "@/lib/subscribers_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// AUDIT-FULL FIX-SEC-1 (24 may 2026): el token DEBE incluir HMAC verificable.
// Antes el `decodeToken` solo decodeaba base64 (sin HMAC). Cualquiera podía
// dar de baja a otra persona enumerando emails típicos.
//
// Formato: base64url("email:ts:hmac(email:ts)").
// Tokens legacy (sólo email o email:ts sin sig) son rechazados — los suscriptores
// con tokens viejos deben re-suscribirse. Trade-off aceptable: legacy era vuln.
function decodeToken(t: string): string | null {
  try {
    const decoded = Buffer.from(t, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;
    const [email, ts, sig] = parts;
    if (!email || !email.includes("@") || !ts || !sig) return null;
    const secret = process.env.UNSUBSCRIBE_SECRET || "";
    if (!secret) return null; // fail-closed
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${email}:${ts}`)
      .digest("hex");
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    return email;
  } catch {
    return null;
  }
}

async function handle(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const t = url.searchParams.get("t") || "";
  const email = decodeToken(t);
  if (!email) {
    return new NextResponse("Token inválido", { status: 400 });
  }
  await unsubscribe(email);

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Suscripción cancelada</title>
<style>body{font-family:-apple-system,sans-serif;max-width:560px;margin:80px auto;padding:0 20px;color:#111;line-height:1.6}
h1{font-size:24px}a{color:#2563eb}</style></head>
<body><h1>Listo, te hemos dado de baja.</h1>
<p>No recibirás más emails de TripCazador. Si fue un error, vuelve a suscribirte cuando quieras desde <a href="https://tripcazador.com">tripcazador.com</a>.</p>
<p>Si nos quieres dar feedback sobre por qué cancelas, responde a este email — leemos todo.</p>
</body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
