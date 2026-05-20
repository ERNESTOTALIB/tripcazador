/**
 * discord_broadcaster.ts — SSS368 (21 may 2026)
 *
 * Postea deals al server oficial TripCazador en Discord via webhooks.
 *
 * Setup:
 *   1. Crear server Discord (gratis) — ej "TripCazador · Caza-chollos"
 *   2. Crear canales por destino: #chollos-todos, #chollos-asia,
 *      #chollos-america, #chollos-europa, #chollos-business
 *   3. Cada canal → Settings → Integrations → Webhooks → Crear webhook
 *      → copiar URL
 *   4. Env vars Vercel:
 *      DISCORD_WEBHOOK_ALL=https://discord.com/api/webhooks/xxx/yyy
 *      DISCORD_WEBHOOK_ASIA=...
 *      DISCORD_WEBHOOK_AMERICA=...
 *      DISCORD_WEBHOOK_EUROPA=...
 *      DISCORD_WEBHOOK_BUSINESS=...
 *
 * Rate limit Discord: 5 req/s por webhook. Sequential con 250ms delay.
 */

import { captureRevenueError } from "@/lib/sentry_helper";

export interface DealEmbed {
  origin: string;
  destination: string;
  cityTo: string;
  countryTo: string;
  priceEur: number;
  savingsPct?: number;
  airline?: string;
  dateOut?: string;
  dateRet?: string;
  nights?: number;
  bookingUrl: string;
  dealId: string;
  region?: "europa" | "asia" | "america" | "africa" | "oceania";
  isBusiness?: boolean;
}

interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: Array<{
    title: string;
    url?: string;
    description: string;
    color: number; // decimal
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    timestamp?: string;
    footer?: { text: string; icon_url?: string };
    thumbnail?: { url: string };
  }>;
}

function getWebhookUrl(deal: DealEmbed): string | null {
  // Business class channel priority
  if (deal.isBusiness) {
    return process.env.DISCORD_WEBHOOK_BUSINESS || process.env.DISCORD_WEBHOOK_ALL || null;
  }
  const regionMap: Record<string, string | undefined> = {
    asia: process.env.DISCORD_WEBHOOK_ASIA,
    america: process.env.DISCORD_WEBHOOK_AMERICA,
    europa: process.env.DISCORD_WEBHOOK_EUROPA,
    africa: process.env.DISCORD_WEBHOOK_AFRICA,
    oceania: process.env.DISCORD_WEBHOOK_OCEANIA,
  };
  return regionMap[deal.region ?? ""] || process.env.DISCORD_WEBHOOK_ALL || null;
}

export async function postDealToDiscord(deal: DealEmbed): Promise<{ ok: boolean; error?: string }> {
  const webhookUrl = getWebhookUrl(deal);
  if (!webhookUrl) return { ok: false, error: "discord_webhook_not_configured" };

  const savingsLine = deal.savingsPct ? ` · -${deal.savingsPct}%` : "";
  const datesLine =
    deal.dateOut && deal.dateRet
      ? `📅 ${deal.dateOut} → ${deal.dateRet}`
      : deal.dateOut
      ? `📅 ${deal.dateOut}`
      : "";

  const payload: DiscordWebhookPayload = {
    username: "TripCazador 🎯",
    avatar_url: "https://tripcazador.com/brand/tripcazador-logo-mark.png",
    embeds: [
      {
        title: `${deal.origin} → ${deal.destination} desde ${deal.priceEur}€${savingsLine}`,
        url: `https://tripcazador.com/deals/${deal.dealId}?utm_source=discord`,
        description: `**${deal.cityTo}** · ${deal.countryTo}\n${datesLine}${deal.airline ? `\n✈️ ${deal.airline}` : ""}${deal.nights ? ` · ${deal.nights} noches` : ""}`,
        color: deal.isBusiness ? 0xf59e0b : deal.savingsPct && deal.savingsPct >= 50 ? 0xef4444 : 0x10b981,
        fields: [
          {
            name: "💸 Precio",
            value: `**${deal.priceEur}€** ida+vuelta`,
            inline: true,
          },
          ...(deal.savingsPct
            ? [
                {
                  name: "📉 Descuento",
                  value: `${deal.savingsPct}% vs histórico`,
                  inline: true,
                },
              ]
            : []),
          {
            name: "🔗 Reservar",
            value: `[Ver chollo](https://tripcazador.com/deals/${deal.dealId}?utm_source=discord)`,
            inline: true,
          },
        ],
        footer: {
          text: "TripCazador · chollos verificados",
          icon_url: "https://tripcazador.com/brand/tripcazador-logo-mark.png",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      captureRevenueError(new Error(`discord_${res.status}`), {
        module: "discord_broadcaster",
        code: "post_failed",
        extra: { status: res.status, body: text.slice(0, 200) },
      });
      return { ok: false, error: `http_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    captureRevenueError(e, {
      module: "discord_broadcaster",
      code: "post_exception",
    });
    return { ok: false, error: e instanceof Error ? e.message : "network_error" };
  }
}

export async function postDealsBatch(deals: DealEmbed[]): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  for (const d of deals) {
    const r = await postDealToDiscord(d);
    if (r.ok) sent += 1;
    else failed += 1;
    // Rate limit safety
    await new Promise((r) => setTimeout(r, 300));
  }
  return { sent, failed };
}
