import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getDeals } from "@/lib/api";
import { getDestImage, buildUnsplashUrl } from "@/lib/dest_images";

export const runtime = "edge";

/**
 * /api/og/social/post?dealId=X — fase SSS73 (May 2026)
 *
 * Diseño v3 oficial (radar A1 + foto destino real + price hero + Taganga inspired).
 * Sustituye al diseño SSS40 (gradient sunset + emoji genérico) que se publicó
 * por error en el primer post de IG.
 *
 * Estructura 1080×1080:
 *   - Top 55% (594px): foto destino real full-bleed (dest_images Unsplash)
 *     + overlay gradient navy bottom + logo radar A1 esquina TL
 *     + eyebrow "PLATE I · CHOLLO" TL + coord TR
 *     + city name overlay BL (gigante)
 *   - Bottom 45% (486px): panel navy editorial
 *     + "DESDE" eyebrow ámbar + precio 220px ámbar bold
 *     + ruta "Basilea → Palma de Mallorca" serif bold
 *     + meta line: aerolínea · IDA + VUELTA · noches · duración
 *     + hook frase ámbar italic
 *   - Bottom strip 80px: tripcazador.com ámbar bold center
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

  // Hook frase: si ida+vuelta y duración corta = "¿Listo para que en X estés en Y?"
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
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* ─── TOP 55% — FOTO DESTINO + OVERLAYS ─── */}
        <div
          style={{
            width: "1080px",
            height: "594px",
            position: "relative",
            display: "flex",
          }}
        >
          {/* Foto destino full-bleed */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={dest.alt}
            width={1080}
            height={594}
            style={{
              width: "1080px",
              height: "594px",
              objectFit: "cover",
              position: "absolute",
              inset: 0,
            }}
          />

          {/* Gradient overlay navy bottom para asegurar contraste con city name */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(10,21,48,0.15) 0%, rgba(10,21,48,0.0) 30%, rgba(10,21,48,0.0) 55%, rgba(10,21,48,0.85) 100%)",
              display: "flex",
            }}
          />

          {/* Logo radar A1 inline (esquina TL) */}
          <div
            style={{
              position: "absolute",
              top: "32px",
              left: "32px",
              width: "120px",
              height: "120px",
              borderRadius: "20px",
              background: NAVY,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            {/* SVG radar simplificado — 3 anillos + sweep + plane */}
            <svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Anillos punteados */}
              <circle cx="50" cy="44" r="36" fill="none" stroke={AMBER} strokeWidth="1.5" strokeDasharray="2 4" opacity="0.55" />
              <circle cx="50" cy="44" r="24" fill="none" stroke={AMBER} strokeWidth="1.2" strokeDasharray="1 4" opacity="0.5" />
              <circle cx="50" cy="44" r="12" fill="none" stroke={AMBER} strokeWidth="1" opacity="0.4" />
              {/* Sweep line */}
              <line x1="50" y1="44" x2="76" y2="22" stroke={AMBER} strokeWidth="2" strokeLinecap="round" />
              {/* Avión silueta simple ámbar rotado */}
              <g transform="translate(50,44) rotate(-30)">
                <path d="M -16,-2 L 18,-2 L 14,-5 L 0,-5 L -10,-12 L -14,-5 L -16,-2 Z" fill={AMBER} />
                <circle cx="-1" cy="-1" r="1.5" fill={NAVY} />
              </g>
              {/* Tag TRIP/CAZADOR mini */}
              <text x="50" y="92" textAnchor="middle" fontSize="9" fontWeight="800" fill={WHITE_DIM} letterSpacing="0.5">TRIP</text>
              <text x="50" y="100" textAnchor="middle" fontSize="6" fontWeight="700" fill={AMBER} letterSpacing="1">CAZADOR</text>
            </svg>
          </div>

          {/* Eyebrow top — chip pill */}
          <div
            style={{
              position: "absolute",
              top: "52px",
              left: "176px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 18px",
              background: "rgba(10,21,48,0.78)",
              borderRadius: "999px",
              fontSize: "16px",
              fontWeight: 700,
              color: AMBER,
              letterSpacing: "2.5px",
            }}
          >
            CHOLLO DETECTADO · −{savingsPct}%
          </div>

          {/* Coord top-right */}
          <div
            style={{
              position: "absolute",
              top: "52px",
              right: "32px",
              display: "flex",
              alignItems: "center",
              padding: "10px 18px",
              background: "rgba(10,21,48,0.78)",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: 600,
              color: WHITE_DIM,
              letterSpacing: "1.5px",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            {route.to.toUpperCase()}
          </div>

          {/* City name overlay big BL */}
          <div
            style={{
              position: "absolute",
              bottom: "44px",
              left: "44px",
              right: "44px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "84px",
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1,
                letterSpacing: "-2px",
                display: "flex",
                textShadow: "0 2px 12px rgba(0,0,0,0.4)",
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
              }}
            >
              Cazado por nuestro radar · cinco días en el mediterráneo
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
            paddingTop: "32px",
            paddingBottom: "0px",
            position: "relative",
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
              marginBottom: "4px",
            }}
          >
            DESDE
          </div>

          {/* Precio MEGA */}
          <div
            style={{
              fontSize: "220px",
              fontWeight: 900,
              color: AMBER,
              lineHeight: 0.95,
              letterSpacing: "-6px",
              display: "flex",
              fontFamily: "Inter, system-ui, sans-serif",
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
                marginTop: "-8px",
                marginBottom: "10px",
              }}
            >
              antes {oldPrice}€  ·  ahorras {oldPrice - price}€
            </div>
          )}

          {/* Ruta */}
          <div
            style={{
              fontSize: "44px",
              fontWeight: 700,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginTop: oldPrice > price ? "0" : "12px",
            }}
          >
            <span style={{ display: "flex" }}>{route.from}</span>
            <span style={{ display: "flex", color: AMBER, fontSize: "36px" }}>→</span>
            <span style={{ display: "flex" }}>{route.to}</span>
          </div>

          {/* Meta line */}
          <div
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: WHITE_DIM,
              letterSpacing: "0.8px",
              display: "flex",
              marginTop: "14px",
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
              marginTop: "20px",
              maxWidth: "960px",
              textAlign: "center",
            }}
          >
            {hook}
          </div>

          {/* Bottom strip URL */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
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
        "Cache-Control": "public, max-age=3600, immutable",
      },
    },
  );
}
