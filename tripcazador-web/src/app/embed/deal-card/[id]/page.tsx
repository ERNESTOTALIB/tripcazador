/**
 * /embed/deal-card/[id] — SSS446 (23 may 2026)
 *
 * Single-deal iframe widget para partners. Página standalone (sin
 * header/footer del site) optimizada para embed en blogs externos.
 *
 * Uso:
 *   <iframe
 *     src="https://tripcazador.com/embed/deal-card/{deal_id}"
 *     width="100%" height="240" frameborder="0"></iframe>
 *
 * Theme: ?theme=dark|light (default dark — match el resto del site).
 *
 * Robots: noindex (es un widget, no contenido SEO).
 */
import type { Metadata } from "next";
import { getDeal } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Deal card embed | TripCazador",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: { id: string };
  searchParams?: { theme?: "dark" | "light"; ref?: string };
}

function appendUtm(url: string, ref: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "tripcazador_embed");
    u.searchParams.set("utm_medium", "iframe");
    u.searchParams.set("utm_campaign", `partner_${ref || "anon"}`);
    return u.toString();
  } catch {
    return url;
  }
}

export default async function DealCardEmbed({ params, searchParams }: PageProps) {
  const id = String(params.id || "").trim();
  const theme = searchParams?.theme === "light" ? "light" : "dark";
  const ref = (searchParams?.ref || "").trim().slice(0, 32);

  const deal = id ? await getDeal(id) : null;

  if (!deal) {
    return (
      <html lang="es">
        <body
          style={{
            margin: 0,
            padding: "12px",
            fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
            background: theme === "light" ? "#fff" : "#0f172a",
            color: theme === "light" ? "#334155" : "#cbd5e1",
            fontSize: "13px",
          }}
        >
          Deal no disponible. <a href={SITE_URL} style={{ color: "#f59e0b" }}>tripcazador.com</a>
        </body>
      </html>
    );
  }

  const bookingUrl = appendUtm(deal.booking_url || "", ref);
  const priceRounded = Math.round(deal.price_eur || 0);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,sans-serif',
          background: theme === "light" ? "#ffffff" : "#0f172a",
          color: theme === "light" ? "#0f172a" : "#f8fafc",
        }}
      >
        <div
          style={{
            border: `1px solid ${theme === "light" ? "#e2e8f0" : "#334155"}`,
            borderRadius: "12px",
            padding: "16px",
            background: theme === "light" ? "#f8fafc" : "#1e293b",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxWidth: "560px",
            margin: "8px auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: theme === "light" ? "#0f172a" : "#f8fafc",
                }}
              >
                {deal.origin || "—"} → {deal.city_to || deal.destination || "—"}
                {deal.country_to ? ` (${deal.country_to})` : ""}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: theme === "light" ? "#64748b" : "#94a3b8",
                  marginTop: "2px",
                }}
              >
                {deal.airline_name || deal.airline || "—"}
                {deal.date_out ? ` · ${deal.date_out}` : ""}
                {deal.date_ret ? ` → ${deal.date_ret}` : ""}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: theme === "light" ? "#0f172a" : "#f8fafc",
                  lineHeight: 1.1,
                }}
              >
                {priceRounded}€
              </div>
              {typeof deal.savings_pct === "number" && deal.savings_pct > 0 && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#f59e0b",
                    fontWeight: 600,
                  }}
                >
                  -{Math.round(deal.savings_pct)}%
                </div>
              )}
            </div>
          </div>
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="sponsored noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#f59e0b",
                color: "#0f172a",
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center",
                fontSize: "13px",
              }}
            >
              Ver oferta →
            </a>
          )}
          <div
            style={{
              fontSize: "10px",
              color: theme === "light" ? "#94a3b8" : "#64748b",
              textAlign: "right",
            }}
          >
            Detectado por{" "}
            <a
              href={`${SITE_URL}/deals/${encodeURIComponent(deal.id)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#f59e0b", textDecoration: "none" }}
            >
              TripCazador
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
