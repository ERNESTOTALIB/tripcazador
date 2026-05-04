import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getDeals } from "@/lib/api";
import { getDestImage, buildUnsplashUrl } from "@/lib/dest_images";

export const runtime = "edge";

/**
 * /api/og/social/post-v2?dealId=X — fase SSS56 (May 2026)
 *
 * Layout v2 con FONDO REAL del destino (Unsplash) + overlay navy.
 * Diseño inspirado en Going.com / Hopper / Skyscanner posts:
 *   - Foto destino full-bleed con overlay 40-60% navy
 *   - Top: badge ámbar "CHOLLO DETECTADO" + emoji
 *   - Center: precio MEGA 320px ámbar con savings badge
 *   - Bottom: ruta + fechas + CTA
 *
 * Resultado: el usuario ve INMEDIATAMENTE de qué destino estamos
 * hablando (Bali=arrozales, Tokyo=neón, NYC=skyline, etc.) y no un
 * gradient genérico aburrido.
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
  let destKey: string = "DPS"; // Bali default

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
        // Usar destination IATA como key — fallback a city_to si no hay
        destKey = deal.destination || deal.city_to || deal.region || "world";
      }
    } catch {
      /* fallback */
    }
  }

  const dest = getDestImage(destKey);
  const bgUrl = buildUnsplashUrl(dest.photoId, 1080, 1080);

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
        {/* BACKGROUND: foto real del destino */}
        <img
          src={bgUrl}
          width={1080}
          height={1080}
          alt={dest.alt}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1080px",
            height: "1080px",
            objectFit: "cover",
            display: "flex",
          }}
        />
        {/* Dark overlay navy (legibilidad) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(10,21,48,0.55) 0%, rgba(10,21,48,0.85) 65%, rgba(10,21,48,0.95) 100%)",
            display: "flex",
          }}
        />

        {/* TOP — badge + airline */}
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
              background: "#fbbf24",
              color: "#0a1530",
              padding: "12px 24px",
              borderRadius: "999px",
              fontSize: "22px",
              fontWeight: 900,
              letterSpacing: "4px",
            }}
          >
            CHOLLO DETECTADO
          </div>
          {airline && (
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "999px",
                fontSize: "20px",
                fontWeight: 700,
                backdropFilter: "blur(10px)",
              }}
            >
              ✈ {airline}
            </div>
          )}
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
              fontWeight: 700,
              letterSpacing: "10px",
              color: "rgba(255,255,255,0.85)",
              marginBottom: "8px",
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
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
                fontSize: "300px",
                fontWeight: 900,
                color: "#fbbf24",
                lineHeight: 0.9,
                letterSpacing: "-12px",
                textShadow: "0 8px 32px rgba(0,0,0,0.4)",
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
                textShadow: "0 4px 20px rgba(0,0,0,0.4)",
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
                fontSize: "30px",
                color: "rgba(255,255,255,0.75)",
                textDecoration: "line-through",
                fontWeight: 600,
              }}
            >
              antes {oldPrice}€
            </div>
            <div
              style={{
                display: "flex",
                background: "#10B981",
                color: "#0a1530",
                padding: "10px 22px",
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
              fontSize: "60px",
              fontWeight: 800,
              color: "#fff",
              textShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            <span style={{ display: "flex" }}>{route.from}</span>
            <span style={{ display: "flex", color: dest.accent }}>→</span>
            <span style={{ display: "flex" }}>{route.to}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "14px",
              fontSize: "26px",
              color: "rgba(255,255,255,0.85)",
              fontWeight: 600,
            }}
          >
            <span style={{ display: "flex" }}>📅 {dateOut}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "2px solid rgba(255,255,255,0.15)",
              paddingTop: "24px",
              marginTop: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "24px",
                color: "#fbbf24",
                fontWeight: 700,
                letterSpacing: "3px",
              }}
            >
              tripcazador.com
            </div>
            <div
              style={{
                display: "flex",
                background: "#fbbf24",
                color: "#0a1530",
                padding: "14px 30px",
                borderRadius: "12px",
                fontSize: "22px",
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
