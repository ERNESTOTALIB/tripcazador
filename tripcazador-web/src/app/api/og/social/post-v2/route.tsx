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
  const logoUrl = `${req.nextUrl.origin}/logo-horizontal-dark.png`;

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
        {/* Dark overlay navy (legibilidad) — más oscuro en zona central */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(10,21,48,0.45) 0%, rgba(10,21,48,0.75) 35%, rgba(10,21,48,0.92) 70%, rgba(10,21,48,0.98) 100%)",
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

        {/* MIDDLE — MEGA PRICE PANEL (navy box con border ámbar) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            zIndex: 1,
            padding: "0 60px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "rgba(10,21,48,0.88)",
              border: "5px solid #fbbf24",
              borderRadius: "32px",
              padding: "40px 70px 50px",
              boxShadow: "0 16px 64px rgba(0,0,0,0.5)",
              gap: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "26px",
                fontWeight: 800,
                letterSpacing: "12px",
                color: "#fbbf24",
              }}
            >
              DESDE
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "240px",
                  fontWeight: 900,
                  color: "#fbbf24",
                  lineHeight: 1,
                  letterSpacing: "-8px",
                }}
              >
                {price}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "100px",
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
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "28px",
                  color: "rgba(255,255,255,0.7)",
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
                  fontSize: "30px",
                  fontWeight: 900,
                }}
              >
                −{savingsPct}%
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM — ruta + fecha + CTA con bottom panel sólido para legibilidad */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "32px 60px 50px",
            gap: "16px",
            zIndex: 1,
            // Panel bottom solid navy — garantiza legibilidad
            // independientemente del fondo de foto destino (cielo claro,
            // hierba verde, agua turquesa, etc.). SSS57a fix.
            background: "linear-gradient(180deg,rgba(10,21,48,0.0) 0%,rgba(10,21,48,0.85) 30%,rgba(10,21,48,0.98) 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
              fontSize: "58px",
              fontWeight: 800,
              color: "#fff",
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
              color: "rgba(255,255,255,0.92)",
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
              borderTop: "2px solid rgba(251,191,36,0.4)",
              paddingTop: "20px",
              marginTop: "6px",
            }}
          >
            {/* SSS62: Logo SVG inline transparente (sin caja navy) */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg width="50" height="50" viewBox="0 0 100 100" style={{ display: "flex" }}>
                <path
                  d="M10 42 L26 30 L40 38 L50 22 L60 38 L74 30 L90 42 L74 48 L80 62 L62 56 L50 78 L56 90 L50 94 L44 90 L38 56 L20 62 L26 48 Z"
                  fill="#fbbf24"
                />
              </svg>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                <div style={{ display: "flex", fontSize: "32px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
                  <span style={{ color: "#fbbf24" }}>Trip</span>Cazador
                </div>
                <div style={{ display: "flex", fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: "2.5px", marginTop: "3px" }}>
                  EL CAZADOR DE CHOLLOS
                </div>
              </div>
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
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
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
