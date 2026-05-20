/**
 * lifecycle_emails.ts — SSS340 (20 may 2026)
 *
 * Plantillas para emails lifecycle Premium:
 *  - milestone:   "Has ahorrado X€" — disparado en cron diario cuando el
 *                 usuario cruza umbrales (100€, 250€, 500€, 1000€)
 *  - anniversary: "1 año contigo · 50% off renovación anual"
 *  - annualUpsell: "Pasa a anual y ahorra €20 (-17%)"
 *  - onboardingPremium: D+1 D+3 D+7 D+14 para suscriptores nuevos
 *
 * Las llamadas a sendEmail se hacen desde crons. Estos helpers solo generan
 * el HTML+texto+subject. No mantienen state.
 */

const SITE_URL = "https://tripcazador.com";

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

// ---------- helpers ----------

function emailShell(opts: {
  preheader?: string;
  badge: string;
  headline: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${opts.preheader ? `<style>.preheader{display:none!important;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden}</style>` : ""}</head>
<body style="margin:0;padding:0;background:#030712;color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
${opts.preheader ? `<div class="preheader">${opts.preheader}</div>` : ""}
<table role="presentation" width="100%" style="background:#030712"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#111827;border-radius:12px;overflow:hidden">
  <tr><td style="padding:24px 28px;background:#1f2937">
    <div style="font-size:14px;color:#fbbf24;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">${opts.badge}</div>
    <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;color:#f9fafb">${opts.headline}</h1>
  </td></tr>
  <tr><td style="padding:24px 28px;font-size:15px;line-height:1.6;color:#e5e7eb">${opts.bodyHtml}
    <div style="margin-top:28px"><a href="${opts.ctaUrl}" style="display:inline-block;background:#f59e0b;color:#030712;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:15px">${opts.ctaLabel} →</a></div>
  </td></tr>
  <tr><td style="padding:18px 28px;background:#0b1220;border-top:1px solid #1f2937;font-size:12px;color:#6b7280;line-height:1.5">
    ${opts.footerNote || `TripCazador · <a href="${SITE_URL}" style="color:#9ca3af;text-decoration:underline">tripcazador.com</a>`}
    <br><a href="{{unsubscribe_url}}" style="color:#9ca3af;text-decoration:underline">Gestionar email</a>
    · <a href="${SITE_URL}/legal" style="color:#9ca3af;text-decoration:underline">Privacidad</a>
  </td></tr>
</table></td></tr></table></body></html>`;
}

// ---------- milestone ----------

export type MilestoneTier = 100 | 250 | 500 | 1000;

export function milestoneEmail(opts: {
  email: string;
  savingsEur: number;
  tier: MilestoneTier;
}): EmailContent {
  const tierLabel: Record<MilestoneTier, string> = {
    100: "Primer centenar",
    250: "250€ y subiendo",
    500: "Medio milestone",
    1000: "Milestone 1000€",
  };
  const subject = `🎉 Has ahorrado ${opts.savingsEur}€ con TripCazador`;
  const html = emailShell({
    preheader: `${tierLabel[opts.tier]} alcanzado · ${opts.savingsEur}€ ahorrados`,
    badge: `Milestone · ${opts.tier}€`,
    headline: `Has ahorrado ${opts.savingsEur}€ 🎯`,
    bodyHtml: `<p>Buenas noticias:</p>
<p>Tus alertas Premium acaban de cruzar el umbral de <strong style="color:#fbbf24">${opts.tier}€ ahorrados</strong> desde que te suscribiste.</p>
<p>Esto significa que tu suscripción <strong>se ha pagado sola ${Math.floor(opts.savingsEur / 9.99)}× </strong> hasta ahora.</p>
<p style="color:#9ca3af;font-size:13px">Detalle del cálculo: comparamos cada deal cazado vs. el precio histórico medio de esa ruta. Solo contamos viajes confirmados o intent (clicks a booking_url) ≥3.</p>`,
    ctaLabel: "Ver tu dashboard",
    ctaUrl: `${SITE_URL}/panel/premium`,
  });
  const text = `Has ahorrado ${opts.savingsEur}€ con TripCazador.\n\nMilestone ${opts.tier}€ alcanzado. Tu suscripción se ha pagado sola ${Math.floor(opts.savingsEur / 9.99)} veces.\n\nVer dashboard: ${SITE_URL}/panel/premium`;
  return { subject, html, text };
}

// ---------- anniversary ----------

export function anniversaryEmail(opts: {
  email: string;
  yearsActive: number;
  totalSaved?: number;
}): EmailContent {
  const subject =
    opts.yearsActive === 1
      ? "🎂 1 año contigo · 50% off tu renovación anual"
      : `🎂 ${opts.yearsActive} años cazando juntos · regalo dentro`;
  const savedNote = opts.totalSaved
    ? `<p>En total has cazado <strong style="color:#fbbf24">${opts.totalSaved}€</strong> en chollos. Gracias por confiar en nosotros.</p>`
    : "";
  const html = emailShell({
    preheader: `${opts.yearsActive} ${opts.yearsActive === 1 ? "año" : "años"} con TripCazador · regalo dentro`,
    badge: `Aniversario · ${opts.yearsActive} ${opts.yearsActive === 1 ? "año" : "años"}`,
    headline: `${opts.yearsActive} ${opts.yearsActive === 1 ? "año" : "años"} cazando juntos 🎂`,
    bodyHtml: `<p>Hola,</p>
<p>Hoy hace ${opts.yearsActive} ${opts.yearsActive === 1 ? "año" : "años"} que te suscribiste a TripCazador. Gracias por estar aquí desde el principio.</p>
${savedNote}
<p>Como regalo, tienes <strong style="color:#fbbf24">50% de descuento</strong> en tu primera renovación anual: <strong>49,50€ en vez de 99€</strong> (ahorras €49,50).</p>
<p style="color:#9ca3af;font-size:13px">Código: <code style="background:#1f2937;padding:4px 8px;border-radius:4px;color:#fbbf24">ANIV${opts.yearsActive}</code> · válido 7 días</p>`,
    ctaLabel: "Activar 50% off anual",
    ctaUrl: `${SITE_URL}/premium?cycle=annual&promo=ANIV${opts.yearsActive}`,
  });
  const text = `${opts.yearsActive} ${opts.yearsActive === 1 ? "año" : "años"} con TripCazador.\n\n50% off renovación anual: €49,50 vs €99. Código ANIV${opts.yearsActive}.\n\nActivar: ${SITE_URL}/premium?cycle=annual&promo=ANIV${opts.yearsActive}`;
  return { subject, html, text };
}

// ---------- annual upsell ----------

/**
 * Disparado cuando suscriptor mensual cumple 6 meses → propone anual con
 * 2 meses gratis efectivos (€99/año = €8.25/mes vs €9.99 = -17%).
 */
export function annualUpsellEmail(opts: { email: string; monthsActive: number }): EmailContent {
  const subject = "💡 Pasa a anual y ahorra 20€ (sin compromiso)";
  const html = emailShell({
    preheader: `${opts.monthsActive} meses contigo · plan anual ahorra 20€`,
    badge: `Plan anual · -17%`,
    headline: `¿Cambias a anual y ahorras 20€? 💡`,
    bodyHtml: `<p>Llevas ${opts.monthsActive} meses con Premium. Hagamos las cuentas:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
  <tr><td style="padding:8px 0;border-bottom:1px solid #1f2937">Plan mensual (12 meses)</td><td style="text-align:right;color:#9ca3af">€119,88</td></tr>
  <tr><td style="padding:8px 0;border-bottom:1px solid #1f2937"><strong style="color:#fbbf24">Plan anual</strong></td><td style="text-align:right"><strong style="color:#fbbf24">€99</strong></td></tr>
  <tr><td style="padding:8px 0">Ahorras</td><td style="text-align:right;color:#34d399">€20,88 (-17%)</td></tr>
</table>
<p>Sin cambios en lo que recibes. Mismas alertas, misma prioridad, mismo todo. Solo pagas un 17% menos.</p>
<p style="color:#9ca3af;font-size:13px">Si pagaste hoy una mensualidad, te prorrateamos. Sin penalty.</p>`,
    ctaLabel: "Cambiar a anual",
    ctaUrl: `${SITE_URL}/premium?cycle=annual&from=monthly`,
  });
  const text = `Pasa a Premium anual y ahorra €20.\n\n€99/año vs €119,88 con mensual.\n\nCambiar: ${SITE_URL}/premium?cycle=annual&from=monthly`;
  return { subject, html, text };
}

// ---------- onboarding Premium 4-step drip ----------

export function onboardingPremiumD1(opts: { email: string }): EmailContent {
  const subject = "Tu primera caza Premium: 3 cosas en 5 minutos";
  const html = emailShell({
    preheader: "Activa alertas, configura origen, prueba filtros pro",
    badge: "Premium · día 1",
    headline: "Empezamos con 3 pasos rápidos",
    bodyHtml: `<p>Bienvenido a Premium. En 5 minutos tienes tu primera caza configurada:</p>
<ol style="padding-left:20px;color:#d1d5db">
<li style="margin:8px 0"><strong>Crea tu primera alerta</strong> — Madrid o Barcelona origen, deja destino &quot;cualquiera&quot; para no perder ningún chollo.</li>
<li style="margin:8px 0"><strong>Configura filtros pro</strong> — máximo de horas vuelo, escalas, día de la semana. Solo Premium.</li>
<li style="margin:8px 0"><strong>Activa Telegram</strong> — alertas en &lt;60s vs. 1h en email. Las plazas vuelan.</li>
</ol>`,
    ctaLabel: "Crear primera alerta",
    ctaUrl: `${SITE_URL}/panel/premium/alertas`,
  });
  const text = `Bienvenido a Premium.\n\n1. Crea alerta\n2. Filtros pro\n3. Activa Telegram\n\nEmpezar: ${SITE_URL}/panel/premium/alertas`;
  return { subject, html, text };
}

export function onboardingPremiumD3(opts: { email: string }): EmailContent {
  const subject = "Truco Premium: el filtro que más usa Ernesto";
  const html = emailShell({
    preheader: "Filtro nights:5-8 captura 80% de los chollos largo recorrido",
    badge: "Premium · día 3",
    headline: "El filtro pro que cambia todo",
    bodyHtml: `<p>Truco interno:</p>
<p>Para long-haul (Asia, América), el filtro <strong>nights: 5-8</strong> captura el 80% de los error fares interesantes. Por qué:</p>
<ul style="padding-left:20px;color:#d1d5db">
<li style="margin:6px 0">Vuelos &lt;5 noches → suelen ser business class enmascarados como error</li>
<li style="margin:6px 0">Vuelos 5-8 noches → sweet spot de error fares aerolíneas asiáticas/sudamericanas</li>
<li style="margin:6px 0">Vuelos &gt;14 noches → restrict sale, raros de cazar</li>
</ul>
<p>Aplica el filtro y verás 3-5× menos ruido en tus alertas.</p>`,
    ctaLabel: "Configurar filtro 5-8 noches",
    ctaUrl: `${SITE_URL}/panel/premium/alertas`,
  });
  const text = `Truco Premium: filtra nights:5-8 para long-haul.\n\nConfigurar: ${SITE_URL}/panel/premium/alertas`;
  return { subject, html, text };
}

export function onboardingPremiumD7(opts: { email: string }): EmailContent {
  const subject = "Ya llevas 1 semana · 3 secret deals esperándote";
  const html = emailShell({
    preheader: "Secret deals Premium-only · 24h ventana exclusiva",
    badge: "Premium · día 7",
    headline: "Tu primera semana — 3 secret deals dentro",
    bodyHtml: `<p>Has cumplido una semana con Premium. Como suscriptor, tienes acceso a la sección <strong>Secret Deals</strong>: chollos que NO publicamos en la web — los reciben solo Premium 24h antes.</p>
<p>Hay 3 esperándote ahora mismo. Stock limitado.</p>`,
    ctaLabel: "Ver Secret Deals",
    ctaUrl: `${SITE_URL}/panel/premium/secret`,
  });
  const text = `1 semana Premium completada.\n\n3 Secret Deals esperándote: ${SITE_URL}/panel/premium/secret`;
  return { subject, html, text };
}

export function onboardingPremiumD14(opts: { email: string }): EmailContent {
  const subject = "¿Te ha gustado? Regala 1 mes a un amigo (gratis para ti)";
  const html = emailShell({
    preheader: "Referidos · 1 mes gratis cuando un amigo se suscribe",
    badge: "Premium · día 14",
    headline: "Comparte y gana 1 mes gratis",
    bodyHtml: `<p>Llevas 2 semanas Premium. Si te ha gustado, tienes una opción simple para hacer la suscripción más rentable:</p>
<p>Tu <strong>código de referido</strong> está esperando en el dashboard. Cuando un amigo lo usa al suscribirse:</p>
<ul style="padding-left:20px;color:#d1d5db">
<li style="margin:6px 0">Él se ahorra <strong>50% el primer mes</strong> (€4,99 vs €9,99)</li>
<li style="margin:6px 0">Tú ganas <strong>1 mes gratis</strong> automáticamente en tu próxima factura</li>
</ul>
<p>Sin límite de referidos. Cada uno = 1 mes gratis acumulable.</p>`,
    ctaLabel: "Ver mi código referido",
    ctaUrl: `${SITE_URL}/panel/premium`,
  });
  const text = `2 semanas Premium. Regala 1 mes a un amigo y gana 1 mes gratis.\n\nCódigo: ${SITE_URL}/panel/premium`;
  return { subject, html, text };
}

// ---------- registry / lookup ----------

export const ONBOARDING_DRIP = [
  { day: 1, fn: onboardingPremiumD1 },
  { day: 3, fn: onboardingPremiumD3 },
  { day: 7, fn: onboardingPremiumD7 },
  { day: 14, fn: onboardingPremiumD14 },
] as const;

export const MILESTONE_TIERS: MilestoneTier[] = [100, 250, 500, 1000];
