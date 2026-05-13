/**
 * Tests para /api/admin/trigger-worker — fase SSS153.
 *
 * Cubre los 3 paths críticos:
 *   1. Sin cookie de panel → 401
 *   2. Rate limit (2do click dentro de 10 min) → 429
 *   3. PAT configurado + GH 204 → 202 con ok:true
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "../route";
import { resetRateLimitForTests } from "@/lib/trigger_worker_ratelimit";
import { issueToken, buildSetCookieHeader, COOKIE_KEY } from "@/lib/panel_auth";

// Mock next/headers cookies() para inyectar la cookie de sesión por test
let mockCookieValue: string | undefined;
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (key: string) => (key === COOKIE_KEY ? { value: mockCookieValue } : undefined),
  }),
}));

function makeRequest(body: object = {}): import("next/server").NextRequest {
  // NextRequest acepta un standard Request + cosas extras. Para nuestro
  // endpoint solo usamos req.json(), así que un Request normal vale.
  const r = new Request("https://tripcazador.com/api/admin/trigger-worker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r as unknown as import("next/server").NextRequest;
}

describe("/api/admin/trigger-worker", () => {
  beforeEach(() => {
    mockCookieValue = undefined;
    resetRateLimitForTests();
    // Default: no PAT — los tests que lo necesitan lo setean
    delete process.env.GITHUB_PAT_TRIGGER_WORKER;
    // Silenciamos fetch por defecto — cada test lo mockea si lo necesita
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
    // buildSetCookieHeader sin uso pero importado para asegurarse de que
    // el módulo panel_auth está disponible
    void buildSetCookieHeader;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retorna 401 si no hay cookie de panel", async () => {
    process.env.GITHUB_PAT_TRIGGER_WORKER = "ghp_fake_should_not_matter";
    mockCookieValue = undefined;

    const resp = await POST(makeRequest());

    expect(resp.status).toBe(401);
    const data = await resp.json();
    expect(data.error).toBe("unauthorized");
  });

  it("retorna 429 al segundo trigger dentro de la ventana de 10 min", async () => {
    process.env.GITHUB_PAT_TRIGGER_WORKER = "ghp_fake_pat";
    mockCookieValue = issueToken("ewtalib");

    // Mock GitHub API → 204 No Content
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    ) as unknown as typeof fetch;

    // Primera llamada OK
    const first = await POST(makeRequest());
    expect(first.status).toBe(202);

    // Segunda llamada inmediata → 429
    const second = await POST(makeRequest());
    expect(second.status).toBe(429);
    const data = await second.json();
    expect(data.error).toBe("rate_limited");
    expect(data.retry_after_seconds).toBeGreaterThan(0);
    expect(second.headers.get("Retry-After")).toBeTruthy();
  });

  it("retorna 202 con ok:true cuando GitHub devuelve 204", async () => {
    process.env.GITHUB_PAT_TRIGGER_WORKER = "ghp_fake_pat_xyz";
    mockCookieValue = issueToken("ewtalib");

    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const resp = await POST(makeRequest());

    expect(resp.status).toBe(202);
    const data = await resp.json();
    expect(data.ok).toBe(true);
    expect(data.workflow).toBe("worker.yml");
    expect(data.actions_url).toContain("github.com");

    // Verifica que la llamada GH se hizo con el PAT y a la URL correcta
    expect(fetchMock).toHaveBeenCalledOnce();
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toContain("/actions/workflows/worker.yml/dispatches");
    const init = callArgs[1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toContain(
      "ghp_fake_pat_xyz",
    );
  });
});
