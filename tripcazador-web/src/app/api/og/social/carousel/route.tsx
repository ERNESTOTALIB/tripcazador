import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * /api/og/social/carousel?slide=1..5&topic=trucos|chollos
 *
 * Genera slides 1080×1080 para carousel storytelling.
 *
 * Slide 1: Hook (navy + headline + "DESLIZA →")
 * Slide 2: Datos / problema (cream + big number + chart mini)
 * Slide 3: Solución (cream + visual concept)
 * Slide 4: Testimonio (navy + quote + avatar)
 * Slide 5: CTA cierre (ámbar + brand + follow CTA)
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const slide = parseInt(sp.get("slide") || "1", 10);
  const topic = sp.get("topic") || "trucos";

  // Plantillas predefinidas por topic — puedes añadir más
  const templates: Record<string, Array<{
    headline: string;
    subhead?: string;
    accent?: string;
    bg: "navy" | "cream" | "amber";
  }>> = {
    trucos: [
      {
        headline: "5 errores que te encarecen 200€ por vuelo",
        subhead: "y cómo evitarlos en 2 min",
        accent: "200€",
        bg: "navy",
      },
      {
        headline: "Reservar martes vs sábado",
        subhead: "Las aerolíneas suben precio en horas pico de oficina",
        accent: "×3",
        bg: "cream",
      },
      {
        headline: "El truco: domingos 23:00",
        subhead: "Las aerolíneas refrescan precios al final del fin de semana",
        accent: "23:00",
        bg: "cream",
      },
      {
        headline: "\"Madrid → Tokio por 389€ ida y vuelta\"",
        subhead: "Lucía M. · Sevilla · usuaria desde 2025",
        accent: "1.247€ ahorrados",
        bg: "navy",
      },
      {
        headline: "¿No querer perderte el siguiente?",
        subhead: "Síguenos · 1-2 chollos al día",
        accent: "@tripcazador",
        bg: "amber",
      },
    ],
    chollos: [
      {
        headline: "Top 5 chollos de la semana",
        subhead: "elegidos por nuestro radar",
        accent: "−96%",
        bg: "navy",
      },
      {
        headline: "Madrid → Marrakech",
        subhead: "Solo 17€ ida con Ryanair",
        accent: "17€",
        bg: "cream",
      },
      {
        headline: "Atenas → Malta",
        subhead: "15€ ida con Ryanair · directo",
        accent: "15€",
        bg: "cream",
      },
      {
        headline: "Lisboa → Marrakech",
        subhead: "17€ ida con TAP · 1 escala corta",
        accent: "17€",
        bg: "navy",
      },
      {
        headline: "¿Quieres alertas en tu móvil?",
        subhead: "Activa Telegram · 1-2 chollos al día",
        accent: "@tripcazador",
        bg: "amber",
      },
    ],
  };

  const data = templates[topic] || templates.trucos;
  const idx = Math.max(1, Math.min(5, slide)) - 1;
  const t = data[idx];

  const bgStyles = {
    navy: { bg: "linear-gradient(180deg,#0a1530 0%,#1a2952 100%)", text: "#fff", accent: "#fbbf24", number: "08" },
    cream: { bg: "#FFFAEC", text: "#0a1530", accent: "#DC2626", number: "08" },
    amber: { bg: "#FFD93D", text: "#0a1530", accent: "#0a1530", number: "08" },
  }[t.bg];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: bgStyles.bg,
          fontFamily: "Inter, system-ui, sans-serif",
          padding: "70px 60px",
          position: "relative",
        }}
      >
        {/* Slide indicator */}
        <div
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: bgStyles.text,
            opacity: 0.55,
            letterSpacing: "5px",
            marginBottom: "30px",
            display: "flex",
          }}
        >
          {String(slide).padStart(2, "0")} / 05
        </div>

        {/* Accent (precio o número) */}
        {t.accent && (
          <div
            style={{
              fontSize: t.accent.length <= 5 ? "200px" : "120px",
              fontWeight: 800,
              color: bgStyles.accent,
              lineHeight: 1,
              letterSpacing: "-6px",
              marginBottom: "30px",
              display: "flex",
            }}
          >
            {t.accent}
          </div>
        )}

        {/* Headline */}
        <div
          style={{
            fontSize: t.headline.length > 40 ? "44px" : "60px",
            fontWeight: 800,
            color: bgStyles.text,
            lineHeight: 1.1,
            letterSpacing: "-1px",
            marginBottom: "24px",
            display: "flex",
          }}
        >
          {t.headline}
        </div>

        {/* Subhead */}
        {t.subhead && (
          <div
            style={{
              fontSize: "28px",
              fontWeight: 500,
              color: bgStyles.text,
              opacity: 0.75,
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            {t.subhead}
          </div>
        )}

        {/* Brand corner */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "60px",
            fontSize: "20px",
            fontWeight: 700,
            color: bgStyles.text,
            opacity: 0.7,
            letterSpacing: "3px",
            display: "flex",
          }}
        >
          TRIPCAZADOR.COM
        </div>

        {/* Swipe arrow (no en último slide) */}
        {slide < 5 && (
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              right: "60px",
              fontSize: "24px",
              fontWeight: 700,
              color: bgStyles.text,
              opacity: 0.85,
              letterSpacing: "3px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            DESLIZA  →
          </div>
        )}
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      headers: {
        "cache-control": "public, max-age=86400, s-maxage=86400",
      },
    }
  );
}
