import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getDeals } from "@/lib/api";

export const runtime = "edge";

/**
 * /api/og/instagram?dealId=X — fase ww XX2
 *
 * Genera imagen 1080×1350 (Instagram portrait) con plantilla sky gradient +
 * ruta + precio destacado + emoji destino + branding "tripcazador.com".
 *
 * Si no hay dealId o no existe → genera una "card genérica" promocional.
 *
 * Consumido por:
 *   - Cron GH Actions Instagram auto-publish (descarga la imagen + POST API)
 *   - OG share manual desde share buttons en /deals/[id]
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dealId = sp.get("dealId");

  let route = "Madrid → Reikiavik";
  let price = "119";
  let savings = "52";
  let nights = "5";
  let cabin = "Economy";
  let airline = "Iberia";
  let emoji = "🇮🇸";
  let badgeText = "ERROR FARE";

  if (dealId) {
    try {
      const data = await getDeals({ limit: 200 });
      const deal = data.deals.find((d) => d.id === dealId);
      if (deal) {
        route = `${deal.city_from || deal.origin} → ${deal.city_to || deal.destination}`;
        price = String(Math.round(deal.price_eur));
        savings = String(Math.round(deal.savings_pct ?? 30));
        nights = String(deal.nights ?? 5);
        cabin = (deal.cabin || "economy").replace(/_/g, " ");
        airline = deal.airline_name || deal.airline || "Aerolínea";
        badgeText = (deal.classification || "OFERTA").toUpperCase();
        // Pick emoji by region
        const region = deal.region || "";
        emoji =
          region === "Asia" ? "🌏" :
          region === "Europa" ? "🇪🇺" :
          region === "Caribe" ? "🏝️" :
          region === "Oriente Medio" ? "🕌" :
          region === "África" ? "🌍" :
          region === "Oceanía" ? "🇦🇺" :
          region.startsWith("América") ? "🌎" : "✈️";
      }
    } catch {
      /* fallback to defaults above */
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(180deg, #0c4a6e 0%, #0369a1 25%, #38bdf8 60%, #fbbf24 90%, #f97316 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#fff",
          padding: "80px 60px",
          position: "relative",
        }}
      >
        {/* Top: brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ fontSize: 50 }}>✈️</span>
          <span>
            Trip<span style={{ color: "#1e293b" }}>Cazador</span>
          </span>
        </div>

        {/* Middle: deal */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 28px",
              background: "rgba(255,255,255,0.95)",
              borderRadius: 100,
              fontSize: 26,
              fontWeight: 800,
              color: "#dc2626",
              letterSpacing: "0.05em",
              marginBottom: 50,
            }}
          >
            <span style={{ fontSize: 32 }}>🔥</span>
            <span>{badgeText}</span>
          </div>

          {/* Emoji + Route */}
          <div style={{ display: "flex", fontSize: 110, marginBottom: 24 }}>
            {emoji}
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              textShadow: "0 4px 24px rgba(0,0,0,0.25)",
              marginBottom: 32,
              maxWidth: "90%",
            }}
          >
            {route}
          </div>

          {/* Price hero */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 24,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 220,
                fontWeight: 900,
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
                color: "#fff",
                textShadow: "0 8px 40px rgba(0,0,0,0.35)",
              }}
            >
              {price}€
            </div>
            <div
              style={{
                fontSize: 50,
                fontWeight: 700,
                background: "#fbbf24",
                color: "#1e293b",
                padding: "12px 24px",
                borderRadius: 16,
              }}
            >
              -{savings}%
            </div>
          </div>

          {/* Detail */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              opacity: 0.95,
              textShadow: "0 2px 12px rgba(0,0,0,0.2)",
            }}
          >
            {cabin} · {nights} noches · {airline}
          </div>
        </div>

        {/* Bottom: CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            paddingTop: 40,
            borderTop: "2px solid rgba(255,255,255,0.3)",
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            tripcazador.com
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              padding: "12px 32px",
              background: "#1e293b",
              color: "#fbbf24",
              borderRadius: 100,
            }}
          >
            Reserva ahora →
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
    },
  );
}
