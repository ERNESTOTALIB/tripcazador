import { NextResponse } from "next/server";
import { buildPassJson, buildGoogleWalletUrl, type AlertPassData } from "@/lib/wallet_pass";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/price-alerts/[id]/wallet
 *   ?platform=apple → JSON pass.json (until cert ready, returns plain JSON)
 *   ?platform=google → redirect to pay.google.com URL
 *   default → JSON con ambos
 *
 * En producción: leer alert real de DB. Por ahora stub con datos de querystring.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{4,40}$/.test(id)) {
    return NextResponse.json({ error: "alert id inválido" }, { status: 400 });
  }
  const url = new URL(req.url);
  const platform = url.searchParams.get("platform") || "json";

  // Stub: lee querystring (en prod: DB)
  const data: AlertPassData = {
    alert_id: id,
    origin_iata: url.searchParams.get("o") || "MAD",
    origin_city: url.searchParams.get("oc") || "Madrid",
    destination_iata: url.searchParams.get("d") || "TYO",
    destination_city: url.searchParams.get("dc") || "Tokio",
    target_price_eur: Number(url.searchParams.get("t") || 600),
    current_price_eur: Number(url.searchParams.get("c") || 0) || undefined,
    date_out: url.searchParams.get("date") || undefined,
  };

  if (platform === "google") {
    return NextResponse.redirect(buildGoogleWalletUrl(data));
  }
  if (platform === "apple") {
    // En prod: empaquetar como zip .pkpass + firmar manifest con cert Apple
    // Por ahora devolvemos pass.json (cualquier libpass puede empaquetar)
    const pass = buildPassJson(data);
    return new NextResponse(JSON.stringify(pass, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass+json",
        "Content-Disposition": `attachment; filename="${id}-pass.json"`,
      },
    });
  }

  // Default: return both
  return NextResponse.json({
    apple_pass_json: buildPassJson(data),
    google_wallet_url: buildGoogleWalletUrl(data),
    note: "Apple Wallet requires Apple Developer cert ($99/año) — actualmente entregamos pass.json sin firmar. Google Wallet via URL público.",
  });
}
