import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getDeals } from "@/lib/api";
import { getDestImage, buildUnsplashUrl } from "@/lib/dest_images";
import { getDestContent, getBlogForDest } from "@/lib/dest_content";

export const runtime = "edge";

/**
 * /api/og/social/carousel?dealId=X&slide=N — fase SSS57 (May 2026)
 *
 * Genera 1 de 4 slides de un carousel Instagram para un deal:
 *   slide=places  →  TOP atracciones turísticas del destino
 *   slide=food    →  Comida típica + restaurantes
 *   slide=tips    →  Tips locales (transporte, ahorro)
 *   slide=blog    →  CTA al blog post matched (si existe)
 *
 * Slide 1 (deal principal) sigue siendo /api/og/social/post-v2.
 * Workflow IG: post-v2 + carousel(places) + carousel(food) + carousel(tips)
 *              + carousel(blog) → 5 slides total (limit IG: 10).
 */

type SlideKind = "places" | "food" | "tips" | "blog";

function isSlide(s: string | null): s is SlideKind {
  return s === "places" || s === "food" || s === "tips" || s === "blog";
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dealId = sp.get("dealId");
  const slide = (sp.get("slide") || "places") as string;

  if (!isSlide(slide)) {
    return new Response(`Invalid slide: ${slide}`, { status: 400 });
  }

  let cityTo = "destino";
  let destKey = "world";
  let region: string | undefined;

  if (dealId) {
    try {
      const data = await getDeals({ limit: 200 });
      const deal = data.deals.find((d) => d.id === dealId);
      if (deal) {
        cityTo = deal.city_to || deal.destination || "destino";
        destKey = deal.destination || deal.city_to || deal.region || "world";
        region = deal.region;
      }
    } catch {
      /* fallback */
    }
  }

  const dest = getDestImage(destKey);
  const bgUrl = buildUnsplashUrl(dest.photoId, 1080, 1080);
  const content = getDestContent(destKey, region);
  const blog = getBlogForDest(destKey);

  // SSS58: usar logo horizontal real (PNG dark) para branding consistente
  const logoUrl = `${req.nextUrl.origin}/logo-horizontal-dark.png`;

  const slideTitle: Record<SlideKind, string> = {
    places: "QUÉ VER",
    food: "QUÉ COMER",
    tips: "TIPS LOCALES",
    blog: "GUÍA COMPLETA",
  };
  const slideEmoji: Record<SlideKind, string> = {
    places: "📍",
    food: "🍽️",
    tips: "💡",
    blog: "📖",
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1080px",
          display: "flex",
          flexDirection: "column",
          background: "#0a1530",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#fff",
          position: "relative",
        }}
      >
        <img
          src={bgUrl}
          width={1080}
          height={1080}
          alt={dest.alt}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1080px",
            height: "1080px",
            objectFit: "cover",
            display: "flex",
          }}
        />
        {/* Overlay casi opaco — la foto es solo "atmósfera". Cards
            tienen su propio fondo solid navy → texto blanco SIEMPRE legible
            sin importar la foto destino. SSS58 fix. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(10,21,48,0.78) 0%, rgba(10,21,48,0.88) 30%, rgba(10,21,48,0.96) 70%, rgba(10,21,48,0.98) 100%)",
            display: "flex",
          }}
        />

        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "60px 70px 0",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              background: "#fff",
              padding: "14px 26px",
              borderRadius: "999px",
              fontSize: "26px",
              fontWeight: 800,
              color: "#0a1530",
            }}
          >
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: dest.accent, display: "flex" }} />
            {cityTo}
          </div>
          {/* Logo Tripcazador horizontal real (SSS58) */}
          <img
            src={logoUrl}
            alt="TripCazador"
            width={240}
            height={64}
            style={{
              display: "flex",
              width: "240px",
              height: "64px",
              objectFit: "contain",
            }}
          />
        </div>

        {/* TITLE */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "30px 0 20px",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", fontSize: "70px" }}>{slideEmoji[slide]}</div>
          <div
            style={{
              display: "flex",
              fontSize: "44px",
              fontWeight: 900,
              color: "#fbbf24",
              letterSpacing: "8px",
              marginTop: "6px",
            }}
          >
            {slideTitle[slide]}
          </div>
        </div>

        {/* CONTENT */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "10px 70px 30px",
            gap: "20px",
            zIndex: 1,
            justifyContent: "center",
          }}
        >
          {slide === "places" &&
            content.attractions.slice(0, 4).map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  background: "rgba(10,21,48,0.92)",
                  border: "2px solid rgba(251,191,36,0.3)",
                  padding: "20px 26px",
                  borderRadius: "20px",
                }}
              >
                <div style={{ display: "flex", fontSize: "48px", flexShrink: 0 }}>{a.emoji}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                  <div style={{ display: "flex", fontSize: "32px", fontWeight: 800, color: "#fff" }}>{a.name}</div>
                  <div style={{ display: "flex", fontSize: "22px", color: "rgba(255,255,255,0.85)" }}>{a.desc}</div>
                </div>
              </div>
            ))}

          {slide === "food" &&
            content.food.slice(0, 4).map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  background: "rgba(10,21,48,0.92)",
                  border: "2px solid rgba(16,185,129,0.4)",
                  padding: "22px 28px",
                  borderRadius: "20px",
                }}
              >
                <div style={{ display: "flex", fontSize: "52px", flexShrink: 0 }}>{f.emoji}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                  <div style={{ display: "flex", fontSize: "32px", fontWeight: 800, color: "#fff" }}>{f.name}</div>
                  <div style={{ display: "flex", fontSize: "22px", color: "rgba(255,255,255,0.85)" }}>{f.desc}</div>
                </div>
              </div>
            ))}

          {slide === "tips" &&
            content.tips.slice(0, 3).map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "24px",
                  background: "rgba(10,21,48,0.92)",
                  border: "2px solid rgba(251,191,36,0.6)",
                  padding: "26px 30px",
                  borderRadius: "20px",
                }}
              >
                <div style={{ display: "flex", fontSize: "60px", flexShrink: 0 }}>{t.emoji}</div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "28px",
                    color: "#fff",
                    fontWeight: 600,
                    flex: 1,
                  }}
                >
                  {t.text}
                </div>
              </div>
            ))}

          {slide === "blog" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "24px",
                background: "rgba(10,21,48,0.85)",
                border: "5px solid #fbbf24",
                padding: "50px 50px",
                borderRadius: "32px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "26px",
                  color: "#fbbf24",
                  fontWeight: 800,
                  letterSpacing: "8px",
                }}
              >
                LEE LA GUÍA COMPLETA
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "42px",
                  fontWeight: 900,
                  color: "#fff",
                  textAlign: "center",
                }}
              >
                {blog?.title || `Vuelos baratos a ${cityTo}: la guía completa`}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "24px",
                  color: "rgba(255,255,255,0.85)",
                  textAlign: "center",
                  fontWeight: 500,
                }}
              >
                {blog
                  ? "Datos reales, fechas óptimas, hubs alternativos y trucos para cazar tu vuelo."
                  : "Contenido nuevo cada semana: hubs, fechas óptimas y errores de tarifa."}
              </div>
              <div
                style={{
                  display: "flex",
                  background: "#fbbf24",
                  color: "#0a1530",
                  padding: "20px 40px",
                  borderRadius: "16px",
                  fontSize: "30px",
                  fontWeight: 900,
                  letterSpacing: "3px",
                  marginTop: "12px",
                }}
              >
                LINK EN BIO →
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 70px 50px",
            borderTop: "2px solid rgba(251,191,36,0.3)",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "26px",
              color: "#fbbf24",
              fontWeight: 800,
              letterSpacing: "4px",
            }}
          >
            tripcazador.com
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "20px",
              color: "rgba(255,255,255,0.8)",
              fontWeight: 700,
              letterSpacing: "2px",
            }}
          >
            DESLIZA →
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      headers: {
        "cache-control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800, immutable",
      },
    },
  );
}
