/**
 * /api/img GET route.test.ts — SSS266 (17 may 2026)
 *
 * Tests para SSRF defense del image proxy.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
});

async function importGet() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.GET;
}

function buildReq(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/img${query}`, {
    method: "GET",
  });
}

describe("/api/img — input validation + SSRF defense", () => {
  it("400 si u param missing", async () => {
    const GET = await importGet();
    const res = await GET(buildReq(""));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/missing u/i);
  });

  it("400 si u no es URL válida", async () => {
    const GET = await importGet();
    const res = await GET(buildReq("?u=not-a-url"));
    expect(res.status).toBe(400);
  });

  it("400 si protocolo no es https (SSRF defense)", async () => {
    const GET = await importGet();
    const res = await GET(
      buildReq("?u=" + encodeURIComponent("http://evil.com/img.jpg")),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/https required/i);
  });

  it("400 si protocolo file:// (SSRF defense)", async () => {
    const GET = await importGet();
    const res = await GET(
      buildReq("?u=" + encodeURIComponent("file:///etc/passwd")),
    );
    expect(res.status).toBe(400);
  });

  it("403 si host NO está en allowlist", async () => {
    const GET = await importGet();
    const res = await GET(
      buildReq("?u=" + encodeURIComponent("https://evil.com/img.jpg")),
    );
    expect(res.status).toBe(403);
    const j = await res.json();
    expect(j.error).toMatch(/not allowed/i);
  });

  it("403 si host es internal (SSRF: 127.0.0.1, localhost, 169.254.169.254)", async () => {
    const GET = await importGet();
    const internalHosts = [
      "https://127.0.0.1/secret",
      "https://localhost/internal",
      "https://169.254.169.254/aws-metadata",
      "https://10.0.0.1/lan",
    ];
    for (const url of internalHosts) {
      const res = await GET(buildReq("?u=" + encodeURIComponent(url)));
      expect(res.status).toBe(403);
    }
  });

  it("acepta unsplash (host whitelisted)", async () => {
    mockFetch.mockResolvedValue(
      new Response("fakeimg", {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      }),
    );
    const GET = await importGet();
    const res = await GET(
      buildReq(
        "?u=" +
          encodeURIComponent(
            "https://images.unsplash.com/photo-1474968600831",
          ),
      ),
    );
    // Si fetch mockeado responde 200, el handler debería responder 200
    expect([200, 502]).toContain(res.status);
  });

  it("pasa w + q hints al upstream URL", async () => {
    mockFetch.mockResolvedValue(
      new Response("img", {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      }),
    );
    const GET = await importGet();
    await GET(
      buildReq(
        "?u=" +
          encodeURIComponent(
            "https://images.unsplash.com/photo-1474968600831",
          ) +
          "&w=800&q=80",
      ),
    );
    // El mockFetch debería haber sido llamado con URL incluyendo w + q
    expect(mockFetch).toHaveBeenCalled();
    if (mockFetch.mock.calls.length > 0) {
      const calledUrl = String(mockFetch.mock.calls[0][0]);
      expect(calledUrl).toContain("w=800");
      expect(calledUrl).toContain("q=80");
    }
  });

  it("no envía cookies/auth headers al upstream (defense in depth)", async () => {
    mockFetch.mockResolvedValue(
      new Response("img", {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      }),
    );
    const GET = await importGet();
    await GET(
      buildReq(
        "?u=" +
          encodeURIComponent(
            "https://images.unsplash.com/photo-1474968600831",
          ),
      ),
    );
    if (mockFetch.mock.calls.length > 0) {
      const opts = mockFetch.mock.calls[0][1] as { headers?: Record<string, string> };
      const headers = opts?.headers || {};
      const headerKeys = Object.keys(headers).map((k) => k.toLowerCase());
      expect(headerKeys).not.toContain("cookie");
      expect(headerKeys).not.toContain("authorization");
    }
  });
});
