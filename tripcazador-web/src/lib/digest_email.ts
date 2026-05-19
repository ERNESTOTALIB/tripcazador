/**
 * digest_email.ts — SSS316 (19 may 2026)
 *
 * Helper para construir el HTML del email digest Premium semanal.
 * Pure function — fuera de route.ts (SSS312). Diseño minimalista
 * compatible con la mayoría de inbox renderers (Gmail/Outlook/Apple
 * Mail).
 *
 * No tracking pixels — usamos UTM en los links para Plausible cuando
 * el user llegue al sitio.
 */

import type { PersonalizedDeal } from "./premium_digest_scorer";

export interface BuildDigestEmailInput {
  topDeals: PersonalizedDeal[];
  reasoning: string;
  digestWeek: string; // YYYY-MM-DD
  siteUrl: string;
}

const SAFE_TAG_RE = /[<>&"]/g;
const SAFE_TAG_MAP: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
};

export function escapeHtml(s: string): string {
  return String(s).replace(SAFE_TAG_RE, (c) => SAFE_TAG_MAP[c] || c);
}

export function buildDigestEmailHtml(input: BuildDigestEmailInput): string {
  const { topDeals, reasoning, digestWeek, siteUrl } = input;
  const utm = "?utm_source=email_digest&utm_medium=email&utm_campaign=weekly_premium";

  const dealRows = topDeals
    .map((d, idx) => {
      const headline = escapeHtml(
        d.headline || `${d.origin || ""} → ${d.destination || ""}`,
      );
      const route = `${escapeHtml(d.origin || "")} → ${escapeHtml(d.destination || "")}`;
      const airline = escapeHtml(d.airline_name || "");
      const price = d.price_eur ? `${Math.round(d.price_eur)}€` : "—";
      const dateOut = d.date_out ? escapeHtml(d.date_out) : "";
      const dateRet = d.date_ret ? escapeHtml(d.date_ret) : "";
      const savings =
        typeof d.savings_pct === "number" && d.savings_pct > 0
          ? `-${Math.round(d.savings_pct)}%`
          : "";
      const dealLink = d.id ? `${siteUrl}/deals/${encodeURIComponent(d.id)}${utm}` : siteUrl;
      const reasons = d.why_matched
        .map((r) => `<li style="margin:0 0 4px 0;">${escapeHtml(r)}</li>`)
        .join("");
      return `
        <tr>
          <td style="padding:14px 0; border-bottom:1px solid #ececec;">
            <div style="font-size:14px; font-weight:600; color:#111;">
              #${idx + 1} · ${route}${airline ? ` <span style="color:#888;font-weight:400">· ${airline}</span>` : ""}
            </div>
            <div style="font-size:13px; color:#555; margin-top:4px;">${headline}</div>
            <div style="margin-top:8px; font-size:13px; color:#222;">
              <strong style="color:#b45309">${price}</strong>
              ${dateOut ? `&nbsp;·&nbsp;<span style="color:#555">${dateOut}${dateRet ? ` → ${dateRet}` : ""}</span>` : ""}
              ${savings ? `&nbsp;·&nbsp;<span style="color:#059669; font-weight:600">${savings}</span>` : ""}
            </div>
            ${
              reasons
                ? `<ul style="margin:8px 0 0 18px; padding:0; font-size:12px; color:#666;">${reasons}</ul>`
                : ""
            }
            <div style="margin-top:10px;">
              <a href="${dealLink}" style="display:inline-block; background:#f59e0b; color:#000; padding:8px 14px; border-radius:8px; text-decoration:none; font-size:13px; font-weight:600;">
                Ver el deal
              </a>
            </div>
          </td>
        </tr>`;
    })
    .join("");

  const dealsCount = topDeals.length;
  const safeReasoning = escapeHtml(reasoning);
  const safeWeek = escapeHtml(digestWeek);

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tu digest Premium</title></head>
<body style="margin:0; padding:0; background:#fafafa; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#111;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; background:#fafafa; padding:20px 0;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; max-width:600px; background:#fff; border-radius:14px; padding:24px;">
        <tr><td>
          <div style="font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#b45309; font-weight:700;">TripCazador · Premium</div>
          <h1 style="margin:6px 0 4px 0; font-size:22px; color:#111;">Tu digest semanal</h1>
          <div style="font-size:13px; color:#555;">Semana del ${safeWeek} · ${dealsCount} ${dealsCount === 1 ? "deal" : "deals"} top</div>
          <div style="font-size:12px; color:#777; margin-top:8px;">${safeReasoning}</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin-top:16px;">
            ${dealRows}
          </table>
          <div style="margin-top:20px; padding-top:16px; border-top:1px solid #ececec; font-size:12px; color:#888;">
            ¿Quieres ajustar los criterios? Edita tus
            <a href="${siteUrl}/panel/premium/alertas${utm}" style="color:#b45309;">alertas</a>
            o tus <a href="${siteUrl}/panel/premium/busquedas${utm}" style="color:#b45309;">búsquedas guardadas</a>.
            Para dejar de recibir este email cancela tu suscripción Premium desde
            <a href="${siteUrl}/panel/premium${utm}" style="color:#b45309;">tu panel</a>.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
