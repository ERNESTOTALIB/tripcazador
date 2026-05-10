import { ImageResponse } from "next/og";
import { getAirlineComparisonBySlug } from "@/lib/airline_comparisons";

/**
 * /api/og-comparison/[slug] — JJJJ02 + KKKK03 (May 2026)
 *
 * OG image dinámico 1200x630 para /comparar-aerolineas/[slug].
 * Diseño: hero "AIRLINE A vs AIRLINE B" + score X-Y wins, paleta
 * navy + amber TripCazador.
 *
 * KKKK03 (post-debug): re-escrito para evitar Satori errors.
 *  - Sin emojis flag (Satori no los renderiza sin custom font)
 *  - Sin `position`, `gap`, `flex: 1` (Satori limited support)
 *  - Todos los `<div>` con children siempre `display: "flex"` explícito
 *  - Layout vertical simple sin nested flex complejo
 *
 * Boost share/CTR esperado 15-25% en social media post-deploy.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIZE = { width: 1200, height: 630 } as const;

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
): Promise<ImageResponse | Response> {
  const c = getAirlineComparisonBySlug(params.slug);
  if (!c) {
    return new Response("Not found", { status: 404 });
  }

  const aWins = c.criteria.filter((cr) => cr.winner === "a").length;
  const bWins = c.criteria.filter((cr) => cr.winner === "b").length;
  const winnerA = aWins > bWins;
  const winnerB = bWins > aWins;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0f172a",
          padding: "60px",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Brand row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "32px",
              fontWeight: 800,
              color: "#fbbf24",
            }}
          >
            TripCazador
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "18px",
              color: "#94a3b8",
              padding: "6px 14px",
              border: "1px solid #334155",
              borderRadius: "999px",
            }}
          >
            HEAD-TO-HEAD
          </div>
        </div>

        {/* Versus row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          {/* Side A */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "440px",
              padding: "32px 20px",
              border: winnerA ? "3px solid #fbbf24" : "1px solid #334155",
              borderRadius: "20px",
              background: winnerA ? "#1e293b" : "#0f172a",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "64px",
                fontWeight: 900,
                color: winnerA ? "#fbbf24" : "#94a3b8",
                letterSpacing: "0.05em",
                marginBottom: "12px",
              }}
            >
              {c.a.code}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "32px",
                fontWeight: 800,
                color: winnerA ? "#fbbf24" : "#fff",
                marginBottom: "8px",
                textAlign: "center",
              }}
            >
              {c.a.name}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "18px",
                color: "#94a3b8",
                marginBottom: "16px",
              }}
            >
              {c.a.country}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "26px",
                fontWeight: 700,
                color: winnerA ? "#fbbf24" : "#cbd5e1",
              }}
            >
              {aWins} {aWins === 1 ? "victoria" : "victorias"}
            </div>
          </div>

          {/* VS */}
          <div
            style={{
              display: "flex",
              fontSize: "56px",
              fontWeight: 900,
              color: "#fbbf24",
            }}
          >
            VS
          </div>

          {/* Side B */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "440px",
              padding: "32px 20px",
              border: winnerB ? "3px solid #fbbf24" : "1px solid #334155",
              borderRadius: "20px",
              background: winnerB ? "#1e293b" : "#0f172a",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "64px",
                fontWeight: 900,
                color: winnerB ? "#fbbf24" : "#94a3b8",
                letterSpacing: "0.05em",
                marginBottom: "12px",
              }}
            >
              {c.b.code}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "32px",
                fontWeight: 800,
                color: winnerB ? "#fbbf24" : "#fff",
                marginBottom: "8px",
                textAlign: "center",
              }}
            >
              {c.b.name}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "18px",
                color: "#94a3b8",
                marginBottom: "16px",
              }}
            >
              {c.b.country}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "26px",
                fontWeight: 700,
                color: winnerB ? "#fbbf24" : "#cbd5e1",
              }}
            >
              {bWins} {bWins === 1 ? "victoria" : "victorias"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "24px",
            borderTop: "1px solid #334155",
          }}
        >
          <div style={{ display: "flex", fontSize: "20px", color: "#cbd5e1" }}>
            Comparativa cazador 2026
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "18px",
              color: "#fbbf24",
              fontWeight: 700,
            }}
          >
            tripcazador.com
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=31536000",
      },
    },
  );
}
