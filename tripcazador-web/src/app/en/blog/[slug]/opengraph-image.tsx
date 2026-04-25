import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog";

/**
 * /en/blog/[slug] — Open Graph image dinámica (abr-2026m).
 *
 * Mismo concepto que la versión ES, con copy en inglés:
 *   - "min read" en lugar de "min de lectura"
 *   - "By" en lugar de "Escrito por"
 *
 * Si el post no es realmente EN (slug ES), el componente igual genera el
 * OG en inglés — Next sirve OG por URL solicitada y `/en/blog/{slug}` es
 * legítima incluso si lleva a un stub. Para esos casos el OG dice "By
 * TripCazador team / 8 min read" que sigue siendo correcto.
 */

export const runtime = "edge";
export const alt = "TripCazador — error fares & cheap flights from Europe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  const title = post?.title || "TripCazador — flight deals from Europe";
  const author = post?.author || "TripCazador team";
  const readingTime = post?.readingTime || 8;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "linear-gradient(135deg, #030712 0%, #0a0f1e 60%, #1a0f00 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "28px",
            fontWeight: 700,
          }}
        >
          <span style={{ fontSize: "36px" }}>✈️</span>
          <span>
            Trip<span style={{ color: "#f59e0b" }}>Cazador</span>
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "16px",
              fontWeight: 500,
              color: "#9ca3af",
              border: "1px solid rgba(245,158,11,0.4)",
              borderRadius: "9999px",
              padding: "6px 14px",
            }}
          >
            {readingTime} min read
          </span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 80 ? "52px" : "62px",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            color: "#ffffff",
            maxWidth: "1080px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            fontSize: "22px",
            color: "#d1d5db",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ color: "#9ca3af", fontSize: "16px" }}>By</span>
            <span style={{ color: "#ffffff", fontWeight: 600 }}>{author}</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#f59e0b",
              fontWeight: 700,
              fontSize: "20px",
            }}
          >
            tripcazador.com/en
            <span style={{ fontSize: "26px" }}>→</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
