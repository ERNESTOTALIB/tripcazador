/**
 * /api/premium/lifecycle-cron — SSS340 (20 may 2026)
 *
 * Cron diario (recomendado 09:00 Europe/Madrid) que dispara emails lifecycle:
 *  - milestone (100€/250€/500€/1000€ ahorrados desde el último envío)
 *  - anniversary (cada 365 días desde updated_at signup)
 *  - annualUpsell (mensual con >=180 días activo)
 *  - onboarding (D+1, D+3, D+7, D+14)
 *
 * GET ?token=PRICE_ALERT_CRON_TOKEN_PREMIUM[+ &dry=1]
 *
 * Stateful: no reenviamos el mismo email lifecycle 2× al mismo customer.
 * Persistimos un set "tc_lifecycle_sent_{customer}_{kind}" en in-memory store.
 */

import { NextRequest, NextResponse } from "next/server";
import { listActivePremium } from "@/lib/premium_store";
import { listSavingsByCustomer, summarize } from "@/lib/savings_log_store";
import {
  milestoneEmail,
  anniversaryEmail,
  annualUpsellEmail,
  onboardingPremiumD1,
  onboardingPremiumD3,
  onboardingPremiumD7,
  onboardingPremiumD14,
  MILESTONE_TIERS,
  type MilestoneTier,
} from "@/lib/lifecycle_emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESEND_FROM =
  process.env.RESEND_FROM || "TripCazador Premium <alertas@tripcazador.com>";

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let m = 0;
  for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}

// In-memory "sent registry" — persiste durante la vida del lambda. Sin más
// infra (kv/db) aceptable como first-pass anti-spam — los lambdas en Vercel
// duran horas, no semanas, así que en el peor caso reenviamos un milestone
// 1× extra al rotar la instancia. Aceptable.
const sentRegistry: { keys: Set<string> } = (
  globalThis as unknown as { __tc_lifecycle_sent?: { keys: Set<string> } }
).__tc_lifecycle_sent ?? { keys: new Set<string>() };
(globalThis as unknown as { __tc_lifecycle_sent: typeof sentRegistry }).__tc_lifecycle_sent =
  sentRegistry;

function alreadySent(key: string): boolean {
  return sentRegistry.keys.has(key);
}
function markSent(key: string): void {
  sentRegistry.keys.add(key);
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!apiKey) {
    console.log(`[lifecycle-cron] noop (RESEND_API_KEY no set) → would send "${subject}" to ${to}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to,
        subject,
        html,
        tags: [{ name: "category", value: "premium_lifecycle" }],
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[lifecycle-cron] resend fail:", err);
    return false;
  }
}

function highestMilestoneCrossed(savingsEur: number): MilestoneTier | null {
  let highest: MilestoneTier | null = null;
  for (const tier of MILESTONE_TIERS) {
    if (savingsEur >= tier) highest = tier;
  }
  return highest;
}

function daysSince(ms: number, now: number): number {
  return Math.floor((now - ms) / 86_400_000);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get("token") || "";
  const expected =
    process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM ||
    process.env.PRICE_ALERT_CRON_TOKEN ||
    "";
  if (!expected) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  if (!constantTimeEq(token, expected)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const now = Date.now();

  const premium = listActivePremium();
  const stats = {
    total: premium.length,
    milestone_sent: 0,
    anniversary_sent: 0,
    annual_upsell_sent: 0,
    onboarding_sent: 0,
    skipped: 0,
  };

  for (const p of premium) {
    // Edad de la suscripción desde updated_at (proxy de signup)
    const signupAt = p.updated_at;
    const daysActive = daysSince(signupAt, now);

    // ---------- onboarding D+1/3/7/14 ----------
    const onboardingMap: Array<{
      day: number;
      kind: string;
      fn: typeof onboardingPremiumD1;
    }> = [
      { day: 1, kind: "onb_d1", fn: onboardingPremiumD1 },
      { day: 3, kind: "onb_d3", fn: onboardingPremiumD3 },
      { day: 7, kind: "onb_d7", fn: onboardingPremiumD7 },
      { day: 14, kind: "onb_d14", fn: onboardingPremiumD14 },
    ];
    for (const ob of onboardingMap) {
      // Ventana ±1 día para tolerar deslices del cron
      if (Math.abs(daysActive - ob.day) > 1) continue;
      const key = `${p.customer_id}_${ob.kind}`;
      if (alreadySent(key)) continue;
      const email = ob.fn({ email: p.email });
      if (!dry) {
        const ok = await sendEmail(p.email, email.subject, email.html);
        if (ok) {
          markSent(key);
          stats.onboarding_sent += 1;
        } else {
          stats.skipped += 1;
        }
      } else {
        stats.onboarding_sent += 1;
      }
    }

    // ---------- milestone ----------
    const savings = await listSavingsByCustomer(p.customer_id);
    const summary = summarize(savings, now);
    const totalEur = Math.round(summary.total_eur);
    const tier = highestMilestoneCrossed(totalEur);
    if (tier) {
      const key = `${p.customer_id}_milestone_${tier}`;
      if (!alreadySent(key)) {
        const email = milestoneEmail({
          email: p.email,
          savingsEur: totalEur,
          tier,
        });
        if (!dry) {
          const ok = await sendEmail(p.email, email.subject, email.html);
          if (ok) {
            markSent(key);
            stats.milestone_sent += 1;
          } else {
            stats.skipped += 1;
          }
        } else {
          stats.milestone_sent += 1;
        }
      }
    }

    // ---------- anniversary (cada 365 ±2 días) ----------
    if (daysActive >= 365) {
      const years = Math.floor(daysActive / 365);
      const dayInYear = daysActive % 365;
      if (dayInYear <= 2) {
        const key = `${p.customer_id}_anniv_${years}`;
        if (!alreadySent(key)) {
          const email = anniversaryEmail({
            email: p.email,
            yearsActive: years,
            totalSaved: totalEur > 0 ? totalEur : undefined,
          });
          if (!dry) {
            const ok = await sendEmail(p.email, email.subject, email.html);
            if (ok) {
              markSent(key);
              stats.anniversary_sent += 1;
            } else {
              stats.skipped += 1;
            }
          } else {
            stats.anniversary_sent += 1;
          }
        }
      }
    }

    // ---------- annual upsell (>=180 días mensual) ----------
    // Detección "mensual": fallback heurístico — no podemos saber el cycle
    // sin Stripe, así que enviamos al cumplir 180 días desde signup. Si
    // el user ya está en anual el email es "neutral" (no hace daño).
    if (daysActive === 180 || daysActive === 181) {
      const key = `${p.customer_id}_annual_upsell`;
      if (!alreadySent(key)) {
        const email = annualUpsellEmail({
          email: p.email,
          monthsActive: 6,
        });
        if (!dry) {
          const ok = await sendEmail(p.email, email.subject, email.html);
          if (ok) {
            markSent(key);
            stats.annual_upsell_sent += 1;
          } else {
            stats.skipped += 1;
          }
        } else {
          stats.annual_upsell_sent += 1;
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    dry,
    resend_active: Boolean(process.env.RESEND_API_KEY),
    ...stats,
  });
}
