import { NextResponse } from "next/server";
import { verifyGiftCode } from "@/lib/gift_cards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = (body.code || "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Introduce un código" }, { status: 400 });
  }

  if (!verifyGiftCode(code)) {
    return NextResponse.json({ error: "Código no válido" }, { status: 400 });
  }

  // Stub: en producción comprobar en KV/DB que el código no se haya usado.
  // Por ahora simplemente devolver OK con sugerencias de reservas afiliadas.
  const tpMarker = process.env.NEXT_PUBLIC_TP_MARKER || "tripcazador";
  const bookingAid = process.env.NEXT_PUBLIC_BOOKING_AID || "714734";
  return NextResponse.json({
    ok: true,
    code,
    message: "Código válido. Aplica el crédito reservando con cualquiera de nuestros partners:",
    suggestions: [
      {
        type: "vuelo",
        label: "Buscar vuelos",
        href: `https://www.skyscanner.es/?associateid=${tpMarker}`,
      },
      {
        type: "hotel",
        label: "Reservar hotel",
        href: `https://www.booking.com/?aid=${bookingAid}`,
      },
      {
        type: "actividad",
        label: "Reservar tours",
        href: `https://www.getyourguide.com/?partner_id=${process.env.NEXT_PUBLIC_GYG_PARTNER_ID || ""}`,
      },
    ],
  });
}
