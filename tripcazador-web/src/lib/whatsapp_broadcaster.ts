/**
 * whatsapp_broadcaster.ts — SSS362 (21 may 2026)
 *
 * Envía mensajes (text + image) vía WhatsApp Business Cloud API a una lista
 * de números suscriptores. Usado para broadcast de chollos a Premium subs
 * que opt-in a WhatsApp.
 *
 * ┌─ Setup user (cuenta business + API) ───────────────────────────────────┐
 * │ 1. Convertir cuenta WhatsApp personal a Business gratis vía la app:    │
 * │    Ajustes → Cuenta → Cambiar a cuenta de empresa                       │
 * │                                                                          │
 * │ 2. Crear app Meta for Developers:                                       │
 * │    https://developers.facebook.com/apps/create/                         │
 * │    Tipo: Business · Producto: WhatsApp                                  │
 * │                                                                          │
 * │ 3. Obtener phone_number_id + access_token (System User permanente)      │
 * │    https://developers.facebook.com/docs/whatsapp/cloud-api/get-started  │
 * │                                                                          │
 * │ 4. Crear templates aprobados por Meta (24h aprobación):                 │
 * │    - "chollo_alert" con vars {{1}}=origen, {{2}}=destino, {{3}}=precio  │
 * │    - "deal_with_image" media template con imagen header                  │
 * │                                                                          │
 * │ 5. Env vars Vercel:                                                     │
 * │    WHATSAPP_PHONE_NUMBER_ID=xxx                                         │
 * │    WHATSAPP_ACCESS_TOKEN=EAAxxx                                          │
 * │    WHATSAPP_APP_SECRET=xxx (para webhook signature)                     │
 * │    WHATSAPP_VERIFY_TOKEN=tripcazador_verify                             │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Free tier Meta: 1000 conversaciones/mes gratis. Suficiente para 200 subs
 * que reciban 5 alertas/mes cada uno.
 */

import { captureRevenueError } from "@/lib/sentry_helper";

const WHATSAPP_API_VERSION = "v21.0"; // SDK estable may 2026
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
}

function getConfig(): WhatsAppConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
  if (!phoneNumberId || !accessToken) return null;
  return { phoneNumberId, accessToken };
}

interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sanitize phone number a E.164 (+34xxxxxxxxx). Whatsapp Cloud API rechaza
 * formatos con espacios, guiones, etc.
 */
export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[^\d+]/g, "");
  // Quitar leading +
  const digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
  // Mínimo 10 dígitos, máximo 15 (E.164)
  if (digits.length < 10 || digits.length > 15) return null;
  if (!/^\d+$/.test(digits)) return null;
  return digits;
}

/**
 * Envía un mensaje template (único permitido para outbound proactivo —
 * mensajes free-form solo en ventana 24h después de mensaje del user).
 */
export async function sendTemplate(opts: {
  to: string;
  templateName: string;
  languageCode?: "es" | "es_ES" | "en" | "en_US";
  components?: Array<{
    type: "body" | "header" | "button";
    parameters: Array<{ type: "text"; text: string } | { type: "image"; image: { link: string } }>;
  }>;
}): Promise<SendResult> {
  const cfg = getConfig();
  if (!cfg) return { ok: false, error: "whatsapp_not_configured" };

  const to = normalizePhone(opts.to);
  if (!to) return { ok: false, error: "invalid_phone" };

  try {
    const res = await fetch(`${WHATSAPP_API_BASE}/${cfg.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: opts.templateName,
          language: { code: opts.languageCode ?? "es" },
          components: opts.components ?? [],
        },
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const errMsg = json?.error?.message ?? `http_${res.status}`;
      captureRevenueError(new Error(errMsg), {
        module: "whatsapp_broadcaster",
        code: "send_template_failed",
        extra: { templateName: opts.templateName, status: res.status },
      });
      return { ok: false, error: errMsg };
    }
    return { ok: true, messageId: json?.messages?.[0]?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "network_error";
    captureRevenueError(e, {
      module: "whatsapp_broadcaster",
      code: "send_template_exception",
    });
    return { ok: false, error: msg };
  }
}

/**
 * Helper específico para broadcast de chollos (template chollo_alert).
 *
 * Template Meta-approved esperado:
 *   "🎯 Chollo: {{1}} → {{2}} desde {{3}}€"
 *   "Stock limitado. Reserva aquí: {{4}}"
 */
export async function sendDealAlert(opts: {
  to: string;
  origin: string;
  destination: string;
  priceEur: number;
  bookingUrl: string;
  imageUrl?: string;
}): Promise<SendResult> {
  const components: Parameters<typeof sendTemplate>[0]["components"] = [
    {
      type: "body",
      parameters: [
        { type: "text", text: opts.origin },
        { type: "text", text: opts.destination },
        { type: "text", text: String(opts.priceEur) },
        { type: "text", text: opts.bookingUrl },
      ],
    },
  ];
  if (opts.imageUrl) {
    components.unshift({
      type: "header",
      parameters: [{ type: "image", image: { link: opts.imageUrl } }],
    });
  }
  return sendTemplate({
    to: opts.to,
    templateName: opts.imageUrl ? "deal_with_image" : "chollo_alert",
    languageCode: "es",
    components,
  });
}

/**
 * Broadcast a múltiples destinatarios. Rate-limited a 80 msg/segundo
 * (default WhatsApp tier 1). Devuelve summary.
 */
export async function broadcastDeal(
  recipients: string[],
  payload: Omit<Parameters<typeof sendDealAlert>[0], "to">,
): Promise<{ sent: number; failed: number; skipped: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Sequential con micro-delay para respetar rate limit
  for (const to of recipients) {
    if (!normalizePhone(to)) {
      skipped += 1;
      continue;
    }
    const res = await sendDealAlert({ to, ...payload });
    if (res.ok) {
      sent += 1;
    } else {
      failed += 1;
      if (res.error && errors.length < 10) errors.push(res.error);
    }
    // 80 msg/s = 12.5ms entre mensajes; ponemos 15ms para safety
    await new Promise((r) => setTimeout(r, 15));
  }
  return { sent, failed, skipped, errors };
}

/**
 * Verifica webhook de WhatsApp (GET hub.verify_token challenge).
 */
export function verifyWebhookChallenge(
  mode: string,
  token: string,
  challenge: string,
): string | null {
  const expected = process.env.WHATSAPP_VERIFY_TOKEN || "";
  if (!expected) return null;
  if (mode !== "subscribe") return null;
  if (token !== expected) return null;
  return challenge;
}

/**
 * Parse webhook payload — mensajes entrantes de users.
 * Útil para auto-replies y para acumular suscriptores que respondan al
 * primer broadcast con "SI" o "ALTA".
 */
export interface IncomingMessage {
  from: string;
  text: string;
  timestamp: number;
  type: "text" | "image" | "document" | "other";
}

export function parseWebhookPayload(body: unknown): IncomingMessage[] {
  const messages: IncomingMessage[] = [];
  if (!body || typeof body !== "object") return messages;
  const entries = (body as { entry?: unknown[] }).entry || [];
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] }).changes || [];
    for (const change of changes) {
      const value = (change as { value?: { messages?: unknown[] } }).value;
      if (!value?.messages) continue;
      for (const msg of value.messages) {
        const m = msg as {
          from?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
        };
        if (!m.from || !m.timestamp) continue;
        messages.push({
          from: m.from,
          text: m.text?.body || "",
          timestamp: parseInt(m.timestamp, 10) * 1000,
          type: m.type === "text" || m.type === "image" || m.type === "document"
            ? m.type
            : "other",
        });
      }
    }
  }
  return messages;
}
