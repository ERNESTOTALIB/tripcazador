import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getDeals } from "@/lib/api";

export const runtime = "edge";

/**
 * /api/og/social/post?dealId=X — fase SSS40 (May 2026)
 *
 * Genera un post 1080×1080 editorial premium para Instagram feed.
 *
 * Diseño basado en el kit social premium (estilo Going.com / Hoteltonight):
 *   - Top 60%: gradiente sunset evocador del destino + skyline silueta + avión
 *   - Bottom 40%: panel navy con eyebrow + ruta gigante + precio ámbar 80px + CTA
 *   - Branding: logo radar mini esquina + badge urgencia "DISPONIBLE 6h"
 *
 * Diferencia vs /api/og/instagram (legacy):
 *   - Cuadrado 1080×1080 (no portrait 1080×1350)
 *   - Composición editorial con foto + panel info, no full gradient
 *   - Tipografía pro: precio 80px display, ruta 44px, eyebrow 14px tracking
 *   - Brand consistency con paleta navy #0a1530 + ámbar #fbbf24
 *
 * Consumido por: workflow instagram-publish.yml + share manual
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dealId = sp.get("dealId");

  // Defaults (fallback si no hay dealId)
  let route = { from: "Madrid", to: "Marrakech" };
  let price = 17;
  let oldPrice = 418;
  let savingsPct = 96;
  let dateOut = "15 sep 2026";
  let airline = "Ryanair";
  let badge: "CRÍTICO" | "ERROR" | "ANOMALÍA" | "OFERTA" = "CRÍTICO";
  let emoji = "🇲🇦";
  let region = "África";

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
        airline = deal.airline_name || deal.airline || "Aerolínea";
        const cls = (deal.classification || "OFERTA").toUpperCase();
        badge = (["CRÍTICO", "ERROR", "ANOMALÍA"].includes(cls)
          ? cls
          : "OFERTA") as typeof badge;
        region = deal.region || "Europa";
        emoji =
          region === "Asia" ? "🌏" :
          region === "Caribe" ? "🏝️" :
          region === "Oriente Medio" ? "🕌" :
          region === "África" ? "🇲🇦" :
          region === "Oceanía" ? "🇦🇺" :
          region.startsWith("América") ? "🌎" : "🇪🇺";
      }
    } catch {
      /* fallback */
    }
  }

  // Color scheme por destino/region — gradient sky
  const skyGradient =
    region === "África"
      ? "linear-gradient(180deg,#FCD9A8 0%,#F4A363 35%,#C84B2A 65%,#3E1E2A 100%)"
      : region === "Asia"
      ? "linear-gradient(180deg,#FFE5B4 0%,#F2A1A1 50%,#7A3B61 100%)"
      : region === "Caribe"
      ? "linear-gradient(180deg,#06B6D4 0%,#0891B2 50%,#0a1530 100%)"
      : region === "Norteamérica"
      ? "linear-gradient(180deg,#1E3A8A 0%,#5EAAD8 60%,#E0F2FE 100%)"
      : "linear-gradient(180deg,#FCD34D 0%,#F97316 40%,#9A3412 75%,#1E1B4B 100%)";

  const badgeColor = {
    CRÍTICO: "#DC2626",
    ERROR: "#EA580C",
    ANOMALÍA: "#F59E0B",
    OFERTA: "#10B981",
  }[badge];

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
        {/* Top: foto/sky + brand chips */}
        <div
          style={{
            width: "100%",
            height: "640px",
            display: "flex",
            background: skyGradient,
            position: "relative",
            padding: "48px 56px",
            justifyContent: "space-between",
          }}
        >
          {/* Brand corner top-left */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(10,21,48,0.72)",
                padding: "10px 18px 10px 14px",
                borderRadius: "999px",
                fontSize: "20px",
                fontWeight: 700,
                color: "#fbbf24",
                letterSpacing: "2px",
              }}
            >
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "#fbbf24",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0a1530",
                  fontSize: "12px",
                  fontWeight: 800,
                }}
              >
                ✈
              </div>
              TRIPCAZADOR
            </div>
          </div>

          {/* Badge urgencia top-right */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(10,21,48,0.85)",
              padding: "12px 22px",
              borderRadius: "999px",
              fontSize: "20px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "1.5px",
              border: `2px solid ${badgeColor}`,
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: badgeColor,
              }}
            />
            {badge}  ·  −{savingsPct}%
          </div>

          {/* Big emoji destino abajo derecha (silhouette evocadora) */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              right: "60px",
              fontSize: "180px",
              opacity: 0.85,
              display: "flex",
            }}
          >
            {emoji}
          </div>

          {/* Ciudad destino label sutil */}
          <div
            style={{
              position: "absolute",
              bottom: "30px",
              left: "56px",
              fontSize: "26px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "6px",
              textTransform: "uppercase",
              opacity: 0.92,
              display: "flex",
              textShadow: "0 2px 12px rgba(0,0,0,0.4)",
            }}
          >
            {route.to}
          </div>
        </div>

        {/* Bottom panel navy */}
        <div
          style={{
            width: "100%",
            height: "440px",
            background: "linear-gradient(180deg,#0a1530 0%,#163a78 100%)",
            display: "flex",
            flexDirection: "column",
            padding: "44px 56px",
            position: "relative",
            borderTop: "4px solid #fbbf24",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#fbbf24",
              letterSpacing: "5px",
              marginBottom: "18px",
              display: "flex",
            }}
          >
            VUELO IDA · DIRECTO
          </div>

          {/* Ruta gigante */}
          <div
            style={{
              fontSize: "62px",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1,
              marginBottom: "12px",
              letterSpacing: "-1.5px",
              display: "flex",
              alignItems: "center",
              gap: "24px",
            }}
          >
            <span style={{ display: "flex" }}>{route.from}</span>
            <span
              style={{
                fontSize: "44px",
                color: "#fbbf24",
                display: "flex",
              }}
            >
              →
            </span>
            <span style={{ display: "flex" }}>{route.to}</span>
          </div>

          {/* Detalles */}
          <div
            style={{
              fontSize: "20px",
              color: "#94A3B8",
              marginBottom: "24px",
              display: "flex",
            }}
          >
            {dateOut} · {airline} · sin escalas
          </div>

          {/* Precio block */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "24px" }}>
            <div
              style={{
                fontSize: "120px",
                fontWeight: 800,
                color: "#fbbf24",
                lineHeight: 1,
                letterSpacing: "-4px",
                display: "flex",
              }}
            >
              {price}€
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                paddingBottom: "20px",
              }}
            >
              <div
                style={{
                  fontSize: "26px",
                  color: "#94A3B8",
                  textDecoration: "line-through",
                  display: "flex",
                }}
              >
                {oldPrice}€
              </div>
              <div
                style={{
                  fontSize: "20px",
                  color: "#10B981",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  display: "flex",
                }}
              >
                ↓ ahorras {oldPrice - price}€
              </div>
            </div>
          </div>

          {/* CTA pill bottom-right */}
          <div
            style={{
              position: "absolute",
              bottom: "44px",
              right: "56px",
              background: "linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%)",
              padding: "20px 36px",
              borderRadius: "999px",
              fontSize: "24px",
              fontWeight: 800,
              color: "#0a1530",
              letterSpacing: "2px",
              display: "flex",
            }}
          >
            RESERVAR  →
          </div>

          {/* URL footer */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "56px",
              fontSize: "16px",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "1px",
              display: "flex",
            }}
          >
            tripcazador.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      headers: {
        // SSS51: cache CDN agresivo para evitar invocaciones serverless caras.
        // El OG image se rinde solo para cron Instagram + share manual.
        // Stale-while-revalidate=7d permite servir caché viejo mientras
        // regeneramos en background — invocations −95% vs antes.
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800, immutable",
      },
    }
  );
}
