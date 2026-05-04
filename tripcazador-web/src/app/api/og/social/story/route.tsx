import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getDeals } from "@/lib/api";

export const runtime = "edge";

/**
 * /api/og/social/story?dealId=X — fase SSS40
 *
 * Genera un story 1080×1920 vertical para Instagram/TikTok.
 *
 * Diseño:
 *   - Top 70% gradient destino + emoji silueta + sticker location
 *   - Bottom 30% navy con eyebrow + ruta + precio gigante 100px + "DESLIZA ↑"
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dealId = sp.get("dealId");

  let route = { from: "Madrid", to: "Lisboa" };
  let price = 29;
  let oldPrice = 137;
  let dateOut = "Hoy · 24h";
  let badge = "CHOLLO HOY" as string;
  let emoji = "🇵🇹";
  let region = "Europa";

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
        oldPrice = price + Math.round(deal.savings_eur ?? price);
        const d = new Date(deal.date_out);
        dateOut = isNaN(d.getTime())
          ? deal.date_out
          : `${d.getDate()} ${["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.getMonth()]}`;
        const cls = (deal.classification || "OFERTA").toUpperCase();
        badge = cls === "CRÍTICO" ? "CRÍTICO 24h" : cls === "ERROR" ? "ERROR FARE" : "CHOLLO HOY";
        region = deal.region || "Europa";
        emoji =
          region === "Asia" ? "🌏" :
          region === "Caribe" ? "🏝️" :
          region === "África" ? "🌴" :
          region === "Oceanía" ? "🇦🇺" :
          region.startsWith("América") ? "🌎" : "🇪🇺";
      }
    } catch {
      /* fallback */
    }
  }

  const skyGradient =
    region === "África"
      ? "linear-gradient(180deg,#FCD9A8,#F4A363,#C84B2A,#3E1E2A)"
      : region === "Asia"
      ? "linear-gradient(180deg,#FFE5B4,#F2A1A1,#7A3B61)"
      : region === "Caribe"
      ? "linear-gradient(180deg,#06B6D4,#0891B2,#0a1530)"
      : region === "Norteamérica"
      ? "linear-gradient(180deg,#1E3A8A,#5EAAD8,#E0F2FE)"
      : "linear-gradient(180deg,#FFE5B4,#F2A1A1,#7A3B61)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a1530",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Top: sky destino — SSS55 rediseño con menos vacío */}
        <div
          style={{
            width: "100%",
            height: "1340px",
            display: "flex",
            flexDirection: "column",
            background: skyGradient,
            position: "relative",
            padding: "80px 60px",
            justifyContent: "space-between",
          }}
        >
          {/* TOP ROW: location pill + brand badge */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                background: "#fff",
                padding: "16px 30px",
                borderRadius: "999px",
                fontSize: "32px",
                fontWeight: 800,
                color: "#0a1530",
                boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
              }}
            >
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#DC2626", display: "flex" }} />
              {route.to}
            </div>
            <div
              style={{
                background: "#0a1530",
                padding: "16px 28px",
                borderRadius: "999px",
                color: "#fbbf24",
                fontSize: "26px",
                fontWeight: 900,
                letterSpacing: "3px",
                display: "flex",
              }}
            >
              ✈ TC
            </div>
          </div>

          {/* MIDDLE — emoji enorme + precio flotante */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: "30px",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: "480px",
                lineHeight: 1,
                display: "flex",
                filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.35))",
              }}
            >
              {emoji}
            </div>
            {/* Price preview flotante */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "rgba(10,21,48,0.92)",
                padding: "20px 40px",
                borderRadius: "20px",
                gap: "6px",
                border: "3px solid #fbbf24",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  color: "#fbbf24",
                  letterSpacing: "5px",
                  fontWeight: 700,
                  display: "flex",
                }}
              >
                DESDE
              </div>
              <div
                style={{
                  fontSize: "120px",
                  fontWeight: 900,
                  color: "#fbbf24",
                  letterSpacing: "-4px",
                  lineHeight: 1,
                  display: "flex",
                }}
              >
                {price}€
              </div>
            </div>
          </div>

          {/* BOTTOM gradient label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.92)",
              padding: "18px 32px",
              borderRadius: "16px",
              fontSize: "32px",
              fontWeight: 800,
              color: "#0a1530",
              alignSelf: "center",
            }}
          >
            🔥 {dateOut}  ·  ahorra {oldPrice - price}€
          </div>
        </div>

        {/* Bottom: panel info */}
        <div
          style={{
            width: "100%",
            height: "580px",
            background: "linear-gradient(180deg,#0a1530 0%,#1a2952 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 60px",
            borderTop: "5px solid #fbbf24",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#fbbf24",
              letterSpacing: "8px",
              marginBottom: "18px",
              display: "flex",
            }}
          >
            {badge}
          </div>

          {/* Ruta */}
          <div
            style={{
              fontSize: "44px",
              fontWeight: 600,
              color: "#fff",
              marginBottom: "20px",
              letterSpacing: "-0.5px",
              display: "flex",
            }}
          >
            {route.from} → {route.to}
          </div>

          {/* Precio enorme */}
          <div
            style={{
              fontSize: "180px",
              fontWeight: 800,
              color: "#fbbf24",
              letterSpacing: "-6px",
              lineHeight: 1,
              marginBottom: "10px",
              display: "flex",
            }}
          >
            {price}€
          </div>

          {/* Tachado */}
          <div
            style={{
              fontSize: "26px",
              color: "rgba(255,255,255,0.65)",
              textDecoration: "line-through",
              marginBottom: "32px",
              display: "flex",
            }}
          >
            antes {oldPrice}€  ·  {dateOut}
          </div>

          {/* CTA swipe up */}
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "5px",
              display: "flex",
            }}
          >
            DESLIZA  ↑
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: {
        // SSS51: cache CDN agresivo (ver post/route.tsx para racional)
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800, immutable",
      },
    }
  );
}
