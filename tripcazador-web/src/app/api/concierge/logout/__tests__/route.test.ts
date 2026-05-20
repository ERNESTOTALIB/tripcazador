/**
 * /api/concierge/logout route.test.ts — SSS332
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: mockCookieSet, get: mockCookieGet })),
}));

import { POST } from "../route";

describe("POST /api/concierge/logout SSS332", () => {
  beforeEach(() => {
    mockCookieSet.mockReset();
    mockCookieGet.mockReset();
  });

  it("200 ok + cookie clearing call", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(mockCookieSet).toHaveBeenCalledWith(
      "tc_concierge_portal",
      "",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        maxAge: 0,
      }),
    );
  });

  it("cookie clearing usa path /concierge (scope al portal)", async () => {
    await POST();
    const call = mockCookieSet.mock.calls[0];
    expect(call[2].path).toBe("/concierge");
  });
});
