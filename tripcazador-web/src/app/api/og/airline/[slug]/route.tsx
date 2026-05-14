import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getAirlineByCode } from "@/lib/airlines";

export const runtime = "edge";

/**
 * /api/og/airline/[slug] — OG image dinámica para perfiles de aerolínea.
 *
 * SSS167: Antes 404. Esto rompía cards de Twitter/Facebook al compartir
 * /aerolineas/iberia, /aerolineas/qr, etc. Genera 1200×630 (OG standard)
 * con branding TripCazador + nombre aerolínea + IATA + categoría + país.
 *
 * Si slug no existe en catálogo → image fallback genérica.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const slug = String(params.slug || "").toLowerCase();
  const airline = getAirlineByCode(slug);

  const name = airline?.name || "Aerolínea";
  const iata = airline?.code?.toUpperCase() || slug.toUpperCase().slice(0, 2);
  const category = airline?.category || "full-service";
  const country = airline?.country || "";
  const hubs = (airline?.hubs || []).slice(0, 3).join(" · ");

  // Color por categoría
  const colorByCat: Record<string, string> = {
    "low-cost": "#f59e0b",
    "full-service": "#3b82f6",
    luxury: "#a855f7",
    regional: "#10b981",
  };
  const accent = colorByCat[category] || "#f59e0b";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          padding: 64,
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#fbbf24",
              letterSpacing: -1,
            }}
          >
            ✈ TripCazador
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: 18,
              color: "#94a3b8",
            }}
          >
            tripcazador.com/aerolineas/{slug}
          </div>
        </div>

        {/* Main hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: accent,
                lineHeight: 1,
                letterSpacing: -3,
              }}
            >
              {iata}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 60,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: -2,
                }}
              >
                {name}
              </div>
              {country && (
                <div style={{ fontSize: 24, color: "#94a3b8" }}>
                  {country}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            <span
              style={{
                background: accent,
                color: "#0f172a",
                fontSize: 22,
                fontWeight: 700,
                padding: "10px 20px",
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {category}
            </span>
            {hubs && (
              <span
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#e2e8f0",
                  fontSize: 22,
                  fontWeight: 600,
                  padding: "10px 20px",
                  borderRadius: 999,
                }}
              >
                Hubs: {hubs}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 32,
            borderTop: "2px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ fontSize: 22, color: "#94a3b8" }}>
            Perfil completo, rutas, precios y comparativas
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#fbbf24",
            }}
          >
            Ver chollos →
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
