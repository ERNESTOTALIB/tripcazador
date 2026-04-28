import { NextResponse } from "next/server";
import { buildClearCookieHeader } from "@/lib/panel_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const resp = NextResponse.json({ ok: true });
  resp.headers.set("Set-Cookie", buildClearCookieHeader());
  return resp;
}
