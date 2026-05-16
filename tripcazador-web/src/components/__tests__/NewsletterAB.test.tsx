/**
 * @vitest-environment jsdom
 *
 * NewsletterAB.test.tsx — SSS256 (16 may 2026)
 *
 * Tests para:
 *  - EXPERIMENTS.newsletter_widget_v1 (config catalog)
 *  - NewsletterRibbon (componente nuevo, variant B)
 *
 * Render manual con createRoot (mismo patrón que AlertsForm.test.tsx).
 */
import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { NewsletterRibbon } from "../NewsletterRibbon";
import { EXPERIMENTS } from "@/lib/ab";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Stub track_client (no networking in tests)
vi.mock("@/lib/track_client", () => ({
  tcTrack: vi.fn(),
}));

async function mount(node: React.ReactNode): Promise<HTMLDivElement> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  return container;
}

describe("EXPERIMENTS.newsletter_widget_v1", () => {
  it("existe en catalog", () => {
    expect(EXPERIMENTS.newsletter_widget_v1).toBeDefined();
  });

  it("shape válida (id+name+bWeight+defaultVariant)", () => {
    const e = EXPERIMENTS.newsletter_widget_v1;
    expect(e.id).toBe("newsletter_widget_v1");
    expect(e.name).toBeTruthy();
    expect(typeof e.bWeight).toBe("number");
    expect(e.bWeight).toBeGreaterThanOrEqual(0);
    expect(e.bWeight).toBeLessThanOrEqual(100);
    expect(["A", "B"]).toContain(e.defaultVariant);
  });

  it("50/50 split inicial (a validar tras N exposures)", () => {
    expect(EXPERIMENTS.newsletter_widget_v1.bWeight).toBe(50);
  });

  it("defaultVariant=A (forma actual inline form preserva UI)", () => {
    expect(EXPERIMENTS.newsletter_widget_v1.defaultVariant).toBe("A");
  });
});

describe("NewsletterRibbon component", () => {
  it("renderiza headline + CTA link", async () => {
    const container = await mount(<NewsletterRibbon />);
    expect(container.textContent).toMatch(/TOP 5 chollos/i);
    expect(container.textContent).toMatch(/Suscribirme/i);
  });

  it("CTA link apunta a /alertas", async () => {
    const container = await mount(<NewsletterRibbon />);
    const links = Array.from(container.querySelectorAll("a"));
    const ctaLink = links.find((a) => a.textContent?.includes("Suscribirme"));
    expect(ctaLink).toBeTruthy();
    expect(ctaLink?.getAttribute("href")).toBe("/alertas");
  });

  it("tiene aria-label para accessibility", async () => {
    const container = await mount(<NewsletterRibbon />);
    const aside = container.querySelector('aside[aria-label="Newsletter signup"]');
    expect(aside).toBeTruthy();
  });

  it("incluye trust copy 100% sin spam + gratuito", async () => {
    const container = await mount(<NewsletterRibbon />);
    expect(container.textContent).toMatch(/100% sin spam/i);
    expect(container.textContent).toMatch(/gratuito/i);
  });

  it("acepta prop context y renderiza sin error", async () => {
    const container = await mount(
      <NewsletterRibbon context="blog-post-marrakech" />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("uso emoji envelope visible (no escapado)", async () => {
    const container = await mount(<NewsletterRibbon />);
    expect(container.textContent).toContain("✉️");
  });
});
