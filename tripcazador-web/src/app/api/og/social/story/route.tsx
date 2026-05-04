import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getDeals } from "@/lib/api";
import { getDestImage, buildUnsplashUrl } from "@/lib/dest_images";

export const runtime = "edge";

/**
 * /api/og/social/story?dealId=X — fase SSS56 (May 2026)
 *
 * Story 1080×1920 vertical con FONDO REAL del destino.
 *
 * Diseño SSS56 (rediseñado tras feedback "vacío y desproporcionado"):
 *   - Foto destino full-bleed (no más gradient genérico)
 *   - Top: location pill blanca + brand badge ámbar
 *   - Middle: precio MEGA centrado en navy panel sobre la foto
 *     (+ savings + airline)
 *   - Bottom 30%: panel navy sólido con ruta + DESLIZA ↑
 *
 * Resultado: composición rica que cuenta la historia "destino → precio →
 * acción" sin espacios vacíos. La foto destino es el héroe visual.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dealId = sp.get("dealId");

  let route = { from: "Madrid", to: "Lisboa" };
  let price = 29;
  let oldPrice = 137;
  let savingsPct = 79;
  let dateOut = "Hoy · 24h";
  let badge = "CHOLLO HOY" as string;
  let airline = "";
  let destKey: string = "LIS";

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
        savingsPct = Math.round(deal.savings_pct ?? 0);
        const d = new Date(deal.date_out);
        dateOut = isNaN(d.getTime())
          ? deal.date_out
          : `${d.getDate()} ${["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.getMonth()]}`;
        const cls = (deal.classification || "OFERTA").toUpperCase();
        badge = cls === "CRÍTICO" ? "CRÍTICO 24h" : cls === "ERROR" ? "ERROR FARE" : "CHOLLO HOY";
        airline = deal.airline_name || deal.airline || "";
        destKey = deal.destination || deal.city_to || deal.region || "world";
      }
    } catch {
      /* fallback */
    }
  }

  const dest = getDestImage(destKey);
  const bgUrl = buildUnsplashUrl(dest.photoId, 1080, 1920);
  const savingsEur = Math.max(0, oldPrice - price);

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
          position: "relative",
        }}
      >
        {/* TOP 70%: foto destino con overlay */}
        <div
          style={{
            width: "100%",
            height: "1340px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            justifyContent: "space-between",
            padding: "80px 60px",
          }}
        >
          {/* Background foto destino */}
          <img
            src={bgUrl}
            width={1080}
            height={1340}
            alt={dest.alt}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1080px",
              height: "1340px",
              objectFit: "cover",
              display: "flex",
            }}
          />
          {/* Dark overlay para legibilidad */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 30%, rgba(10,21,48,0.4) 75%, rgba(10,21,48,0.85) 100%)",
              display: "flex",
            }}
          />

          {/* TOP ROW — location pill + brand */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              zIndex: 1,
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
                boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#DC2626", display: "flex" }} />
              {route.to}
            </div>
            <div
              style={{
                background: "#fbbf24",
                padding: "16px 28px",
                borderRadius: "999px",
                color: "#0a1530",
                fontSize: "28px",
                fontWeight: 900,
                letterSpacing: "3px",
                display: "flex",
              }}
            >
              ✈ TC
            </div>
          </div>

          {/* MIDDLE — precio panel sobre la foto */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
              zIndex: 1,
              flex: 1,
              padding: "40px 0",
            }}
          >
            {/* Badge urgencia */}
            <div
              style={{
                display: "flex",
                background: "rgba(220,38,38,0.95)",
                color: "#fff",
                padding: "14px 32px",
                borderRadius: "999px",
                fontSize: "30px",
                fontWeight: 900,
                letterSpacing: "5px",
                boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
              }}
            >
              🔥 {badge}
            </div>
            {/* Precio panel */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "rgba(10,21,48,0.92)",
                padding: "32px 60px",
                borderRadius: "24px",
                gap: "12px",
                border: "4px solid #fbbf24",
                boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  color: "#fbbf24",
                  letterSpacing: "8px",
                  fontWeight: 800,
                  display: "flex",
                }}
              >
                DESDE
              </div>
              <div
                style={{
                  fontSize: "180px",
                  fontWeight: 900,
                  color: "#fbbf24",
                  letterSpacing: "-6px",
                  lineHeight: 1,
                  display: "flex",
                }}
              >
                {price}€
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginTop: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "26px",
                    color: "rgba(255,255,255,0.65)",
                    textDecoration: "line-through",
                    display: "flex",
                  }}
                >
                  antes {oldPrice}€
                </div>
                <div
                  style={{
                    background: "#10B981",
                    color: "#0a1530",
                    padding: "6px 16px",
                    borderRadius: "999px",
                    fontSize: "26px",
                    fontWeight: 900,
                    display: "flex",
                  }}
                >
                  −{savingsPct}%
                </div>
              </div>
            </div>
            {/* Savings chip blanco */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(255,255,255,0.95)",
                padding: "14px 30px",
                borderRadius: "16px",
                fontSize: "28px",
                fontWeight: 800,
                color: "#0a1530",
                boxShadow: "0 6px 24px rgba(0,0,0,0.3)",
              }}
            >
              💰 ahorras {savingsEur}€
            </div>
          </div>

          {/* BOTTOM ROW (dentro del sky panel) — fechas + airline */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "24px",
              zIndex: 1,
              fontSize: "26px",
              fontWeight: 600,
              color: "#fff",
              textShadow: "0 2px 12px rgba(0,0,0,0.7)",
            }}
          >
            <span style={{ display: "flex" }}>📅 {dateOut}</span>
            {airline && (
              <>
                <span style={{ display: "flex", opacity: 0.5 }}>·</span>
                <span style={{ display: "flex" }}>✈ {airline}</span>
              </>
            )}
          </div>
        </div>

        {/* BOTTOM 30% — panel navy con ruta + CTA */}
        <div
          style={{
            width: "100%",
            height: "580px",
            background: "linear-gradient(180deg,#0a1530 0%,#1a2952 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            borderTop: "5px solid #fbbf24",
            gap: "28px",
          }}
        >
          <div
            style={{
              fontSize: "62px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-1px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <span style={{ display: "flex" }}>{route.from}</span>
            <span style={{ display: "flex", color: dest.accent }}>→</span>
            <span style={{ display: "flex" }}>{route.to}</span>
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "#fbbf24",
              letterSpacing: "4px",
              fontWeight: 700,
              display: "flex",
            }}
          >
            tripcazador.com
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "6px",
              display: "flex",
              marginTop: "8px",
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
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800, immutable",
      },
    }
  );
}
