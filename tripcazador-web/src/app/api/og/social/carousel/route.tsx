import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getDeals } from "@/lib/api";
import { getDestImage, buildUnsplashUrl } from "@/lib/dest_images";
import { getDestContent } from "@/lib/dest_content";
import { getCoordForDeal } from "@/lib/dest_coords";

export const runtime = "nodejs";

/**
 * /api/og/social/carousel?dealId=X&slide=N — fase SSS74 (May 2026)
 *
 * Slides 2-5 del carrusel Instagram con estética Barcelona magazine
 * (canva v3 reference: 2_park_guell.png / 3_casa_batllo.png / etc).
 *
 *   slide=places  →  Plate II — lugar nº 1 que ver (atracción top 1)
 *   slide=food    →  Plate III — qué comer (1 plato típico hero)
 *   slide=tips    →  Plate IV — tip clave para ahorrar
 *   slide=cta     →  Plate V — CTA cierre + URL
 *
 * Formato cada slide:
 *   - Foto de fondo (Unsplash destino) con tint navy
 *   - Top pills: "PLATE N · LABEL" amber + coord white-dim
 *   - Card central tipo "torn paper" cream PAPER:
 *       · Título serif italic terracotta + thin line below
 *       · Descripción serif navy wrap centrado
 *   - Bottom strip ámbar: TC + URL + plate N/05
 */

type SlideKind = "places" | "food" | "tips" | "cta" | "blog";

function isSlide(s: string | null): s is SlideKind {
  return s === "places" || s === "food" || s === "tips" || s === "cta" || s === "blog";
}

