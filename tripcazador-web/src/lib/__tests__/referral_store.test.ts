/**
 * referral_store.test.ts — SSS320 (19 may 2026)
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  deriveCodeFromCustomer,
  isValidCodeFormat,
  redeemReferral,
  listReferralsByReferrer,
  listReferralsByReferred,
  markReferralRewarded,
  ReferralError,
  REFERRAL_CAP_PER_CUSTOMER,
  _clearStore,
} from "../referral_store";

const REFERRER = "cus_ALICE0000001";
const REFERRED = "cus_BOB000000001";

describe("deriveCodeFromCustomer SSS320", () => {
  it("genera código TC-XXXXXXXX determinista", () => {
    const a = deriveCodeFromCustomer(REFERRER);
    const b = deriveCodeFromCustomer(REFERRER);
    expect(a).toBe(b);
    expect(a).toMatch(/^TC-[0-9A-Z]{8}$/);
  });

  it("códigos diferentes para customers diferentes", () => {
    const a = deriveCodeFromCustomer(REFERRER);
    const b = deriveCodeFromCustomer(REFERRED);
    expect(a).not.toBe(b);
  });

  it("rechaza customerId inválido", () => {
    expect(() => deriveCodeFromCustomer("junk")).toThrow(ReferralError);
  });
});

describe("isValidCodeFormat SSS320", () => {
  it("acepta formato correcto", () => {
    expect(isValidCodeFormat("TC-ABCDEF12")).toBe(true);
    expect(isValidCodeFormat("TC-00000000")).toBe(true);
  });

  it("rechaza formatos malos", () => {
    expect(isValidCodeFormat("ABCDEFGH")).toBe(false);
    expect(isValidCodeFormat("TC-abcdef12")).toBe(false); // minúsculas
    expect(isValidCodeFormat("TC-ABC")).toBe(false); // corto
    expect(isValidCodeFormat("")).toBe(false);
  });
});

describe("redeemReferral SSS320", () => {
  beforeEach(() => _clearStore());

  it("201 crea referral válido", async () => {
    const code = deriveCodeFromCustomer(REFERRER);
    const r = await redeemReferral({
      referrer_customer_id: REFERRER,
      referred_customer_id: REFERRED,
      code,
    });
    expect(r.id).toMatch(/^rf_/);
    expect(r.referrer_customer_id).toBe(REFERRER);
    expect(r.referred_customer_id).toBe(REFERRED);
    expect(r.rewarded_at).toBeNull();
  });

  it("rechaza self-referral", async () => {
    const code = deriveCodeFromCustomer(REFERRER);
    await expect(
      redeemReferral({
        referrer_customer_id: REFERRER,
        referred_customer_id: REFERRER,
        code,
      }),
    ).rejects.toThrow(ReferralError);
  });

  it("rechaza code que no matchea el referrer", async () => {
    const wrongCode = deriveCodeFromCustomer(REFERRED);
    await expect(
      redeemReferral({
        referrer_customer_id: REFERRER,
        referred_customer_id: REFERRED,
        code: wrongCode,
      }),
    ).rejects.toThrow(ReferralError);
  });

  it("rechaza referred ya usado", async () => {
    const code = deriveCodeFromCustomer(REFERRER);
    await redeemReferral({
      referrer_customer_id: REFERRER,
      referred_customer_id: REFERRED,
      code,
    });
    await expect(
      redeemReferral({
        referrer_customer_id: REFERRER,
        referred_customer_id: REFERRED,
        code,
      }),
    ).rejects.toThrow(ReferralError);
  });

  it("rechaza customer ids inválidos", async () => {
    await expect(
      redeemReferral({
        referrer_customer_id: "junk",
        referred_customer_id: REFERRED,
        code: "TC-ABCD1234",
      }),
    ).rejects.toThrow(ReferralError);
  });

  it("rechaza code mal formado", async () => {
    await expect(
      redeemReferral({
        referrer_customer_id: REFERRER,
        referred_customer_id: REFERRED,
        code: "invalid",
      }),
    ).rejects.toThrow(ReferralError);
  });

  it("enforces cap por referrer", async () => {
    const code = deriveCodeFromCustomer(REFERRER);
    for (let i = 0; i < REFERRAL_CAP_PER_CUSTOMER; i++) {
      await redeemReferral({
        referrer_customer_id: REFERRER,
        referred_customer_id: `cus_REF${String(i).padStart(8, "0")}`,
        code,
      });
    }
    await expect(
      redeemReferral({
        referrer_customer_id: REFERRER,
        referred_customer_id: "cus_OVERFLOW01",
        code,
      }),
    ).rejects.toThrow(/cap_reached/);
  });

  it("markReferralRewarded SSS321: setea rewarded_at + idempotente", async () => {
    const code = deriveCodeFromCustomer(REFERRER);
    const ref = await redeemReferral({
      referrer_customer_id: REFERRER,
      referred_customer_id: REFERRED,
      code,
    });
    expect(ref.rewarded_at).toBeNull();

    const ok1 = await markReferralRewarded(ref.id);
    expect(ok1).toBe(true);
    const after = await listReferralsByReferrer(REFERRER);
    const ts = after[0].rewarded_at;
    expect(ts).toBeTypeOf("number");

    // Idempotente
    await new Promise((r) => setTimeout(r, 5));
    const ok2 = await markReferralRewarded(ref.id);
    expect(ok2).toBe(true);
    const after2 = await listReferralsByReferrer(REFERRER);
    expect(after2[0].rewarded_at).toBe(ts);
  });

  it("markReferralRewarded SSS321: false si id no existe", async () => {
    const ok = await markReferralRewarded("rf_doesnotexist");
    expect(ok).toBe(false);
  });

  it("list filtra por referrer y por referred", async () => {
    const code = deriveCodeFromCustomer(REFERRER);
    await redeemReferral({
      referrer_customer_id: REFERRER,
      referred_customer_id: REFERRED,
      code,
    });
    const byReferrer = await listReferralsByReferrer(REFERRER);
    expect(byReferrer.length).toBe(1);
    const byReferred = await listReferralsByReferred(REFERRED);
    expect(byReferred.length).toBe(1);
    const empty = await listReferralsByReferrer("cus_NOONE000001");
    expect(empty.length).toBe(0);
  });
});
