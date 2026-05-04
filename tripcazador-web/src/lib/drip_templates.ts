/**
 * drip_templates.ts — fase ss-SS2
 *
 * 5 emails de la secuencia welcome → educar → empujar a Telegram + ofertas.
 * Stage 0 → welcome (al subscribirse)
 * Stage 1 → 1 día: "el chollo perfecto en 4 pasos"
 * Stage 2 → 3 días: "los 5 errores caros que cometen los viajeros"
 * Stage 3 → 5 días: "cómo monitorizar precios sin volverte loco"
 * Stage 4 → 7 días: "únete a Telegram para chollos 24/7"
 *
 * Cada email tiene HTML + texto plano. Estilo coherente con notify-alert.tsx
 * (dark, amber, sans-serif, mobile-first 560px max).
 *
 * Personalización mínima: {{email}}, {{unsubscribe_url}}.
 */

export interface DripTemplate {
  stage: number;
  subject: string;
  html: string;
  text: string;
}

const SITE_URL = "https://tripcazador.com";
const TELEGRAM_URL = "https://t.me/TripCazador";

function wrap(stage: number, headline: string, body: string, ctaLabel: string, ctaUrl: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030712;color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" style="background:#030712"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#111827;border-radius:12px;overflow:hidden">
  <tr><td style="padding:24px 28px;background:#1f2937">
    <div style="font-size:14px;color:#fbbf24;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">TripCazador · email ${stage + 1}/5</div>
    <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#f9fafb">${headline}</h1>
  </td></tr>
  <tr><td style="padding:24px 28px;font-size:15px;line-height:1.6;color:#e5e7eb">${body}
    <div style="margin-top:28px"><a href="${ctaUrl}" style="display:inline-block;background:#f59e0b;color:#030712;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:15px">${ctaLabel} →</a></div>
  </td></tr>
  <tr><td style="padding:18px 28px;background:#0b1220;border-top:1px solid #1f2937;font-size:12px;color:#6b7280;line-height:1.5">
    Recibes esto porque te suscribiste en <a href="${SITE_URL}" style="color:#9ca3af;text-decoration:underline">tripcazador.com</a>.
    <br><a href="{{unsubscribe_url}}" style="color:#9ca3af;text-decoration:underline">Cancelar suscripción</a>
    · <a href="${SITE_URL}/legal" style="color:#9ca3af;text-decoration:underline">Privacidad</a>
  </td></tr>
</table></td></tr></table></body></html>`;
}

export const DRIP_TEMPLATES: DripTemplate[] = [
  {
    stage: 0,
    subject: "Bienvenido a TripCazador · 3 cosas para empezar",
    html: wrap(
      0,
      "Bienvenido. Esto es lo que sigue.",
      `<p>Hola,</p>
<p>Te has suscrito a TripCazador — chollos de vuelo verificados, error fares y comparativas honestas. Sin spam, sin trucos.</p>
<p><strong>Lo que recibirás:</strong></p>
<ul style="margin:0 0 18px;padding-left:20px;color:#d1d5db">
<li style="margin:6px 0">2-3 emails con los mejores chollos cazados esta semana</li>
<li style="margin:6px 0">Acceso a herramientas: calculadora de millas, valor del vuelo, estimador de upgrade</li>
<li style="margin:6px 0">Una guía gratuita para empezar bien</li>
</ul>
<p>Mientras tanto, mira los chollos publicados ahora:</p>`,
      "Ver chollos disponibles",
      `${SITE_URL}/deals`,
    ),
    text: `Bienvenido a TripCazador.

Te has suscrito a chollos de vuelo verificados. Recibirás 2-3 emails semanales con error fares, comparativas y herramientas.

Empieza viendo los chollos disponibles:
${SITE_URL}/deals

— Equipo TripCazador

Cancelar: {{unsubscribe_url}}`,
  },
  {
    stage: 1,
    subject: "El chollo perfecto en 4 pasos (sin gurus)",
    html: wrap(
      1,
      "Cómo cazar tu primer chollo",
      `<p>Cazar un buen vuelo no es suerte. Es metodología.</p>
<ol style="margin:0 0 18px;padding-left:20px;color:#d1d5db">
<li style="margin:8px 0"><strong>Define rango, no fechas.</strong> Un día concreto puede costar el doble. Una ventana de 5 días te da margen.</li>
<li style="margin:8px 0"><strong>Compara aeropuertos cercanos.</strong> Madrid-Barajas vs Madrid-Barcelona-Bilbao. La diferencia puede ser 200€.</li>
<li style="margin:8px 0"><strong>Mide el ahorro real.</strong> Un vuelo "30% más barato" puede no serlo si añades equipaje + asiento.</li>
<li style="margin:8px 0"><strong>Reserva en la web de la aerolínea</strong> cuando sea posible. Más derechos en caso de cambios.</li>
</ol>
<p>Tenemos una calculadora gratis que te dice si un precio es bueno:</p>`,
      "Probar la calculadora",
      `${SITE_URL}/calculadora`,
    ),
    text: `4 pasos para cazar un buen vuelo:

1. Define rango de fechas, no días concretos
2. Compara aeropuertos cercanos
3. Mide el coste TOTAL (con equipaje y asiento)
4. Reserva directo en la aerolínea cuando sea posible

Calculadora gratuita: ${SITE_URL}/calculadora

— TripCazador

Cancelar: {{unsubscribe_url}}`,
  },
  {
    stage: 2,
    subject: "Los 5 errores caros que cometen los viajeros",
    html: wrap(
      2,
      "Los 5 errores que te cuestan dinero",
      `<p>De todos los emails que respondemos, estos 5 errores aparecen una y otra vez:</p>
<ol style="margin:0 0 18px;padding-left:20px;color:#d1d5db">
<li style="margin:8px 0"><strong>Reservar el viernes para volar el lunes.</strong> Última semana = precio máximo.</li>
<li style="margin:8px 0"><strong>Buscar siempre desde el mismo dispositivo.</strong> Las cookies pueden subir el precio en algunas webs.</li>
<li style="margin:8px 0"><strong>Ignorar las escalas de 5h.</strong> Stopovers gratis en Estambul, Doha, Singapur — explora la ciudad y ahorras.</li>
<li style="margin:8px 0"><strong>Comprar el seguro en el checkout.</strong> Los seguros anuales independientes son 4-7x más baratos.</li>
<li style="margin:8px 0"><strong>No mirar el equipaje desde el inicio.</strong> Lo que parecía 49€ acaba en 149€ con maleta.</li>
</ol>
<p>Tenemos una guía completa con los <strong>20 errores caros</strong> que cometen los viajeros:</p>`,
      "Leer la guía completa",
      `${SITE_URL}/blog/20-errores-caros-comprando-vuelos`,
    ),
    text: `5 errores caros que cometen los viajeros:

1. Reservar última semana
2. Buscar siempre desde el mismo dispositivo
3. Ignorar stopovers gratis (Estambul, Doha, Singapur)
4. Comprar seguro en checkout en vez de anual independiente
5. No mirar equipaje desde el inicio

Guía completa: ${SITE_URL}/blog/20-errores-caros-comprando-vuelos

— TripCazador

Cancelar: {{unsubscribe_url}}`,
  },
  {
    stage: 3,
    subject: "Cómo monitorizar precios sin volverte loco",
    html: wrap(
      3,
      "Monitoriza sin perder la cabeza",
      `<p>Todo el mundo sabe que los precios cambian. El error es revisar manualmente todos los días.</p>
<p>Lo que hacemos en TripCazador:</p>
<ol style="margin:0 0 18px;padding-left:20px;color:#d1d5db">
<li style="margin:8px 0"><strong>Crea alertas con tope de precio.</strong> Te avisamos sólo cuando baja del umbral. Sin ruido.</li>
<li style="margin:8px 0"><strong>Usa el mapa de precios.</strong> Ves de un vistazo qué destinos son baratos cuando.</li>
<li style="margin:8px 0"><strong>Revisa el calendario flexible.</strong> Mover la salida 3 días puede ahorrar 150€.</li>
</ol>
<p>Crea tu primera alerta de precio (es gratis y no requiere cuenta):</p>`,
      "Crear alerta de precio",
      `${SITE_URL}/deals`,
    ),
    text: `Cómo monitorizar precios sin volverte loco:

1. Crea alertas con tope de precio (te avisamos cuando baja)
2. Usa el mapa de precios: ${SITE_URL}/mapa-precios
3. Revisa calendario flexible — mover 3 días ahorra €150 fácil

Crea tu alerta gratis: ${SITE_URL}/deals

— TripCazador

Cancelar: {{unsubscribe_url}}`,
  },
  {
    stage: 4,
    subject: "Únete a Telegram para chollos 24/7",
    html: wrap(
      4,
      "Telegram = chollos en tiempo real",
      `<p>El email es semanal. Pero los error fares duran horas.</p>
<p>Por eso publicamos los mejores chollos en Telegram cada 8h. Llegan al móvil, sin abrir el email.</p>
<p>Lo que verás en el canal:</p>
<ul style="margin:0 0 18px;padding-left:20px;color:#d1d5db">
<li style="margin:6px 0">Chollos verificados con link directo de reserva</li>
<li style="margin:6px 0">Error fares en business class (cuando ocurren)</li>
<li style="margin:6px 0">Avisos de oferta limitada antes de que se agote</li>
</ul>
<p>El canal es público y gratis. Únete:</p>`,
      "Unirme al canal de Telegram",
      TELEGRAM_URL,
    ),
    text: `El email es semanal. Los error fares duran horas.

Publicamos chollos verificados en Telegram cada 8h. Únete (gratis):

${TELEGRAM_URL}

— TripCazador

Cancelar: {{unsubscribe_url}}`,
  },
];

export function getTemplate(stage: number): DripTemplate | null {
  return DRIP_TEMPLATES[stage] ?? null;
}

/**
 * SSS64 — drip de recuperación concierge: cuando el usuario ve /concierge
 * pero NO completa pago en 24h, le mandamos este email recordatorio.
 *
 * Trigger: workflow GH `concierge-recovery.yml` cron 6h que:
 *   1. Lee /api/admin/funnel-v2 → identifica visitantes con concierge_view
 *      en últimas 24h sin concierge_click_pay correspondiente
 *   2. Si tenemos email del visitante (cookie cv_email_hint o newsletter
 *      signup previo), manda este template via Resend
 *
 * Uso:
 *   import { CONCIERGE_RECOVERY_TEMPLATE } from "@/lib/drip_templates";
 *   await sendEmail(email, CONCIERGE_RECOVERY_TEMPLATE);
 */
export const CONCIERGE_RECOVERY_TEMPLATE: DripTemplate = {
  stage: -1, // Marker: no es parte de la secuencia welcome
  subject: "¿Te quedaste a medias con tu búsqueda Concierge?",
  html: wrap(
    0,
    "Tu búsqueda personalizada está esperando",
    `<p>Hola,</p>
<p>Vimos que ayer empezaste a configurar una búsqueda <strong>Concierge</strong> pero no llegaste a finalizar el pago.</p>
<p><strong>¿Por qué te puede compensar?</strong></p>
<ul style="margin:0 0 18px;padding-left:20px;color:#d1d5db">
<li style="margin:6px 0">Buscamos manualmente entre 30+ aerolíneas, no solo las 3-4 grandes</li>
<li style="margin:6px 0">Te avisamos por email cuando encontramos el precio óptimo</li>
<li style="margin:6px 0">Pago único, sin suscripción ni letra pequeña</li>
<li style="margin:6px 0">Si no encontramos nada mejor que lo que tú ya viste online, te devolvemos el 100%</li>
</ul>
<p>Si tienes dudas, responde a este email — Ernesto contesta personalmente.</p>`,
    "Volver a mi búsqueda",
    `${SITE_URL}/concierge`,
  ),
  text: `Hola,

Vimos que ayer empezaste a configurar una búsqueda Concierge pero no llegaste a finalizar.

Buscamos manualmente entre 30+ aerolíneas. Pago único. Si no encontramos nada mejor, devolvemos el 100%.

Vuelve a tu búsqueda: ${SITE_URL}/concierge

Si tienes dudas, responde a este email.

— Ernesto, TripCazador

Cancelar: {{unsubscribe_url}}`,
};
