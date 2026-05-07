/**
 * TripCazador — WhatsApp Business API client (SSS83 May 2026)
 *
 * Soporta Meta directo (preferido) y Twilio fallback. Implementa
 * sendTemplate() para mensajes proactivos (templates pre-aprobados Meta) y
 * sendText() para respuestas dentro de la ventana de 24h activa.
 *
 * Templates esperados:
 *   deal_alert_es: "✈️ {{1}} → {{2}} desde {{3}}€ ({{4}}) Reserva ya: {{5}}"
 *   weekly_digest_es: "📰 Resumen semanal: {{1}} chollos. Top 3: {{2}} {{3}} {{4}}"
 */

const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM || ""; // whatsapp:+14155238886

export type WhatsAppProvider = "meta" | "twilio" | "none";

export function whatsappProvider(): WhatsAppProvider {
  if (WA_PHONE_ID && WA_TOKEN) return "meta";
  if (TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM) return "twilio";
  return "none";
}

/**
 * sanitizePhone(+34 600 11 22 33) → "+34600112233"
 * El número debe estar en formato E.164.
 */
export function sanitizePhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) return "+" + cleaned;
  return cleaned;
}

interface TemplateVar {
  type: "text";
  text: string;
}

export async function sendTemplate(
  to: string,
  templateName: string,
  variables: string[],
  language = "es",
): Promise<{ ok: boolean; provider: WhatsAppProvider; error?: string }> {
  const provider = whatsappProvider();
  const phone = sanitizePhone(to);

  if (provider === "meta") {
    try {
      const components = variables.length
        ? [{ type: "body", parameters: variables.map((v): TemplateVar => ({ type: "text", text: v })) }]
        : undefined;
      const r = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WA_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone.replace("+", ""),
          type: "template",
          template: {
            name: templateName,
            language: { code: language },
            ...(components ? { components } : {}),
          },
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) {
        const body = await r.text();
        return { ok: false, provider, error: `meta ${r.status}: ${body.slice(0, 200)}` };
      }
      return { ok: true, provider };
    } catch (e) {
      return { ok: false, provider, error: String(e).slice(0, 200) };
    }
  }

  if (provider === "twilio") {
    try {
      const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");
      // Twilio templates use ContentSid (HX...), pero para pruebas se puede mandar Body raw
      const body = `Template: ${templateName} | ${variables.join(" · ")}`;
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: `whatsapp:${phone}`,
          From: TWILIO_FROM,
          Body: body,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) {
        const text = await r.text();
        return { ok: false, provider, error: `twilio ${r.status}: ${text.slice(0, 200)}` };
      }
      return { ok: true, provider };
    } catch (e) {
      return { ok: false, provider, error: String(e).slice(0, 200) };
    }
  }

  return { ok: false, provider: "none", error: "WA not configured" };
}

export async function sendDealAlert(
  to: string,
  deal: {
    city_from: string;
    city_to: string;
    price_eur: number;
    date_out: string;
    booking_url: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  const r = await sendTemplate(to, "deal_alert_es", [
    deal.city_from,
    deal.city_to,
    String(deal.price_eur),
    deal.date_out.slice(0, 10),
    deal.booking_url,
  ]);
  return { ok: r.ok, error: r.error };
}
