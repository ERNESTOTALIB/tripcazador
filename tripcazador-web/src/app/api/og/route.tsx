import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * /api/og?title=...&subtitle=... — OG image dinámica genérica TripCazador.
 *
 * SSS417: Antes 404. Referenciada en /panel/partner/[ref_code] (sección
 * "Materiales partner → OG image dinámica") como recurso para partners que
 * promocionan TripCazador en sus propios canales. Sin este endpoint, ese
 * link daba 404 al click.
 *
 * Genera 1200×630 (OG standard) con gradient sky + título (default
 * "TripCazador") + subtitle opcional + branding "tripcazador.com — chollos
 * de vuelo desde Europa".
 *
 * Query params:
 *   ?title=...     título grande (default: "TripCazador")
 *   ?subtitle=...  subtítulo opcional bajo el título
 *
 * Truncamos a 80 chars title / 120 chars subtitle para evitar layouts rotos
 * con inputs maliciosos.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rawTitle = sp.get("title") || "TripCazador";
  const rawSubtitle = sp.get("subtitle") || "Chollos de vuelo desde Europa";
  const title = rawTitle.slice(0, 80);
  const subtitle = rawSubtitle.slice(0, 120);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background:
            "linear-gradient(135deg, #0c4a6e 0%, #075985 40%, #0369a1 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header: brand + URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 28,
            letterSpacing: 0.5,
            opacity: 0.92,
          }}
        >
          <div
            style={{
              fontSize: 44,
              lineHeight: 1,
            }}
          >
            ✈️
          </div>
          <div style={{ fontWeight: 700 }}>TripCazador</div>
          <div style={{ opacity: 0.6 }}>·</div>
          <div style={{ opacity: 0.85 }}>tripcazador.com</div>
        </div>

        {/* Body: title + subtitle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: title.length > 40 ? 72 : 88,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 1040,
              display: "flex",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 32,
              opacity: 0.88,
              maxWidth: 1040,
              lineHeight: 1.3,
              display: "flex",
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Footer: badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 24,
          }}
        >
          <div
            style={{
              background: "#fbbf24",
              color: "#0c4a6e",
              padding: "10px 22px",
              borderRadius: 999,
              fontWeight: 700,
              letterSpacing: 0.4,
              display: "flex",
            }}
          >
            ERROR FARES 24/7
          </div>
          <div style={{ opacity: 0.75, display: "flex" }}>
            750+ aerolíneas · 320+ aeropuertos
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
