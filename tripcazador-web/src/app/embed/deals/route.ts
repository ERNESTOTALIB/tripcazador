/**
 * /embed/deals — SSS400 (21 may 2026)
 *
 * Route handler que devuelve HTML standalone (sin root layout) para que
 * partners B2B embedden en sus blogs vía iframe.
 *
 * Usage:
 *   <iframe src="https://tripcazador.com/embed/deals?ref=TC-AGY-XXXXXXXX"
 *           width="100%" height="380" frameborder="0"></iframe>
 *
 * Query params:
 *   - ref: TC-AGY-XXXX (atribución partner)
 *   - theme: dark | light | brand-amber | brand-purple
 *   - limit: 1-6 (default 3)
 *
 * Sin Tailwind (inline styles) — bundle minimal para no penalizar PageSpeed
 * del partner. Cache 5min via header.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDeals } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidRef(ref: string | null): ref is string {
  return !!ref && /^TC-AGY-[A-Z0-9]{4,8}$/.test(ref);
}

interface Theme {
  bg: string;
  panel: string;
  text: string;
  muted: string;
  accent: string;
}
const THEMES: Record<string, Theme> = {
  dark: {
    bg: "#030712",
    panel: "#111827",
    text: "#f9fafb",
    muted: "#9ca3af",
    accent: "#f59e0b",
  },
  light: {
    bg: "#ffffff",
    panel: "#f9fafb",
    text: "#111827",
    muted: "#6b7280",
    accent: "#f59e0b",
  },
  "brand-amber": {
    bg: "#fffbeb",
    panel: "#ffffff",
    text: "#111827",
    muted: "#6b7280",
    accent: "#f59e0b",
  },
  "brand-purple": {
    bg: "#3b0764",
    panel: "#581c87",
    text: "#fdf4ff",
    muted: "#e9d5ff",
    accent: "#c084fc",
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const ref = isValidRef(url.searchParams.get("ref")) ? url.searchParams.get("ref")! : null;
  const themeKey = url.searchParams.get("theme") || "dark";
  const theme = THEMES[themeKey] || THEMES.dark;
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 3, 1), 6);

  let deals: Awaited<ReturnType<typeof getDeals>>["deals"] = [];
  try {
    const resp = await getDeals({ limit });
    deals = resp.deals.slice(0, limit);
  } catch {
    /* graceful */
  }

  const refSuffix = ref
    ? `?ref=${ref}&utm_source=embed&utm_medium=partner_widget`
    : `?utm_source=embed&utm_medium=widget`;

  const dealsHtml = deals
    .map((d) => {
      const dealUrl = `https://tripcazador.com/deals/${d.id}${refSuffix}`;
      const savings = d.savings_pct ? Math.round(d.savings_pct) : null;
      const route = `${d.origin} → ${d.destination}${d.city_to ? ` · ${escapeHtml(d.city_to)}` : ""}`;
      const sub = `${escapeHtml(d.airline_name || d.airline || "")}${d.date_out ? ` · ${escapeHtml(d.date_out)}` : ""}`;
      return `<li style="background:${theme.panel};border:1px solid rgba(255,255,255,0.08);border-radius:8px;margin-bottom:8px;overflow:hidden">
        <a href="${dealUrl}" target="_blank" rel="noopener noreferrer sponsored" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px;text-decoration:none;color:${theme.text}">
          <div style="min-width:0;flex:1">
            <div style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(route)}</div>
            <div style="font-size:10px;color:${theme.muted};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sub}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:16px;font-weight:800">${Math.round(d.price_eur)}€</div>
            ${savings !== null && savings > 0 ? `<div style="font-size:10px;color:#34d399;font-weight:700">-${savings}%</div>` : ""}
          </div>
        </a>
      </li>`;
    })
    .join("");

  const emptyHtml = `<div style="background:${theme.panel};border-radius:8px;padding:12px;text-align:center"><p style="font-size:11px;color:${theme.muted};margin:0">Sin chollos disponibles ahora.</p></div>`;

  const html = `<!DOCTYPE html><html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>TripCazador · chollos en vivo</title>
</head>
<body style="background:${theme.bg};color:${theme.text};margin:0;padding:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;min-height:380px">
<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px">
  <h2 style="font-size:14px;font-weight:700;margin:0">🎯 Chollos en vivo</h2>
  <a href="https://tripcazador.com/${refSuffix}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:${theme.muted};text-decoration:none">Ver todos →</a>
</div>
${deals.length === 0 ? emptyHtml : `<ul style="list-style:none;padding:0;margin:0">${dealsHtml}</ul>`}
<p style="font-size:9px;color:${theme.muted};text-align:center;margin:12px 0 0">via <a href="https://tripcazador.com/${refSuffix}" target="_blank" rel="noopener noreferrer" style="color:${theme.accent};text-decoration:underline">tripcazador.com</a></p>
</body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Frame-Options": "ALLOWALL",
      "Content-Security-Policy": "frame-ancestors *",
    },
  });
}
