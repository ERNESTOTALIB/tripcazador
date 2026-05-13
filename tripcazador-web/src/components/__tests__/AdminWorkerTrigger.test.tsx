/**
 * @vitest-environment jsdom
 *
 * Tests para AdminWorkerTrigger — fase SSS153.
 *
 * Cubre:
 *   1. Render: muestra el botón
 *   2. Click: dispara fetch a /api/admin/trigger-worker
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AdminWorkerTrigger } from "../AdminWorkerTrigger";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

function getButton(container: HTMLElement): HTMLButtonElement {
  const btn = container.querySelector("button");
  if (!btn) throw new Error("button no encontrado");
  return btn;
}

describe("AdminWorkerTrigger", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("renderiza el botón con etiqueta inicial", async () => {
    const h = await mount(<AdminWorkerTrigger />);
    try {
      const btn = getButton(h.container);
      expect(btn.textContent).toMatch(/Trigger worker hunt now/);
      expect(btn.disabled).toBe(false);
    } finally {
      teardown(h);
    }
  });

  it("hace POST a /api/admin/trigger-worker al hacer click", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          message: "Workflow disparado. Espera 10-15 min para que aparezca commit nuevo en main.",
          actions_url: "https://github.com/ERNESTOTALIB/tripcazador/actions/workflows/worker.yml",
        }),
        { status: 202, headers: { "Content-Type": "application/json" } },
      ),
    );

    const h = await mount(<AdminWorkerTrigger />);
    try {
      const btn = getButton(h.container);
      await act(async () => {
        btn.click();
      });
      // Microtask flush para que la promesa fetch resuelva
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe("/api/admin/trigger-worker");
      expect((init as RequestInit).method).toBe("POST");

      // El mensaje de éxito debe aparecer
      const ok = h.container.querySelector('[data-testid="admin-worker-trigger-ok"]');
      expect(ok).toBeTruthy();
      expect(ok?.textContent).toMatch(/disparado/i);
    } finally {
      teardown(h);
    }
  });
});
