/**
 * /api/admin/referral/mark-rewarded route.test.ts — SSS321
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet })),
}));
vi.mock("@/lib/panel_auth", () => ({
  COOKIE_KEY: "tc_panel_session",
  verifyToken: vi.fn(() => null), // por defecto no hay session válida
}));

import { NextRequest } from "next/server";
import { POST } from "../route";
import {
  redeemReferral,
  deriveCodeFromCustomer,
  listReferralsByReferrer,
  _clearStore,
} from "@/lib/referral_store";

const REFERRER = "cus_ALICE0000001";
const REFERRED = "cus_BOB000000001";

function postReq(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/admin/referral/mark-rewarded", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/referral/mark-rewarded SSS321", () => {
  const ORIG_TOKEN = process.env.ADMIN_TOKEN;
  beforeEach(() => {
    _clearStore();
    mockCookieGet.mockReset();
    mockCookieGet.mockReturnValue(undefined);
    process.env.ADMIN_TOKEN = "test_admin_token";
  });
  afterEach(() => {
    if (ORIG_TOKEN === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = ORIG_TOKEN;
  });

  it("401 sin auth", async () => {
    const res = await POST(postReq({ id: "rf_xyz" }));
    expect(res.status).toBe(401);
  });

  it("401 con Bearer incorrecto", async () => {
    const res = await POST(
      postReq({ id: "rf_xyz" }, { authorization: "Bearer wrong" }),
    );
    expect(res.status).toBe(401);
  });

  it("400 id mal formado (con auth válida)", async () => {
    const res = await POST(
      postReq(
        { id: "not_a_valid_id" },
        { authorization: "Bearer test_admin_token" },
      ),
    );
    expect(res.status).toBe(400);
  });

  it("404 si id no existe", async () => {
    const res = await POST(
      postReq({ id: "rf_nonexistent" }, { authorization: "Bearer test_admin_token" }),
    );
    expect(res.status).toBe(404);
  });

  it("200 marca rewarded_at en entry existente", async () => {
    const code = deriveCodeFromCustomer(REFERRER);
    const ref = await redeemReferral({
      referrer_customer_id: REFERRER,
      referred_customer_id: REFERRED,
      code,
    });
    expect(ref.rewarded_at).toBeNull();

    const res = await POST(
      postReq({ id: ref.id }, { authorization: "Bearer test_admin_token" }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    const list = await listReferralsByReferrer(REFERRER);
    expect(list[0].rewarded_at).toBeTypeOf("number");
  });

  it("200 idempotente: marcar ya rewarded no cambia el timestamp", async () => {
    const code = deriveCodeFromCustomer(REFERRER);
    const ref = await redeemReferral({
      referrer_customer_id: REFERRER,
      referred_customer_id: REFERRED,
      code,
    });
    await POST(
      postReq({ id: ref.id }, { authorization: "Bearer test_admin_token" }),
    );
    const list1 = await listReferralsByReferrer(REFERRER);
    const firstTs = list1[0].rewarded_at;
    await new Promise((r) => setTimeout(r, 5));
    const res = await POST(
      postReq({ id: ref.id }, { authorization: "Bearer test_admin_token" }),
    );
    expect(res.status).toBe(200);
    const list2 = await listReferralsByReferrer(REFERRER);
    expect(list2[0].rewarded_at).toBe(firstTs);
  });
});
