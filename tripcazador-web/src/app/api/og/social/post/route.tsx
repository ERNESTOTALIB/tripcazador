import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getDeals } from "@/lib/api";
import { getDestImage, buildUnsplashUrl } from "@/lib/dest_images";
import { getCoordForDeal } from "@/lib/dest_coords";

export const runtime = "edge";

/**
 * /api/og/social/post?dealId=X — fase SSS74 (May 2026)
 *
 * Plate I — diseño Barcelona magazine editorial (canva v3 reference):
 * https://github.com/.../canva_propuesta_barcelona/1_hero_sagrada.png
 *
 * Estructura 1080×1080:
 *   - Foto destino full-bleed via background-image + gradient navy
 *   - Top strip metadata (mono): "PLATE I · CHOLLO DETECTADO" + "CITY · LAT · LON"
 *   - 4 corner brackets ámbar (estilo magazine cover)
 *   - Hero: city name SERIF BOLD 110px white centered + tagline italic
 *   - Big price panel navy (border ámbar 6px):
 *       · DESDE eyebrow ámbar
 *       · Price 220px serif amber bold
 *       · "antes XXX€" tachado SOLO esa parte (fix span split SSS73 bug)
 *         + "ahorras YY€" sin tachado
 *       · Ruta "X → Y" 38px serif bold white
 *       · Meta line "AIRLINE · IDA → VUELTA · noches · directo Xh Ym"
 *       · Hook italic ámbar
 *   - Bottom strip ámbar: TC mini badge + tripcazador.com center + 01 / 05 right
 *
 * Bug fix vs v3.1: el line-through ahora va dentro de un <span> separado
 * para que solo "antes 209€" aparezca tachado, no "ahorras 115€".
 *
 * Carrusel: este endpoint es slide 1. Slides 2-5 vienen de
 * /api/og/social/carousel?dealId=X&slide={places|food|tips|cta}.
 */

const MONTHS_ES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function fmtDate(d: string | undefined): string | null {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return `${dt.getDate()} ${MONTHS_ES[dt.getMonth()]}`;
}

