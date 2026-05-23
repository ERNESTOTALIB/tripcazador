/**
 * /api/calendar/[dealId] — SSS419 (May 2026)
 *
 * GET → devuelve un fichero .ics descargable para añadir el deal al
 * calendario del usuario (Apple Calendar / Google Calendar / Outlook).
 *
 * Genera 1 o 2 eventos all-day:
 *   - "Vuelo {origen} → {destino} — {precio}€ {cabin}" (date_from)
 *   - "Vuelo regreso {destino} → {origen}" (date_to, si existe)
 *
 * Privacidad: no requiere auth. Cualquiera con el ID del deal puede
 * descargar el .ics — el endpoint solo expone datos ya públicos del
 * deal (precio, fechas, ruta), no PII del usuario.
 *
 * Anti-abuse: el handler valida que el dealId esté en el catalogo
 * actual (getDeals) antes de generar el .ics. Si no existe → 404.
 */
import { NextRequest } from "next/server";
import { getDeals } from "@/lib/api";
import { buildIcs, type IcsEvent } from "@/lib/ics_builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

function parseDate(s: string | undefined): string | null {
  if (!s) return null;
  // Acepta YYYY-MM-DD o ISO 8601, devuelve YYYY-MM-DD
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { dealId: string } },
) {
  const dealId = String(params.dealId || "").trim();
  if (!dealId || dealId.length > 200) {
    return new Response("Invalid deal id", { status: 400 });
  }

  // Carga deals y busca por id. getDeals devuelve top deals + cache local.
  let deal;
  try {
    const data = await getDeals({ limit: 300 });
    deal = data.deals.find((d) => d.id === dealId);
  } catch {
    deal = undefined;
  }
  if (!deal) {
    return new Response("Deal not found", { status: 404 });
  }

  const dateOut = parseDate(deal.date_out);
  if (!dateOut) {
    return new Response("Deal sin fecha de salida válida", { status: 400 });
  }

  const dateBack = parseDate(deal.date_ret);
  const cabin = (deal.cabin || "economy").replace(/_/g, " ");
  const price = Math.round(deal.price_eur || 0);
  const cityFrom = deal.city_from || deal.origin || "";
  const cityTo = deal.city_to || deal.destination || "";
  const airline = deal.airline_name || deal.airline || "";

  const dealUrl = `${SITE_URL}/deals/${encodeURIComponent(dealId)}`;
  const description = [
    `Chollo detectado por TripCazador.`,
    `Precio aprox: ${price}€ (${cabin}).`,
    airline ? `Aerolínea: ${airline}.` : "",
    `Ver / reservar: ${dealUrl}`,
    "",
    "Los precios cambian rápido — confirma siempre en la web de la aerolínea antes de reservar.",
  ]
    .filter(Boolean)
    .join("\n");

  const events: IcsEvent[] = [
    {
      uid: `${dealId}-out`,
      summary: `✈️ ${cityFrom} → ${cityTo} · ${price}€`,
      description,
      date: dateOut,
      location: cityFrom,
      url: dealUrl,
    },
  ];

  if (dateBack && dateBack !== dateOut) {
    events.push({
      uid: `${dealId}-back`,
      summary: `✈️ ${cityTo} → ${cityFrom} (vuelta)`,
      description,
      date: dateBack,
      location: cityTo,
      url: dealUrl,
    });
  }

  const ics = buildIcs(events);
  const filename = `tripcazador-${cityFrom.replace(/\s+/g, "_")}-${cityTo.replace(/\s+/g, "_")}-${dateOut}.ics`.toLowerCase();

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
