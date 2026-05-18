/**
 * agencia_store.ts — SSS305 (18 may 2026)
 *
 * Tickets de la Agencia TripCazador. Cada ticket = una compra one-shot
 * de €9.99 (vuelo) o €19.99 (vuelo+hotel) con garantía de mejor precio.
 *
 * Estados:
 *  - paid     → cliente pagó, ticket creado, esperando que Ernesto procese
 *  - delivered→ Ernesto ha enviado las 3 mejores opciones por email
 *  - refunded → cliente reclamó garantía, se le devolvió pago + 1 mes Premium
 *
 * In-memory store + remote fallback (AGENCIA_STORE_URL).
 */

export type AgenciaTipo = "vuelo" | "vuelo_hotel";
export type AgenciaStatus = "paid" | "delivered" | "refunded";

export interface AgenciaTicket {
  id: string;
  tipo: AgenciaTipo;
  email: string;
  customer_id?: string;
  request: {
    origin?: string;
    destination?: string;
    date_out?: string;
    date_ret?: string;
    pasajeros?: number;
    presupuesto?: number;
    notas?: string;
  };
  amount_eur: number;
  stripe_session_id?: string;
  status: AgenciaStatus;
  created_at: number;
  delivered_at?: number;
  refunded_at?: number;
  refund_proof_url?: string;
}

const memoryStore: Map<string, AgenciaTicket> = new Map();
const REMOTE_URL = process.env.AGENCIA_STORE_URL || "";
const REMOTE_TOKEN = process.env.AGENCIA_STORE_TOKEN || "";

export const AGENCIA_PRICES = {
  vuelo: 9.99,
  vuelo_hotel: 19.99,
} as const;

export const AGENCIA_GUARANTEE_DAYS = 7;

function genId(): string {
  return `agt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function remote(
  method: "POST" | "GET" | "PATCH",
  path: string,
  body?: unknown,
): Promise<Response | null> {
  if (!REMOTE_URL || !REMOTE_TOKEN) return null;
  try {
    return await fetch(`${REMOTE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${REMOTE_TOKEN}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

export async function createTicket(input: {
  tipo: AgenciaTipo;
  email: string;
  customer_id?: string;
  request: AgenciaTicket["request"];
  stripe_session_id?: string;
}): Promise<AgenciaTicket> {
  const t: AgenciaTicket = {
    id: genId(),
    tipo: input.tipo,
    email: input.email.trim().toLowerCase(),
    customer_id: input.customer_id,
    request: input.request,
    amount_eur: AGENCIA_PRICES[input.tipo],
    stripe_session_id: input.stripe_session_id,
    status: "paid",
    created_at: Date.now(),
  };
  const r = await remote("POST", "/tickets", t);
  if (r && r.ok) {
    return ((await r.json().catch(() => t)) as AgenciaTicket) || t;
  }
  memoryStore.set(t.id, t);
  return t;
}

export async function listTicketsByEmail(email: string): Promise<AgenciaTicket[]> {
  if (!email) return [];
  const norm = email.trim().toLowerCase();
  const r = await remote("GET", `/tickets/by-email/${encodeURIComponent(norm)}`);
  if (r && r.ok) {
    return ((await r.json().catch(() => [])) as AgenciaTicket[]) || [];
  }
  return Array.from(memoryStore.values())
    .filter((t) => t.email === norm)
    .sort((a, b) => b.created_at - a.created_at);
}

export async function getTicket(id: string): Promise<AgenciaTicket | null> {
  if (!id) return null;
  const r = await remote("GET", `/tickets/${id}`);
  if (r && r.ok) {
    return ((await r.json().catch(() => null)) as AgenciaTicket) || null;
  }
  return memoryStore.get(id) ?? null;
}

export async function markRefunded(
  id: string,
  proofUrl?: string,
): Promise<boolean> {
  const r = await remote("PATCH", `/tickets/${id}`, {
    status: "refunded",
    refund_proof_url: proofUrl,
  });
  if (r && r.ok) return true;
  const t = memoryStore.get(id);
  if (!t) return false;
  t.status = "refunded";
  t.refunded_at = Date.now();
  t.refund_proof_url = proofUrl;
  return true;
}

export async function markDelivered(id: string): Promise<boolean> {
  const r = await remote("PATCH", `/tickets/${id}`, { status: "delivered" });
  if (r && r.ok) return true;
  const t = memoryStore.get(id);
  if (!t) return false;
  t.status = "delivered";
  t.delivered_at = Date.now();
  return true;
}

export function _clearAgenciaStore(): void {
  memoryStore.clear();
}
