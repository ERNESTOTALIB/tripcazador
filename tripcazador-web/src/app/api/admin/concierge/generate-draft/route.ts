/**
 * /api/admin/concierge/generate-draft — fase sss SSS10 (May 2026)
 *
 * POST { order_id } → genera un borrador de propuesta para el cliente.
 *   - Si ANTHROPIC_API_KEY está → llama a Claude con prompt template
 *     producir una tabla markdown de 5 opciones realistas + recomendado.
 *   - Si no → devuelve un template estructurado que el admin completa
 *     manualmente.
 *
 * El admin revisa el output, edita si quiere, y lo envía al cliente por email.
 * Este endpoint NO envía nada — solo devuelve el markdown.
 *
 * Auth: cookie panel_session (panel logueado) o header X-Admin-Token.
 *
 * Modelo Claude: claude-sonnet-4-7-20250101 vía REST API directa
 * (no requiere SDK). 1500 tokens max.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { CONCIERGE_TIERS, isValidTier, type ConciergeTier } from "@/lib/concierge_tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

interface DraftRequestBody {
  order_id?: string;
  /** Override opcional si el admin quiere regenerar con otros datos */
  origin?: string;
  destination?: string;
  date_from?: string;
  date_to?: string;
  budget?: number;
  travelers?: number;
  hotel_stars?: number;
  notes?: string;
  tier?: string;
}

interface BackendOrder {
  id: string;
  email: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to?: string;
  flex_days: number;
  budget: number;
  travelers: number;
  hotel_stars: number;
  notes?: string;
  tier?: string;
}

interface DraftResponse {
  order_id: string;
  tier: ConciergeTier;
  source: "claude" | "manual_template";
  markdown: string;
  generated_at: string;
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorize(req: Request): boolean {
  const cookieToken = cookies().get(COOKIE_KEY)?.value;
  if (cookieToken && verifyToken(cookieToken)) return true;
  const hdr = req.headers.get("x-admin-token") || "";
  if (ADMIN_TOKEN && hdr && constantTimeEq(hdr, ADMIN_TOKEN)) return true;
  return false;
}

async function fetchOrder(orderId: string): Promise<BackendOrder | null> {
  if (!BACKEND_URL || !ADMIN_TOKEN || !orderId) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(
      `${BACKEND_URL}/api/admin/concierge/orders/${encodeURIComponent(orderId)}`,
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
        cache: "no-store",
        signal: ctrl.signal,
      },
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.order || data) as BackendOrder;
  } catch {
    return null;
  }
}

function buildPrompt(o: {
  origin: string;
  destination: string;
  date_from: string;
  date_to: string;
  travelers: number;
  hotel_stars: number;
  budget: number;
  notes: string;
  tier: ConciergeTier;
}): string {
  const tierDef = CONCIERGE_TIERS[o.tier];
  const numOptions = o.tier === "express" ? 3 : o.tier === "pro" ? 10 : 5;

  return `You are a professional travel agent for TripCazador, a Spanish online travel agency.

A customer just paid €${tierDef.amount_eur} for the ${tierDef.name} tier and is waiting for ${numOptions} flight options.

CUSTOMER REQUEST:
- Origin: ${o.origin}
- Destination: ${o.destination}
- Outbound date: ${o.date_from}${o.date_to ? `\n- Return date: ${o.date_to}` : "\n- One-way trip"}
- Travelers: ${o.travelers}
- Hotel preference: ${o.hotel_stars}-star
- Budget: €${o.budget} total
- Notes from customer: ${o.notes || "(none)"}

TASK:
Generate exactly ${numOptions} flight options as a markdown table. Use realistic prices for this route (research average pricing). Columns:
| Option | Airline | Departure | Stops | Duration | Price | Booking |

After the table:
1. Add a "**Recommended**" section explaining which option is best and why (price/duration/airline reliability).
2. ${o.tier !== "express" ? "Add 3 destination tips (best neighborhood, transport, packing tip)." : ""}
3. ${o.tier === "premium" || o.tier === "pro" ? "Add visa requirements + travel insurance recommendation." : ""}
4. ${o.tier === "pro" ? "Add a day-by-day skeleton itinerary suggestion." : ""}

Output in SPANISH (target audience). Be concrete, no fluff. Use realistic airline names (Iberia, Air France, Lufthansa, Emirates, etc.) and realistic booking URLs (e.g. iberia.com/es/, airfrance.es/).`;
}

