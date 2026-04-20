/**
 * TripCazador — og:image dinámico por deal
 *
 * Usa la convención file-based de Next 14: `opengraph-image.tsx` en la
 * misma carpeta de la página registra automáticamente el PNG como
 * `og:image` (y `twitter:image` por herencia).
 *
 * Se genera en edge con `next/og` ImageResponse (viene con Next, sin deps).
 * Cachea 5 min vía ISR heredado de la página.
 *
 * El diseño: ciudad origen → destino, precio grande, savings_pct si procede,
 * colorway por classification (CRÍTICO rojo, ERROR ámbar, etc.) sobre fondo
 * slate con un sutil gradiente. Sin imágenes externas — cero latencia ni
 * fallos por Unsplash caído.
 */

import { ImageResponse } from "next/og";
import { getDeal, getCabinLabel } from "@/lib/api";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "TripCazador — oferta de vuelo";

function classificationColor(c?: string): { bg: string; text: string; label: string } {
  switch (c) {
    case "CRÍTICO":
      return { bg: "#dc2626", text: "#ffffff", label: "CRÍTICO" };
    case "ERROR":
      return { bg: "#ea580c", text: "#ffffff", label: "ERROR FARE" };
    case "ANOMALÍA":
      return { bg: "#eab308", text: "#0f172a", label: "ANOMALÍA" };
    case "OFERTA":
      return { bg: "#f59e0b", text: "#0f172a", label: "OFERTA" };
    default:
      return { bg: "#475569", text: "#ffffff", label: c || "DEAL" };
  }
}

export default async function OGImage({ params }: { params: { id: string } }) {
  const deal = await getDeal(params.id);

  // Fallback estable cuando el deal ha expirado / la API está caída.
  // Mejor que 404: Twitter/WhatsApp hacen crawl mucho después del share.
  if (!deal) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#fff",
            padding: "80px",
            justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 800, color: "#f59e0b" }}>
            TripCazador
          </div>
          <div style={{ fontSize: 36, marginTop: 24, color: "#cbd5e1" }}>
            Vuelos baratos desde Europa
          </div>
        </div>
      ),
      { ...size },
    );
  }

  const cls = classificationColor(deal.classification);
  const savings = deal.savings_pct > 0 ? Math.round(deal.savings_pct) : 0;
  const cabin = getCabinLabel(deal.cabin);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0b1220 100%)",
          color: "#fff",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Corner badge: clasificación */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 40,
            right: 40,
            background: cls.bg,
            color: cls.text,
            fontSize: 22,
            fontWeight: 800,
            padding: "10px 22px",
            borderRadius: 999,
            letterSpacing: 2,
          }}
        >
          {cls.label}
        </div>

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            fontWeight: 800,
            color: "#f59e0b",
            letterSpacing: -0.5,
          }}
        >
          ✈︎ TripCazador
        </div>

        {/* Route */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              color: "#e2e8f0",
              fontSize: 36,
              fontWeight: 500,
            }}
          >
            {deal.city_from}
            <span style={{ margin: "0 18px", color: "#64748b" }}>→</span>
            {deal.city_to}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#94a3b8",
              marginTop: 6,
            }}
          >
            {deal.country_to} · {cabin}
            {deal.stops === 0 ? " · Directo" : deal.stops === 1 ? " · 1 escala" : ` · ${deal.stops} escalas`}
          </div>
        </div>

        {/* Price hero */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginTop: 50,
          }}
        >
          <div style={{ fontSize: 28, color: "#94a3b8", marginRight: 14 }}>
            Desde
          </div>
          <div
            style={{
              fontSize: 140,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            {Math.round(deal.price_eur)}
            <span style={{ fontSize: 64, color: "#f59e0b", marginLeft: 8 }}>€</span>
          </div>
        </div>

        {/* Savings tag (solo si hay ahorro relevante) */}
        {savings > 0 && (
          <div
            style={{
              display: "flex",
              marginTop: 28,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                background: "rgba(16,185,129,0.14)",
                color: "#34d399",
                border: "2px solid rgba(16,185,129,0.5)",
                padding: "10px 24px",
                borderRadius: 12,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              −{savings}% vs precio habitual
            </div>
          </div>
        )}

        {/* Bottom strip: fecha + dominio */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
            paddingTop: 28,
            borderTop: "1px solid #1e293b",
            color: "#64748b",
            fontSize: 22,
          }}
        >
          <div style={{ display: "flex" }}>
            {deal.date_out}
            {deal.date_ret ? ` · vuelta ${deal.date_ret}` : ""}
          </div>
          <div style={{ display: "flex", color: "#cbd5e1" }}>
            tripcazador.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
