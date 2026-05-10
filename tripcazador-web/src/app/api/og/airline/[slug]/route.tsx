import { ImageResponse } from "next/og";
import { getAirlineComparisonBySlug } from "@/lib/airline_comparisons";

/**
 * /api/og/airline/[slug] — JJJJ02 (May 2026)
 *
 * OG image dinámico 1200x630 para /comparar-aerolineas/[slug].
 * Diseño: hero "AIRLINE A vs AIRLINE B" + emojis + flags + verdict score
 * (X-Y wins, Z ties), con paleta navy + amber TripCazador.
 *
 * Boost share/CTR esperado: 15-25% en social media (Twitter/Telegram)
 * tras publicar comparativas — el OG genérico no transmite el contexto
 * "head-to-head" del contenido.
 */

// SSS124: nodejs runtime (no edge) — AIRLINE_COMPARISONS 30 entries supera
// el bundle límit edge 1MB. nodejs no tiene esa restricción y para OG
// images cacheadas 1 año immutable la latencia extra (~150ms cold start)
// es irrelevante.
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

  // Trim title si supera 60 chars para evitar overflow
  const titleTrim = c.title.length > 64 ? c.title.slice(0, 61) + "…" : c.title;

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
          padding: "60px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#fff",
          position: "relative",
        }}
      >
        {/* Header brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#fbbf24",
              letterSpacing: "-0.02em",
            }}
          >
            ⚡ TripCazador
          </div>
          <div
            style={{
              fontSize: "18px",
              color: "#94a3b8",
              marginLeft: "auto",
              padding: "6px 14px",
              border: "1px solid #334155",
              borderRadius: "999px",
            }}
          >
            HEAD-TO-HEAD · {c.routeContext}
          </div>
        </div>

        {/* Versus block */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "30px",
            marginBottom: "40px",
            flex: 1,
          }}
        >
          {/* Side A */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              flex: 1,
              padding: "32px 20px",
              border: aWins > bWins ? "2px solid #fbbf24" : "1px solid #334155",
              borderRadius: "20px",
              background: aWins > bWins ? "rgba(251, 191, 36, 0.08)" : "rgba(15, 23, 42, 0.5)",
            }}
          >
            <div style={{ fontSize: "80px" }}>{c.a.emoji}</div>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: aWins > bWins ? "#fbbf24" : "#fff",
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              {c.a.name}
            </div>
            <div
              style={{
                fontSize: "20px",
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              {c.a.country} · {c.a.skytraxStars}★
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: aWins > bWins ? "#fbbf24" : "#cbd5e1",
                marginTop: "8px",
              }}
            >
              {aWins} {aWins === 1 ? "victoria" : "victorias"}
            </div>
          </div>

          {/* VS */}
          <div
            style={{
              fontSize: "60px",
              fontWeight: 900,
              color: "#fbbf24",
              padding: "0 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
              gap: "16px",
              flex: 1,
              padding: "32px 20px",
              border: bWins > aWins ? "2px solid #fbbf24" : "1px solid #334155",
              borderRadius: "20px",
              background: bWins > aWins ? "rgba(251, 191, 36, 0.08)" : "rgba(15, 23, 42, 0.5)",
            }}
          >
            <div style={{ fontSize: "80px" }}>{c.b.emoji}</div>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: bWins > aWins ? "#fbbf24" : "#fff",
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              {c.b.name}
            </div>
            <div
              style={{
                fontSize: "20px",
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              {c.b.country} · {c.b.skytraxStars}★
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: bWins > aWins ? "#fbbf24" : "#cbd5e1",
                marginTop: "8px",
              }}
            >
              {bWins} {bWins === 1 ? "victoria" : "victorias"}
            </div>
          </div>
        </div>

        {/* Footer subtitle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            paddingTop: "20px",
            borderTop: "1px solid #334155",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              color: "#cbd5e1",
              flex: 1,
              lineHeight: 1.3,
            }}
          >
            {titleTrim.replace(/\s\|\sTripCazador$/, "")}
          </div>
          <div
            style={{
              fontSize: "18px",
              color: "#fbbf24",
              fontWeight: 700,
              whiteSpace: "nowrap",
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
