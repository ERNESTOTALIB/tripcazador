import { describe, it, expect, beforeEach } from "vitest";
import {
  SPONSOR_TIERS,
  SPONSOR_TIER_SLUGS,
  getSponsorTier,
  recordSponsorActivation,
  getSponsorBySessionId,
  updateSponsorStatus,
  deleteSponsor,
  getActiveSponsors,
  incrementSponsorClicks,
  getSponsorStats,
  pickSponsorForSlot,
  toSponsorPublic,
  type SponsorActive,
} from "@/lib/sponsors_catalog";
import { __resetKVForTests } from "@/lib/kv_store";

beforeEach(() => {
  __resetKVForTests();
});

describe("SPONSOR_TIERS catalog", () => {
  it("contiene los 3 tiers esperados", () => {
    expect(SPONSOR_TIERS.length).toBe(3);
    expect(SPONSOR_TIER_SLUGS).toEqual(["inline", "newsletter", "deal_week"]);
  });

  it("cada tier tiene precio, duración y price ID env", () => {
    SPONSOR_TIERS.forEach((t) => {
      expect(t.priceEur).toBeGreaterThan(0);
      expect(t.durationDays).toBeGreaterThan(0);
      expect(t.envPriceId).toMatch(/^STRIPE_PRICE_SPONSOR_/);
      expect(t.features.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("getSponsorTier resuelve por slug", () => {
    expect(getSponsorTier("inline")?.name).toBe("Inline");
    expect(getSponsorTier("does-not-exist")).toBeUndefined();
  });

  it("Newsletter es el highlighted (más popular)", () => {
    const highlighted = SPONSOR_TIERS.filter((t) => t.highlighted);
    expect(highlighted.length).toBe(1);
    expect(highlighted[0].slug).toBe("newsletter");
  });
});

describe("sponsor KV CRUD", () => {
  const sample: SponsorActive = {
    sessionId: "cs_test_abc123",
    tier: "inline",
    brand: "Acme Travel",
    url: "https://acme.example.com",
    contactEmail: "partners@acme.example.com",
    activatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400_000).toISOString(),
    status: "pending_review",
  };

  it("record + get round-trip", async () => {
    await recordSponsorActivation(sample);
    const fetched = await getSponsorBySessionId(sample.sessionId);
    expect(fetched?.brand).toBe("Acme Travel");
    expect(fetched?.status).toBe("pending_review");
  });

  it("updateSponsorStatus pending → active", async () => {
    await recordSponsorActivation(sample);
    const ok = await updateSponsorStatus(sample.sessionId, "active");
    expect(ok).toBe(true);
    const after = await getSponsorBySessionId(sample.sessionId);
    expect(after?.status).toBe("active");
  });

  it("getActiveSponsors filtra pending_review + expirados", async () => {
    await recordSponsorActivation(sample); // pending_review
    let actives = await getActiveSponsors();
    expect(actives.length).toBe(0);

    await updateSponsorStatus(sample.sessionId, "active");
    actives = await getActiveSponsors();
    expect(actives.length).toBe(1);

    // Forzar expiración
    const expired: SponsorActive = {
      ...sample,
      sessionId: "cs_expired",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      status: "active",
    };
    await recordSponsorActivation(expired);
    actives = await getActiveSponsors();
    expect(actives.length).toBe(1); // expired sigue NO incluido
  });

  it("deleteSponsor remove from KV", async () => {
    await recordSponsorActivation(sample);
    await deleteSponsor(sample.sessionId);
    const after = await getSponsorBySessionId(sample.sessionId);
    expect(after).toBeNull();
  });

  it("incrementSponsorClicks acumula", async () => {
    await incrementSponsorClicks("cs_x");
    await incrementSponsorClicks("cs_x");
    await incrementSponsorClicks("cs_x");
    const stats = await getSponsorStats("cs_x");
    expect(stats.clicks).toBe(3);
  });
});

describe("pickSponsorForSlot", () => {
  it("devuelve null si lista vacía", () => {
    expect(pickSponsorForSlot([], "any_slot")).toBeNull();
  });

  it("deterministic: mismo slotId → mismo sponsor", () => {
    const a: SponsorActive = {
      sessionId: "cs_a",
      tier: "inline",
      brand: "A",
      url: "https://a.com",
      contactEmail: "a@a.com",
      activatedAt: "2026-01-01",
      expiresAt: "2027-01-01",
      status: "active",
    };
    const b: SponsorActive = { ...a, sessionId: "cs_b", brand: "B" };
    const c: SponsorActive = { ...a, sessionId: "cs_c", brand: "C" };
    const picks = [a, b, c];
    expect(pickSponsorForSlot(picks, "slot_x")?.brand).toBe(
      pickSponsorForSlot(picks, "slot_x")?.brand,
    );
  });

  it("distribuye entre slots distintos", () => {
    const sponsors: SponsorActive[] = Array.from({ length: 3 }, (_, i) => ({
      sessionId: `cs_${i}`,
      tier: "inline",
      brand: `Brand ${i}`,
      url: "https://x.com",
      contactEmail: "x@x.com",
      activatedAt: "2026-01-01",
      expiresAt: "2027-01-01",
      status: "active",
    }));
    const picks = new Set<string | undefined>();
    for (const slot of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      picks.add(pickSponsorForSlot(sponsors, slot)?.brand);
    }
    // Al menos 2 brands distintas en 8 slots
    expect(picks.size).toBeGreaterThanOrEqual(2);
  });
});

describe("toSponsorPublic", () => {
  it("strips contactEmail (PII)", () => {
    const s: SponsorActive = {
      sessionId: "cs_x",
      tier: "inline",
      brand: "X",
      url: "https://x.com",
      contactEmail: "secret@x.com",
      activatedAt: "2026-01-01",
      expiresAt: "2027-01-01",
      status: "active",
    };
    const pub = toSponsorPublic(s);
    expect((pub as Record<string, unknown>).contactEmail).toBeUndefined();
    expect((pub as Record<string, unknown>).brand).toBe("X");
  });
});