function manualTemplate(o: {
  order_id: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to: string;
  travelers: number;
  hotel_stars: number;
  budget: number;
  notes: string;
  tier: ConciergeTier;
}): string {
  const tierDef = CONCIERGE_TIERS[o.tier];
  return `# Propuesta TripCazador ${tierDef.name} — Pedido ${o.order_id}

**Cliente busca:** ${o.origin} → ${o.destination}
**Fechas:** ${o.date_from}${o.date_to ? ` → ${o.date_to}` : " (one-way)"}
**Viajeros:** ${o.travelers} · Hotel: ${o.hotel_stars}★ · Presupuesto: €${o.budget}
**Notas:** ${o.notes || "(ninguna)"}

---

## Opciones de vuelo

| Opción | Aerolínea | Salida | Escalas | Duración | Precio | Reserva |
|--------|-----------|--------|---------|----------|--------|---------|
| 1 | _Aerolínea 1_ | __:__ | 0/1/2 | _Xh_ | €__ | _link_ |
| 2 | _Aerolínea 2_ | __:__ | 0/1/2 | _Xh_ | €__ | _link_ |
| 3 | _Aerolínea 3_ | __:__ | 0/1/2 | _Xh_ | €__ | _link_ |
${o.tier !== "express" ? "| 4 | _Aerolínea 4_ | __:__ | 0/1/2 | _Xh_ | €__ | _link_ |\n| 5 | _Aerolínea 5_ | __:__ | 0/1/2 | _Xh_ | €__ | _link_ |\n" : ""}
## Recomendado

**Opción __** — _Por qué (precio, duración, aerolínea fiable, etc.)_

${o.tier !== "express" ? `## Tips destino\n\n- _Mejor zona / barrio_\n- _Transporte recomendado aeropuerto → centro_\n- _Tip packing / cultura_\n` : ""}
${o.tier === "premium" || o.tier === "pro" ? `## Visado + seguro\n\n- _Visado: requisito + cómo tramitar_\n- _Seguro recomendado: Heymondo (link affiliate)_\n` : ""}
${o.tier === "pro" ? `## Itinerario día-a-día (esqueleto)\n\n- Día 1 — Llegada\n- Día 2 — _Plan_\n- Día 3 — _Plan_\n- ...\n` : ""}
---

_Esta plantilla se generó automáticamente porque ANTHROPIC_API_KEY no está configurada. Rellena los huecos manualmente o configura la key para auto-generación con Claude._
`;
}

async function callClaude(prompt: string): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[generate-draft] Anthropic error:", res.status, detail.slice(0, 200));
      return null;
    }
    const data = await res.json();
    // Anthropic response shape: { content: [{ type: "text", text: "..." }] }
    const text = Array.isArray(data?.content)
      ? data.content
          .filter((c: { type?: string }) => c?.type === "text")
          .map((c: { text?: string }) => c?.text || "")
          .join("\n")
      : "";
    return typeof text === "string" && text.length > 0 ? text : null;
  } catch (err) {
    console.error("[generate-draft] Claude call failed:", err);
    return null;
  }
}

export async function POST(
  req: Request,
): Promise<NextResponse<DraftResponse | { error: string }>> {
  if (!authorize(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: DraftRequestBody = {};
  try {
    body = (await req.json()) as DraftRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const orderId = (body.order_id || "").trim();
  if (!orderId) {
    return NextResponse.json({ error: "missing_order_id" }, { status: 400 });
  }

  // Intentar fetch backend; si falla, usar override del body (admin manual)
  const backendOrder = await fetchOrder(orderId);
  const merged = {
    origin: body.origin || backendOrder?.origin || "",
    destination: body.destination || backendOrder?.destination || "",
    date_from: body.date_from || backendOrder?.date_from || "",
    date_to: body.date_to || backendOrder?.date_to || "",
    travelers: body.travelers ?? backendOrder?.travelers ?? 1,
    hotel_stars: body.hotel_stars ?? backendOrder?.hotel_stars ?? 4,
    budget: body.budget ?? backendOrder?.budget ?? 1500,
    notes: body.notes || backendOrder?.notes || "",
    tier: (isValidTier(body.tier)
      ? body.tier
      : isValidTier(backendOrder?.tier)
        ? (backendOrder!.tier as ConciergeTier)
        : "standard") as ConciergeTier,
  };

  if (!merged.origin || !merged.destination || !merged.date_from) {
    return NextResponse.json(
      {
        error: "missing_trip_data",
      },
      { status: 400 },
    );
  }

  let markdown: string;
  let source: "claude" | "manual_template";

  if (ANTHROPIC_API_KEY) {
    const prompt = buildPrompt(merged);
    const claudeText = await callClaude(prompt);
    if (claudeText) {
      markdown = claudeText;
      source = "claude";
    } else {
      markdown = manualTemplate({ order_id: orderId, ...merged });
      source = "manual_template";
    }
  } else {
    markdown = manualTemplate({ order_id: orderId, ...merged });
    source = "manual_template";
  }

  return NextResponse.json({
    order_id: orderId,
    tier: merged.tier,
    source,
    markdown,
    generated_at: new Date().toISOString(),
  });
}
