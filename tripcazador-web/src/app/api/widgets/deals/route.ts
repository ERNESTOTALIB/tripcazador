/**
 * /api/widgets/deals — SSS437 (23 may 2026)
 *
 * Endpoint público CORS para partners/blogs que quieran embebir un
 * widget con los últimos chollos detectados.
 *
 * GET /api/widgets/deals?limit=10
 *
 * Response compacta (no expone toda la estructura interna):
 *   { deals: [{id, origin, destination, country, price_eur,
 *              savings_pct, date_out, date_ret, booking_url}],
 *     generated_at, attribution }
 *
 * Diseño:
 * - CORS abierto Access-Control-Allow-Origin: * (público read-only)
 * - Cache 5 min CDN (s-maxage=300) — los precios cambian, pero no es
 *   necesario hammer el backend cada request.
 * - limit max 30 para evitar abuse.
 * - Attribution incluida en el JSON ("Datos de tripcazador.com") —
 *   los partners deben mantenerla visible.
 */
import { NextRequest, NextResponse } from "next/server";
import { getDeals } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";
const MAX_LIMIT = 30;
const DEFAULT_LIMIT = 10;

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  };
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

interface CompactDeal {
  id: string;
  origin: string;
  destination: string;
  city_to: string;
  country_to: string;
  price_eur: number;
  savings_pct: number;
  date_out: string;
  date_ret: string | null;
  airline_name: string;
  /** booking_url con utm partner si query param ?ref=... */
  booking_url: string;
  /** Link a TripCazador detail page */
  tc_url: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const limitRaw = parseInt(url.searchParams.get("limit") || `${DEFAULT_LIMIT}`, 10);
  const limit = Math.min(
    Math.max(isNaN(limitRaw) ? DEFAULT_LIMIT : limitRaw, 1),
    MAX_LIMIT,
  );
  const ref = (url.searchParams.get("ref") || "").trim().slice(0, 32);

  try {
    const data = await getDeals({ limit });
    const deals: CompactDeal[] = (data.deals || []).slice(0, limit).map((d) => {
      // Append utm_partner si ref provided
      let bookingUrl = d.booking_url || "";
      if (ref && bookingUrl) {
        try {
          const u = new URL(bookingUrl);
          u.searchParams.set("utm_source", "tripcazador_widget");
          u.searchParams.set("utm_medium", "embed");
          u.searchParams.set("utm_campaign", `partner_${ref}`);
          bookingUrl = u.toString();
        } catch {
          // si booking_url no es URL válido, dejarlo tal cual
        }
      }
      return {
        id: d.id,
        origin: d.origin || "",
        destination: d.destination || "",
        city_to: d.city_to || "",
        country_to: d.country_to || "",
        price_eur: Math.round(d.price_eur || 0),
        savings_pct: Math.round(d.savings_pct || 0),
        date_out: d.date_out || "",
        date_ret: d.date_ret || null,
        airline_name: d.airline_name || d.airline || "",
        booking_url: bookingUrl,
        tc_url: `${SITE_URL}/deals/${encodeURIComponent(d.id)}`,
      };
    });

    return NextResponse.json(
      {
        deals,
        generated_at: new Date().toISOString(),
        attribution: "Datos de tripcazador.com — al embebir mantén el atributo source visible.",
        source_url: SITE_URL,
        license: "Free embed con atribución visible. No scraping masivo.",
      },
      { headers: corsHeaders() },
    );
  } catch (e) {
    return NextResponse.json(
      {
        deals: [],
        error: "internal",
        message: e instanceof Error ? e.message : String(e),
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
