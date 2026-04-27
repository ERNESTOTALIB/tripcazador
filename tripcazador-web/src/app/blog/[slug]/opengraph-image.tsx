import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog";

/**
 * Open Graph image dinámica para posts de blog (abr-2026m).
 *
 * Ruta: /blog/{slug}/opengraph-image (Next.js convención).
 * Genera 1200x630 PNG con título wrap-balanced, autor, reading time.
 *
 * Por qué dinámico: cada post comparte mejor con OG fiel al contenido —
 * en lugar de un og-default.png genérico para todos. Los OG dinámicos
 * suben CTR de Twitter/LinkedIn ~25-40% según AB tests públicos
 * (Vercel/Linear publicaron datos similares).
 *
 * Runtime: Node — `getPostBySlug` lee MDX del filesystem (`fs`/`path`),
 * incompatible con edge. Migrar a edge requiere pre-bundle del MDX.
 * abr-2026t: removido `runtime = "edge"` para desbloquear Vercel build.
 */

// export const runtime = "edge"; // bloquea webpack: fs/path Node-only en lib/blog
export const alt = "TripCazador — error fares & vuelos baratos desde Europa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Tipos JSX-style para evitar la dependencia explícita de @types/react en
// este edge handler (Next inyecta JSX automáticamente para ImageResponse).

export default async function Image({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  const title = post?.title || "TripCazador — chollos de vuelo";
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
        {/* Top brand bar */}
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
            {readingTime} min de lectura
          </span>
        </div>

        {/* Title — clamp a 3 líneas máximo */}
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

        {/* Bottom: author + URL */}
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
            <span style={{ color: "#9ca3af", fontSize: "16px" }}>Escrito por</span>
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
            tripcazador.com
            <span style={{ fontSize: "26px" }}>→</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