const SLIDE_CONFIG: Record<SlideKind, { num: number; label: string }> = {
  places: { num: 2, label: "LUGAR  Nº 1  ·  TOP" },
  food: { num: 3, label: "GASTRO  ·  TÍPICO" },
  tips: { num: 4, label: "TIP  LOCAL  ·  AHORRO" },
  cta: { num: 5, label: "CIERRE  ·  TU TURNO" },
  // legacy alias
  blog: { num: 5, label: "CIERRE  ·  TU TURNO" },
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dealId = sp.get("dealId");
  const slideRaw = sp.get("slide") || "places";

  if (!isSlide(slideRaw)) {
    return new Response(`Invalid slide: ${slideRaw}`, { status: 400 });
  }
  const slide: SlideKind = slideRaw === "blog" ? "cta" : slideRaw;

  let cityTo = "Barcelona";
  let destKey = "barcelona";
  let region: string | undefined;
  let dealLat: number | undefined;
  let dealLon: number | undefined;

  if (dealId) {
    try {
      const data = await getDeals({ limit: 200 });
      const deal = data.deals.find((d) => d.id === dealId);
      if (deal) {
        cityTo = deal.city_to || deal.destination || "Barcelona";
        destKey = deal.destination || deal.city_to || deal.region || "world";
        region = deal.region;
        dealLat = deal.lat;
        dealLon = deal.lon;
      }
    } catch {
      /* fallback */
    }
  }

  const dest = getDestImage(destKey);
  const photoUrl = buildUnsplashUrl(dest.photoId, 1200, 1200);
  const content = getDestContent(destKey, region);
  const coord = getCoordForDeal({ lat: dealLat, lon: dealLon, destination: destKey, cityTo });

  // Pick title + description per slide
  let title = "";
  let description = "";
  if (slide === "places" && content.attractions.length > 0) {
    const a = content.attractions[0];
    title = `${a.name}, ${cityTo}`;
    description = a.desc;
  } else if (slide === "food" && content.food.length > 0) {
    const f = content.food[0];
    title = `${f.name}, ${cityTo}`;
    description = f.desc;
  } else if (slide === "tips" && content.tips.length > 0) {
    const t = content.tips[0];
    title = `Tip local`;
    description = t.text;
  } else if (slide === "cta") {
    title = `${cityTo}, te espera`;
    description = `El próximo chollo ya está saliendo en tripcazador.com — síguenos para no perdértelo.`;
  } else {
    // Fallback genérico
    title = cityTo;
    description = "Más detalles en tripcazador.com.";
  }

  const cfg = SLIDE_CONFIG[slide];

  const NAVY = "#0a1530";
  const AMBER = "#fbbf24";
  const WHITE_DIM = "#e5e7eb";
  const TERRACOTTA = "#c83c32";
  const PAPER = "#faf8f3";

  const cityUpper = cityTo.toUpperCase();
  const topRight = coord ? `${cityUpper}  ·  ${coord}` : cityUpper;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1080px",
          display: "flex",
          flexDirection: "column",
          background: NAVY,
          fontFamily: "Georgia, 'Times New Roman', serif",
          position: "relative",
        }}
      >
        {/* ─── PHOTO BG TOP 970px ─── */}
        <div
          style={{
            width: "1080px",
            height: "970px",
            display: "flex",
            position: "relative",
            backgroundImage: `linear-gradient(180deg, rgba(10,21,48,0.35) 0%, rgba(10,21,48,0.1) 30%, rgba(10,21,48,0.1) 60%, rgba(10,21,48,0.4) 100%), url(${photoUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* TOP PILLS — label + coord */}
          <div
            style={{
              position: "absolute",
              top: "50px",
              left: "50px",
              padding: "10px 22px",
              borderRadius: "24px",
              background: "rgba(10,21,48,0.85)",
              display: "flex",
              fontSize: "16px",
              fontWeight: 700,
              color: AMBER,
              letterSpacing: "2.5px",
              fontFamily: "ui-monospace, 'Courier New', monospace",
            }}
          >
            PLATE  {romanNumeral(cfg.num)}  ·  {cfg.label}
          </div>
          <div
            style={{
              position: "absolute",
              top: "50px",
              right: "50px",
              padding: "10px 22px",
              borderRadius: "24px",
              background: "rgba(10,21,48,0.85)",
              display: "flex",
              fontSize: "14px",
              fontWeight: 600,
              color: WHITE_DIM,
              letterSpacing: "2px",
              fontFamily: "ui-monospace, 'Courier New', monospace",
            }}
          >
            {topRight}
          </div>

          {/* ─── CARD CENTRAL ESTILO TORN PAPER ─── */}
          {/* Drop shadow box (offset 10/12) */}
          <div
            style={{
              position: "absolute",
              top: "320px",
              left: "120px",
              width: "840px",
              height: "360px",
              background: "rgba(0,0,0,0.35)",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "310px",
              left: "110px",
              width: "840px",
              height: "360px",
              background: PAPER,
              border: "1px solid #ddd6c4",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "44px 60px",
            }}
          >
            {/* Title serif italic terracotta */}
            <div
              style={{
                display: "flex",
                fontSize: title.length > 28 ? "44px" : "56px",
                fontWeight: 900,
                fontStyle: "italic",
                color: TERRACOTTA,
                fontFamily: "Georgia, 'Times New Roman', serif",
                textAlign: "center",
                lineHeight: 1.05,
                maxWidth: "720px",
              }}
            >
              {title}
            </div>

            {/* Thin line */}
            <div
              style={{
                width: "180px",
                height: "1px",
                background: TERRACOTTA,
                marginTop: "20px",
                display: "flex",
              }}
            />

            {/* Description serif navy */}
            <div
              style={{
                display: "flex",
                fontSize: "22px",
                fontWeight: 400,
                color: NAVY,
                fontFamily: "Georgia, 'Times New Roman', serif",
                textAlign: "center",
                marginTop: "24px",
                lineHeight: 1.4,
                maxWidth: "700px",
              }}
            >
              {description}
            </div>
          </div>
        </div>

        {/* ─── BOTTOM STRIP — TC + URL + plate number ─── */}
        <div
          style={{
            width: "1080px",
            height: "110px",
            background: NAVY,
            borderTop: `4px solid ${AMBER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 40px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* TC Brand */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              borderLeft: `3px solid ${AMBER}`,
              paddingLeft: "12px",
            }}
          >
            <div style={{ display: "flex", fontSize: "20px", fontWeight: 900, color: "#fff", letterSpacing: "1px", lineHeight: 1 }}>
              TRIPCAZADOR
            </div>
            <div style={{ display: "flex", fontSize: "11px", fontWeight: 700, color: AMBER, letterSpacing: "3px", marginTop: "4px", lineHeight: 1 }}>
              · RADAR DE CHOLLOS ·
            </div>
          </div>

          {/* URL center */}
          <div style={{ display: "flex", fontSize: "28px", fontWeight: 800, color: AMBER, letterSpacing: "1px" }}>
            tripcazador.com
          </div>

          {/* Plate number */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: "14px", fontWeight: 600, color: WHITE_DIM, letterSpacing: "1px" }}>
              @tripcazador
            </div>
            <div style={{ display: "flex", fontSize: "13px", fontWeight: 700, color: AMBER, letterSpacing: "3px", marginTop: "4px", fontFamily: "ui-monospace, 'Courier New', monospace" }}>
              {String(cfg.num).padStart(2, "0")}  /  05
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}

function romanNumeral(n: number): string {
  const map: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };
  return map[n] || String(n);
}
