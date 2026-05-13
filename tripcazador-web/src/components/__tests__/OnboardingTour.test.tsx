/**
 * @vitest-environment jsdom
 *
 * SSS157 — Unit tests del OnboardingTour (fix opt-in del bug SSS156).
 *
 * El modal solía aparecer auto a los 3s con fixed inset-0 z-[9999] y
 * atrapaba wheel events → scroll bloqueado. Ahora es opt-in via ?tour=1.
 *
 * Esta suite verifica:
 *   1. En home sin query string → modal NUNCA se renderiza.
 *   2. En home con ?tour=1 → modal SÍ se renderiza tras delay corto.
 *   3. En rutas que no son `/` ni `/en` → modal nunca aparece.
 *   4. Si localStorage tiene la flag de "ya onboarded" → modal nunca.
 *
 * Render manual con createRoot (sin @testing-library/dom — mismo patrón
 * que AlertsForm.test.tsx).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Mock usePathname para controlar la ruta en cada test.
let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

// Import después del mock
import { OnboardingTour } from "../OnboardingTour";

function findDialog(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[role="dialog"]') as HTMLElement | null;
}

let container: HTMLDivElement;
let root: Root;

function setSearch(s: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    configurable: true,
    value: { search: s, pathname: mockPathname },
  });
}

describe("OnboardingTour (SSS156 opt-in)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    mockPathname = "/";
    setSearch("");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  it("NO aparece en home sin ?tour=1 (anti-regresión SSS156)", () => {
    act(() => {
      root.render(<OnboardingTour />);
    });
    // Avanzar 5 segundos (más del antiguo delay de 3s) — modal NO debe aparecer
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(
      findDialog(container),
      "Modal NO debe aparecer en home sin ?tour=1 — atraparía wheel events",
    ).toBeNull();
  });

  it("SÍ aparece en home con ?tour=1 (opt-in funciona)", () => {
    setSearch("?tour=1");
    act(() => {
      root.render(<OnboardingTour />);
    });
    // Delay opt-in es 800ms
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(
      findDialog(container),
      "Con ?tour=1 el modal SÍ debe aparecer (link explícito de marketing)",
    ).not.toBeNull();
  });

  it("NO aparece en rutas que no son '/' ni '/en'", () => {
    mockPathname = "/deals";
    setSearch("?tour=1");
    act(() => {
      root.render(<OnboardingTour />);
    });
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(
      findDialog(container),
      "OnboardingTour es solo para landings (/, /en) — no debería aparecer en /deals",
    ).toBeNull();
  });

  it("NO aparece si localStorage tiene tc_onboarded_v1 (returning user)", () => {
    localStorage.setItem("tc_onboarded_v1", "1");
    setSearch("?tour=1");
    act(() => {
      root.render(<OnboardingTour />);
    });
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(
      findDialog(container),
      "Si el usuario ya hizo onboarding, no se le bombardea otra vez",
    ).toBeNull();
  });

  it("SÍ aparece en /en con ?tour=1", () => {
    mockPathname = "/en";
    setSearch("?tour=1");
    act(() => {
      root.render(<OnboardingTour />);
    });
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(
      findDialog(container),
      "OnboardingTour activo en /en también",
    ).not.toBeNull();
  });
});
