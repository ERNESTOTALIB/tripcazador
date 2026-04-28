import { ImageResponse } from "next/og";
import { getPostsByTag } from "@/lib/blog";

/**
 * Open Graph image dinámico para tag archive pages — abr-2026y.
 *
 * Renderiza 1200x630 con el tag, el conteo de posts y branding. Mejor CTR
 * cuando se comparten URLs de tag (Telegram, WhatsApp, Twitter, LinkedIn).
 */

export const alt = "TripCazador — etiqueta del blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function decode(t: string): string {
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}

function humanize(t: string): string {
  return t.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function Image({ params }: { params: { tag: string } }) {
  const tag = decode(params.tag);
  const posts = getPostsByTag(tag, "es");
  const human = humanize(tag);
  const count = posts.length;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          padding: "80px",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "32px",
            color: "#fbbf24",
            fontWeight: 600,
          }}
        >
          <span>TripCazador</span>
          <span style={{ color: "#475569" }}>·</span>
          <span style={{ color: "#94a3b8", fontWeight: 400 }}>blog</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: "32px",
              color: "#94a3b8",
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Etiqueta
          </div>
          <div
            style={{
              fontSize: "100px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#fbbf24",
            }}
          >
            #{human}
          </div>
          <div
            style={{
              fontSize: "36px",
              color: "#cbd5e1",
              fontWeight: 400,
              lineHeight: 1.3,
            }}
          >
            {count > 0
              ? `${count} ${count === 1 ? "artículo" : "artículos"} sobre ${human.toLowerCase()}`
              : `Artículos sobre ${human.toLowerCase()}`}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "22px",
            color: "#64748b",
            borderTop: "2px solid #334155",
            paddingTop: "24px",
          }}
        >
          <span>tripcazador.com/blog</span>
          <span>Análisis con datos reales</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
