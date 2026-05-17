/**
 * ConciergeInlineCTA.test.tsx — SSS281 (17 may 2026)
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { ConciergeInlineCTA } from "../ConciergeInlineCTA";

vi.mock("@/lib/track_client", () => ({
  tcTrack: vi.fn(),
  tcTrackOnce: vi.fn(),
}));

beforeEach(() => {
  document.body.innerHTML = "";
});

async function render(props: {
  source: string;
  variant?: "card" | "banner" | "minimal";
  highlightTier?: "express" | "standard" | "premium" | "pro";
}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<ConciergeInlineCTA {...props} />);
  });
  return container;
}

describe("ConciergeInlineCTA", () => {
  it("variant card + standard tier: muestra €19", async () => {
    const el = await render({ source: "blog", variant: "card" });
    expect(el.textContent).toMatch(/€19/);
    expect(el.textContent).toMatch(/Standard/i);
  });

  it("variant banner + express tier: muestra €9 + 24h", async () => {
    const el = await render({
      source: "deal",
      variant: "banner",
      highlightTier: "express",
    });
    expect(el.textContent).toMatch(/€9/);
    expect(el.textContent).toMatch(/24h/);
  });

  it("variant minimal: link discreto", async () => {
    const el = await render({ source: "footer", variant: "minimal" });
    const button = el.querySelector("button");
    expect(button).toBeTruthy();
    expect(button!.textContent).toMatch(/Concierge|busco/i);
  });

  it("highlightTier pro: muestra €99 + 120h", async () => {
    const el = await render({
      source: "deal",
      variant: "card",
      highlightTier: "pro",
    });
    expect(el.textContent).toMatch(/€99/);
    expect(el.textContent).toMatch(/120h/);
  });
});
