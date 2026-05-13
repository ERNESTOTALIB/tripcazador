/**
 * newsletter_weekly_helpers.ts — fase SSS155 (may-2026)
 *
 * Helpers extraídos de /api/email/newsletter-weekly/route.ts porque
 * Next.js 14 NO permite exports custom desde route.ts (solo HTTP methods
 * + config como `runtime`, `dynamic`, `revalidate`). El build fallaba:
 *   Type error: "pickTopFiveDeals" is not a valid Route export field.
 */

import type { Deal } from "@/lib/api";

// Set de IATAs españoles que se consideran "Spain-origin" (priorizados)
export const ES_ORIGINS = new Set([
  "MAD", "BCN", "VLC", "AGP", "BIO", "SVQ", "ALC", "PMI",
  "TFN", "TFS", "LPA", "OVD", "SDR", "SCQ", "VGO", "LCG",
  "IBZ", "MAH", "GRX", "MJV", "REU", "ZAZ", "VLL", "EAS",
  "PNA", "FUE", "ACE",
]);

export const RATE_WINDOW_MS = 6 * 3_600_000; // 6h

export function isCriticalOrError(d: Deal): boolean {
  const c = (d.classification || "").toUpperCase();
  return c === "CRÍTICO" || c === "CRITICO" || c === "ERROR";
}

export function isSpanishOrigin(d: Deal): boolean {
  return ES_ORIGINS.has(((d.origin as string) || "").toUpperCase());
}

export function pickTopFiveDeals(deals: Deal[]): Deal[] {
  // Filtra solo CRÍTICO/ERROR, ordena: Spain-first → score DESC → savings_pct DESC.
  const filtered = deals.filter(isCriticalOrError);
  filtered.sort((a, b) => {
    const sa = isSpanishOrigin(a) ? 1 : 0;
    const sb = isSpanishOrigin(b) ? 1 : 0;
    if (sb !== sa) return sb - sa;
    const scoreDiff = (b.score || 0) - (a.score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (b.savings_pct || 0) - (a.savings_pct || 0);
  });
  return filtered.slice(0, 5);
}

export function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((d.getTime() - Date.now()) / 86_400_000));
}

// Rate-limit state in-memory (1 invocación cada 6h por proceso)
const state: { lastTs: number } = (
  globalThis as unknown as { __nl_weekly_state?: { lastTs: number } }
).__nl_weekly_state ?? { lastTs: 0 };
(globalThis as unknown as { __nl_weekly_state: typeof state }).__nl_weekly_state = state;

export function getLastNewsletterTs(): number {
  return state.lastTs;
}

export function setLastNewsletterTs(ts: number): void {
  state.lastTs = ts;
}

export function resetNewsletterRateLimit(): void {
  state.lastTs = 0;
}

export function renderNewsletterHtml(
  deals: Deal[],
  unsubUrl: string,
  siteUrl: string,
): string {
  const cards = deals
    .map((d) => {
      const url = `${siteUrl}/deals/${d.id}?utm_source=newsletter&utm_medium=email&utm_campaign=weekly`;
      const days = daysUntil(d.date_out);
      // Savings: negative number indica descuento (ej -62%). Si savings_pct
      // viene positive, lo formateamos como -N% (el deal sale más barato).
      let savingsLine = "";
      const sp = d.savings_pct;
      if (typeof sp === "number" && sp > 0) {
        savingsLine = `<div style="font-size:13px;color:#dc2626;margin-bottom:8px;font-weight:600;">-${Math.round(sp)}% vs precio típico</div>`;
      }
      return `
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:12px 0;">
  <div style="font-size:13px;color:#94a3b8;margin-bottom:4px;">${escapeHtml(d.classification || "OFERTA")}${days != null ? ` · en ${days}d` : ""}</div>
  <div style="font-size:18px;font-weight:600;color:#0f172a;margin-bottom:4px;">
    ${escapeHtml(d.city_from || d.origin)} → ${escapeHtml(d.city_to || d.destination)}
  </div>
  <div style="font-size:32px;font-weight:700;color:#f59e0b;margin:8px 0;">€${escapeHtml(String(d.price_eur || "?"))}</div>
  ${savingsLine}
  <div style="font-size:14px;color:#475569;margin-bottom:12px;">
    ${escapeHtml(d.airline_name || d.airline || "")} · ${escapeHtml(d.cabin || "economy")}
  </div>
  <a href="${url}" style="display:inline-block;background:#f59e0b;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;">Ver detalle →</a>
</div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#fff;border-radius:12px;padding:32px;">
<tr><td>
  <h1 style="margin:0 0 8px;color:#0f172a;font-size:28px;">📬 Tu radar semanal</h1>
  <p style="margin:0 0 24px;color:#475569;font-size:15px;">Los 5 chollos que más han bajado esta semana, priorizando orígenes desde España.</p>
  ${cards}
  <div style="text-align:center;margin-top:24px;">
    <a href="${siteUrl}/deals?utm_source=newsletter&utm_medium=email&utm_campaign=weekly" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Ver todos los chollos</a>
  </div>
  <hr style="border:0;border-top:1px solid #e2e8f0;margin:32px 0;">
  <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
    ¿Ya no quieres recibir esto? <a href="${unsubUrl}" style="color:#64748b;">Date de baja</a>.
  </p>
</td></tr></table></td></tr></table></body></html>`;
}
