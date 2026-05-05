import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getDeals } from "@/lib/api";
import { getDestImage, buildUnsplashUrl } from "@/lib/dest_images";

export const runtime = "edge";

/**
 * /api/og/social/post?dealId=X — fase SSS73 (May 2026)
 *
 * Diseño v3.1 — versión simplificada para Edge runtime / Satori.
 *
 * v3.0 inicial fallaba con body vacío (Satori no soporta SVG con
 * paths/transforms ni `inset: 0` ni `<img>` con position absolute).
 *
 * Estructura 1080×1080:
 *   - Top 55% (594px): foto destino full-bleed via background-image
 *     + overlay gradient navy bottom + chip eyebrow + city name BL
 *   - Bottom 45% (486px): panel navy editorial
 *     + "DESDE" eyebrow ámbar + precio 220px ámbar bold
 *     + ruta "Origen → Destino" + meta line (IDA+VUELTA fix vs SSS40)
 *     + hook ámbar italic
 *   - Bottom strip 76px: tripcazador.com ámbar bold center
 *
 * Bug fix vs SSS40: si deal tiene date_ret, mostrar "IDA + VUELTA" no "VUELO IDA".
 *
 * Consumido por: workflow instagram-publish.yml + share manual + og:image meta.
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
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dealId = sp.get("dealId");

  // Defaults — Basilea → Palma demo
  let route = { from: "Basilea", to: "Palma de Mallorca" };
  let destKey = "palma";
  let price = 69;
  let oldPrice = 173;
  let savingsPct = 60;
  let dateOut: string | null = "9 jun";
  let dateRet: string | null = "13 jun";
  let nights = 4;
  let durationStr = "2h 15m";
  let airline = "Condor";
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

  // Foto destino real via dest_images
  const dest = getDestImage(destKey);
  const photoUrl = buildUnsplashUrl(dest.photoId, 1200, 700);

  // Construir meta line
  const metaParts: string[] = [];
  if (airline) metaParts.push(airline.toUpperCase());
  if (dateOut && dateRet) {
    metaParts.push(`IDA ${dateOut} → VUELTA ${dateRet}`);
  } else if (dateOut) {
    metaParts.push(`IDA ${dateOut}`);
  }
  if (nights > 0) metaParts.push(`${nights} ${nights === 1 ? "noche" : "noches"}`);
  if (stops === 0 && durationStr) metaParts.push(`directo ${durationStr}`);
  else if (durationStr) metaParts.push(`${stops} ${stops === 1 ? "escala" : "escalas"} · ${durationStr}`);
  const metaLine = metaParts.join(" · ");

  // Hook frase
  let hook = "";
  if (durationStr && stops === 0) {
    hook = `¿Listo para que en ${durationStr} estés en ${route.to}?`;
  } else if (nights > 0) {
    hook = `${nights} ${nights === 1 ? "noche" : "noches"} en ${route.to}, ida y vuelta incluidos`;
  } else {
    hook = `Ruta directa hacia ${route.to}, sin sorpresas`;
  }

  const NAVY = "#0a1530";
  const AMBER = "#fbbf24";
  const WHITE_DIM = "#e5e7eb";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1080px",
          display: "flex",
          flexDirection: "column",
          background: NAVY,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* ─── TOP 55% — FOTO DESTINO ─── */}
        <div
          style={{
            width: "1080px",
            height: "594px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundImage: `linear-gradient(180deg, rgba(10,21,48,0.15) 0%, rgba(10,21,48,0.0) 30%, rgba(10,21,48,0.55) 80%, rgba(10,21,48,0.95) 100%), url(${photoUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: "32px 44px 36px 44px",
          }}
        >
          {/* Top row: brand badge + savings chip */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              width: "100%",
            }}
          >
            {/* Brand badge — text only (no SVG, Edge-safe) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "14px 22px",
                background: "rgba(10,21,48,0.85)",
                borderRadius: "16px",
                borderLeft: `4px solid ${AMBER}`,
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: "1px",
                  display: "flex",
                  lineHeight: 1,
                }}
              >
                TRIPCAZADOR
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: AMBER,
                  letterSpacing: "3px",
                  marginTop: "4px",
                  display: "flex",
                  lineHeight: 1,
                }}
              >
                · RADAR DE CHOLLOS ·
              </div>
            </div>

            {/* Savings chip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 22px",
                background: AMBER,
                borderRadius: "999px",
                fontSize: "20px",
                fontWeight: 900,
                color: NAVY,
                letterSpacing: "1px",
              }}
            >
              −{savingsPct}% CHOLLO
            </div>
          </div>

          {/* Bottom row: city name big */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              width: "100%",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: AMBER,
                letterSpacing: "5px",
                display: "flex",
              }}
            >
              CHOLLO DETECTADO
            </div>
            <div
              style={{
                fontSize: "92px",
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1,
                letterSpacing: "-3px",
                display: "flex",
              }}
            >
              {route.to}
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 500,
                color: WHITE_DIM,
                fontStyle: "italic",
                display: "flex",
                marginTop: "4px",
              }}
            >
              cazado por nuestro radar — desde {route.from}
            </div>
          </div>
        </div>

        {/* ─── BOTTOM 45% — PANEL NAVY EDITORIAL ─── */}
        <div
          style={{
            width: "1080px",
            height: "486px",
            background: NAVY,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "30px",
            borderTop: `4px solid ${AMBER}`,
          }}
        >
          {/* DESDE eyebrow */}
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: AMBER,
              letterSpacing: "5px",
              display: "flex",
            }}
          >
            DESDE
          </div>

          {/* Precio MEGA */}
          <div
            style={{
              fontSize: "210px",
              fontWeight: 900,
              color: AMBER,
              lineHeight: 0.95,
              letterSpacing: "-6px",
              display: "flex",
              marginTop: "4px",
            }}
          >
            {price}€
          </div>

          {/* Old price tachado */}
          {oldPrice > price && (
            <div
              style={{
                fontSize: "20px",
                color: "#9ca3af",
                textDecoration: "line-through",
                display: "flex",
                marginTop: "4px",
                marginBottom: "4px",
              }}
            >
              antes {oldPrice}€  ·  ahorras {oldPrice - price}€
            </div>
          )}

          {/* Ruta */}
          <div
            style={{
              fontSize: "40px",
              fontWeight: 700,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              marginTop: "10px",
            }}
          >
            <span style={{ display: "flex" }}>{route.from}</span>
            <span style={{ display: "flex", color: AMBER, fontSize: "34px", margin: "0 16px" }}>→</span>
            <span style={{ display: "flex" }}>{route.to}</span>
          </div>

          {/* Meta line */}
          <div
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: WHITE_DIM,
              letterSpacing: "0.5px",
              display: "flex",
              marginTop: "12px",
              maxWidth: "960px",
              textAlign: "center",
            }}
          >
            {metaLine}
          </div>

          {/* Hook ámbar italic */}
          <div
            style={{
              fontSize: "22px",
              fontWeight: 500,
              fontStyle: "italic",
              color: AMBER,
              display: "flex",
              marginTop: "16px",
              maxWidth: "960px",
              textAlign: "center",
            }}
          >
            {hook}
          </div>

          {/* Bottom URL strip — flex spacer pushes to bottom */}
          <div style={{ flex: 1, display: "flex" }} />
          <div
            style={{
              width: "1080px",
              height: "76px",
              background: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 40px",
              borderTop: `2px solid ${AMBER}`,
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: WHITE_DIM,
                letterSpacing: "2px",
                display: "flex",
              }}
            >
              EL CAZADOR DE CHOLLOS
            </div>
            <div
              style={{
                fontSize: "30px",
                fontWeight: 800,
                color: AMBER,
                letterSpacing: "1px",
                display: "flex",
              }}
            >
              tripcazador.com
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: WHITE_DIM,
                display: "flex",
              }}
            >
              @tripcazador
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
