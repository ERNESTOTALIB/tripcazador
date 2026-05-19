/**
 * winback_email.ts — SSS322 (19 may 2026)
 *
 * HTML del email anti-churn que se envía a Premium con >14d sin login.
 * El email incluye:
 *  - Recordatorio personalizado de su ROI ("Llevas X€ ahorrados")
 *  - Top 3 deals de su ruta favorita (si la tiene)
 *  - CTA grande a /panel/premium
 *
 * Pure function — out of route.ts (lección SSS312).
 */

import { escapeHtml } from "./digest_email";

export interface WinbackTopDeal {
  id?: string;
  origin?: string;
  destination?: string;
  airline_name?: string;
  price_eur?: number;
  date_out?: string;
  savings_pct?: number;
}

export interface BuildWinbackEmailInput {
  daysAway: number; // cuántos días sin login
  totalSavingsEur: number; // de savings_log_store
  triggersCount: number; // cuántos triggers han disparado
  favoriteRoute?: { origin: string; destination: string }; // ruta más frecuente de sus alertas
  topDeals: WinbackTopDeal[];
  siteUrl: string;
}

export function buildWinbackEmailHtml(input: BuildWinbackEmailInput): string {
  const { daysAway, totalSavingsEur, triggersCount, favoriteRoute, topDeals, siteUrl } = input;
  const utm = "?utm_source=email_winback&utm_medium=email&utm_campaign=anti_churn_14d";

  const savingsBlock =
    totalSavingsEur > 0
      ? `
        <div style="margin-top:14px; padding:16px; background:#ecfdf5; border-radius:10px; border-left:4px solid #10b981;">
          <div style="font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:#065f46; font-weight:700;">Tu ROI Premium</div>
          <div style="font-size:24px; color:#065f46; font-weight:700; margin-top:4px;">${totalSavingsEur.toLocaleString("es-ES")}€ ahorrados</div>
          <div style="font-size:12px; color:#047857; margin-top:2px;">${triggersCount} ${triggersCount === 1 ? "alerta disparada" : "alertas disparadas"} desde tu activación</div>
        </div>`
      : `
        <div style="margin-top:14px; padding:16px; background:#fef3c7; border-radius:10px; border-left:4px solid #f59e0b;">
          <div style="font-size:13px; color:#92400e;">
            Tu Premium está activo pero aún no has recibido ninguna alerta disparada.
            <strong>Crea o ajusta tus alertas</strong> para que el sistema empiece a trabajar para ti.
          </div>
        </div>`;

  const favoriteBlock = favoriteRoute
    ? `<p style="font-size:13px; color:#555; margin:14px 0 0 0;">
        Hemos echado un vistazo a tu ruta favorita <strong>${escapeHtml(favoriteRoute.origin)} → ${escapeHtml(favoriteRoute.destination)}</strong> y te recomendamos estos chollos esta semana:
      </p>`
    : `<p style="font-size:13px; color:#555; margin:14px 0 0 0;">
        Estos son los mejores chollos de la semana en TripCazador:
      </p>`;

  const dealsRows = topDeals
    .slice(0, 3)
    .map((d, i) => {
      const route = `${escapeHtml(d.origin || "")} → ${escapeHtml(d.destination || "")}`;
      const price = d.price_eur ? `${Math.round(d.price_eur)}€` : "—";
      const airline = d.airline_name ? escapeHtml(d.airline_name) : "";
      const savings =
        typeof d.savings_pct === "number" && d.savings_pct > 0
          ? `&nbsp;·&nbsp;<span style="color:#059669; font-weight:600">-${Math.round(d.savings_pct)}%</span>`
          : "";
      const dateOut = d.date_out ? `<span style="color:#888">${escapeHtml(d.date_out)}</span>` : "";
      const dealLink = d.id ? `${siteUrl}/deals/${encodeURIComponent(d.id)}${utm}` : siteUrl;
      return `
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #ececec;">
            <a href="${dealLink}" style="color:#111; text-decoration:none;">
              <div style="font-size:14px; font-weight:600;">
                #${i + 1} · ${route}${airline ? ` <span style="color:#888;font-weight:400">· ${airline}</span>` : ""}
              </div>
              <div style="margin-top:4px; font-size:13px;">
                <strong style="color:#b45309">${price}</strong>${savings}${dateOut ? `&nbsp;·&nbsp;${dateOut}` : ""}
              </div>
            </a>
          </td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Te echamos de menos · TripCazador Premium</title></head>
<body style="margin:0; padding:0; background:#fafafa; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#111;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; background:#fafafa; padding:20px 0;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; max-width:600px; background:#fff; border-radius:14px; padding:24px;">
        <tr><td>
          <div style="font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#b45309; font-weight:700;">TripCazador · Premium</div>
          <h1 style="margin:6px 0 8px 0; font-size:24px; color:#111;">👋 Te echamos de menos</h1>
          <p style="font-size:14px; color:#444; margin:0;">
            Hace ${daysAway} días que no entras a tu panel Premium — queremos asegurarnos de que estás sacándole partido a tu suscripción.
          </p>
          ${savingsBlock}
          ${favoriteBlock}
          ${
            dealsRows
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin-top:8px;">${dealsRows}</table>`
              : `<p style="font-size:13px; color:#555;">Crea una alerta o búsqueda guardada y empezaremos a personalizarte recomendaciones.</p>`
          }
          <div style="margin-top:24px; text-align:center;">
            <a href="${siteUrl}/panel/premium${utm}" style="display:inline-block; background:#f59e0b; color:#000; padding:12px 24px; border-radius:10px; text-decoration:none; font-size:15px; font-weight:700;">
              Volver a mi panel Premium
            </a>
          </div>
          <div style="margin-top:24px; padding-top:16px; border-top:1px solid #ececec; font-size:12px; color:#888;">
            Si ya no quieres seguir Premium puedes cancelar desde
            <a href="${siteUrl}/panel/premium${utm}" style="color:#b45309;">tu panel</a> (mantienes el acceso hasta el final del periodo pagado). Si tienes feedback sobre por qué no usaste Premium estos días, contesta a este email — leemos todo.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