function fmtDuration(min: number | undefined): string {
  if (!min || min <= 0) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} m`;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dealId = sp.get("dealId");

  // Defaults — Múnich → Barcelona (matches Canva reference exactly)
  let route = { from: "Múnich", to: "Barcelona" };
  let destKey = "barcelona";
  let dealLat: number | undefined;
  let dealLon: number | undefined;
  let price = 79;
  let oldPrice = 178;
  let savingsPct = 56;
  let dateOut: string | null = "08 jun";
  let dateRet: string | null = "12 jun";
  let nights = 4;
  let durationStr = "2 h 15 m";
  let airline = "Vueling";
  let stops = 0;

  if (dealId) {
    try {
      const data = await getDeals({ limit: 200 });
      const deal = data.deals.find((d) => d.id === dealId);
      if (deal) {
        route = {
          from: deal.city_from || deal.origin || "?",
          to: deal.city_to || deal.destination || "?",
        };
        destKey = deal.destination || deal.city_to || "";
        dealLat = deal.lat;
        dealLon = deal.lon;
        price = Math.round(deal.price_eur);
        savingsPct = Math.round(deal.savings_pct ?? 0);
        oldPrice = price + Math.round(deal.savings_eur ?? 0);
        dateOut = fmtDate(deal.date_out);
        dateRet = fmtDate(deal.date_ret);
        nights = deal.nights ?? 0;
        durationStr = fmtDuration(deal.duration_min);
        airline = deal.airline_name || deal.airline || "";
        stops = deal.stops ?? 0;
      }
    } catch {
      /* keep defaults */
    }
  }

  const dest = getDestImage(destKey);
  const photoUrl = buildUnsplashUrl(dest.photoId, 1200, 1200);
  const coord = getCoordForDeal({
    lat: dealLat,
    lon: dealLon,
    destination: destKey,
    cityTo: route.to,
  });

  // Construir meta line (igual que Canva: AIRLINE · IDA → VUELTA · noches · directo Xh Ym)
  const metaParts: string[] = [];
  if (airline) metaParts.push(airline.toUpperCase());
  if (dateOut && dateRet) {
    metaParts.push(`IDA ${dateOut}  →  VUELTA ${dateRet}`);
  } else if (dateOut) {
    metaParts.push(`IDA ${dateOut}`);
  }
  if (nights > 0) metaParts.push(`${nights} ${nights === 1 ? "noche" : "noches"}`);
  if (stops === 0 && durationStr) metaParts.push(`directo  ${durationStr}`);
  else if (durationStr) metaParts.push(`${stops} ${stops === 1 ? "escala" : "escalas"} · ${durationStr}`);
  const metaLine = metaParts.join("  ·  ");

  // Hook frase
  let hook = "";
  if (durationStr && stops === 0) {
    hook = `¿Listo para que en ${durationStr} estés conociendo ${route.to}?`;
  } else if (nights > 0) {
    hook = `${nights} ${nights === 1 ? "noche" : "noches"} en ${route.to}, ida y vuelta incluidos`;
  } else {
    hook = `Ruta directa hacia ${route.to}, sin sorpresas`;
  }

  const NAVY = "#0a1530";
  const AMBER = "#fbbf24";
  const WHITE_DIM = "#e5e7eb";

  // Top strip text — uppercase city + coord (formato magazine)
  const cityUpper = route.to.toUpperCase();
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
        {/* ─── PHOTO BG — toda la imagen 970px alto, strip queda 110 abajo ─── */}
        <div
          style={{
            width: "1080px",
            height: "970px",
            display: "flex",
            flexDirection: "column",
            backgroundImage: `linear-gradient(180deg, rgba(10,21,48,0.4) 0%, rgba(10,21,48,0.18) 22%, rgba(10,21,48,0.18) 45%, rgba(10,21,48,0.92) 100%), url(${photoUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}
        >
          {/* ─── 4 CORNER BRACKETS ─── */}
          {/* TL */}
          <div style={{ position: "absolute", top: "42px", left: "42px", width: "35px", height: "3px", background: AMBER, display: "flex" }} />
          <div style={{ position: "absolute", top: "42px", left: "42px", width: "3px", height: "35px", background: AMBER, display: "flex" }} />
          {/* TR */}
          <div style={{ position: "absolute", top: "42px", right: "42px", width: "35px", height: "3px", background: AMBER, display: "flex" }} />
          <div style={{ position: "absolute", top: "42px", right: "42px", width: "3px", height: "35px", background: AMBER, display: "flex" }} />
          {/* BL */}
          <div style={{ position: "absolute", bottom: "42px", left: "42px", width: "35px", height: "3px", background: AMBER, display: "flex" }} />
          <div style={{ position: "absolute", bottom: "42px", left: "42px", width: "3px", height: "35px", background: AMBER, display: "flex" }} />
          {/* BR */}
          <div style={{ position: "absolute", bottom: "42px", right: "42px", width: "35px", height: "3px", background: AMBER, display: "flex" }} />
          <div style={{ position: "absolute", bottom: "42px", right: "42px", width: "3px", height: "35px", background: AMBER, display: "flex" }} />

          {/* ─── TOP STRIP METADATA ─── */}
          <div
            style={{
              position: "absolute",
              top: "70px",
              left: "90px",
              right: "90px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              fontFamily: "ui-monospace, 'Courier New', monospace",
            }}
          >
            <div style={{ display: "flex", fontSize: "18px", fontWeight: 700, color: AMBER, letterSpacing: "3px" }}>
              PLATE  I  ·  CHOLLO  DETECTADO
            </div>
            <div style={{ display: "flex", fontSize: "16px", fontWeight: 500, color: WHITE_DIM, letterSpacing: "2px" }}>
              {topRight}
            </div>
          </div>

          {/* ─── CITY HUGE SERIF ─── */}
          <div
            style={{
              position: "absolute",
              top: "210px",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              fontSize: "108px",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "2px",
              fontFamily: "Georgia, 'Times New Roman', serif",
              textTransform: "uppercase",
            }}
          >
            {route.to}
          </div>

          {/* ─── TAGLINE ITALIC ─── */}
          <div
            style={{
              position: "absolute",
              top: "350px",
              left: "60px",
              right: "60px",
              display: "flex",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: 400,
              fontStyle: "italic",
              color: WHITE_DIM,
              fontFamily: "Georgia, 'Times New Roman', serif",
              textAlign: "center",
            }}
          >
            Cinco lugares imprescindibles  ·  y un precio cazado que lo paga todo
          </div>

          {/* ─── BIG PRICE PANEL ─── */}
          <div
            style={{
              position: "absolute",
              top: "445px",
              left: "80px",
              width: "920px",
              height: "440px",
              background: "rgba(10,21,48,0.94)",
              border: `5px solid ${AMBER}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: "26px",
            }}
          >
            {/* DESDE eyebrow */}
            <div
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: AMBER,
                letterSpacing: "6px",
                display: "flex",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              DESDE
            </div>

            {/* Precio MEGA serif */}
            <div
              style={{
                fontSize: "210px",
                fontWeight: 900,
                color: AMBER,
                lineHeight: 0.95,
                letterSpacing: "-4px",
                display: "flex",
                fontFamily: "Georgia, 'Times New Roman', serif",
                marginTop: "4px",
              }}
            >
              {price}€
            </div>

            {/* Old price tachado SOLO esa parte + savings sin tachado */}
            {oldPrice > price && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "4px",
                  fontSize: "20px",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                <span style={{ display: "flex", color: "#9ca3af", textDecoration: "line-through" }}>
                  antes {oldPrice}€
                </span>
                <span style={{ display: "flex", color: AMBER, fontWeight: 700 }}>
                  ↓ ahorras {oldPrice - price}€  ·  −{savingsPct}%
                </span>
              </div>
            )}

            {/* Ruta serif bold */}
            <div
              style={{
                fontSize: "38px",
                fontWeight: 700,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                marginTop: "12px",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              <span style={{ display: "flex" }}>{route.from}</span>
              <span style={{ display: "flex", color: AMBER, margin: "0 22px" }}>→</span>
              <span style={{ display: "flex" }}>{route.to}</span>
            </div>

            {/* Meta line sans */}
            <div
              style={{
                fontSize: "19px",
                fontWeight: 500,
                color: WHITE_DIM,
                letterSpacing: "0.3px",
                display: "flex",
                marginTop: "16px",
                maxWidth: "880px",
                textAlign: "center",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {metaLine}
            </div>

            {/* Hook serif italic ámbar */}
            <div
              style={{
                fontSize: "23px",
                fontWeight: 500,
                fontStyle: "italic",
                color: AMBER,
                display: "flex",
                marginTop: "16px",
                maxWidth: "860px",
                textAlign: "center",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              {hook}
            </div>
          </div>
        </div>

        {/* ─── BOTTOM STRIP — TC + URL + 01 / 05 ─── */}
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
          {/* TC Brand badge mini */}
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
          <div style={{ display: "flex", fontSize: "32px", fontWeight: 800, color: AMBER, letterSpacing: "1px" }}>
            tripcazador.com
          </div>

          {/* @handle + plate number */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: "16px", fontWeight: 600, color: WHITE_DIM, letterSpacing: "1px" }}>
              @tripcazador  ·  desliza  →
            </div>
            <div style={{ display: "flex", fontSize: "13px", fontWeight: 700, color: AMBER, letterSpacing: "3px", marginTop: "4px", fontFamily: "ui-monospace, 'Courier New', monospace" }}>
              01  /  05
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
