import { NextResponse } from "next/server";
import { verifyCreatorToken, getCreatorStats, buildCreatorLink } from "@/lib/creators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const code = verifyCreatorToken(token);
  if (!code) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
  const stats = getCreatorStats(code);
  return NextResponse.json({
    code,
    link: buildCreatorLink(code),
    stats,
    payout_threshold_eur: 25,
  });
}
