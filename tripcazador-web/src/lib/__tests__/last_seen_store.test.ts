/**
 * last_seen_store.test.ts — SSS322
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  recordLastSeen,
  getLastSeen,
  qualifiesForWinback,
  WINBACK_CUTOFF_MS,
  _clearStore,
} from "../last_seen_store";

const CUST = "cus_TEST00000001";

describe("last_seen_store SSS322", () => {
  beforeEach(() => _clearStore());

  it("recordLastSeen + getLastSeen round-trip", async () => {
    const ts = Date.now();
    await recordLastSeen(CUST, ts);
    const got = await getLastSeen(CUST);
    expect(got).toBe(ts);
  });

  it("getLastSeen devuelve null si no existe", async () => {
    expect(await getLastSeen("cus_NEVER0000001")).toBeNull();
  });

  it("recordLastSeen no-op si customerId vacío", async () => {
    await recordLastSeen("", Date.now());
    // no debería tirar
    expect(await getLastSeen("")).toBeNull();
  });
});

describe("qualifiesForWinback SSS322", () => {
  const NOW = new Date("2026-05-19T12:00:00Z").getTime();
  const REF = NOW - 90 * 86_400_000; // creó alert hace 90d

  it("true si last_seen >14d ago", () => {
    expect(qualifiesForWinback(NOW - 20 * 86_400_000, REF, NOW)).toBe(true);
  });

  it("false si last_seen reciente (<14d)", () => {
    expect(qualifiesForWinback(NOW - 5 * 86_400_000, REF, NOW)).toBe(false);
  });

  it("true cuando last_seen es null y referenceTs >14d (nunca hizo heartbeat)", () => {
    expect(qualifiesForWinback(null, REF, NOW)).toBe(true);
  });

  it("false cuando last_seen=null y referenceTs es reciente (alerta recién creada)", () => {
    expect(qualifiesForWinback(null, NOW - 2 * 86_400_000, NOW)).toBe(false);
  });

  it("boundary: exactamente 14 días → true", () => {
    expect(qualifiesForWinback(NOW - WINBACK_CUTOFF_MS, REF, NOW)).toBe(true);
  });

  it("false si last_seen es en el futuro (sanity)", () => {
    expect(qualifiesForWinback(NOW + 1000, REF, NOW)).toBe(false);
  });
});
