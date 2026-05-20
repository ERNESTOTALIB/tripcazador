/**
 * owner_notify.ts — SSS331 (20 may 2026)
 *
 * Envía un email al owner (Ernesto) con prefix `[TRIPCAZADOR]` para que
 * lo pueda filtrar automáticamente a su carpeta TRIPCAZADOR en el
 * cliente de correo (Hotmail/Outlook/Gmail). Notifica:
 *  - Nueva alta Premium
 *  - Nuevo pedido Concierge
 *  - Cancelación Premium (futuro winback)
 *
 * Defensive:
 *  - Si OWNER_NOTIFY_EMAIL no set → noop.
 *  - Si RESEND_API_KEY no set → noop con log.
 *  - Errores no propagan (fire-and-forget desde el webhook).
 *
 * Pure-shape fn — testeable con vi.stubGlobal('fetch').
 */

export type OwnerNotifyKind = "premium_signup" | "concierge_order" | "premium_cancel" | "info";

export interface OwnerNotifyInput {
  kind: OwnerNotifyKind;
  /** Email del cliente afectado (para subject + body) */
  customer_email?: string;
  /** Texto corto que va en el subject tras el prefix */
  summary: string;
  /** Detalles adicionales en bullet list (key: value) */
  details?: Record<string, string | number | undefined>;
}

const SUBJECT_PREFIX = "[TRIPCAZADOR]";

/** Email del owner para auto-filtrado a carpeta. */
function ownerEmail(): string {
  // Soporta override por env. Default a Ernesto (admin único actual).
  return process.env.OWNER_NOTIFY_EMAIL || "ernestalib@hotmail.com";
}

function buildHtml(input: OwnerNotifyInput): string {
  const bullets = Object.entries(input.details || {})
    .filter(([, v]) => v !== undefined && v !== "")
    .map(
      ([k, v]) =>
        `<li style="margin:4px 0;"><strong style="color:#555;">${escapeHtml(k)}:</strong> <code>${escapeHtml(String(v))}</code></li>`,
    )
    .join("");
  const titleColor =
    input.kind === "premium_signup"
      ? "#059669"
      : input.kind === "concierge_order"
        ? "#b45309"
        : input.kind === "premium_cancel"
          ? "#dc2626"
          : "#111";
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:20px;">
    <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#888;font-weight:600;">TripCazador · Internal</div>
    <h1 style="margin:6px 0 4px 0;font-size:18px;color:${titleColor};">${escapeHtml(input.summary)}</h1>
    ${input.customer_email ? `<div style="font-size:13px;color:#555;">Cliente: <code>${escapeHtml(input.customer_email)}</code></div>` : ""}
    ${
      bullets
        ? `<ul style="margin-top:14px;padding-left:18px;font-size:13px;color:#222;list-style:disc;">${bullets}</ul>`
        : ""
    }
    <div style="margin-top:18px;font-size:11px;color:#999;">
      Filtro sugerido en tu cliente: subject contains <code>${SUBJECT_PREFIX}</code> → carpeta TRIPCAZADOR.
    </div>
  </div>
</body></html>`;
}

const SAFE_TAG_RE = /[<>&"]/g;
const SAFE_TAG_MAP: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
};
function escapeHtml(s: string): string {
  return String(s).replace(SAFE_TAG_RE, (c) => SAFE_TAG_MAP[c] || c);
}

export async function sendOwnerNotify(input: OwnerNotifyInput): Promise<boolean> {
  const to = ownerEmail();
  if (!to) return false;
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!apiKey) {
    console.log(`[owner_notify] dormido (${input.kind}) — RESEND_API_KEY no set`);
    return false;
  }
  const from =
    process.env.RESEND_FROM || "TripCazador Internal <alertas@tripcazador.com>";
  const subject = `${SUBJECT_PREFIX} ${input.summary}`.slice(0, 200);
  const html = buildHtml(input);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        tags: [
          { name: "category", value: "owner_internal" },
          { name: "kind", value: input.kind },
        ],
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[owner_notify] resend fail:", err);
    return false;
  }
}
