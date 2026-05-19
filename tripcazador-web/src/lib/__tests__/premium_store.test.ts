/**
 * premium_store.test.ts — SSS240 (16 may 2026)
 *
 * Tests para lib/premium_store.ts (51 líneas, Stripe webhook revenue).
 *
 * Cubre:
 *  - upsertPremium: insert nuevo, update por email match, update por
 *    customer_id match, prefiere customer_id como key
 *  - deactivateByCustomerId: setea active=false, actualiza updated_at
 *  - getPremiumByEmail: solo retorna si active=true
 *  - globalThis persistence (HMR survival)
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  upsertPremium,
  deactivateByCustomerId,
  getPremiumByEmail,
  markCancelScheduled,
  clearCancelScheduled,
  type PremiumStateEntry,
} from "../premium_store";

// Reset globalThis store entre tests
beforeEach(() => {
  const g = globalThis as unknown as {
    __tc_premium_store?: { entries: PremiumStateEntry[] };
  };
  if (g.__tc_premium_store) {
    g.__tc_premium_store.entries = [];
  }
});

function entry(
  email: string,
  customer_id: string,
  active: boolean = true,
): PremiumStateEntry {
  return {
    email,
    customer_id,
    subscription_id: `sub_${customer_id}`,
    active,
    expires_at: Date.now() + 30 * 86400000,
    source: "stripe",
    updated_at: Date.now(),
  };
}

describe("upsertPremium", () => {
  it("inserta nueva entry si no existe", () => {
    upsertPremium(entry("user1@example.com", "cus_111"));
    const found = getPremiumByEmail("user1@example.com");
    expect(found).not.toBeNull();
    expect(found?.customer_id).toBe("cus_111");
    expect(found?.active).toBe(true);
  });

  it("update por email match (mismo email, diff customer_id pero igual)", () => {
    upsertPremium(entry("dup@example.com", "cus_a"));
    upsertPremium({
      ...entry("dup@example.com", "cus_a"),
      subscription_id: "sub_updated",
    });

    const found = getPremiumByEmail("dup@example.com");
    expect(found?.subscription_id).toBe("sub_updated");

    const g = globalThis as unknown as {
      __tc_premium_store: { entries: PremiumStateEntry[] };
    };
    expect(g.__tc_premium_store.entries).toHaveLength(1); // no duplicado
  });

  it("update por customer_id match (mismo cus_, email cambia)", () => {
    upsertPremium(entry("old@example.com", "cus_same"));
    upsertPremium(entry("new@example.com", "cus_same"));

    const g = globalThis as unknown as {
      __tc_premium_store: { entries: PremiumStateEntry[] };
    };
    // Solo 1 entry porque match por customer_id
    expect(g.__tc_premium_store.entries).toHaveLength(1);
    // El email final es el del 2do upsert (spread)
    expect(g.__tc_premium_store.entries[0].email).toBe("new@example.com");
  });

  it("inserts independientes con diff email + diff customer_id", () => {
    upsertPremium(entry("a@a.com", "cus_a"));
    upsertPremium(entry("b@b.com", "cus_b"));
    upsertPremium(entry("c@c.com", "cus_c"));

    const g = globalThis as unknown as {
      __tc_premium_store: { entries: PremiumStateEntry[] };
    };
    expect(g.__tc_premium_store.entries).toHaveLength(3);
  });
});

describe("deactivateByCustomerId", () => {
  it("setea active=false y actualiza updated_at", () => {
    upsertPremium(entry("act@example.com", "cus_active"));
    const before = getPremiumByEmail("act@example.com");
    expect(before?.active).toBe(true);
    const oldUpdated = before?.updated_at || 0;

    // Esperar 2ms para timestamp diff
    const tick = () => new Promise((r) => setTimeout(r, 2));
    return tick().then(() => {
      deactivateByCustomerId("cus_active");
      // Después de deactivate, getPremiumByEmail debe devolver null (active=false)
      expect(getPremiumByEmail("act@example.com")).toBeNull();

      const g = globalThis as unknown as {
        __tc_premium_store: { entries: PremiumStateEntry[] };
      };
      const entryRaw = g.__tc_premium_store.entries.find(
        (e) => e.customer_id === "cus_active",
      );
      expect(entryRaw?.active).toBe(false);
      expect(entryRaw?.updated_at).toBeGreaterThan(oldUpdated);
    });
  });

  it("no-op si customer_id no existe", () => {
    // No throw
    expect(() => deactivateByCustomerId("cus_ghost")).not.toThrow();
  });
});

describe("getPremiumByEmail — only returns active", () => {
  it("retorna null si email no existe", () => {
    expect(getPremiumByEmail("ghost@example.com")).toBeNull();
  });

  it("retorna entry si active=true", () => {
    upsertPremium(entry("live@example.com", "cus_l"));
    const found = getPremiumByEmail("live@example.com");
    expect(found).not.toBeNull();
    expect(found?.active).toBe(true);
  });

  it("retorna null si entry existe pero active=false", () => {
    upsertPremium(entry("dead@example.com", "cus_d", false));
    expect(getPremiumByEmail("dead@example.com")).toBeNull();
  });

  it("retorna entry correcta cuando hay varias", () => {
    upsertPremium(entry("u1@example.com", "cus_1"));
    upsertPremium(entry("u2@example.com", "cus_2"));
    upsertPremium(entry("u3@example.com", "cus_3"));

    const u2 = getPremiumByEmail("u2@example.com");
    expect(u2?.customer_id).toBe("cus_2");
  });
});

describe("markCancelScheduled + clearCancelScheduled SSS324", () => {
  it("markCancelScheduled setea cancel_at en entry existente", () => {
    upsertPremium(entry("schedcancel@example.com", "cus_sc1"));
    const cancelAt = Date.now() + 15 * 86_400_000;
    markCancelScheduled("cus_sc1", cancelAt);
    const g = globalThis as unknown as {
      __tc_premium_store: { entries: PremiumStateEntry[] };
    };
    const raw = g.__tc_premium_store.entries.find((e) => e.customer_id === "cus_sc1");
    expect(raw?.cancel_at).toBe(cancelAt);
    expect(raw?.active).toBe(true); // sigue activo hasta cancel_at
  });

  it("markCancelScheduled no-op si customer no existe (no throw)", () => {
    expect(() => markCancelScheduled("cus_phantom01", Date.now())).not.toThrow();
  });

  it("clearCancelScheduled elimina cancel_at (user reactivó)", () => {
    upsertPremium({
      ...entry("reactiv@example.com", "cus_r1"),
      cancel_at: Date.now() + 86_400_000,
    });
    clearCancelScheduled("cus_r1");
    const g = globalThis as unknown as {
      __tc_premium_store: { entries: PremiumStateEntry[] };
    };
    const raw = g.__tc_premium_store.entries.find((e) => e.customer_id === "cus_r1");
    expect(raw?.cancel_at).toBeUndefined();
  });

  it("clearCancelScheduled no-op si cancel_at ya no estaba", () => {
    upsertPremium(entry("normal@example.com", "cus_n1"));
    expect(() => clearCancelScheduled("cus_n1")).not.toThrow();
  });

  it("clearCancelScheduled no-op si customer no existe", () => {
    expect(() => clearCancelScheduled("cus_ghost99")).not.toThrow();
  });
});

describe("globalThis persistence", () => {
  it("store vive en globalThis.__tc_premium_store", () => {
    upsertPremium(entry("g@g.com", "cus_g"));
    const g = globalThis as unknown as {
      __tc_premium_store: { entries: PremiumStateEntry[] };
    };
    expect(g.__tc_premium_store).toBeDefined();
    expect(g.__tc_premium_store.entries.length).toBeGreaterThanOrEqual(1);
  });
});
