/**
 * @vitest-environment jsdom
 *
 * Tests for AlertsForm — fase SSS152.
 *
 * Render manual con ReactDOM.createRoot (sin @testing-library/dom que no
 * está instalado en este repo). Cubre:
 *
 * 1. Render: muestra todos los campos
 * 2. Validación IATA: rechaza origen no-IATA
 * 3. Validación email: rechaza email vacío
 * 4. Submit OK: hace POST con payload correcto y muestra success
 * 5. Submit 400: muestra mensaje de error
 * 6. Validación precio: rechaza precio 0
 * 7. Quick-fill: botón ejemplo rellena los campos
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AlertsForm } from "../AlertsForm";

// React requiere IS_REACT_ACT_ENVIRONMENT=true para suprimir warnings de
// act() en jsdom. testing-library/react lo hace automáticamente pero
// nosotros usamos createRoot directo.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Stub track_client (no-op networking in tests)
vi.mock("@/lib/track_client", () => ({
  tcTrack: vi.fn(),
}));

interface Harness {
  container: HTMLDivElement;
  root: Root;
}

async function mount(node: React.ReactNode): Promise<Harness> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  return { container, root };
}

function teardown({ container, root }: Harness) {
  act(() => {
    root.unmount();
  });
  container.remove();
}

async function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  await act(async () => {
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function getInputByLabel(container: HTMLElement, labelRe: RegExp): HTMLInputElement {
  const labels = Array.from(container.querySelectorAll("label"));
  const label = labels.find((l) => labelRe.test(l.textContent || ""));
  if (!label) throw new Error(`label not found: ${labelRe}`);
  const id = label.getAttribute("for");
  if (!id) throw new Error(`label sin for: ${label.textContent}`);
  const input = container.querySelector(`#${id}`);
  if (!input) throw new Error(`input #${id} not found`);
  return input as HTMLInputElement;
}

function getButtonByText(container: HTMLElement, re: RegExp): HTMLButtonElement {
  const buttons = Array.from(container.querySelectorAll("button"));
  const btn = buttons.find((b) => re.test(b.textContent || ""));
  if (!btn) throw new Error(`button no encontrado: ${re}`);
  return btn as HTMLButtonElement;
}

async function clickAndFlush(btn: HTMLButtonElement) {
  await act(async () => {
    btn.click();
  });
  // Espera 1 tick adicional para microtasks de la promesa fetch
  await act(async () => {
    await Promise.resolve();
  });
}

describe("AlertsForm", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("renderiza todos los campos del formulario", async () => {
    const h = await mount(<AlertsForm />);
    try {
      expect(getInputByLabel(h.container, /Origen \(IATA/)).toBeTruthy();
      expect(getInputByLabel(h.container, /Destino \(IATA/)).toBeTruthy();
      expect(getInputByLabel(h.container, /Precio objetivo/)).toBeTruthy();
      expect(getInputByLabel(h.container, /Tu email/)).toBeTruthy();
      expect(getButtonByText(h.container, /Crear alerta gratis/)).toBeTruthy();
    } finally {
      teardown(h);
    }
  });

  it("rechaza submit cuando el origen no es IATA válido", async () => {
    const h = await mount(<AlertsForm />);
    try {
      await setInputValue(getInputByLabel(h.container, /Origen/), "MA");
      await setInputValue(getInputByLabel(h.container, /Destino/), "NRT");
      await setInputValue(getInputByLabel(h.container, /Precio/), "450");
      await setInputValue(getInputByLabel(h.container, /Tu email/), "x@y.com");
      await clickAndFlush(getButtonByText(h.container, /Crear alerta gratis/));
      const err = h.container.querySelector('[data-testid="alerts-form-error"]');
      expect(err).toBeTruthy();
      expect(err?.textContent?.toLowerCase()).toMatch(/origen/);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      teardown(h);
    }
  });

  it("rechaza submit cuando el email está vacío", async () => {
    const h = await mount(<AlertsForm />);
    try {
      await setInputValue(getInputByLabel(h.container, /Origen/), "MAD");
      await setInputValue(getInputByLabel(h.container, /Destino/), "NRT");
      await setInputValue(getInputByLabel(h.container, /Precio/), "450");
      await setInputValue(getInputByLabel(h.container, /Tu email/), "");
      await clickAndFlush(getButtonByText(h.container, /Crear alerta gratis/));
      const err = h.container.querySelector('[data-testid="alerts-form-error"]');
      expect(err).toBeTruthy();
      expect(err?.textContent?.toLowerCase()).toMatch(/email/);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      teardown(h);
    }
  });

  it("rechaza submit cuando el precio es 0", async () => {
    const h = await mount(<AlertsForm />);
    try {
      await setInputValue(getInputByLabel(h.container, /Origen/), "MAD");
      await setInputValue(getInputByLabel(h.container, /Destino/), "NRT");
      await setInputValue(getInputByLabel(h.container, /Precio/), "0");
      await setInputValue(getInputByLabel(h.container, /Tu email/), "x@y.com");
      await clickAndFlush(getButtonByText(h.container, /Crear alerta gratis/));
      const err = h.container.querySelector('[data-testid="alerts-form-error"]');
      expect(err).toBeTruthy();
      expect(err?.textContent?.toLowerCase()).toMatch(/precio/);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      teardown(h);
    }
  });

  it("hace POST con payload correcto y muestra success tras 200", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, id: "alert_abc" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const h = await mount(<AlertsForm />);
    try {
      await setInputValue(getInputByLabel(h.container, /Origen/), "MAD");
      await setInputValue(getInputByLabel(h.container, /Destino/), "NRT");
      await setInputValue(getInputByLabel(h.container, /Precio/), "450");
      await setInputValue(getInputByLabel(h.container, /Tu email/), "u@example.com");
      await clickAndFlush(getButtonByText(h.container, /Crear alerta gratis/));

      // Espera otro tick para que el setState success se propague
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const success = h.container.querySelector('[data-testid="alerts-form-success"]');
      expect(success).toBeTruthy();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe("/api/price-alerts");
      expect((opts as RequestInit).method).toBe("POST");
      const body = JSON.parse((opts as RequestInit).body as string);
      expect(body).toEqual({
        origin: "MAD",
        destination: "NRT",
        max_price: 450,
        email: "u@example.com",
        cabin: "economy",
      });
    } finally {
      teardown(h);
    }
  });

  it("muestra error state tras 400", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false, error: "email_invalid" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const h = await mount(<AlertsForm />);
    try {
      await setInputValue(getInputByLabel(h.container, /Origen/), "MAD");
      await setInputValue(getInputByLabel(h.container, /Destino/), "NRT");
      await setInputValue(getInputByLabel(h.container, /Precio/), "450");
      await setInputValue(getInputByLabel(h.container, /Tu email/), "valid@email.com");
      await clickAndFlush(getButtonByText(h.container, /Crear alerta gratis/));

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const err = h.container.querySelector('[data-testid="alerts-form-error"]');
      expect(err).toBeTruthy();
      expect(err?.textContent?.toLowerCase()).toMatch(/no pudimos crear/);
    } finally {
      teardown(h);
    }
  });

  it("ejemplo rápido rellena origen + destino + precio", async () => {
    const h = await mount(<AlertsForm />);
    try {
      const exampleBtn = getButtonByText(h.container, /MAD → NRT/);
      await act(async () => {
        exampleBtn.click();
      });
      const origin = getInputByLabel(h.container, /Origen/);
      const dest = getInputByLabel(h.container, /Destino/);
      const price = getInputByLabel(h.container, /Precio/);
      expect(origin.value).toBe("MAD");
      expect(dest.value).toBe("NRT");
      expect(price.value).toBe("450");
    } finally {
      teardown(h);
    }
  });
});
