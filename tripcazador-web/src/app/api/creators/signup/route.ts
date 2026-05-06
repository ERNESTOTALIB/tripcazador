import { NextResponse } from "next/server";
import { isValidCreatorCode, signCreatorToken, getCreatorStats, buildCreatorLink } from "@/lib/creators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { code?: string; email?: string; handle?: string; platform?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = (body.code || "").trim();
  if (!isValidCreatorCode(code)) {
    return NextResponse.json(
      { error: "Código inválido (3-32 chars: letras, números, _, -)" },
      { status: 400 },
    );
  }
  const email = (body.email || "").trim().slice(0, 200);
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  // Init stats + sign token
  const stats = getCreatorStats(code);
  const token = signCreatorToken(code);
  const link = buildCreatorLink(code);

  // Email notification stub (en prod: Resend)
  console.log(`[creators] new signup code=${code} email=${email} handle=${body.handle} platform=${body.platform}`);

  return NextResponse.json({
    code,
    token,
    link,
    stats,
    next_steps: [
      "Comparte tu link único en redes / blog",
      "Visita /creators/dashboard?token=<token> para ver clicks y comisiones en tiempo real",
      "Pago mensual a partir de 25€ acumulados",
    ],
  });
}
