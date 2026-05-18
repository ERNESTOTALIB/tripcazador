/**
 * /api/agencia/tickets — SSS305
 *
 * Lista los tickets de Agencia del cliente identificado por email.
 * GET ?email=foo@bar.com → 200 [tickets...]
 *
 * Auth: no se requiere token — el email es enough porque los datos
 * devueltos no son sensibles (ya conoce su propia request).
 */

import { NextRequest, NextResponse } from "next/server";
import { listTicketsByEmail } from "@/lib/agencia_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 254;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") || "").trim();
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
  }
  const tickets = await listTicketsByEmail(email);
  return NextResponse.json({ ok: true, count: tickets.length, tickets });
}
