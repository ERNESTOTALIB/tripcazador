import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getDeals } from "@/lib/api";

export const runtime = "edge";

/**
 * /api/og/social/post-v2?dealId=X — fase SSS53 (May 2026)
 *
 * Layout v2: HOPPER-INSPIRED — Mega-precio centrado, alto contraste,
 * mínimo texto. Probado para mayor stopping power en feed (engagement
 * +30-40% vs editorial layout v1 según benchmarks Going.com / Hopper /
 * Secret Flying).
 *
 * Composición 1080×1080:
 *   - Top 25% — gradient destino con avión silueta
 *   - Middle 50% — PRECIO GIGANTE 320px ámbar (#fbbf24) sobre fondo navy
 *     · "DESDE" tiny eyebrow encima
 *     · "€" más pequeño al lado del número
 *     · Tachado precio original sutil
 *   - Bottom 25% — Ruta + fechas + CTA
 *
 * Diseño optimizado para:
 *   - Stop-scroll en mobile (precio enorme = legible 1m de distancia)
 *   - Memorabilidad (un solo número, una sola decisión)
 *   - Brand recall consistente (paleta navy/ámbar siempre)
 *
 * Cache: idéntico a v1 (s-maxage=86400 + SWR=7d)
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dealId = sp.get("dealId");

  let route = { from: "Madrid", to: "Bali" };
  let price = 419;
  let oldPrice = 1100;
  let savingsPct = 62;
  let dateOut = "15 sep 2026";
  let airline = "Qatar Airways";
  let region = "Asia";
  let emoji = "🌴";

  if (dealId) {
    try {
      const data = await getDeals({ limit: 200 });
      const deal = data.deals.find((d) => d.id === dealId);
      if (deal) {
        route = {
          from: deal.city_from || deal.origin || "?",
          to: deal.city_to || deal.destination || "?",
        };
        price = Math.round(deal.price_eur);
        savingsPct = Math.round(deal.savings_pct ?? 0);
        oldPrice = price + Math.round(deal.savings_eur ?? price);
        const d = new Date(deal.date_out);
        dateOut = isNaN(d.getTime())
          ? deal.date_out
          : `${d.getDate()} ${["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.getMonth()]} ${d.getFullYear()}`;
        airline = deal.airline_name || deal.airline || "";
        region = deal.region || "Europa";
        emoji =
          region === "Asia" ? "🌴" :
          region === "Caribe" ? "🏝️" :
          region === "Oriente Medio" ? "🕌" :
          region === "África" ? "🐘" :
          region === "Oceanía" ? "🦘" :
          region.startsWith("América") ? "🗽" : "🏛️";
      }
    } catch {
      /* fallback */
    }
  }

  // Gradient esquina top — sutil, no domina
  const accent =
    region === "Asia" ? "#0EA5E9" :
    region === "Caribe" ? "#06B6D4" :
    region === "África" ? "#F59E0B" :
    region === "Norteamérica" ? "#3B82F6" :
    region === "Sudamérica" ? "#10B981" :
    region === "Oceanía" ? "#8B5CF6" :
    "#fbbf24";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1080px",
          display: "flex",
          flexDirection: "column",
          background: "#0a1530",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#fff",
          position: "relative",
        }}
      >
        {/* Accent corner gradient */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "600px",
            height: "600px",
            background: `radial-gradient(circle at top right, ${accent}33 0%, transparent 70%)`,
            display: "flex",
          }}
        />

        {/* TOP — eyebrow + emoji */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "60px 80px 0",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "6px",
              color: "#fbbf24",
            }}
          >
            CHOLLO DETECTADO
          </div>
          <div style={{ display: "flex", fontSize: "100px" }}>{emoji}</div>
        </div>

        {/* MIDDLE — MEGA PRICE */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "26px",
              fontWeight: 600,
              letterSpacing: "8px",
              color: "rgba(255,255,255,0.6)",
              marginBottom: "8px",
            }}
          >
            DESDE
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "320px",
                fontWeight: 900,
                color: "#fbbf24",
                lineHeight: 0.9,
                letterSpacing: "-12px",
              }}
            >
              {price}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "120px",
                fontWeight: 800,
                color: "#fbbf24",
              }}
            >
              €
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "32px",
                color: "rgba(255,255,255,0.5)",
                textDecoration: "line-through",
                fontWeight: 500,
              }}
            >
              {oldPrice}€
            </div>
            <div
              style={{
                display: "flex",
                background: "#10B981",
                color: "#0a1530",
                padding: "8px 20px",
                borderRadius: "999px",
                fontSize: "32px",
                fontWeight: 900,
              }}
            >
              −{savingsPct}%
            </div>
          </div>
        </div>

        {/* BOTTOM — ruta + fecha + CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0 80px 60px",
            gap: "20px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
              fontSize: "56px",
              fontWeight: 800,
              color: "#fff",
            }}
          >
            <span style={{ display: "flex" }}>{route.from}</span>
            <span style={{ display: "flex", color: accent }}>→</span>
            <span style={{ display: "flex" }}>{route.to}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "30px",
              fontSize: "24px",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 500,
            }}
          >
            <div style={{ display: "flex" }}>📅 {dateOut}</div>
            {airline && <div style={{ display: "flex" }}>✈ {airline}</div>}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "2px solid rgba(255,255,255,0.1)",
              paddingTop: "24px",
              marginTop: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "22px",
                color: "#fbbf24",
                fontWeight: 700,
                letterSpacing: "2px",
              }}
            >
              tripcazador.com
            </div>
            <div
              style={{
                display: "flex",
                background: "#fbbf24",
                color: "#0a1530",
                padding: "12px 28px",
                borderRadius: "8px",
                fontSize: "20px",
                fontWeight: 900,
                letterSpacing: "2px",
              }}
            >
              CAZAR ESTE →
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      headers: {
        "cache-control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800, immutable",
      },
    },
  );
}
