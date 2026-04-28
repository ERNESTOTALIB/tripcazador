import { ImageResponse } from "next/og";

/**
 * Open Graph image dinámica para /destinos/[slug] — abr-2026x.
 *
 * Ruta: /destinos/{slug}/opengraph-image (Next.js convención).
 * Genera 1200x630 PNG con nombre de destino + tagline + branding.
 *
 * Por qué: hasta ahora /destinos/* compartía el og-default genérico — esto
 * limita CTR en Telegram/WhatsApp/Twitter cuando alguien comparte la URL.
 * Un OG fiel al destino sube CTR 25-40% (mismo dato que blog).
 *
 * Runtime: Node por simplicidad y consistencia con blog OG (que se removió
 * de edge tras T-fix por incompatibilidad fs/path).
 */

// export const runtime = "edge"; // mantener Node por consistencia
export const alt = "TripCazador — vuelos baratos al destino";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mapa de slug → display name + emoji. Mantener sincronizado con
// app/destinos/[slug]/page.tsx (DESTINATIONS const). Si se desincroniza,
// el OG mostrará un fallback genérico — no rompe la página.
const DESTINOS: Record<string, { name: string; emoji: string; tagline: string }> = {
  "tanzania": { name: "Tanzania", emoji: "🦁", tagline: "Safari + Zanzíbar en un solo vuelo" },
  "japon": { name: "Japón", emoji: "🌸", tagline: "Cerezos, momiji y vuelos baratos" },
  "maldivas": { name: "Maldivas", emoji: "🏝️", tagline: "Atolones a precio de Europa" },
  "nueva-york": { name: "Nueva York", emoji: "🗽", tagline: "JFK desde €290 — sí, en business" },
  "bali": { name: "Bali", emoji: "🌴", tagline: "Indonesia off-peak: noviembre brutal" },
  "buenos-aires": { name: "Buenos Aires", emoji: "🥩", tagline: "EZE desde €380 RT business" },
  "tailandia": { name: "Tailandia", emoji: "🛕", tagline: "Bangkok, islas, monzón controlado" },
  "sudafrica": { name: "Sudáfrica", emoji: "🦒", tagline: "Cape Town + safaris baratos" },
  "islandia": { name: "Islandia", emoji: "❄️", tagline: "Auroras, glaciares y vuelos baratos" },
  "marruecos": { name: "Marruecos", emoji: "🐪", tagline: "Marrakech a precio de tapas" },
  "vietnam": { name: "Vietnam", emoji: "🍜", tagline: "Hanoi y Saigón: Asia barata" },
  "costa-rica": { name: "Costa Rica", emoji: "🦥", tagline: "Pura vida + business class glitched" },
  // abr-2026z: 6 destinos adicionales
  "marrakech": { name: "Marrakech", emoji: "🐪", tagline: "Zocos, Majorelle y vuelos directos baratos" },
  "tokio": { name: "Tokio", emoji: "🗼", tagline: "Sakura, sushi y trenes bala" },
  "reykjavik": { name: "Reikiavik", emoji: "🌋", tagline: "Auroras boreales a 4h de España" },
  "singapur": { name: "Singapur", emoji: "🌃", tagline: "Ciudad futurista y hub asiático" },
  "praga": { name: "Praga", emoji: "🏰", tagline: "Cien torres y cervezas legendarias" },
  "estambul": { name: "Estambul", emoji: "🕌", tagline: "Cruce Europa-Asia, hub Turkish" },
  // abr-2026bb: 6 destinos adicionales
  "berlin": { name: "Berlín", emoji: "🐻", tagline: "Memorial, Museum Island y Berghain" },
  "atenas": { name: "Atenas", emoji: "🏛️", tagline: "Acrópolis y puerta a las islas griegas" },
  "dubai": { name: "Dubái", emoji: "🏙️", tagline: "Burj Khalifa, hub intercontinental" },
  "el-cairo": { name: "El Cairo", emoji: "🐫", tagline: "Pirámides, Esfinge, Museo Egipcio" },
  "hong-kong": { name: "Hong Kong", emoji: "🌃", tagline: "Victoria Peak, dim sum y skyline" },
  "sydney": { name: "Sídney", emoji: "🦘", tagline: "Opera House, Bondi y Blue Mountains" },
};

export default async function Image({ params }: { params: { slug: string } }) {
  const dest =
    DESTINOS[params.slug] || {
      name: params.slug.replace(/-/g, " "),
      emoji: "✈️",
      tagline: "Vuelos baratos desde Europa",
    };

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
          <span style={{ color: "#94a3b8", fontWeight: 400 }}>destinos</span>
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
          <div style={{ fontSize: "120px", lineHeight: 1 }}>{dest.emoji}</div>
          <div
            style={{
              fontSize: "96px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              textTransform: "capitalize",
            }}
          >
            {dest.name}
          </div>
          <div
            style={{
              fontSize: "36px",
              color: "#cbd5e1",
              fontWeight: 400,
              lineHeight: 1.3,
              maxWidth: "900px",
            }}
          >
            {dest.tagline}
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
          <span>tripcazador.com</span>
          <span>Análisis con datos reales</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
