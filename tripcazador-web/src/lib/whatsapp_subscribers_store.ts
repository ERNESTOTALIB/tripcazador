/**
 * whatsapp_subscribers_store.ts — SSS362
 *
 * Lista de subs WhatsApp opt-in. Persistencia in-memory + globalThis.
 * Producción ideal: persistir a Vercel KV o backend FastAPI.
 *
 * Compliance: solo enviamos a users que opt-in explícito.
 * Webhook recibe "ALTA" / "BAJA" para auto-toggle.
 */

export interface WhatsAppSubscriber {
  phone: string;
  opt_in_at: number;
  opt_out_at?: number;
  active: boolean;
  source: "premium_signup" | "blog_cta" | "telegram_redirect" | "manual";
  premium_customer_id?: string;
  last_message_sent_at?: number;
  total_messages_received: number;
}

const store: { subs: WhatsAppSubscriber[] } = (
  globalThis as unknown as {
    __tc_whatsapp_subs?: { subs: WhatsAppSubscriber[] };
  }
).__tc_whatsapp_subs ?? { subs: [] };
(globalThis as unknown as { __tc_whatsapp_subs: typeof store }).__tc_whatsapp_subs = store;

export function upsertSubscriber(
  phone: string,
  source: WhatsAppSubscriber["source"],
  premiumCustomerId?: string,
): WhatsAppSubscriber {
  const idx = store.subs.findIndex((s) => s.phone === phone);
  if (idx >= 0) {
    const existing = store.subs[idx];
    existing.active = true;
    existing.opt_in_at = Date.now();
    if (premiumCustomerId) existing.premium_customer_id = premiumCustomerId;
    return existing;
  }
  const entry: WhatsAppSubscriber = {
    phone,
    opt_in_at: Date.now(),
    active: true,
    source,
    premium_customer_id: premiumCustomerId,
    total_messages_received: 0,
  };
  store.subs.push(entry);
  return entry;
}

export function deactivateSubscriber(phone: string): boolean {
  const sub = store.subs.find((s) => s.phone === phone);
  if (!sub) return false;
  sub.active = false;
  sub.opt_out_at = Date.now();
  return true;
}

export function listActiveSubscribers(opts: { onlyPremium?: boolean } = {}): WhatsAppSubscriber[] {
  return store.subs.filter((s) => {
    if (!s.active) return false;
    if (opts.onlyPremium && !s.premium_customer_id) return false;
    return true;
  });
}

export function incrementMessageCount(phone: string): void {
  const sub = store.subs.find((s) => s.phone === phone);
  if (sub) {
    sub.total_messages_received += 1;
    sub.last_message_sent_at = Date.now();
  }
}

export function statsSubscribers(): {
  total: number;
  active: number;
  premium: number;
  free: number;
  opted_out: number;
} {
  return {
    total: store.subs.length,
    active: store.subs.filter((s) => s.active).length,
    premium: store.subs.filter((s) => s.active && s.premium_customer_id).length,
    free: store.subs.filter((s) => s.active && !s.premium_customer_id).length,
    opted_out: store.subs.filter((s) => !s.active).length,
  };
}

export function _clearStore(): void {
  store.subs.length = 0;
}
