import { describe, it, expect } from "vitest";
import {
  milestoneEmail,
  anniversaryEmail,
  annualUpsellEmail,
  onboardingPremiumD1,
  onboardingPremiumD3,
  onboardingPremiumD7,
  onboardingPremiumD14,
  MILESTONE_TIERS,
  ONBOARDING_DRIP,
} from "@/lib/lifecycle_emails";

describe("lifecycle_emails", () => {
  it("MILESTONE_TIERS son 100/250/500/1000", () => {
    expect(MILESTONE_TIERS).toEqual([100, 250, 500, 1000]);
  });

  it("ONBOARDING_DRIP tiene 4 stages D+1, D+3, D+7, D+14", () => {
    expect(ONBOARDING_DRIP.map((s) => s.day)).toEqual([1, 3, 7, 14]);
  });

  it("milestoneEmail incluye savings en subject y html", () => {
    const m = milestoneEmail({ email: "x@test.com", savingsEur: 250, tier: 250 });
    expect(m.subject).toContain("250€");
    expect(m.html).toContain("250€");
    expect(m.html).toContain("https://tripcazador.com/panel/premium");
  });

  it("anniversaryEmail incluye código promo ANIV{year}", () => {
    const e = anniversaryEmail({ email: "x@test.com", yearsActive: 1 });
    expect(e.subject).toContain("1 año");
    expect(e.html).toContain("ANIV1");
    expect(e.html).toContain("cycle=annual");
  });

  it("anniversaryEmail menciona total ahorrado si se pasa", () => {
    const e = anniversaryEmail({
      email: "x@test.com",
      yearsActive: 2,
      totalSaved: 480,
    });
    expect(e.html).toContain("480€");
  });

  it("annualUpsellEmail compara mensual vs anual con tabla", () => {
    const e = annualUpsellEmail({ email: "x@test.com", monthsActive: 6 });
    expect(e.html).toContain("€119,88");
    expect(e.html).toContain("€99");
    expect(e.html).toContain("17%");
    expect(e.html).toContain("cycle=annual");
  });

  it("onboardingPremiumD1 contiene 3 pasos", () => {
    const e = onboardingPremiumD1({ email: "x@test.com" });
    expect(e.html).toContain("3 pasos");
    expect(e.html).toContain("/panel/premium/alertas");
  });

  it("onboardingPremiumD3 menciona el truco nights:5-8", () => {
    const e = onboardingPremiumD3({ email: "x@test.com" });
    expect(e.html.toLowerCase()).toContain("nights");
    expect(e.html).toContain("5-8");
  });

  it("onboardingPremiumD7 apunta a /panel/premium/secret", () => {
    const e = onboardingPremiumD7({ email: "x@test.com" });
    expect(e.html).toContain("/panel/premium/secret");
  });

  it("onboardingPremiumD14 cubre el flujo referidos", () => {
    const e = onboardingPremiumD14({ email: "x@test.com" });
    expect(e.html.toLowerCase()).toContain("referido");
    expect(e.html).toContain("1 mes gratis");
  });

  it("HTML emails incluyen unsubscribe placeholder", () => {
    const e = milestoneEmail({ email: "x@test.com", savingsEur: 100, tier: 100 });
    expect(e.html).toContain("{{unsubscribe_url}}");
  });

  it("text version no contiene HTML tags", () => {
    const e = milestoneEmail({ email: "x@test.com", savingsEur: 100, tier: 100 });
    expect(e.text).not.toContain("<");
    expect(e.text).not.toContain("</");
  });
});
