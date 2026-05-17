/**
 * PremiumInlineCTA.test.tsx — SSS276 (17 may 2026)
 *
 * Verifica renders por variant + no-render si user es Premium activo.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { PremiumInlineCTA } from "../PremiumInlineCTA";

vi.mock("@/lib/premium", () => ({
  getPremiumStatus: vi.fn(() => ({
    active: false,
    tier: "free",
    source: "manual",
  })),
}));

vi.mock("@/lib/track_client", () => ({
  tcTrack: vi.fn(),
  tcTrackOnce: vi.fn(),
}));

beforeEach(() => {
  document.body.innerHTML = "";
});

async function renderCTA(props: { source: string; variant?: "card" | "banner" | "minimal" }) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<PremiumInlineCTA {...props} />);
  });
  return container;
}

describe("PremiumInlineCTA", () => {
  it("variant card: renderiza con título por defecto", async () => {
    const el = await renderCTA({ source: "home-mid" });
    expect(el.textContent).toMatch(/Premium/i);
    expect(el.textContent).toMatch(/€9.99/);
    expect(el.querySelector("button")).toBeTruthy();
  });

  it("variant banner: renderiza compact", async () => {
    const el = await renderCTA({ source: "deals", variant: "banner" });
    expect(el.textContent).toMatch(/Premium/i);
    expect(el.querySelector("button")).toBeTruthy();
  });

  it("variant minimal: solo link discreto", async () => {
    const el = await renderCTA({ source: "footer", variant: "minimal" });
    expect(el.querySelector("button")).toBeTruthy();
    expect(el.textContent).toMatch(/Premium/i);
  });

  it("usuario Premium activo → no render (null)", async () => {
    const { getPremiumStatus } = await import("@/lib/premium");
    vi.mocked(getPremiumStatus).mockReturnValueOnce({
      active: true,
      tier: "premium",
      source: "stripe",
    });
    const el = await renderCTA({ source: "home" });
    // Component returns null → container vacío
    expect(el.querySelector("button")).toBeNull();
  });
});
